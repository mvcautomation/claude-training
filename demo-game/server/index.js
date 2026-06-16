import http from 'http'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { WebSocketServer } from 'ws'
import { WORDS } from './words.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const DIST = path.join(__dirname, '..', 'dist')
const PORT = process.env.PORT || 3200
const TURN_SECONDS = 90
const RECONNECT_GRACE_MS = 45000

// ---------------------------------------------------------------- logging ----
function log(...args) {
  // console.log so PM2 captures it
  console.log(new Date().toISOString(), ...args)
}

// ---------------------------------------------------------- static server ----
const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
}

function serveStatic(req, res) {
  let urlPath = decodeURIComponent(new URL(req.url, 'http://x').pathname)
  if (urlPath === '/') urlPath = '/index.html'
  let filePath = path.join(DIST, urlPath)
  // prevent path traversal
  if (!filePath.startsWith(DIST)) filePath = path.join(DIST, 'index.html')

  fs.readFile(filePath, (err, data) => {
    if (err) {
      // SPA fallback to index.html (so deep links work)
      fs.readFile(path.join(DIST, 'index.html'), (err2, idx) => {
        if (err2) {
          res.writeHead(404, { 'Content-Type': 'text/plain' })
          res.end('Not built yet. Run `npm run build`.')
          return
        }
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' })
        res.end(idx)
      })
      return
    }
    const ext = path.extname(filePath)
    res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' })
    res.end(data)
  })
}

const server = http.createServer((req, res) => {
  if (req.url === '/healthz') {
    res.writeHead(200, { 'Content-Type': 'text/plain' })
    res.end('ok')
    return
  }
  serveStatic(req, res)
})

// ------------------------------------------------------------------ rooms ----
/**
 * room = {
 *   code, players:[{id,name,team,isBot,isHost,connected,token}],
 *   conns: Map(playerId -> ws),
 *   phase:'lobby'|'playing'|'gameover',
 *   targetScore, scores:{A,B}, winner,
 *   currentDrawerId, currentWord, turnEndsAt,
 *   strokes:[], undone:[],
 *   timers:Set, graceTimers:Map(playerId->timeout)
 * }
 */
const rooms = new Map()

const BOT_NAMES = ['Sprocket', 'Gizmo', 'Clank', 'Rusty', 'Beep', 'Boop', 'Cog', 'Widget', 'Bolt-E', 'Nuts', 'Volt', 'Pixel']
const BOT_GUESSES = [
  'is it dancing?', 'a robot for sure', 'backflip??', 'waving?', 'hmm tricky',
  'charging up?', 'running!', 'is it jumping', 'ooh i see it', 'yoga pose?',
  'is that a kite', 'cooking?', 'guitar!', 'doing a flip', 'sleeping?',
  'high five!', 'flexing?', 'skateboard', 'reading a book', 'meditating',
]

let idCounter = 1
const newId = (p) => `${p}_${idCounter++}_${Math.floor(performance.now()).toString(36)}`

function makeRoom(code) {
  const room = {
    code,
    players: [],
    conns: new Map(),
    phase: 'lobby',
    targetScore: 5,
    scores: { A: 0, B: 0 },
    winner: null,
    currentDrawerId: null,
    currentWord: null,
    turnEndsAt: 0,
    strokes: [],
    undone: [],
    timers: new Set(),
    graceTimers: new Map(),
  }
  rooms.set(code, room)
  log(`[room ${code}] created`)
  return room
}

function smallerTeam(room) {
  const a = room.players.filter((p) => p.team === 'A').length
  const b = room.players.filter((p) => p.team === 'B').length
  return b < a ? 'B' : 'A'
}

function maskWord(word) {
  if (!word) return ''
  return word
    .split(' ')
    .map((w) => w.replace(/[a-z0-9]/gi, '_').split('').join(' '))
    .join('   ')
}

