# Live-demo prompt — robopictionary in one shot

Paste the block below into a fresh Claude Code session **in `/Users/peter/Documents/GitHub`**.
It builds the whole game from scratch and deploys it to a public URL with no
follow-up questions. The slow parts (Cloudflare tunnel + DNS) are already wired:
`https://game.ai-app.space → Mac Mini :3200` is standing by, so the only deploy
step is push + Mac Mini pull.

> Fallback if a from-scratch build goes sideways live: the already-tested game in
> `claude-training/pictionary/` can be redeployed to `game.ai-app.space` by
> building it and starting its `server/index.js` on `PORT=3200` as pm2
> `demo-game`. Keep this in your back pocket.

---

Build me a live online multiplayer Pictionary game and deploy it to a public URL — all in one shot. Only ask questions if the current plan isn't working or if you're unclear about something.

**The game**
- Anyone starts a game and gets a 4-digit join code. Others join with the code and pick a display name, then enter.
- Players are auto-split into two roughly-even teams.
- The main area is a drawing canvas. A player-list sidebar on one side shows everyone, with the current drawer pinned at the top in a "currently drawing" box. The drawer auto-rotates between players each turn.
- Each turn the drawer is given a random **simple humanoid robot action** to draw (e.g. robot waving, robot doing a backflip, robot charging its battery) from a long built-in list (~100 prompts). The word is shown to the drawer; guessers see blanks.
- Only the drawer's own teammates guess, in a chat panel on the **opposite** side from the player list. The drawer clicks a **"they guessed it!"** button to award their team a point, or a **90-second** timer expires (unguessed, no points) and it rotates to the next drawer.
- The drawer gets a toolbar: brush, color picker, line thickness, eraser, undo, redo, clear. Drawing streams live to everyone stroke-by-stroke.
- A **score box at the top of the chat** shows both team scores. First team to **5** wins (host can pick 3 / 5 / 10 in the lobby), then a winner screen + play again.
- Light theme, minimal but pretty — use the frontend-design skill.
- Add a lobby **"+ add test bot"** button that drops in fake players who draw, guess, and auto-resolve their own turns, so it can be played/tested solo. Minimum 2 players to start.

**Tech + deployment (follow exactly — the realtime host is already set up)**
- Build in a NEW folder: `/Users/peter/Documents/GitHub/claude-training/demo-game/`
- Frontend: React + Vite. Realtime: a single standalone Node WebSocket server using `ws`. **No PartyKit, no Vercel.**
- That one Node server BOTH serves the built frontend (static `dist/`) AND handles WebSocket connections at `/parties/main/<code>` (read the 4-digit code from the last path segment). It listens on `process.env.PORT || 3200`.
- Frontend and server share one origin, so the client builds its socket URL from `window.location` (`wss://` on https, `ws://` on http) — no env vars, no host config.
- Game state lives in memory, one room per code; drop a room when it empties. Add console logging at key stages (connections, turn start, scoring) for PM2.
- Verify locally first: build, run the server, open the preview, add a few bots, confirm a full game works with no console errors.
- Then deploy to the Mac Mini (same way the other Node services there run — see CLAUDE.md / the dtcmvp-infra skill; access via `ssh bill-remote`):
  1. From the MacBook: `git add demo-game && git commit && git push origin main` in the `claude-training` repo.
  2. `ssh bill-remote 'cd ~/Documents/GitHub/claude-training && git pull && cd demo-game && npm install && npm run build && (pm2 delete demo-game 2>/dev/null; PORT=3200 pm2 start server/index.js --name demo-game --time) && pm2 save'`
- The Cloudflare tunnel hostname **`https://game.ai-app.space` → `localhost:3200`** is ALREADY wired (DNS + tunnel ingress done). **Do NOT touch Cloudflare, DNS, the tunnel, PartyKit, or Vercel.**
- Finish by verifying `https://game.ai-app.space` serves the game and a real `wss://` connection works, then give me the shareable URL.
- Note: on first attempt it created a drawing area that got compressed as more players typed in the chat and the chat expanded, especially on mobile.

Only ask questions if you're blocked and the current plan doesn't work — otherwise, build it, deploy it, verify it, and hand me the link.
