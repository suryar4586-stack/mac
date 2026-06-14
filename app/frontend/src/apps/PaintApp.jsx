import React, { useRef, useState, useEffect, useCallback } from 'react';

const COLORS = ['#ffffff','#000000','#0078d4','#ef4444','#22c55e','#f59e0b','#a855f7','#ec4899','#06b6d4','#f97316','#84cc16','#64748b'];

export default function PaintApp() {
  const canvasRef = useRef(null);
  const [tool, setTool] = useState('pen');
  const [color, setColor] = useState('#0078d4');
  const [size, setSize] = useState(4);
  const [drawing, setDrawing] = useState(false);
  const [last, setLast] = useState(null);
  const [history, setHistory] = useState([]);
  const [histIdx, setHistIdx] = useState(-1);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    saveHistory();
  }, []);

  const saveHistory = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const snap = canvas.toDataURL();
    setHistory(h => {
      const newH = h.slice(0, histIdx + 1);
      return [...newH, snap];
    });
    setHistIdx(i => i + 1);
  }, [histIdx]);

  const getPos = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const startDraw = (e) => {
    setDrawing(true);
    const pos = getPos(e);
    setLast(pos);
    // For shapes, record start
    if (tool === 'fill') {
      floodFill(pos);
      setDrawing(false);
    }
  };

  const draw = (e) => {
    if (!drawing || !last) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const pos = getPos(e);

    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    if (tool === 'pen') {
      ctx.beginPath();
      ctx.moveTo(last.x, last.y);
      ctx.lineTo(pos.x, pos.y);
      ctx.strokeStyle = color;
      ctx.lineWidth = size;
      ctx.stroke();
    } else if (tool === 'eraser') {
      ctx.beginPath();
      ctx.moveTo(last.x, last.y);
      ctx.lineTo(pos.x, pos.y);
      ctx.strokeStyle = '#1a1a2e';
      ctx.lineWidth = size * 3;
      ctx.stroke();
    } else if (tool === 'spray') {
      for (let i = 0; i < 20; i++) {
        const dx = (Math.random() - 0.5) * size * 6;
        const dy = (Math.random() - 0.5) * size * 6;
        ctx.beginPath();
        ctx.arc(pos.x + dx, pos.y + dy, 0.8, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.fill();
      }
    }
    setLast(pos);
  };

  const endDraw = () => {
    if (!drawing) return;
    setDrawing(false);
    setLast(null);
    saveHistory();
  };

  const floodFill = (pos) => {
    // Simple fill at click point area
    const ctx = canvasRef.current.getContext('2d');
    ctx.fillStyle = color;
    ctx.fillRect(pos.x - 20, pos.y - 20, 40, 40);
  };

  const clear = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    saveHistory();
  };

  const undo = () => {
    if (histIdx <= 0) return;
    const newIdx = histIdx - 1;
    setHistIdx(newIdx);
    const img = new Image();
    img.onload = () => { canvasRef.current?.getContext('2d').drawImage(img, 0, 0); };
    img.src = history[newIdx];
  };

  const redo = () => {
    if (histIdx >= history.length - 1) return;
    const newIdx = histIdx + 1;
    setHistIdx(newIdx);
    const img = new Image();
    img.onload = () => { canvasRef.current?.getContext('2d').drawImage(img, 0, 0); };
    img.src = history[newIdx];
  };

  const download = () => {
    const a = document.createElement('a');
    a.download = 'stackos-painting.png';
    a.href = canvasRef.current.toDataURL();
    a.click();
  };

  const drawRect = (e) => {
    // Rectangle drawing support placeholder
  };

  const TOOLS = [
    { id:'pen',    icon:'✏️', label:'Pen' },
    { id:'eraser', icon:'🧹', label:'Eraser' },
    { id:'spray',  icon:'💨', label:'Spray' },
    { id:'fill',   icon:'🪣', label:'Fill' },
  ];

  return (
    <div style={S.root}>
      {/* Toolbar */}
      <div style={S.toolbar}>
        {/* Tools */}
        <div style={S.toolGroup}>
          {TOOLS.map(t => (
            <button key={t.id} style={{ ...S.toolBtn, ...(tool===t.id?S.toolActive:{}) }}
              onClick={() => setTool(t.id)} title={t.label}>
              {t.icon}
            </button>
          ))}
        </div>

        <div style={S.divider} />

        {/* Size */}
        <div style={S.toolGroup}>
          <span style={S.label}>Size</span>
          <input type="range" min={1} max={30} value={size} onChange={e => setSize(+e.target.value)} style={{ width:80, accentColor:'var(--accent)' }} />
          <span style={{ ...S.label, width:18 }}>{size}</span>
        </div>

        <div style={S.divider} />

        {/* Color picker */}
        <div style={S.toolGroup}>
          <div style={{ ...S.colorSwatch, background:color, outline:'2px solid #fff', outlineOffset:1 }} title="Current color" />
          <input type="color" value={color} onChange={e => setColor(e.target.value)}
            style={{ width:28, height:28, border:'none', padding:2, background:'none', cursor:'pointer', borderRadius:4 }} />
          {COLORS.map(c => (
            <div key={c} style={{ ...S.colorSwatch, background:c, ...(c===color?{outline:'2px solid #fff',outlineOffset:1}:{}) }}
              onClick={() => setColor(c)} />
          ))}
        </div>

        <div style={S.divider} />

        {/* Actions */}
        <div style={S.toolGroup}>
          <button style={S.actionBtn} onClick={undo} disabled={histIdx<=0} title="Undo">↩</button>
          <button style={S.actionBtn} onClick={redo} disabled={histIdx>=history.length-1} title="Redo">↪</button>
          <button style={S.actionBtn} onClick={clear} title="Clear">🗑️</button>
          <button style={{ ...S.actionBtn, background:'rgba(0,120,212,0.3)' }} onClick={download} title="Save PNG">💾</button>
        </div>
      </div>

      {/* Canvas */}
      <div style={S.canvasWrap}>
        <canvas
          ref={canvasRef}
          style={{ width:'100%', height:'100%', cursor: tool==='eraser'?'cell':tool==='fill'?'crosshair':'crosshair', display:'block' }}
          onMouseDown={startDraw}
          onMouseMove={draw}
          onMouseUp={endDraw}
          onMouseLeave={endDraw}
        />
      </div>
    </div>
  );
}

