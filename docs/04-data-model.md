# 04 — Data model

The 2024 Prisma schema was a **practice-site** model (users, questions, submissions, progress). Code Compete is a **match** product. Keep the useful parts, add match as a first-class entity, and drop practice-progress from MVP.

Recovered Prisma/SQL is in [appendix](./appendix-recovered-schema.md).

## Postgres (source of truth)

### Enums

```text
Difficulty            EASY | MEDIUM | HARD
SubmissionStatus      QUEUED | RUNNING | ACCEPTED | WRONG_ANSWER | TIME_LIMIT_EXCEEDED
                      | MEMORY_LIMIT_EXCEEDED | RUNTIME_ERROR | COMPILATION_ERROR | CANCELLED
MatchStatus           WAITING | COUNTDOWN | RUNNING | FINISHED | CANCELLED
MatchMode             DUEL | BATTLE_ROYALE   -- only DUEL in MVP
MatchResult           WIN | LOSS | DRAW | CANCELLED
AuthProvider          GITHUB | GOOGLE | LOCAL   -- only what we enable
```

### Tables (MVP)

#### `users`

| Column | Type | Notes |
| --- | --- | --- |
| id | uuid pk | |
| username | citext unique | display + URL |
| email | citext unique | |
| avatar_url | text null | |
| rating | int default 1200 | current ELO |
| rating_rd | int/float null | optional Glicko later |
| created_at / updated_at | timestamptz | |

Auth identities should be a **separate** table so one user can link GitHub later:

#### `auth_identities`

| Column | Type | Notes |
| --- | --- | --- |
| id | uuid pk | |
| user_id | fk users | |
| provider | enum | |
| provider_user_id | text | unique per provider |
| created_at | timestamptz | |

#### `problems`

| Column | Type | Notes |
| --- | --- | --- |
| id | uuid pk | |
| slug | citext unique | |
| title | text | |
| statement_md | text | keep markdown in DB or in files; files are easier to review in git |
| difficulty | enum | |
| time_limit_ms | int | |
| memory_limit_mb | int | |
| starter_code | jsonb | `{ "python": "...", "cpp": "..." }` |
| is_published | bool | |
| created_at / updated_at | timestamptz | |

**Test cases should not live as unstructured JSON on the problem row** (old schema). Hidden tests leaking via an API bug is a high-severity issue.

#### `problem_tests`

| Column | Type | Notes |
| --- | --- | --- |
| id | uuid pk | |
| problem_id | fk | |
| ordinal | int | |
| input | text | |
| expected_output | text | |
| is_sample | bool | samples may be returned to the client |
| weight | int default 1 | optional |

API must **never** return `is_sample = false` rows to clients.

#### `matches`

| Column | Type | Notes |
| --- | --- | --- |
| id | uuid pk | |
| mode | enum | DUEL |
| status | enum | |
| problem_id | fk null | assigned when match is ready |
| rated | bool | |
| max_players | int | 2 for duel |
| started_at / ended_at | timestamptz null | |
| created_at | timestamptz | |

#### `match_players`

| Column | Type | Notes |
| --- | --- | --- |
| match_id | fk | |
| user_id | fk | |
| seat | int | 0..n |
| rating_before | int | |
| rating_after | int null | |
| result | enum null | |
| placement | int null | BR later |
| connected | bool | last known; Redis is live |
| primary key | (match_id, user_id) | |

#### `submissions`

| Column | Type | Notes |
| --- | --- | --- |
| id | uuid pk | |
| match_id | fk null | null only if we add practice later |
| user_id | fk | |
| problem_id | fk | |
| language | text | |
| code | text | or object storage pointer |
| status | enum | |
| runtime_ms / memory_kb | int null | |
| passed_tests / total_tests | int null | |
| created_at / judged_at | timestamptz | |

Storing code in Postgres is fine until rows get large. Old schema had `s3CodeUrl`; that is optional later, not MVP.

#### `submission_test_results`

Optional for MVP. Useful for the results screen. Do not send hidden-test expected output or full hidden inputs to the client. Failed hidden tests can say `failed on test 7` without revealing the fixture.

#### `rating_history`

| Column | Type | Notes |
| --- | --- | --- |
| id | uuid pk | |
| user_id | fk | |
| match_id | fk | **match-based**, not question-based |
| old_rating / new_rating / delta | int | |
| created_at | timestamptz | |

This is the main correction vs 2024: rating changes belong to **matches**, not to solving a random catalog problem.

### Intentionally dropped for MVP

- `UserQuestionProgress` / attempt counts / best runtime — practice mode
- Categories / tags — catalog chrome
- In-game chat — extra moderation surface
- Cash pool / wallet tables

## Redis (hot path)

Redis is **not** the source of truth. Use TTLs. Suggested key layout:

| Key | Type | Purpose | TTL |
| --- | --- | --- | --- |
| `match:{id}` | hash | status, problem_id, started_at, deadline | match duration + 1h |
| `match:{id}:players` | hash | user_id → {rating, connected, last_submit_at} | same |
| `match:{id}:board` | zset | score: tests passed, time, or finish timestamp | same |
| `match:{id}:subs` | list/stream | recent submission ids for UI | same |
| `mm:queue:{bucket}` | zset | matchmaking: user_id scored by enqueue time | short |
| `mm:lock:{user}` | string | prevent double-queue | minutes |
| `rate:submit:{user}` | string/token bucket | submit rate limit | seconds |
| `ws:match:{id}` | pubsub channel | fanout | n/a |
| `leaderboard:global` | zset | rating | long / rebuild from PG |

Idempotency keys:

- `exec:dedupe:{submission_id}` so runner/resolver retries do not double-apply a win.

## Contracts to define early

Put these in `packages/contracts` (OpenAPI + JSON Schema, or protobuf — pick one in questions):

- REST: auth, me, queue, match get, submit, leaderboard
- WS server → client: `match.updated`, `submission.updated`, `player.presence`, `match.finished`
- WS client → server: `ping`, `presence` (typing/progress optional)
- Worker events: `submission.queued`, `execution.completed`, `match.finished`

Version the events (`v1`) from the start so we can change fields without silent breakage.

## ELO (keep it boring)

- Start at 1200 (old default — keep it)
- K-factor ~32 for new accounts, ~16 after N rated matches
- Draw = both move toward each other slightly or no-op (decide in implementation)
- Unrated / disconnect rules: if a player never submits and disconnects after start, count as loss after a grace period

Do not invent Glicko until we have volume.

## Data we must not leak

- Hidden tests
- Opponent source until match end (and maybe not then, unless we opt into sharing)
- Other users' emails
- Judge host environment variables

PR review should treat accidental test-case leakage as a **security** defect, not a polish issue.
