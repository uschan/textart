import React, { useEffect, useRef, useState } from 'react';
import { RotateCcw } from 'lucide-react';
import { ThreadNode } from './types';
import { THREAD_TEXT } from './constants';

const ThreadEffect: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [key, setKey] = useState(0); 
  const requestRef = useRef<number>(0);
  
  const nodesRef = useRef<ThreadNode[]>([]);
  const mouseRef = useRef({ x: -1000, y: -1000 });

  const handleRestart = () => {
    setKey(prev => prev + 1);
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Config
    const CONNECTION_DIST = 120;
    const MOUSE_RADIUS = 200;

    const init = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;

      const nodes: ThreadNode[] = [];
      const words = THREAD_TEXT.split(' ');
      
      // Hexagonal Grid Layout for better web structure
      const step = 60;
      let col = 0;
      let wordIdx = 0;
      
      for(let y = 100; y < canvas.height - 100; y += step * 0.866) { // sin(60)
        col++;
        const offsetX = (col % 2 === 0) ? step / 2 : 0;
        
        for(let x = 100; x < canvas.width - 100; x += step) {
           // Skip some points to make it look organic
           if (Math.random() > 0.8) continue;

           let char = "*";
           if (wordIdx < words.length) {
               const w = words[wordIdx];
               char = w;
               wordIdx = (wordIdx + 1) % words.length;
           }

           nodes.push({
             x: x + offsetX + (Math.random()-0.5)*20,
             y: y + (Math.random()-0.5)*20,
             originX: x + offsetX,
             originY: y,
             vx: 0,
             vy: 0,
             char: char
           });
        }
      }
      
      nodesRef.current = nodes;
    };

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#fff'; // Stark white
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const nodes = nodesRef.current;
      const mx = mouseRef.current.x;
      const my = mouseRef.current.y;

      // 1. Draw Connections First (Background layer)
      ctx.lineWidth = 1;
      
      for (let i = 0; i < nodes.length; i++) {
        const a = nodes[i];
        
        // Find neighbors
        // Optimization: Only check a subset or check within grid? 
        // For N < 500, simple loop is fine.
        
        for (let j = i + 1; j < nodes.length; j++) {
            const b = nodes[j];
            const dx = a.x - b.x;
            const dy = a.y - b.y;
            const distSq = dx*dx + dy*dy;
            
            if (distSq < CONNECTION_DIST * CONNECTION_DIST) {
                const dist = Math.sqrt(distSq);
                const alpha = 1 - (dist / CONNECTION_DIST);
                
                // Tension check
                // If either node is far from origin, the line is under tension
                const tensionA = Math.sqrt((a.x-a.originX)**2 + (a.y-a.originY)**2);
                const tensionB = Math.sqrt((b.x-b.originX)**2 + (b.y-b.originY)**2);
                const maxTension = Math.max(tensionA, tensionB);
                
                if (maxTension > 30) {
                   // Stressed line: Red
                   const t = Math.min(1, (maxTension - 30) / 50);
                   ctx.strokeStyle = `rgba(220, 20, 60, ${alpha * t + 0.1})`;
                } else {
                   // Relaxed line: Grey
                   ctx.strokeStyle = `rgba(200, 200, 200, ${alpha})`;
                }
                
                ctx.beginPath();
                ctx.moveTo(a.x, a.y);
                ctx.lineTo(b.x, b.y);
                ctx.stroke();
            }
        }
      }

      // 2. Update Nodes & Draw Text
      ctx.font = '10px "Arial", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      nodes.forEach(p => {
        // Physics
        
        // Spring to origin
        const k = 0.05;
        const ax = (p.originX - p.x) * k;
        const ay = (p.originY - p.y) * k;
        
        p.vx += ax;
        p.vy += ay;
        
        // Mouse Repulsion (Creating Tension)
        const dx = p.x - mx;
        const dy = p.y - my;
        const distSq = dx*dx + dy*dy;
        
        if (distSq < MOUSE_RADIUS * MOUSE_RADIUS) {
            const dist = Math.sqrt(distSq);
            const force = (1 - dist / MOUSE_RADIUS) * 2;
            p.vx += (dx / dist) * force;
            p.vy += (dy / dist) * force;
        }
        
        // Damping
        p.vx *= 0.9;
        p.vy *= 0.9;
        
        p.x += p.vx;
        p.y += p.vy;
        
        // Color Text based on displacement
        const disp = Math.sqrt((p.x-p.originX)**2 + (p.y-p.originY)**2);
        if (disp > 20) {
            ctx.fillStyle = '#D92222'; // Red
            // ctx.font = 'bold 12px "Arial"';
        } else {
            ctx.fillStyle = '#000';
        }
        
        ctx.fillText(p.char, p.x, p.y);
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
    <div className="relative w-full h-full cursor-crosshair">
      <canvas ref={canvasRef} className="block w-full h-full" />
      <button 
        onClick={handleRestart}
        className="absolute top-20 left-4 p-2 bg-white/80 rounded-full hover:bg-white transition-colors shadow-sm text-gray-600 hover:text-red-700 z-10"
      >
        <RotateCcw size={20} />
      </button>
      
       <div className="absolute bottom-10 left-0 w-full text-center pointer-events-none">
        <h2 className="text-gray-400 font-serif text-sm tracking-[0.5em] uppercase opacity-60">
            THREAD / CONNECTION
        </h2>
      </div>
    </div>
  );
};

export default ThreadEffect;