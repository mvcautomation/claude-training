// Standalone Node WebSocket server for robopictionary.
// Self-hosted on the Mac Mini behind a Cloudflare tunnel (wss://pictionary.ai-app.space).
// One process, many rooms. The 4-digit game code is the room id.
//
// The browser connects with `partysocket` to /parties/main/<code>?name=<name>,
// so we keep that path shape even though we're no longer on PartyKit.

import { createServer } from "http";
import { WebSocketServer } from "ws";
import { WORDS } from "./words.js";

const PORT = process.env.PORT || 3100;

const TURN_MS = 90_000; // 90 second timer per turn
const ROUND_END_MS = 5_000; // reveal-the-word pause between turns
const DEFAULT_TARGET = 5;
const MIN_PLAYERS = 2; // 2 is enough once you can add test bots to fill seats

// ---- test-bot helpers -------------------------------------------------------
const BOT_PALETTE = ["#1b1b1f", "#ff5a3c", "#3a6df0", "#3cba54", "#9b5de5", "#ff9f1c"];
const BOT_GUESSES = [
  "hmm…",
  "is it a robot?",
  "ooh i think i know",
  "wait what is that",
  "robot dancing??",
  "no clue lol",
  "10/10 drawing",
  "a robot doing… something",
  "is that an arm?",
];
const rand = (a, b) => a + Math.random() * (b - a);

function makeScribble() {
  const n = 2 + Math.floor(Math.random() * 3); // 2-4 strokes
  const strokes = [];
  for (let s = 0; s < n; s++) {
    const color = BOT_PALETTE[Math.floor(Math.random() * BOT_PALETTE.length)];
    const size = [4, 7, 12][Math.floor(Math.random() * 3)];
    const points = [];
    let x = rand(0.2, 0.8);
    let y = rand(0.2, 0.8);
    let ax = rand(-0.04, 0.04);
    let ay = rand(-0.04, 0.04);
    const steps = 8 + Math.floor(Math.random() * 12);
    for (let i = 0; i < steps; i++) {
      x = Math.min(0.95, Math.max(0.05, x + ax));
      y = Math.min(0.95, Math.max(0.05, y + ay));
      ax += rand(-0.02, 0.02);
      ay += rand(-0.02, 0.02);
      points.push([x, y]);
    }
    strokes.push({ tool: "brush", color, size, points });
  }
  return strokes;
}

// ---- one game room ----------------------------------------------------------
class GameRoom {
  constructor(id, onEmpty) {
    this.id = id;
    this.onEmpty = onEmpty;
    this.connections = new Map(); // connId -> ws
    this._connSeq = 0;

    this.players = new Map(); // connId -> {id,name,team,connected,isBot}
    this.hostId = null;

    this.phase = "lobby"; // lobby | playing | roundEnd | gameOver
    this.teams = [0, 0];
    this.targetScore = DEFAULT_TARGET;

    this.order = [];
    this.turnIndex = 0;
    this.drawerId = null;

    this.word = null;
    this.mask = null;
    this.turnEndsAt = null;

    this.chat = [];
    this.lastResult = null;
    this.winner = null;
    this.recentWords = [];

    this.strokes = [];
    this.redo = [];
    this.pending = null;

    this._turnTimer = null;
    this._roundTimer = null;
    this._botTimers = [];
    this._botSeq = 0;
  }

  // ---- connection plumbing (replaces PartyKit's this.room.*) ----
  addConnection(ws, name) {
    const id = "c" + ++this._connSeq;
    this.connections.set(id, ws);
    const team = this.balancedTeam();
    this.players.set(id, { id, name: (name || "Player").slice(0, 20).trim() || "Player", team, connected: true, isBot: false });
    if (!this.hostId) this.hostId = id;
    if (this.phase !== "lobby") this.order.push(id);
    console.log(`[${this.id}] + ${name} (${id}) — ${this.connections.size} connected`);
    this.send(id, this.canvasMsg());
    this.broadcastState();
    return id;
  }

  removeConnection(id) {
    this.connections.delete(id);
    const p = this.players.get(id);
    if (!p) return;
    this.players.delete(id);
    console.log(`[${this.id}] - ${p.name} (${id}) — ${this.connections.size} connected`);

    if (this.hostId === id) {
      const next = [...this.players.values()].find((q) => !q.isBot);
      this.hostId = next ? next.id : null;
    }

    if (this.connections.size === 0) {
      this.clearTimers();
      this.onEmpty?.();
      return;
    }
    if (this.phase === "playing" && this.drawerId === id) this.endTurn(false);
    else this.broadcastState();
  }

