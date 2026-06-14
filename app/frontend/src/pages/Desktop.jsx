import React, { useEffect, useRef } from 'react';
import { useOS } from '../context/OSContext';
import Wallpaper from '../components/Wallpaper';
import DesktopIcons from '../components/DesktopIcons';
import Taskbar from '../components/Taskbar';
import StartMenu from '../components/StartMenu';
import WindowManager from '../components/WindowManager';
import NotificationPanel from '../components/NotificationPanel';
import CalendarPopup from '../components/CalendarPopup';
import ContextMenu from '../components/ContextMenu';
import '../styles/desktop.css';

export default function Desktop() {
  const { dispatch } = useOS();
  const ctxRef = useRef(null);

  useEffect(() => {
    const close = () => dispatch({ type: 'CLOSE_ALL_PANELS' });
    window.addEventListener('keydown', e => { if (e.key === 'Escape') close(); });
    return () => window.removeEventListener('keydown', close);
  }, []);

  return (
    <div className="os-root" onClick={() => dispatch({ type: 'CLOSE_ALL_PANELS' })}>
      <Wallpaper />
      <DesktopIcons />
      <WindowManager />
      <StartMenu />
      <NotificationPanel />
      <CalendarPopup />
      <ContextMenu ref={ctxRef} />
      <Taskbar />
    </div>
  );
}
