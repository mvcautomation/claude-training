import { WORDS } from "./words.js";

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

/**
 * One server instance == one game room. The 4-digit code IS the room id.
 * All game state lives in memory and resets when the room empties.
 */
export default class Pictionary {
  constructor(room) {
    this.room = room;

    /** @type {Map<string, {id:string,name:string,team:0|1,connected:boolean}>} */
    this.players = new Map();
    this.hostId = null;

    this.phase = "lobby"; // lobby | playing | roundEnd | gameOver
    this.teams = [0, 0];
    this.targetScore = DEFAULT_TARGET;

    this.order = []; // connection ids in draw rotation
    this.turnIndex = 0;
    this.drawerId = null;

    this.word = null;
    this.mask = null;
    this.turnEndsAt = null;

    this.chat = [];
    this.lastResult = null; // {word, guessed, team}
    this.winner = null; // team index
    this.recentWords = [];

    // canvas (authoritative copy for late joiners / undo / clear)
    this.strokes = [];
    this.redo = [];
    this.pending = null;

    this._turnTimer = null;
    this._roundTimer = null;
    this._botTimers = [];
    this._botSeq = 0;
  }

  // ---- connection lifecycle ---------------------------------------------

  onConnect(conn, ctx) {
    const url = new URL(ctx.request.url);
    const name = (url.searchParams.get("name") || "Player").slice(0, 20).trim() || "Player";
    const team = this.balancedTeam();
    this.players.set(conn.id, { id: conn.id, name, team, connected: true });
    if (!this.hostId) this.hostId = conn.id;
    // people who arrive mid-game still join the rotation
    if (this.phase !== "lobby") this.order.push(conn.id);

    this.sendCanvas(conn);
    this.broadcastState();
  }

  onClose(conn) {
    const p = this.players.get(conn.id);
    if (!p) return;
    this.players.delete(conn.id);

    if (this.hostId === conn.id) {
      const next = [...this.players.values()].find((p) => !p.isBot);
      this.hostId = next ? next.id : null;
    }

    if (this.phase === "playing" && this.drawerId === conn.id) {
      this.endTurn(false); // drawer bailed — skip the turn
    } else {
      this.broadcastState();
    }
  }

  onMessage(raw, sender) {
    let msg;
    try {
      msg = JSON.parse(raw);
    } catch {
      return;
    }
    const p = this.players.get(sender.id);
    if (!p) return;

    switch (msg.t) {
      case "start":
        return this.startGame(sender.id, msg);
      case "chat":
        return this.onChat(p, msg.text);
      case "guessed":
        return this.onGuessed(sender.id);
      case "again":
        return this.playAgain(sender.id);
      case "addbot":
        return this.addBot(sender.id);
      case "rmbot":
        return this.removeBot(sender.id);
      case "d-start":
      case "d-point":
      case "d-end":
      case "d-undo":
      case "d-redo":
      case "d-clear":
        if (sender.id !== this.drawerId || this.phase !== "playing") return;
        return this.onDraw(msg, sender);
    }
  }

  // ---- teams & rotation -------------------------------------------------

  balancedTeam() {
    const c = [0, 0];
    for (const p of this.players.values()) if (p.connected) c[p.team]++;
    return c[0] <= c[1] ? 0 : 1;
  }

  rebalance() {
    // even split, alternating, so teams are equal or off-by-one
    const active = [...this.players.values()];
    active.forEach((p, i) => (p.team = i % 2));
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

  // ---- game flow --------------------------------------------------------

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
    this.startTurn();
  }

  startTurn() {
    this.clearTimers();
    // if every human has left, stop the loop instead of letting bots run forever
    if ([...this.room.getConnections()].length === 0) {
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
    this.broadcastCanvasClear();
    this.broadcastState();

    // bot behavior: bot draws + auto-resolves; on a human's turn bots heckle
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
    const team = this.players.get(id).team;
    this.endTurn(true, team);
  }

  onChat(p, text) {
    text = String(text || "").slice(0, 140).trim();
    if (!text) return;
    if (this.phase === "playing" && p.id === this.drawerId) return; // drawer can't guess
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

  // ---- test bots --------------------------------------------------------

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

  // a bot drawer streams a random scribble, then auto-resolves its own turn
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
        // done drawing — resolve a couple seconds later so guessers can react
        this._botTimers.push(
          setTimeout(() => {
            if (this.drawerId === drawerId && this.phase === "playing") this.endTurn(true, team);
          }, 2500)
        );
        return;
      }
      if (e.k === "start") {
        this.pending = { tool: e.st.tool, color: e.st.color, size: e.st.size, points: [e.st.points[0]] };
        this.room.broadcast(
          JSON.stringify({ type: "draw", op: "start", tool: e.st.tool, color: e.st.color, size: e.st.size, x: e.st.points[0][0], y: e.st.points[0][1] })
        );
      } else if (e.k === "point") {
        if (this.pending) this.pending.points.push(e.p);
        this.room.broadcast(JSON.stringify({ type: "draw", op: "point", x: e.p[0], y: e.p[1] }));
      } else {
        if (this.pending) {
          this.strokes.push(this.pending);
          this.pending = null;
        }
        this.room.broadcast(JSON.stringify({ type: "draw", op: "end" }));
      }
      this._botTimers.push(setTimeout(step, 45));
    };
    this._botTimers.push(setTimeout(step, 700));
  }

  // bots throw a few guesses into chat while a human is drawing
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

  // ---- drawing ----------------------------------------------------------

  onDraw(msg, sender) {
    switch (msg.t) {
      case "d-start":
        this.pending = { tool: msg.tool, color: msg.color, size: msg.size, points: [[msg.x, msg.y]] };
        this.redo = [];
        this.room.broadcast(
          JSON.stringify({ type: "draw", op: "start", tool: msg.tool, color: msg.color, size: msg.size, x: msg.x, y: msg.y }),
          [sender.id]
        );
        break;
      case "d-point":
        if (this.pending) this.pending.points.push([msg.x, msg.y]);
        this.room.broadcast(JSON.stringify({ type: "draw", op: "point", x: msg.x, y: msg.y }), [sender.id]);
        break;
      case "d-end":
        if (this.pending) {
          this.strokes.push(this.pending);
          this.pending = null;
        }
        this.room.broadcast(JSON.stringify({ type: "draw", op: "end" }), [sender.id]);
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

  // ---- broadcasting -----------------------------------------------------

  canvasMsg() {
    return JSON.stringify({ type: "canvas", strokes: this.strokes });
  }
  sendCanvas(conn) {
    conn.send(this.canvasMsg());
  }
  broadcastCanvasAll() {
    this.room.broadcast(this.canvasMsg());
  }
  broadcastCanvasClear() {
    this.room.broadcast(JSON.stringify({ type: "canvas", strokes: [] }));
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
      code: this.room.id,
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
    for (const conn of this.room.getConnections()) {
      conn.send(this.stateFor(conn.id));
    }
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
