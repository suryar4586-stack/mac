import React, { useState, useEffect } from 'react';
import { useOS } from '../context/OSContext';
import api from '../utils/api';

const NAV = [
  { id:'personalization', icon:'🎨', label:'Personalization' },
  { id:'system',          icon:'💻', label:'System' },
  { id:'network',         icon:'🌐', label:'Network' },
  { id:'accounts',        icon:'👤', label:'Accounts' },
  { id:'apps',            icon:'📦', label:'Apps' },
  { id:'about',           icon:'ℹ️', label:'About' },
];

const ACCENTS = ['#0078d4','#8764b8','#ef6950','#16c60c','#f7630c','#e3008c','#0099bc','#ff8c00'];
const WALLPAPERS = [
  { id:'cosmic', label:'Cosmic', bg:'linear-gradient(135deg,#0a0a1a,#0d1b3e,#1a0a2e)' },
  { id:'forest', label:'Forest', bg:'linear-gradient(135deg,#0a1a0a,#1a3a1a,#0a2a14)' },
  { id:'mars',   label:'Mars',   bg:'linear-gradient(135deg,#1a0a0a,#3a1a0a,#2a0a0a)' },
  { id:'ocean',  label:'Ocean',  bg:'linear-gradient(135deg,#0a1020,#1a2a4a,#0a2030)' },
  { id:'neon',   label:'Neon',   bg:'linear-gradient(135deg,#0a001a,#1a0030,#000a1a)' },
  { id:'sunset', label:'Sunset', bg:'linear-gradient(135deg,#1a0a00,#3a1a00,#1a0a10)' },
];

