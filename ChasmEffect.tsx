import React, { useEffect, useRef, useState } from 'react';
import { RotateCcw } from 'lucide-react';
import { AbyssObject } from './types';
import { CHASM_WORDS } from './constants';

const ChasmEffect: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [key, setKey] = useState(0); 
  const requestRef = useRef<number>(0);
  
  const bodiesRef = useRef<AbyssObject[]>([]);
  const mouseRef = useRef({ x: 0, y: 0, isDown: false, dragId: -1, lastX: 0, lastY: 0 });

  const handleRestart = () => {
    setKey(prev => prev + 1);
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Config
    const CHASM_RADIUS = 60; // The actual hole size
    const EVENT_HORIZON = 180; // Where gravity becomes inescapable

    const init = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;

      const bodies: AbyssObject[] = [];
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      
      CHASM_WORDS.forEach((word, i) => {
        // Spawn in a ring around center
        const angle = Math.random() * Math.PI * 2;
        const dist = 300 + Math.random() * 500;
        
        bodies.push({
          id: i,
          text: word,
          x: centerX + Math.cos(angle) * dist,
          y: centerY + Math.sin(angle) * dist,
          vx: (Math.random() - 0.5) * 1, // Slight drift
          vy: (Math.random() - 0.5) * 1,
          angle: angle + Math.PI/2, // Tangential start
          angularVelocity: (Math.random() - 0.5) * 0.02,
          isDragging: false,
          state: 'SURFACE',
          depth: 1
        });
      });
      bodiesRef.current = bodies;
      
      // Center mouse initially
      mouseRef.current.x = centerX;
      mouseRef.current.y = centerY;
    };

    const animate = () => {
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      
      // 1. Draw Background
      // Radial gradient for the void
      const grad = ctx.createRadialGradient(centerX, centerY, CHASM_RADIUS, centerX, centerY, canvas.width);
      grad.addColorStop(0, '#000000');
      grad.addColorStop(0.2, '#1a1a1a');
      grad.addColorStop(1, '#050505');
      
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw Event Horizon / Distortion Ring
      ctx.beginPath();
      ctx.arc(centerX, centerY, CHASM_RADIUS, 0, Math.PI * 2);
      ctx.fillStyle = '#000';
      ctx.fill();
      
      // Accretion disk glow
      ctx.beginPath();
      ctx.arc(centerX, centerY, CHASM_RADIUS + 5, 0, Math.PI * 2);
      ctx.lineWidth = 2;
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
      ctx.stroke();

      // 2. Update Bodies
      const bodies = bodiesRef.current;

      bodies.forEach(b => {
        
        if (b.isDragging) {
             const dx = mouseRef.current.x - b.x;
             const dy = mouseRef.current.y - b.y;
             b.vx = dx * 0.1;
             b.vy = dy * 0.1;
             b.x += b.vx;
             b.y += b.vy;
        } else {
             // ORBITAL PHYSICS
             const dx = centerX - b.x;
             const dy = centerY - b.y;
             const distSq = dx*dx + dy*dy;
             const dist = Math.sqrt(distSq);
             
             // Gravity Force
             // Stronger as it gets closer: F = G / r
             const gravityStrength = 800 / (dist + 10); 
             
             // Velocity needed for stable orbit: v = sqrt(G/r)
             // We want them to spiral in, so we give them less than orbital velocity,
             // or add a "drag" factor.
             
             const angleToCenter = Math.atan2(dy, dx);
             
             // Gravity vector (Pull in)
             const ax = Math.cos(angleToCenter) * gravityStrength * 0.05;
             const ay = Math.sin(angleToCenter) * gravityStrength * 0.05;
             
             b.vx += ax;
             b.vy += ay;
             
             // Tangential Force (Spin) - keeps them orbiting
             // We simulate conservation of angular momentum: speed increases as r decreases
             // But we add drag to make them eventually fall in.
             
             b.vx *= 0.99; // Drag
             b.vy *= 0.99;
             
             b.x += b.vx;
             b.y += b.vy;
             
             // Align text angle with movement vector (Spaghettification orientation)
             // Smoothly rotate towards velocity vector
             const moveAngle = Math.atan2(b.vy, b.vx);
             b.angle += (moveAngle - b.angle) * 0.1;
        }

        // 3. Render
        const dx = centerX - b.x;
        const dy = centerY - b.y;
        const dist = Math.sqrt(dx*dx + dy*dy);
        
        // Spaghettification Scale
        // As it gets closer to CHASM_RADIUS, stretch width, shrink height
        let stretch = 1;
        let thinness = 1;
        let alpha = 1;
        
        if (dist < EVENT_HORIZON) {
            const t = Math.max(0, (dist - CHASM_RADIUS) / (EVENT_HORIZON - CHASM_RADIUS));
            // t goes from 0 (at hole) to 1 (at horizon edge)
            stretch = 1 + (1-t) * 4; // Stretch up to 5x
            thinness = 0.2 + t * 0.8; // Thin down to 0.2x
            alpha = t; // Fade out as it enters
        }
        
        // Respawn if inside hole
        if (dist < CHASM_RADIUS) {
            const angle = Math.random() * Math.PI * 2;
            const respawnDist = Math.max(canvas.width, canvas.height) * 0.7;
            b.x = centerX + Math.cos(angle) * respawnDist;
            b.y = centerY + Math.sin(angle) * respawnDist;
            // Give tangential velocity
            const tangent = angle + Math.PI/2;
            b.vx = Math.cos(tangent) * 4;
            b.vy = Math.sin(tangent) * 4;
            b.depth = 1;
        } else {
            ctx.save();
            ctx.translate(b.x, b.y);
            ctx.rotate(b.angle);
            ctx.scale(stretch, thinness);
            
            ctx.fillStyle = b.isDragging ? '#fff' : `rgba(200, 200, 200, ${alpha})`;
            // Change color shift (Redshift) when close?
            if (dist < EVENT_HORIZON) {
                 ctx.fillStyle = `rgba(255, ${Math.floor(255 * alpha)}, ${Math.floor(255 * alpha)}, ${alpha})`;
            }

            ctx.font = 'bold 24px "Arial Black"';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(b.text, 0, 0);
            
            ctx.restore();
        }
      });

      requestRef.current = requestAnimationFrame(animate);
    };

    // Interaction
    const handleMouseDown = (e: MouseEvent) => {
        mouseRef.current.isDown = true;
        mouseRef.current.x = e.clientX;
        mouseRef.current.y = e.clientY;
        mouseRef.current.lastX = e.clientX;
        mouseRef.current.lastY = e.clientY;

        // Pick body
        const bodies = bodiesRef.current;
        for (let i = 0; i < bodies.length; i++) {
            const b = bodies[i];
            const dx = e.clientX - b.x;
            const dy = e.clientY - b.y;
            if (dx*dx + dy*dy < 1600) { 
                b.isDragging = true;
                mouseRef.current.dragId = b.id;
                break;
            }
        }
    };

    const handleMouseMove = (e: MouseEvent) => {
        mouseRef.current.x = e.clientX;
        mouseRef.current.y = e.clientY;
    };

    const handleMouseUp = (e: MouseEvent) => {
        mouseRef.current.isDown = false;
        if (mouseRef.current.dragId !== -1) {
            const b = bodiesRef.current.find(b => b.id === mouseRef.current.dragId);
            if (b) {
                b.isDragging = false;
                // Throwing physics
                b.vx = (e.clientX - mouseRef.current.lastX) * 0.2;
                b.vy = (e.clientY - mouseRef.current.lastY) * 0.2;
            }
            mouseRef.current.dragId = -1;
        }
        mouseRef.current.lastX = e.clientX;
        mouseRef.current.lastY = e.clientY;
    };

    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    init();
    requestRef.current = requestAnimationFrame(animate);

    const handleResize = () => {
      cancelAnimationFrame(requestRef.current);
      init();
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(requestRef.current);
    };
  }, [key]);

  return (
    <div className="relative w-full h-full cursor-grab active:cursor-grabbing bg-[#050505]">
      <canvas ref={canvasRef} className="block w-full h-full" />
      <button 
        onClick={handleRestart}
        className="absolute top-20 left-4 p-2 bg-white/10 rounded-full hover:bg-white/20 transition-colors shadow-sm text-white/50 hover:text-white z-10"
      >
        <RotateCcw size={20} />
      </button>
      
       <div className="absolute bottom-10 left-0 w-full text-center pointer-events-none">
        <h2 className="text-white/30 font-serif text-sm tracking-[0.5em] uppercase">
            CHASM / SPAGHETTIFICATION
        </h2>
      </div>
    </div>
  );
};

export default ChasmEffect;