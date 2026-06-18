import React, { useCallback, useEffect, useRef, useState } from 'react'
import { createConnection, clientId, randomCode } from './net.js'
import Game from './components/Game.jsx'

export default function App() {
  const [code, setCode] = useState('')
  const [you, setYou] = useState(null)
  const [room, setRoom] = useState(null)
  const [chat, setChat] = useState([])
  const [status, setStatus] = useState('home') // home | connecting | live
  const [error, setError] = useState('')

  const connRef = useRef(null)
  const canvasRef = useRef(null)
  const boardRef = useRef([]) // last known full strokes (for late canvas mount)
  const nameRef = useRef('')

  const send = useCallback((msg) => connRef.current && connRef.current.send(msg), [])

  const handleMessage = useCallback((msg) => {
    switch (msg.type) {
      case 'state':
        setYou(msg.you)
        setRoom(msg.room)
        setStatus('live')
        break
      case 'chatHistory':
        setChat(msg.messages || [])
        break
      case 'chat':
        setChat((c) => [...c.slice(-79), msg.message])
        break
      case 'canvasState':
        boardRef.current = msg.strokes || []
        canvasRef.current && canvasRef.current.applyCanvasState(boardRef.current)
        break
      case 'drawStroke':
        boardRef.current = [...boardRef.current, msg.stroke]
        canvasRef.current && canvasRef.current.applyCommit(msg.stroke)
        break
      case 'drawLive':
        canvasRef.current && canvasRef.current.applyLive(msg.seg)
        break
      default:
        break
    }
  }, [])

  const connect = useCallback((joinCode, name) => {
    setStatus('connecting')
    setError('')
    nameRef.current = name
    setCode(joinCode)
    window.location.hash = joinCode
    if (connRef.current) connRef.current.close()
    connRef.current = createConnection(joinCode, {
      onMessage: handleMessage,
      onOpen: () => send({ type: 'join', name, clientId: clientId() }),
    })
  }, [handleMessage, send])

  // Reset board cache when a fresh empty canvas state comes in (new turn).
  const onCanvasReady = useCallback(() => {
    canvasRef.current && canvasRef.current.applyCanvasState(boardRef.current)
  }, [])

  useEffect(() => () => connRef.current && connRef.current.close(), [])

  if (status === 'home' || status === 'connecting') {
    return <Home onConnect={connect} status={status} error={error} />
  }

  if (!room) return <div className="loading">Connecting…</div>

  if (room.phase === 'lobby') {
    return <Lobby room={room} you={you} code={code} send={send} />
  }

  if (room.phase === 'over') {
    return <Winner room={room} you={you} send={send} />
  }

  return (
    <Game
      room={room}
      you={you}
      chat={chat}
      send={send}
      canvasRef={canvasRef}
      onCanvasReady={onCanvasReady}
    />
  )
}

/* ----------------------------- Home screen ----------------------------- */
function Home({ onConnect, status, error }) {
  const hashCode = (window.location.hash || '').replace('#', '').replace(/\D/g, '').slice(0, 4)
  const [name, setName] = useState(localStorage.getItem('robodraw_name') || '')
  const [join, setJoin] = useState(hashCode)
  const [mode, setMode] = useState(hashCode ? 'join' : null)

  const go = (codeToUse) => {
    const n = name.trim()
    if (!n) return
    localStorage.setItem('robodraw_name', n)
    onConnect(codeToUse, n)
  }

  const start = () => go(randomCode())
  const joinGame = () => {
    if (join.length === 4) go(join)
  }

  return (
    <div className="home">
      <div className="home-bg" />
      <div className="home-card">
        <div className="brand">
          <span className="brand-bot">🤖</span>
          <h1 className="brand-name">ROBO<span>·</span>DRAW</h1>
          <p className="brand-tag">live multiplayer robot pictionary</p>
        </div>

        <label className="field">
          <span>your name</span>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Sketchy Sam"
            maxLength={18}
            autoFocus
          />
        </label>

        {mode !== 'join' && (
          <button className="big-btn primary" disabled={!name.trim() || status === 'connecting'} onClick={start}>
            Start a new game
          </button>
        )}

        {mode === 'join' ? (
          <div className="join-row">
            <input
              className="code-input"
              value={join}
              onChange={(e) => setJoin(e.target.value.replace(/\D/g, '').slice(0, 4))}
              placeholder="0000"
              inputMode="numeric"
              maxLength={4}
            />
            <button className="big-btn primary" disabled={join.length !== 4 || !name.trim()} onClick={joinGame}>
              Join
            </button>
          </div>
        ) : (
          <button className="big-btn ghost" onClick={() => setMode('join')}>
            Join with a code
          </button>
        )}

        {mode === 'join' && (
          <button className="link-btn" onClick={() => setMode(null)}>← start a game instead</button>
        )}

        {status === 'connecting' && <div className="hint">Connecting…</div>}
        {error && <div className="hint err">{error}</div>}
      </div>
      <div className="home-foot">draw a robot. your team guesses. first to the target wins.</div>
    </div>
  )
}

