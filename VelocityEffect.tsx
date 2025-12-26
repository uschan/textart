import React, { useEffect, useRef, useState } from 'react';
import { RotateCcw } from 'lucide-react';
import { WarpParticle } from './types';
import { VELOCITY_WORDS } from './constants';

const VelocityEffect: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [key, setKey] = useState(0); 
  const requestRef = useRef<number>(0);
  
  const particlesRef = useRef<WarpParticle[]>([]);
  const mouseRef = useRef({ x: 0, y: 0 }); // normalized -1 to 1

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

      const particles: WarpParticle[] = [];
      const count = 150;
      
      for(let i=0; i<count; i++) {
        particles.push(createParticle());
      }
      particlesRef.current = particles;
    };
    
    const createParticle = (startFar = false): WarpParticle => {
        // Spawn randomly in X/Y
        const angle = Math.random() * Math.PI * 2;
        const radius = 0.1 + Math.random() * 2; // Spread out
        
        return {
            x: Math.cos(angle) * radius,
            y: Math.sin(angle) * radius,
            z: startFar ? 2 + Math.random() * 5 : Math.random() * 5, // Z depth
            char: VELOCITY_WORDS[Math.floor(Math.random() * VELOCITY_WORDS.length)],
            color: 'white',
            angle: 0
        };
    };

    const animate = () => {
      // Trail effect
      ctx.fillStyle = 'rgba(0, 5, 10, 0.4)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const cx = canvas.width / 2;
      const cy = canvas.height / 2;
      
      // Steering
      const steerX = mouseRef.current.x * 0.05;
      const steerY = mouseRef.current.y * 0.05;

      particlesRef.current.forEach((p, i) => {
          // Move towards camera
          p.z -= 0.05; // Base speed
          
          // Acceleration effect?
          p.z -= (5 - p.z) * 0.01;

          // Steering: Move X/Y opposite to mouse to simulate turning
          p.x -= steerX * (0.1 / Math.max(0.1, p.z));
          p.y -= steerY * (0.1 / Math.max(0.1, p.z));

          // Respawn
          if (p.z <= 0.01 || Math.abs(p.x/p.z) > 10 || Math.abs(p.y/p.z) > 10) {
              particlesRef.current[i] = createParticle(true);
              return;
          }
          
          // Project
          const k = 400; // FOV
          const px = p.x / p.z * k + cx;
          const py = p.y / p.z * k + cy;
          
          const scale = 1 / p.z;
          const fontSize = Math.max(0, 10 * scale);
          
          if (fontSize > 300) { // Too close/big
             p.z = 0; // Trigger respawn next frame
             return;
          }

          // Doppler Color
          // Z large (far) -> Blue/Dark
          // Z small (near) -> White/Red
          
          let color = '#fff';
          let alpha = Math.min(1, scale * 0.5);
          
          if (p.z > 3) {
              ctx.fillStyle = `rgba(0, 100, 255, ${alpha})`; // Far Blue
          } else if (p.z < 0.5) {
               ctx.fillStyle = `rgba(255, 50, 50, ${alpha})`; // Near Red (Redshift?)
          } else {
               ctx.fillStyle = `rgba(200, 240, 255, ${alpha})`; // Mid Cyan
          }
          
          ctx.font = `bold ${fontSize}px "Arial", sans-serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          
          // Slight rotation based on position
          const rotAngle = Math.atan2(py - cy, px - cx);
          
          ctx.save();
          ctx.translate(px, py);
          ctx.rotate(rotAngle + Math.PI/2); // Align text radially
          ctx.fillText(p.char, 0, 0);
          ctx.restore();
          
          // Motion Blur Lines for fast moving particles
          if (p.z < 1.0) {
             const prevZ = p.z + 0.1;
             const prevPx = p.x / prevZ * k + cx;
             const prevPy = p.y / prevZ * k + cy;
             
             ctx.beginPath();
             ctx.strokeStyle = ctx.fillStyle;
             ctx.lineWidth = fontSize * 0.1;
             ctx.moveTo(px, py);
             ctx.lineTo(prevPx, prevPy);
             ctx.stroke();
          }
      });

      requestRef.current = requestAnimationFrame(animate);
    };

    const handleMouseMove = (e: MouseEvent) => {
       const nx = (e.clientX / window.innerWidth) * 2 - 1;
       const ny = (e.clientY / window.innerHeight) * 2 - 1;
       mouseRef.current = { x: nx, y: ny };
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
    <div className="relative w-full h-full cursor-none bg-black overflow-hidden">
      <canvas ref={canvasRef} className="block w-full h-full" />
      <button 
        onClick={handleRestart}
        className="absolute top-20 left-4 p-2 bg-white/10 rounded-full hover:bg-white/30 transition-colors shadow-sm text-white z-10"
      >
        <RotateCcw size={20} />
      </button>
      
       <div className="absolute bottom-10 left-0 w-full text-center pointer-events-none">
        <h2 className="text-white font-serif text-sm tracking-[0.5em] uppercase opacity-70" style={{textShadow: '0 0 10px blue'}}>
            VELOCITY / WARP
        </h2>
      </div>
    </div>
  );
};

export default VelocityEffect;