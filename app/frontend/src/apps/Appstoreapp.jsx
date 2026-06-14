import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { useOS } from '../context/OSContext';

export default function AppStoreApp() {
  const { addNotif, openWindow } = useOS();
  const [storeApps, setStoreApps] = useState([]);
  const [installed, setInstalled] = useState([]);
  const [installing, setInstalling] = useState({});
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');

  useEffect(() => { load(); }, []);

  const load = async () => {
    try {
      const [{ data: s }, { data: i }] = await Promise.all([
        api.get('/apps/store'),
        api.get('/apps/installed'),
      ]);
      setStoreApps(s.apps);
      setInstalled(i.installed);
    } catch {}
  };

  const install = async (appId) => {
    if (installed.includes(appId)) { openWindow(appId); return; }
    setInstalling(p => ({ ...p, [appId]: true }));
    try {
      await api.post('/apps/install', { appId });
      setInstalled(i => [...i, appId]);
      addNotif('App Store', `App installed successfully`, '✅');
    } catch (e) {
      addNotif('App Store', e.response?.data?.error || 'Install failed', '❌');
    }
    setInstalling(p => ({ ...p, [appId]: false }));
  };

  const uninstall = async (appId) => {
    try {
      await api.delete(`/apps/${appId}`);
      setInstalled(i => i.filter(x => x !== appId));
      addNotif('App Store', 'App uninstalled', '🗑️');
    } catch (e) {
      addNotif('App Store', e.response?.data?.error || 'Cannot remove system app', '❌');
    }
  };

  const filtered = storeApps.filter(a =>
    (category === 'all' || (category === 'installed' ? installed.includes(a.id) : !installed.includes(a.id))) &&
    (a.name.toLowerCase().includes(search.toLowerCase()) || a.desc.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div style={S.root}>
      {/* Header */}
      <div style={S.header}>
        <div>
          <div style={{ fontSize:22, fontWeight:300, color:'#fff' }}>🛒 App Store</div>
          <div style={{ fontSize:13, color:'rgba(255,255,255,0.45)', marginTop:2 }}>Discover and manage your apps</div>
        </div>
        <input style={S.search} placeholder="🔍 Search apps..." value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {/* Categories */}
      <div style={S.cats}>
        {['all','installed','available'].map(c => (
          <button key={c} style={{ ...S.catBtn, ...(category===c?S.catActive:{}) }} onClick={() => setCategory(c)}>
            {c.charAt(0).toUpperCase()+c.slice(1)}
          </button>
        ))}
      </div>

      {/* Apps grid */}
      <div style={S.grid}>
        {filtered.map(app => {
          const isInstalled = installed.includes(app.id);
          const isInstalling = installing[app.id];
          return (
            <div key={app.id} style={S.card}>
              <div style={S.cardIcon}>{app.icon}</div>
              <div style={S.cardInfo}>
                <div style={S.cardName}>{app.name}</div>
                <div style={S.cardDesc}>{app.desc}</div>
                <div style={{ display:'flex', alignItems:'center', gap:8, marginTop:6 }}>
                  <span style={{ fontSize:11, color: app.free?'rgba(0,200,80,0.8)':'rgba(255,180,0,0.8)', fontWeight:500 }}>
                    {app.free ? 'Free' : 'Paid'}
                  </span>
                  {isInstalled && <span style={{ fontSize:11, color:'rgba(0,200,80,0.8)' }}>✓ Installed</span>}
                </div>
              </div>
              <div style={{ display:'flex', flexDirection:'column', gap:6, flexShrink:0 }}>
                <button
                  style={{ ...S.installBtn, ...(isInstalled?S.openBtn:{}) }}
                  onClick={() => install(app.id)}
                  disabled={isInstalling}
                >
                  {isInstalling ? '...' : isInstalled ? 'Open' : 'Install'}
                </button>
                {isInstalled && (
                  <button style={S.uninstallBtn} onClick={() => uninstall(app.id)}>Remove</button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', color:'rgba(255,255,255,0.3)', gap:12 }}>
          <span style={{ fontSize:48 }}>🔍</span>
          <span>No apps found</span>
        </div>
      )}
    </div>
  );
}

const S = {
  root: { display:'flex', flexDirection:'column', height:'100%' },
  header: { display:'flex', alignItems:'flex-end', justifyContent:'space-between', padding:'20px 24px 14px', borderBottom:'0.5px solid rgba(255,255,255,0.07)', flexShrink:0 },
  search: { width:220, padding:'8px 14px', background:'rgba(255,255,255,0.08)', border:'0.5px solid rgba(255,255,255,0.12)', borderRadius:20, color:'#fff', fontSize:13, outline:'none' },
  cats: { display:'flex', gap:8, padding:'12px 24px', borderBottom:'0.5px solid rgba(255,255,255,0.07)', flexShrink:0 },
  catBtn: { background:'transparent', border:'0.5px solid rgba(255,255,255,0.15)', borderRadius:20, color:'rgba(255,255,255,0.55)', padding:'5px 14px', cursor:'pointer', fontSize:12, transition:'all 0.12s' },
  catActive: { background:'rgba(0,120,212,0.3)', borderColor:'var(--accent)', color:'#fff' },
  grid: { overflowY:'auto', padding:'16px 20px', display:'flex', flexDirection:'column', gap:10 },
  card: { display:'flex', alignItems:'center', gap:14, background:'rgba(255,255,255,0.04)', border:'0.5px solid rgba(255,255,255,0.07)', borderRadius:12, padding:'14px 16px', transition:'background 0.12s' },
  cardIcon: { fontSize:36, flexShrink:0 },
  cardInfo: { flex:1, minWidth:0 },
  cardName: { fontSize:15, color:'#fff', fontWeight:500 },
  cardDesc: { fontSize:12, color:'rgba(255,255,255,0.5)', marginTop:2 },
  installBtn: { background:'var(--accent)', border:'none', borderRadius:8, color:'#fff', padding:'6px 14px', cursor:'pointer', fontSize:12, fontWeight:500, whiteSpace:'nowrap' },
  openBtn: { background:'rgba(255,255,255,0.1)', color:'rgba(255,255,255,0.8)' },
  uninstallBtn: { background:'transparent', border:'0.5px solid rgba(255,80,80,0.3)', borderRadius:8, color:'rgba(255,100,100,0.7)', padding:'4px 10px', cursor:'pointer', fontSize:11 },
};
