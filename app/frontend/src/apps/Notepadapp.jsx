import React, { useState, useEffect, useRef, useCallback } from 'react';
import api from '../utils/api';

export default function NotepadApp() {
  const [notes, setNotes] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [content, setContent] = useState('');
  const [title, setTitle] = useState('Untitled');
  const [status, setStatus] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const autoRef = useRef(null);

  useEffect(() => { loadNotes(); }, []);

  const loadNotes = async () => {
    try {
      const { data } = await api.get('/notes');
      setNotes(data.notes);
      if (data.notes.length > 0 && !activeId) openNote(data.notes[0]);
    } catch {}
  };

  const openNote = async (note) => {
    try {
      const { data } = await api.get(`/notes/${note.id}`);
      setActiveId(data.note.id);
      setContent(data.note.content);
      setTitle(data.note.title);
      setStatus('');
    } catch {}
  };

  const newNote = async () => {
    try {
      const { data } = await api.post('/notes', { title: 'Untitled', content: '' });
      setNotes(n => [data.note, ...n]);
      openNote(data.note);
    } catch {}
  };

  const save = useCallback(async () => {
    if (!activeId) return;
    try {
      await api.put(`/notes/${activeId}`, { title, content });
      setStatus('Saved ✓');
      setNotes(n => n.map(x => x.id === activeId ? { ...x, title, preview: content.slice(0,120) } : x));
      setTimeout(() => setStatus(''), 2000);
    } catch { setStatus('Save failed'); }
  }, [activeId, title, content]);

  const deleteNote = async (id) => {
    if (!confirm('Delete this note?')) return;
    try {
      await api.delete(`/notes/${id}`);
      const remaining = notes.filter(n => n.id !== id);
      setNotes(remaining);
      if (activeId === id) {
        if (remaining.length > 0) openNote(remaining[0]);
        else { setActiveId(null); setContent(''); setTitle('Untitled'); }
      }
    } catch {}
  };

  // Autosave
  useEffect(() => {
    if (!activeId) return;
    clearTimeout(autoRef.current);
    setStatus('Unsaved');
    autoRef.current = setTimeout(save, 1500);
    return () => clearTimeout(autoRef.current);
  }, [content, title]);

  const handleKey = (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 's') { e.preventDefault(); save(); }
  };

  return (
    <div style={S.root} onKeyDown={handleKey}>
      {/* Sidebar */}
      {sidebarOpen && (
        <div style={S.sidebar}>
          <div style={S.sideHeader}>
            <span style={{ fontSize:13, color:'rgba(255,255,255,0.7)', fontWeight:500 }}>Notes</span>
            <button style={S.iconBtn} onClick={newNote} title="New note">＋</button>
          </div>
          <div style={{ overflowY:'auto', flex:1 }}>
            {notes.map(n => (
              <div
                key={n.id}
                style={{ ...S.noteItem, ...(n.id === activeId ? S.noteActive : {}) }}
                onClick={() => openNote(n)}
              >
                <div style={S.noteTitle}>{n.title || 'Untitled'}</div>
                <div style={S.notePreview}>{n.preview || 'Empty note'}</div>
                <button style={S.deleteBtn} onClick={e => { e.stopPropagation(); deleteNote(n.id); }} title="Delete">✕</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Editor */}
      <div style={S.editor}>
        <div style={S.editorToolbar}>
          <button style={S.iconBtn} onClick={() => setSidebarOpen(v => !v)} title="Toggle sidebar">☰</button>
          <input
            style={S.titleInput}
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="Note title..."
          />
          <span style={{ fontSize:11, color:'rgba(255,255,255,0.35)', marginLeft:'auto', paddingRight:4 }}>{status}</span>
          <button style={S.saveBtn} onClick={save}>💾 Save</button>
        </div>

        {/* Formatting toolbar */}
        <div style={S.fmtBar}>
          {['B','I','U'].map(f => (
            <button key={f} style={S.fmtBtn} title={f === 'B' ? 'Bold' : f === 'I' ? 'Italic' : 'Underline'}><strong>{f}</strong></button>
          ))}
          <span style={{ width:1, height:16, background:'rgba(255,255,255,0.1)', margin:'0 4px' }} />
          <button style={S.fmtBtn}>H1</button>
          <button style={S.fmtBtn}>H2</button>
          <button style={S.fmtBtn}>•</button>
          <button style={S.fmtBtn}>1.</button>
        </div>

        {activeId ? (
          <textarea
            style={S.textarea}
            value={content}
            onChange={e => setContent(e.target.value)}
            placeholder="Start writing..."
            spellCheck
          />
        ) : (
          <div style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', color:'rgba(255,255,255,0.3)', gap:12 }}>
            <span style={{ fontSize:48 }}>📝</span>
            <span>No note selected</span>
            <button className="btn" onClick={newNote}>Create New Note</button>
          </div>
        )}

        <div style={S.statusBar}>
          <span>{content.length} chars</span>
          <span>·</span>
          <span>{content.split(/\s+/).filter(Boolean).length} words</span>
          <span>·</span>
          <span>{content.split('\n').length} lines</span>
        </div>
      </div>
    </div>
  );
}

const S = {
  root: { display:'flex', height:'100%', overflow:'hidden' },
  sidebar: { width:200, background:'rgba(0,0,0,0.25)', borderRight:'0.5px solid rgba(255,255,255,0.07)', display:'flex', flexDirection:'column', flexShrink:0 },
  sideHeader: { display:'flex', alignItems:'center', justifyContent:'space-between', padding:'10px 12px', borderBottom:'0.5px solid rgba(255,255,255,0.07)' },
  noteItem: { padding:'10px 12px', cursor:'pointer', borderRadius:0, position:'relative', borderBottom:'0.5px solid rgba(255,255,255,0.04)', transition:'background 0.1s' },
  noteActive: { background:'rgba(0,120,212,0.2)' },
  noteTitle: { fontSize:13, color:'#fff', fontWeight:500, marginBottom:3, paddingRight:16, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' },
  notePreview: { fontSize:11, color:'rgba(255,255,255,0.4)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' },
  deleteBtn: { position:'absolute', top:8, right:8, background:'transparent', border:'none', color:'rgba(255,255,255,0.25)', cursor:'pointer', fontSize:12, padding:'2px 4px', borderRadius:4 },
  editor: { flex:1, display:'flex', flexDirection:'column', overflow:'hidden' },
  editorToolbar: { display:'flex', alignItems:'center', gap:8, padding:'8px 12px', borderBottom:'0.5px solid rgba(255,255,255,0.07)', flexShrink:0 },
  titleInput: { flex:1, background:'transparent', border:'none', outline:'none', fontSize:15, fontWeight:500, color:'#fff', padding:'4px 0' },
  saveBtn: { background:'rgba(0,120,212,0.3)', border:'none', borderRadius:8, color:'#fff', padding:'5px 12px', cursor:'pointer', fontSize:12, flexShrink:0 },
  iconBtn: { background:'rgba(255,255,255,0.08)', border:'none', borderRadius:6, color:'rgba(255,255,255,0.7)', width:28, height:28, cursor:'pointer', fontSize:16, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 },
  fmtBar: { display:'flex', alignItems:'center', gap:2, padding:'4px 12px', borderBottom:'0.5px solid rgba(255,255,255,0.06)', flexShrink:0 },
  fmtBtn: { background:'transparent', border:'none', borderRadius:6, color:'rgba(255,255,255,0.5)', padding:'4px 8px', cursor:'pointer', fontSize:12, transition:'background 0.1s' },
  textarea: { flex:1, background:'transparent', border:'none', outline:'none', resize:'none', color:'rgba(255,255,255,0.9)', fontSize:14, lineHeight:1.75, fontFamily:'var(--mono)', padding:'16px 20px' },
  statusBar: { display:'flex', alignItems:'center', gap:8, padding:'4px 16px', borderTop:'0.5px solid rgba(255,255,255,0.06)', fontSize:11, color:'rgba(255,255,255,0.3)', flexShrink:0 },
};
