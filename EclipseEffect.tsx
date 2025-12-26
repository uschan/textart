import React, { useEffect, useRef, useState } from 'react';
import { RotateCcw } from 'lucide-react';
import { ShadowObject } from './types';
import { ECLIPSE_WORDS } from './constants';

const EclipseEffect: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [key, setKey] = useState(0); 
  const requestRef = useRef<number>(0);
  
  const objectsRef = useRef<ShadowObject[]>([]);
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

      const objects: ShadowObject[] = [];
      const cols = 5;
      const rows = 4;
      const cellW = canvas.width / cols;
      const cellH = canvas.height / rows;

      ctx.font = '900 60px "Arial Black", sans-serif';

      for(let i=0; i<cols; i++) {
        for(let j=0; j<rows; j++) {
            // Jitter position
            const word = ECLIPSE_WORDS[(i + j * cols) % ECLIPSE_WORDS.length];
            const metrics = ctx.measureText(word);
            const w = metrics.width;
            const h = 40; // Approx cap height

            const cx = (i + 0.5) * cellW + (Math.random()-0.5) * 50;
            const cy = (j + 0.5) * cellH + (Math.random()-0.5) * 50;

            objects.push({
                text: word,
                x: cx,
                y: cy,
                width: w,
                height: h
            });
        }
      }
      objectsRef.current = objects;
      
      // Default mouse to center
      mouseRef.current = { x: canvas.width/2, y: canvas.height/2 };
    };

    const drawShadow = (obj: ShadowObject, mx: number, my: number) => {
        const dx = obj.x - mx;
        const dy = obj.y - my;
        const angle = Math.atan2(dy, dx);
        const dist = Math.sqrt(dx*dx + dy*dy);
        
        // Shadow length inversely proportional to distance? 
        // Or just super long to go off screen.
        const shadowLen = 2000; 

        // Calculate corners of the text box relative to center
        // Simplified as a bounding box
        const corners = [
            { x: obj.x - obj.width/2, y: obj.y - obj.height/2 },
            { x: obj.x + obj.width/2, y: obj.y - obj.height/2 },
            { x: obj.x + obj.width/2, y: obj.y + obj.height/2 },
            { x: obj.x - obj.width/2, y: obj.y + obj.height/2 },
        ];

        // Find the "horizon" edges that cast the shadow
        // For a convex shape like a box, we can just project all corners
        // and find the convex hull, or simpler: project pairs.
        
        ctx.fillStyle = 'black';
        ctx.beginPath();
        
        corners.forEach((c, i) => {
             const nextC = corners[(i+1)%4];
             
             // Project both points away from light
             const angle1 = Math.atan2(c.y - my, c.x - mx);
             const angle2 = Math.atan2(nextC.y - my, nextC.x - mx);
             
             const p1x = c.x + Math.cos(angle1) * shadowLen;
             const p1y = c.y + Math.sin(angle1) * shadowLen;
             const p2x = nextC.x + Math.cos(angle2) * shadowLen;
             const p2y = nextC.y + Math.sin(angle2) * shadowLen;
             
             ctx.moveTo(c.x, c.y);
             ctx.lineTo(p1x, p1y);
             ctx.lineTo(p2x, p2y);
             ctx.lineTo(nextC.x, nextC.y);
             ctx.lineTo(c.x, c.y);
        });
        
        ctx.fill();
    };

    const animate = () => {
      const mx = mouseRef.current.x;
      const my = mouseRef.current.y;
      
      // 1. Draw Light Background
      // The background is actually the "Light"
      const grad = ctx.createRadialGradient(mx, my, 0, mx, my, canvas.width * 0.8);
      grad.addColorStop(0, '#ffffff');
      grad.addColorStop(0.2, '#dddddd');
      grad.addColorStop(1, '#333333');
      
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const objects = objectsRef.current;
      
      // 2. Draw Shadows (The "Eclipse")
      // We draw shadows first, on top of the light background
      objects.forEach(obj => {
          drawShadow(obj, mx, my);
      });

      // 3. Draw Objects (The Obstacles)
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.font = '900 60px "Arial Black", sans-serif';
      
      objects.forEach(obj => {
          // Object itself is dark (silhouetted against light)
          // But maybe slightly illuminated on the side facing light?
          // Let's keep it stark black for high contrast noir feel.
          ctx.fillStyle = '#111';
          ctx.fillText(obj.text, obj.x, obj.y);
          
          // Slight rim light?
          /*
          ctx.shadowColor = 'white';
          ctx.shadowBlur = 0;
          ctx.shadowOffsetX = (mx - obj.x) * 0.01;
          ctx.shadowOffsetY = (my - obj.y) * 0.01;
          ctx.fillText(obj.text, obj.x, obj.y);
          */
      });
      
      // 4. Flashlight Glow overlay (optional atmosphere)
      /*
      const glow = ctx.createRadialGradient(mx, my, 0, mx, my, 100);
      glow.addColorStop(0, 'rgba(255,255,255,0.2)');
      glow.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = glow;
      ctx.fillRect(0,0,canvas.width, canvas.height);
      */

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
    <div className="relative w-full h-full cursor-none bg-[#111]">
      <canvas ref={canvasRef} className="block w-full h-full" />
      <button 
        onClick={handleRestart}
        className="absolute top-20 left-4 p-2 bg-white/10 rounded-full hover:bg-white/30 transition-colors shadow-sm text-white z-10"
      >
        <RotateCcw size={20} />
      </button>
      
       <div className="absolute bottom-10 left-0 w-full text-center pointer-events-none">
        <h2 className="text-black font-serif text-sm tracking-[0.5em] uppercase opacity-50 mix-blend-overlay">
            ECLIPSE / SHADOW VOLUME
        </h2>
      </div>
    </div>
  );
};

export default EclipseEffect;