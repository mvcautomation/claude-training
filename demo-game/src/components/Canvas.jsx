import React, { useRef, useEffect, useImperativeHandle, forwardRef } from 'react'

// Fixed internal coordinate space — identical on every client so strokes line up.
export const CW = 1600
export const CH = 1000

const Canvas = forwardRef(function Canvas(
  { isDrawer, color, size, tool, onStart, onPoint, onEnd },
  ref
) {
  const canvasRef = useRef(null)
  const strokesRef = useRef([])
  const localRef = useRef(null) // active local stroke while drawing

  function draw() {
    const cv = canvasRef.current
    if (!cv) return
    const ctx = cv.getContext('2d')
    ctx.clearRect(0, 0, CW, CH)
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    for (const s of strokesRef.current) {
      if (!s.points || s.points.length === 0) continue
      ctx.globalCompositeOperation = s.tool === 'eraser' ? 'destination-out' : 'source-over'
      ctx.strokeStyle = s.color
      ctx.lineWidth = s.size
      ctx.beginPath()
      ctx.moveTo(s.points[0].x, s.points[0].y)
      if (s.points.length === 1) {
        // dot
        ctx.lineTo(s.points[0].x + 0.01, s.points[0].y + 0.01)
      } else {
        for (let i = 1; i < s.points.length; i++) ctx.lineTo(s.points[i].x, s.points[i].y)
      }
      ctx.stroke()
    }
    ctx.globalCompositeOperation = 'source-over'
  }

  useImperativeHandle(ref, () => ({
    applyStart(stroke) {
      strokesRef.current.push({
        id: stroke.id,
        color: stroke.color,
        size: stroke.size,
        tool: stroke.tool,
        points: [stroke.point],
      })
      draw()
    },
    applyPoint(id, point) {
      const s = strokesRef.current.find((k) => k.id === id)
      if (s) {
        s.points.push(point)
        draw()
      }
    },
    applyEnd() {},
    setCanvas(strokes) {
      strokesRef.current = (strokes || []).map((s) => ({ ...s, points: [...(s.points || [])] }))
      draw()
    },
  }))

  useEffect(() => {
    draw()
  }, [])

  // ---- pointer handling (drawer only) ----
  function toPoint(e) {
    const cv = canvasRef.current
    const rect = cv.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * CW
    const y = ((e.clientY - rect.top) / rect.height) * CH
    return { x: Math.max(0, Math.min(CW, x)), y: Math.max(0, Math.min(CH, y)) }
  }

  function down(e) {
    if (!isDrawer) return
    e.preventDefault()
    canvasRef.current.setPointerCapture(e.pointerId)
    const id = `${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`
    const pt = toPoint(e)
    const stroke = { id, color, size, tool, point: pt }
    localRef.current = { id }
    strokesRef.current.push({ id, color, size, tool, points: [pt] })
    draw()
    onStart && onStart(stroke)
  }
  function move(e) {
    if (!isDrawer || !localRef.current) return
    const pt = toPoint(e)
    const s = strokesRef.current.find((k) => k.id === localRef.current.id)
    if (s) {
      s.points.push(pt)
      draw()
    }
    onPoint && onPoint(localRef.current.id, pt)
  }
  function up() {
    if (!isDrawer || !localRef.current) return
    const id = localRef.current.id
    localRef.current = null
    onEnd && onEnd(id)
  }

  return (
    <div className="canvas-wrap">
      <canvas
        ref={canvasRef}
        width={CW}
        height={CH}
        className={`canvas ${isDrawer ? 'is-drawer' : ''}`}
        onPointerDown={down}
        onPointerMove={move}
        onPointerUp={up}
        onPointerCancel={up}
        onPointerLeave={up}
      />
      {!isDrawer && <div className="canvas-veil" aria-hidden="true" />}
    </div>
  )
})

export default Canvas
