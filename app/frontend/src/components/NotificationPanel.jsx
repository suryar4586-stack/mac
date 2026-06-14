import React from 'react';
import { useOS } from '../context/OSContext';
import api from '../utils/api';

export default function NotificationPanel() {
  const { state, dispatch } = useOS();
  if (!state.notifPanelOpen) return null;

  const clear = async () => {
    dispatch({ type: 'CLEAR_NOTIFS' });
    try { await api.delete('/notifications'); } catch {}
  };

  return (
    <div className="notif-panel" onClick={e => e.stopPropagation()}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:10 }}>
        <span style={{ fontSize:14, fontWeight:500, color:'#fff' }}>Notifications</span>
        {state.notifications.length > 0 && (
          <button onClick={clear} style={{ background:'transparent', border:'none', color:'rgba(255,255,255,0.45)', fontSize:12, cursor:'pointer' }}>
            Clear all
          </button>
        )}
      </div>
      {state.notifications.length === 0 ? (
        <div style={{ textAlign:'center', padding:'28px 0', color:'rgba(255,255,255,0.3)', fontSize:13 }}>
          <div style={{ fontSize:36, marginBottom:8 }}>🔔</div>
          No notifications
        </div>
      ) : (
        state.notifications.map((n, i) => (
          <div key={n.id || i} className="notif-item">
            <div className="notif-item-header">
              <span className="notif-item-icon">{n.icon || '🔔'}</span>
              <span className="notif-item-title">{n.title}</span>
              <span className="notif-item-time">{n.time || ''}</span>
            </div>
            {n.body && <div className="notif-item-body">{n.body}</div>}
          </div>
        ))
      )}
    </div>
  );
}