// ---------------------------------------------------------------- senders ----
function sendJSON(ws, obj) {
  if (ws && ws.readyState === 1) ws.send(JSON.stringify(obj))
}
function broadcast(room, obj, exceptId = null) {
  const msg = JSON.stringify(obj)
  for (const [pid, ws] of room.conns) {
    if (pid === exceptId) continue
    if (ws.readyState === 1) ws.send(msg)
  }
}
function teamBroadcast(room, team, obj) {
  const msg = JSON.stringify(obj)
  for (const p of room.players) {
    if (p.team !== team) continue
    const ws = room.conns.get(p.id)
    if (ws && ws.readyState === 1) ws.send(msg)
  }
}

function publicState(room) {
  return {
    type: 'state',
    code: room.code,
    phase: room.phase,
    targetScore: room.targetScore,
    scores: room.scores,
    winner: room.winner,
    hostId: room.players.find((p) => p.isHost)?.id || null,
    currentDrawerId: room.currentDrawerId,
    turnEndsAt: room.turnEndsAt,
    turnSeconds: TURN_SECONDS,
    maskedWord: room.phase === 'playing' ? maskWord(room.currentWord) : '',
    wordLength: room.currentWord ? room.currentWord.length : 0,
    players: room.players.map((p) => ({
      id: p.id,
      name: p.name,
      team: p.team,
      isBot: p.isBot,
      isHost: p.isHost,
      connected: p.connected,
    })),
  }
}

function pushState(room) {
  broadcast(room, publicState(room))
  // drawer gets the real word privately
  if (room.phase === 'playing' && room.currentDrawerId) {
    const ws = room.conns.get(room.currentDrawerId)
    sendJSON(ws, { type: 'word', word: room.currentWord })
  }
}

// ------------------------------------------------------------- turn timers ----
function clearTurnTimers(room) {
  for (const t of room.timers) clearTimeout(t)
  room.timers.clear()
}
function addTimer(room, fn, ms) {
  const t = setTimeout(() => {
    room.timers.delete(t)
    fn()
  }, ms)
  room.timers.add(t)
  return t
}

// ----------------------------------------------------------- game control ----
function startGame(room, targetScore) {
  if (room.players.length < 2) return
  room.phase = 'playing'
  room.targetScore = [3, 5, 10].includes(targetScore) ? targetScore : 5
  room.scores = { A: 0, B: 0 }
  room.winner = null
  room.currentDrawerId = null
  log(`[room ${room.code}] game started, target=${room.targetScore}, players=${room.players.length}`)
  startTurn(room)
}

function nextDrawerId(room) {
  const ids = room.players.map((p) => p.id)
  if (ids.length === 0) return null
  const i = ids.indexOf(room.currentDrawerId)
  return ids[(i + 1) % ids.length]
}

function startTurn(room) {
  clearTurnTimers(room)
  room.strokes = []
  room.undone = []
  const drawerId = nextDrawerId(room)
  if (!drawerId) return
  room.currentDrawerId = drawerId
  room.currentWord = WORDS[Math.floor(Math.random() * WORDS.length)]
  room.turnEndsAt = Date.now() + TURN_SECONDS * 1000

  const drawer = room.players.find((p) => p.id === drawerId)
  log(`[room ${room.code}] turn start -> drawer=${drawer?.name} (${drawer?.team}) word="${room.currentWord}"`)

  broadcast(room, { type: 'canvas', strokes: [] })
  pushState(room)

  // server-authoritative turn timer
  addTimer(room, () => {
    log(`[room ${room.code}] turn timed out (no points)`)
    endTurn(room, null)
  }, TURN_SECONDS * 1000)

  // bot behaviour
  if (drawer?.isBot) {
    botDraw(room, drawer.id)
    const resolveIn = 9000 + Math.floor(Math.random() * 7000)
    addTimer(room, () => {
      if (room.currentDrawerId === drawer.id && room.phase === 'playing') {
        log(`[room ${room.code}] bot ${drawer.name} auto-resolved its turn`)
        endTurn(room, drawer.team)
      }
    }, resolveIn)
  } else {
    // bot teammates heckle/guess in chat while a human draws
    scheduleBotGuesses(room, drawer)
  }
}

