import { useEffect, useMemo, useRef, useState } from "react";
import usePartySocket from "partysocket/react";
import Canvas from "./Canvas.jsx";
import { PARTYKIT_HOST, TEAM_NAMES, TEAM_COLORS } from "./config.js";

const COLORS = ["#1b1b1f", "#ff5a3c", "#ff9f1c", "#ffd23f", "#3cba54", "#1ca6b8", "#3a6df0", "#9b5de5", "#f15bb5", "#8a5a2b"];
const SIZES = [3, 7, 14, 26]; // logical px at 900-wide reference

export default function Room({ code, name, onLeave }) {
  const [state, setState] = useState(null);
  const [connected, setConnected] = useState(false);

  const socket = usePartySocket({
    host: PARTYKIT_HOST,
    room: code,
    query: { name },
    onOpen: () => setConnected(true),
    onClose: () => setConnected(false),
    onMessage(e) {
      let msg;
      try {
        msg = JSON.parse(e.data);
      } catch {
        return;
      }
      if (msg.type === "state") setState(msg);
    },
  });

  if (!state) {
    return (
      <div className="loading">
        <div className="spinner" />
        <p>connecting to game {code}…</p>
        <button className="link-back" onClick={onLeave}>← leave</button>
      </div>
    );
  }

  const me = state.players.find((p) => p.id === state.you);
  const isDrawer = state.drawerId === state.you;
  const isHost = state.hostId === state.you;

  return (
    <div className="room">
      {state.phase === "lobby" && <Lobby state={state} me={me} isHost={isHost} socket={socket} onLeave={onLeave} connected={connected} />}
      {(state.phase === "playing" || state.phase === "roundEnd") && (
        <Game state={state} me={me} isDrawer={isDrawer} socket={socket} onLeave={onLeave} />
      )}
      {state.phase === "gameOver" && <GameOver state={state} isHost={isHost} socket={socket} onLeave={onLeave} />}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Lobby
// ---------------------------------------------------------------------------
function Lobby({ state, me, isHost, socket, onLeave, connected }) {
  const [target, setTarget] = useState(state.targetScore || 5);
  const counts = teamCounts(state.players);
  const canStart = state.players.length >= state.minPlayers && counts[0] >= 1 && counts[1] >= 1;
  // after rebalance both teams will have >=2 when total >=4, so total is the gate
  const enoughPlayers = state.players.length >= state.minPlayers;

  return (
    <div className="lobby">
      <div className="lobby-card">
        <button className="link-back top-left" onClick={onLeave}>← leave</button>
        <p className="eyebrow">game code</p>
        <div className="code-display">{state.code}</div>
        <p className="lobby-hint">share this code so friends can join {connected ? "" : "· reconnecting…"}</p>

        <div className="lobby-players">
          <p className="eyebrow">in the lobby · {state.players.length}</p>
          <ul className="player-chips">
            {state.players.map((p) => (
              <li key={p.id} className="player-chip" style={{ "--c": TEAM_COLORS[p.team] }}>
                <span className="dot" />
                {p.name}
                {p.isHost && <span className="host-tag">host</span>}
                {p.id === me?.id && <span className="you-tag">you</span>}
              </li>
            ))}
          </ul>
        </div>

        {isHost ? (
          <div className="host-controls">
            <label className="target-row">
              <span>first team to</span>
              <select value={target} onChange={(e) => setTarget(Number(e.target.value))}>
                <option value={3}>3</option>
                <option value={5}>5</option>
                <option value={10}>10</option>
              </select>
              <span>points wins</span>
            </label>
            <button
              className="btn btn-primary big"
              disabled={!enoughPlayers}
              onClick={() => socket.send(JSON.stringify({ t: "start", target }))}
            >
              {enoughPlayers ? "start game" : `need ${state.minPlayers - state.players.length} more player(s)`}
            </button>
            <p className="fineprint">players will be auto-split into two teams</p>
          </div>
        ) : (
          <div className="host-controls">
            <p className="waiting">waiting for the host to start…</p>
            {!enoughPlayers && <p className="fineprint">need at least {state.minPlayers} players</p>}
          </div>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Game
// ---------------------------------------------------------------------------
function Game({ state, me, isDrawer, socket, onLeave }) {
  const [tool, setTool] = useState("brush");
  const [color, setColor] = useState(COLORS[0]);
  const [size, setSize] = useState(SIZES[1]);
  const drawer = state.players.find((p) => p.id === state.drawerId);
  const roundEnd = state.phase === "roundEnd";

  return (
    <div className="game">
      <Sidebar state={state} me={me} drawer={drawer} onLeave={onLeave} />

      <main className="stage">
        <div className="stage-top">
          <WordBar state={state} isDrawer={isDrawer} />
          <Timer state={state} />
        </div>

        <div className="canvas-area">
          <Canvas socket={socket} isDrawer={isDrawer} tool={tool} color={color} size={size} />
          {roundEnd && <RoundOverlay state={state} />}
        </div>

        {isDrawer && !roundEnd ? (
          <Toolbar
            tool={tool}
            setTool={setTool}
            color={color}
            setColor={setColor}
            size={size}
            setSize={setSize}
            socket={socket}
            onGuessed={() => socket.send(JSON.stringify({ t: "guessed" }))}
          />
        ) : (
          <div className="toolbar-placeholder">
            {roundEnd ? "next turn starting…" : `${drawer?.name || "someone"} is drawing — type your guess →`}
          </div>
        )}
      </main>

      <Chat state={state} me={me} isDrawer={isDrawer} socket={socket} />
    </div>
  );
}

function WordBar({ state, isDrawer }) {
  if (isDrawer) {
    return (
      <div className="wordbar drawer-word">
        <span className="wordbar-label">you draw</span>
        <span className="wordbar-word">{state.word}</span>
      </div>
    );
  }
  // guessers see masked blanks
  const groups = (state.mask || "").split(" ");
  return (
    <div className="wordbar">
      <span className="wordbar-label">guess this</span>
      <span className="mask">
        {groups.map((g, i) => (
          <span className="mask-word" key={i}>
            {g.split("").map((ch, j) => (
              <span className="mask-ch" key={j}>
                {ch}
              </span>
            ))}
          </span>
        ))}
      </span>
    </div>
  );
}

function Timer({ state }) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    if (!state.turnEndsAt) return;
    const id = setInterval(() => setNow(Date.now()), 200);
    return () => clearInterval(id);
  }, [state.turnEndsAt]);

  if (!state.turnEndsAt) return <div className="timer paused">—</div>;
  const remaining = Math.max(0, state.turnEndsAt - now);
  const secs = Math.ceil(remaining / 1000);
  const pct = Math.max(0, Math.min(1, remaining / state.turnMs));
  const low = secs <= 15;
  return (
    <div className={"timer" + (low ? " low" : "")}>
      <svg viewBox="0 0 36 36" className="timer-ring">
        <circle className="ring-bg" cx="18" cy="18" r="16" />
        <circle
          className="ring-fg"
          cx="18"
          cy="18"
          r="16"
          style={{ strokeDasharray: `${pct * 100.5} 100.5` }}
        />
      </svg>
      <span className="timer-num">{secs}</span>
    </div>
  );
}

function RoundOverlay({ state }) {
  const r = state.lastResult;
  if (!r) return null;
  return (
    <div className="round-overlay">
      <div className="round-card">
        {r.guessed ? (
          <>
            <p className="round-emoji">🎉</p>
            <p className="round-head" style={{ color: TEAM_COLORS[r.team] }}>
              {TEAM_NAMES[r.team]} scored!
            </p>
          </>
        ) : (
          <>
            <p className="round-emoji">⏱️</p>
            <p className="round-head">time's up!</p>
          </>
        )}
        <p className="round-word-label">the word was</p>
        <p className="round-word">{r.word}</p>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sidebar: scoreboard lives at the top of chat (right). Player list is here.
// ---------------------------------------------------------------------------
function Sidebar({ state, me, drawer, onLeave }) {
  const byTeam = [0, 1].map((t) => state.players.filter((p) => p.team === t));
  return (
    <aside className="sidebar">
      <div className="now-drawing" style={{ "--c": drawer ? TEAM_COLORS[drawer.team] : "#999" }}>
        <span className="nd-label">✏️ currently drawing</span>
        <span className="nd-name">{drawer?.name || "—"}</span>
        {drawer && <span className="nd-team">{TEAM_NAMES[drawer.team]}</span>}
      </div>

      <div className="player-list">
        {[0, 1].map((t) => (
          <div className="team-block" key={t} style={{ "--c": TEAM_COLORS[t] }}>
            <p className="team-name">{TEAM_NAMES[t]}</p>
            <ul>
              {byTeam[t].map((p) => (
                <li key={p.id} className={p.isDrawer ? "drawing" : ""}>
                  <span className="dot" />
                  <span className="pname">{p.name}</span>
                  {p.id === me?.id && <span className="you-tag">you</span>}
                  {p.isDrawer && <span className="pen">✏️</span>}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <button className="link-back" onClick={onLeave}>← leave game</button>
    </aside>
  );
}

// ---------------------------------------------------------------------------
// Toolbar (drawer only)
// ---------------------------------------------------------------------------
function Toolbar({ tool, setTool, color, setColor, size, setSize, socket, onGuessed }) {
  return (
    <div className="toolbar">
      <div className="tool-group colors">
        {COLORS.map((c) => (
          <button
            key={c}
            className={"swatch" + (color === c && tool === "brush" ? " active" : "")}
            style={{ background: c }}
            onClick={() => {
              setColor(c);
              setTool("brush");
            }}
            aria-label={"color " + c}
          />
        ))}
      </div>

      <div className="tool-group sizes">
        {SIZES.map((s) => (
          <button key={s} className={"size-btn" + (size === s ? " active" : "")} onClick={() => setSize(s)}>
            <span className="size-dot" style={{ width: s, height: s }} />
          </button>
        ))}
      </div>

      <div className="tool-group actions">
        <button className={"tool-btn" + (tool === "brush" ? " active" : "")} onClick={() => setTool("brush")} title="brush">
          🖌️
        </button>
        <button className={"tool-btn" + (tool === "eraser" ? " active" : "")} onClick={() => setTool("eraser")} title="eraser">
          🩹
        </button>
        <button className="tool-btn" onClick={() => socket.send(JSON.stringify({ t: "d-undo" }))} title="undo">
          ↩️
        </button>
        <button className="tool-btn" onClick={() => socket.send(JSON.stringify({ t: "d-redo" }))} title="redo">
          ↪️
        </button>
        <button className="tool-btn danger" onClick={() => socket.send(JSON.stringify({ t: "d-clear" }))} title="clear">
          🗑️
        </button>
      </div>

      <button className="btn btn-guessed" onClick={onGuessed}>
        ✓ they guessed it!
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Chat + scoreboard (right column)
// ---------------------------------------------------------------------------
function Chat({ state, me, isDrawer, socket }) {
  const [text, setText] = useState("");
  const listRef = useRef(null);

  useEffect(() => {
    const el = listRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [state.chat]);

  function send(e) {
    e.preventDefault();
    const t = text.trim();
    if (!t) return;
    socket.send(JSON.stringify({ t: "chat", text: t }));
    setText("");
  }

  const playing = state.phase === "playing";
  const lockedForDrawer = playing && isDrawer;

  return (
    <section className="chat">
      <div className="scorebox">
        {[0, 1].map((t) => (
          <div className="score-team" key={t} style={{ "--c": TEAM_COLORS[t] }}>
            <span className="score-name">{TEAM_NAMES[t]}</span>
            <span className="score-num">{state.teams[t]}</span>
          </div>
        ))}
        <span className="score-target">to {state.targetScore}</span>
      </div>

      <div className="chat-list" ref={listRef}>
        {state.chat.length === 0 && <p className="chat-empty">guesses show up here…</p>}
        {state.chat.map((m, i) => (
          <div className="chat-msg" key={i}>
            <span className="chat-name" style={{ color: TEAM_COLORS[m.team] }}>
              {m.name}
            </span>
            <span className="chat-text">{m.text}</span>
          </div>
        ))}
      </div>

      <form className="chat-input" onSubmit={send}>
        <input
          value={text}
          maxLength={140}
          disabled={lockedForDrawer}
          placeholder={lockedForDrawer ? "you're drawing — no guessing 🤫" : "type your guess…"}
          onChange={(e) => setText(e.target.value)}
        />
        <button className="btn btn-primary" type="submit" disabled={lockedForDrawer}>
          send
        </button>
      </form>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Game over
// ---------------------------------------------------------------------------
function GameOver({ state, isHost, socket, onLeave }) {
  const win = state.winner;
  const tie = win === null;
  return (
    <div className="lobby">
      <div className="lobby-card gameover">
        <p className="round-emoji big">{tie ? "🤝" : "🏆"}</p>
        <h2 className="go-head" style={{ color: tie ? "#1b1b1f" : TEAM_COLORS[win] }}>
          {tie ? "it's a tie!" : `${TEAM_NAMES[win]} win!`}
        </h2>
        <div className="go-scores">
          {[0, 1].map((t) => (
            <div key={t} className="go-score" style={{ "--c": TEAM_COLORS[t] }}>
              <span>{TEAM_NAMES[t]}</span>
              <strong>{state.teams[t]}</strong>
            </div>
          ))}
        </div>
        {isHost ? (
          <button className="btn btn-primary big" onClick={() => socket.send(JSON.stringify({ t: "again" }))}>
            play again
          </button>
        ) : (
          <p className="waiting">waiting for the host to start a new game…</p>
        )}
        <button className="link-back" onClick={onLeave}>← leave game</button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
function teamCounts(players) {
  const c = [0, 0];
  for (const p of players) c[p.team]++;
  return c;
}