  broadcast(str, excludeId) {
    for (const [cid, ws] of this.connections) {
      if (cid === excludeId) continue;
      if (ws.readyState === 1) ws.send(str);
    }
  }
  send(id, str) {
    const ws = this.connections.get(id);
    if (ws && ws.readyState === 1) ws.send(str);
  }

  handleMessage(id, raw) {
    let msg;
    try {
      msg = JSON.parse(raw);
    } catch {
      return;
    }
    const p = this.players.get(id);
    if (!p) return;
    switch (msg.t) {
      case "start":
        return this.startGame(id, msg);
      case "chat":
        return this.onChat(p, msg.text);
      case "guessed":
        return this.onGuessed(id);
      case "again":
        return this.playAgain(id);
      case "addbot":
        return this.addBot(id);
      case "rmbot":
        return this.removeBot(id);
      case "d-start":
      case "d-point":
      case "d-end":
      case "d-undo":
      case "d-redo":
      case "d-clear":
        if (id !== this.drawerId || this.phase !== "playing") return;
        return this.onDraw(msg, id);
    }
  }

  // ---- teams & rotation ----
  balancedTeam() {
    const c = [0, 0];
    for (const p of this.players.values()) if (p.connected) c[p.team]++;
    return c[0] <= c[1] ? 0 : 1;
  }
  rebalance() {
    [...this.players.values()].forEach((p, i) => (p.team = i % 2));
  }
  buildOrder() {
    const t0 = [...this.players.values()].filter((p) => p.team === 0).map((p) => p.id);
    const t1 = [...this.players.values()].filter((p) => p.team === 1).map((p) => p.id);
    const order = [];
    const n = Math.max(t0.length, t1.length);
    for (let i = 0; i < n; i++) {
      if (t0[i]) order.push(t0[i]);
      if (t1[i]) order.push(t1[i]);
    }
    return order;
  }

  // ---- game flow ----
  startGame(id, msg) {
    if (id !== this.hostId || this.phase !== "lobby") return;
    if (this.players.size < MIN_PLAYERS) return;
    this.rebalance();
    const t = parseInt(msg.target, 10);
    if (t >= 1 && t <= 50) this.targetScore = t;
    this.teams = [0, 0];
    this.winner = null;
    this.chat = [];
    this.order = this.buildOrder();
    this.turnIndex = 0;
    console.log(`[${this.id}] game start — ${this.players.size} players, to ${this.targetScore}`);
    this.startTurn();
  }

  startTurn() {
    this.clearTimers();
    if (this.connections.size === 0) {
      this.phase = "lobby";
      this.drawerId = null;
      return;
    }
    const live = this.order.filter((id) => this.players.has(id));
    if (live.length === 0) {
      this.phase = "lobby";
      this.drawerId = null;
      this.broadcastState();
      return;
    }
    this.drawerId = live[this.turnIndex % live.length];
    this.word = this.pickWord();
    this.mask = this.word.replace(/[a-z]/gi, "_");
    this.strokes = [];
    this.redo = [];
    this.pending = null;
    this.phase = "playing";
    this.turnEndsAt = Date.now() + TURN_MS;
    this._turnTimer = setTimeout(() => this.endTurn(false), TURN_MS);
    console.log(`[${this.id}] turn → ${this.players.get(this.drawerId)?.name}: "${this.word}"`);
    this.broadcastCanvasClear();
    this.broadcastState();

    if (this.players.get(this.drawerId)?.isBot) this.botPlayTurn(this.drawerId);
    else this.botChatter();
  }

  endTurn(guessed, team) {
    if (this.phase !== "playing") return;
    this.clearTimers();
    if (guessed) {
      this.teams[team]++;
      this.lastResult = { word: this.word, guessed: true, team };
    } else {
      this.lastResult = { word: this.word, guessed: false, team: null };
    }
    console.log(`[${this.id}] turn end — ${guessed ? "team " + team + " scored" : "unguessed"} (${this.teams[0]}-${this.teams[1]})`);

    if (this.teams[0] >= this.targetScore || this.teams[1] >= this.targetScore) {
      this.winner = this.teams[0] === this.teams[1] ? null : this.teams[0] > this.teams[1] ? 0 : 1;
      this.phase = "gameOver";
      this.drawerId = null;
      this.turnEndsAt = null;
      this.broadcastState();
      return;
    }
    this.phase = "roundEnd";
    this.turnEndsAt = null;
    this.broadcastState();
    this._roundTimer = setTimeout(() => {
      this.turnIndex++;
      this.startTurn();
    }, ROUND_END_MS);
  }

