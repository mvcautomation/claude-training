import { useEffect, useRef } from "react";

const REF_WIDTH = 900; // brush sizes are defined at this logical width, then scaled

/**
 * Shared drawing surface. The drawer paints and emits d-* messages; everyone
 * (incl. the drawer) keeps a local stroke list so live strokes persist without
 * the server echoing a full canvas on every pointer-up. The server's "canvas"
 * message is the authority used for joins, undo/redo and clear.
 *
 * Coordinates are normalized 0..1 so every screen size stays in sync.
 */
export default function Canvas({ socket, isDrawer, tool, color, size }) {
  const wrapRef = useRef(null);
  const canvasRef = useRef(null);
  const store = useRef({ strokes: [], live: null }); // committed strokes + in-progress
  const drawing = useRef(false);
  // keep latest tool settings without re-binding pointer handlers
  const toolRef = useRef({ tool, color, size });
  toolRef.current = { tool, color, size };

  // ---- rendering --------------------------------------------------------
  function paintStroke(ctx, s, W, H) {
    if (!s || s.points.length === 0) return;
    const scale = W / REF_WIDTH;
    ctx.lineJoin = "round";
    ctx.lineCap = "round";
    ctx.lineWidth = s.size * scale;
    if (s.tool === "eraser") {
      ctx.globalCompositeOperation = "destination-out";
      ctx.strokeStyle = "rgba(0,0,0,1)";
    } else {
      ctx.globalCompositeOperation = "source-over";
      ctx.strokeStyle = s.color;
    }
    ctx.beginPath();
    const [x0, y0] = s.points[0];
    ctx.moveTo(x0 * W, y0 * H);
    if (s.points.length === 1) {
      // a single tap — draw a dot
      ctx.lineTo(x0 * W + 0.01, y0 * H + 0.01);
    } else {
      for (let i = 1; i < s.points.length; i++) ctx.lineTo(s.points[i][0] * W, s.points[i][1] * H);
    }
    ctx.stroke();
    ctx.globalCompositeOperation = "source-over";
  }

  function redraw() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const W = canvas.width;
    const H = canvas.height;
    ctx.clearRect(0, 0, W, H);
    for (const s of store.current.strokes) paintStroke(ctx, s, W, H);
    paintStroke(ctx, store.current.live, W, H);
  }

  function fitCanvas() {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;
    const dpr = window.devicePixelRatio || 1;
    const rect = wrap.getBoundingClientRect();
    canvas.width = Math.max(1, Math.round(rect.width * dpr));
    canvas.height = Math.max(1, Math.round(rect.height * dpr));
    redraw();
  }

  useEffect(() => {
    fitCanvas();
    const ro = new ResizeObserver(fitCanvas);
    if (wrapRef.current) ro.observe(wrapRef.current);
    return () => ro.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---- incoming messages (canvas sync + others' live strokes) -----------
  useEffect(() => {
    if (!socket) return;
    function onMsg(e) {
      let msg;
      try {
        msg = JSON.parse(e.data);
      } catch {
        return;
      }
      if (msg.type === "canvas") {
        store.current.strokes = msg.strokes || [];
        store.current.live = null;
        redraw();
      } else if (msg.type === "draw" && !isDrawer) {
        const s = store.current;
        if (msg.op === "start") s.live = { tool: msg.tool, color: msg.color, size: msg.size, points: [[msg.x, msg.y]] };
        else if (msg.op === "point" && s.live) s.live.points.push([msg.x, msg.y]);
        else if (msg.op === "end" && s.live) {
          s.strokes.push(s.live);
          s.live = null;
        }
        redraw();
      }
    }
    socket.addEventListener("message", onMsg);
    return () => socket.removeEventListener("message", onMsg);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [socket, isDrawer]);

  // ---- drawer pointer input --------------------------------------------
  function pos(e) {
    const rect = canvasRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    return [Math.min(1, Math.max(0, x)), Math.min(1, Math.max(0, y))];
  }

  function onDown(e) {
    if (!isDrawer) return;
    e.preventDefault();
    canvasRef.current.setPointerCapture?.(e.pointerId);
    drawing.current = true;
    const { tool, color, size } = toolRef.current;
    const [x, y] = pos(e);
    store.current.live = { tool, color, size, points: [[x, y]] };
    redraw();
    socket?.send(JSON.stringify({ t: "d-start", tool, color, size, x, y }));
  }
  function onMove(e) {
    if (!isDrawer || !drawing.current) return;
    const [x, y] = pos(e);
    store.current.live?.points.push([x, y]);
    redraw();
    socket?.send(JSON.stringify({ t: "d-point", x, y }));
  }
  function onUp() {
    if (!isDrawer || !drawing.current) return;
    drawing.current = false;
    if (store.current.live) {
      store.current.strokes.push(store.current.live);
      store.current.live = null;
    }
    socket?.send(JSON.stringify({ t: "d-end" }));
  }

  return (
    <div className="canvas-wrap" ref={wrapRef}>
      <canvas
        ref={canvasRef}
        className={isDrawer ? "canvas drawer" : "canvas"}
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerLeave={onUp}
        onPointerCancel={onUp}
      />
      {!isDrawer && <div className="canvas-watermark">watching…</div>}
    </div>
  );
}