function endTurn(room, scoringTeam) {
  clearTurnTimers(room)
  if (scoringTeam) {
    room.scores[scoringTeam]++
    log(`[room ${room.code}] point -> team ${scoringTeam} (A:${room.scores.A} B:${room.scores.B})`)
    if (room.scores[scoringTeam] >= room.targetScore) {
      room.phase = 'gameover'
      room.winner = scoringTeam
      room.currentDrawerId = null
      room.currentWord = null
      log(`[room ${room.code}] GAME OVER — team ${scoringTeam} wins`)
      pushState(room)
      return
    }
  }
  if (room.players.length < 2) {
    room.phase = 'lobby'
    room.currentDrawerId = null
    room.currentWord = null
    pushState(room)
    return
  }
  startTurn(room)
}

// --------------------------------------------------------------- bot logic ----
function rand(min, max) {
  return min + Math.random() * (max - min)
}

function botDraw(room, botId) {
  // produce a few doodle strokes, streamed so humans see it appear
  const strokeCount = 3 + Math.floor(Math.random() * 3)
  let delay = 600
  for (let s = 0; s < strokeCount; s++) {
    const id = newId('s')
    const color = ['#16161d', '#2d5bff', '#ff5c39', '#16a36b'][s % 4]
    const size = [6, 10, 16][s % 3]
    let x = rand(250, 1350)
    let y = rand(150, 850)
    const steps = 8 + Math.floor(Math.random() * 10)
    const startDelay = delay
    addTimer(room, () => {
      if (room.currentDrawerId !== botId) return
      room.strokes.push({ id, color, size, tool: 'brush', points: [{ x, y }] })
      broadcast(room, { type: 'drawStart', stroke: { id, color, size, tool: 'brush', point: { x, y } } })
    }, startDelay)
    for (let i = 0; i < steps; i++) {
      x = Math.max(40, Math.min(1560, x + rand(-120, 120)))
      y = Math.max(40, Math.min(960, y + rand(-90, 90)))
      const px = x, py = y
      addTimer(room, () => {
        if (room.currentDrawerId !== botId) return
        const stroke = room.strokes.find((k) => k.id === id)
        if (stroke) stroke.points.push({ x: px, y: py })
        broadcast(room, { type: 'drawPoint', id, point: { x: px, y: py } })
      }, startDelay + 120 + i * 110)
    }
    delay = startDelay + 120 + steps * 110 + 250
  }
}

function scheduleBotGuesses(room, drawer) {
  if (!drawer) return
  const botTeammates = room.players.filter(
    (p) => p.isBot && p.team === drawer.team && p.id !== drawer.id
  )
  if (botTeammates.length === 0) return
  let t = 2500
  for (let i = 0; i < 8; i++) {
    const when = t
    addTimer(room, () => {
      if (room.currentDrawerId !== drawer.id || room.phase !== 'playing') return
      const bot = botTeammates[Math.floor(Math.random() * botTeammates.length)]
      const text = BOT_GUESSES[Math.floor(Math.random() * BOT_GUESSES.length)]
      teamBroadcast(room, drawer.team, {
        type: 'chat',
        id: newId('m'),
        name: bot.name,
        team: bot.team,
        text,
        bot: true,
      })
    }, when)
    t += rand(2800, 5200)
  }
}

function addBot(room) {
  const used = new Set(room.players.map((p) => p.name))
  const name = BOT_NAMES.find((n) => !used.has(n)) || `Bot-${room.players.length}`
  const bot = {
    id: newId('p'),
    name,
    team: smallerTeam(room),
    isBot: true,
    isHost: false,
    connected: true,
    token: newId('t'),
  }
  room.players.push(bot)
  log(`[room ${room.code}] +bot ${name} (team ${bot.team})`)
  // if a human is currently drawing, let the new bot start guessing too
  if (room.phase === 'playing') {
    const drawer = room.players.find((p) => p.id === room.currentDrawerId)
    if (drawer && !drawer.isBot) scheduleBotGuesses(room, drawer)
  }
  pushState(room)
}

