import React, { useState } from 'react';
import { useOS } from '../context/OSContext';

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const DAYS = ['Su','Mo','Tu','We','Th','Fr','Sa'];

export default function CalendarPopup() {
  const { state } = useOS();
  const [cal, setCal] = useState(new Date());

  if (!state.calendarOpen) return null;

  const today = new Date();
  const first = new Date(cal.getFullYear(), cal.getMonth(), 1);
  const last = new Date(cal.getFullYear(), cal.getMonth() + 1, 0);

  const prev = () => setCal(d => new Date(d.getFullYear(), d.getMonth() - 1, 1));
  const next = () => setCal(d => new Date(d.getFullYear(), d.getMonth() + 1, 1));

  const cells = [];
  for (let i = 0; i < first.getDay(); i++) cells.push(null);
  for (let d = 1; d <= last.getDate(); d++) cells.push(d);

  const isToday = (d) =>
    d && d === today.getDate() && cal.getMonth() === today.getMonth() && cal.getFullYear() === today.getFullYear();

  return (
    <div className="cal-popup" onClick={e => e.stopPropagation()}>
      <div className="cal-header">
        <button className="cal-nav-btn" onClick={prev}>‹</button>
        <span style={{ fontSize:14, fontWeight:500, color:'#fff' }}>{MONTHS[cal.getMonth()]} {cal.getFullYear()}</span>
        <button className="cal-nav-btn" onClick={next}>›</button>
      </div>
      <div className="cal-grid">
        {DAYS.map(d => <div key={d} className="cal-day-hdr">{d}</div>)}
        {cells.map((d, i) => (
          <div key={i} className={`cal-day${isToday(d) ? ' today' : ''}${!d ? ' other' : ''}`}>
            {d || ''}
          </div>
        ))}
      </div>
      <div style={{ marginTop:14, borderTop:'0.5px solid rgba(255,255,255,0.08)', paddingTop:12 }}>
        <div style={{ fontSize:11, color:'rgba(255,255,255,0.35)', textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:6 }}>Today</div>
        <div style={{ fontSize:14, color:'#fff' }}>{today.toLocaleDateString(undefined, { weekday:'long', month:'long', day:'numeric' })}</div>
        <div style={{ fontSize:13, color:'rgba(255,255,255,0.5)', marginTop:2 }}>{today.toLocaleTimeString()}</div>
      </div>
    </div>
  );
}
