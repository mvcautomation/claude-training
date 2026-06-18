import http from 'node:http'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { WebSocketServer } from 'ws'
import { WORDS } from './words.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const DIST = path.join(__dirname, '..', 'dist')
const PORT = process.env.PORT || 3200
const TURN_MS = 90_000

const log = (...a) => console.log(new Date().toISOString(), ...a)

// ---------------------------------------------------------------------------
// Static file server (serves the built Vite client from dist/)
// ---------------------------------------------------------------------------
const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
}

function serveStatic(req, res) {
  let urlPath = decodeURIComponent((req.url || '/').split('?')[0])
  if (urlPath === '/') urlPath = '/index.html'
  let filePath = path.join(DIST, urlPath)
  // Prevent path traversal
  if (!filePath.startsWith(DIST)) filePath = path.join(DIST, 'index.html')

  fs.readFile(filePath, (err, data) => {
    if (err) {
      // SPA fallback
      fs.readFile(path.join(DIST, 'index.html'), (e2, html) => {
        if (e2) {
          res.writeHead(404)
          res.end('Not found. Did you run `npm run build`?')
          return
        }
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' })
        res.end(html)
      })
      return
    }
    const ext = path.extname(filePath)
    res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' })
    res.end(data)
  })
}

const server = http.createServer((req, res) => {
  if (req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ ok: true, rooms: rooms.size }))
    return
  }
  serveStatic(req, res)
})

// ---------------------------------------------------------------------------
// Game state
// ---------------------------------------------------------------------------
/** @type {Map<string, Room>} */
const rooms = new Map()

const TEAM_NAMES = { A: 'Team Bolt', B: 'Team Volt' }
const BOT_NAMES = [
  'BeepBot', 'GuessTron', 'Sketch-9', 'Cognito', 'Pixel', 'Doodlebot',
  'Circuit', 'Widget', 'Nova-7', 'Clank', 'Bolt Jr', 'Gizmo',
]
const WRONG_GUESSES = [
  'a dog?', 'is that a house', 'robot eating?', 'a spaceship!', 'dancing??',
  'pizza', 'a cat lol', 'robot running', 'no idea haha', 'a tree?',
  'jumping?', 'umm a car', 'robot waving', 'sleeping robot', 'a hat',
  'is it sports', 'looks like a fish', 'flying?', 'a guitar maybe',
]

let pidCounter = 1
const newId = () => `p${pidCounter++}`

function makeRoom(code) {
  const room = {
    code,
    phase: 'lobby', // 'lobby' | 'playing' | 'over'
    hostId: null,
    winTarget: 5,
    scores: { A: 0, B: 0 },
    players: new Map(), // id -> player
    sockets: new Map(), // id -> ws (human only)
    turnOrder: [], // array of player ids in rotation
    drawerId: null,
    word: null,
    recentWords: [],
    turnEndsAt: 0,
    winner: null,
    strokes: [], // committed strokes [{id, tool, color, size, points:[{x,y}]}]
    redo: [],
    chat: [], // last messages
    timers: [], // pending setTimeout handles (turn timer + bot timers)
  }
  rooms.set(code, room)
  log(`ROOM created ${code}`)
  return room
}

function getRoom(code) {
  return rooms.get(code) || makeRoom(code)
}

function clearTimers(room) {
  for (const t of room.timers) clearTimeout(t)
  room.timers = []
}

function later(room, fn, ms) {
  const t = setTimeout(() => {
    room.timers = room.timers.filter((x) => x !== t)
    try { fn() } catch (e) { log('timer error', e) }
  }, ms)
  room.timers.push(t)
  return t
}

function teamCounts(room) {
  let a = 0, b = 0
  for (const p of room.players.values()) {
    if (p.team === 'A') a++
    else if (p.team === 'B') b++
  }
  return { a, b }
}

function assignTeam(room) {
  const { a, b } = teamCounts(room)
  return a <= b ? 'A' : 'B'
}

