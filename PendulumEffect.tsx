import React, { useEffect, useRef, useState } from 'react';
import { RotateCcw } from 'lucide-react';
import { Particle, RopeState, Point } from './types';
import { TEXT_CONTENT } from './constants';

const PendulumEffect: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [key, setKey] = useState(0); 

  const requestRef = useRef<number>(0);
  const particlesRef = useRef<Particle[]>([]);
  
  // The Rope (Pointer) State
  const ropeRef = useRef<RopeState>({
    points: [],
    angle: 0
  });

  const handleRestart = () => {
    setKey(prev => prev + 1);
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // --- Configuration ---
    const FONT_SIZE = 14;
    const LINE_HEIGHT = 20;
    const SEGMENT_COUNT = 25; // Smoother rope
    const SEGMENT_LENGTH = 20; 
    
    // Physics Config
    const INFLUENCE_RADIUS = 90; 
    const RETURN_STRENGTH = 0.03; // Slower return (harder to recall memory)
    const CHAOS_STRENGTH = 5.0;   
    const SWIRL_STRENGTH = 0.8;   
    const DRAG = 0.92;            

    // --- Initialization ---
    const init = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      
      const centerX = canvas.width / 2;
      
      const points: Point[] = [];
      for (let i = 0; i < SEGMENT_COUNT; i++) {
        points.push({
          x: centerX,
          y: i * SEGMENT_LENGTH - 100 
        });
      }
      ropeRef.current = {
        points,
        angle: 0
      };

      ctx.font = `${FONT_SIZE}px "Times New Roman", serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      const particles: Particle[] = [];
      const margin = Math.max(30, canvas.width * 0.1);
      const maxWidth = canvas.width - margin * 2;
      let cursorX = margin;
      let cursorY = canvas.height * 0.15;

      const words = TEXT_CONTENT.replace(/\n/g, ' \n ').split(' ');

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
            x: cursorX + charWidth/2,
            y: cursorY + LINE_HEIGHT/2,
            originX: cursorX + charWidth/2,
            originY: cursorY + LINE_HEIGHT/2,
            vx: 0,
            vy: 0,
            isActive: false,
            jitterPhase: Math.random() * Math.PI * 2
          });

          cursorX += charWidth + 1; 
        }
        cursorX += ctx.measureText(' ').width;
      }
      particlesRef.current = particles;
    };

    const distToSegmentSq = (p: {x: number, y: number}, v: Point, w: Point) => {
      const l2 = (w.x - v.x)**2 + (w.y - v.y)**2;
      if (l2 === 0) {
        return {
          distSq: (p.x - v.x)**2 + (p.y - v.y)**2,
          closeX: v.x,
          closeY: v.y
        };
      }
      let t = ((p.x - v.x) * (w.x - v.x) + (p.y - v.y) * (w.y - v.y)) / l2;
      t = Math.max(0, Math.min(1, t));
      const closeX = v.x + t * (w.x - v.x);
      const closeY = v.y + t * (w.y - v.y);
      return {
        distSq: (p.x - closeX)**2 + (p.y - closeY)**2,
        closeX,
        closeY
      };
    };

    let time = 0;
    const animate = () => {
      time += 0.015;
      
      // Trail effect for the whole screen (Ghosting)
      // Instead of clearing, we draw a transparent rect to create trails
      ctx.fillStyle = 'rgba(245, 245, 245, 0.35)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const rope = ropeRef.current;
      const pivotX = canvas.width / 2;
      const pivotY = -50; 
      
      // Complex pendulum motion
      const driveAngle = Math.sin(time * 1.2) * 1.3 + Math.cos(time * 0.5) * 0.6;
      
      rope.points[0].x = pivotX;
      rope.points[0].y = pivotY;

      for (let i = 1; i < SEGMENT_COUNT; i++) {
        const prev = rope.points[i-1];
        const curr = rope.points[i];
        
        const lagAngle = driveAngle - (i * 0.06 * Math.sin(time * 0.8)); 
        const targetX = prev.x + Math.sin(lagAngle) * SEGMENT_LENGTH;
        const targetY = prev.y + Math.cos(lagAngle) * SEGMENT_LENGTH;
        
        const stiffness = 0.3 - (i * 0.008); 
        curr.x += (targetX - curr.x) * stiffness;
        curr.y += (targetY - curr.y) * stiffness;
        
        curr.y += 1.5; // Gravity on rope
      }

      // Draw Rope (Glowing Light Beam style)
      ctx.save();
      ctx.shadowColor = 'rgba(200, 50, 50, 0.5)';
      ctx.shadowBlur = 15;
      ctx.beginPath();
      ctx.moveTo(rope.points[0].x, rope.points[0].y);
      for (let i = 1; i < SEGMENT_COUNT - 2; i++) {
        const xc = (rope.points[i].x + rope.points[i + 1].x) / 2;
        const yc = (rope.points[i].y + rope.points[i + 1].y) / 2;
        ctx.quadraticCurveTo(rope.points[i].x, rope.points[i].y, xc, yc);
      }
      if (SEGMENT_COUNT > 2) {
        ctx.quadraticCurveTo(
          rope.points[SEGMENT_COUNT-2].x, 
          rope.points[SEGMENT_COUNT-2].y, 
          rope.points[SEGMENT_COUNT-1].x, 
          rope.points[SEGMENT_COUNT-1].y
        );
      }
      
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.lineWidth = 2;
      // Gradient stroke
      const grad = ctx.createLinearGradient(pivotX, 0, rope.points[SEGMENT_COUNT-1].x, rope.points[SEGMENT_COUNT-1].y);
      grad.addColorStop(0, 'rgba(200, 200, 200, 0)');
      grad.addColorStop(0.5, 'rgba(217, 34, 34, 0.4)');
      grad.addColorStop(1, 'rgba(217, 34, 34, 0.8)');
      ctx.strokeStyle = grad;
      ctx.stroke();
      
      // Draw weight at end
      const tail = rope.points[SEGMENT_COUNT-1];
      ctx.fillStyle = '#D92222';
      ctx.beginPath();
      ctx.arc(tail.x, tail.y, 4, 0, Math.PI*2);
      ctx.fill();
      ctx.restore();

      const particles = particlesRef.current;
      
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        
        // --- Collision Detection with Rope ---
        let minDistSq = Infinity;
        let closestX = p.x;
        let closestY = p.y;
        
        // Optimization: only check segments near the particle vertically
        // Simplified check against every 2nd segment
        for (let j = 0; j < SEGMENT_COUNT - 1; j+=1) {
           // Quick bounding box check
           const p1 = rope.points[j];
           const p2 = rope.points[j+1];
           if (p.y < Math.min(p1.y, p2.y) - 50 || p.y > Math.max(p1.y, p2.y) + 50) continue;

           const res = distToSegmentSq(p, p1, p2);
           if (res.distSq < minDistSq) {
             minDistSq = res.distSq;
             closestX = res.closeX;
             closestY = res.closeY;
           }
        }

        const isClose = minDistSq < INFLUENCE_RADIUS * INFLUENCE_RADIUS;

        if (isClose) {
          p.isActive = true;
          
          const dx = closestX - p.x;
          const dy = closestY - p.y;
          const dist = Math.sqrt(minDistSq);
          const ndx = dx / (dist || 1);
          const ndy = dy / (dist || 1);

          // Vortex force + Push force
          p.vx += -ndy * SWIRL_STRENGTH;
          p.vy += ndx * SWIRL_STRENGTH;

          // Repulsion
          const push = (1 - dist/INFLUENCE_RADIUS) * 0.8;
          p.vx -= ndx * push;
          p.vy -= ndy * push;

          // Chaos
          p.vx += (Math.random() - 0.5) * CHAOS_STRENGTH * push;
          p.vy += (Math.random() - 0.5) * CHAOS_STRENGTH * push;

        } else {
          p.isActive = false;
          
          // Slow return to origin
          const dx = p.originX - p.x;
          const dy = p.originY - p.y;
          
          // Nonlinear return strength: slower when far, snaps when close
          const distToOrigin = Math.sqrt(dx*dx + dy*dy);
          const force = Math.min(RETURN_STRENGTH, distToOrigin * 0.001);

          p.vx += dx * force;
          p.vy += dy * force;
        }

        p.vx *= DRAG;
        p.vy *= DRAG;
        
        p.x += p.vx;
        p.y += p.vy;

        // Render
        const speed = Math.abs(p.vx) + Math.abs(p.vy);
        const displacement = Math.abs(p.x - p.originX) + Math.abs(p.y - p.originY);
        
        if (displacement > 1) {
            // Fade out when moving fast or far
            const alpha = Math.max(0.3, 1 - speed * 0.1);
            ctx.fillStyle = `rgba(0, 0, 0, ${alpha})`;
            
            // Subtle blur if moving fast
            if (speed > 3) {
                ctx.save();
                ctx.shadowColor = 'rgba(0,0,0,0.2)';
                ctx.shadowBlur = 2;
                ctx.fillText(p.char, p.x, p.y);
                ctx.restore();
            } else {
                ctx.fillText(p.char, p.x, p.y);
            }
        } else {
            ctx.fillStyle = 'black';
            ctx.fillText(p.char, p.x, p.y);
        }
      }
      
      requestRef.current = requestAnimationFrame(animate);
    };

    init();
    requestRef.current = requestAnimationFrame(animate);

    const handleResize = () => {
      cancelAnimationFrame(requestRef.current!);
      init();
    };
    
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(requestRef.current!);
    };
  }, [key]);

  return (
    <div className="relative w-full h-full">
      <canvas ref={canvasRef} className="block w-full h-full" />
      <button 
        onClick={handleRestart}
        className="absolute top-20 left-4 p-2 bg-white/80 rounded-full hover:bg-white transition-colors shadow-sm text-gray-600 hover:text-red-600 z-10"
      >
        <RotateCcw size={20} />
      </button>
      <div className="absolute bottom-10 left-0 w-full text-center pointer-events-none">
        <h2 className="text-gray-400 font-serif text-sm tracking-[0.5em] uppercase opacity-40">
            IMPRESSION / MEMORY ECHO
        </h2>
      </div>
    </div>
  );
};

export default PendulumEffect;