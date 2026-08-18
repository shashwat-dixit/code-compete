# 09 — Roadmap

Work is ordered so each phase is **playable**. PRs should map to the slices below. Do not start phase N+1 while N’s success check fails.

Phase 0 is **docs + stack decisions only**. No framework scaffolding on `main` until [open questions](./11-open-questions.md) are answered.

## Phase 0 — Align and clean `main`

**Goal:** a repo we are willing to build in.

- Answer open questions (stack, bus, auth, hosting, languages)
- Point README at `docs/`
- Decide monorepo layout (`apps/worker-runner` vs `apps/worker/runner`)
- Add `.env.example`, license if desired (MIT existed in v1)
- Close or retitle GitHub issues that contradict the MVP

**Success:** written decisions in `docs/03` / `docs/11`; `main` still not a half-stack.

## Phase 1 — Skeleton

**Goal:** empty services that compile and boot against compose postgres+redis.

- Go module + `apps/api` hello + healthz
- Web: real router shell (landing, login stub, compete stub)
- Compose for postgres + redis
- CI lint/test/build
- Shared contracts package (empty OpenAPI/JSON Schema)

**Success:** `healthz` returns 200; web builds in CI.

## Phase 2 — Identity

- OAuth (or chosen auth)
- `users` + `auth_identities` migrations
- Session/JWT
- `/me`, protected routes
- Web login/logout

**Success:** two browsers, two accounts.

## Phase 3 — Problems and judge (offline)

This is the first **hard** slice.

- `problems` + `problem_tests` (start with 3–5 hand-written problems in git)
- Submit endpoint **without** matches (internal/dev harness is OK)
- Runner sandbox with network off + limits
- Python (or chosen language) AC/WA/TLE/CE
- Results persisted

**Success:** `echo`/`two-sum` style problem judged correctly locally; a malicious `curl` in user code fails.

## Phase 4 — Duel match

- `matches` + `match_players`
- Queue + pair
- State machine WAITING → COUNTDOWN → RUNNING → FINISHED
- WS snapshot + board updates
- Submit path tied to running match
- Resolver applies first AC as winner
- Results screen

**Success:** two users play a full match.

## Phase 5 — Ratings and leaderboard

- ELO worker (or in-process on finish if we still only have one box)
- `rating_history`
- Global leaderboard
- Profile stub with recent matches

**Success:** two matches change ratings in the expected direction.

## Phase 6 — Hardening

- Rate limits
- Payload size caps
- Idempotent workers
- Disconnect/forfeit rules
- Structured logs + judge metrics
- Hidden-test leak tests
- Load-ish test: 20 fake submits

**Success:** checklist in [PR review](./10-pr-review-checklist.md) is green for the match path.

## Phase 7 — V1 product

- Private rooms
- Run samples vs submit hidden
- Markdown problem statements look good
- Landing page (Magic UI optional)
- Deploy to chosen host
- Match history

## Phase 8+ — Parked

Only after a public 1v1 works:

1. Second language
2. Battle Royale (after written rules)
3. Replays
4. VS Code extension
5. Spectator
6. Plagiarism / no-paste as a setting
7. gVisor/Firecracker
8. Kafka if still on Redis Streams and actually hurting
9. Tournaments / cash pool

## Suggested first PRs (after phase 0)

Small enough to review:

1. Docs only (this PR)
2. Compose postgres+redis + `.env.example`
3. Go API `healthz` + CI
4. Web router shell (no match UI)
5. Auth
6. Problem fixtures + runner
7. Match loop
8. Web match UI + Monaco
9. ELO + leaderboard

If a PR mixes “add Kafka” with “add Monaco” with “add OAuth”, split it.

## Mapping old GitHub issues

| Issue | Phase |
| --- | --- |
| #3 containerize | 1 (partial), 3 (sandbox), 7 (deploy) |
| #2 coding UI | 4–7 |
| #4 landing metrics | 7+ |
| #6 caching | Redis is already in the design; extra cache later |
| #5 multi-region AWS | not scheduled |
| #8 Magic UI | 7 landing |
| #7 no paste / cash | 8+ |
| #9 CRDT BR | 8+, likely never for rated play |
