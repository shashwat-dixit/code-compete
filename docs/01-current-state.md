# 01 — Current state

Snapshot of the repository as of the scoping pass (August 2026). Use this as the baseline before any cleanup of `main`.

## What `main` actually contains

Almost nothing of the product exists as code. `main` is a **coming-soon Vite app** plus a detailed README that describes a system that has not been built.

```
code-compete/
├── README.md                 # Target architecture and feature checklist (all unchecked)
├── .gitignore                # Already assumes Go, Docker, Kafka, Redis, Terraform
├── apps/web/                 # Vite + React 19 + TS + Tailwind 4 + Zustand + React Router
│   └── src/App.tsx           # Renders "Code Compete — Coming Soon"
└── infra/docker/             # Empty docker-compose.yml (placeholder)
```

Missing relative to the README's claimed monorepo:

- `apps/api`, `apps/worker-runner`, `apps/worker-resolver`, `apps/worker-elo`
- `packages/contracts`, `packages/config`, `packages/utils`, `packages/observability`
- `infra/db`, `infra/terraform`
- `scripts/`
- CI, Dockerfiles with real services, migrations, tests

### Frontend packages already chosen (not wired up)

`apps/web/package.json` already includes:

- React 19 + Vite (rolldown-vite) + SWC
- TypeScript
- Tailwind CSS 4 (`@tailwindcss/vite`)
- `react-router` v7
- Zustand

There is **no** Monaco/CodeMirror editor, no auth SDK, no WebSocket client, no API client, no real routes. `react-router` is a dependency but `main.tsx` still mounts `App` directly.

Package manager on disk is **Bun** (`bun.lock`).

## Git history that matters

The project has been restarted several times. Useful archaeology:

| Era | Approx. | Stack | What existed | Why it matters now |
| --- | --- | --- | --- | --- |
| v1 “LeetCode clone + live lobbies” | late 2024 | Express, Prisma, Postgres, Socket.IO, React+Vite, shadcn, Clerk, AWS S3/SQS/ECS | Prisma schema, seed data, placeholder pages (Home, Compete, Problems, Rankings, Login, Profile), CDK for per-language Fargate workers | Best **domain model** we have. Schema was problem/submission-centric, not match-centric. |
| Cleanup / restart | 2025-08 | Python FastAPI + SQLModel + Next.js, then a VS Code extension scaffold | Hello-world API, broken/incomplete SQLModel, default VSC “Hello World” | Confirms VS Code is a real goal, but there is no product code to reuse. |
| v2 “event-driven Go platform” | 2025-12 | README rewrite to Go + Kafka + Redis + workers; Vite coming-soon UI | Current `main` README and frontend stub | This is the **stated target**. |
| `origin/rebuild` | 2025-12 | Go module + empty packages | `apps/api`, `apps/worker/{elo,resolver,runner}`, redis/db stubs, `confluent-kafka-go`, `go-redis`, `gorilla/websocket`, PostHog | Closest to the README layout, but files are empty (`package api` / `package runner` only). **Not on `main`.** |

Live site listed on GitHub: `https://codecompete.shashwatdixit.dev` (coming-soon frontend).

## Open GitHub issues (not implemented)

| # | Title | Notes |
| --- | --- | --- |
| 1 | Features to implement | Landing page + links to #2–#6 |
| 2 | Good coding UI | Empty body |
| 3 | Containerize everything | Empty body |
| 4 | User metrics on landing page | Empty body |
| 5 | Deploy on AWS, all regions | Empty body; conflicts with README “VPS” |
| 6 | Caching strategy | Empty body |
| 7 | Features | “No copy paste”; “Contest can have cash pool” |
| 8 | New frontend using Magic UI | Empty body |
| 9 | CRDT for battle royale | Links [Figma multiplayer](https://www.figma.com/blog/how-figmas-multiplayer-technology-works/) |

These issues mix **MVP**, **polish**, and **very late-stage** ideas. Do not implement them in the order they were filed.

## Honest assessment

Code Compete today is a **product spec in a README**, a **coming-soon page**, and a **graveyard of three stacks**. The interesting remaining assets are:

1. A clear product metaphor (TypeRacer × competitive programming)
2. A recovered Postgres model for users / questions / submissions
3. A proposed event-driven Go architecture
4. Early frontend routing IA (Compete, Problems, Rankings, Profile)

Everything else — match loop, judge, matchmaking, realtime, auth, infra — still has to be designed and built.