// ----------------------------------------------------------- connections ----
const wss = new WebSocketServer({ noServer: true })

server.on('upgrade', (req, socket, head) => {
  const url = new URL(req.url, 'http://localhost')
  const parts = url.pathname.split('/').filter(Boolean)
  // expect /parties/main/<code>
  if (parts[0] !== 'parties' || parts[1] !== 'main' || !parts[2]) {
    socket.destroy()
    return
  }
  const code = parts[2]
  wss.handleUpgrade(req, socket, head, (ws) => {
    handleConnection(ws, code)
  })
})

function handleConnection(ws, code) {
  log(`[room ${code}] socket connected`)
  ws.on('message', (raw) => {
    let msg
    try {
      msg = JSON.parse(raw.toString())
    } catch {
      return
    }
    routeMessage(ws, code, msg)
  })
  ws.on('close', () => onClose(ws))
  ws.on('error', () => {})
}

function onClose(ws) {
  const room = rooms.get(ws._code)
  if (!room) return
  const player = room.players.find((p) => p.id === ws._playerId)
  if (!player) return
  player.connected = false
  room.conns.delete(player.id)
  log(`[room ${room.code}] ${player.name} disconnected (grace ${RECONNECT_GRACE_MS}ms)`)

  // if the drawer dropped, don't stall the round
  if (room.phase === 'playing' && room.currentDrawerId === player.id && room.players.length > 1) {
    endTurn(room, null)
  } else {
    pushState(room)
  }

  // remove after grace unless they reconnect
  const g = setTimeout(() => {
    removePlayer(room, player.id)
  }, RECONNECT_GRACE_MS)
  room.graceTimers.set(player.id, g)
}

function removePlayer(room, playerId) {
  const idx = room.players.findIndex((p) => p.id === playerId)
  if (idx === -1) return
  const [player] = room.players.splice(idx, 1)
  room.conns.delete(playerId)
  const gt = room.graceTimers.get(playerId)
  if (gt) {
    clearTimeout(gt)
    room.graceTimers.delete(playerId)
  }
  log(`[room ${room.code}] ${player.name} removed`)

  // reassign host
  if (player.isHost) {
    const next = room.players.find((p) => !p.isBot) || room.players[0]
    if (next) next.isHost = true
  }

  if (room.players.length === 0) {
    clearTurnTimers(room)
    for (const t of room.graceTimers.values()) clearTimeout(t)
    rooms.delete(room.code)
    log(`[room ${room.code}] empty — dropped`)
    return
  }

  if (room.phase === 'playing' && room.currentDrawerId === playerId) {
    endTurn(room, null)
  } else {
    pushState(room)
  }
}

