# 12 — Locked decisions

Recorded 2026-08-18 from the product/stack discussion. Update this file when a decision changes. Open leftovers are at the bottom.

## How we work

| Topic | Decision |
| --- | --- |
| Implementation | **You write the PRs.** This agent reviews them against `docs/`, especially `10-pr-review-checklist.md`. |
| Agent scaffolding | **Phase 1 skeleton only** (folders, `healthz`, compose, CI, router shell). No auth, judge, match loop, editor, or “helper” layers. |
| After docs | README matches the locked stack, and the skeleton is in the repo. |

## Stack

| Topic | Decision |
| --- | --- |
| Frontend | Keep **Vite + React 19 + TypeScript + Tailwind 4 + Zustand + React Router 7** in `apps/web`. Package manager: **Bun** (existing lockfile). |
| API + workers | **Go**, one module `github.com/shashwat-dixit/code-compete`. |
| Event bus | **Redis Streams** now. Kafka/Redpanda only if Streams actually hurts. |
| State | **Redis** (match, board, rate limits, pub/sub fanout). |
| Persistence | **PostgreSQL**. |
| HTTP | stdlib `net/http` to start; **chi** is allowed later if routing gets noisy. Do not add Gin/Fiber unless we revisit this file. |
| SQL | **pgx + sqlc** when persistence lands. No GORM/Prisma. |
| Contracts | OpenAPI (REST) + JSON Schema (WS/events) in `packages/contracts`. Hand-written types are OK until the first real endpoint. |
| Auth | **OAuth 2.0 in the Go API** (GitHub first). Not Better Auth, not Clerk. See [Auth](#auth). |
| Judge | **Custom Docker runner**, Judge0-shaped internally. You build it. Spec: [13 Judge runner](./13-judge-runner.md). |
| Languages (product) | **Python, C++, Go, Java.** Ship Python in the runner first, then the other three before public V1. |
| First deploy | **AWS** (single region). Not VPS, not multi-region. |
| Analytics | None for MVP. |

## Product

| Topic | Decision |
| --- | --- |
| First mode | **Rated 1v1 duel.** |
| Private rooms | **After 1v1 works.** Invite code + link — **not RAG**. Spec: [14 Private rooms and battle royale](./14-private-rooms-and-br.md). |
| Battle Royale | **Later.** Rules are now specified in that same doc. Last successful submitter of a round is eliminated; play down to a podium of 3; rank those 3 by **median AC time**. |
| Presence | **Progress + typing activity.** Tests passed for everyone. Side bar: WPM while typing, 🧠 thinking when idle. **No live source, no CRDT.** |
| Timer, nobody AC | **Most tests passed wins** (and gets ELO in a rated duel). Tie: see leftovers. |
| Practice catalog | Not in MVP. Problems exist to be played in matches. |
| No-paste | Not a V1 requirement. |

## Auth

Better Auth is a TypeScript library that wants a Node/TS server (Next, Hono, etc.). Our API is Go. Putting Better Auth in front would mean a **second runtime**, a session-sharing boundary, and more ways to get cookie/CORS wrong.

Locked approach (boring on purpose):

1. GitHub OAuth 2.0 **authorization code** with **PKCE** and a server-side `state` parameter.
2. Go exchanges the code (`golang.org/x/oauth2`).
3. Upsert `users` + `auth_identities`.
4. Session is an **httpOnly, Secure, SameSite=Lax** cookie (opaque session id or a short-lived JWT in the cookie — pick one in the auth PR, not both).
5. **Do not** put access tokens in `localStorage`.
6. WebSocket auth uses the same cookie (same origin) or a one-time short-lived ticket, never a long-lived query-string token.

Google (or a second provider) can be added as another `auth_identities` row later. Email/password is out until someone asks again.

## Leftovers (small, not blocking skeleton)

- OAuth: GitHub only vs GitHub+Google in the first auth PR
- 1v1 timer tie on **equal** tests passed: draw vs earlier last-submit
- BR: exact round timer; what if fewer than two players AC; disconnects
- AWS shape: one EC2 + compose vs ECS Fargate (decide in the first deploy PR, not now)
- chi vs stdlib for the API (stdlib until it hurts)
- Monaco vs CodeMirror (still **Monaco** unless you change it)
