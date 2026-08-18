# 07 — Frontend

Current app: Vite + React 19 + TS + Tailwind 4 + Zustand + React Router 7, rendering a coming-soon heading. Dependencies are ahead of the actual UI.

## Role of the web app

The browser is a **realtime client**, not the source of match truth.

- REST for login, queue, history, leaderboard
- WebSocket for match snapshot + live updates
- Zustand (already chosen) for session + current match
- Editor is a controlled component; submit sends full source, not diffs

## Screens

### MVP

| Screen | Job |
| --- | --- |
| Landing (stub) | Name, one sentence, Login / Play |
| Auth callback / login | GitHub (or chosen provider) |
| Lobby | Queue, cancel, “waiting for opponent”, private-room code |
| Match | Problem statement, editor, sample tests, submit, opponent board, timer, status |
| Results | Winner, time, tests, rating delta, CTA requeue |
| Leaderboard | Rank, username, rating |

### V1

- Profile / match history
- Problem statement rendering that is actually pleasant (markdown + math later)
- Settings (language, editor keymap)
- Better landing (Magic UI — issue #8)

### Later

- Replay viewer
- Spectator board
- Admin problem editor (can be markdown in git forever)

## Match layout (the important UI)

Inspired by LeetCode contest + TypeRacer presence:

```text
┌─────────────────────────────────────────────────────────────┐
│  Match  ·  04:12  ·  RUNNING  ·  you 1203 vs opp 1188       │
├───────────────────────────┬─────────────────────────────────┤
│ Problem statement         │ Editor (Monaco)                 │
│ samples                   │ language select                 │
│                           │ Run samples     Submit          │
├───────────────────────────┴─────────────────────────────────┤
│ You ██████░░░░  3/10     Opponent ████░░░░░░  2/10          │
│ last: WA on test 4       last: TLE                          │
└─────────────────────────────────────────────────────────────┘
```

Do not show opponent source. Do not show hidden tests.

Issue #2 “good coding UI” means: readable statement, competent editor, obvious submit state (queued/running/result), not a custom IDE.

## Client architecture

Suggested folders once we start building (do not create until stack is confirmed):

```text
apps/web/src/
  app/                 routes
  features/auth
  features/match       editor, board, ws handlers
  features/lobby
  shared/ui            buttons, layout
  shared/api           fetch + types from contracts
  shared/ws
  store                zustand slices
```

Rules:

- One WS connection per session, not per component
- Reconnect with backoff; on resume, request snapshot
- Optimistic UI only for “submission queued”; never for AC
- Problem statement from REST; live data from WS
- Generate TS types from `packages/contracts` — do not hand-duplicate event names

## Editor

| Library | Notes |
| --- | --- |
| **Monaco** | VS Code editor, CP players expect it, heavier bundle |
| CodeMirror 6 | Lighter, excellent, slightly less “IDE” |
| Ace | Older |

**Recommendation:** Monaco. Lazy-load it so the landing page stays small.

Features for MVP: syntax highlight, tab size 4, no paste restriction. Vim keymap is V1.

## State (Zustand)

Slices:

- `auth`: user, tokens
- `lobby`: queue status
- `match`: snapshot, board, last submission, connection status

Do not put the full source of the editor in Zustand on every keystroke if we can avoid it; keep source in editor/React state, read on Run/Submit.

## Styling

Already on Tailwind 4. Previous attempt used shadcn + Radix. Issue #8 asks for Magic UI.

**Recommendation:** Tailwind + a small set of primitives (shadcn or similar). Magic UI for the marketing landing in V1, not for the match screen (animations must not add input lag).

## VS Code extension (later)

Same REST + WS contracts. The extension is a second UI:

- Login (device code or URI handler)
- Join / queue
- Open problem in a markdown preview
- Submit current file
- Status bar: timer, board, last result

Do not start this until the web match works; otherwise we maintain two incomplete clients.

## Accessibility and UX notes for review

- Timer must be server-anchored (`endsAt` timestamp), not `setInterval` from countdown start only
- Submit button disabled while in-flight
- Connection lost banner
- Keyboard: Ctrl/Cmd+Enter to submit is nice; document it
- Color-only status is a fail (WA vs AC needs text)
