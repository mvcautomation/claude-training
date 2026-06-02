# robopictionary

A tiny online multiplayer Pictionary game. Anyone starts a game and gets a
4-digit code; friends join with the code and a display name. Players are
auto-split into two teams. Each turn one player draws a randomly chosen
**humanoid robot action** while their teammates race to guess it in chat. The
drawer marks it guessed (their team scores) or the 90-second timer runs out.
First team to the target score wins.

- **Frontend:** React + Vite (deploys to Vercel)
- **Realtime:** [PartyKit](https://partykit.io) — one room per game code, holds
  all game state in memory (resets when the room empties)

## Run locally

```bash
npm install
npm run dev          # runs Vite (5173) + PartyKit (1999) together
```

Open http://localhost:5173. Open a few tabs/devices, create a game in one and
join with the code in the others (need **4 players** to start so each team has
someone to guess).

If you prefer two terminals:

```bash
npm run dev:web      # Vite
npm run dev:party    # PartyKit dev server
```

## Deploy

PartyKit and the frontend deploy separately.

### 1. Deploy the realtime server (PartyKit)

```bash
npx partykit login   # one time, GitHub auth
npm run deploy:party
```

This prints a host like `robopictionary.<your-username>.partykit.dev`. Copy it.

### 2. Deploy the frontend (Vercel)

In the Vercel dashboard, import this repo and set:

- **Root Directory:** `pictionary`
- **Framework Preset:** Vite (auto-detected)
- **Environment Variable:** `VITE_PARTYKIT_HOST = robopictionary.<your-username>.partykit.dev`
  (no `https://`, just the host)

Then deploy. Vercel serves the static build; the browser opens a WebSocket
straight to the PartyKit host for realtime play.

> Redeploy the frontend after changing `VITE_PARTYKIT_HOST` — Vite inlines env
> vars at build time.

## How it works

- `party/server.js` — the game brain. One `Pictionary` instance per room
  (the room id is the 4-digit code). Owns players, teams, turn rotation, the
  word, timer, scores, chat, and the authoritative canvas.
- `party/words.js` — the robot-action word list.
- `src/Canvas.jsx` — shared drawing surface. Coordinates are normalized 0..1 so
  every screen size stays in sync. The drawer emits incremental stroke events;
  viewers replay them live. The server's full canvas is the source of truth for
  joins, undo/redo and clear.
- `src/Room.jsx` — lobby, game (player list + canvas + toolbar + chat/scoreboard),
  and game-over screens, driven entirely by the server's `state` messages.

## Rules baked in

- 2 teams, auto-balanced (equal or off-by-one).
- Only the drawer's teammates can usefully guess; the drawer marks the point.
- 90-second turns; unguessed turns score nothing and rotate on.
- First team to the target (host picks 3 / 5 / 10) wins.
- If the drawer leaves mid-turn, the turn is skipped.
