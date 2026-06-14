import React, { useState, useEffect, useCallback } from 'react';

const KEYS = [
  ['AC', '+/-', '%', '÷'],
  ['7',  '8',   '9', '×'],
  ['4',  '5',   '6', '−'],
  ['1',  '2',   '3', '+'],
  ['0',        '.',  '='],
];

export default function CalculatorApp() {
  const [display, setDisplay] = useState('0');
  const [expr, setExpr] = useState('');
  const [fresh, setFresh] = useState(false);

  const press = useCallback((k) => {
    setDisplay(prev => {
      if (k === 'AC') { setExpr(''); setFresh(false); return '0'; }
      if (k === '+/-') return (parseFloat(prev) * -1).toString();
      if (k === '%') return (parseFloat(prev) / 100).toString();
      if (['÷','×','−','+'].includes(k)) {
        const op = { '÷':'/', '×':'*', '−':'-', '+':'+' }[k];
        setExpr(prev + op);
        setFresh(true);
        return prev;
      }
      if (k === '=') {
        if (!expr) return prev;
        try {
          const result = Function('"use strict";return(' + expr + prev + ')')();
          const r = parseFloat(result.toFixed(10)).toString();
          setExpr('');
          setFresh(true);
          return r;
        } catch { setExpr(''); return 'Error'; }
      }
      if (k === '.') {
        if (fresh) { setFresh(false); return '0.'; }
        return prev.includes('.') ? prev : prev + '.';
      }
      if (fresh) { setFresh(false); return k; }
      return prev === '0' ? k : prev.length > 12 ? prev : prev + k;
    });
  }, [expr]);

  useEffect(() => {
    const handler = (e) => {
      const map = { '0':'0','1':'1','2':'2','3':'3','4':'4','5':'5','6':'6','7':'7','8':'8','9':'9','.':'.','Enter':'=','=':'=','+':'+','-':'−','*':'×','/':'÷','Backspace':'⌫','Escape':'AC' };
      if (map[e.key]) press(map[e.key]);
      if (e.key === 'Backspace') setDisplay(d => d.length > 1 ? d.slice(0,-1) : '0');
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [press]);

  const keyClass = (k) => {
    if (k === '=') return 'eq';
    if (['÷','×','−','+'].includes(k)) return 'op';
    if (['AC','+/-','%'].includes(k)) return 'fn';
    return '';
  };

  return (
    <div style={S.root}>
      <div style={S.display}>
        <div style={S.expr}>{expr || ' '}</div>
        <div style={S.val}>{display}</div>
      </div>
      <div style={S.grid}>
        {KEYS.flat().map((k, i) => (
          <button
            key={i}
            style={{ ...S.key, ...(k === '0' ? S.wide : {}), ...S[keyClass(k)] }}
            onClick={() => press(k)}
          >{k}</button>
        ))}
      </div>
    </div>
  );
}

const S = {
  root: { padding:16, display:'flex', flexDirection:'column', gap:12, height:'100%', background:'rgba(0,0,0,0.15)' },
  display: { background:'rgba(0,0,0,0.35)', borderRadius:12, padding:'12px 18px', textAlign:'right' },
  expr: { fontSize:13, color:'rgba(255,255,255,0.45)', minHeight:18 },
  val: { fontSize:38, fontWeight:200, color:'#fff', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' },
  grid: { display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:8, flex:1 },
  key: { background:'rgba(255,255,255,0.1)', border:'none', borderRadius:12, color:'#fff', fontSize:18, fontFamily:'var(--font)', cursor:'pointer', transition:'background 0.1s, transform 0.08s', minHeight:58 },
  fn:  { background:'rgba(255,255,255,0.18)' },
  op:  { background:'rgba(255,255,255,0.15)', color:'#60aaff' },
  eq:  { background:'var(--accent)', color:'#fff' },
  wide: { gridColumn:'span 2' },
};