  onGuessed(id) {
    if (this.phase !== "playing" || id !== this.drawerId) return;
    this.endTurn(true, this.players.get(id).team);
  }

  onChat(p, text) {
    text = String(text || "").slice(0, 140).trim();
    if (!text) return;
    if (this.phase === "playing" && p.id === this.drawerId) return;
    this.chat.push({ id: p.id, name: p.name, team: p.team, text });
    if (this.chat.length > 60) this.chat.shift();
    this.broadcastState();
  }

  playAgain(id) {
    if (id !== this.hostId || this.phase !== "gameOver") return;
    this.phase = "lobby";
    this.teams = [0, 0];
    this.winner = null;
    this.lastResult = null;
    this.chat = [];
    this.strokes = [];
    this.drawerId = null;
    this.turnEndsAt = null;
    this.broadcastCanvasClear();
    this.broadcastState();
  }

  // ---- test bots ----
  addBot(id) {
    if (id !== this.hostId || this.phase !== "lobby") return;
    const bots = [...this.players.values()].filter((p) => p.isBot);
    if (bots.length >= 7) return;
    const n = ++this._botSeq;
    const botId = "bot:" + n;
    this.players.set(botId, { id: botId, name: "cpu-" + n, team: this.balancedTeam(), connected: true, isBot: true });
    this.broadcastState();
  }
  removeBot(id) {
    if (id !== this.hostId || this.phase !== "lobby") return;
    const bots = [...this.players.values()].filter((p) => p.isBot);
    const last = bots[bots.length - 1];
    if (last) this.players.delete(last.id);
    this.broadcastState();
  }

  botPlayTurn(drawerId) {
    const team = this.players.get(drawerId)?.team ?? 0;
    const events = [];
    for (const st of makeScribble()) {
      events.push({ k: "start", st });
      for (let i = 1; i < st.points.length; i++) events.push({ k: "point", p: st.points[i] });
      events.push({ k: "end", st });
    }
    let i = 0;
    const step = () => {
      if (this.drawerId !== drawerId || this.phase !== "playing") return;
      const e = events[i++];
      if (!e) {
        this._botTimers.push(
          setTimeout(() => {
            if (this.drawerId === drawerId && this.phase === "playing") this.endTurn(true, team);
          }, 2500)
        );
        return;
      }
      if (e.k === "start") {
        this.pending = { tool: e.st.tool, color: e.st.color, size: e.st.size, points: [e.st.points[0]] };
        this.broadcast(JSON.stringify({ type: "draw", op: "start", tool: e.st.tool, color: e.st.color, size: e.st.size, x: e.st.points[0][0], y: e.st.points[0][1] }));
      } else if (e.k === "point") {
        if (this.pending) this.pending.points.push(e.p);
        this.broadcast(JSON.stringify({ type: "draw", op: "point", x: e.p[0], y: e.p[1] }));
      } else {
        if (this.pending) {
          this.strokes.push(this.pending);
          this.pending = null;
        }
        this.broadcast(JSON.stringify({ type: "draw", op: "end" }));
      }
      this._botTimers.push(setTimeout(step, 45));
    };
    this._botTimers.push(setTimeout(step, 700));
  }

  botChatter() {
    const bots = [...this.players.values()].filter((p) => p.isBot);
    if (!bots.length) return;
    const count = Math.min(bots.length, 1 + Math.floor(Math.random() * 2));
    for (let i = 0; i < count; i++) {
      const bot = bots[Math.floor(Math.random() * bots.length)];
      const delay = 2500 + Math.random() * 9000;
      this._botTimers.push(
        setTimeout(() => {
          if (this.phase !== "playing") return;
          this.chat.push({ id: bot.id, name: bot.name, team: bot.team, text: BOT_GUESSES[Math.floor(Math.random() * BOT_GUESSES.length)] });
          if (this.chat.length > 60) this.chat.shift();
          this.broadcastState();
        }, delay)
      );
    }
  }

  pickWord() {
    let w;
    let tries = 0;
    do {
      w = WORDS[Math.floor(Math.random() * WORDS.length)];
      tries++;
    } while (this.recentWords.includes(w) && tries < 50);
    this.recentWords.push(w);
    if (this.recentWords.length > 30) this.recentWords.shift();
    return w;
  }

