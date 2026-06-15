# robopictionary

A tiny online multiplayer Pictionary game. Anyone starts a game and gets a
4-digit code; friends join with the code and a display name. Players are
auto-split into two teams. Each turn one player draws a randomly chosen
**humanoid robot action** while their teammates race to guess it in chat. The
drawer marks it guessed (their team scores) or the 90-second timer runs out.
First team to the target score wins.

- **Frontend:** React + Vite (deploys to Vercel)
- **Realtime:** a small standalone **Node WebSocket server** (`ws`), self-hosted
  on the Mac Mini behind a Cloudflare tunnel. One process, many rooms; the
  4-digit code is the room id. All state is in memory and a room is dropped when
  it empties.

## Run locally

```bash
npm install
npm run dev          # runs Vite (5173) + the ws server (127.0.0.1:3100) together
```

Open http://localhost:5173. To try it solo, create a game and use the
**"+ add test bot"** button in the lobby — bots draw, guess, and auto-resolve
their own turns so one person can see a full game.

Two terminals instead:

```bash
npm run dev:web      # Vite
npm run dev:server   # ws server on :3100
```

## Architecture

```
browser (Vercel, https)  ──wss──▶  pictionary.ai-app.space
                                     │ (Cloudflare tunnel, auto TLS)
                                     ▼
                              Mac Mini :3100  (PM2: pictionary-party)
                              server/index.js  — Node ws server
```

`partysocket` (client) connects to `wss://<host>/parties/main/<code>?name=<name>`;
the server reads the code from the path and the name from the query. Cloudflare
terminates TLS and proxies the WebSocket, so no nginx/certbot is needed on the
Mac Mini.

## Deploy

### 1. Frontend → Vercel

Import this repo and set:

- **Root Directory:** `pictionary`
- **Framework Preset:** Vite (auto-detected)
- **Environment Variable:** `VITE_PARTYKIT_HOST = pictionary.ai-app.space`
  (no protocol — `partysocket` upgrades to `wss://` automatically on an https page)

Redeploy after changing the env var (Vite inlines it at build time).

### 2. Realtime server → Mac Mini (PM2 + Cloudflare tunnel)

Edit locally, commit, push — never edit on the server. Then on the Mac Mini:

```bash
ssh bill-remote 'cd ~/Documents/GitHub/claude-training && git pull \
  && cd pictionary && npm install --omit=dev \
  && pm2 restart pictionary-party'
```

First-time setup (clone, install, start under PM2, add the tunnel hostname
`pictionary.ai-app.space → http://localhost:3100`, graceful `SIGHUP` reload) is
documented in the deploy notes; after that, the pull+restart above is all a code
change needs.

## Files

- `server/index.js` — the Node ws server: a `GameRoom` per code (players, teams,
  rotation, word, timer, scores, chat, authoritative canvas) plus a room registry
  and an HTTP health endpoint (`GET /` → `robopictionary ws ok`).
- `server/words.js` — the robot-action word list.
- `src/Canvas.jsx` — shared drawing surface, normalized 0..1 coords, live stroke
  streaming, eraser/undo/redo/clear, redraw on resize.
- `src/Room.jsx` — lobby, game, and game-over screens driven by server `state`.

## Rules baked in

- 2 teams, auto-balanced (equal or off-by-one).
- Only the drawer's teammates can usefully guess; the drawer marks the point.
- 90-second turns; unguessed turns score nothing and rotate on.
- First team to the target (host picks 3 / 5 / 10) wins.
- If the drawer leaves mid-turn, the turn is skipped.
- Lobby "+ add test bot" spawns auto-playing bots for solo testing.
