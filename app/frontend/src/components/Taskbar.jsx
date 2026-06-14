import React, { useState, useEffect } from 'react';
import { useOS } from '../context/OSContext';

const ALL_APPS = [
  { id:'filemanager', name:'File Manager', icon:'📁' },
  { id:'terminal',    name:'Terminal', icon:'⬛' },
  { id:'browser',     name:'Browser', icon:'🌐' },
  { id:'calculator',  name:'Calculator', icon:'🧮' },
  { id:'notepad',     name:'Notepad', icon:'📝' },
  { id:'settings',    name:'Settings', icon:'⚙️' },
  { id:'mediaplayer', name:'Media Player', icon:'🎵' },
  { id:'appstore',    name:'App Store', icon:'🛒' },
  { id:'paint',       name:'Paint', icon:'🎨' },
  { id:'recycle',     name:'Recycle Bin', icon:'🗑️' },
];

export default function Taskbar() {
  const { state, dispatch, openWindow, minimizeWindow, focusWindow } = useOS();
  const [time, setTime] = useState('');
  const [date, setDate] = useState('');

  useEffect(() => {
    const tick = () => {
      const n = new Date();
      setTime(n.toLocaleTimeString([], { hour:'2-digit', minute:'2-digit' }));
      setDate(n.toLocaleDateString([], { weekday:'short', month:'short', day:'numeric' }));
    };
    tick(); const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  const unread = state.notifications.filter(n => !n.read).length;

  const handleTbApp = (win) => {
    if (win.minimized) { focusWindow(win.id); return; }
    if (state.focusedWindowId === win.id) { minimizeWindow(win.id); return; }
    focusWindow(win.id);
  };

  return (
    <div className="taskbar" onClick={e => e.stopPropagation()}>
      {/* Left: Start button */}
      <div className="tb-left">
        <button
          className={`tb-btn${state.startMenuOpen ? ' active' : ''}`}
          id="start-btn"
          onClick={() => dispatch({ type: 'TOGGLE_START' })}
          title="Start"
        >⊞</button>
      </div>

      {/* Center: Search + Running apps */}
      <div className="tb-center">
        <input className="tb-search" placeholder="🔍 Search apps and files..." readOnly
          onFocus={() => openWindow('filemanager')} />
        {state.windows.map(win => {
          const app = ALL_APPS.find(a => a.id === win.appId);
          if (!app) return null;
          return (
            <button
              key={win.id}
              className={`tb-btn running${win.id === state.focusedWindowId && !win.minimized ? ' active' : ''}`}
              title={app.name}
              onClick={() => handleTbApp(win)}
            >
              {app.icon}
            </button>
          );
        })}
      </div>

      {/* Right: System tray */}
      <div className="tb-right">
        <span title="Wi-Fi" style={{ fontSize:16, cursor:'default', color:'rgba(255,255,255,0.7)' }}>🌐</span>
        <span title="Volume" style={{ fontSize:16, cursor:'default', color:'rgba(255,255,255,0.7)' }}>🔊</span>
        <span title="Battery" style={{ fontSize:16, cursor:'default', color:'rgba(255,255,255,0.7)' }}>🔋</span>

        <button
          className={`tb-btn${state.notifPanelOpen ? ' active' : ''}`}
          style={{ fontSize:16, position:'relative' }}
          onClick={() => dispatch({ type: 'TOGGLE_NOTIF' })}
          title="Notifications"
        >
          🔔
          {unread > 0 && (
            <span style={{ position:'absolute', top:4, right:4, width:8, height:8, background:'#ef4444', borderRadius:'50%', border:'1.5px solid #111' }} />
          )}
        </button>

        <div className="tb-clock" onClick={() => dispatch({ type: 'TOGGLE_CAL' })}>
          <div className="tb-clock-time">{time}</div>
          <div className="tb-clock-date">{date}</div>
        </div>
      </div>
    </div>
  );
}
