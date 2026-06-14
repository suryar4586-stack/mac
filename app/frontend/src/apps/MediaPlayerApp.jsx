import React, { useState, useEffect, useRef } from 'react';

const DEMO_TRACKS = [
  { title:'Cosmic Journey', artist:'StarSound', duration:214, icon:'🚀' },
  { title:'Digital Dreams', artist:'ByteBeats', duration:187, icon:'💻' },
  { title:'Neon City',      artist:'SynthWave', duration:263, icon:'🌆' },
  { title:'Quantum Pulse',  artist:'DataFlow',  duration:198, icon:'⚡' },
  { title:'Deep Space',     artist:'AstroTone', duration:312, icon:'🌌' },
];

function fmt(s) { return `${Math.floor(s/60)}:${String(s%60).padStart(2,'0')}; }

export default function MediaPlayerApp() {
  const [tracks] = useState(DEMO_TRACKS);
  const [idx, setIdx] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);  // seconds
  const [volume, setVolume] = useState(70);
  const [shuffle, setShuffle] = useState(false);
  const [repeat, setRepeat] = useState(false);
  const intervalRef = useRef(null);

  const track = tracks[idx];

  useEffect(() => {
    if (playing) {
      intervalRef.current = setInterval(() => {
        setProgress(p => {
          if (p >= track.duration) {
            if (repeat) return 0;
            nextTrack(); return 0;
          }
          return p + 1;
        });
      }, 1000);
    } else {
      clearInterval(intervalRef.current);
    }
    return () => clearInterval(intervalRef.current);
  }, [playing, idx, repeat]);

  const nextTrack = () => {
    setProgress(0);
    if (shuffle) setIdx(Math.floor(Math.random() * tracks.length));
    else setIdx(i => (i + 1) % tracks.length);
  };
  const prevTrack = () => { setProgress(0); setIdx(i => (i - 1 + tracks.length) % tracks.length); };
  const togglePlay = () => setPlaying(p => !p);
  const seek = (e) => {
    const bar = e.currentTarget;
    const pct = (e.clientX - bar.getBoundingClientRect().left) / bar.offsetWidth;
    setProgress(Math.round(pct * track.duration));
  };

  const pct = (progress / track.duration) * 100;

  return (
    <div style={S.root}>
      {/* Track art */}
      <div style={S.artArea}>
        <div style={S.artDisc} className={playing ? 'spinning' : ''}>
          <span style={{ fontSize:52 }}>{track.icon}</span>
        </div>
      </div>

      {/* Track info */}
      <div style={S.info}>
        <div style={S.trackTitle}>{track.title}</div>
        <div style={S.trackArtist}>{track.artist}</div>
      </div>

      {/* Progress */}
      <div style={{ padding:'0 24px' }}>
        <div style={S.progressBar} onClick={seek}>
          <div style={{ ...S.progressFill, width:`${pct}%` }} />
          <div style={{ ...S.progressDot, left:`${pct}%` }} />
        </div>
        <div style={S.timeRow}>
          <span>{fmt(progress)}</span>
          <span>{fmt(track.duration)}</span>
        </div>
      </div>

      {/* Controls */}
      <div style={S.controls}>
        <CtrlBtn icon={shuffle?'🔀':'⇄'} active={shuffle} onClick={() => setShuffle(s=>!s)} title="Shuffle" small />
        <CtrlBtn icon="⏮" onClick={prevTrack} title="Previous" />
        <CtrlBtn icon={playing?'⏸':'▶'} onClick={togglePlay} main title={playing?'Pause':'Play'} />
        <CtrlBtn icon="⏭" onClick={nextTrack} title="Next" />
        <CtrlBtn icon={repeat?'🔂':'↩'} active={repeat} onClick={() => setRepeat(r=>!r)} title="Repeat" small />
      </div>

      {/* Volume */}
      <div style={S.volumeRow}>
        <span style={{ fontSize:14 }}>{volume < 20 ? '🔇' : volume < 50 ? '🔉' : '🔊'}</span>
        <input type="range" min={0} max={100} value={volume} onChange={e => setVolume(+e.target.value)}
          style={{ flex:1, accentColor:'var(--accent)' }} />
        <span style={{ fontSize:12, color:'rgba(255,255,255,0.4)', width:28, textAlign:'right' }}>{volume}</span>
      </div>

      {/* Playlist */}
      <div style={S.playlist}>
        <div style={{ fontSize:11, color:'rgba(255,255,255,0.35)', textTransform:'uppercase', letterSpacing:'0.06em', padding:'0 16px 8px', fontWeight:600 }}>Playlist</div>
        {tracks.map((t, i) => (
          <div key={i} style={{ ...S.plItem, ...(i===idx ? S.plActive : {}) }} onClick={() => { setIdx(i); setProgress(0); }}>
            <span style={{ fontSize:18 }}>{t.icon}</span>
            <div style={{ flex:1 }}>
              <div style={{ fontSize:13, color: i===idx?'#fff':'rgba(255,255,255,0.7)' }}>{t.title}</div>
              <div style={{ fontSize:11, color:'rgba(255,255,255,0.4)' }}>{t.artist}</div>
            </div>
            <span style={{ fontSize:12, color:'rgba(255,255,255,0.35)' }}>{fmt(t.duration)}</span>
            {i===idx && playing && <span style={{ fontSize:14, color:'var(--accent)' }}>♪</span>}
          </div>
        ))}
      </div>

      <style>{`.spinning { animation: spin360 4s linear infinite; } @keyframes spin360 { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

function CtrlBtn({ icon, onClick, main, small, active, title }) {
  return (
    <button title={title} onClick={onClick} style={{
      background: main ? 'var(--accent)' : 'transparent',
      border: 'none', borderRadius: main ? '50%' : 8,
      color: active ? 'var(--accent)' : main ? '#fff' : 'rgba(255,255,255,0.7)',
      width: main ? 52 : small ? 36 : 44, height: main ? 52 : small ? 36 : 44,
      fontSize: main ? 24 : small ? 16 : 20,
      cursor: 'pointer', display:'flex', alignItems:'center', justifyContent:'center',
      transition:'background 0.15s, transform 0.1s',
    }}>
      {icon}
    </button>
  );
}

const S = {
  root: { display:'flex', flexDirection:'column', height:'100%', background:'linear-gradient(180deg,rgba(0,0,0,0.3) 0%,rgba(0,0,0,0.5) 100%)', overflowY:'auto' },
  artArea: { display:'flex', alignItems:'center', justifyContent:'center', padding:'28px 0 20px' },
  artDisc: { width:130, height:130, borderRadius:'50%', background:'linear-gradient(135deg,#1a1a2e,#0078d4)', display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'0 8px 40px rgba(0,120,212,0.4)', transition:'transform 0.3s' },
  info: { textAlign:'center', padding:'0 16px 20px' },
  trackTitle: { fontSize:20, fontWeight:500, color:'#fff', marginBottom:4 },
  trackArtist: { fontSize:14, color:'rgba(255,255,255,0.5)' },
  progressBar: { height:5, background:'rgba(255,255,255,0.15)', borderRadius:3, cursor:'pointer', position:'relative', marginBottom:6 },
  progressFill: { height:'100%', background:'var(--accent)', borderRadius:3, transition:'width 0.5s linear' },
  progressDot: { position:'absolute', top:'50%', transform:'translate(-50%,-50%)', width:12, height:12, background:'#fff', borderRadius:'50%', transition:'left 0.5s linear' },
  timeRow: { display:'flex', justifyContent:'space-between', fontSize:11, color:'rgba(255,255,255,0.4)' },
  controls: { display:'flex', alignItems:'center', justifyContent:'center', gap:8, padding:'16px 24px' },
  volumeRow: { display:'flex', alignItems:'center', gap:10, padding:'0 24px 20px' },
  playlist: { flex:1, borderTop:'0.5px solid rgba(255,255,255,0.08)', paddingTop:12, overflowY:'auto' },
  plItem: { display:'flex', alignItems:'center', gap:10, padding:'9px 16px', cursor:'pointer', transition:'background 0.1s', borderRadius:0 },
  plActive: { background:'rgba(0,120,212,0.2)' },
};
