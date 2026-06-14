import React, { useState, useEffect, useRef } from 'react';
import api from '../utils/api';

const INTRO = [
  { text: 'StackOS Terminal v1.0.0', cls: 'info' },
  { text: 'Type "help" for available commands.', cls: 'info' },
  { text: '──────────────────────────────────────', cls: 'dim' },
];

export default function TerminalApp() {
  const [lines, setLines] = useState(INTRO);
  const [input, setInput] = useState('');
  const [hist, setHist] = useState([]);
  const [histIdx, setHistIdx] = useState(-1);
  const [cwd, setCwd] = useState('~');
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, [lines]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [lines]);

  const print = (text, cls = '') => {
    const arr = typeof text === 'string' ? text.split('\n') : [text];
    setLines(l => [...l, ...arr.map(t => ({ text: t, cls }))]);
  };

  const run = async (cmd) => {
    print(`user@stackos:${cwd}$ ${cmd}`, 'prompt');
    if (!cmd.trim()) return;

    if (cmd.trim() === 'clear') { setLines([]); return; }

    try {
      const { data } = await api.post('/terminal/exec', { command: cmd });
      if (data.output === '__CLEAR__') { setLines([]); return; }
      if (data.cwd) setCwd(data.cwd);
      if (data.output) print(data.output, data.exitCode !== 0 ? 'error' : '');
    } catch (err) {
      print(err.response?.data?.error || 'Connection error', 'error');
    }
  };

  const handleKey = async (e) => {
    if (e.key === 'Enter') {
      const cmd = input.trim();
      setInput('');
      setHistIdx(-1);
      if (cmd) setHist(h => [cmd, ...h.slice(0, 49)]);
      await run(cmd);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      const idx = Math.min(histIdx + 1, hist.length - 1);
      setHistIdx(idx);
      setInput(hist[idx] || '');
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      const idx = Math.max(histIdx - 1, -1);
      setHistIdx(idx);
      setInput(idx < 0 ? '' : hist[idx]);
    } else if (e.key === 'Tab') {
      e.preventDefault();
      // basic autocomplete hint
    }
  };

  const cls2style = (cls) => {
    if (cls === 'prompt') return { color: '#0aff0a' };
    if (cls === 'error')  return { color: '#ff6b6b' };
    if (cls === 'info')   return { color: '#60c0ff' };
    if (cls === 'dim')    return { color: 'rgba(255,255,255,0.3)' };
    return { color: '#ccff99' };
  };

  return (
    <div
      style={S.root}
      onClick={() => inputRef.current?.focus()}
    >
      <div style={S.output}>
        {lines.map((l, i) => (
          <div key={i} style={{ ...S.line, ...cls2style(l.cls) }}>{l.text || '\u00A0'}</div>
        ))}
        <div ref={bottomRef} />
      </div>
      <div style={S.inputRow}>
        <span style={{ color: '#0aff0a', flexShrink: 0 }}>user@stackos:{cwd}$&nbsp;</span>
        <input
          ref={inputRef}
          style={S.input}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKey}
          spellCheck={false}
          autoComplete="off"
        />
      </div>
    </div>
  );
}

const S = {
  root: { display:'flex', flexDirection:'column', height:'100%', background:'#0c0c14', fontFamily:'var(--mono)', fontSize:13, cursor:'text', overflow:'hidden' },
  output: { flex:1, overflowY:'auto', padding:'12px 14px', display:'flex', flexDirection:'column', gap:1 },
  line: { lineHeight:1.65, whiteSpace:'pre-wrap', wordBreak:'break-all' },
  inputRow: { display:'flex', alignItems:'center', padding:'8px 14px', borderTop:'0.5px solid rgba(255,255,255,0.06)', background:'rgba(0,0,0,0.3)', flexShrink:0 },
  input: { flex:1, background:'transparent', border:'none', outline:'none', color:'#ccff99', fontFamily:'var(--mono)', fontSize:13, caretColor:'#ccff99', padding:0 },
};
