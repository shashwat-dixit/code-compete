# 05 — Match and realtime

## Match state machine

Deterministic, as required by the README. Only the **resolver** (or a single match-service actor) is allowed to transition state. The API may *request* transitions (cancel, start countdown) by emitting events.

```text
                    enqueue / create room
                            │
                            ▼
                        WAITING
                         │
          enough players + problem assigned
                         │
                         ▼
                     COUNTDOWN  ──── timeout / abort ──► CANCELLED
                         │
                    countdown ends
                         │
                         ▼
                      RUNNING  ──── all disconnect / abort ──► CANCELLED
                         │
           win condition or duration elapsed
                         │
                         ▼
                      FINISHED
```

No skipping COUNTDOWN in rated matches (stops “I already pasted the solution” races). Private rooms may use a ready-up instead of auto-start.

### Allowed transitions

| From | To | Trigger |
| --- | --- | --- |
| WAITING | COUNTDOWN | `max_players` connected and problem chosen |
| WAITING | CANCELLED | host leaves / queue timeout |
| COUNTDOWN | RUNNING | countdown elapsed |
| COUNTDOWN | CANCELLED | too many disconnects |
| RUNNING | FINISHED | winner, draw, or time up |
| RUNNING | CANCELLED | only for ops / failed judge / never-started |

Transitions must be **idempotent** (`FINISHED` + extra `AC` from the loser does not reopen the match).

## Duel rules (MVP)

- 2 players, 1 problem, one language or a declared set
- Editor locked until `RUNNING`
- Submit goes to judge; first `ACCEPTED` wins
- Further submissions from either player after `FINISHED` are rejected
- Time limit: 5–10 minutes (configurable per problem)
- If timer hits 0 with no AC: **most tests passed wins** and takes ELO. Equal tests, no AC: draw until we say otherwise ([14](./14-private-rooms-and-br.md)).
- Wrong submissions do not eliminate; optional penalty: +2s displayed time or cooldown

### Submission cooldown

Start with a simple per-user cooldown (e.g. 3–5s) plus a max in-flight of 1 per player. Prevents judge flooding. Token bucket in Redis.

## Battle Royale (later)

Specified in [14](./14-private-rooms-and-br.md). Last valid AC of the round is eliminated; play until 3 remain; rank by median AC time. Do not implement until 1v1 works. No CRDT.

## Matchmaking

MVP algorithm (good enough):

1. Player `POST /matchmaking/queue`
2. Insert into Redis zset `mm:queue:{rating_bucket}` with score = now
3. Periodically (or on each enqueue) try to pair two oldest players whose ratings differ by ≤ `W` (start W=150, expand after 10s, 20s)
4. Create match in Postgres + Redis, pop both users, WS notify `match.found`

Private rooms: `POST /matches` → invite code → second player joins → COUNTDOWN.

Do not build a dedicated matchmaking service. Keep it in the API for MVP.

## WebSocket protocol (sketch)

Connect: `GET /ws` with JWT. Subscribe to a match after `match.found`.

Server → client:

```json
{ "v": 1, "type": "match.snapshot", "payload": { "matchId": "...", "status": "COUNTDOWN", "endsAt": "...", "players": [] } }
{ "v": 1, "type": "match.status", "payload": { "status": "RUNNING" } }
{ "v": 1, "type": "board.updated", "payload": { "userId": "...", "passed": 3, "total": 10, "activity": "typing", "wpm": 38 } }
{ "v": 1, "type": "submission.updated", "payload": { "id": "...", "status": "WRONG_ANSWER" } }
{ "v": 1, "type": "match.finished", "payload": { "winnerId": "...", "ratings": [] } }
```

Client → server: heartbeats, plus `presence.typing` (rate-limited; no source). See [14](./14-private-rooms-and-br.md).

**Snapshot on subscribe** so reconnects work. Events are incremental.

## Event bus topics (if we keep an async log)

| Topic | Producer | Consumer | Payload |
| --- | --- | --- | --- |
| `submission.queued` | API | runner | submission id, language, limits |
| `execution.completed` | runner | resolver | status, runtime, tests passed |
| `match.finished` | resolver | elo worker, API fanout | match id, results |

Redis Streams. Same names as stream keys.

### Idempotency

- Runner: executing twice for the same submission id is allowed only if the second run is a no-op after a stored result exists.
- Resolver: applying `ACCEPTED` to an already `FINISHED` match is a no-op.
- ELO worker: unique `(match_id, user_id)` on `rating_history`.

## Disconnects

- Heartbeat every 15s; after ~30s mark `connected=false`
- Do not immediately forfeit (refresh / laptop sleep)
- Forfeit after N seconds disconnected during `RUNNING` (e.g. 60s) — configurable
- Reconnect: same user JWT resubscribes, gets snapshot

## What the API does vs workers

| Action | Owner |
| --- | --- |
| Auth, queue, create room, accept WS | API |
| Persist submission row, rate limit, enqueue | API |
| Run code | runner |
| Transition match, decide winner | resolver |
| Update `users.rating` + history | elo worker |
| Push WS frames | API (via Redis pub/sub) |

Never let the runner write match winners. That is how race conditions sneak in (two ACs in flight).