  // ---- drawing ----
  onDraw(msg, senderId) {
    switch (msg.t) {
      case "d-start":
        this.pending = { tool: msg.tool, color: msg.color, size: msg.size, points: [[msg.x, msg.y]] };
        this.redo = [];
        this.broadcast(JSON.stringify({ type: "draw", op: "start", tool: msg.tool, color: msg.color, size: msg.size, x: msg.x, y: msg.y }), senderId);
        break;
      case "d-point":
        if (this.pending) this.pending.points.push([msg.x, msg.y]);
        this.broadcast(JSON.stringify({ type: "draw", op: "point", x: msg.x, y: msg.y }), senderId);
        break;
      case "d-end":
        if (this.pending) {
          this.strokes.push(this.pending);
          this.pending = null;
        }
        this.broadcast(JSON.stringify({ type: "draw", op: "end" }), senderId);
        break;
      case "d-undo":
        if (this.strokes.length) this.redo.push(this.strokes.pop());
        this.broadcastCanvasAll();
        break;
      case "d-redo":
        if (this.redo.length) this.strokes.push(this.redo.pop());
        this.broadcastCanvasAll();
        break;
      case "d-clear":
        this.strokes = [];
        this.redo = [];
        this.pending = null;
        this.broadcastCanvasAll();
        break;
    }
  }

  // ---- broadcasting ----
  canvasMsg() {
    return JSON.stringify({ type: "canvas", strokes: this.strokes });
  }
  broadcastCanvasAll() {
    this.broadcast(this.canvasMsg());
  }
  broadcastCanvasClear() {
    this.broadcast(JSON.stringify({ type: "canvas", strokes: [] }));
  }

  stateFor(connId) {
    const players = [...this.players.values()].map((p) => ({
      id: p.id,
      name: p.name,
      team: p.team,
      isHost: p.id === this.hostId,
      isDrawer: p.id === this.drawerId,
      isBot: !!p.isBot,
    }));
    let word = null;
    if (this.phase === "playing" && connId === this.drawerId) word = this.word;
    else if (this.phase === "roundEnd") word = this.lastResult?.word ?? null;
    return JSON.stringify({
      type: "state",
      you: connId,
      code: this.id,
      phase: this.phase,
      players,
      teams: this.teams,
      targetScore: this.targetScore,
      drawerId: this.drawerId,
      hostId: this.hostId,
      mask: this.phase === "playing" ? this.mask : null,
      word,
      turnEndsAt: this.turnEndsAt,
      turnMs: TURN_MS,
      chat: this.chat,
      lastResult: this.lastResult,
      winner: this.winner,
      minPlayers: MIN_PLAYERS,
    });
  }
  broadcastState() {
    for (const [cid, ws] of this.connections) if (ws.readyState === 1) ws.send(this.stateFor(cid));
  }

  clearTimers() {
    if (this._turnTimer) clearTimeout(this._turnTimer);
    if (this._roundTimer) clearTimeout(this._roundTimer);
    this._turnTimer = null;
    this._roundTimer = null;
    this._botTimers.forEach(clearTimeout);
    this._botTimers = [];
  }
}

// ---- http + ws server -------------------------------------------------------
const rooms = new Map();

const httpServer = createServer((req, res) => {
  // health check / friendly response for non-websocket GETs (e.g. cloudflared probes)
  res.writeHead(200, { "content-type": "text/plain" });
  res.end(`robopictionary ws ok — ${rooms.size} room(s) active\n`);
});

const wss = new WebSocketServer({ server: httpServer });

wss.on("connection", (ws, req) => {
  // partysocket connects to /parties/main/<code>?name=<name>
  const url = new URL(req.url, "http://localhost");
  const parts = url.pathname.split("/").filter(Boolean);
  const code = parts[parts.length - 1] || "lobby";
  const name = url.searchParams.get("name") || "Player";

  let room = rooms.get(code);
  if (!room) {
    room = new GameRoom(code, () => {
      rooms.delete(code);
      console.log(`[${code}] room closed — ${rooms.size} room(s) active`);
    });
    rooms.set(code, room);
    console.log(`[${code}] room opened — ${rooms.size} room(s) active`);
  }

  const id = room.addConnection(ws, name);
  ws.on("message", (data) => {
    try {
      room.handleMessage(id, data.toString());
    } catch (err) {
      console.error(`[${code}] message error:`, err);
    }
  });
  ws.on("close", () => room.removeConnection(id));
  ws.on("error", (err) => console.error(`[${code}] ws error:`, err.message));
});

httpServer.listen(PORT, () => {
  console.log(`robopictionary server listening on :${PORT}`);
});
