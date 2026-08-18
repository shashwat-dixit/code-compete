# 02 — Product and scope

## One-liner

**TypeRacer for LeetCode:** players race each other on the same algorithmic problem; the fastest correct submission wins; ratings and leaderboards persist.

## Who it is for

- Developers who already grind LeetCode / Codeforces and want a **short, social, timed** format
- Friends or strangers in a 2–5 minute match, not a 2-hour contest
- Later: people who want to play from VS Code instead of the browser

Not the primary audience for MVP: ICPC teams, interview-prep platforms, or paid contest organizers.

## Product metaphor (keep this sharp)

| TypeRacer | Code Compete |
| --- | --- |
| Same passage for everyone | Same problem for everyone |
| Progress = characters typed | Progress = tests passing / time-to-AC |
| WPM + accuracy | Time-to-solve + penalty for wrong subs |
| ELO-ish matchmaking | ELO matchmaking |
| Replay of the race | Replay of submissions / timeline |

Opponents should feel **present**: tests passed, last verdict, and a typing/thinking indicator (WPM or 🧠). Showing other players' **full source** live is out. See [14](./14-private-rooms-and-br.md).

## Core gameplay (1v1, the thing we must get right)

1. Player authenticates and enters matchmaking (or creates a private room).
2. Two players of similar rating are paired.
3. Match enters `COUNTDOWN`, problem is revealed, editor unlocks at `RUNNING`.
4. Players write code, run sample tests (optional), then submit.
5. Judge executes against hidden tests in a sandbox.
6. First player to get `ACCEPTED` wins. Time expires with no AC → **most tests passed** wins and takes ELO.
7. ELO updates, match is persisted, both players see a results screen.

Battle Royale, cash contests, CRDT, and VS Code are **modes and clients on top of this loop**, not the loop itself.

## Feature inventory

Legend: **MVP** must ship for the product to be real. **V1** is the first public version after MVP. **Later** is parked.

### Must-have (MVP)

- GitHub OAuth login and sessions
- Problem bank of a handful of well-tested problems (not 100 fake seed problems)
- Matchmaking (simple rating buckets is enough)
- 1v1 live match with countdown + timer
- In-browser editor with submit
- Isolated code execution with time/memory limits (Python, then C++ / Go / Java)
- Per-match live board: tests passed + typing WPM / thinking
- Post-match result + rating change
- Global leaderboard (even if just a Postgres query)

### Should-have (V1)

- Private invite rooms / “play a friend”
- Sample-test “Run” vs hidden-test “Submit”
- Submission cooldown + clear error states (WA/TLE/MLE/RE/CE)
- Match history on profile
- Rate limiting on submit and matchmaking
- Structured logs + basic metrics
- Docker Compose one-command local stack
- CI: lint + test + build

### Nice-to-have (later)

- Battle Royale mode (last-valid-submission elimination — **rules still undefined**)
- Match replays
- VS Code extension (auth, join, submit, live feedback)
- Spectator mode
- Tournament brackets
- Multi-language beyond the MVP language set
- Anti-cheat heuristics / no-paste policy
- Firecracker / gVisor hardening
- Horizontal scaling, multi-region
- Cash-pool contests
- Live opponent code via CRDT
- Magic UI marketing landing + live site metrics

## Explicit non-goals for the restart

Do **not** spend early PRs on:

- Scraping LeetCode (ToS / legal / brittle)
- Multi-region AWS
- Custom CRDT infrastructure
- Payments / cash prizes
- Building a full LeetCode clone (problem progress, company tags, premium problems)
- Kubernetes, Terraform, or CDK until a single-region deploy actually works
- Pixel-perfect landing pages before a match can be played locally

The old schema had `UserQuestionProgress` and LeetCode-style practice. Practice mode can exist later; **it is not the product.**

## User-facing surfaces (target IA)

Recovered from the 2024 frontend routes, still a good map:

| Route | Purpose | Phase |
| --- | --- | --- |
| `/` | Landing + CTA to play | V1 polish; stub OK in MVP |
| `/login` | Auth | MVP |
| `/compete` | Matchmaking / lobby / live match | MVP |
| `/problems` | Browse problem bank (optional for MVP) | V1 |
| `/rankings` | Global leaderboard | MVP (simple) |
| `/user/:id` | Profile, rating history, match history | V1 |
| `/match/:id` | Results + later replay | MVP results / later replay |

VS Code is a second client of the same API + WS protocol, not a separate product.

## Success criteria for “MVP is done”

A new developer can:

1. `docker compose up` (or equivalent)
2. Open two browsers, log in as two users
3. Get matched on a real problem
4. Submit Python (or the chosen language)
5. See the winner, rating change, and a row in match history

Until that path works, every other feature is a distraction.

## Scope rules for PRs

- One vertical slice per PR when possible (example: “JWT auth + user table”, not “auth + judge + BR”).
- Do not add a new mode (BR, spectator, tournament) until 1v1 is complete.
- Do not add a new language until the first language’s sandbox is resource-limited and network-isolated.
- Docs in this folder should be updated in the same PR when behavior or decisions change.
