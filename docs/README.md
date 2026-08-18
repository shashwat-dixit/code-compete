# Code Compete — Project Docs

This folder is the working spec for **Code Compete**: a real-time competitive coding platform inspired by TypeRacer, built for algorithmic problem solving.

It exists so we can:

- Agree on **what** to build before changing `main`
- Keep architecture, security, and product decisions in one place
- Review PRs against a shared checklist (correctness, missing pieces, performance, security)
- Build by hand in small PRs without losing the original vision

**Do not treat this as frozen.** When a decision is made, update the relevant doc and [12 Decisions](./12-decisions.md) in the same PR.

## How to use this folder

| If you are… | Start here |
| --- | --- |
| New to the repo / restarting the project | [01 Current state](./01-current-state.md) then [02 Product and scope](./02-product-and-scope.md) |
| Checking what we locked | [12 Decisions](./12-decisions.md) |
| Implementing a feature | [09 Roadmap](./09-roadmap.md) plus the domain docs for that slice |
| Building the judge | [gobox](https://github.com/shashwat-dixit/gobox) (implementation + checklist). Contract: [13 Judge runner](./13-judge-runner.md) |
| Opening or reviewing a PR | [10 PR review checklist](./10-pr-review-checklist.md) |

## Reading order

1. [Current state](./01-current-state.md) — what was in the repo before the skeleton
2. [Product and scope](./02-product-and-scope.md) — vision, MVP vs later
3. [Decisions](./12-decisions.md) — locked stack and product calls
4. [Architecture](./03-architecture.md) — components
5. [Data model](./04-data-model.md) — Postgres / Redis
6. [Match and realtime](./05-match-and-realtime.md) — state machine, WS
7. [Private rooms and BR](./14-private-rooms-and-br.md) — invite codes, presence, BR rules
8. [Execution and security](./06-execution-and-security.md) + [Judge runner](./13-judge-runner.md)
9. [Frontend](./07-frontend.md)
10. [Infra and devops](./08-infra-and-devops.md)
11. [Roadmap](./09-roadmap.md)
12. [PR review checklist](./10-pr-review-checklist.md)
13. [Open leftovers](./11-open-questions.md)

Appendix: [recovered historical schema](./appendix-recovered-schema.md).

## Ground rules

- You implement feature PRs; reviews use `docs/10-pr-review-checklist.md`.
- Previous stacks (Express, FastAPI, Next.js, Clerk, Kafka-from-day-one, CDK) are reference only.
- Prefer a working 1v1 match with a real judge over Battle Royale, replays, VS Code, or CRDT.
