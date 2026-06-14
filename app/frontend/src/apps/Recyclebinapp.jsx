import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { useOS } from '../context/OSContext';

export default function RecycleBinApp() {
  const { addNotif } = useOS();
  const [nodes, setNodes] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/files/recycle');
      setNodes(data.nodes);
    } catch {} finally { setLoading(false); }
  };

  const restore = async (id) => {
    try {
      await api.put(`/files/recycle/${id}/restore`);
      setNodes(n => n.filter(x => x.id !== id));
      addNotif('Recycle Bin', 'File restored', '↩️');
    } catch {}
  };

  const empty = async () => {
    if (!confirm('Permanently delete all items? This cannot be undone.')) return;
    try {
      await api.delete('/files/recycle/empty');
      setNodes([]);
      addNotif('Recycle Bin', 'Recycle Bin emptied', '🗑️');
    } catch {}
  };

  const EXT_ICONS = { folder:'📁', txt:'📄', md:'📝', jpg:'🖼️', png:'🖼️', mp3:'🎵', mp4:'🎬', zip:'📦' };
  const getIcon = (n) => {
    if (n.type === 'folder') return '📁';
    const ext = n.name.split('.').pop().toLowerCase();
    return EXT_ICONS[ext] || '📄';
  };

  const fmtDate = (d) => d ? new Date(d).toLocaleDateString() : 'Unknown';
  const fmtSize = (s) => s ? (s > 1048576 ? `${(s/1048576).toFixed(1)} MB` : s > 1024 ? `${(s/1024).toFixed(0)} KB` : `${s} B`) : '—';

  return (
    <div style={S.root}>
      {/* Header */}
      <div style={S.header}>
        <div>
          <div style={{ fontSize:18, color:'#fff', fontWeight:400 }}>🗑️ Recycle Bin</div>
          <div style={{ fontSize:12, color:'rgba(255,255,255,0.4)', marginTop:2 }}>{nodes.length} item(s)</div>
        </div>
        <div style={{ display:'flex', gap:8 }}>
          {selected && (
            <button className="btn btn-ghost" onClick={() => restore(selected)} style={{ fontSize:13 }}>↩ Restore</button>
          )}
          <button className="btn btn-ghost" onClick={load} style={{ fontSize:13 }}>↺ Refresh</button>
          <button className="btn" style={{ background:'rgba(200,50,50,0.4)', fontSize:13 }} onClick={empty} disabled={nodes.length===0}>
            🗑️ Empty Bin
          </button>
        </div>
      </div>

      {/* Column headers */}
      {nodes.length > 0 && (
        <div style={S.colHeader}>
          <span style={{ flex:1 }}>Name</span>
          <span style={{ width:100 }}>Type</span>
          <span style={{ width:80 }}>Size</span>
          <span style={{ width:110 }}>Deleted</span>
          <span style={{ width:90 }}>Actions</span>
        </div>
      )}

      {/* Items */}
      <div style={{ flex:1, overflowY:'auto', padding:'0 0 12px' }}>
        {loading ? (
          <div style={{ display:'flex', alignItems:'center', justifyContent:'center', padding:40 }}>
            <div className="spinner" />
          </div>
        ) : nodes.length === 0 ? (
          <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', height:'100%', color:'rgba(255,255,255,0.3)', gap:12, padding:40 }}>
            <span style={{ fontSize:60 }}>🗑️</span>
            <span style={{ fontSize:16 }}>Recycle Bin is empty</span>
            <span style={{ fontSize:13 }}>Deleted files will appear here</span>
          </div>
        ) : nodes.map(node => (
          <div
            key={node.id}
            style={{ ...S.row, ...(selected===node.id?S.rowSelected:{}) }}
            onClick={() => setSelected(node.id)}
          >
            <span style={{ flex:1, display:'flex', alignItems:'center', gap:10, overflow:'hidden' }}>
              <span style={{ fontSize:20, flexShrink:0 }}>{getIcon(node)}</span>
              <span style={{ overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', fontSize:13, color:'rgba(255,255,255,0.85)' }}>{node.name}</span>
            </span>
            <span style={{ width:100, fontSize:12, color:'rgba(255,255,255,0.4)' }}>{node.type}</span>
            <span style={{ width:80, fontSize:12, color:'rgba(255,255,255,0.4)' }}>{fmtSize(node.size)}</span>
            <span style={{ width:110, fontSize:12, color:'rgba(255,255,255,0.4)' }}>{fmtDate(node.deleted_at)}</span>
            <div style={{ width:90, display:'flex', gap:4 }}>
              <button style={S.actBtn} onClick={e => { e.stopPropagation(); restore(node.id); }} title="Restore">↩</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

const S = {
  root: { display:'flex', flexDirection:'column', height:'100%' },
  header: { display:'flex', alignItems:'center', justifyContent:'space-between', padding:'16px 20px', borderBottom:'0.5px solid rgba(255,255,255,0.07)', flexShrink:0 },
  colHeader: { display:'flex', alignItems:'center', padding:'8px 20px', fontSize:11, color:'rgba(255,255,255,0.3)', borderBottom:'0.5px solid rgba(255,255,255,0.06)', textTransform:'uppercase', letterSpacing:'0.05em', fontWeight:600, flexShrink:0 },
  row: { display:'flex', alignItems:'center', padding:'10px 20px', cursor:'pointer', transition:'background 0.1s', borderBottom:'0.5px solid rgba(255,255,255,0.04)' },
  rowSelected: { background:'rgba(0,120,212,0.2)' },
  actBtn: { background:'rgba(255,255,255,0.08)', border:'none', borderRadius:6, color:'rgba(255,255,255,0.7)', padding:'4px 8px', cursor:'pointer', fontSize:13 },
};
