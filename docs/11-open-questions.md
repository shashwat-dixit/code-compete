# 11 — Open questions

**Please answer these before we change `main`.** Recommended defaults are in **bold**. Until then, this docs PR is the only intended code change.

Reply inline (PR comment or chat) with option letters. If you disagree with a default, say so explicitly.

---

## A. Product

### A1. MVP mode set

- **(a) 1v1 rated duel only**
- (b) 1v1 + private rooms
- (c) Also Battle Royale in the first public version

### A2. Battle Royale meaning (even if later)

README says “last valid submission gets eliminated.” Which is it?

- (a) Each round, the slowest player to AC is eliminated (non-AC also out)
- (b) Last player who still has a valid AC wins (survival)
- (c) Something else — describe it
- (d) Park BR until 1v1 is live; do not spec it now

### A3. Opponent visibility during a match

- **(a) Progress only** (tests passed, last verdict, timer)
- (b) Live caret / “typing” presence without source
- (c) Live shared source (CRDT, GitHub #9) — not recommended for rated play

### A4. Draw rules when the timer ends with no AC

- **(a) Draw**, ratings move little or not at all
- (b) Winner = most tests passed; tie = draw
- (c) Both lose rating slightly

### A5. Practice / problem catalog

Old app had Problems + progress tracking.

- **(a) No practice mode in V1** (problems exist only for matches)
- (b) Catalog browse + solo submit after duel works
- (c) Want a LeetCode-style practice site as a co-equal product

### A6. “No copy paste” (issue #7)

- **(a) Ignore for V1** (easy to bypass; hurts UX)
- (b) Disable paste in rated matches as a house rule
- (c) Hard requirement

### A7. Languages in first playable version

- **(a) Python 3 only**
- (b) Python + C++
- (c) Also Java / JS / Go from day one

---

## B. Frontend

### B1. Web framework

- **(a) Keep current Vite + React 19 + Tailwind 4 + Zustand + React Router**
- (b) Switch to Next.js
- (c) Something else

### B2. UI kit

- **(a) Tailwind primitives + shadcn-style components**
- (b) Magic UI on the landing only, quiet match UI
- (c) Magic UI everywhere (issue #8)

### B3. Editor

- **(a) Monaco**
- (b) CodeMirror 6
- (c) Defer until you pick

### B4. Package manager

Repo has `bun.lock` today.

- **(a) Bun**
- (b) pnpm
- (c) npm

---

## C. Backend

### C1. API + workers language

- **(a) Go**, as in the README and `origin/rebuild`
- (b) FastAPI
- (c) Node/Express
- (d) Other

### C2. Event bus

- **(a) Redis Streams** (one less moving part; Redis is already required)
- (b) Redpanda/Kafka from day one (README)
- (c) NATS JetStream
- (d) AWS SQS (old design)

### C3. HTTP framework (if Go)

- **(a) stdlib `net/http` + chi**
- (b) Echo / Gin / Fiber
- (c) No preference

### C4. Postgres access (if Go)

- **(a) pgx + sqlc**
- (b) GORM
- (c) Ent / Bun / other

### C5. Contracts format shared by Go + TS

- **(a) OpenAPI for REST + JSON Schema for WS/events**
- (b) Protobuf
- (c) Hand-written TS types + Go structs until it hurts

### C6. Auth

- **(a) GitHub OAuth → our JWT**
- (b) Clerk (used in 2024 frontend)
- (c) Email + password
- (d) Auth0 / other

---

## D. Judge

### D1. Execution engine

- **(a) Custom Docker runner** (README)
- (b) Self-hosted Judge0 / Piston to move faster
- (c) Decide after a spike PR

### D2. How workers talk to Docker in prod

- (a) Runner on the host, API in compose/containers
- (b) Docker-in-Docker
- (c) Firecracker/gVisor from the start (slow to build)
- **(d) Custom Docker runner, gVisor later**

---

## E. Infra

### E1. First deploy target

- **(a) Single VPS** (README)
- (b) Fly.io / Railway / Render
- (c) AWS ECS (old CDK)
- (d) No deploy until local 1v1 works — **also fine; can combine with (a)**

### E2. Multi-region AWS (issue #5)

- **(a) Out of scope indefinitely**
- (b) A real V2 goal

### E3. Analytics

- **(a) None for MVP**
- (b) PostHog (`rebuild` already depended on it)
- (c) Prometheus only
- (d) Both PostHog + Prometheus

### E4. Domain / existing site

`https://codecompete.shashwatdixit.dev` already exists.

- Keep it as coming-soon until Phase 7?
- Any required hostname / TLS / DNS constraints?

---

## F. How we work

### F1. Who implements

You said you will build by hand and open PRs. Confirm:

- **(a) You implement; this agent reviews PRs against `docs/`**
- (b) Mixed: agent may scaffold Phase 1 after questions are answered
- (c) Agent should implement most of it

### F2. After this docs PR lands

Should the next PR on `main` be:

- **(a) README cleanup + issue triage only**
- (b) Phase 1 skeleton (compose + healthz)
- (c) Wait for more discussion

---

## Already assumed (push back if wrong)

- Product is TypeRacer-style **races**, not a full LeetCode clone
- API never runs user code
- Hidden tests never go to the client
- VS Code extension is after web 1v1
- We will not scrape LeetCode for problems or judging
