# Code Compete — Project Docs

This folder is the working spec for **Code Compete**: a real-time competitive coding platform inspired by TypeRacer, built for algorithmic problem solving.

It exists so we can:

- Agree on **what** to build before changing `main`
- Keep architecture, security, and product decisions in one place
- Review PRs against a shared checklist (correctness, missing pieces, performance, security)
- Build by hand in small PRs without losing the original vision

**Do not treat this as frozen.** When a decision is made, update the relevant doc and the [open questions](./11-open-questions.md) file in the same PR.

## How to use this folder

| If you are… | Start here |
| --- | --- |
| New to the repo / restarting the project | [01 Current state](./01-current-state.md) then [02 Product and scope](./02-product-and-scope.md) |
| Picking frameworks / infra | [03 Architecture](./03-architecture.md) and [11 Open questions](./11-open-questions.md) |
| Implementing a feature | [09 Roadmap](./09-roadmap.md) plus the domain docs for that slice |
| Opening or reviewing a PR | [10 PR review checklist](./10-pr-review-checklist.md) |

## Reading order

1. [Current state](./01-current-state.md) — what is actually in the repo today, and what previous attempts left behind
2. [Product and scope](./02-product-and-scope.md) — vision, MVP vs later, explicit non-goals
3. [Architecture](./03-architecture.md) — proposed components, stack options, recommended defaults
4. [Data model](./04-data-model.md) — entities, Postgres, Redis keys
5. [Match and realtime](./05-match-and-realtime.md) — state machine, matchmaking, WebSockets, events
6. [Execution and security](./06-execution-and-security.md) — judge, sandbox, auth, anti-cheat
7. [Frontend](./07-frontend.md) — screens, client architecture, editor
8. [Infra and devops](./08-infra-and-devops.md) — local compose, CI, deploy
9. [Roadmap](./09-roadmap.md) — PR-sized work packages
10. [PR review checklist](./10-pr-review-checklist.md) — how PRs will be reviewed
11. [Open questions](./11-open-questions.md) — decisions needed before changing `main`

Appendix: [recovered historical schema](./appendix-recovered-schema.md) from the 2024 Prisma/Express attempt.

## Ground rules for this restart

- **No stack lock-in on `main` until the questions in `11-open-questions.md` are answered.**
- The README architecture (Go + React/Vite + Kafka + Redis + Postgres) is the **starting proposal**, not a completed decision.
- Previous code (Express, FastAPI, Next.js, Clerk, AWS SQS/ECS) is **reference only**. Do not revive it wholesale.
- Prefer a working 1v1 match with a real judge over Battle Royale, replays, VS Code, or CRDT.
