import React, { useEffect, useRef, useState, useCallback } from 'react'
import { connect } from './net.js'
import Canvas from './components/Canvas.jsx'

const TEAMS = {
  A: { name: 'Bolt', color: '#2d5bff', soft: '#e6ecff', emoji: '⚡' },
  B: { name: 'Spark', color: '#ff5c39', soft: '#ffe8e2', emoji: '✦' },
}
const PALETTE = ['#16161d', '#2d5bff', '#ff5c39', '#16a36b', '#f5b700', '#7b4dff']
const SIZES = [6, 12, 22, 40]

function randomCode() {
  return String(Math.floor(1000 + Math.random() * 9000))
}

function useNow(active) {
  const [, force] = useState(0)
  useEffect(() => {
    if (!active) return
    const t = setInterval(() => force((n) => n + 1), 250)
    return () => clearInterval(t)
  }, [active])
  return Date.now()
}

export default function App() {
  const [screen, setScreen] = useState('home') // home | game (server-driven phase)
  const [state, setState] = useState(null)
  const [playerId, setPlayerId] = useState(null)
  const [myWord, setMyWord] = useState(null)
  const [chat, setChat] = useState([])
  const [connected, setConnected] = useState(false)

  // toolbar
  const [color, setColor] = useState('#16161d')
  const [size, setSize] = useState(12)
  const [tool, setTool] = useState('brush')

  const connRef = useRef(null)
  const canvasRef = useRef(null)
  const tokenRef = useRef(null)
  const myIdRef = useRef(null)
  const prevDrawerRef = useRef(null)

  // persistent token for reconnect / refresh
  if (!tokenRef.current) {
    let t = sessionStorage.getItem('robodraw_token')
    if (!t) {
      t = `t_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 9)}`
      sessionStorage.setItem('robodraw_token', t)
    }
    tokenRef.current = t
  }

  const handleMessage = useCallback((msg) => {
    switch (msg.type) {
      case 'welcome':
        setPlayerId(msg.playerId)
        myIdRef.current = msg.playerId
        break
      case 'state': {
        const newDrawer = msg.currentDrawerId
        if (prevDrawerRef.current !== newDrawer) {
          prevDrawerRef.current = newDrawer
          setChat([])
          if (newDrawer !== myIdRef.current) setMyWord(null)
        }
        if (msg.phase !== 'playing') setMyWord(null)
        setState(msg)
        setScreen('game')
        break
      }
      case 'word':
        setMyWord(msg.word)
        break
      case 'canvas':
        canvasRef.current?.setCanvas(msg.strokes)
        break
      case 'drawStart':
        canvasRef.current?.applyStart(msg.stroke)
        break
      case 'drawPoint':
        canvasRef.current?.applyPoint(msg.id, msg.point)
        break
      case 'drawEnd':
        canvasRef.current?.applyEnd(msg.id)
        break
      case 'chat':
        setChat((c) => [...c.slice(-60), msg])
        break
      default:
        break
    }
  }, [])

  const startConnection = useCallback(
    (code, name) => {
      const c = connect(code, {
        onOpen: () => {
          setConnected(true)
          c.send({ type: 'join', name, token: tokenRef.current })
        },
        onMessage: handleMessage,
        onClose: () => setConnected(false),
      })
      connRef.current = c
    },
    [handleMessage]
  )

  const send = useCallback((obj) => connRef.current?.send(obj), [])

  if (screen === 'home') {
    return <Home onEnter={(code, name) => startConnection(code, name)} />
  }

  if (!state) {
    return <div className="center-screen"><div className="loader">connecting…</div></div>
  }

  const me = state.players.find((p) => p.id === playerId)
  const common = { state, me, send, connected }

  if (state.phase === 'lobby') return <Lobby {...common} />
  if (state.phase === 'gameover') return <GameOver {...common} />

  return (
    <Game
      {...common}
      myWord={myWord}
      chat={chat}
      canvasRef={canvasRef}
      color={color}
      setColor={setColor}
      size={size}
      setSize={setSize}
      tool={tool}
      setTool={setTool}
    />
  )
}

