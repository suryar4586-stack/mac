import React, { useState, useEffect, useCallback } from 'react';
import api from '../utils/api';
import { useOS } from '../context/OSContext';

const ROOT_FOLDERS = ['Documents','Downloads','Pictures','Music','Videos'];
const EXT_ICONS = { folder:'📁', txt:'📄', md:'📝', docx:'📃', pdf:'📕', jpg:'🖼️', jpeg:'🖼️', png:'🖼️', gif:'🖼️', mp3:'🎵', mp4:'🎬', zip:'📦', exe:'⚙️', js:'📜', json:'📊', default:'📄' };

function getIcon(node) {
  if (node.type === 'folder') return '📁';
  const ext = node.name.split('.').pop().toLowerCase();
  return EXT_ICONS[ext] || EXT_ICONS.default;
}

export default function FileManagerApp() {
  const { addNotif } = useOS();
  const [nodes, setNodes] = useState([]);
  const [path, setPath] = useState([]);  // breadcrumb stack [{id, name}]
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [view, setView] = useState('grid'); // grid | list
  const [renaming, setRenaming] = useState(null);
  const [renameVal, setRenameVal] = useState('');

  const currentParentId = path.length > 0 ? path[path.length - 1].id : null;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = currentParentId ? { parentId: currentParentId } : {};
      const { data } = await api.get('/files', { params });
      setNodes(data.nodes);
    } catch { addNotif('File Manager', 'Failed to load files', '❌'); }
    finally { setLoading(false); }
  }, [currentParentId]);

  useEffect(() => { load(); }, [load]);

  const navigate = (node) => {
    if (node.type !== 'folder') return openFile(node);
    setPath(p => [...p, { id: node.id, name: node.name }]);
    setSelected(null);
  };

  const goBack = () => {
    setPath(p => p.slice(0, -1));
    setSelected(null);
  };

  const goToIndex = (idx) => {
    setPath(p => p.slice(0, idx + 1));
    setSelected(null);
  };

  const openFile = (node) => {
    // Open appropriate app
    const ext = node.name.split('.').pop().toLowerCase();
    if (['txt','md','js','json','html','css'].includes(ext)) window.__osOpenWindow?.('notepad');
    else if (['mp3','mp4'].includes(ext)) window.__osOpenWindow?.('mediaplayer');
  };

  const createFolder = async () => {
    const name = prompt('Folder name:');
    if (!name) return;
    try {
      await api.post('/files/folder', { name, parentId: currentParentId });
      addNotif('File Manager', `Folder "${name}" created`, '📁');
      load();
    } catch (e) { addNotif('File Manager', e.response?.data?.error || 'Error', '❌'); }
  };

  const uploadFile = async () => {
    const inp = document.createElement('input');
    inp.type = 'file'; inp.multiple = true;
    inp.onchange = async (e) => {
      const files = Array.from(e.target.files);
      for (const file of files) {
        const fd = new FormData();
        fd.append('file', file);
        if (currentParentId) fd.append('parentId', currentParentId);
        try {
          await api.post('/files/upload', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
        } catch {}
      }
      addNotif('File Manager', `${files.length} file(s) uploaded`, '⬆️');
      load();
    };
    inp.click();
  };

  const deleteNode = async (node) => {
    if (!confirm(`Move "${node.name}" to Recycle Bin?`)) return;
    try {
      await api.delete(`/files/${node.id}`);
      addNotif('File Manager', `"${node.name}" deleted`, '🗑️');
      setSelected(null);
      load();
    } catch {}
  };

  const startRename = (node) => { setRenaming(node.id); setRenameVal(node.name); };
  const confirmRename = async (node) => {
    if (!renameVal.trim() || renameVal === node.name) { setRenaming(null); return; }
    try {
      await api.put(`/files/${node.id}/rename`, { name: renameVal.trim() });
      load();
    } catch {}
    setRenaming(null);
  };

  const filtered = search
    ? nodes.filter(n => n.name.toLowerCase().includes(search.toLowerCase()))
    : nodes;

  return (
    <div style={S.root}>
      {/* Sidebar */}
      <div style={S.sidebar}>
        <div style={S.sideTitle}>Quick Access</div>
        <SideItem icon="🏠" label="Home" active={path.length===0} onClick={() => setPath([])} />
        {ROOT_FOLDERS.map(f => (
          <SideItem key={f} icon={EXT_ICONS.folder} label={f} active={false}
            onClick={() => {
              const node = nodes.find(n => n.name === f && n.type === 'folder');
              if (node) navigate(node);
            }} />
        ))}
        <div style={{ marginTop: 16 }}>
          <div style={S.sideTitle}>Actions</div>
          <SideItem icon="➕" label="New Folder" onClick={createFolder} />
          <SideItem icon="⬆️" label="Upload File" onClick={uploadFile} />
        </div>
      </div>

      {/* Main */}
      <div style={S.main}>
        {/* Toolbar */}
        <div style={S.toolbar}>
          <button style={S.tbBtn} onClick={goBack} disabled={path.length === 0}>←</button>
          {/* Breadcrumb */}
          <div style={{ display:'flex', alignItems:'center', gap:4, flex:1, flexWrap:'wrap' }}>
            <span style={S.bread} onClick={() => setPath([])}>Home</span>
            {path.map((p, i) => (
              <React.Fragment key={p.id}>
                <span style={{ color:'rgba(255,255,255,0.3)' }}>/</span>
                <span style={S.bread} onClick={() => goToIndex(i)}>{p.name}</span>
              </React.Fragment>
            ))}
          </div>
          <input style={{ ...S.searchInp, width:160 }} placeholder="🔍 Search..." value={search} onChange={e => setSearch(e.target.value)} />
          <button style={S.tbBtn} onClick={() => setView(v => v==='grid'?'list':'grid')}>{view==='grid'?'☰':'⊞'}</button>
          <button style={S.tbBtn} onClick={load}>↺</button>
        </div>

        {/* Content */}
        {loading ? (
          <div style={{ display:'flex', alignItems:'center', justifyContent:'center', flex:1 }}>
            <div className="spinner" />
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', flex:1, color:'rgba(255,255,255,0.3)', gap:12 }}>
            <span style={{ fontSize:48 }}>📂</span>
            <span>This folder is empty</span>
          </div>
        ) : view === 'grid' ? (
          <div style={S.grid}>
            {filtered.map(node => (
              <div
                key={node.id}
                style={{ ...S.gridItem, ...(selected===node.id ? S.gridSelected : {}) }}
                onClick={e => { e.stopPropagation(); setSelected(node.id); }}
                onDoubleClick={() => navigate(node)}
                onContextMenu={e => { e.preventDefault(); setSelected(node.id); }}
              >
                <span style={{ fontSize:32 }}>{getIcon(node)}</span>
                {renaming === node.id ? (
                  <input
                    style={{ ...S.renameInp, width:'100%' }}
                    value={renameVal}
                    onChange={e => setRenameVal(e.target.value)}
                    onBlur={() => confirmRename(node)}
                    onKeyDown={e => { if(e.key==='Enter') confirmRename(node); if(e.key==='Escape') setRenaming(null); }}
                    autoFocus onClick={e=>e.stopPropagation()}
                  />
                ) : (
                  <span style={S.gridLabel}>{node.name}</span>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div style={S.list}>
            <div style={S.listHeader}>
              <span style={{ flex:1 }}>Name</span>
              <span style={{ width:80 }}>Type</span>
              <span style={{ width:80 }}>Size</span>
            </div>
            {filtered.map(node => (
              <div
                key={node.id}
                style={{ ...S.listRow, ...(selected===node.id ? S.listSelected : {}) }}
                onClick={() => setSelected(node.id)}
                onDoubleClick={() => navigate(node)}
              >
                <span style={{ flex:1, display:'flex', alignItems:'center', gap:8 }}>
                  <span>{getIcon(node)}</span>
                  {renaming === node.id ? (
                    <input style={S.renameInp} value={renameVal}
                      onChange={e=>setRenameVal(e.target.value)}
                      onBlur={()=>confirmRename(node)}
                      onKeyDown={e=>{if(e.key==='Enter')confirmRename(node);if(e.key==='Escape')setRenaming(null);}}
                      autoFocus onClick={e=>e.stopPropagation()} />
                  ) : node.name}
                </span>
                <span style={{ width:80, color:'rgba(255,255,255,0.45)', fontSize:12 }}>{node.type}</span>
                <span style={{ width:80, color:'rgba(255,255,255,0.45)', fontSize:12 }}>{node.size ? `${(node.size/1024).toFixed(1)} KB` : '—'}</span>
              </div>
            ))}
          </div>
        )}

        {/* Status bar */}
        <div style={S.statusBar}>
          <span>{filtered.length} item(s)</span>
          {selected && (
            <div style={{ display:'flex', gap:6, marginLeft:'auto' }}>
              <button style={S.actionBtn} onClick={() => { const n=nodes.find(x=>x.id===selected); if(n) startRename(n); }}>✏️ Rename</button>
              <button style={{ ...S.actionBtn, background:'rgba(200,50,50,0.2)' }} onClick={() => { const n=nodes.find(x=>x.id===selected); if(n) deleteNode(n); }}>🗑️ Delete</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function SideItem({ icon, label, active, onClick }) {
  return (
    <div style={{ display:'flex', alignItems:'center', gap:8, padding:'7px 10px', borderRadius:8, cursor:'pointer', fontSize:13, color: active?'#fff':'rgba(255,255,255,0.55)', background: active?'rgba(0,120,212,0.25)':'transparent', transition:'background 0.12s', marginBottom:2 }}
      onClick={onClick}
      onMouseEnter={e=>{ if(!active) e.currentTarget.style.background='rgba(255,255,255,0.07)'; }}
      onMouseLeave={e=>{ if(!active) e.currentTarget.style.background='transparent'; }}>
      <span style={{ fontSize:16 }}>{icon}</span>
      <span>{label}</span>
    </div>
  );
}

const S = {
  root: { display:'flex', height:'100%', overflow:'hidden' },
  sidebar: { width:180, background:'rgba(0,0,0,0.25)', padding:'12px 8px', borderRight:'0.5px solid rgba(255,255,255,0.07)', overflowY:'auto', flexShrink:0 },
  sideTitle: { fontSize:11, color:'rgba(255,255,255,0.3)', textTransform:'uppercase', letterSpacing:'0.07em', padding:'4px 10px 6px', fontWeight:600 },
  main: { flex:1, display:'flex', flexDirection:'column', overflow:'hidden' },
  toolbar: { display:'flex', alignItems:'center', gap:6, padding:'8px 12px', borderBottom:'0.5px solid rgba(255,255,255,0.07)', flexShrink:0, flexWrap:'wrap' },
  tbBtn: { background:'rgba(255,255,255,0.08)', border:'none', borderRadius:6, color:'rgba(255,255,255,0.7)', padding:'5px 10px', cursor:'pointer', fontSize:14 },
  bread: { fontSize:13, color:'rgba(255,255,255,0.6)', cursor:'pointer', ':hover':{ color:'#fff' } },
  searchInp: { background:'rgba(255,255,255,0.08)', border:'0.5px solid rgba(255,255,255,0.1)', borderRadius:20, padding:'5px 12px', color:'#fff', fontSize:12, outline:'none' },
  grid: { display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(88px,1fr))', gap:8, padding:16, overflowY:'auto', flex:1, alignContent:'start' },
  gridItem: { display:'flex', flexDirection:'column', alignItems:'center', gap:5, padding:'10px 6px', borderRadius:10, cursor:'pointer', transition:'background 0.12s', textAlign:'center' },
  gridSelected: { background:'rgba(0,120,212,0.28)', outline:'1px solid rgba(0,120,212,0.5)' },
  gridLabel: { fontSize:11.5, color:'#fff', wordBreak:'break-word', lineHeight:1.3 },
  list: { flex:1, overflowY:'auto', padding:'0 12px' },
  listHeader: { display:'flex', padding:'8px 12px', fontSize:11, color:'rgba(255,255,255,0.35)', fontWeight:600, borderBottom:'0.5px solid rgba(255,255,255,0.07)', textTransform:'uppercase', letterSpacing:'0.05em' },
  listRow: { display:'flex', alignItems:'center', padding:'8px 12px', borderRadius:8, cursor:'pointer', fontSize:13, color:'rgba(255,255,255,0.8)', transition:'background 0.1s' },
  listSelected: { background:'rgba(0,120,212,0.25)' },
  renameInp: { background:'rgba(0,0,0,0.3)', border:'1px solid var(--accent)', borderRadius:4, color:'#fff', fontSize:11, padding:'2px 6px', outline:'none' },
  statusBar: { display:'flex', alignItems:'center', padding:'6px 16px', borderTop:'0.5px solid rgba(255,255,255,0.07)', fontSize:12, color:'rgba(255,255,255,0.4)', flexShrink:0, minHeight:36 },
  actionBtn: { background:'rgba(255,255,255,0.08)', border:'none', borderRadius:6, color:'rgba(255,255,255,0.8)', padding:'4px 10px', cursor:'pointer', fontSize:12 },
};