export default function SettingsApp() {
  const { state, updateSettings, logout } = useOS();
  const [active, setActive] = useState('personalization');
  const [metrics, setMetrics] = useState(null);
  const [profile, setProfile] = useState({ username:'', email:'' });
  const [pwForm, setPwForm] = useState({ newPassword:'' });

  useEffect(() => {
    if (active === 'system') loadMetrics();
    if (active === 'accounts') setProfile({ username: state.user?.username||'', email: state.user?.email||'' });
  }, [active]);

  const loadMetrics = async () => {
    try { const { data } = await api.get('/system/metrics'); setMetrics(data); } catch {}
    // Poll
    setTimeout(() => { if (active === 'system') loadMetrics(); }, 3000);
  };

  const saveSettings = async (patch) => {
    await updateSettings({ ...state.settings, ...patch });
  };

  const saveProfile = async () => {
    try { await api.put('/auth/profile', profile); } catch {}
  };

  return (
    <div style={S.root}>
      {/* Sidebar */}
      <div style={S.nav}>
        <div style={S.navTitle}>Settings</div>
        {NAV.map(n => (
          <div key={n.id} style={{ ...S.navItem, ...(active===n.id ? S.navActive : {}) }} onClick={() => setActive(n.id)}>
            <span style={{ fontSize:18 }}>{n.icon}</span>
            <span>{n.label}</span>
          </div>
        ))}
      </div>

      {/* Content */}
      <div style={S.content}>
        {active === 'personalization' && (
          <>
            <div style={S.pageTitle}>Personalization</div>
            <Section title="Wallpaper">
              <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10 }}>
                {WALLPAPERS.map(w => (
                  <div key={w.id} style={{ ...S.wpThumb, background:w.bg, ...(state.settings.wallpaper===w.id?S.wpSelected:{}) }}
                    onClick={() => saveSettings({ wallpaper: w.id })}>
                    <span style={{ fontSize:11, color:'rgba(255,255,255,0.7)' }}>{w.label}</span>
                  </div>
                ))}
              </div>
            </Section>
            <Section title="Accent Color">
              <div style={{ display:'flex', gap:10, flexWrap:'wrap' }}>
                {ACCENTS.map(c => (
                  <div key={c} style={{ width:32, height:32, borderRadius:'50%', background:c, cursor:'pointer', border: state.settings.accent_color===c ? '3px solid #fff' : '3px solid transparent', transition:'transform 0.15s', boxSizing:'border-box' }}
                    onClick={() => saveSettings({ accent_color: c })} />
                ))}
              </div>
            </Section>
            <Section title="Interface">
              <SettingRow label="Blur Effects" desc="Acrylic background blur">
                <Toggle on={!!state.settings.blur_effects} onChange={v => saveSettings({ blur_effects: v?1:0 })} />
              </SettingRow>
              <SettingRow label="Animations" desc="Window open/close animations">
                <Toggle on={!!state.settings.animations} onChange={v => saveSettings({ animations: v?1:0 })} />
              </SettingRow>
            </Section>
          </>
        )}

        {active === 'system' && (
          <>
            <div style={S.pageTitle}>System</div>
            {metrics ? (
              <>
                <Section title="Performance">
                  <MetricBar label="CPU" value={metrics.cpu.usage} />
                  <MetricBar label="Memory" value={metrics.memory.usagePercent} subtitle={`${metrics.memory.usedGB} GB / ${metrics.memory.totalGB} GB`} />
                  <MetricBar label="Disk" value={metrics.disk.usagePercent} subtitle={`${metrics.disk.usedGB} GB / ${metrics.disk.totalGB} GB`} />
                </Section>
                <Section title="System Info">
                  <InfoRow label="Platform" value={metrics.system.platform} />
                  <InfoRow label="Architecture" value={metrics.system.arch} />
                  <InfoRow label="Node.js" value={metrics.system.nodeVersion} />
                  <InfoRow label="Uptime" value={`${Math.floor(metrics.system.uptime/3600)}h ${Math.floor((metrics.system.uptime%3600)/60)}m`} />
                  <InfoRow label="CPU Cores" value={metrics.cpu.cores} />
                </Section>
              </>
            ) : <div style={{ color:'rgba(255,255,255,0.4)' }}>Loading metrics...</div>}
          </>
        )}

        {active === 'network' && (
          <>
            <div style={S.pageTitle}>Network</div>
            <Section title="Connection">
              <SettingRow label="Status" desc={navigator.onLine ? 'Connected' : 'Disconnected'}>
                <span style={{ color: navigator.onLine ? '#16c60c' : '#e74c3c', fontSize:18 }}>{navigator.onLine ? '🟢' : '🔴'}</span>
              </SettingRow>
              <SettingRow label="Type" desc="Wi-Fi"><span>📶</span></SettingRow>
            </Section>
          </>
        )}

        {active === 'accounts' && (
          <>
            <div style={S.pageTitle}>Accounts</div>
            <Section title="Your Account">
              <div style={{ display:'flex', alignItems:'center', gap:16, padding:'16px', background:'rgba(0,0,0,0.2)', borderRadius:12, marginBottom:16 }}>
                <div style={{ width:60, height:60, borderRadius:'50%', background:'var(--accent)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:24, fontWeight:600 }}>
                  {state.user?.username?.[0]?.toUpperCase() || 'U'}
                </div>
                <div>
                  <div style={{ fontSize:18, color:'#fff' }}>{state.user?.username}</div>
                  <div style={{ fontSize:13, color:'rgba(255,255,255,0.5)' }}>{state.user?.email}</div>
                  <div style={{ fontSize:11, color:'rgba(255,255,255,0.3)', marginTop:2 }}>Administrator</div>
                </div>
              </div>
              <SettingRow label="Username" desc="">
                <input style={{ ...S.inp, width:180 }} value={profile.username} onChange={e => setProfile(p => ({...p, username: e.target.value}))} />
              </SettingRow>
              <SettingRow label="New Password" desc="">
                <input style={{ ...S.inp, width:180 }} type="password" placeholder="••••••••" value={pwForm.newPassword} onChange={e => setPwForm({ newPassword: e.target.value })} />
              </SettingRow>
              <div style={{ display:'flex', gap:8, marginTop:12 }}>
                <button className="btn" onClick={saveProfile}>Save Changes</button>
                <button className="btn" style={{ background:'rgba(200,50,50,0.3)', border:'none' }} onClick={logout}>Sign Out</button>
              </div>
            </Section>
          </>
        )}

        {active === 'apps' && (
          <>
            <div style={S.pageTitle}>Apps</div>
            <Section title="Installed Apps">
              {['Calculator','Notepad','Browser','Media Player','Paint','File Manager','Terminal','Settings','App Store','Recycle Bin'].map(a => (
                <SettingRow key={a} label={a} desc="System app"><span style={{ fontSize:12, color:'rgba(0,212,80,0.8)' }}>✓ Installed</span></SettingRow>
              ))}
            </Section>
          </>
        )}

        {active === 'about' && (
          <>
            <div style={S.pageTitle}>About StackOS</div>
            <div style={{ textAlign:'center', padding:'24px 0' }}>
              <div style={{ fontSize:64, marginBottom:12 }}>⊞</div>
              <div style={{ fontSize:28, fontWeight:200, color:'#fff', letterSpacing:6, marginBottom:6 }}>STACK OS</div>
              <div style={{ fontSize:13, color:'rgba(255,255,255,0.45)' }}>Version 1.0.0 (Build 2026.1)</div>
            </div>
            <Section title="System">
              <InfoRow label="OS" value="StackOS 1.0.0" />
              <InfoRow label="Frontend" value="React 18" />
              <InfoRow label="Backend" value="Node.js + Express" />
              <InfoRow label="Database" value="SQLite (WAL)" />
              <InfoRow label="Real-time" value="Socket.io" />
              <InfoRow label="Auth" value="JWT" />
            </Section>
          </>
        )}
      </div>
    </div>
  );
}

