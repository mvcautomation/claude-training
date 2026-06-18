import React, { useState } from 'react'
import Players from './Players.jsx'
import Chat from './Chat.jsx'
import Canvas from './Canvas.jsx'

export default function Game({ room, you, chat, send, canvasRef, onCanvasReady }) {
  const [showPlayers, setShowPlayers] = useState(false)
  const isDrawer = you === room.drawerId
  const { myWord, wordMask, drawerId, phase } = room
  const drawer = room.players.find((p) => p.id === drawerId)

  const wordDisplay = () => {
    if (phase !== 'playing' || !drawerId) {
      return <span className="word-wait">next round starting…</span>
    }
    if (isDrawer) {
      return (
        <>
          <span className="word-label">draw this:</span>
          <span className="word-real">{myWord}</span>
        </>
      )
    }
    return (
      <>
        <span className="word-label">guess the robot action</span>
        <span className="word-mask">{wordMask}</span>
      </>
    )
  }

  return (
    <div className="game">
      {showPlayers && <div className="players-backdrop" onClick={() => setShowPlayers(false)} />}
      <Players open={showPlayers} room={room} you={you} onClose={() => setShowPlayers(false)} />

      <main className="stage">
        <div className="word-bar">
          <button className="mobile-players-btn" onClick={() => setShowPlayers((v) => !v)} title="players">👥</button>
          {wordDisplay()}
          {isDrawer && phase === 'playing' && (
            <span className="you-draw-pill">your turn to draw</span>
          )}
        </div>

        <Canvas
          ref={canvasRef}
          onReady={onCanvasReady}
          isDrawer={isDrawer && phase === 'playing'}
          onStroke={(s) => send({ type: 'drawStroke', stroke: s })}
          onLive={(seg) => send({ type: 'drawLive', seg })}
          onUndo={() => send({ type: 'undo' })}
          onRedo={() => send({ type: 'redo' })}
          onClear={() => send({ type: 'clear' })}
        />

        {!isDrawer && drawer && phase === 'playing' && (
          <div className="stage-foot">{drawer.name} is drawing…</div>
        )}
      </main>

      <Chat
        room={room}
        you={you}
        chat={chat}
        onSend={(t) => send({ type: 'chat', text: t })}
        onGuessedIt={() => send({ type: 'guessedIt' })}
      />
    </div>
  )
}
