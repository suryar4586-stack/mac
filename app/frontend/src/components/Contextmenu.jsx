import React, { useState, useEffect, forwardRef } from 'react';
import { useOS } from '../context/OSContext';

export default forwardRef(function ContextMenu(_props, _ref) {
  const { openWindow } = useOS();
  const [menu, setMenu] = useState(null);

  useEffect(() => {
    const handler = (e) => {
      // Only show on desktop background
      if (!e.target.closest('.desktop-area') || e.target.closest('.desk-icon')) return;
      e.preventDefault();
      let x = e.clientX, y = e.clientY;
      if (x + 200 > window.innerWidth) x = window.innerWidth - 204;
      if (y + 200 > window.innerHeight - 48) y = window.innerHeight - 48 - 204;
      setMenu({ x, y });
    };
    const close = () => setMenu(null);
    window.addEventListener('contextmenu', handler);
    window.addEventListener('click', close);
    return () => { window.removeEventListener('contextmenu', handler); window.removeEventListener('click', close); };
  }, []);

  if (!menu) return null;

  const items = [
    { label:'↻ Refresh', action: () => window.location.reload() },
    { label:'🎨 Personalize', action: () => openWindow('settings') },
    null,
    { label:'📁 New Folder', action: () => openWindow('filemanager') },
    null,
    { label:'⬛ Open Terminal', action: () => openWindow('terminal') },
    { label:'🌐 Open Browser', action: () => openWindow('browser') },
    null,
    { label:'⚙️ Settings', action: () => openWindow('settings') },
  ];

  return (
    <div className="ctx-menu" style={{ left: menu.x, top: menu.y }} onClick={e => e.stopPropagation()}>
      {items.map((item, i) =>
        item === null
          ? <div key={i} className="ctx-sep" />
          : <div key={i} className="ctx-item" onClick={() => { item.action(); setMenu(null); }}>{item.label}</div>
      )}
    </div>
  );
});
