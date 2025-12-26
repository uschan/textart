import React, { useEffect, useRef, useState } from 'react';
import { RotateCcw } from 'lucide-react';
import { RIPPLE_TEXT } from './constants';

const RippleEffect: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [key, setKey] = useState(0); 
  const requestRef = useRef<number>(0);
  
  const colsRef = useRef<number>(0);
  const rowsRef = useRef<number>(0);
  const currentBufferRef = useRef<Float32Array>(new Float32Array(0));
  const prevBufferRef = useRef<Float32Array>(new Float32Array(0));
  const damping = 0.97; // Higher damping for smoother liquid

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
      
      const res = 12; // slightly clearer resolution
      colsRef.current = Math.ceil(canvas.width / res);
      rowsRef.current = Math.ceil(canvas.height / res);
      
      const size = colsRef.current * rowsRef.current;
      currentBufferRef.current = new Float32Array(size);
      prevBufferRef.current = new Float32Array(size);
    };

    const processRipples = () => {
       const cols = colsRef.current;
       const rows = rowsRef.current;
       const current = currentBufferRef.current;
       const prev = prevBufferRef.current;

       for (let i = 1; i < cols - 1; i++) {
         for (let j = 1; j < rows - 1; j++) {
           const idx = j * cols + i;
           current[idx] = (
             prev[idx - 1] + 
             prev[idx + 1] + 
             prev[idx - cols] + 
             prev[idx + cols]
           ) / 2 - current[idx];
           
           current[idx] *= damping;
         }
       }
       
       const temp = prevBufferRef.current;
       prevBufferRef.current = currentBufferRef.current;
       currentBufferRef.current = temp;
    };

    const draw = () => {
       processRipples();
       
       const cols = colsRef.current;
       const current = currentBufferRef.current;
       
       ctx.fillStyle = '#f5f5f5';
       ctx.fillRect(0, 0, canvas.width, canvas.height);
       
       // Prepare text
       const text = RIPPLE_TEXT;
       // Large bold serif for maximum distortion visibility
       const fontSize = Math.min(60, window.innerWidth / 15);
       ctx.font = `bold ${fontSize}px "Times New Roman", serif`;
       ctx.textAlign = 'center';
       ctx.textBaseline = 'middle';
       
       // Word Wrapping
       const maxW = canvas.width * 0.7;
       const words = text.split(' ');
       let line = '';
       const lines: string[] = [];
       
       for(let w of words) {
         const test = line + w + ' ';
         if (ctx.measureText(test).width > maxW) {
             lines.push(line);
             line = w + ' ';
         } else {
             line = test;
         }
       }
       lines.push(line);
       
       const startY = canvas.height/2 - (lines.length * fontSize * 0.8);

       // Render Chromatic Aberration (RGB Split)
       // We render 3 passes: Red, Green, Blue
       // Each pass has a slightly different offset based on the ripple height
       
       const channels = [
           { color: 'rgba(255, 0, 0, 0.5)', offsetMult: 0.15 }, // Red moves most
           { color: 'rgba(0, 255, 0, 0.5)', offsetMult: 0.10 }, // Green mid
           { color: 'rgba(0, 0, 255, 0.5)', offsetMult: 0.05 }, // Blue least
       ];

       // Optimization: Only iterate characters, not pixels.
       lines.forEach((l, lIdx) => {
          const lineWidth = ctx.measureText(l).width;
          let curX = canvas.width/2 - lineWidth/2;
          const curY = startY + lIdx * (fontSize * 1.2);
          
          for(let char of l) {
              const cx = Math.floor(curX / 12);
              const cy = Math.floor(curY / 12);
              const idx = cy * cols + cx;
              
              let h = 0;
              if (idx >= 0 && idx < current.length) {
                  h = current[idx];
              }
              
              // Only distort if there is a ripple
              if (Math.abs(h) > 0.1) {
                  // Draw 3 channels
                  channels.forEach(ch => {
                      const offX = h * ch.offsetMult;
                      const offY = h * ch.offsetMult;
                      
                      ctx.save();
                      ctx.translate(curX + offX, curY + offY);
                      // Slight refraction scaling
                      const scale = 1 + h * 0.002;
                      ctx.scale(scale, scale);
                      ctx.fillStyle = ch.color;
                      // Composite Multiply/Darken makes RGB overlap nicely? 
                      // 'multiply' is good for ink on paper.
                      // 'screen' or 'lighter' is good for light on dark.
                      // Since we are black on white, let's just use alpha blending or 'multiply'
                      ctx.globalCompositeOperation = 'multiply';
                      ctx.fillText(char, 0, 0);
                      ctx.restore();
                  });
              } else {
                  // Draw normal black text if still
                  ctx.save();
                  ctx.translate(curX, curY);
                  ctx.fillStyle = 'black';
                  ctx.fillText(char, 0, 0);
                  ctx.restore();
              }
              
              curX += ctx.measureText(char).width;
          }
       });
       
       // Reset composite
       ctx.globalCompositeOperation = 'source-over';
       
       requestRef.current = requestAnimationFrame(draw);
    };

    const handleMouseMove = (e: MouseEvent) => {
        const x = Math.floor(e.clientX / 12);
        const y = Math.floor(e.clientY / 12);
        const cols = colsRef.current;
        const index = y * cols + x;
        
        // Add a "splash" area
        const r = 2;
        for(let dy=-r; dy<=r; dy++) {
            for(let dx=-r; dx<=r; dx++) {
                const idx = (y+dy)*cols + (x+dx);
                if (idx >= 0 && idx < prevBufferRef.current.length) {
                     prevBufferRef.current[idx] = 400; // Stronger impulse
                }
            }
        }
    };

    window.addEventListener('mousemove', handleMouseMove);
    init();
    requestRef.current = requestAnimationFrame(draw);

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
        className="absolute top-20 left-4 p-2 bg-white/80 rounded-full hover:bg-white transition-colors shadow-sm text-gray-600 hover:text-blue-500 z-10"
      >
        <RotateCcw size={20} />
      </button>
      
       <div className="absolute bottom-10 left-0 w-full text-center pointer-events-none">
        <h2 className="text-gray-400 font-serif text-sm tracking-[0.5em] uppercase opacity-60">
            REFLECTION / CHROMATIC
        </h2>
      </div>
    </div>
  );
};

export default RippleEffect;