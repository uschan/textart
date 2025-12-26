import React, { useEffect, useRef, useState } from 'react';
import { RotateCcw } from 'lucide-react';
import { TreeNode, TreeSpring, SnowParticle } from './types';
import { CHRISTMAS_TEXT } from './constants';

const ChristmasTreeEffect: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [key, setKey] = useState(0); 
  
  const requestRef = useRef<number>(0);
  const stateRef = useRef<{
    nodes: TreeNode[];
    springs: TreeSpring[];
    snow: SnowParticle[];
  }>({ nodes: [], springs: [], snow: [] });

  const mouseRef = useRef({ x: -1000, y: -1000 });

  const handleRestart = () => {
    setKey(prev => prev + 1);
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // --- Configuration ---
    const LAYERS = 14;
    const TOP_MARGIN = 80;
    const SPREAD_FACTOR = 35; 
    const LAYER_HEIGHT = 45;
    
    // Physics
    const GRAVITY = 0.5;
    const FRICTION = 0.96;
    const GROUND_REPULSION = 0.8;
    
    // --- Initialization ---
    const init = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      
      const centerX = canvas.width / 2;
      const nodes: TreeNode[] = [];
      const springs: TreeSpring[] = [];
      let globalIndex = 0;

      // 1. Build Nodes (Verlet Physics)
      for (let layer = 0; layer < LAYERS; layer++) {
        const count = layer + 1;
        const layerWidth = count * SPREAD_FACTOR;
        const startX = centerX - (layerWidth / 2) + (SPREAD_FACTOR / 2);

        for (let i = 0; i < count; i++) {
          const x = startX + i * SPREAD_FACTOR;
          const y = TOP_MARGIN + layer * LAYER_HEIGHT;
          
          // The top node is fixed
          const isFixed = layer === 0;

          nodes.push({
            x, y,
            oldX: x + (Math.random() - 0.5) * 5, // Give initial velocity
            oldY: y,
            mass: 1.0,
            isFixed,
            layer,
            text: CHRISTMAS_TEXT[Math.floor(Math.random() * CHRISTMAS_TEXT.length)],
            connections: []
          });

          // 2. Build Springs (Connections)
          if (layer > 0) {
            const prevLayerCount = layer;
            const prevLayerStartIndex = globalIndex - prevLayerCount;
            
            // Connect to "parents"
            const ratio = i / (count - 1 || 1);
            const parentIndexRelative = Math.round(ratio * (prevLayerCount - 1));
            const parentIndex = prevLayerStartIndex + parentIndexRelative;
            
            // Primary parent
            if (parentIndex >= 0 && parentIndex < globalIndex) {
               addSpring(globalIndex, parentIndex, springs, nodes);
            }
            // Cross-bracing for stability (connect to parent's neighbor)
            // Left parent neighbor
             if (parentIndex - 1 >= prevLayerStartIndex) {
                addSpring(globalIndex, parentIndex - 1, springs, nodes);
             }
             // Right parent neighbor
             if (parentIndex + 1 < globalIndex && parentIndex + 1 >= prevLayerStartIndex) {
                addSpring(globalIndex, parentIndex + 1, springs, nodes);
             }
          }

          // Horizontal structural springs (connect to neighbor in same layer)
          if (i > 0) {
            addSpring(globalIndex, globalIndex - 1, springs, nodes);
          }

          globalIndex++;
        }
      }

      // 3. Init Snow
      const snow: SnowParticle[] = [];
      for(let i=0; i<100; i++) {
        snow.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          vx: (Math.random() - 0.5) * 1,
          vy: 1 + Math.random() * 2,
          size: Math.random() * 3,
          opacity: Math.random()
        });
      }

      stateRef.current = { nodes, springs, snow };
    };

    const addSpring = (idxA: number, idxB: number, springs: TreeSpring[], nodes: TreeNode[]) => {
       const dx = nodes[idxA].x - nodes[idxB].x;
       const dy = nodes[idxA].y - nodes[idxB].y;
       const dist = Math.sqrt(dx*dx + dy*dy);
       springs.push({
         a: idxA,
         b: idxB,
         restLength: dist,
         stiffness: 0.15 + Math.random() * 0.1 // Random stiffness for organic feel
       });
       nodes[idxA].connections.push(idxB);
       nodes[idxB].connections.push(idxA);
    };

    const animate = () => {
      const { nodes, springs, snow } = stateRef.current;
      
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#f0f0f0';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // --- 1. Physics: Verlet Integration ---
      for (let i = 0; i < nodes.length; i++) {
        const node = nodes[i];
        if (node.isFixed) continue;

        const vx = (node.x - node.oldX) * FRICTION;
        const vy = (node.y - node.oldY) * FRICTION;

        node.oldX = node.x;
        node.oldY = node.y;

        node.x += vx;
        node.y += vy + GRAVITY;

        // Mouse Interaction (Wind/Push)
        const dx = node.x - mouseRef.current.x;
        const dy = node.y - mouseRef.current.y;
        const distSq = dx*dx + dy*dy;
        const radius = 150;
        
        if (distSq < radius * radius) {
           const dist = Math.sqrt(distSq);
           const force = (1 - dist / radius) * 2; // Strong push
           node.x += (dx / dist) * force * 5;
           node.y += (dy / dist) * force * 5;
           
           // Add "Excite" factor to snow near collision
        }
      }

      // --- 2. Physics: Constraint Solving (Springs) ---
      // Multiple iterations for stability
      for (let iter = 0; iter < 4; iter++) {
        for (let i = 0; i < springs.length; i++) {
          const s = springs[i];
          const nA = nodes[s.a];
          const nB = nodes[s.b];

          const dx = nA.x - nB.x;
          const dy = nA.y - nB.y;
          const dist = Math.sqrt(dx*dx + dy*dy) || 0.1;
          const diff = (s.restLength - dist) / dist;
          
          // Apply correction
          const offsetX = dx * diff * s.stiffness * 0.5;
          const offsetY = dy * diff * s.stiffness * 0.5;

          if (!nA.isFixed) {
            nA.x += offsetX;
            nA.y += offsetY;
          }
          if (!nB.isFixed) {
            nB.x -= offsetX;
            nB.y -= offsetY;
          }
        }
      }

      // --- 3. Draw Snow ---
      ctx.fillStyle = 'rgba(200, 200, 210, 0.6)';
      for(let s of snow) {
        s.y += s.vy;
        s.x += s.vx + Math.sin(s.y * 0.01);
        if (s.y > canvas.height) s.y = -10;
        if (s.x > canvas.width) s.x = 0;
        if (s.x < 0) s.x = canvas.width;
        
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.size, 0, Math.PI*2);
        ctx.fill();
      }

      // --- 4. Draw Connections ---
      ctx.lineWidth = 1;
      ctx.strokeStyle = 'rgba(217, 34, 34, 0.4)'; // Red faint lines
      ctx.beginPath();
      for (let s of springs) {
        ctx.moveTo(nodes[s.a].x, nodes[s.a].y);
        ctx.lineTo(nodes[s.b].x, nodes[s.b].y);
      }
      ctx.stroke();

      // --- 5. Draw Text Nodes ---
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      
      for (let i = 0; i < nodes.length; i++) {
        const node = nodes[i];
        
        // Dynamic Font Size based on movement or position
        const velocity = Math.abs(node.x - node.oldX) + Math.abs(node.y - node.oldY);
        const fontSize = Math.min(16, 10 + velocity * 2);
        
        ctx.font = `${fontSize}px "Times New Roman", serif`;
        
        // Text Color: Fade based on layer
        const alpha = 1 - (node.layer / (LAYERS + 5));
        ctx.fillStyle = `rgba(0, 0, 0, ${alpha})`;
        
        ctx.fillText(node.text, node.x, node.y);
      }

      // --- 6. Draw Star ---
      if (nodes.length > 0) {
        const top = nodes[0];
        ctx.font = '30px serif';
        ctx.fillStyle = '#D92222';
        ctx.shadowColor = '#D92222';
        ctx.shadowBlur = 10;
        ctx.fillText("★", top.x, top.y - 15);
        ctx.shadowBlur = 0;
      }

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
    <div className="relative w-full h-full cursor-crosshair">
      <canvas ref={canvasRef} className="block w-full h-full" />
      <button 
        onClick={handleRestart}
        className="absolute top-20 left-4 p-2 bg-white/80 rounded-full hover:bg-white transition-colors shadow-sm text-gray-600 hover:text-red-600 z-10"
      >
        <RotateCcw size={20} />
      </button>
      
      <div className="absolute bottom-10 left-0 w-full text-center pointer-events-none">
        <h2 className="text-red-700 font-serif italic text-xl opacity-80 mix-blend-multiply">Jingle Bell Rock</h2>
      </div>
    </div>
  );
};

export default ChristmasTreeEffect;