function routeMessage(ws, code, msg) {
  let room = rooms.get(code)

  if (msg.type === 'join') {
    if (!room) room = makeRoom(code)
    // reconnect by token?
    let player = msg.token ? room.players.find((p) => p.token === msg.token) : null
    if (player) {
      const gt = room.graceTimers.get(player.id)
      if (gt) {
        clearTimeout(gt)
        room.graceTimers.delete(player.id)
      }
      player.connected = true
      if (msg.name) player.name = String(msg.name).slice(0, 20)
      log(`[room ${code}] ${player.name} reconnected`)
    } else {
      player = {
        id: newId('p'),
        name: String(msg.name || 'Player').slice(0, 20) || 'Player',
        team: smallerTeam(room),
        isBot: false,
        isHost: room.players.length === 0,
        connected: true,
        token: msg.token || newId('t'),
      }
      room.players.push(player)
      log(`[room ${code}] ${player.name} joined (team ${player.team}${player.isHost ? ', host' : ''})`)
    }
    ws._playerId = player.id
    ws._code = code
    room.conns.set(player.id, ws)
    sendJSON(ws, { type: 'welcome', playerId: player.id, token: player.token, code })
    sendJSON(ws, { type: 'canvas', strokes: room.strokes })
    sendJSON(ws, publicState(room))
    if (room.phase === 'playing' && room.currentDrawerId === player.id) {
      sendJSON(ws, { type: 'word', word: room.currentWord })
    }
    pushState(room)
    return
  }

  if (!room) return
  const player = room.players.find((p) => p.id === ws._playerId)
  if (!player) return
  const isHost = player.isHost
  const isDrawer = room.currentDrawerId === player.id

  switch (msg.type) {
    case 'startGame':
      if (isHost && room.phase === 'lobby') startGame(room, msg.targetScore)
      break

    case 'addBot':
      if (isHost) addBot(room)
      break

    case 'setTarget':
      if (isHost && room.phase === 'lobby' && [3, 5, 10].includes(msg.targetScore)) {
        room.targetScore = msg.targetScore
        pushState(room)
      }
      break

    case 'guessedIt':
      if (isDrawer && room.phase === 'playing') endTurn(room, player.team)
      break

    case 'chat': {
      if (room.phase !== 'playing') break
      const drawer = room.players.find((p) => p.id === room.currentDrawerId)
      if (!drawer) break
      // only the drawer's teammates (not the drawer) may guess
      if (player.team !== drawer.team || player.id === drawer.id) break
      const text = String(msg.text || '').slice(0, 120).trim()
      if (!text) break
      teamBroadcast(room, drawer.team, {
        type: 'chat',
        id: newId('m'),
        name: player.name,
        team: player.team,
        text,
      })
      break
    }

    // ---- drawing (drawer only) ----
    case 'drawStart':
      if (!isDrawer || !msg.stroke) break
      room.undone = []
      room.strokes.push({
        id: msg.stroke.id,
        color: msg.stroke.color,
        size: msg.stroke.size,
        tool: msg.stroke.tool,
        points: [msg.stroke.point],
      })
      broadcast(room, { type: 'drawStart', stroke: msg.stroke }, player.id)
      break

    case 'drawPoint': {
      if (!isDrawer) break
      const stroke = room.strokes.find((k) => k.id === msg.id)
      if (stroke) stroke.points.push(msg.point)
      broadcast(room, { type: 'drawPoint', id: msg.id, point: msg.point }, player.id)
      break
    }

    case 'drawEnd':
      if (!isDrawer) break
      broadcast(room, { type: 'drawEnd', id: msg.id }, player.id)
      break

    case 'undo':
      if (!isDrawer) break
      if (room.strokes.length) room.undone.push(room.strokes.pop())
      broadcast(room, { type: 'canvas', strokes: room.strokes })
      break

    case 'redo':
      if (!isDrawer) break
      if (room.undone.length) room.strokes.push(room.undone.pop())
      broadcast(room, { type: 'canvas', strokes: room.strokes })
      break

    case 'clear':
      if (!isDrawer) break
      room.strokes = []
      room.undone = []
      broadcast(room, { type: 'canvas', strokes: [] })
      break

    case 'playAgain':
      if (isHost && room.phase === 'gameover') {
        room.phase = 'lobby'
        room.scores = { A: 0, B: 0 }
        room.winner = null
        room.currentDrawerId = null
        room.currentWord = null
        room.strokes = []
        room.undone = []
        clearTurnTimers(room)
        log(`[room ${room.code}] reset to lobby (play again)`)
        broadcast(room, { type: 'canvas', strokes: [] })
        pushState(room)
      }
      break

    default:
      break
  }
}

server.listen(PORT, () => {
  log(`ROBO·DRAW server listening on :${PORT}  (static: ${DIST})`)
})
