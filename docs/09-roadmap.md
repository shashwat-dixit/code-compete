# 09 — Roadmap

Work is ordered so each phase is **playable**. You implement feature PRs; this agent reviews them against `docs/`. Phase 0–1 are in this branch (docs + skeleton).

## Phase 0 — Decisions — done

Locked in [12](./12-decisions.md).

## Phase 1 — Skeleton — this PR

- Go module + `apps/api` `GET /healthz`
- Worker binaries that compile and exit (no Streams yet)
- Web router shell (landing, login, compete, rankings, match stub)
- Compose for postgres + redis
- CI: Go test/build + web lint/build
- `packages/contracts` stub
- `.env.example`

**Success:** `GET /healthz` returns 200; `docker compose` starts postgres+redis; web builds in CI.

## Phase 2 — Identity (your PRs)

- GitHub OAuth in the Go API, httpOnly session cookie ([12](./12-decisions.md))
- `users` + `auth_identities` migrations
- `/me`, protected routes
- Web login/logout

**Success:** two browsers, two accounts.

## Phase 3 — Problems and judge (your PRs)

Follow [13](./13-judge-runner.md). Split PRs: Python sandbox → network/TLE proofs → C++/Go/Java.

**Success:** two-sum judged locally; `curl` in user code fails.

## Phase 4 — Duel match

- Queue + pair
- State machine
- WS snapshot + board (tests passed + typing/thinking)
- First AC wins; timer → most tests passed
- Results screen

**Success:** two users play a full match.

## Phase 5 — Ratings and leaderboard

- ELO worker
- `rating_history`
- Global leaderboard
- Profile stub

## Phase 6 — Hardening

- Rate limits, payload caps, idempotent workers, disconnect rules, judge metrics, leak tests

## Phase 7 — V1 product

- Private rooms (invite code, [14](./14-private-rooms-and-br.md))
- Run samples vs submit hidden
- C++ / Go / Java if not already in
- Deploy to AWS (one region)
- Match history

## Phase 8+ — Parked

1. Battle Royale (rules already in [14](./14-private-rooms-and-br.md))
2. Replays
3. VS Code extension
4. Spectator
5. No-paste / plagiarism
6. gVisor/Firecracker
7. Kafka if Redis Streams hurts
8. Tournaments / cash pool

## Your next PRs after this lands

Keep them small:

1. Auth (GitHub OAuth)
2. Problem fixtures + Python runner harness
3. Match loop
4. Web match UI + Monaco
5. ELO + leaderboard

Do not mix OAuth, Docker judge, and Monaco in one PR.

## Mapping old GitHub issues

| Issue | Phase |
| --- | --- |
| #3 containerize | 1 (partial), 3 (sandbox), 7 (deploy) |
| #2 coding UI | 4–7 |
| #4 landing metrics | later |
| #6 caching | Redis is already in the design |
| #5 multi-region AWS | not scheduled |
| #8 Magic UI | 7 landing |
| #7 no paste / cash | 8+ |
| #9 CRDT BR | not doing CRDT; BR is round elimination |