/* --------------------------------------------------------------- HOME ----- */
function Home({ onEnter }) {
  const [mode, setMode] = useState(null) // null | 'create' | 'join'
  const [name, setName] = useState('')
  const [code, setCode] = useState('')

  useEffect(() => {
    // deep-link support: /?room=1234
    const params = new URLSearchParams(window.location.search)
    const r = params.get('room')
    if (r && /^\d{4}$/.test(r)) {
      setMode('join')
      setCode(r)
    }
  }, [])

  function submit(e) {
    e.preventDefault()
    const nm = name.trim() || 'Player'
    if (mode === 'create') {
      onEnter(randomCode(), nm)
    } else if (/^\d{4}$/.test(code.trim())) {
      onEnter(code.trim(), nm)
    }
  }

  return (
    <div className="home">
      <div className="home-bg" aria-hidden="true" />
      <div className="home-card">
        <div className="logo">
          <span className="logo-bot">◓</span>
          <h1>
            ROBO<span className="logo-dot">·</span>DRAW
          </h1>
        </div>
        <p className="tagline">live multiplayer pictionary, where every prompt is a little robot doing something.</p>

        {!mode && (
          <div className="home-actions">
            <button className="btn btn-primary big" onClick={() => setMode('create')}>
              Start a game
            </button>
            <button className="btn btn-ghost big" onClick={() => setMode('join')}>
              Join with a code
            </button>
          </div>
        )}

        {mode && (
          <form className="home-form" onSubmit={submit}>
            <label className="field">
              <span>Your display name</span>
              <input
                autoFocus
                maxLength={20}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Pete"
              />
            </label>

            {mode === 'join' && (
              <label className="field">
                <span>4-digit join code</span>
                <input
                  className="code-input"
                  inputMode="numeric"
                  maxLength={4}
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                  placeholder="0000"
                />
              </label>
            )}

            <div className="home-form-actions">
              <button type="button" className="btn btn-ghost" onClick={() => setMode(null)}>
                ← back
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={mode === 'join' && !/^\d{4}$/.test(code)}
              >
                {mode === 'create' ? 'Create game' : 'Enter'}
              </button>
            </div>
          </form>
        )}
      </div>
      <div className="home-foot">made for goofing off · robots only</div>
    </div>
  )
}

/* -------------------------------------------------------------- LOBBY ----- */
function Lobby({ state, me, send, connected }) {
  const isHost = me?.isHost
  const joinUrl = `${window.location.origin}/?room=${state.code}`
  const [copied, setCopied] = useState(false)

  function copy() {
    navigator.clipboard?.writeText(joinUrl).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    })
  }

  const teamA = state.players.filter((p) => p.team === 'A')
  const teamB = state.players.filter((p) => p.team === 'B')

  return (
    <div className="lobby">
      <div className="home-bg" aria-hidden="true" />
      <div className="lobby-card">
        <div className="lobby-head">
          <div>
            <div className="eyebrow">share this code</div>
            <button className="code-big" onClick={copy} title="click to copy invite link">
              {state.code}
            </button>
            <div className="copy-hint">{copied ? '✓ link copied!' : 'click code to copy invite link'}</div>
          </div>
          <div className="lobby-logo">
            ROBO<span className="logo-dot">·</span>DRAW
          </div>
        </div>

        <div className="teams">
          <TeamColumn team="A" players={teamA} />
          <div className="vs">vs</div>
          <TeamColumn team="B" players={teamB} />
        </div>

        <div className="lobby-controls">
          {isHost ? (
            <>
              <div className="target-pick">
                <span>play to</span>
                {[3, 5, 10].map((n) => (
                  <button
                    key={n}
                    className={`pill ${state.targetScore === n ? 'pill-on' : ''}`}
                    onClick={() => send({ type: 'setTarget', targetScore: n })}
                  >
                    {n}
                  </button>
                ))}
              </div>
              <div className="lobby-buttons">
                <button className="btn btn-ghost" onClick={() => send({ type: 'addBot' })}>
                  + add test bot
                </button>
                <button
                  className="btn btn-primary"
                  disabled={state.players.length < 2}
                  onClick={() => send({ type: 'startGame', targetScore: state.targetScore })}
                >
                  {state.players.length < 2 ? 'need 2+ players' : 'Start game →'}
                </button>
              </div>
            </>
          ) : (
            <div className="waiting">waiting for the host to start… (play to {state.targetScore})</div>
          )}
        </div>
      </div>
      {!connected && <Reconnecting />}
    </div>
  )
}

