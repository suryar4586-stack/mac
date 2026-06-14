import React, { useState, useRef } from 'react';
import api from '../utils/api';

const QUICK_LINKS = [
  { icon:'🔍', name:'Google',    url:'https://www.google.com' },
  { icon:'📺', name:'YouTube',   url:'https://www.youtube.com' },
  { icon:'🐙', name:'GitHub',    url:'https://github.com' },
  { icon:'📚', name:'Wikipedia', url:'https://www.wikipedia.org' },
  { icon:'📰', name:'HN',        url:'https://news.ycombinator.com' },
  { icon:'🤖', name:'Claude',    url:'https://claude.ai' },
];

export default function BrowserApp() {
  const [url, setUrl] = useState('');
  const [tab, setTab] = useState('home'); // home | iframe
  const [bookmarks, setBookmarks] = useState([]);
  const [showBookmarks, setShowBookmarks] = useState(false);
  const [history, setHistory] = useState([]);
  const inputRef = useRef(null);

  const navigate = async (target) => {
    let full = target.trim();
    if (!full) return;
    if (!full.startsWith('http')) full = full.includes('.') ? `https://${full}` : `https://www.google.com/search?q=${encodeURIComponent(full)}`;
    setUrl(full);
    setTab('iframe');
    // Save to history
    try {
      await api.post('/browser/history', { url: full, title: full });
      setHistory(h => [{ url: full, title: full, time: new Date().toLocaleTimeString() }, ...h.slice(0, 49)]);
    } catch {}
  };

  const addBookmark = async () => {
    if (!url) return;
    try {
      const { data } = await api.post('/browser/bookmarks', { url, title: url });
      setBookmarks(b => [data.bookmark, ...b]);
    } catch {}
  };

  const loadBookmarks = async () => {
    try {
      const { data } = await api.get('/browser/bookmarks');
      setBookmarks(data.bookmarks);
    } catch {}
    setShowBookmarks(v => !v);
  };

  return (
    <div style={S.root}>
      {/* Toolbar */}
      <div style={S.toolbar}>
        <button style={S.navBtn} onClick={() => setTab('home')} title="Home">🏠</button>
        <button style={S.navBtn} title="Back">←</button>
        <button style={S.navBtn} title="Forward">→</button>
        <button style={S.navBtn} onClick={() => navigate(url)} title="Reload">↻</button>
        <input
          ref={inputRef}
          style={S.urlBar}
          value={url}
          onChange={e => setUrl(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && navigate(url)}
          placeholder="Search or enter URL..."
        />
        <button style={S.navBtn} onClick={addBookmark} title="Bookmark">⭐</button>
        <button style={{ ...S.navBtn, ...(showBookmarks ? S.navActive : {}) }} onClick={loadBookmarks} title="Bookmarks">📋</button>
      </div>

      {/* Bookmarks dropdown */}
      {showBookmarks && (
        <div style={S.bookmarkPanel}>
          <div style={S.bkHeader}>
            <span style={{ fontSize:13, color:'#fff', fontWeight:500 }}>Bookmarks</span>
            <button style={S.bkClose} onClick={() => setShowBookmarks(false)}>✕</button>
          </div>
          {bookmarks.length === 0 ? (
            <div style={{ padding:'12px 16px', fontSize:12, color:'rgba(255,255,255,0.4)' }}>No bookmarks yet. Click ⭐ to add.</div>
          ) : bookmarks.map((b, i) => (
            <div key={i} style={S.bkItem} onClick={() => { navigate(b.url); setShowBookmarks(false); }}>
              🔗 <span style={{ fontSize:12, color:'rgba(255,255,255,0.8)' }}>{b.title || b.url}</span>
            </div>
          ))}
        </div>
      )}

      {/* Content */}
      {tab === 'home' ? (
        <div style={S.homePage}>
          <div style={{ fontSize:48, marginBottom:8 }}>🌐</div>
          <div style={{ fontSize:22, fontWeight:300, color:'#fff', marginBottom:4 }}>StackOS Browser</div>
          <div style={{ fontSize:13, color:'rgba(255,255,255,0.45)', marginBottom:28 }}>Search the web or enter a URL above</div>
          <div style={S.quickGrid}>
            {QUICK_LINKS.map((q, i) => (
              <div key={i} style={S.quickItem} onClick={() => navigate(q.url)}>
                <span style={{ fontSize:26 }}>{q.icon}</span>
                <span style={{ fontSize:12, color:'rgba(255,255,255,0.6)', marginTop:4 }}>{q.name}</span>
              </div>
            ))}
          </div>
          {history.length > 0 && (
            <div style={{ marginTop:28, width:'100%', maxWidth:420 }}>
              <div style={{ fontSize:12, color:'rgba(255,255,255,0.35)', marginBottom:8, textTransform:'uppercase', letterSpacing:'0.06em' }}>Recent</div>
              {history.slice(0,5).map((h, i) => (
                <div key={i} style={S.histItem} onClick={() => navigate(h.url)}>
                  <span style={{ fontSize:14 }}>🔗</span>
                  <span style={{ fontSize:12, color:'rgba(255,255,255,0.65)', flex:1, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{h.url}</span>
                  <span style={{ fontSize:11, color:'rgba(255,255,255,0.3)' }}>{h.time}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div style={S.iframeWrap}>
          <div style={S.sandboxNotice}>
            <div style={{ fontSize:28, marginBottom:8 }}>🔒</div>
            <div style={{ fontSize:15, color:'#fff', marginBottom:6 }}>External Navigation</div>
            <div style={{ fontSize:13, color:'rgba(255,255,255,0.5)', marginBottom:16, textAlign:'center', maxWidth:380 }}>
              Browser iframes are restricted by security policies.<br/>Open the link in your system browser.
            </div>
            <div style={{ fontSize:12, color:'var(--accent)', marginBottom:16, wordBreak:'break-all', textAlign:'center' }}>{url}</div>
            <button className="btn" onClick={() => window.open(url,'_blank')}>Open in System Browser ↗</button>
            <button className="btn" style={{ background:'transparent', border:'0.5px solid rgba(255,255,255,0.2)', color:'#fff', marginTop:8 }} onClick={() => setTab('home')}>← Back to Home</button>
          </div>
        </div>
      )}
    </div>
  );
}

const S = {
  root: { display:'flex', flexDirection:'column', height:'100%' },
  toolbar: { display:'flex', alignItems:'center', gap:5, padding:'7px 10px', background:'rgba(0,0,0,0.3)', borderBottom:'0.5px solid rgba(255,255,255,0.07)', flexShrink:0 },
  navBtn: { width:32, height:32, background:'rgba(255,255,255,0.07)', border:'none', borderRadius:8, color:'rgba(255,255,255,0.7)', cursor:'pointer', fontSize:15, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 },
  navActive: { background:'rgba(0,120,212,0.3)', color:'#fff' },
  urlBar: { flex:1, background:'rgba(255,255,255,0.08)', border:'0.5px solid rgba(255,255,255,0.12)', borderRadius:20, padding:'6px 14px', color:'#fff', fontSize:13, outline:'none', minWidth:0 },
  bookmarkPanel: { background:'rgba(24,24,34,0.98)', border:'0.5px solid rgba(255,255,255,0.1)', borderTop:'none', flexShrink:0, maxHeight:220, overflowY:'auto' },
  bkHeader: { display:'flex', alignItems:'center', justifyContent:'space-between', padding:'10px 16px', borderBottom:'0.5px solid rgba(255,255,255,0.07)' },
  bkClose: { background:'transparent', border:'none', color:'rgba(255,255,255,0.4)', cursor:'pointer', fontSize:14 },
  bkItem: { display:'flex', alignItems:'center', gap:8, padding:'8px 16px', cursor:'pointer', transition:'background 0.1s', fontSize:13 },
  homePage: { flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:24, overflowY:'auto', background:'rgba(0,0,0,0.1)' },
  quickGrid: { display:'grid', gridTemplateColumns:'repeat(6,1fr)', gap:10, width:'100%', maxWidth:400 },
  quickItem: { display:'flex', flexDirection:'column', alignItems:'center', padding:'12px 8px', borderRadius:12, cursor:'pointer', background:'rgba(255,255,255,0.05)', transition:'background 0.12s' },
  histItem: { display:'flex', alignItems:'center', gap:8, padding:'7px 10px', borderRadius:8, cursor:'pointer', transition:'background 0.1s', overflow:'hidden' },
  iframeWrap: { flex:1, display:'flex', alignItems:'center', justifyContent:'center', background:'rgba(0,0,0,0.2)' },
  sandboxNotice: { display:'flex', flexDirection:'column', alignItems:'center', padding:32, maxWidth:480, textAlign:'center' },
};
