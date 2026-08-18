# 14 — Private rooms, presence, and battle royale

## Private rooms (V1, after 1v1)

No RAG, no LLM, no document index. A private room is a **match in `WAITING`** with an invite secret.

This is the same idea as TypeRacer’s practice race / Kahoot pin / Discord party code.

### Flow

1. Authenticated user `POST /matches/rooms` → `{ matchId, code: "7K2Q9M" }`.
2. They share **either**:
   - short code typed into “Join room”
   - URL `https://codecompete…/compete?room=7K2Q9M`
3. Friend `POST /matches/rooms/join` with the code (must be logged in).
4. When `max_players` (2 for duel) have joined, host clicks Start **or** we auto-start after both ready-up → `COUNTDOWN` like a ranked match.
5. Same judge, same WS, `rated=false` by default (toggle later).

### Code properties

- 6 characters, unambiguous alphabet (`23456789ABCDEFGHJKLMNPQRSTUVWXYZ`)
- Stored hashed or as-is with rate limits (codes are short-lived; hashing is nicer)
- TTL: expire unused rooms after 15–30 minutes
- One active membership per user (cannot sit in two live matches)

### What we do **not** need

- Retrieval-augmented generation
- A separate “room service”
- Voice/video
- CRDT

Matchmaking stays for ranked 1v1. Rooms are an alternative **entry** into the same state machine.

## Presence during a match (locked)

Opponents **never** see source.

Each player’s row on the side board:

| Field | Source |
| --- | --- |
| Tests passed / total | Last judged submission (`passed_tests`) |
| Last verdict | AC/WA/TLE/… |
| Activity | `typing` + WPM, or `thinking` |

### Typing / WPM

The client already has the editor. About every **400–800ms** while focused and the document hash changed, send a WS client event:

```json
{ "v": 1, "type": "presence.typing", "payload": { "wpm": 42 } }
```

Server:

- Caps size and rate (e.g. 5 messages/s dropped).
- Does **not** store keystrokes or source.
- Fans out `{ userId, state: "typing", wpm }` to the match channel.
- If no typing event for **~2s**, mark `thinking` and clients show 🧠.

WPM formula (keep it stupid): characters typed in the last 5s window / 5 * 60 / 5 (standard 5 chars ≈ 1 word). Compute on the client; server may clamp to 0–300 so a paste burst cannot display 20k WPM. A paste spike can show as a jump; that is acceptable.

Layout: problem + editor as already sketched; **right rail** is the opponent list (TypeRacer-style). 1v1 is one opponent; BR is many rows.

## Battle Royale (later — do not implement until 1v1 is live)

Locked reading of “last valid submission gets eliminated”:

### Setup

- Lobby of **N players** (example: 10). `MatchMode = BATTLE_ROYALE`.
- Sequence of **rounds**. Each round is one problem, same state machine as a duel (`COUNTDOWN` → `RUNNING` → round end).
- Each round **eliminates one player** (sometimes more if people are idle — see timer).
- Repeat until **3 players remain**. Those three are the podium. Everyone else is out.

### Round elimination

While the round is `RUNNING`:

1. Players submit as in duel. ACs are **successful / valid** submissions.
2. Track AC order.
3. If `N-1` players already have an AC this round, the **next** player who achieves a valid AC is **eliminated** (their AC does not save them). That is the “10th successful submit” when 10 people play: 9 are safe, the 10th valid submit is out.
4. A player who never produces an AC can still be eliminated at the timer (below).

So: **do not be last to lock in a valid submit.** Speed still matters; sandbagging to be “middle” is possible — median ranking at the end is the counterweight.

### Timer (no full set of ACs)

Reuse the 1v1 rule: **most tests passed stays.**

At round time-up:

- If we still need an elimination because the “Nth valid submit” never happened:
  - Eliminate the player with the **fewest tests passed**.
  - Tie-break: never submitted loses to someone who submitted; then **slower** last-submit time loses.
- Safe players (already AC’d before the cutoff) are never eliminated by the timer.

If several people are on 0 tests, eliminate the idle ones until one elimination is done (still one seat per round unless we later decide to drop all zeros). Default: **exactly one elimination per round** so a 10-stack takes 7 rounds to reach 3. Long but simple. We can add “drop all zeros” later if rounds feel slow.

### Podium (1st / 2nd / 3rd)

When 3 players remain, **stop eliminating**. Do not require a final deathmatch unless we add one later.

For each finalist, collect **time-to-AC** for every round they were in and got AC (skip rounds with no AC). **Median** of those times, **lower is better**.

- 1st = lowest median
- 2nd = middle
- 3rd = highest median
- Tie on median: lower mean time, then lower rating at start of match

Rewards (cosmetic or rating) go to these three only. Eliminated players can take a participation rating ding later; not required for the first BR ship.

### What BR is not

- Not a CRDT / Figma live document
- Not live opponent source
- Not RAG
- Not cash prizes in v1 of BR

### Implementation note

BR is **rounds wrapping the same judge + WS board**. New tables: `match_rounds`, `round_id` on submissions, `eliminated_at_round` on `match_players`. Do not invent a second product.

## 1v1 timer (locked)

If the clock hits 0 and **nobody has AC**:

- Winner = **more tests passed**
- That winner **gains ELO**; loser loses ELO (same K-factor as a normal rated result, possibly reduced — pick in the ELO PR)

If both have AC, **first AC still wins** (timer should usually not be the decider).

If tests passed are **equal** and nobody AC’d: leftover (draw vs earlier last submit). Until decided, **draw** (no ELO or tiny common move).
