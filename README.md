# Code Compete

TypeRacer for algorithm problems: same problem, live 1v1, first accepted submission wins, ELO persists, untrusted code runs in a Docker sandbox.

**Spec:** [`docs/`](./docs/README.md) · **Decisions:** [`docs/12-decisions.md`](./docs/12-decisions.md) · **PR review:** [`docs/10-pr-review-checklist.md`](./docs/10-pr-review-checklist.md)

You implement feature PRs. Reviews are against those docs. This repo only scaffolds the skeleton (healthz, compose, router shell, CI).

## Stack (locked)

| Piece | Choice |
| --- | --- |
| Web | Vite, React 19, TypeScript, Tailwind 4, Zustand, React Router 7, Bun |
| API + workers | Go |
| Events | Redis Streams |
| Live state | Redis |
| Persistence | PostgreSQL |
| Auth | GitHub OAuth in the Go API (httpOnly cookie) — not Better Auth |
| Judge | Custom Docker runner, Judge0-shaped ([spec](./docs/13-judge-runner.md)) |
| Languages | Python, C++, Go, Java (Python first) |
| Deploy | AWS, one region |

## Repo layout

```
apps/api                 Go HTTP + WebSocket (GET /healthz today)
apps/worker-runner       Code execution worker (stub)
apps/worker-resolver     Match resolution worker (stub)
apps/worker-elo          ELO worker (stub)
apps/web                 React SPA
internal/                Shared Go (config today)
packages/contracts       OpenAPI + event schemas
infra/docker             Compose: Postgres + Redis
infra/db/migrations      SQL migrations (empty until auth/problems)
docs/                    Product + architecture spec
```

## Local development

```bash
cp .env.example .env
docker compose -f infra/docker/docker-compose.yml up -d
make api          # http://localhost:8080/healthz
make web          # http://localhost:5173
```

Requires Docker, Go 1.22+, Bun.

Workers are stubs; they compile and do nothing until you wire Streams.

## What to build next

See [`docs/09-roadmap.md`](./docs/09-roadmap.md). Next useful PRs: GitHub OAuth, then the Python sandbox harness, then the 1v1 match loop.

Battle Royale, private rooms, and the VS Code extension wait until 1v1 is playable. Room invites are a **short code**, not RAG — [`docs/14-private-rooms-and-br.md`](./docs/14-private-rooms-and-br.md).
