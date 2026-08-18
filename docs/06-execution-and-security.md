# 06 — Execution and security

Untrusted code execution is the highest-risk part of this product. If the judge is weak, the rest of the app does not matter.

**The sandbox is [gobox](https://github.com/shashwat-dixit/gobox).** This doc is still the security contract. Do not reimplement execution in `apps/worker-runner`.

## Principles

1. The API process **never** compiles or runs user code.
2. The runner treats every submission as hostile.
3. Network is off. Filesystem is minimal. CPU, memory, PIDs, and wall time are capped.
4. Hidden tests never leave the judge.
5. Authz is checked on every submit (must be a player in an `RUNNING` match).

## Runner interface (language-agnostic)

```text
Run(ctx, Submission) → Result

Submission: language, source, stdin fixtures, time_limit_ms, memory_limit_mb
Result:     status, runtime_ms, memory_kb, passed, total, compile_log?, first_fail_index?
```

Implementations can change (Docker → gVisor → Firecracker) without changing workers above it.

## MVP sandbox (Docker)

Per submission:

- Fresh container from a **locked** image (`python:3.12-alpine` or a custom image with compilers)
- Drop all capabilities, no privilege, read-only root FS, tmpfs for `/tmp` and workdir
- `--network=none`
- `pids-limit`, `memory`, `cpus`, `ulimit`
- Wall-clock timeout slightly above problem `time_limit_ms` (to catch hung processes)
- Run as non-root user
- Mount only the source file and the test runner, not the repo or Docker socket

Do **not** bind-mount the host Docker socket into the sandbox. Do **not** run `docker build` per submission.

Kill the container after the result is collected. Disk growth from leftover containers is a production outage waiting to happen.

### Languages (product set)

Python, C++, Go, Java. Implement **Python first** in gobox, then the other three. One worker pool, `language` field. Spec: [13](./13-judge-runner.md). Checklist: [gobox README](https://github.com/shashwat-dixit/gobox).

## What we will not do

- **LeetCode GraphQL** as a judge or problem source (old README). Legal and operational trap.
- **Judge0 public instance** (or self-hosted Judge0) for production. We build our own runner in gobox.
- **eval in the API process** (Python `exec`, Node `vm`, etc.)

## AuthN / AuthZ

- HTTPS in production
- JWT (short-lived access + rotating refresh, or server session)
- WS must authenticate on connect, not with a query-string token that ends up in logs **if we can avoid it**; if we must use `?token=` for browsers, keep tokens short-lived
- `submit` authorized only if `match_players` contains the user and status is `RUNNING`
- Admin/problem-author routes separate from player routes

## Rate limits (Redis)

| Action | Suggested start |
| --- | --- |
| Login / OAuth callback | 10 / min / IP |
| Enqueue matchmaking | 5 / min / user |
| Submit | 1 in-flight + 12 / min / user |
| WS connect | 10 / min / user |

Return `429` with `Retry-After`.

## Anti-cheat (layered, mostly later)

Issue #7 “no copy paste” is a **product** choice, not security. It is trivial to bypass (another editor, OCR, a second machine). If we do it:

- Disable paste in Monaco as a **sportsmanship** setting for rated matches
- Never claim it is cheat-proof

Actual useful controls, in order:

1. Sandbox (above)
2. Hidden tests + no leakage
3. Server-side timing (client clock is a lie)
4. Submission cooldowns
5. Later: plagiarism on source after the match (Moss / token hashing)
6. Later: heuristics (solve in 8s on a Hard)

CRDT live-sharing of opponent code **hurts** integrity. Do not add it to rated matches.

## Secrets and config

- `.env` gitignored (already). Commit `.env.example` only.
- Never log JWTs, OAuth codes, or submission source at `info` in production (source can contain secrets users pasted by accident).
- Judge containers must not receive `DATABASE_URL`, AWS keys, or the API’s JWT secret. Pass only what gobox needs.

## Threat notes for PR review

Call out as **blockers**:

- User code can reach the network or cloud metadata
- Docker socket or host FS reachable from submission
- Hidden tests returned on any public endpoint or WS event
- IDOR: submit/view another match’s hidden data by guessing UUIDs
- Unbounded `code` payload (multi-MB source) without a size cap
- Regex / catastrophic backtracking in validators
- WS without auth
- SQL string concat

Call out as **should-fix**:

- Missing rate limits
- Overly long JWT TTL
- Verbose compiler errors that include sandbox paths
- No timeout on outbound HTTP (OAuth)

## Observability for the judge

Track at least:

- Queue wait time (`queued_at` → `started_at`)
- Execution wall time
- Status counts (AC/WA/TLE/RE/CE)
- Container start failures
- Worker retry count

These are how we will catch a wedged Docker daemon before users do.
