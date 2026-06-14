import React from 'react';
export default function BootScreen() {
  return (
    <div style={{ position:'fixed', inset:0, background:'#000', zIndex:99999, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:20 }}>
      <div style={{ fontSize:56, color:'#0078d4' }}>⊞</div>
      <div style={{ fontSize:26, fontWeight:200, color:'#fff', letterSpacing:10 }}>STACK OS</div>
      <div style={{ width:36, height:36, border:'3px solid rgba(255,255,255,0.1)', borderTopColor:'#0078d4', borderRadius:'50%', animation:'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}
