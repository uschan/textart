import React, { useEffect, useRef, useState } from 'react';
import { RotateCcw } from 'lucide-react';
import { Spore } from './types';
import { SPORE_CHARS } from './constants';

const SporeEffect: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [key, setKey] = useState(0); 
  const requestRef = useRef<number>(0);
  
  const stateRef = useRef<{ spores: Spore[] }>({ spores: [] });
  const mouseRef = useRef({ x: -1000, y: -1000, isDown: false });

  const handleRestart = () => {
    stateRef.current.spores = [];
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
      stateRef.current.spores = [];
    };

    const getRandomChar = () => SPORE_CHARS[Math.floor(Math.random() * SPORE_CHARS.length)];

    const createSpore = (x: number, y: number, rooted = false): Spore => ({
      x,
      y,
      vx: (Math.random() - 0.5) * 1.5,
      vy: (Math.random() - 0.5) * 1.5 + 0.5, // Slight downdrift
      char: getRandomChar(),
      life: 1.0,
      state: rooted ? 'ROOTED' : 'FLOATING',
      angle: (Math.random() - 0.5) * 0.5,
      scale: rooted ? 0 : 1, // Rooted start small then grow
    });

    // Helper to find nearby rooted spores (Spatial hashing would be better for performance, but loop is okay for < 2000 items)
    const findNearestRoot = (x: number, y: number, spores: Spore[]) => {
      let minDistSq = 20 * 20; // Connection distance
      let found = false;
      
      for (let i = 0; i < spores.length; i++) {
        const s = spores[i];
        if (s.state === 'ROOTED') {
          const dx = s.x - x;
          const dy = s.y - y;
          const distSq = dx*dx + dy*dy;
          if (distSq < minDistSq) {
            found = true;
            break;
          }
        }
      }
      return found;
    };

    const animate = () => {
      const { spores } = stateRef.current;
      
      // Spawn spores at mouse
      if (mouseRef.current.x > 0) {
         // Emit 2 per frame
         for(let i=0; i<2; i++) {
            spores.push(createSpore(
                mouseRef.current.x + (Math.random()-0.5)*20, 
                mouseRef.current.y + (Math.random()-0.5)*20
            ));
         }
      }

      ctx.fillStyle = '#f5f5f5'; // Clear with slight trail? No, clean clear.
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw Floor line
      const floorY = canvas.height - 20;

      // Update & Draw
      for (let i = spores.length - 1; i >= 0; i--) {
        const s = spores[i];

        if (s.state === 'FLOATING') {
          // Physics
          s.x += s.vx;
          s.y += s.vy;
          s.vy += 0.02; // Gravity
          s.vx *= 0.98;
          s.vy *= 0.98;
          
          // Wander
          s.vx += (Math.random() - 0.5) * 0.1;

          // Check Bounds / Rooting
          let shouldRoot = false;
          
          // Floor collision
          if (s.y > floorY) {
            s.y = floorY;
            shouldRoot = true;
          }

          // Root collision (DLA)
          // Optimization: Only check if low enough or density high enough
          if (!shouldRoot && spores.length > 50) {
             if (findNearestRoot(s.x, s.y, spores)) {
               shouldRoot = true;
             }
          }

          if (shouldRoot) {
            s.state = 'ROOTED';
            s.vx = 0;
            s.vy = 0;
            s.scale = 0.1; // Start growth animation
          }
          
          // Kill if off screen
          if (s.x < 0 || s.x > canvas.width) {
            spores.splice(i, 1);
            continue;
          }
          
        } else {
          // ROOTED Behavior
          // Growth animation
          if (s.scale < 1) s.scale += 0.1;
          
          // Random Growth (Spontaneous generation)
          // Small chance to spawn a new branch growing UP/OUT
          if (Math.random() < 0.002) {
             const angle = -Math.PI/2 + (Math.random() - 0.5) * 2; // Upwards cone
             const dist = 14;
             const newX = s.x + Math.cos(angle) * dist;
             const newY = s.y + Math.sin(angle) * dist;
             
             // Ensure not going through floor
             if (newY < floorY) {
                const newSpore = createSpore(newX, newY, true);
                newSpore.scale = 0;
                spores.push(newSpore);
             }
          }
        }

        // Draw
        ctx.save();
        ctx.translate(s.x, s.y);
        ctx.rotate(s.angle);
        ctx.scale(s.scale, s.scale);
        
        const alpha = s.state === 'ROOTED' ? 1 : 0.6;
        ctx.fillStyle = `rgba(30, 40, 30, ${alpha})`;
        ctx.font = '14px "Courier New", monospace';
        ctx.fillText(s.char, -4, 4);
        
        ctx.restore();
      }

      // Limit particle count to prevent crash
      if (spores.length > 2000) {
        stateRef.current.spores = spores.slice(spores.length - 2000);
      }

      requestRef.current = requestAnimationFrame(animate);
    };

    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current = { x: e.clientX, y: e.clientY, isDown: mouseRef.current.isDown };
    };

    const handleMouseDown = () => {
      // Explosion logic
      const { spores } = stateRef.current;
      const mx = mouseRef.current.x;
      const my = mouseRef.current.y;
      
      spores.forEach(s => {
         if (s.state === 'ROOTED') {
            const dx = s.x - mx;
            const dy = s.y - my;
            const dist = Math.sqrt(dx*dx + dy*dy);
            if (dist < 150) {
              s.state = 'FLOATING';
              s.vx = (dx / dist) * 5 + (Math.random()-0.5)*2;
              s.vy = (dy / dist) * 5 - 5; // Upward blast
            }
         }
      });
      mouseRef.current.isDown = true;
    };
    
    const handleMouseUp = () => {
        mouseRef.current.isDown = false;
    }

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);
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
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(requestRef.current);
    };
  }, [key]);

  return (
    <div className="relative w-full h-full cursor-crosshair">
      <canvas ref={canvasRef} className="block w-full h-full" />
      <button 
        onClick={handleRestart}
        className="absolute top-20 left-4 p-2 bg-white/80 rounded-full hover:bg-white transition-colors shadow-sm text-gray-600 hover:text-green-700 z-10"
      >
        <RotateCcw size={20} />
      </button>
      
       <div className="absolute bottom-10 left-0 w-full text-center pointer-events-none">
        <h2 className="text-gray-400 font-serif text-sm tracking-[0.5em] uppercase opacity-60">
            SPORE / GROWTH
        </h2>
      </div>
    </div>
  );
};

export default SporeEffect;