function TeamColumn({ team, players }) {
  const t = TEAMS[team]
  return (
    <div className="team-col" style={{ '--team': t.color, '--team-soft': t.soft }}>
      <div className="team-title">
        <span className="team-emoji">{t.emoji}</span> Team {t.name}
      </div>
      <div className="team-list">
        {players.length === 0 && <div className="team-empty">no one yet</div>}
        {players.map((p) => (
          <div key={p.id} className={`team-member ${p.connected ? '' : 'is-off'}`}>
            <span className="dot" />
            <span className="member-name">{p.name}</span>
            {p.isHost && <span className="tag tag-host">host</span>}
            {p.isBot && <span className="tag tag-bot">bot</span>}
          </div>
        ))}
      </div>
    </div>
  )
}

/* --------------------------------------------------------------- GAME ----- */
function Game(props) {
  const { state, me, send, myWord, chat, canvasRef, connected } = props
  const now = useNow(true)
  const drawer = state.players.find((p) => p.id === state.currentDrawerId)
  const amDrawer = state.currentDrawerId === me?.id
  const amGuesser = drawer && me && drawer.team === me.team && !amDrawer
  const remaining = Math.max(0, Math.ceil((state.turnEndsAt - now) / 1000))
  const pct = Math.max(0, Math.min(1, (state.turnEndsAt - now) / (state.turnSeconds * 1000)))

  return (
    <div className="game">
      <PlayerSidebar state={state} me={me} drawer={drawer} />

      <main className="stage">
        <TopBar
          amDrawer={amDrawer}
          amGuesser={amGuesser}
          drawer={drawer}
          myWord={myWord}
          masked={state.maskedWord}
          wordLength={state.wordLength}
          remaining={remaining}
          pct={pct}
          onGuessed={() => send({ type: 'guessedIt' })}
        />

        <Canvas
          ref={canvasRef}
          isDrawer={amDrawer}
          color={props.color}
          size={props.size}
          tool={props.tool}
          onStart={(s) => send({ type: 'drawStart', stroke: s })}
          onPoint={(id, point) => send({ type: 'drawPoint', id, point })}
          onEnd={(id) => send({ type: 'drawEnd', id })}
        />

        {amDrawer ? (
          <Toolbar {...props} send={send} />
        ) : (
          <div className="toolbar-spacer">
            {amGuesser ? 'guess in the chat →' : `you're spectating · team ${TEAMS[drawer?.team]?.name} is up`}
          </div>
        )}
      </main>

      <ChatPanel state={state} me={me} chat={chat} send={send} amGuesser={amGuesser} amDrawer={amDrawer} drawer={drawer} />

      {!connected && <Reconnecting />}
    </div>
  )
}

