import React, { useEffect, useRef, useState } from 'react';
import { RotateCcw } from 'lucide-react';
import { FlowParticle } from './types';
import { TEXT_CONTENT } from './constants';

type AnimationPhase = 'IDLE' | 'CHAOS' | 'ASSEMBLING' | 'REVEAL' | 'RETURNING';

const EntropyEffect: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [key, setKey] = useState(0); 
  const requestRef = useRef<number>(0);
  
  // State refs
  const mouseRef = useRef({ x: -1000, y: -1000 });
  const particlesRef = useRef<FlowParticle[]>([]);
  const phaseRef = useRef<AnimationPhase>('IDLE');
  const lastInteractionRef = useRef<number>(0);
  const stateTimerRef = useRef<number>(0);
  
  // State for UI label
  const [phaseLabel, setPhaseLabel] = useState<string>('Order');

  const handleRestart = () => {
    setKey(prev => prev + 1);
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // --- Configuration ---
    const NOISE_SCALE = 0.003; 
    const FONT_SIZE = 12;
    
    // --- Helper: Pseudo Noise for Flow Field ---
    const getFlowVector = (x: number, y: number, time: number) => {
      const angle = (Math.sin(x * NOISE_SCALE) + Math.cos(y * NOISE_SCALE) + time * 0.5) * Math.PI * 2;
      return {
        x: Math.cos(angle),
        y: Math.sin(angle)
      };
    };

    // --- Helper: Generate targets for "IRREVERSIBLE" ---
    const generateMessagePoints = (width: number, height: number, count: number) => {
      // Create temp canvas
      const tmpCanvas = document.createElement('canvas');
      tmpCanvas.width = width;
      tmpCanvas.height = height;
      const tCtx = tmpCanvas.getContext('2d');
      if (!tCtx) return [];

      tCtx.fillStyle = 'black';
      tCtx.font = 'bold 120px "Arial Black", Gadget, sans-serif'; // Big bold font
      tCtx.textAlign = 'center';
      tCtx.textBaseline = 'middle';
      
      const text = "IRREVERSIBLE";
      tCtx.fillText(text, width / 2, height / 2);

      // Get pixels
      const imageData = tCtx.getImageData(0, 0, width, height);
      const data = imageData.data;
      const points: {x: number, y: number}[] = [];
      
      // Sampling step (optimize performance)
      const step = 4; 
      
      for (let y = 0; y < height; y += step) {
        for (let x = 0; x < width; x += step) {
          const index = (y * width + x) * 4;
          if (data[index + 3] > 128) { // If pixel is not transparent
            points.push({ x, y });
          }
        }
      }
      
      // Shuffle points to distribute randomly
      for (let i = points.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [points[i], points[j]] = [points[j], points[i]];
      }
      
      return points;
    };

    const init = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      
      const particles: FlowParticle[] = [];
      
      // 1. Layout Paragraph Text
      ctx.font = `${FONT_SIZE}px "Times New Roman", serif`;
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';
      
      const margin = Math.max(40, canvas.width * 0.15);
      const maxWidth = canvas.width - margin * 2;
      let cursorX = margin;
      let cursorY = canvas.height * 0.15;
      const lineHeight = FONT_SIZE * 1.6;

      const paragraphs = TEXT_CONTENT.split('\n\n');

      paragraphs.forEach(para => {
        const words = para.replace(/\n/g, ' ').split(' ');
        
        words.forEach(word => {
          const wordWidth = ctx.measureText(word + ' ').width;
          if (cursorX + wordWidth > margin + maxWidth) {
            cursorX = margin;
            cursorY += lineHeight;
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
              energy: 0, 
              friction: 0.90 + Math.random() * 0.06,
              size: FONT_SIZE
            });
            cursorX += charWidth;
          }
          cursorX += ctx.measureText(' ').width;
        });
        
        cursorX = margin;
        cursorY += lineHeight * 1.5;
      });

      // 2. Generate Message Targets
      const messagePoints = generateMessagePoints(canvas.width, canvas.height, particles.length);
      
      // Assign targets to particles
      particles.forEach((p, i) => {
        const target = messagePoints[i % messagePoints.length];
        if (target) {
          p.messageX = target.x;
          p.messageY = target.y;
        } else {
          // Fallback center cluster if sparse
          p.messageX = canvas.width / 2 + (Math.random() - 0.5) * 200;
          p.messageY = canvas.height / 2 + (Math.random() - 0.5) * 100;
        }
      });

      particlesRef.current = particles;
      phaseRef.current = 'IDLE';
      setPhaseLabel('Order');
    };

    let time = 0;
    
    const animate = () => {
      time += 0.005;
      const now = Date.now();
      
      // Clear canvas
      const currentPhase = phaseRef.current;
      if (currentPhase === 'CHAOS') {
        ctx.fillStyle = 'rgba(245, 245, 245, 0.3)';
      } else {
        ctx.fillStyle = 'rgba(245, 245, 245, 0.6)';
      }
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      const particles = particlesRef.current;
      const mx = mouseRef.current.x;
      const my = mouseRef.current.y;
      
      // --- Phase Transition Logic ---
      const timeSinceInteract = now - lastInteractionRef.current;
      
      if (currentPhase === 'IDLE') {
        // Interaction handled in mouse move listener
      } else if (currentPhase === 'CHAOS') {
         // If no interaction for 1.2s, start assembling message
         if (timeSinceInteract > 1200) {
            phaseRef.current = 'ASSEMBLING';
            setPhaseLabel('Convergence');
         }
      } else if (currentPhase === 'ASSEMBLING') {
         // Count how many particles are close to target
         let closeCount = 0;
         let totalDist = 0;
         particles.forEach(p => {
           const dx = (p.messageX || 0) - p.x;
           const dy = (p.messageY || 0) - p.y;
           const d = dx*dx + dy*dy;
           if (d < 100) closeCount++;
           totalDist += d;
         });
         
         // Trigger reveal when mostly assembled
         if (closeCount > particles.length * 0.8) {
           phaseRef.current = 'REVEAL';
           setPhaseLabel('Truth');
           stateTimerRef.current = now; 
         }
      } else if (currentPhase === 'REVEAL') {
         // Hold for 3.5 seconds
         if (now - stateTimerRef.current > 3500) {
           phaseRef.current = 'RETURNING';
           setPhaseLabel('Acceptance');
         }
      } else if (currentPhase === 'RETURNING') {
         // When mostly returned, go IDLE
         let closeCount = 0;
         particles.forEach(p => {
           const dx = p.originX - p.x;
           const dy = p.originY - p.y;
           if (dx*dx + dy*dy < 25) closeCount++;
         });
         if (closeCount > particles.length * 0.95) {
           phaseRef.current = 'IDLE';
           setPhaseLabel('Order');
         }
      }

      ctx.fillStyle = 'black';
      ctx.font = `${FONT_SIZE}px "Times New Roman", serif`;

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        
        // --- Physics per Phase ---
        
        if (currentPhase === 'CHAOS') {
          // 1. Mouse repulsion
          const dx = mx - p.x;
          const dy = my - p.y;
          const distSq = dx*dx + dy*dy;
          const interactionRadius = 120;
          
          if (distSq < interactionRadius * interactionRadius) {
             const dist = Math.sqrt(distSq);
             const force = (1 - dist / interactionRadius);
             p.vx -= (dx / dist) * force * 3;
             p.vy -= (dy / dist) * force * 3;
             p.energy = Math.min(p.energy + 0.2, 1.0);
          }

          // 2. Flow Field (Entropy)
          const flow = getFlowVector(p.x, p.y, time);
          const flowStrength = 0.5 + p.energy * 2; 
          
          p.vx += flow.x * flowStrength * 0.1;
          p.vy += flow.y * flowStrength * 0.1;
          
          p.energy *= 0.99; // Decay energy

        } else if (currentPhase === 'ASSEMBLING') {
           // Move swiftly towards message
           const tx = p.messageX || p.originX;
           const ty = p.messageY || p.originY;
           const dx = tx - p.x;
           const dy = ty - p.y;
           
           p.vx += dx * 0.035;
           p.vy += dy * 0.035;
           
           // Swarm noise
           p.vx += (Math.random() - 0.5) * 0.5;
           p.vy += (Math.random() - 0.5) * 0.5;

        } else if (currentPhase === 'REVEAL') {
           // Hold shape tightly
           const tx = p.messageX || p.originX;
           const ty = p.messageY || p.originY;
           const dx = tx - p.x;
           const dy = ty - p.y;
           
           // Stiff spring to hold shape
           p.vx += dx * 0.15;
           p.vy += dy * 0.15;
           
           // Minimal jitter
           p.vx += (Math.random() - 0.5) * 0.1;
           p.vy += (Math.random() - 0.5) * 0.1;

        } else if (currentPhase === 'RETURNING') {
           // Drift back home slowly
           const dx = p.originX - p.x;
           const dy = p.originY - p.y;
           
           p.vx += dx * 0.012;
           p.vy += dy * 0.012;
           
           // Heavy drag
           p.vx *= 0.85; 
           p.vy *= 0.85;

        } else if (currentPhase === 'IDLE') {
           // Stay put with slight organic breathing
           const dx = p.originX - p.x;
           const dy = p.originY - p.y;
           p.vx += dx * 0.1;
           p.vy += dy * 0.1;
           p.vx *= 0.8;
           p.vy *= 0.8;
        }

        // Apply Friction/Damping
        if (currentPhase === 'ASSEMBLING' || currentPhase === 'REVEAL') {
             p.vx *= 0.82; // Heavy damping for control
             p.vy *= 0.82;
        } else {
             p.vx *= p.friction;
             p.vy *= p.friction;
        }
        
        p.x += p.vx;
        p.y += p.vy;

        // Render
        const speed = Math.abs(p.vx) + Math.abs(p.vy);
        
        if (currentPhase === 'REVEAL') {
             // Make text solid black for readability
             ctx.fillStyle = 'black';
             ctx.fillText(p.char, p.x, p.y);
        } else {
             const alpha = Math.max(0.4, 1 - speed * 0.1);
             if (speed > 2) {
                 ctx.fillStyle = `rgba(0, 0, 0, ${alpha})`;
                 ctx.fillText(p.char, p.x, p.y);
                 ctx.fillStyle = 'black';
             } else {
                 ctx.fillText(p.char, p.x, p.y);
             }
        }
      }

      requestRef.current = requestAnimationFrame(animate);
    };

    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current = { x: e.clientX, y: e.clientY };
      lastInteractionRef.current = Date.now();
      
      // Only transition to CHAOS if we are in a resting state
      // If we are assembling or revealing, don't interrupt the "Truth"
      if (phaseRef.current === 'IDLE' || phaseRef.current === 'RETURNING') {
        phaseRef.current = 'CHAOS';
        setPhaseLabel('Disorder');
      }
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
        className="absolute top-20 left-4 p-2 bg-white/80 rounded-full hover:bg-white transition-colors shadow-sm text-gray-600 hover:text-black z-10"
      >
        <RotateCcw size={20} />
      </button>

      {/* Dynamic Title */}
       <div className="absolute bottom-10 left-0 w-full text-center pointer-events-none transition-opacity duration-1000">
        <h2 className="text-gray-400 font-serif text-sm tracking-[0.5em] uppercase opacity-60">
            Entropy / {phaseLabel}
        </h2>
      </div>
    </div>
  );
};

export default EntropyEffect;