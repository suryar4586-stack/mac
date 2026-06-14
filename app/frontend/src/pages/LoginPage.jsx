import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useOS } from '../context/OSContext';
import api from '../utils/api';

export default function LoginPage() {
  const { login } = useOS();
  const nav = useNavigate();
  const [mode, setMode] = useState('login'); // login | register
  const [form, setForm] = useState({ username: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      const endpoint = mode === 'login' ? '/auth/login' : '/auth/register';
      const { data } = await api.post(endpoint, form);
      login(data.token, data.user, data.user?.settings);
      nav('/');
    } catch (err) {
      setError(err.response?.data?.error || 'Something went wrong');
    } finally { setLoading(false); }
  };

  return (
    <div style={styles.root}>
      {/* Background */}
      <div style={styles.bg} />
      <div style={styles.card}>
        <div style={styles.logo}>⊞</div>
        <div style={styles.osname}>STACK OS</div>
        <div style={styles.subtitle}>
          {mode === 'login' ? 'Sign in to your desktop' : 'Create your account'}
        </div>

        <form onSubmit={submit} style={styles.form}>
          {mode === 'register' && (
            <input style={styles.inp} type="email" placeholder="Email" value={form.email} onChange={set('email')} required />
          )}
          <input style={styles.inp} type="text" placeholder="Username" value={form.username} onChange={set('username')} required />
          <input style={styles.inp} type="password" placeholder="Password" value={form.password} onChange={set('password')} required />
          {error && <div style={styles.error}>{error}</div>}
          <button style={styles.btn} type="submit" disabled={loading}>
            {loading ? '...' : mode === 'login' ? 'Sign In' : 'Create Account'}
          </button>
        </form>

        <div style={styles.switch}>
          {mode === 'login' ? (
            <span>No account? <button style={styles.link} onClick={() => setMode('register')}>Register</button></span>
          ) : (
            <span>Have an account? <button style={styles.link} onClick={() => setMode('login')}>Sign in</button></span>
          )}
        </div>

        {/* Quick demo login */}
        <div style={{ marginTop: 8, fontSize: 11, color: 'rgba(255,255,255,0.3)', textAlign: 'center' }}>
          Demo: register any username/password to start
        </div>
      </div>
    </div>
  );
}

const styles = {
  root: { width:'100vw', height:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'#08080f', fontFamily:'var(--font)' },
  bg: { position:'fixed', inset:0, background:'radial-gradient(ellipse at 30% 40%, rgba(0,120,212,0.18) 0%, transparent 60%), radial-gradient(ellipse at 70% 60%, rgba(100,40,180,0.14) 0%, transparent 50%)', pointerEvents:'none' },
  card: { position:'relative', background:'rgba(24,24,34,0.92)', backdropFilter:'blur(32px)', border:'0.5px solid rgba(255,255,255,0.1)', borderRadius:16, padding:'40px 36px', width:360, display:'flex', flexDirection:'column', alignItems:'center', gap:12 },
  logo: { fontSize:52, color:'#0078d4', lineHeight:1 },
  osname: { fontSize:22, fontWeight:300, color:'#fff', letterSpacing:8 },
  subtitle: { fontSize:13, color:'rgba(255,255,255,0.5)', marginBottom:8 },
  form: { width:'100%', display:'flex', flexDirection:'column', gap:10 },
  inp: { width:'100%', padding:'10px 14px', fontSize:14, background:'rgba(255,255,255,0.07)', border:'0.5px solid rgba(255,255,255,0.14)', borderRadius:8, color:'#fff', outline:'none' },
  error: { background:'rgba(200,50,50,0.2)', border:'0.5px solid rgba(255,80,80,0.3)', borderRadius:8, padding:'8px 12px', fontSize:12, color:'#ff8080' },
  btn: { width:'100%', padding:'11px', background:'#0078d4', border:'none', borderRadius:8, color:'#fff', fontSize:14, fontWeight:500, cursor:'pointer', transition:'background 0.15s' },
  switch: { fontSize:12, color:'rgba(255,255,255,0.4)' },
  link: { background:'none', border:'none', color:'#0078d4', cursor:'pointer', fontSize:12, textDecoration:'underline' },
};
