import React, { useEffect, useRef, useState } from 'react';
import { RotateCcw } from 'lucide-react';
import { BloomParticle } from './types';
import { BLOOM_TEXT } from './constants';

const BloomEffect: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [key, setKey] = useState(0); 
  const requestRef = useRef<number>(0);
  
  const particlesRef = useRef<BloomParticle[]>([]);
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

      const particles: BloomParticle[] = [];
      const FONT_SIZE = 18;
      const LINE_HEIGHT = 32;
      
      ctx.font = `${FONT_SIZE}px "Times New Roman", serif`;
      
      const margin = Math.max(50, canvas.width * 0.15);
      const maxWidth = canvas.width - margin * 2;
      let cursorX = margin;
      let cursorY = canvas.height * 0.2;

      const words = BLOOM_TEXT.replace(/\n/g, ' \n ').split(' ');

      // Color Palette: Soft Pastels
      const hues = [340, 360, 20, 40, 260, 200]; // Pink, Red, Orange, Peach, Lavender, Sky
      
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
          
          const hue = hues[Math.floor(Math.random() * hues.length)];
          const sat = 70 + Math.random() * 30;
          const light = 70 + Math.random() * 20;

          particles.push({
            char,
            x: cursorX + charWidth/2,
            y: cursorY + LINE_HEIGHT/2,
            originX: cursorX + charWidth/2,
            originY: cursorY + LINE_HEIGHT/2,
            size: FONT_SIZE,
            baseColor: '#2a2a2a', // Dark charcoal default
            bloomColor: `hsl(${hue}, ${sat}%, ${light}%)`,
            rotation: 0,
            scale: 1,
            bloomState: 0,
            phase: Math.random() * Math.PI * 2
          });

          cursorX += charWidth;
        }
        cursorX += ctx.measureText(' ').width;
      }
      particlesRef.current = particles;
    };

    const animate = () => {
      // Soft Cream background
      ctx.fillStyle = '#fdfbf7'; 
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const mx = mouseRef.current.x;
      const my = mouseRef.current.y;
      const particles = particlesRef.current;
      
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      particles.forEach(p => {
         const dx = mx - p.originX;
         const dy = my - p.originY;
         const dist = Math.sqrt(dx*dx + dy*dy);
         const radius = 180;
         
         // Calculate Target State
         let targetState = 0;
         if (dist < radius) {
             targetState = 1 - (dist / radius);
             // Ease curve
             targetState = targetState * targetState * (3 - 2 * targetState); 
         }

         // Interpolate Bloom State
         p.bloomState += (targetState - p.bloomState) * 0.1;

         // Dynamic properties
         // Rotation: Gentle sway when blooming
         const targetRotation = p.bloomState * (Math.sin(Date.now() * 0.003 + p.phase) * 0.5 + 0.2);
         p.rotation += (targetRotation - p.rotation) * 0.1;
         
         // Scale: Grow when blooming
         const targetScale = 1 + p.bloomState * 1.5;
         p.scale += (targetScale - p.scale) * 0.1;

         // Position: Float slightly away from mouse like petals in breeze
         const floatX = p.bloomState * Math.cos(p.phase) * 10;
         const floatY = p.bloomState * Math.sin(p.phase) * 10;

         // Render
         ctx.save();
         ctx.translate(p.originX + floatX, p.originY + floatY);
         ctx.rotate(p.rotation);
         ctx.scale(p.scale, p.scale);
         
         ctx.font = `${p.size}px "Times New Roman", serif`;
         
         if (p.bloomState > 0.05) {
             ctx.fillStyle = p.bloomColor;
             // Add soft shadow/glow for bloom
             ctx.shadowColor = p.bloomColor;
             ctx.shadowBlur = p.bloomState * 15;
         } else {
             ctx.fillStyle = p.baseColor;
             ctx.shadowBlur = 0;
         }
         
         ctx.fillText(p.char, 0, 0);
         ctx.restore();
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
    <div className="relative w-full h-full cursor-none bg-[#fdfbf7]">
      <canvas ref={canvasRef} className="block w-full h-full" />
      <button 
        onClick={handleRestart}
        className="absolute top-20 left-4 p-2 bg-white/50 rounded-full hover:bg-white transition-colors shadow-sm text-gray-600 z-10"
      >
        <RotateCcw size={20} />
      </button>
      
       <div className="absolute bottom-10 left-0 w-full text-center pointer-events-none">
        <h2 className="text-gray-400 font-serif text-sm tracking-[0.5em] uppercase opacity-60">
            BLOOM / FLORAL
        </h2>
      </div>
    </div>
  );
};

export default BloomEffect;