function PlayerSidebar({ state, me, drawer }) {
  const t = drawer ? TEAMS[drawer.team] : null
  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        ROBO<span className="logo-dot">·</span>DRAW
      </div>

      <div className="now-drawing" style={t ? { '--team': t.color, '--team-soft': t.soft } : undefined}>
        <div className="nd-label">✎ now drawing</div>
        <div className="nd-name">{drawer ? drawer.name : '—'}</div>
        {drawer && (
          <div className="nd-team">
            {t.emoji} Team {t.name} {drawer.isBot && <span className="tag tag-bot">bot</span>}
          </div>
        )}
      </div>

      <div className="sidebar-list-label">players</div>
      <div className="sidebar-list">
        {state.players.map((p) => {
          const pt = TEAMS[p.team]
          const isDrawer = p.id === state.currentDrawerId
          return (
            <div key={p.id} className={`player-row ${isDrawer ? 'is-drawing' : ''} ${p.connected ? '' : 'is-off'}`}>
              <span className="prow-dot" style={{ background: pt.color }} />
              <span className="prow-name">
                {p.name}
                {p.id === me?.id && <span className="you">you</span>}
              </span>
              <span className="prow-tags">
                {isDrawer && <span className="mini-pencil">✎</span>}
                {p.isHost && <span className="tag tag-host">host</span>}
                {p.isBot && <span className="tag tag-bot">bot</span>}
              </span>
            </div>
          )
        })}
      </div>
    </aside>
  )
}

function TopBar({ amDrawer, amGuesser, drawer, myWord, masked, wordLength, remaining, pct, onGuessed }) {
  const danger = remaining <= 15
  return (
    <div className="topbar">
      <div className={`timer ${danger ? 'timer-danger' : ''}`}>
        <svg viewBox="0 0 44 44" className="timer-ring">
          <circle cx="22" cy="22" r="19" className="ring-bg" />
          <circle
            cx="22"
            cy="22"
            r="19"
            className="ring-fg"
            style={{ strokeDasharray: 2 * Math.PI * 19, strokeDashoffset: 2 * Math.PI * 19 * (1 - pct) }}
          />
        </svg>
        <span className="timer-num">{remaining}</span>
      </div>

      <div className="word-zone">
        {amDrawer ? (
          <>
            <div className="word-label">draw this!</div>
            <div className="word-actual">{myWord || '…'}</div>
          </>
        ) : (
          <>
            <div className="word-label">{amGuesser ? 'your team is guessing' : `team ${TEAMS[drawer?.team]?.name} is drawing`}</div>
            <div className="word-blanks">{masked || '…'}</div>
            <div className="word-count">{wordLength} letters &amp; spaces</div>
          </>
        )}
      </div>

      <div className="topbar-action">
        {amDrawer && (
          <button className="btn btn-go" onClick={onGuessed}>
            ✓ they guessed it!
          </button>
        )}
      </div>
    </div>
  )
}

function Toolbar({ color, setColor, size, setSize, tool, setTool, send }) {
  return (
    <div className="toolbar">
      <div className="tool-group">
        <button className={`tool ${tool === 'brush' ? 'on' : ''}`} title="brush" onClick={() => setTool('brush')}>
          ✏️
        </button>
        <button className={`tool ${tool === 'eraser' ? 'on' : ''}`} title="eraser" onClick={() => setTool('eraser')}>
          ◻︎
        </button>
      </div>

      <div className="tool-group colors">
        {PALETTE.map((c) => (
          <button
            key={c}
            className={`swatch ${color === c && tool === 'brush' ? 'on' : ''}`}
            style={{ background: c }}
            onClick={() => {
              setColor(c)
              setTool('brush')
            }}
          />
        ))}
        <label className="swatch custom" style={{ background: color }} title="custom color">
          <input
            type="color"
            value={color}
            onChange={(e) => {
              setColor(e.target.value)
              setTool('brush')
            }}
          />
        </label>
      </div>

      <div className="tool-group sizes">
        {SIZES.map((s) => (
          <button key={s} className={`size ${size === s ? 'on' : ''}`} onClick={() => setSize(s)} title={`${s}px`}>
            <span className="size-dot" style={{ width: Math.max(6, s / 2.4), height: Math.max(6, s / 2.4) }} />
          </button>
        ))}
      </div>

      <div className="tool-group">
        <button className="tool" title="undo" onClick={() => send({ type: 'undo' })}>
          ↶
        </button>
        <button className="tool" title="redo" onClick={() => send({ type: 'redo' })}>
          ↷
        </button>
        <button className="tool danger" title="clear" onClick={() => send({ type: 'clear' })}>
          🗑
        </button>
      </div>
    </div>
  )
}

