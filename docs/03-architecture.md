# 03 — Architecture

Locked in [12 Decisions](./12-decisions.md). Older Kafka/VPS wording in git history is obsolete.

## Target shape

```
Browser / VS Code
        │  REST + WebSocket
        ▼
   API Gateway (Go)
        │
        ├── PostgreSQL     persistent users, problems, matches, ratings
        ├── Redis          match state, leaderboards, pub/sub, rate limits, Streams
        └── Redis Streams  async jobs
                │
                ├── worker-runner     thin adapter → gobox (Docker sandbox lives in gobox)
                ├── worker-resolver   apply execution results to match state
                └── worker-elo        rating updates after match finish
```

### Intended flow

1. Player joins match → API writes match state to Redis, persists stub to Postgres
2. Submit → API validates, rate-limits, publishes `SubmissionCreated` to the bus
3. Runner adapter consumes the event, calls [gobox](https://github.com/shashwat-dixit/gobox) to execute in a sandbox, publishes `ExecutionResult`
4. Resolver consumes result, updates Redis match state, maybe finishes the match
5. API fans out via Redis pub/sub → WebSocket clients
6. On `FINISHED`, ELO worker updates ratings and history in Postgres

## Why this shape is reasonable

- **Judge work is unsafe and slow.** It must be async and isolated from the API process.
- **Match state is hot and tiny.** Redis is a good live store; Postgres is the source of truth after the match.
- **Realtime fanout is a different problem from execution.** Keep WS in the API (or a dedicated gateway) and use pub/sub so workers never talk to sockets directly.
- **Go** fits long-lived WS, workers, and a small AWS footprint.

## Locked defaults

| Concern | Now | Later |
| --- | --- | --- |
| Event bus | Redis Streams | Kafka/Redpanda if Streams hurts |
| Match state | Redis hash + pub/sub | same |
| Persistence | Postgres | same |
| Judge isolation | Docker via [gobox](https://github.com/shashwat-dixit/gobox) (Judge0-shaped) | gVisor / Firecracker |
| API + workers | Separate Go binaries, one repo | more replicas |
| Deploy | AWS, one region | still not multi-region |

## Stack notes (historical options)

### Frontend

| Option | Fit | Notes |
| --- | --- | --- |
| **React + Vite (current `apps/web`)** | Best default | Already present: React 19, Tailwind 4, Zustand, React Router 7, Bun lockfile |
| Next.js | SSR/landing SEO | Tried in 2025; overkill for a WS-heavy app; auth/landing can still be static |
| Magic UI / shadcn | UI kit, not a framework | Use **on top of** Vite. Issue #8 is polish, not architecture |

**Recommendation:** keep Vite + React. Add shadcn/ui (used before) or Magic UI for the landing later. Use Monaco for the editor.

### Backend language / framework

| Option | Fit | Notes |
| --- | --- | --- |
| **Go (chi/echo/stdlib + gorilla WS)** | Matches README + `rebuild` branch | `rebuild` already pulled `go-redis`, `gorilla/websocket`, `confluent-kafka-go` |
| FastAPI | Fast to write | Tried; abandoned. Fine for a judge prototype, weaker for WS+workers story |
| Express / Node | Fastest reuse of old Prisma | Abandoned; Socket.IO was never productized |

**Recommendation:** Go. Use `pgx` + `sqlc` (or a thin query layer), not a heavy ORM. One module `github.com/shashwat-dixit/code-compete` as on `rebuild`.

### Auth

| Option | Fit | Notes |
| --- | --- | --- |
| GitHub OAuth | Natural for a coding product | Simple, no password store |
| Clerk | Previous frontend choice | Fast, paid, vendor lock-in |
| Custom JWT + email/password | Full control | More work (reset, verification, bcrypt) |
| Better Auth / Auth.js | If we stay in Node or add a BFF | Awkward with a Go API |

**Locked:** GitHub OAuth in the Go API, session in an httpOnly cookie. Not Better Auth (TS server). Not Clerk. Details in [12](./12-decisions.md).

### Realtime

| Option | Fit | Notes |
| --- | --- | --- |
| Native WebSocket | Matches README | Use Redis pub/sub for multi-instance fanout |
| Socket.IO | Previous attempt | Extra protocol; only worth it if we stay on Node |

**Recommendation:** native WS. Define events in `packages/contracts`.

### Code execution

See [06](./06-execution-and-security.md) and [13](./13-judge-runner.md). Custom Docker runner in [gobox](https://github.com/shashwat-dixit/gobox), Judge0-shaped. No LeetCode, no hosted Judge0. This repo does not implement the sandbox.

### Observability

`rebuild` already depends on PostHog. Prometheus (README) and PostHog solve different things:

- Prometheus + structured logs: ops (latency, queue depth, error rates)
- PostHog: product analytics (funnels, landing metrics for issue #4)

**Locked:** slog JSON + request IDs. Prometheus later. No PostHog for MVP.

## Monorepo layout

```
code-compete/
├── apps/
│   ├── api/                 # HTTP + WS
│   ├── worker-runner/       # adapter to gobox; not the sandbox
│   ├── worker-resolver/
│   ├── worker-elo/
│   ├── web/                 # already exists
│   └── vscode/              # later
├── packages/
│   └── contracts/           # JSON schemas / protobuf / OpenAPI — language-agnostic
├── infra/
│   ├── docker/              # compose for postgres + redis (sandbox images live in gobox)
│   └── db/                  # SQL migrations
├── docs/                    # this folder
└── scripts/
```

Shared Go code can live in `internal/` at the repo root (idiomatic) instead of `packages/config` + `packages/utils`. Keep `packages/contracts` if we need TS + Go to share event shapes (OpenAPI + generated types, or JSON Schema).

**Locked:** one Go module at repo root, `internal/` for shared code, `packages/contracts` for API/WS/event schemas.

## Design principles

1. **Deterministic match state machine.** Same events in → same state out. Workers must be idempotent.
2. **API never executes user code.**
3. **Workers never push WebSockets.** They emit events; the API fans out.
4. **Redis is ephemeral.** A crash may drop an in-flight match; Postgres remains correct. Optionally rebuild live state from Postgres on recovery (V1, not MVP).
5. **Contracts before features.** Adding a WS event or stream payload without a schema is a review fail.
6. **Sandbox first, language second.** Python in a hard jail before C++/Go/Java.

See [12 Decisions](./12-decisions.md) for leftovers.
