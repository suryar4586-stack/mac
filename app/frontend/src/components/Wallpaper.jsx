import React, { useEffect, useRef } from 'react';
import { useOS } from '../context/OSContext';

const WALLPAPERS = {
  cosmic: 'linear-gradient(135deg,#0a0a1a 0%,#0d1b3e 35%,#1a0a2e 65%,#0a1a2e 100%)',
  forest: 'linear-gradient(135deg,#0a1a0a,#1a3a1a,#0a2a14)',
  mars:   'linear-gradient(135deg,#1a0a0a,#3a1a0a,#2a0a0a)',
  ocean:  'linear-gradient(135deg,#0a1020,#1a2a4a,#0a2030)',
  neon:   'linear-gradient(135deg,#0a001a,#1a0030,#000a1a)',
  sunset: 'linear-gradient(135deg,#1a0a00,#3a1a00,#1a0a10)',
};

export default function Wallpaper() {
  const { state } = useOS();
  const canvasRef = useRef(null);
  const animRef = useRef(null);
  const starsRef = useRef([]);

  const wallpaper = state.settings.wallpaper || 'cosmic';

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; };
    resize();
    window.addEventListener('resize', resize);

    // Generate stars
    starsRef.current = Array.from({ length: 120 }, () => ({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      r: Math.random() * 1.5 + 0.3,
      a: Math.random(),
      speed: Math.random() * 0.008 + 0.002,
      phase: Math.random() * Math.PI * 2,
    }));

    let t = 0;
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      starsRef.current.forEach(s => {
        const alpha = 0.3 + 0.7 * (0.5 + 0.5 * Math.sin(t * s.speed + s.phase));
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,255,255,${alpha})`;
        ctx.fill();
      });
      t++;
      animRef.current = requestAnimationFrame(draw);
    };
    draw();

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animRef.current);
    };
  }, []);

  return (
    <div style={{ position:'fixed', inset:0, background: WALLPAPERS[wallpaper] || WALLPAPERS.cosmic, zIndex:0 }}>
      {/* Ambient glows */}
      <div style={{ position:'absolute', inset:0, background:'radial-gradient(ellipse at 25% 35%, rgba(0,120,212,0.18) 0%, transparent 55%), radial-gradient(ellipse at 75% 65%, rgba(100,40,200,0.14) 0%, transparent 50%)' }} />
      <canvas ref={canvasRef} style={{ position:'absolute', inset:0, pointerEvents:'none' }} />
    </div>
  );
}