/* ----------------------------- Lobby screen ----------------------------- */
function Lobby({ room, you, code, send }) {
  const isHost = you === room.hostId
  const [copied, setCopied] = useState(false)
  const enough = room.players.filter((p) => p.isBot || p.connected).length >= 2

  const copyLink = () => {
    const url = `${window.location.origin}/#${code}`
    navigator.clipboard?.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <div className="lobby">
      <div className="home-bg" />
      <div className="lobby-card">
        <div className="lobby-head">
          <h2>Lobby</h2>
          <div className="code-badge" onClick={copyLink} title="click to copy invite link">
            <span className="cb-label">join code</span>
            <span className="cb-code">{code}</span>
            <span className="cb-copy">{copied ? 'link copied!' : 'copy link'}</span>
          </div>
        </div>

        <div className="lobby-teams">
          {['A', 'B'].map((t) => (
            <div key={t} className={`lobby-team t-${t}`}>
              <div className="lt-head">
                <span className={`team-chip ${t}`} />
                {room.teamNames[t]}
              </div>
              <ul>
                {room.players.filter((p) => p.team === t).map((p) => (
                  <li key={p.id} className={p.id === you ? 'me' : ''}>
                    {p.name}
                    {p.id === room.hostId && <span className="tag-host">host</span>}
                    {p.id === you && <span className="tag-you">you</span>}
                    {p.isBot && <span className="tag-bot">bot</span>}
                  </li>
                ))}
                {!room.players.filter((p) => p.team === t).length && <li className="empty">—</li>}
              </ul>
            </div>
          ))}
        </div>

        {isHost ? (
          <div className="lobby-controls">
            <div className="target-pick">
              <span>first to</span>
              {[3, 5, 10].map((n) => (
                <button
                  key={n}
                  className={`pill ${room.winTarget === n ? 'on' : ''}`}
                  onClick={() => send({ type: 'setTarget', winTarget: n })}
                >{n}</button>
              ))}
            </div>
            <div className="lobby-actions">
              <button className="big-btn ghost" onClick={() => send({ type: 'addBot' })}>
                + add test bot
              </button>
              <button className="big-btn primary" disabled={!enough} onClick={() => send({ type: 'start', winTarget: room.winTarget })}>
                Start game
              </button>
            </div>
            {!enough && <div className="hint">Need at least 2 players — add a test bot to play solo.</div>}
          </div>
        ) : (
          <div className="hint center">Waiting for the host to start… (first to {room.winTarget})</div>
        )}
      </div>
    </div>
  )
}

/* ----------------------------- Winner screen ----------------------------- */
function Winner({ room, you, send }) {
  const isHost = you === room.hostId
  const w = room.winner
  return (
    <div className="winner">
      <div className="home-bg" />
      <div className="winner-card">
        <div className="confetti">🎉</div>
        <div className={`win-team t-${w}`}>{room.teamNames[w]}</div>
        <div className="win-sub">wins the game!</div>
        <div className="final-score">
          <span className="fs s-A">{room.teamNames.A} {room.scores.A}</span>
          <span className="fs-dash">—</span>
          <span className="fs s-B">{room.scores.B} {room.teamNames.B}</span>
        </div>
        {isHost ? (
          <button className="big-btn primary" onClick={() => send({ type: 'playAgain' })}>
            Play again
          </button>
        ) : (
          <div className="hint center">Waiting for the host to start a new game…</div>
        )}
      </div>
    </div>
  )
}
