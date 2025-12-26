import React, { useEffect, useRef, useState } from 'react';
import { RotateCcw } from 'lucide-react';
import { NoteParticle, WaveWire, WavePoint } from './types';
import { SYNTAX_TEXT } from './constants';

const SyntaxFreedomEffect: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [key, setKey] = useState(0); 
  const requestRef = useRef<number>(0);
  
  // Previous mouse position to calculate velocity
  const mouseRef = useRef({ x: -1000, y: -1000, vx: 0, vy: 0 });
  
  const stateRef = useRef<{
    wires: WaveWire[];
    particles: NoteParticle[];
  }>({ wires: [], particles: [] });

  const handleRestart = () => {
    setKey(prev => prev + 1);
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // --- Config ---
    const BLUE_RECT_COLOR = '#89CFF0'; 
    const WIRE_COUNT = 5;
    const WIRE_SPACING = 80;
    const POINTS_PER_WIRE = 40; // Resolution of simulation
    
    const init = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;

      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      
      // Rect dimensions
      const rectWidth = Math.min(600, canvas.width * 0.85);
      const startY = centerY - (WIRE_COUNT * WIRE_SPACING) / 2 + 50;
      const startX = centerX - rectWidth / 2 - 50; // Extend slightly beyond rect
      const endX = centerX + rectWidth / 2 + 50;
      const wireWidth = endX - startX;

      // 1. Create Wires (Wave Simulation)
      const wires: WaveWire[] = [];
      for (let i = 0; i < WIRE_COUNT; i++) {
        const points: WavePoint[] = [];
        for (let j = 0; j <= POINTS_PER_WIRE; j++) {
           const x = startX + (j / POINTS_PER_WIRE) * wireWidth;
           const y = startY + i * WIRE_SPACING;
           points.push({
             x,
             y,
             dy: 0,
             vel: 0,
             force: 0
           });
        }

        wires.push({
          points,
          y: startY + i * WIRE_SPACING,
          tension: 0.1, // Elasticity
          damping: 0.94, // How fast waves die out
          color: '#333'
        });
      }

      // 2. Create Particles
      const particles: NoteParticle[] = [];
      const words = SYNTAX_TEXT.split(' ');
      
      let wireIdx = 0;
      let t = 0.05; 
      
      ctx.font = '16px "Courier New", monospace';

      for (let word of words) {
        const wordWidthEstimate = word.length * 0.02; 
        
        if (t + wordWidthEstimate > 0.95) {
          wireIdx = (wireIdx + 1) % WIRE_COUNT;
          t = 0.05;
        }

        for (let char of word) {
           particles.push({
             char,
             wireIndex: wireIdx,
             t: t,
             x: 0, y: 0, vx: 0, vy: 0,
             angle: 0,
             floating: false,
             opacity: 1
           });
           t += 0.015; 
        }
        t += 0.02; 
      }

      stateRef.current = { wires, particles };
    };

    const animate = () => {
      const { wires, particles } = stateRef.current;
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      const rectWidth = Math.min(500, canvas.width * 0.8);
      const rectHeight = Math.min(700, canvas.height * 0.8);
      const rectX = centerX - rectWidth / 2;
      const rectY = centerY - rectHeight / 2;

      // --- Background ---
      ctx.fillStyle = '#f5f5f5';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Shadow
      ctx.fillStyle = 'rgba(0,0,0,0.05)';
      ctx.fillRect(rectX + 20, rectY + 20, rectWidth, rectHeight);

      // Poster
      ctx.fillStyle = '#89CFF0';
      ctx.fillRect(rectX, rectY, rectWidth, rectHeight);
      
      // Text Elements
      ctx.save();
      ctx.fillStyle = '#222';
      ctx.font = 'bold 36px "Courier New", monospace';
      ctx.fillText("SYNTAX", rectX + 30, rectY + rectHeight - 100);
      ctx.font = '36px "Courier New", monospace';
      ctx.fillText("OF", rectX + 30, rectY + rectHeight - 60);
      ctx.font = 'bold 36px "Courier New", monospace';
      ctx.fillText("FREEDOM", rectX + 30, rectY + rectHeight - 20);
      ctx.restore();

      // --- Physics: Wave Simulation ---
      const mouseX = mouseRef.current.x;
      const mouseY = mouseRef.current.y;
      const mouseVy = mouseRef.current.vy;

      wires.forEach(wire => {
         // A. Propagation
         for (let i = 1; i < wire.points.length - 1; i++) {
            const p = wire.points[i];
            const prev = wire.points[i-1];
            const next = wire.points[i+1];

            // 1D Wave equation force: k * (neighbors - 2*current)
            const force = wire.tension * (prev.dy + next.dy - 2 * p.dy);
            p.vel += force;
            p.vel *= wire.damping;
            p.dy += p.vel;
         }

         // B. Mouse Interaction (Plucking)
         for (let i = 1; i < wire.points.length - 1; i++) {
           const p = wire.points[i];
           const dx = p.x - mouseX;
           const dy = (p.y + p.dy) - mouseY;
           const dist = Math.sqrt(dx*dx + dy*dy);
           
           if (dist < 40) {
             // Impart velocity based on mouse speed
             // Push away from mouse vertically
             const pushForce = Math.abs(mouseVy) * 0.5 + 2; 
             const direction = dy > 0 ? 1 : -1; // Push in direction of offset
             p.vel += direction * pushForce * 0.2;
             
             // Dampen interaction to avoid infinite energy
             p.dy += direction * 2;
           }
         }
         
         // Fix endpoints
         wire.points[0].dy = 0;
         wire.points[wire.points.length-1].dy = 0;
      });

      // --- Draw Wires ---
      ctx.beginPath();
      ctx.strokeStyle = '#333';
      ctx.lineWidth = 1.5;

      wires.forEach(wire => {
         const pts = wire.points;
         ctx.moveTo(pts[0].x, pts[0].y + pts[0].dy);
         for (let i = 1; i < pts.length - 2; i++) {
           const xc = (pts[i].x + pts[i+1].x) / 2;
           const yc = (pts[i].y + pts[i].dy + pts[i+1].y + pts[i+1].dy) / 2;
           ctx.quadraticCurveTo(pts[i].x, pts[i].y + pts[i].dy, xc, yc);
         }
         // Last segments
         const last = pts[pts.length-1];
         const secondLast = pts[pts.length-2];
         ctx.quadraticCurveTo(secondLast.x, secondLast.y + secondLast.dy, last.x, last.y + last.dy);
      });
      ctx.stroke();

      // --- Particles Logic ---
      ctx.font = '16px "Courier New", monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = '#111';

      particles.forEach(p => {
        const wire = wires[p.wireIndex];
        const pts = wire.points;
        const totalPts = pts.length - 1;
        
        // Find exact position on wire spline
        const floatIdx = p.t * totalPts;
        const idx = Math.floor(floatIdx);
        const subT = floatIdx - idx;
        
        // Interpolate for smooth position
        const p1 = pts[idx];
        const p2 = pts[Math.min(idx+1, totalPts)];
        
        const wireX = p1.x + (p2.x - p1.x) * subT;
        const wireY = (p1.y + p1.dy) * (1 - subT) + (p2.y + p2.dy) * subT;
        
        // Calculate Slope for rotation
        const dx = p2.x - p1.x;
        const dy = (p2.y + p2.dy) - (p1.y + p1.dy);
        const wireAngle = Math.atan2(dy, dx);
        
        // Calculate Velocity of the wire point (how fast is it vibrating?)
        const wireVel = p1.vel * (1 - subT) + p2.vel * subT;

        if (!p.floating) {
          p.x = wireX;
          p.y = wireY;
          p.angle = wireAngle;
          
          // Trigger Release: High velocity vibration
          if (Math.abs(wireVel) > 4.0) {
             p.floating = true;
             p.vx = (Math.random() - 0.5) * 5;
             p.vy = wireVel * 1.5; // Launch with wire momentum
             p.angle += (Math.random() - 0.5);
          }
        } else {
          // Flock / Flight physics
          p.x += p.vx;
          p.y += p.vy;
          p.vy += 0.15; // Gravity
          p.vx *= 0.99; // Air drag
          p.angle += p.vx * 0.05; // Rotate with horizontal motion
          
          // Return force (Magnetism)
          const dxHome = wireX - p.x;
          const dyHome = wireY - p.y;
          
          p.vx += dxHome * 0.005;
          p.vy += dyHome * 0.005;
          
          // Re-attach if close and slow
          const distSq = dxHome*dxHome + dyHome*dyHome;
          if (distSq < 100 && Math.abs(p.vy) < 2) {
            p.floating = false;
          }
        }

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.angle);
        ctx.fillText(p.char, 0, 0);
        ctx.restore();
      });

      requestRef.current = requestAnimationFrame(animate);
    };

    const handleMouseMove = (e: MouseEvent) => {
      // Calculate simple velocity of mouse
      const vx = e.clientX - mouseRef.current.x;
      const vy = e.clientY - mouseRef.current.y;
      
      // Update ref
      mouseRef.current = { x: e.clientX, y: e.clientY, vx, vy };
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
    <div className="relative w-full h-full cursor-grab active:cursor-grabbing">
      <canvas ref={canvasRef} className="block w-full h-full" />
      <button 
        onClick={handleRestart}
        className="absolute top-20 left-4 p-2 bg-white/80 rounded-full hover:bg-white transition-colors shadow-sm text-gray-600 hover:text-blue-500 z-10"
      >
        <RotateCcw size={20} />
      </button>
    </div>
  );
};

export default SyntaxFreedomEffect;