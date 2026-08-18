# 13 — Custom judge runner (Judge0-shaped)

**Implementation lives in [gobox](https://github.com/shashwat-dixit/gobox), not in this repo.** Build it by hand there; that README is the checklist. This doc is the **product contract** Code Compete expects so PRs (here and in gobox) can be reviewed against it.

Do **not** vendor Judge0, host Judge0, call the public Judge0 API, or scrape LeetCode. `apps/worker-runner` here stays a thin adapter (load submission/tests → call gobox → publish `execution.completed`). Sandbox images, Docker flags, compile/run, and isolation proofs do not land under `apps/worker-runner` or `internal/judge`.

Goal: an internal runner that **feels like Judge0 to the rest of our system** (async submit → token → poll/callback → statuses → per-language compile/run with CPU/wall/memory limits) while using **Docker** as the isolation layer instead of Judge0’s Isolate-in-privileged-container setup.

## What Judge0 actually is

Judge0 CE (v1.13.x) is roughly:

```text
HTTP JSON API  →  Postgres row + queue (Resque)  →  worker
                                                      │
                                                      ├─ compile in Isolate sandbox
                                                      └─ run with stdin, capture stdout/stderr/time/memory
```

Important pieces to copy **as behavior**, not as Ruby:

| Judge0 idea | We do |
| --- | --- |
| `POST /submissions` returns a token immediately | `submission.queued` on Redis Streams; Postgres row `QUEUED` |
| `GET /submissions/{token}` | Our API already has the row; WS pushes `submission.updated` |
| `wait=true` on POST | **Do not offer this** on the public API (holds HTTP workers hostage) |
| Status id + description | Same vocabulary, our enum names |
| `cpu_time_limit` vs `wall_time_limit` | Both. CPU for fairness, wall as a hang watchdog (sleep/network) |
| `memory_limit` (KB) | Docker `memory` + reject MLE |
| `source_code` + `language_id` + `stdin` | Source + language key + **one stdin per test** |
| `expected_output` | Compared **inside gobox**, never returned for hidden tests |
| `compile_output` / `stderr` / `message` | Persist; strip sandbox paths before sending to clients |
| Languages table with compile/run commands | gobox language table (or YAML) — four languages |
| Isolate (namespaces, cgroups, seccomp) | Docker: `--network=none`, dropped caps, read-only root, pid/memory/CPU limits, non-root |
| Privileged host so Isolate can mount cgroups | **Do not run privileged.** That is how Judge0 sandbox escapes happen. |
| 60+ languages | Four: Python, C++, Go, Java |
| Callbacks / webhooks | Redis Stream `execution.completed` is our callback |
| Base64 source | Optional later; JSON UTF-8 is enough |

Judge0 is GPL-3. Do not copy their source. Copy the **product contract** (statuses, limits, async token).

## Where it sits

```text
API  --(Redis Stream submission.queued)-->  worker-runner (this repo, adapter)
                                                    │
                                                    │ gobox Run() / localhost HTTP
                                                    ▼
                                             gobox (other repo)
                                                    │
                                                    │ docker run --network=none ...
                                                    ▼
                                             sandbox container
                                                    │
worker-runner --(Redis Stream execution.completed)--> worker-resolver
```

gobox is the sandbox. It may be a **library or an internal HTTP service**, not a public HTTP Judge0 clone. A tiny debug API (`POST /internal/run`) must bind to localhost and never be exposed. `wait=true` on POST is still forbidden on anything the API workers call.

## Statuses (keep Judge0’s meanings)

Map our enum to Judge0 ids so debugging is familiar:

| id | Judge0 | Ours |
| --- | --- | --- |
| 1 | In Queue | `QUEUED` |
| 2 | Processing | `RUNNING` |
| 3 | Accepted | `ACCEPTED` |
| 4 | Wrong Answer | `WRONG_ANSWER` |
| 5 | Time Limit Exceeded | `TIME_LIMIT_EXCEEDED` |
| 6 | Compilation Error | `COMPILATION_ERROR` |
| 7–12 | Runtime Error (signal / NZEC / other) | `RUNTIME_ERROR` (+ optional `signal`) |
| — | (Judge0 has no MLE status; they often surface as RE/TLE) | `MEMORY_LIMIT_EXCEEDED` |
| 13 | Internal Error | `INTERNAL_ERROR` |
| 14 | Exec Format Error | `INTERNAL_ERROR` or `RUNTIME_ERROR` |

A **problem submission** is many Judge0-style runs (one per test). Aggregate:

1. Compile once (if compiled language). CE → stop.
2. Run tests in order. First failing test sets the submission status (WA/TLE/MLE/RE). Remaining tests may be skipped.
3. All pass → `ACCEPTED`.
4. Report `passed_tests` / `total_tests` for the live board (this is what opponents see).

## Language config (Judge0-style commands)

Pinned images, no `latest` in production. Commands run **inside** the sandbox as user `coder`.

| key | image (starting point) | compile | run |
| --- | --- | --- | --- |
| `python` | `python:3.12-alpine` | none | `python3 main.py` |
| `cpp` | `gcc:14` (or a slim custom image) | `g++ -std=c++17 -O2 -o main main.cpp` | `./main` |
| `go` | `golang:1.22-alpine` | `go build -o main main.go` | `./main` |
| `java` | `eclipse-temurin:17-jdk` | `javac Main.java` | `java -Xmx{mem}m Main` |

Source filenames are fixed (`main.py`, `main.cpp`, `main.go`, `Main.java`) so we never interpolate user paths into a shell.

**Do not** pass user compiler flags from the client in V1.

Java is slow to start. Budget a higher wall-time for JVM warmup or use a fatter memory limit (512MB class). Document the limits per language in the problem row overrides.

## Execution pipeline (per submission)

**code-compete `worker-runner` (adapter):**

1. Load submission + problem tests (samples + hidden) from Postgres. Adapter uses a DB role that can read tests; the **API role must not** select hidden tests for player queries.
2. Dedupe on `submission_id` (Redis `SETNX exec:dedupe:{id}`). If a result already exists, republish it and stop.
3. Call gobox with language, source, tests, limits. Hidden fixtures stay on this hop; they must not appear in `execution.completed` or WS.
4. Publish `execution.completed` with aggregate status.

**gobox:**

1. Write source to a temp dir on the **gobox host** (not in git, mode 0700).
2. **Compile** (if needed) in a container with network off. Capture `compile_output`. Non-zero → `COMPILATION_ERROR`.
3. For each test:
   - Start container with stdin piped, stdout/stderr capped (e.g. 1MB each).
   - `cpu_time_limit` = problem `time_limit_ms`.
   - `wall_time_limit` ≈ 2–3× CPU limit (or +2s), so `sleep 100` dies.
   - Memory: problem `memory_limit_mb`.
   - Compare stdout to expected with **normalized newlines**, strip trailing spaces per line (classic CP). Do not trim interior spaces unless the problem says so.
   - Record per-test `passed`, `time`, `memory`, `status`.
4. Tear down containers (`docker rm -f`) in a `defer`. Temp dir deleted.

## Docker flags (minimum)

```text
docker run --rm \
  --network=none \
  --read-only \
  --tmpfs /tmp:rw,noexec,nosuid,size=64m \
  --tmpfs /work:rw,noexec,nosuid,size=64m \
  --workdir /work \
  --user 1000:1000 \
  --cap-drop ALL \
  --security-opt no-new-privileges \
  --pids-limit 64 \
  --memory <mb>m --memory-swap <mb>m \
  --cpus 1 \
  --ulimit nproc=64 \
  <image> <run command>
```

- **`--noexec` on tmpfs** will break compilers that write executables to `/tmp`. For compile steps, use `tmpfs` **without** `noexec` on `/work` only, still `nosuid,nodev`.
- Never mount `/var/run/docker.sock` into the **sandbox**.
- **gobox** may talk to the host Docker socket (it is trusted). Treat that as a reviewed exception in the gobox PR. The code-compete adapter should not need the socket.
- No `--privileged`, no `--pid=host`, no `--volume /`.

## Internal contract (worker message)

`submission.queued` v1:

```json
{
  "v": 1,
  "submission_id": "uuid",
  "language": "python",
  "time_limit_ms": 2000,
  "memory_limit_mb": 256
}
```

Source and tests are **not** in the stream (size + leak). The runner loads them by `submission_id`.

`execution.completed` v1:

```json
{
  "v": 1,
  "submission_id": "uuid",
  "status": "WRONG_ANSWER",
  "passed_tests": 3,
  "total_tests": 10,
  "runtime_ms": 41,
  "memory_kb": 12000,
  "first_fail_index": 4,
  "compile_output": null
}
```

No hidden fixtures in this payload.

## Local vs AWS

| Env | How gobox talks to Docker |
| --- | --- |
| Dev | Compose postgres+redis in this repo; **gobox on the host** so it can use the host Docker engine. |
| AWS (later) | gobox on EC2/ECS with Docker or a dedicated “judge” instance. Still no privileged Judge0 clone. gVisor (`runsc`) is a later hardening PR. |

## Build order (implement in gobox)

Checklist: [gobox README](https://github.com/shashwat-dixit/gobox). Short version:

1. Language table + `python` only, stdin/stdout compare, no match system (harness CLI is fine).
2. Network-off proof: a program that calls `socket` / `curl` must fail.
3. TLE proof: `while True: pass` → TLE, container gone.
4. C++, then Go, then Java.
5. Internal API, then code-compete `worker-runner` adapter + resolver hook.

Do not start 2–5 in the same PR as 1. Do not put sandbox code in this repo.

## Review blockers specific to this component

See also `docs/10-pr-review-checklist.md`.

- Privileged containers or Docker socket inside the sandbox
- User-controlled strings interpolated into a shell
- Hidden tests on a stream/WS payload
- Missing wall-time limit (CPU-only limits miss `sleep`)
- Containers left running after errors
- Pulling images on the hot path (`docker pull` per submit)
