import React, { useState, useRef } from 'react';
import { useOS } from '../context/OSContext';

const ICONS = [
  { appId:'filemanager', label:'Files', icon:'📁', x:20, y:20 },
  { appId:'browser',     label:'Browser', icon:'🌐', x:20, y:108 },
  { appId:'terminal',    label:'Terminal', icon:'⬛', x:20, y:196 },
  { appId:'settings',    label:'Settings', icon:'⚙️', x:20, y:284 },
  { appId:'recycle',     label:'Recycle Bin', icon:'🗑️', x:20, y:372 },
];

export default function DesktopIcons() {
  const { openWindow, dispatch } = useOS();
  const [selected, setSelected] = useState(null);
  const [positions, setPositions] = useState(() => Object.fromEntries(ICONS.map(i => [i.appId, { x: i.x, y: i.y }])));
  const dragRef = useRef(null);

  const handleMouseDown = (e, appId) => {
    if (e.button !== 0) return;
    e.stopPropagation();
    setSelected(appId);
    const start = { mx: e.clientX, my: e.clientY, ox: positions[appId].x, oy: positions[appId].y };
    let moved = false;

    const onMove = (ev) => {
      moved = true;
      setPositions(p => ({ ...p, [appId]: { x: start.ox + ev.clientX - start.mx, y: start.oy + ev.clientY - start.my } }));
    };
    const onUp = () => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
    };
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  };

  const handleDblClick = (appId) => openWindow(appId);

  const handleDesktopClick = (e) => {
    if (e.target === e.currentTarget) setSelected(null);
  };

  const handleCtxMenu = (e) => {
    e.preventDefault();
    dispatch({ type: 'SHOW_CTX_MENU', x: e.clientX, y: e.clientY });
  };

  return (
    <div
      className="desktop-area"
      onClick={handleDesktopClick}
      onContextMenu={handleCtxMenu}
    >
      {ICONS.map(icon => (
        <div
          key={icon.appId}
          className={`desk-icon${selected === icon.appId ? ' selected' : ''}`}
          style={{ left: positions[icon.appId].x, top: positions[icon.appId].y }}
          onMouseDown={e => handleMouseDown(e, icon.appId)}
          onDoubleClick={() => handleDblClick(icon.appId)}
          onClick={e => { e.stopPropagation(); setSelected(icon.appId); }}
        >
          <span className="di-emoji">{icon.icon}</span>
          <span className="di-label">{icon.label}</span>
        </div>
      ))}
    </div>
  );
}
