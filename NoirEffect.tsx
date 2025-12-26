import React, { useEffect, useRef, useState } from 'react';
import { RotateCcw } from 'lucide-react';
import { NoirParticle } from './types';
import { NOIR_TEXT } from './constants';

const NoirEffect: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [key, setKey] = useState(0); 
  const requestRef = useRef<number>(0);
  
  const particlesRef = useRef<NoirParticle[]>([]);
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

      const particles: NoirParticle[] = [];
      const FONT_SIZE = 24; // Larger, more dramatic
      const LINE_HEIGHT = 40;
      
      // Vintage Font Fallback
      ctx.font = `italic ${FONT_SIZE}px "Georgia", "Times New Roman", serif`;
      
      const margin = Math.max(60, canvas.width * 0.2);
      const maxWidth = canvas.width - margin * 2;
      let cursorX = margin;
      let cursorY = canvas.height * 0.2;

      const words = NOIR_TEXT.replace(/\n/g, ' \n ').split(' ');
      
      for (let word of words) {
        if (word === '\n') {
          cursorX = margin;
          cursorY += LINE_HEIGHT;
          continue;
        }

        const wordWidth = ctx.measureText(word + ' ').width;
        if (cursorX + wordWidth > margin + maxWidth) {
          cursorX = margin;
          cursorY += LINE_HEIGHT;
        }

        for (let char of word) {
          const charWidth = ctx.measureText(char).width;
          
          particles.push({
            char,
            x: cursorX,
            y: cursorY,
            originX: cursorX,
            originY: cursorY,
            vx: 0,
            vy: 0,
            alpha: 0,
            blur: 5,
            size: FONT_SIZE
          });

          cursorX += charWidth;
        }
        cursorX += ctx.measureText(' ').width;
      }
      particlesRef.current = particles;
    };

    const animate = () => {
      // Dark, grainy background handled by CSS or simple fill
      ctx.fillStyle = '#080808'; 
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const mx = mouseRef.current.x;
      const my = mouseRef.current.y;
      
      // Spotlight gradient
      const spotlightRadius = 250;
      const grad = ctx.createRadialGradient(mx, my, 0, mx, my, spotlightRadius);
      grad.addColorStop(0, 'rgba(255, 255, 255, 0.08)');
      grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const particles = particlesRef.current;
      
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';

      particles.forEach(p => {
         // --- Logic ---
         const dx = mx - p.x;
         const dy = my - p.y;
         const dist = Math.sqrt(dx*dx + dy*dy);
         
         const inSpotlight = dist < spotlightRadius;
         
         // 1. Visibility (Alpha & Blur)
         // Reveal in spotlight, fade out and blur outside
         let targetAlpha = inSpotlight ? 1 : 0.1;
         let targetBlur = inSpotlight ? 0 : 4;
         
         if (inSpotlight) {
             // Calculate intensity based on center distance
             const intensity = 1 - (dist / spotlightRadius);
             targetAlpha = 0.2 + intensity * 0.8;
         }

         p.alpha += (targetAlpha - p.alpha) * 0.1;
         p.blur += (targetBlur - p.blur) * 0.1;

         // 2. Smoky Movement
         // If mouse is near, impart some "smoke" velocity
         if (inSpotlight) {
             const intensity = 1 - (dist / spotlightRadius);
             // Drift upwards and slightly random
             p.vx += (Math.random() - 0.5) * 0.2 * intensity;
             p.vy -= 0.2 * intensity; // Upward drift
             
             // Gentle swirling away from mouse
             p.vx -= (dx / dist) * 0.1 * intensity;
             p.vy -= (dy / dist) * 0.1 * intensity;
         }

         // 3. Return to Origin
         // Spring force back to original position
         const ox = p.originX - p.x;
         const oy = p.originY - p.y;
         
         // Only pull back strongly if NOT in spotlight center
         // If in spotlight, allow more float
         const springK = inSpotlight ? 0.01 : 0.05;
         
         p.vx += ox * springK;
         p.vy += oy * springK;
         
         // Damping
         p.vx *= 0.92;
         p.vy *= 0.92;
         
         p.x += p.vx;
         p.y += p.vy;

         // --- Render ---
         // Optimize: skip invisible
         if (p.alpha < 0.02) return;

         ctx.save();
         ctx.globalAlpha = p.alpha;
         
         if (p.blur > 0.5) {
             ctx.filter = `blur(${p.blur}px)`;
         }
         
         ctx.fillStyle = '#e0e0e0'; // Off-white smoke color
         ctx.font = `italic ${p.size}px "Georgia", serif`;
         ctx.fillText(p.char, p.x, p.y);
         
         ctx.restore();
      });

      requestRef.current = requestAnimationFrame(animate);
    };

    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current = { x: e.clientX, y: e.clientY };
    };

    window.addEventListener('mousemove', handleMouseMove);
    init();
    requestRef.current = requestAnimationFrame(animate);

    const handleResize = () => {
      cancelAnimationFrame(requestRef.current);
      init();
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(requestRef.current);
    };
  }, [key]);

  return (
    <div className="relative w-full h-full cursor-none bg-[#080808]">
      <canvas ref={canvasRef} className="block w-full h-full" />
      <button 
        onClick={handleRestart}
        className="absolute top-20 left-4 p-2 bg-white/10 rounded-full hover:bg-white/30 transition-colors shadow-sm text-white/50 hover:text-white z-10"
      >
        <RotateCcw size={20} />
      </button>
      
      {/* Noise Overlay for Film Grain */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.05] z-10" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`
      }}></div>

       <div className="absolute bottom-10 left-0 w-full text-center pointer-events-none">
        <h2 className="text-white font-serif text-sm tracking-[0.5em] uppercase opacity-40">
            NOIR / SMOKE
        </h2>
      </div>
    </div>
  );
};

export default NoirEffect;