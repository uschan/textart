import React, { useEffect, useRef, useState } from 'react';
import { RotateCcw } from 'lucide-react';
import { RigidBody } from './types';
import { GRAVITY_WORDS } from './constants';

const GravityEffect: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [key, setKey] = useState(0); 
  const requestRef = useRef<number>(0);
  
  const bodiesRef = useRef<RigidBody[]>([]);
  const mouseRef = useRef({ x: 0, y: 0, isDown: false, lastX: 0, lastY: 0 });

  const handleRestart = () => {
    setKey(prev => prev + 1);
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // --- Config ---
    const GRAVITY = 0.4;
    const FRICTION = 0.96;
    const BOUNCE = 0.5;
    const FLOOR_FRICTION = 0.9;

    const init = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;

      const bodies: RigidBody[] = [];
      
      GRAVITY_WORDS.forEach((word, i) => {
        ctx.font = 'bold 32px "Arial Black", sans-serif';
        const metrics = ctx.measureText(word);
        const width = metrics.width;
        const height = 30;

        bodies.push({
          id: i,
          text: word,
          x: Math.random() * (canvas.width - width),
          y: -Math.random() * 800 - 100, // Start high up
          angle: (Math.random() - 0.5) * 1,
          width,
          height,
          vx: (Math.random() - 0.5) * 2,
          vy: 0,
          angularVelocity: (Math.random() - 0.5) * 0.1,
          mass: width * 0.05,
          isDragging: false,
          color: '#1a1a1a'
        });
      });

      bodiesRef.current = bodies;
    };

    const resolveCollisions = () => {
        const bodies = bodiesRef.current;
        for (let i = 0; i < bodies.length; i++) {
            for (let j = i + 1; j < bodies.length; j++) {
                const b1 = bodies[i];
                const b2 = bodies[j];
                
                // Simple circle collision approx
                const r1 = b1.width / 2.2; // Slightly tighter bounds
                const r2 = b2.width / 2.2;
                const distSq = (b1.x - b2.x)**2 + (b1.y - b2.y)**2;
                const minDist = r1 + r2;
                
                if (distSq < minDist * minDist) {
                    const dist = Math.sqrt(distSq);
                    const overlap = minDist - dist;
                    const dx = (b1.x - b2.x) / (dist || 1);
                    const dy = (b1.y - b2.y) / (dist || 1);
                    
                    // Separate
                    const totalMass = b1.mass + b2.mass;
                    const m1Ratio = b2.mass / totalMass;
                    const m2Ratio = b1.mass / totalMass;

                    b1.x += dx * overlap * m1Ratio;
                    b1.y += dy * overlap * m1Ratio;
                    b2.x -= dx * overlap * m2Ratio;
                    b2.y -= dy * overlap * m2Ratio;
                    
                    // Bounce
                    const relativeVx = b1.vx - b2.vx;
                    const relativeVy = b1.vy - b2.vy;
                    const velAlongNormal = relativeVx * dx + relativeVy * dy;
                    
                    if (velAlongNormal < 0) {
                        const impulse = -(1 + 0.3) * velAlongNormal;
                        const jVal = impulse / (1/b1.mass + 1/b2.mass);
                        
                        b1.vx += jVal * dx / b1.mass;
                        b1.vy += jVal * dy / b1.mass;
                        b2.vx -= jVal * dx / b2.mass;
                        b2.vy -= jVal * dy / b2.mass;

                        // Add spin on collision
                        b1.angularVelocity += (Math.random()-0.5) * 0.05;
                        b2.angularVelocity += (Math.random()-0.5) * 0.05;
                    }
                }
            }
        }
    };

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#f5f5f5';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const bodies = bodiesRef.current;
      const isAttracting = mouseRef.current.isDown;
      const mx = mouseRef.current.x;
      const my = mouseRef.current.y;

      // Draw Gravity Well Indicator
      if (isAttracting) {
         ctx.beginPath();
         ctx.arc(mx, my, 20, 0, Math.PI*2);
         ctx.fillStyle = 'rgba(0,0,0,0.1)';
         ctx.fill();
         ctx.beginPath();
         ctx.arc(mx, my, 800, 0, Math.PI*2);
         const grad = ctx.createRadialGradient(mx, my, 20, mx, my, 400);
         grad.addColorStop(0, 'rgba(0,0,0,0.1)');
         grad.addColorStop(1, 'rgba(0,0,0,0)');
         ctx.fillStyle = grad;
         ctx.fill();
      }

      // Physics Loop
      resolveCollisions();

      bodies.forEach(b => {
        
        if (isAttracting) {
            // BLACK HOLE PHYSICS
            const dx = mx - b.x;
            const dy = my - b.y;
            const dist = Math.sqrt(dx*dx + dy*dy);
            
            // Strong pull
            const force = 300 / (dist + 10); // Inverse linear stronger than sq for gamefeel
            const angle = Math.atan2(dy, dx);
            
            b.vx += Math.cos(angle) * force;
            b.vy += Math.sin(angle) * force;
            
            // Damping (Drag) to prevent orbiting forever
            b.vx *= 0.90;
            b.vy *= 0.90;
            
            // Rotate towards center
            b.angularVelocity += (Math.random()-0.5) * 0.05;

        } else {
            // Normal Gravity
            b.vy += GRAVITY;
            b.vx *= FRICTION;
            b.vy *= FRICTION;
            b.angularVelocity *= 0.95;
        }

        b.x += b.vx;
        b.y += b.vy;
        b.angle += b.angularVelocity;

        // Floor collision
        const floorY = canvas.height - 40 - b.height/2;
        if (b.y > floorY) {
            b.y = floorY;
            b.vy *= -BOUNCE;
            b.vx *= FLOOR_FRICTION;
            
            if (Math.abs(b.vy) < GRAVITY) b.vy = 0;
        }
        
        // Wall collision
        if (b.x - b.width/2 < 0) {
            b.x = b.width/2;
            b.vx *= -BOUNCE;
        }
        if (b.x + b.width/2 > canvas.width) {
            b.x = canvas.width - b.width/2;
            b.vx *= -BOUNCE;
        }

        // Draw
        ctx.save();
        ctx.translate(b.x, b.y);
        ctx.rotate(b.angle);
        
        // Shadow
        ctx.fillStyle = 'rgba(0,0,0,0.15)';
        ctx.fillRect(-b.width/2 + 3, -b.height/2 + 3, b.width, b.height);
        
        // Text
        ctx.fillStyle = isAttracting ? '#000' : (Math.abs(b.vx)+Math.abs(b.vy) > 5 ? '#D92222' : b.color);
        ctx.font = 'bold 32px "Arial Black", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(b.text, 0, 0);
        
        ctx.restore();
      });

      // Floor
      ctx.fillStyle = '#111';
      ctx.fillRect(0, canvas.height - 40, canvas.width, 40);

      requestRef.current = requestAnimationFrame(animate);
    };

    const handleMouseDown = (e: MouseEvent) => {
        mouseRef.current.isDown = true;
        mouseRef.current.x = e.clientX;
        mouseRef.current.y = e.clientY;
    };

    const handleMouseMove = (e: MouseEvent) => {
        mouseRef.current.x = e.clientX;
        mouseRef.current.y = e.clientY;
    };

    const handleMouseUp = () => {
        mouseRef.current.isDown = false;
        
        // Explosion on release!
        const bodies = bodiesRef.current;
        const mx = mouseRef.current.x;
        const my = mouseRef.current.y;
        
        bodies.forEach(b => {
             const dx = b.x - mx;
             const dy = b.y - my;
             const dist = Math.sqrt(dx*dx + dy*dy);
             if (dist < 400) {
                 const force = (400 - dist) * 0.15;
                 const angle = Math.atan2(dy, dx);
                 b.vx += Math.cos(angle) * force;
                 b.vy += Math.sin(angle) * force;
                 b.angularVelocity += (Math.random()-0.5) * 1.0;
             }
        });
    };

    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('touchstart', () => mouseRef.current.isDown = true);
    window.addEventListener('touchend', handleMouseUp);
    
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
    <div className="relative w-full h-full cursor-crosshair">
      <canvas ref={canvasRef} className="block w-full h-full" />
      <button 
        onClick={handleRestart}
        className="absolute top-20 left-4 p-2 bg-white/80 rounded-full hover:bg-white transition-colors shadow-sm text-gray-600 hover:text-black z-10"
      >
        <RotateCcw size={20} />
      </button>
      
       <div className="absolute bottom-10 left-0 w-full text-center pointer-events-none">
        <h2 className="text-gray-400 font-serif text-sm tracking-[0.5em] uppercase opacity-60">
            GRAVITY / HOLD TO COLLAPSE
        </h2>
      </div>
    </div>
  );
};

export default GravityEffect;