function ChatPanel({ state, me, chat, send, amGuesser, amDrawer, drawer }) {
  const [text, setText] = useState('')
  const listRef = useRef(null)
  useEffect(() => {
    if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight
  }, [chat])

  function submit(e) {
    e.preventDefault()
    const v = text.trim()
    if (!v) return
    send({ type: 'chat', text: v })
    setText('')
  }

  const a = TEAMS.A
  const b = TEAMS.B

  return (
    <aside className="chat">
      <div className="scorebox">
        <div className="score-cell" style={{ '--team': a.color, '--team-soft': a.soft }}>
          <div className="score-team">{a.emoji} {a.name}</div>
          <div className="score-num">{state.scores.A}</div>
        </div>
        <div className="score-mid">
          <span>first to</span>
          <strong>{state.targetScore}</strong>
        </div>
        <div className="score-cell" style={{ '--team': b.color, '--team-soft': b.soft }}>
          <div className="score-team">{b.emoji} {b.name}</div>
          <div className="score-num">{state.scores.B}</div>
        </div>
      </div>

      <div className="chat-head">
        {drawer ? <>guesses · team {TEAMS[drawer.team].name}</> : 'chat'}
      </div>

      <div className="chat-list" ref={listRef}>
        {chat.length === 0 && (
          <div className="chat-empty">
            {amGuesser ? 'shout out your guesses! the drawer hits the button when you nail it.' : amDrawer ? 'your teammates’ guesses will show up here.' : 'only the drawing team can guess this round.'}
          </div>
        )}
        {chat.map((m) => (
          <div key={m.id} className={`bubble ${m.bot ? 'is-bot' : ''}`} style={{ '--team': TEAMS[m.team]?.color }}>
            <span className="bubble-name">{m.name}{m.bot && <span className="tag tag-bot">bot</span>}</span>
            <span className="bubble-text">{m.text}</span>
          </div>
        ))}
      </div>

      <form className="chat-input" onSubmit={submit}>
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          maxLength={120}
          placeholder={amGuesser ? 'type your guess…' : amDrawer ? 'you’re drawing, no guessing!' : 'not your team’s turn'}
          disabled={!amGuesser}
        />
        <button className="btn btn-send" disabled={!amGuesser || !text.trim()}>
          send
        </button>
      </form>
    </aside>
  )
}

/* ------------------------------------------------------------ GAMEOVER ----- */
function GameOver({ state, me, send }) {
  const t = TEAMS[state.winner] || TEAMS.A
  const isHost = me?.isHost
  return (
    <div className="gameover" style={{ '--team': t.color, '--team-soft': t.soft }}>
      <div className="home-bg" aria-hidden="true" />
      <div className="winner-card">
        <div className="confetti" aria-hidden="true">
          {Array.from({ length: 18 }).map((_, i) => (
            <span key={i} style={{ '--i': i }} />
          ))}
        </div>
        <div className="trophy">🏆</div>
        <div className="winner-eyebrow">winner</div>
        <h1 className="winner-name">
          {t.emoji} Team {t.name}
        </h1>
        <div className="winner-score">
          {state.scores.A} <span>–</span> {state.scores.B}
        </div>
        {isHost ? (
          <button className="btn btn-primary big" onClick={() => send({ type: 'playAgain' })}>
            Play again →
          </button>
        ) : (
          <div className="waiting">waiting for host to start a new game…</div>
        )}
      </div>
    </div>
  )
}

function Reconnecting() {
  return <div className="reconnecting">reconnecting…</div>
}