const S = {
  root: { display:'flex', flexDirection:'column', height:'100%', background:'#1a1a2e' },
  toolbar: { display:'flex', alignItems:'center', gap:6, padding:'6px 12px', background:'rgba(0,0,0,0.4)', borderBottom:'0.5px solid rgba(255,255,255,0.08)', flexShrink:0, flexWrap:'wrap' },
  toolGroup: { display:'flex', alignItems:'center', gap:4 },
  toolBtn: { background:'rgba(255,255,255,0.07)', border:'none', borderRadius:7, color:'rgba(255,255,255,0.7)', width:32, height:32, cursor:'pointer', fontSize:15, display:'flex', alignItems:'center', justifyContent:'center', transition:'background 0.1s' },
  toolActive: { background:'rgba(0,120,212,0.35)', color:'#fff', outline:'1px solid rgba(0,120,212,0.5)' },
  divider: { width:1, height:24, background:'rgba(255,255,255,0.1)', margin:'0 2px' },
  label: { fontSize:11, color:'rgba(255,255,255,0.4)', whiteSpace:'nowrap' },
  colorSwatch: { width:20, height:20, borderRadius:4, cursor:'pointer', border:'1px solid rgba(255,255,255,0.1)', flexShrink:0 },
  actionBtn: { background:'rgba(255,255,255,0.07)', border:'none', borderRadius:7, color:'rgba(255,255,255,0.7)', width:30, height:30, cursor:'pointer', fontSize:15, display:'flex', alignItems:'center', justifyContent:'center' },
  canvasWrap: { flex:1, overflow:'hidden', background:'#1a1a2e' },
};
