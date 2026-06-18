import React, {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react'

const COLORS = ['#1b1b2e', '#ff5d5d', '#12b5a5', '#f4a300', '#5b8def', '#8b5cf6', '#ffffff']
const SIZES = [3, 6, 12, 22]

// Drawing surface. Coordinates are normalized 0..1 so every client renders the
// same picture regardless of screen size. The wrapper holds a fixed 4:3 aspect
// ratio so the canvas never gets squashed when other panels grow.
const Canvas = forwardRef(function Canvas({ isDrawer, onStroke, onLive, onUndo, onRedo, onClear, onReady }, ref) {
  const canvasRef = useRef(null)
  const ctxRef = useRef(null)
  const committed = useRef([]) // [{id,tool,color,size,points}]
  const live = useRef(new Map()) // id -> stroke in progress
  const drawingRef = useRef(null) // current local stroke
  const bufRef = useRef([]) // buffered local points awaiting raf flush
  const rafRef = useRef(0)

  const [tool, setTool] = useState('brush')
  const [color, setColor] = useState('#1b1b2e')
  const [size, setSize] = useState(6)

  const dims = () => {
    const c = canvasRef.current
    const rect = c.getBoundingClientRect()
    return { w: rect.width, h: rect.height }
  }

  const strokeStyle = (ctx, s) => {
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    if (s.tool === 'eraser') {
      ctx.globalCompositeOperation = 'destination-out'
      ctx.strokeStyle = 'rgba(0,0,0,1)'
    } else {
      ctx.globalCompositeOperation = 'source-over'
      ctx.strokeStyle = s.color
    }
    ctx.lineWidth = s.size
  }

  const drawSegment = useCallback((s, from, to) => {
    const ctx = ctxRef.current
    if (!ctx) return
    const { w, h } = dims()
    strokeStyle(ctx, s)
    ctx.beginPath()
    if (from) ctx.moveTo(from.x * w, from.y * h)
    else ctx.moveTo(to.x * w, to.y * h)
    ctx.lineTo(to.x * w, to.y * h)
    ctx.stroke()
    // a dot for single taps
    if (!from) {
      ctx.beginPath()
      ctx.arc(to.x * w, to.y * h, Math.max(0.5, s.size / 2), 0, Math.PI * 2)
      ctx.fillStyle = s.tool === 'eraser' ? 'rgba(0,0,0,1)' : s.color
      ctx.fill()
    }
  }, [])

  const drawWholeStroke = useCallback((s) => {
    if (!s.points.length) return
    for (let i = 0; i < s.points.length; i++) {
      drawSegment(s, i > 0 ? s.points[i - 1] : null, s.points[i])
    }
  }, [drawSegment])

  const redrawAll = useCallback(() => {
    const ctx = ctxRef.current
    const c = canvasRef.current
    if (!ctx || !c) return
    const { w, h } = dims()
    ctx.globalCompositeOperation = 'source-over'
    ctx.clearRect(0, 0, w, h)
    for (const s of committed.current) drawWholeStroke(s)
    for (const s of live.current.values()) drawWholeStroke(s)
  }, [drawWholeStroke])

  const setupCanvas = useCallback(() => {
    const c = canvasRef.current
    if (!c) return
    const rect = c.getBoundingClientRect()
    const dpr = window.devicePixelRatio || 1
    c.width = Math.round(rect.width * dpr)
    c.height = Math.round(rect.height * dpr)
    const ctx = c.getContext('2d')
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    ctxRef.current = ctx
    redrawAll()
  }, [redrawAll])

  useEffect(() => {
    setupCanvas()
    const ro = new ResizeObserver(() => setupCanvas())
    if (canvasRef.current) ro.observe(canvasRef.current)
    onReady && onReady()
    return () => ro.disconnect()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Methods called by the parent when network messages arrive.
  useImperativeHandle(ref, () => ({
    applyCanvasState(strokes) {
      committed.current = (strokes || []).map((s) => ({ ...s, points: [...s.points] }))
      live.current.clear()
      redrawAll()
    },
    applyCommit(stroke) {
      // Live segments already drew this; just store for future redraws.
      live.current.delete(stroke.id)
      committed.current.push(stroke)
    },
    applyLive(seg) {
      let s = live.current.get(seg.id)
      if (!s) {
        s = { id: seg.id, tool: seg.tool, color: seg.color, size: seg.size, points: [] }
        live.current.set(seg.id, s)
      }
      for (const p of seg.points) {
        const prev = s.points[s.points.length - 1]
        s.points.push(p)
        drawSegment(s, prev, p)
      }
    },
  }), [drawSegment, redrawAll])

  // --- local drawing (drawer only) ---
  const pos = (e) => {
    const c = canvasRef.current
    const rect = c.getBoundingClientRect()
    const cx = (e.touches ? e.touches[0].clientX : e.clientX) - rect.left
    const cy = (e.touches ? e.touches[0].clientY : e.clientY) - rect.top
    return { x: Math.min(1, Math.max(0, cx / rect.width)), y: Math.min(1, Math.max(0, cy / rect.height)) }
  }

  const flush = useCallback(() => {
    rafRef.current = 0
    const d = drawingRef.current
    if (!d || !bufRef.current.length) return
    const pts = bufRef.current
    bufRef.current = []
    onLive && onLive({ id: d.id, tool: d.tool, color: d.color, size: d.size, points: pts })
  }, [onLive])

  const start = (e) => {
    if (!isDrawer) return
    e.preventDefault()
    const p = pos(e)
    const id = 's_' + Math.random().toString(36).slice(2)
    const s = { id, tool, color, size, points: [p] }
    drawingRef.current = s
    drawSegment(s, null, p)
    bufRef.current = [p]
    if (!rafRef.current) rafRef.current = requestAnimationFrame(flush)
  }

  const move = (e) => {
    const d = drawingRef.current
    if (!isDrawer || !d) return
    e.preventDefault()
    const p = pos(e)
    const prev = d.points[d.points.length - 1]
    d.points.push(p)
    drawSegment(d, prev, p)
    bufRef.current.push(p)
    if (!rafRef.current) rafRef.current = requestAnimationFrame(flush)
  }

  const end = () => {
    const d = drawingRef.current
    if (!isDrawer || !d) return
    flush()
    drawingRef.current = null
    committed.current.push(d)
    onStroke && onStroke(d)
  }

  return (
    <div className="canvas-area">
      <div className={`canvas-wrap ${isDrawer ? 'is-drawer' : 'is-viewer'}`}>
        <canvas
          ref={canvasRef}
          className="board"
          onMouseDown={start}
          onMouseMove={move}
          onMouseUp={end}
          onMouseLeave={end}
          onTouchStart={start}
          onTouchMove={move}
          onTouchEnd={end}
          style={{ cursor: isDrawer ? 'crosshair' : 'default', touchAction: 'none' }}
        />
        {!isDrawer && <div className="watch-badge">watching</div>}
      </div>

      {isDrawer && (
        <div className="toolbar">
          <div className="tb-group">
            <button
              className={`tb-btn ${tool === 'brush' ? 'on' : ''}`}
              onClick={() => setTool('brush')}
              title="Brush"
            >✏️</button>
            <button
              className={`tb-btn ${tool === 'eraser' ? 'on' : ''}`}
              onClick={() => setTool('eraser')}
              title="Eraser"
            >🧽</button>
          </div>

          <div className="tb-group swatches">
            {COLORS.map((c) => (
              <button
                key={c}
                className={`swatch ${color === c && tool === 'brush' ? 'on' : ''}`}
                style={{ background: c, borderColor: c === '#ffffff' ? '#ccc' : c }}
                onClick={() => { setColor(c); setTool('brush') }}
                title={c}
              />
            ))}
          </div>

          <div className="tb-group sizes">
            {SIZES.map((sz) => (
              <button
                key={sz}
                className={`size-btn ${size === sz ? 'on' : ''}`}
                onClick={() => setSize(sz)}
                title={`${sz}px`}
              >
                <span className="dot" style={{ width: sz, height: sz }} />
              </button>
            ))}
          </div>

          <div className="tb-group">
            <button className="tb-btn" onClick={onUndo} title="Undo">↶</button>
            <button className="tb-btn" onClick={onRedo} title="Redo">↷</button>
            <button className="tb-btn danger" onClick={onClear} title="Clear">🗑</button>
          </div>
        </div>
      )}
    </div>
  )
})

export default Canvas