function maskWord(w) {
  return w
    .split(' ')
    .map((part) => part.split('').map(() => '_').join(' '))
    .join('   ')
}

function publicPlayers(room) {
  return room.turnOrder
    .map((id) => room.players.get(id))
    .filter(Boolean)
    .map((p) => ({
      id: p.id,
      name: p.name,
      team: p.team,
      isBot: p.isBot,
      connected: p.connected,
    }))
}

function buildState(room, viewerId) {
  const isDrawer = viewerId && viewerId === room.drawerId
  return {
    type: 'state',
    you: viewerId,
    room: {
      code: room.code,
      phase: room.phase,
      hostId: room.hostId,
      winTarget: room.winTarget,
      scores: room.scores,
      teamNames: TEAM_NAMES,
      players: publicPlayers(room),
      drawerId: room.drawerId,
      drawerTeam: room.drawerId ? room.players.get(room.drawerId)?.team : null,
      turnEndsAt: room.turnEndsAt,
      turnMs: TURN_MS,
      winner: room.winner,
      myWord: isDrawer ? room.word : null,
      wordMask: room.word ? maskWord(room.word) : null,
      wordLen: room.word ? room.word.replace(/ /g, '').length : 0,
    },
  }
}

function send(ws, msg) {
  if (ws && ws.readyState === 1) ws.send(JSON.stringify(msg))
}

function broadcast(room, msg, exceptId = null) {
  for (const [id, ws] of room.sockets) {
    if (id === exceptId) continue
    send(ws, msg)
  }
}

// Send personalized state to every human (drawer sees the word, others don't)
function broadcastState(room) {
  for (const [id, ws] of room.sockets) {
    send(ws, buildState(room, id))
  }
}

function pushChat(room, message) {
  const msg = { id: newId(), ...message }
  room.chat.push(msg)
  if (room.chat.length > 80) room.chat.shift()
  broadcast(room, { type: 'chat', message: msg })
  return msg
}

// ---------------------------------------------------------------------------
// Turn / scoring flow
// ---------------------------------------------------------------------------
function connectedPlayerIds(room) {
  return room.turnOrder.filter((id) => {
    const p = room.players.get(id)
    return p && (p.isBot || p.connected)
  })
}

function startGame(room, winTarget) {
  room.winTarget = [3, 5, 10].includes(winTarget) ? winTarget : 5
  room.scores = { A: 0, B: 0 }
  room.winner = null
  room.phase = 'playing'
  // Start rotation at first connected player
  room.drawerCursor = -1
  log(`GAME start ${room.code} target=${room.winTarget} players=${room.turnOrder.length}`)
  pushChat(room, { kind: 'system', text: `Game on! First to ${room.winTarget} wins.` })
  startTurn(room)
}

function startTurn(room) {
  clearTimers(room)
  const ids = connectedPlayerIds(room)
  if (ids.length < 2) {
    // not enough players to continue
    room.phase = 'lobby'
    room.drawerId = null
    room.word = null
    pushChat(room, { kind: 'system', text: 'Not enough players — back to the lobby.' })
    broadcastState(room)
    return
  }
  // advance cursor to next connected player
  let next = (room.drawerCursor ?? -1)
  for (let i = 0; i < room.turnOrder.length + 1; i++) {
    next = (next + 1) % room.turnOrder.length
    const p = room.players.get(room.turnOrder[next])
    if (p && (p.isBot || p.connected)) break
  }
  room.drawerCursor = next
  room.drawerId = room.turnOrder[next]
  room.word = pickWord(room)
  room.strokes = []
  room.redo = []
  room.turnEndsAt = Date.now() + TURN_MS

  const drawer = room.players.get(room.drawerId)
  log(`TURN start ${room.code} drawer=${drawer.name}(${drawer.team}) word="${room.word}"`)
  broadcast(room, { type: 'canvasState', strokes: [] })
  broadcastState(room)
  pushChat(room, {
    kind: 'system',
    text: `${drawer.name} is drawing for ${TEAM_NAMES[drawer.team]}!`,
  })

  // turn timer (unguessed -> rotate, no points)
  later(room, () => {
    pushChat(room, { kind: 'system', text: `Time! The answer was "${room.word}". No points.` })
    nextTurn(room)
  }, TURN_MS)

  if (drawer.isBot) scheduleBotDrawer(room)
  scheduleBotGuessers(room)
}

