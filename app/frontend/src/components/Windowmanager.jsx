import React, { useRef, useCallback } from 'react';
import { useOS } from '../context/OSContext';
import CalculatorApp from '../apps/CalculatorApp';
import TerminalApp from '../apps/TerminalApp';
import FileManagerApp from '../apps/FileManagerApp';
import BrowserApp from '../apps/BrowserApp';
import NotepadApp from '../apps/NotepadApp';
import SettingsApp from '../apps/SettingsApp';
import MediaPlayerApp from '../apps/MediaPlayerApp';
import AppStoreApp from '../apps/AppStoreApp';
import PaintApp from '../apps/PaintApp';
import RecycleBinApp from '../apps/RecycleBinApp';

const APP_REGISTRY = {
  calculator:  { component: CalculatorApp,  title: 'Calculator',   icon: '🧮', w: 320, h: 500 },
  terminal:    { component: TerminalApp,     title: 'Terminal',     icon: '⬛', w: 600, h: 420 },
  filemanager: { component: FileManagerApp,  title: 'File Manager', icon: '📁', w: 720, h: 500 },
  browser:     { component: BrowserApp,      title: 'Browser',      icon: '🌐', w: 760, h: 540 },
  notepad:     { component: NotepadApp,      title: 'Notepad',      icon: '📝', w: 580, h: 460 },
  settings:    { component: SettingsApp,     title: 'Settings',     icon: '⚙️', w: 740, h: 540 },
  mediaplayer: { component: MediaPlayerApp,  title: 'Media Player', icon: '🎵', w: 380, h: 540 },
  appstore:    { component: AppStoreApp,     title: 'App Store',    icon: '🛒', w: 660, h: 500 },
  paint:       { component: PaintApp,        title: 'Paint',        icon: '🎨', w: 700, h: 520 },
  recycle:     { component: RecycleBinApp,   title: 'Recycle Bin',  icon: '🗑️', w: 500, h: 420 },
};

export function openWindowConfig(appId) {
  const cfg = APP_REGISTRY[appId];
  if (!cfg) return null;
  const vw = window.innerWidth, vh = window.innerHeight - 48;
  return {
    id: appId,
    appId,
    title: cfg.title,
    icon: cfg.icon,
    x: Math.max(20, Math.round((vw - cfg.w) / 2) + Math.round((Math.random() - 0.5) * 80)),
    y: Math.max(20, Math.round((vh - cfg.h) / 2) + Math.round((Math.random() - 0.5) * 60)),
    w: cfg.w,
    h: cfg.h,
    minimized: false,
    maximized: false,
  };
}

export default function WindowManager() {
  const { state, dispatch, closeWindow, focusWindow, minimizeWindow, maximizeWindow, updateWindow } = useOS();

  const openWindow = useCallback((appId) => {
    const cfg = openWindowConfig(appId);
    if (cfg) dispatch({ type: 'OPEN_WINDOW', win: cfg });
  }, [dispatch]);

  // Expose openWindow globally so context can use it
  React.useEffect(() => {
    window.__osOpenWindow = openWindow;
  }, [openWindow]);

  return (
    <>
      {state.windows.map(win => (
        <OSWindow
          key={win.id}
          win={win}
          focused={state.focusedWindowId === win.id}
          onClose={() => closeWindow(win.id)}
          onFocus={() => focusWindow(win.id)}
          onMinimize={() => minimizeWindow(win.id)}
          onMaximize={() => maximizeWindow(win.id)}
          onUpdate={(data) => updateWindow(win.id, data)}
        />
      ))}
    </>
  );
}

function OSWindow({ win, focused, onClose, onFocus, onMinimize, onMaximize, onUpdate }) {
  const dragRef = useRef(null);
  const resizeRef = useRef(null);
  const cfg = APP_REGISTRY[win.appId];
  if (!cfg) return null;

  const AppComponent = cfg.component;

  // Window classes
  const classes = [
    'os-window',
    focused ? 'focused' : '',
    win.maximized ? 'maximized' : '',
    win.minimized ? 'minimized' : '',
  ].filter(Boolean).join(' ');

  // Position/size style
  const style = win.maximized ? {
    left: 0, top: 0,
    width: '100vw',
    height: `calc(100vh - var(--taskbar-h))`,
    zIndex: win.zIndex,
    borderRadius: 0,
  } : {
    left: win.x, top: win.y,
    width: win.w, height: win.h,
    zIndex: win.zIndex,
  };

  /* ── Drag ────────────────────────────────────────────────── */
  const startDrag = (e) => {
    if (e.target.closest('.win-controls') || win.maximized) return;
    e.preventDefault();
    const ox = e.clientX - win.x, oy = e.clientY - win.y;

    const onMove = (ev) => {
      const nh = window.innerHeight - 48;
      onUpdate({
        x: Math.max(-200, Math.min(ev.clientX - ox, window.innerWidth - 100)),
        y: Math.max(0, Math.min(ev.clientY - oy, nh - 40)),
      });
    };
    const onUp = () => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
    };
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  };

  /* ── Resize ──────────────────────────────────────────────── */
  const startResize = (e) => {
    e.preventDefault(); e.stopPropagation();
    const startX = e.clientX, startY = e.clientY;
    const startW = win.w, startH = win.h;
    const onMove = (ev) => onUpdate({
      w: Math.max(280, startW + ev.clientX - startX),
      h: Math.max(180, startH + ev.clientY - startY),
    });
    const onUp = () => { document.removeEventListener('mousemove', onMove); document.removeEventListener('mouseup', onUp); };
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  };

  return (
    <div className={classes} style={style} onMouseDown={onFocus}>
      <div className="win-titlebar" onMouseDown={startDrag} onDoubleClick={onMaximize}>
        <span className="win-tb-icon">{win.icon}</span>
        <span className="win-tb-title">{win.title}</span>
        <div className="win-controls">
          <button className="win-ctrl" onClick={onMinimize} title="Minimize">─</button>
          <button className="win-ctrl" onClick={onMaximize} title={win.maximized ? 'Restore' : 'Maximize'}>
            {win.maximized ? '❐' : '⬜'}
          </button>
          <button className="win-ctrl close" onClick={onClose} title="Close">✕</button>
        </div>
      </div>
      <div className="win-body">
        <AppComponent windowId={win.id} />
      </div>
      {!win.maximized && <div className="win-resize" onMouseDown={startResize} />}
    </div>
  );
}