/* ── Shared subcomponents ─────────────────────────────── */
function Section({ title, children }) {
  return (
    <div style={{ marginBottom:24 }}>
      <div style={{ fontSize:11, color:'rgba(255,255,255,0.35)', textTransform:'uppercase', letterSpacing:'0.07em', fontWeight:600, marginBottom:10 }}>{title}</div>
      {children}
    </div>
  );
}

function SettingRow({ label, desc, children }) {
  return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', background:'rgba(255,255,255,0.04)', border:'0.5px solid rgba(255,255,255,0.07)', borderRadius:10, padding:'12px 14px', marginBottom:6 }}>
      <div>
        <div style={{ fontSize:14, color:'#fff' }}>{label}</div>
        {desc && <div style={{ fontSize:12, color:'rgba(255,255,255,0.4)', marginTop:2 }}>{desc}</div>}
      </div>
      {children}
    </div>
  );
}

function InfoRow({ label, value }) {
  return (
    <div style={{ display:'flex', justifyContent:'space-between', padding:'10px 14px', background:'rgba(255,255,255,0.03)', borderRadius:8, marginBottom:4 }}>
      <span style={{ fontSize:13, color:'rgba(255,255,255,0.55)' }}>{label}</span>
      <span style={{ fontSize:13, color:'#fff' }}>{value}</span>
    </div>
  );
}

function MetricBar({ label, value, subtitle }) {
  const color = value > 80 ? '#ef4444' : value > 60 ? '#f59e0b' : 'var(--accent)';
  return (
    <div style={{ marginBottom:16 }}>
      <div style={{ display:'flex', justifyContent:'space-between', marginBottom:6 }}>
        <span style={{ fontSize:13, color:'rgba(255,255,255,0.7)' }}>{label}</span>
        <span style={{ fontSize:13, color:'rgba(255,255,255,0.5)' }}>{subtitle || `${Math.round(value)}%`}</span>
      </div>
      <div style={{ height:8, background:'rgba(255,255,255,0.1)', borderRadius:4, overflow:'hidden' }}>
        <div style={{ height:'100%', width:`${value}%`, background:color, borderRadius:4, transition:'width 0.8s ease' }} />
      </div>
    </div>
  );
}

function Toggle({ on, onChange }) {
  return (
    <button
      className={`toggle${on?' on':''}`}
      onClick={() => onChange(!on)}
    />
  );
}

const S = {
  root: { display:'flex', height:'100%', overflow:'hidden' },
  nav: { width:200, background:'rgba(0,0,0,0.2)', padding:'16px 10px', borderRight:'0.5px solid rgba(255,255,255,0.07)', flexShrink:0, overflowY:'auto' },
  navTitle: { fontSize:18, fontWeight:300, color:'#fff', padding:'4px 10px 16px', letterSpacing:1 },
  navItem: { display:'flex', alignItems:'center', gap:10, padding:'10px 12px', borderRadius:10, cursor:'pointer', fontSize:13, color:'rgba(255,255,255,0.55)', transition:'background 0.12s', marginBottom:2 },
  navActive: { background:'rgba(0,120,212,0.25)', color:'#fff' },
  content: { flex:1, padding:28, overflowY:'auto' },
  pageTitle: { fontSize:26, fontWeight:300, color:'#fff', marginBottom:24, letterSpacing:0.5 },
  wpThumb: { height:64, borderRadius:10, cursor:'pointer', border:'2.5px solid transparent', transition:'border-color 0.15s', display:'flex', alignItems:'flex-end', justifyContent:'center', padding:6 },
  wpSelected: { borderColor:'var(--accent)' },
  inp: { background:'rgba(255,255,255,0.08)', border:'0.5px solid rgba(255,255,255,0.14)', borderRadius:8, color:'#fff', padding:'7px 12px', fontSize:13, outline:'none' },
};