function pickWord(room) {
  const pool = WORDS.filter((w) => !room.recentWords.includes(w))
  const list = pool.length ? pool : WORDS
  const w = list[Math.floor(Math.random() * list.length)]
  room.recentWords.push(w)
  if (room.recentWords.length > 25) room.recentWords.shift()
  return w
}

function awardPoint(room, byName) {
  if (room.phase !== 'playing' || !room.drawerId) return
  const drawer = room.players.get(room.drawerId)
  if (!drawer) return
  const team = drawer.team
  room.scores[team]++
  log(`SCORE ${room.code} ${TEAM_NAMES[team]}=${room.scores[team]} word="${room.word}"`)
  pushChat(room, {
    kind: 'correct',
    text: `✅ ${TEAM_NAMES[team]} got it! "${room.word}" +1`,
  })
  if (room.scores[team] >= room.winTarget) {
    endGame(room, team)
    return
  }
  nextTurn(room)
}

function nextTurn(room) {
  clearTimers(room)
  // small pause between turns
  room.drawerId = null
  room.word = null
  broadcastState(room)
  later(room, () => startTurn(room), 2200)
}

function endGame(room, team) {
  clearTimers(room)
  room.phase = 'over'
  room.winner = team
  room.drawerId = null
  room.word = null
  log(`GAME over ${room.code} winner=${TEAM_NAMES[team]}`)
  pushChat(room, { kind: 'system', text: `🏆 ${TEAM_NAMES[team]} wins the game!` })
  broadcastState(room)
}

function resetToLobby(room) {
  clearTimers(room)
  room.phase = 'lobby'
  room.winner = null
  room.scores = { A: 0, B: 0 }
  room.drawerId = null
  room.word = null
  room.strokes = []
  room.redo = []
  broadcast(room, { type: 'canvasState', strokes: [] })
  broadcastState(room)
}

// ---------------------------------------------------------------------------
// Bots
// ---------------------------------------------------------------------------
function addBot(room) {
  const used = new Set([...room.players.values()].map((p) => p.name))
  const name = BOT_NAMES.find((n) => !used.has(n)) || `Bot ${room.players.size}`
  const id = newId()
  const team = assignTeam(room)
  room.players.set(id, { id, name, team, isBot: true, connected: true })
  room.turnOrder.push(id)
  log(`BOT added ${room.code} ${name} (${team})`)
  broadcastState(room)
}

function teammatesOf(room, drawerId) {
  const drawer = room.players.get(drawerId)
  if (!drawer) return []
  return [...room.players.values()].filter(
    (p) => p.team === drawer.team && p.id !== drawerId && (p.isBot || p.connected)
  )
}

