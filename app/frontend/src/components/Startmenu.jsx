import React, { useState } from 'react';
import { useOS } from '../context/OSContext';

const PINNED_APPS = [
  { id:'filemanager', name:'Files',       icon:'📁' },
  { id:'browser',     name:'Browser',     icon:'🌐' },
  { id:'terminal',    name:'Terminal',    icon:'⬛' },
  { id:'calculator',  name:'Calculator',  icon:'🧮' },
  { id:'notepad',     name:'Notepad',     icon:'📝' },
  { id:'settings',    name:'Settings',    icon:'⚙️' },
  { id:'mediaplayer', name:'Media',       icon:'🎵' },
  { id:'appstore',    name:'Store',       icon:'🛒' },
  { id:'paint',       name:'Paint',       icon:'🎨' },
  { id:'recycle',     name:'Recycle Bin', icon:'🗑️' },
  { id:'filemanager', name:'Documents',   icon:'📄' },
  { id:'filemanager', name:'Downloads',   icon:'⬇️' },
];

export default function StartMenu() {
  const { state, dispatch, openWindow, logout } = useOS();
  const [query, setQuery] = useState('');

  if (!state.startMenuOpen) return null;

  const filtered = PINNED_APPS.filter(a =>
    a.name.toLowerCase().includes(query.toLowerCase())
  );

  const open = (id) => {
    openWindow(id);
    dispatch({ type: 'CLOSE_ALL_PANELS' });
  };

  return (
    <div className="start-menu" onClick={e => e.stopPropagation()}>
      <input
        className="sm-search"
        placeholder="🔍 Search apps, files, settings..."
        value={query}
        onChange={e => setQuery(e.target.value)}
        autoFocus
      />

      <div>
        <div className="sm-section-title">Pinned</div>
        <div className="sm-grid">
          {filtered.map((app, i) => (
            <div key={i} className="sm-app" onDoubleClick={() => open(app.id)} onClick={() => open(app.id)}>
              <div className="sm-app-icon">{app.icon}</div>
              <div className="sm-app-name">{app.name}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="sm-footer">
        <div className="sm-user">
          <div className="sm-avatar">
            {state.user?.avatar
              ? <img src={state.user.avatar} alt="avatar" />
              : (state.user?.username?.[0] || 'U').toUpperCase()}
          </div>
          <span>{state.user?.username || 'User'}</span>
        </div>
        <div className="sm-power">
          <button className="sm-power-btn" title="Settings" onClick={() => open('settings')}>⚙️</button>
          <button className="sm-power-btn" title="Lock" onClick={() => dispatch({ type: 'LOCK' })}>🔒</button>
          <button className="sm-power-btn danger" title="Sign out" onClick={logout}>⏻</button>
        </div>
      </div>
    </div>
  );
}
