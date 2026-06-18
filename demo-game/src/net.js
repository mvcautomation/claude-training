// Thin WebSocket client. Same-origin: build the socket URL from window.location
// (wss on https, ws on http) so there are no env vars / host config.
export function socketUrl(code) {
  const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
  return `${proto}//${window.location.host}/parties/main/${code}`
}

// A stable per-browser id so a refresh re-attaches to the same player slot.
export function clientId() {
  let id = localStorage.getItem('robodraw_cid')
  if (!id) {
    id = 'c_' + Math.random().toString(36).slice(2) + Date.now().toString(36)
    localStorage.setItem('robodraw_cid', id)
  }
  return id
}

export function createConnection(code, { onMessage, onOpen, onClose }) {
  let ws
  let closed = false
  let retry = 0

  function connect() {
    ws = new WebSocket(socketUrl(code))
    ws.onopen = () => {
      retry = 0
      onOpen && onOpen()
    }
    ws.onmessage = (e) => {
      try {
        onMessage(JSON.parse(e.data))
      } catch {
        /* ignore */
      }
    }
    ws.onclose = () => {
      onClose && onClose()
      if (!closed) {
        retry = Math.min(retry + 1, 6)
        setTimeout(connect, 400 * retry)
      }
    }
    ws.onerror = () => ws.close()
  }
  connect()

  return {
    send(msg) {
      if (ws && ws.readyState === 1) ws.send(JSON.stringify(msg))
    },
    close() {
      closed = true
      ws && ws.close()
    },
  }
}

// 4-digit join code
export function randomCode() {
  return String(Math.floor(1000 + Math.random() * 9000))
}
