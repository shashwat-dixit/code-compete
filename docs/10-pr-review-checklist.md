# 10 — PR review checklist

Use this on every PR. The author should self-check; reviewers (human or agent) should fail the PR if **blockers** are present.

This project will be built by hand in small PRs. Reviews optimize for: **missing product behavior**, **correctness of the match/judge**, **performance on the hot path**, and **security of untrusted code**.

## How to review

1. Read the PR description against [roadmap](./09-roadmap.md). Is this the right phase?
2. Walk the user-visible path (auth, queue, submit, result) if the PR touches it.
3. Run the checklist below. Cite file paths.
4. If docs drift (new event, new table, new status), require a `docs/` update in the same PR.

## Blockers (must fix)

### Product / correctness

- [ ] Match state can skip or reverse illegally (e.g. `FINISHED` → `RUNNING`)
- [ ] Two in-flight ACs can both be treated as winners
- [ ] Client clock used as match timing source
- [ ] Practice/catalog features added before 1v1 works (see [scope](./02-product-and-scope.md))
- [ ] New WS/REST field not added to contracts
- [ ] Hidden tests or expected outputs returned to the client
- [ ] Submit allowed when match is not `RUNNING` or user is not a player

### Security

- [ ] User code has network, Docker socket, host FS, or extra capabilities
- [ ] Missing CPU / memory / PID / wall-time limits on the sandbox
- [ ] IDOR on match, submission, or user resources
- [ ] Unauthenticated WS or submit
- [ ] Secrets logged or committed
- [ ] Unbounded request body (especially `code`)
- [ ] SQL assembled with string concat
- [ ] AuthZ checked only on the frontend

### Performance (when in hot path)

- [ ] N+1 queries in match snapshot or leaderboard
- [ ] Polling when WS already exists
- [ ] Loading Monaco (or the whole app) on every tiny route without need
- [ ] Redis keys without TTL on match state
- [ ] Judge work done inline on the API request goroutine/thread

## Should-fix (not always merge-blocking)

- [ ] No rate limit on a public or expensive endpoint
- [ ] No idempotency key for worker retries
- [ ] Logs missing `match_id` / `submission_id`
- [ ] Editor/UI status only by color
- [ ] No reconnect/snapshot path for WS
- [ ] Dockerfile runs as root
- [ ] CI not covering the touched language (web vs Go)
- [ ] Dead code from previous stacks (Express, Prisma, FastAPI, CDK) copied back in without a decision

## Phase-specific extras

### Auth PRs

- Short-lived tokens, redirect URI allowlist, no token in localStorage *if* we can use httpOnly cookies; if localStorage, document XSS implications.

### Judge PRs

- Include at least one test that a network call fails.
- Include a TLE test (infinite loop).
- Confirm containers are removed after run.

### Match / WS PRs

- Snapshot on subscribe.
- Heartbeat / disconnect documented.
- Event payloads match `packages/contracts`.

### Frontend PRs

- Server `endsAt` for timer.
- Submit disabled while in-flight.
- No opponent source.

### Infra PRs

- `.env.example` updated.
- No `docker.sock` mount into the **sandbox** (worker host docker access must be argued explicitly).

## PR description template (authors)

```markdown
## Phase
e.g. Phase 4 — Duel match

## What this does
...

## What this does not do
...

## How to try it
...

## Security / performance notes
...

## Docs
Updated: docs/...
```

## Out of scope for review nitpicks

Do not block on:

- Magic UI / landing aesthetics before Phase 7
- Perfect ELO constants
- Extra languages
- Terraform
- CRDT
