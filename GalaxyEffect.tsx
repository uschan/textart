import React, { useEffect, useRef, useState } from 'react';
import { RotateCcw } from 'lucide-react';
import { GalaxyStar } from './types';
import { GALAXY_TEXT } from './constants';

const GalaxyEffect: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [key, setKey] = useState(0); 
  const requestRef = useRef<number>(0);
  
  const starsRef = useRef<GalaxyStar[]>([]);
  const mouseRef = useRef({ x: 0, y: 0 });

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

      const stars: GalaxyStar[] = [];
      const count = 300;
      const words = GALAXY_TEXT.split(' ');
      
      for(let i=0; i<count; i++) {
        // Spiral Distribution
        // angle
        const angle = Math.random() * Math.PI * 2;
        // dist: biased towards center but with a hole
        const r = 50 + Math.pow(Math.random(), 2) * (Math.min(canvas.width, canvas.height)/2 - 50);
        
        // Color based on distance (Heat map: White -> Gold -> Purple -> Blue)
        const t = r / (Math.min(canvas.width, canvas.height)/2);
        let color = '#fff';
        if (t < 0.2) color = '#FFFDD0'; // Cream
        else if (t < 0.4) color = '#FFD700'; // Gold
        else if (t < 0.7) color = '#BA55D3'; // Orchid
        else color = '#4169E1'; // Royal Blue

        stars.push({
          x: 0, y: 0, z: 0,
          angle: angle + Math.random()*0.5, // Spiral arm offset
          radius: r,
          speed: 0.002 + (1/r) * 0.5, // Kepler-ish: closer is faster
          char: words[i % words.length],
          size: 10 + Math.random() * 8,
          color: color
        });
      }
      starsRef.current = stars;
    };

    const animate = () => {
      // Deep space background with trails
      ctx.fillStyle = 'rgba(10, 10, 15, 0.4)'; 
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const cx = canvas.width / 2;
      const cy = canvas.height / 2;
      const stars = starsRef.current;
      
      // Mouse tilt effect
      const mx = (mouseRef.current.x - cx) * 0.0005;
      const my = (mouseRef.current.y - cy) * 0.0005;

      // Update positions
      stars.forEach(s => {
        s.angle += s.speed;
        
        // 3D Projection approximation
        // Rotate around Y axis (based on mouse X)
        // Rotate around X axis (based on mouse Y)
        
        const rawX = Math.cos(s.angle) * s.radius;
        const rawY = Math.sin(s.angle) * s.radius * 0.6; // Flatten disk
        const rawZ = Math.sin(s.angle) * s.radius * 0.5;
        
        // Apply tilt
        const tiltedY = rawY * Math.cos(my * 10) - rawZ * Math.sin(my * 10);
        const tiltedZ = rawY * Math.sin(my * 10) + rawZ * Math.cos(my * 10);
        
        const tiltedX = rawX * Math.cos(mx * 10) - tiltedZ * Math.sin(mx * 10);
        const finalZ = rawX * Math.sin(mx * 10) + tiltedZ * Math.cos(mx * 10);

        s.x = cx + tiltedX;
        s.y = cy + tiltedY;
        s.z = finalZ;
      });

      // Sort by depth for correct z-indexing
      stars.sort((a, b) => a.z - b.z);

      // Draw Connections (Constellations)
      // Only connect nearby stars
      ctx.globalCompositeOperation = 'lighter';
      ctx.lineWidth = 0.5;
      
      // Optimization: Check only a subset or spatial partition?
      // For N=300, O(N^2) is 90000 checks, doable in JS.
      
      for(let i=0; i<stars.length; i++) {
        const s1 = stars[i];
        if (s1.z < 0) continue; // Don't connect background stars too much

        let connections = 0;
        for(let j=i+1; j<stars.length; j++) {
            const s2 = stars[j];
            if (connections > 3) break; // Limit connections per star

            const dx = s1.x - s2.x;
            const dy = s1.y - s2.y;
            const distSq = dx*dx + dy*dy;
            
            if (distSq < 3000) { // Connection radius
                const dist = Math.sqrt(distSq);
                const alpha = 1 - dist / 55;
                
                // Gradient line
                const grad = ctx.createLinearGradient(s1.x, s1.y, s2.x, s2.y);
                grad.addColorStop(0, s1.color);
                grad.addColorStop(1, s2.color);
                
                ctx.strokeStyle = grad;
                ctx.globalAlpha = alpha * 0.4;
                ctx.beginPath();
                ctx.moveTo(s1.x, s1.y);
                ctx.lineTo(s2.x, s2.y);
                ctx.stroke();
                
                connections++;
            }
        }
      }

      // Draw Stars
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      
      stars.forEach(s => {
        const scale = (s.z + 500) / 500; // Fake perspective scale
        const alpha = Math.max(0.1, Math.min(1, scale));
        
        if (scale > 0) {
            ctx.font = `${Math.max(8, s.size * scale)}px "Arial", sans-serif`;
            ctx.fillStyle = s.color;
            ctx.globalAlpha = alpha;
            
            // Bloom center
            if (s.radius < 100) {
                 ctx.shadowColor = s.color;
                 ctx.shadowBlur = 20;
            } else {
                 ctx.shadowBlur = 0;
            }
            
            ctx.fillText(s.char, s.x, s.y);
        }
      });
      
      ctx.globalAlpha = 1.0;
      ctx.shadowBlur = 0;
      ctx.globalCompositeOperation = 'source-over';

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
    <div className="relative w-full h-full cursor-move bg-[#0a0a0f]">
      <canvas ref={canvasRef} className="block w-full h-full" />
      <button 
        onClick={handleRestart}
        className="absolute top-20 left-4 p-2 bg-white/10 border border-white/20 rounded-full hover:bg-white/30 transition-colors shadow-sm text-white z-10"
      >
        <RotateCcw size={20} />
      </button>
      
       <div className="absolute bottom-10 left-0 w-full text-center pointer-events-none">
        <h2 className="text-white/50 font-serif text-sm tracking-[0.5em] uppercase shadow-lg">
            GALAXY / ORBIT
        </h2>
      </div>
    </div>
  );
};

export default GalaxyEffect;