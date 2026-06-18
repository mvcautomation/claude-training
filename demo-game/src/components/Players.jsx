import React from 'react'

function Avatar({ name, team }) {
  const initials = name.replace(/[^a-zA-Z0-9 ]/g, '').trim().split(/\s+/).map((w) => w[0]).join('').slice(0, 2).toUpperCase() || '🤖'
  return <span className={`avatar t-${team}`}>{initials}</span>
}

export default function Players({ room, you, open, onClose }) {
  const { players, drawerId, teamNames, scores } = room
  const drawer = players.find((p) => p.id === drawerId)
  const teamA = players.filter((p) => p.team === 'A')
  const teamB = players.filter((p) => p.team === 'B')

  const Row = (p) => (
    <li key={p.id} className={`p-row ${p.id === you ? 'me' : ''} ${!p.connected && !p.isBot ? 'gone' : ''}`}>
      <Avatar name={p.name} team={p.team} />
      <span className="p-name">
        {p.name}
        {p.id === you && <span className="tag-you">you</span>}
        {p.isBot && <span className="tag-bot">bot</span>}
      </span>
      {p.id === drawerId && <span className="p-pencil" title="drawing">✏️</span>}
    </li>
  )

  return (
    <aside className={`players ${open ? 'open' : ''}`}>
      <div className="players-head">
        <span className="logo-dot" /> Players
        <button className="players-close" onClick={onClose} title="close">✕</button>
      </div>

      {drawer && (
        <div className={`drawing-now t-${drawer.team}`}>
          <div className="dn-label">now drawing</div>
          <div className="dn-body">
            <Avatar name={drawer.name} team={drawer.team} />
            <div className="dn-name">{drawer.name}</div>
          </div>
          <div className="dn-team">{teamNames[drawer.team]}</div>
        </div>
      )}

      <div className="team-block">
        <div className="team-title t-A">
          <span className="team-chip A" />{teamNames.A} <b>{scores.A}</b>
        </div>
        <ul className="p-list">{teamA.map(Row)}</ul>
      </div>

      <div className="team-block">
        <div className="team-title t-B">
          <span className="team-chip B" />{teamNames.B} <b>{scores.B}</b>
        </div>
        <ul className="p-list">{teamB.map(Row)}</ul>
      </div>
    </aside>
  )
}
