import React, { useEffect, useRef, useState } from 'react'

function useCountdown(endsAt, active) {
  const [now, setNow] = useState(Date.now())
  useEffect(() => {
    if (!active) return
    const t = setInterval(() => setNow(Date.now()), 250)
    return () => clearInterval(t)
  }, [active, endsAt])
  if (!active || !endsAt) return null
  return Math.max(0, Math.ceil((endsAt - now) / 1000))
}

export default function Chat({ room, you, chat, onSend, onGuessedIt }) {
  const [text, setText] = useState('')
  const listRef = useRef(null)
  const { phase, scores, teamNames, winTarget, drawerId, drawerTeam, turnEndsAt, turnMs } = room

  const me = room.players.find((p) => p.id === you)
  const isDrawer = you === drawerId
  const playing = phase === 'playing'
  const canGuess = playing && me && me.team === drawerTeam && !isDrawer

  const secs = useCountdown(turnEndsAt, playing && !!drawerId)
  const pct = secs != null && turnMs ? Math.max(0, Math.min(100, (secs * 1000 * 100) / turnMs)) : 0

  useEffect(() => {
    const el = listRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [chat])

  const submit = (e) => {
    e.preventDefault()
    const t = text.trim()
    if (!t) return
    onSend(t)
    setText('')
  }

  const placeholder = !playing
    ? 'Game not running'
    : isDrawer
      ? "You're drawing — no guessing!"
      : canGuess
        ? 'Type your guess…'
        : `Only ${teamNames[drawerTeam] || 'the other team'} guesses this round`

  return (
    <section className="chat">
      <div className="scorebox">
        <div className="score-row">
          <div className="score s-A">
            <span className="score-name">{teamNames.A}</span>
            <span className="score-num">{scores.A}</span>
          </div>
          <div className="score-vs">
            <span className="target">first to {winTarget}</span>
          </div>
          <div className="score s-B">
            <span className="score-num">{scores.B}</span>
            <span className="score-name">{teamNames.B}</span>
          </div>
        </div>
        {playing && drawerId && (
          <div className="timer">
            <div className="timer-bar" style={{ width: `${pct}%` }} />
            <span className="timer-num">{secs}s</span>
          </div>
        )}
      </div>

      <div className="chat-list" ref={listRef}>
        {chat.map((m) => {
          if (m.kind === 'system') return <div key={m.id} className="msg system">{m.text}</div>
          if (m.kind === 'correct') return <div key={m.id} className="msg correct">{m.text}</div>
          return (
            <div key={m.id} className="msg guess">
              <span className={`g-name t-${m.team}`}>{m.name}</span>
              <span className="g-text">{m.text}</span>
            </div>
          )
        })}
      </div>

      {isDrawer && playing ? (
        <button className="guessed-btn" onClick={onGuessedIt}>
          ✅ They guessed it!
        </button>
      ) : (
        <form className="chat-input" onSubmit={submit}>
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={placeholder}
            disabled={!canGuess}
            maxLength={120}
          />
          <button type="submit" disabled={!canGuess || !text.trim()}>Send</button>
        </form>
      )}
    </section>
  )
}
