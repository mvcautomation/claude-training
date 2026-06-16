// Single-origin websocket client. Builds its URL from window.location so it
// works identically on http://localhost and https://game.ai-app.space.
export function connect(code, { onMessage, onOpen, onClose }) {
  const proto = window.location.protocol === 'https:' ? 'wss' : 'ws'
  const url = `${proto}://${window.location.host}/parties/main/${code}`
  let ws
  let closed = false
  let retry = 0

  function open() {
    ws = new WebSocket(url)
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
        setTimeout(open, 400 * retry)
      }
    }
    ws.onerror = () => ws.close()
  }
  open()

  return {
    send: (obj) => {
      if (ws && ws.readyState === 1) ws.send(JSON.stringify(obj))
    },
    close: () => {
      closed = true
      ws && ws.close()
    },
  }
}