// A bot drawer scribbles some random strokes, then resolves the turn.
function scheduleBotDrawer(room) {
  const drawerId = room.drawerId
  const colors = ['#1b1b2e', '#ff5d5d', '#12b5a5', '#f4a300', '#5b8def']
  let strokeCount = 3 + Math.floor(Math.random() * 4)
  let delay = 600

  for (let s = 0; s < strokeCount; s++) {
    later(room, () => {
      if (room.drawerId !== drawerId) return
      const id = `bs${newId()}`
      const color = colors[Math.floor(Math.random() * colors.length)]
      const size = 3 + Math.floor(Math.random() * 8)
      const cx = 0.2 + Math.random() * 0.6
      const cy = 0.2 + Math.random() * 0.6
      const pts = []
      const steps = 6 + Math.floor(Math.random() * 10)
      for (let i = 0; i < steps; i++) {
        pts.push({
          x: Math.min(0.98, Math.max(0.02, cx + (Math.random() - 0.5) * 0.3)),
          y: Math.min(0.98, Math.max(0.02, cy + (Math.random() - 0.5) * 0.3)),
        })
      }
      const stroke = { id, tool: 'brush', color, size, points: pts }
      room.strokes.push(stroke)
      broadcast(room, { type: 'drawStroke', stroke })
    }, delay)
    delay += 700 + Math.floor(Math.random() * 600)
  }

  // Resolve: ~78% chance the bot's team "guesses it", else let the timer run out.
  const willScore = Math.random() < 0.78
  if (willScore) {
    const resolveAt = delay + 1500 + Math.floor(Math.random() * 3500)
    later(room, () => {
      if (room.drawerId !== drawerId || room.phase !== 'playing') return
      const mates = teammatesOf(room, drawerId)
      const guesser = mates.find((m) => m.isBot) || mates[0]
      if (guesser) pushChat(room, { kind: 'guess', name: guesser.name, team: guesser.team, text: room.word })
      awardPoint(room, guesser?.name)
    }, resolveAt)
  }
}

// Bots on the drawer's team occasionally post wrong guesses for flavor.
function scheduleBotGuessers(room) {
  const drawerId = room.drawerId
  const mates = teammatesOf(room, drawerId).filter((m) => m.isBot)
  if (!mates.length) return
  let delay = 1500
  const rounds = 2 + Math.floor(Math.random() * 4)
  for (let i = 0; i < rounds; i++) {
    later(room, () => {
      if (room.drawerId !== drawerId || room.phase !== 'playing') return
      const bot = mates[Math.floor(Math.random() * mates.length)]
      const guess = WRONG_GUESSES[Math.floor(Math.random() * WRONG_GUESSES.length)]
      pushChat(room, { kind: 'guess', name: bot.name, team: bot.team, text: guess })
    }, delay)
    delay += 2500 + Math.floor(Math.random() * 4000)
  }
}

// ---------------------------------------------------------------------------
// WebSocket handling
// ---------------------------------------------------------------------------
const wss = new WebSocketServer({ noServer: true })

server.on('upgrade', (req, socket, head) => {
  // Expect path /parties/main/<code>
  const url = req.url || ''
  const m = url.match(/\/parties\/main\/([^/?]+)/)
  if (!m) {
    socket.destroy()
    return
  }
  const code = m[1].slice(0, 8)
  wss.handleUpgrade(req, socket, head, (ws) => {
    wss.emit('connection', ws, req, code)
  })
})

wss.on('connection', (ws, req, code) => {
  const room = getRoom(code)
  ws._roomCode = code
  ws._pid = null
  log(`WS connect ${code} (sockets=${room.sockets.size})`)

  ws.on('message', (raw) => {
    let data
    try { data = JSON.parse(raw.toString()) } catch { return }
    handleMessage(room, ws, data)
  })

  ws.on('close', () => {
    const pid = ws._pid
    if (!pid) return
    const p = room.players.get(pid)
    room.sockets.delete(pid)
    if (p) {
      p.connected = false
      log(`WS close ${code} ${p.name} left`)
      pushChat(room, { kind: 'system', text: `${p.name} left.` })
      // If the drawer left mid-turn, move on.
      if (room.phase === 'playing' && room.drawerId === pid) {
        nextTurn(room)
      } else {
        broadcastState(room)
      }
    }
    // Drop room when no human sockets remain.
    if (room.sockets.size === 0) {
      clearTimers(room)
      rooms.delete(code)
      log(`ROOM dropped ${code} (empty)`)
    }
  })
})

