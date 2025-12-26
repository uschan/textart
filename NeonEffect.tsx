import React, { useEffect, useRef, useState } from 'react';
import { RotateCcw } from 'lucide-react';
import { NeonDrop, FireworkParticle } from './types';
import { NEON_CHARS } from './constants';

interface Shockwave {
    x: number;
    y: number;
    radius: number;
    maxRadius: number;
    force: number;
}

const NeonEffect: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [key, setKey] = useState(0); 
  const requestRef = useRef<number>(0);
  
  const dropsRef = useRef<NeonDrop[]>([]);
  const sparksRef = useRef<FireworkParticle[]>([]);
  const shockwavesRef = useRef<Shockwave[]>([]);
  const mouseRef = useRef({ x: -1000, y: -1000 });

  const handleRestart = () => {
    setKey(prev => prev + 1);
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const init = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;

      // Config
      const COL_WIDTH = 24;
      const COLUMNS = Math.floor(canvas.width / COL_WIDTH);
      
      const drops: NeonDrop[] = [];
      
      for(let i=0; i<COLUMNS; i++) {
        // Random start time
        const length = 12 + Math.random() * 25;
        const chars = [];
        for(let k=0; k<length; k++) {
            chars.push(NEON_CHARS[Math.floor(Math.random() * NEON_CHARS.length)]);
        }
        
        drops.push({
            x: i * COL_WIDTH,
            y: Math.random() * -1200, // Start higher up
            speed: 4 + Math.random() * 6,
            chars: chars,
            colorH: Math.random() < 0.5 ? 300 : (Math.random() < 0.5 ? 190 : 270), // Purple/Cyan mix
            brightness: 0.3 + Math.random() * 0.4,
            fontSize: 14 + Math.random() * 10,
            length: length
        });
      }
      
      dropsRef.current = drops;
      sparksRef.current = [];
      shockwavesRef.current = [];
    };

    const spawnExplosion = (x: number, y: number) => {
      // 1. Create Sparks
      const count = 60 + Math.random() * 40;
      const hueBase = Math.random() * 360;
      
      for(let i=0; i<count; i++) {
        const angle = (Math.PI * 2 * i) / count;
        const speed = 3 + Math.random() * 12; // Explosive speed
        const life = 50 + Math.random() * 50;
        
        sparksRef.current.push({
          x,
          y,
          vx: Math.cos(angle) * speed * (0.8 + Math.random()*0.4),
          vy: Math.sin(angle) * speed * (0.8 + Math.random()*0.4),
          char: NEON_CHARS[Math.floor(Math.random() * NEON_CHARS.length)],
          color: `hsl(${hueBase + Math.random()*40}, 100%, 75%)`,
          life: life,
          maxLife: life,
          size: 16 + Math.random() * 16
        });
      }

      // 2. Create Shockwave (The "Push" Effect)
      shockwavesRef.current.push({
          x,
          y,
          radius: 10,
          maxRadius: 400,
          force: 20
      });
    };

    const animate = () => {
      // Dark Trail Effect (The Matrix fade)
      ctx.globalCompositeOperation = 'source-over';
      ctx.fillStyle = 'rgba(5, 5, 8, 0.2)'; // Slightly clearer to see visuals
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const drops = dropsRef.current;
      const sparks = sparksRef.current;
      const shockwaves = shockwavesRef.current;
      const mx = mouseRef.current.x;
      const my = mouseRef.current.y;

      // Enable Additive Blending for Glow
      ctx.globalCompositeOperation = 'lighter';

      // --- 1. Process Shockwaves ---
      for (let i = shockwaves.length - 1; i >= 0; i--) {
          const sw = shockwaves[i];
          sw.radius += 15; // Expansion speed
          sw.force *= 0.9; // Decay force
          
          if (sw.radius > sw.maxRadius) {
              shockwaves.splice(i, 1);
          } else {
              // Draw visual shockwave ring (optional, subtle)
              ctx.beginPath();
              ctx.arc(sw.x, sw.y, sw.radius, 0, Math.PI*2);
              ctx.lineWidth = Math.max(0, 50 * (1 - sw.radius/sw.maxRadius));
              ctx.strokeStyle = `rgba(255, 255, 255, ${0.1 * (1 - sw.radius/sw.maxRadius)})`;
              ctx.stroke();
          }
      }

      // --- 2. Rain Logic (Affected by Shockwaves) ---
      drops.forEach(drop => {
         // Apply Gravity
         drop.y += drop.speed;

         // Interaction: Shockwave physics
         shockwaves.forEach(sw => {
             const dx = drop.x - sw.x;
             const dy = drop.y - sw.y;
             const dist = Math.sqrt(dx*dx + dy*dy);
             
             // Check if drop is near the shockwave "front"
             const distFromWave = Math.abs(dist - sw.radius);
             
             if (distFromWave < 50 && dist < sw.radius + 50) {
                 const angle = Math.atan2(dy, dx);
                 const blast = (sw.force * (1 - distFromWave/50)) * 1.5;
                 
                 drop.x += Math.cos(angle) * blast;
                 drop.y += Math.sin(angle) * blast;
                 
                 // Brighten up when hit
                 drop.brightness = 2.0;
             }
         });

         // Standard Reset
         if (drop.y - (drop.length * drop.fontSize) > canvas.height) {
             drop.y = -200 - Math.random() * 500;
             drop.speed = 4 + Math.random() * 6;
             drop.x = Math.floor(Math.random() * (canvas.width / 24)) * 24;
             // Cyberpunk Palette
             const r = Math.random();
             if (r < 0.33) drop.colorH = 300 + Math.random() * 40; // Pink/Magenta
             else if (r < 0.66) drop.colorH = 170 + Math.random() * 40; // Cyan/Teal
             else drop.colorH = 120 + Math.random() * 40; // Toxic Green
             
             drop.brightness = 0.5;
         }

         // Mouse repulsion (Subtle)
         const dx = drop.x - mx;
         const dy = drop.y - my;
         const dist = Math.sqrt(dx*dx + dy*dy);
         
         if (dist < 100) {
             drop.x += (dx / dist) * 5;
             drop.brightness = 1.5;
         }

         // Draw Drop
         ctx.font = `bold ${drop.fontSize}px "Courier New", monospace`;
         
         // Decay brightness back to normal
         if (drop.brightness > 0.5) drop.brightness *= 0.95;

         for(let i=0; i<drop.length; i++) {
             const charY = drop.y - i * drop.fontSize;
             if (charY > canvas.height + 50 || charY < -50) continue;

             const fade = 1 - (i / drop.length);
             const alpha = fade * drop.brightness;
             
             if (alpha < 0.05) continue;

             if (Math.random() < 0.02) {
                 drop.chars[i] = NEON_CHARS[Math.floor(Math.random() * NEON_CHARS.length)];
             }

             const char = drop.chars[i];
             
             if (i === 0) { // Head
                 ctx.fillStyle = '#fff';
                 ctx.shadowColor = `hsl(${drop.colorH}, 100%, 60%)`;
                 ctx.shadowBlur = 10;
                 ctx.fillText(char, drop.x, charY);
             } else {
                 ctx.fillStyle = `hsla(${drop.colorH}, 90%, 60%, ${alpha})`;
                 ctx.shadowBlur = 0;
                 ctx.fillText(char, drop.x, charY);
             }
         }
      });

      // --- 3. Fireworks Logic ---
      for (let i = sparks.length - 1; i >= 0; i--) {
        const p = sparks[i];
        
        p.life--;
        if (p.life <= 0) {
          sparks.splice(i, 1);
          continue;
        }
        
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.1; // Gravity
        p.vx *= 0.95; // Drag
        p.vy *= 0.95;
        
        const alpha = p.life / p.maxLife;
        
        ctx.font = `bold ${p.size}px "Courier New", monospace`;
        ctx.fillStyle = p.color;
        ctx.globalAlpha = alpha;
        
        // Intense glow for sparks
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 15;
        
        ctx.fillText(p.char, p.x, p.y);
        ctx.globalAlpha = 1.0;
      }
      
      ctx.shadowBlur = 0;
      requestRef.current = requestAnimationFrame(animate);
    };

    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current = { x: e.clientX, y: e.clientY };
    };

    const handleMouseDown = (e: MouseEvent) => {
      spawnExplosion(e.clientX, e.clientY);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mousedown', handleMouseDown);
    init();
    requestRef.current = requestAnimationFrame(animate);

    const handleResize = () => {
      cancelAnimationFrame(requestRef.current);
      init();
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(requestRef.current);
    };
  }, [key]);

  return (
    <div className="relative w-full h-full cursor-crosshair bg-[#05050a]">
      <canvas ref={canvasRef} className="block w-full h-full" />
      <button 
        onClick={handleRestart}
        className="absolute top-20 left-4 p-2 bg-black/50 border border-white/20 rounded-full hover:bg-white/20 transition-colors shadow-sm text-white z-10"
      >
        <RotateCcw size={20} />
      </button>
      
       <div className="absolute bottom-10 left-0 w-full text-center pointer-events-none">
        <h2 className="text-white/50 font-serif text-sm tracking-[0.5em] uppercase shadow-lg" style={{textShadow: '0 0 10px rgba(0,255,255,0.5)'}}>
            NEON / SHOCKWAVE
        </h2>
        <p className="text-white/30 text-[10px] tracking-widest mt-2">CLICK TO DETONATE</p>
      </div>
    </div>
  );
};

export default NeonEffect;