function handleMessage(room, ws, data) {
  switch (data.type) {
    case 'join': {
      const name = String(data.name || 'Player').slice(0, 18).trim() || 'Player'
      // Reattach by clientId if this browser was already a player in the room.
      let player = null
      if (data.clientId) {
        player = [...room.players.values()].find((p) => p.clientId === data.clientId && !p.isBot)
      }
      if (player) {
        player.connected = true
        player.name = name
      } else {
        const id = newId()
        const team = assignTeam(room)
        player = { id, name, team, isBot: false, connected: true, clientId: data.clientId || null }
        room.players.set(id, player)
        room.turnOrder.push(id)
      }
      if (!room.hostId) room.hostId = player.id
      ws._pid = player.id
      room.sockets.set(player.id, ws)
      log(`JOIN ${room.code} ${player.name} (${player.team}) host=${room.hostId === player.id}`)
      pushChat(room, { kind: 'system', text: `${player.name} joined ${TEAM_NAMES[player.team]}.` })
      // Send full sync to the new client.
      send(ws, buildState(room, player.id))
      send(ws, { type: 'chatHistory', messages: room.chat })
      send(ws, { type: 'canvasState', strokes: room.strokes })
      broadcastState(room)
      break
    }

    case 'addBot': {
      if (room.players.size >= 12) return
      addBot(room)
      break
    }

    case 'start': {
      if (ws._pid !== room.hostId) return
      if (connectedPlayerIds(room).length < 2) return
      startGame(room, Number(data.winTarget))
      break
    }

    case 'playAgain': {
      if (ws._pid !== room.hostId) return
      resetToLobby(room)
      break
    }

    case 'setTarget': {
      if (ws._pid !== room.hostId) return
      if ([3, 5, 10].includes(Number(data.winTarget))) {
        room.winTarget = Number(data.winTarget)
        broadcastState(room)
      }
      break
    }

    // ---- drawing (drawer only) ----
    case 'drawStroke': {
      if (ws._pid !== room.drawerId) return
      const s = data.stroke
      if (!s || !Array.isArray(s.points)) return
      const stroke = {
        id: String(s.id || newId()),
        tool: s.tool === 'eraser' ? 'eraser' : 'brush',
        color: String(s.color || '#1b1b2e').slice(0, 9),
        size: Math.min(60, Math.max(1, Number(s.size) || 4)),
        points: s.points.slice(0, 1000).map((p) => ({ x: +p.x, y: +p.y })),
      }
      room.strokes.push(stroke)
      room.redo = []
      broadcast(room, { type: 'drawStroke', stroke }, ws._pid)
      break
    }
    case 'drawLive': {
      // optional live segment relay for smoothness (not stored)
      if (ws._pid !== room.drawerId) return
      broadcast(room, { type: 'drawLive', seg: data.seg }, ws._pid)
      break
    }
    case 'undo': {
      if (ws._pid !== room.drawerId) return
      if (room.strokes.length) {
        room.redo.push(room.strokes.pop())
        broadcast(room, { type: 'canvasState', strokes: room.strokes })
      }
      break
    }
    case 'redo': {
      if (ws._pid !== room.drawerId) return
      if (room.redo.length) {
        room.strokes.push(room.redo.pop())
        broadcast(room, { type: 'canvasState', strokes: room.strokes })
      }
      break
    }
    case 'clear': {
      if (ws._pid !== room.drawerId) return
      room.strokes = []
      room.redo = []
      broadcast(room, { type: 'canvasState', strokes: [] })
      break
    }

    // ---- chat / guessing ----
    case 'chat': {
      const p = room.players.get(ws._pid)
      if (!p) return
      const text = String(data.text || '').slice(0, 120).trim()
      if (!text) return
      pushChat(room, { kind: 'guess', name: p.name, team: p.team, text })
      break
    }

    case 'guessedIt': {
      if (ws._pid !== room.drawerId) return
      awardPoint(room, null)
      break
    }

    default:
      break
  }
}

server.listen(PORT, () => {
  log(`ROBO·DRAW server listening on :${PORT}  (serving ${DIST})`)
})
