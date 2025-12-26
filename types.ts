export interface Particle {
  char: string;
  x: number;
  y: number;
  originX: number;
  originY: number;
  vx: number;
  vy: number;
  isActive: boolean;
  // Chaos factors
  jitterPhase: number;
}

export interface Point {
  x: number;
  y: number;
}

export interface RopeState {
  points: Point[];
  angle: number; // Driver angle
}

export interface TreeNode {
  x: number;
  y: number;
  // Physics properties
  oldX: number; // For Verlet integration
  oldY: number;
  mass: number;
  isFixed: boolean;
  
  // Content
  layer: number;
  text: string;
  connections: number[]; // Indices of connected nodes
}

export interface TreeSpring {
  a: number; // Index of node A
  b: number; // Index of node B
  restLength: number;
  stiffness: number;
}

export interface SnowParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  opacity: number;
}

// Advanced Wire for Wave Simulation
export interface WavePoint {
  x: number;
  y: number; // Resting Y
  dy: number; // Displacement
  vel: number; // Velocity
  force: number;
}

export interface WaveWire {
  points: WavePoint[];
  y: number;
  tension: number;
  damping: number;
  color: string;
}

export interface NoteParticle {
  char: string;
  wireIndex: number;
  t: number; // 0 to 1 position along wire
  x: number;
  y: number;
  vx: number;
  vy: number;
  angle: number;
  floating: boolean;
  opacity: number;
}

export interface FlowParticle {
  char: string;
  x: number;
  y: number;
  originX: number;
  originY: number;
  vx: number;
  vy: number;
  energy: number; // 0 to 1, how much it is affected by entropy
  friction: number;
  size: number;
  // For the hidden message effect
  messageX?: number;
  messageY?: number;
}

// Gravity rigid bodies
export interface RigidBody {
  id: number;
  text: string;
  x: number;
  y: number;
  angle: number;
  width: number;
  height: number;
  vx: number;
  vy: number;
  angularVelocity: number;
  mass: number;
  isDragging: boolean;
  color: string;
}

// Ripple Grid Point
export interface RipplePoint {
  x: number;
  y: number;
  z: number; // Height (ripple)
  v: number; // Velocity
}

// Spore / Growth
export interface Spore {
  x: number;
  y: number;
  vx: number;
  vy: number;
  char: string;
  life: number;
  state: 'FLOATING' | 'ROOTED';
  angle: number;
  scale: number;
}

// Chasm / Infinite
export interface AbyssObject {
  id: number;
  text: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  angle: number;
  angularVelocity: number;
  isDragging: boolean;
  state: 'SURFACE' | 'FALLING';
  depth: number; // 0 to Infinity
}

// Thread / Web
export interface ThreadNode {
  x: number;
  y: number;
  originX: number;
  originY: number;
  vx: number;
  vy: number;
  char: string;
}

// Neon / Rain
export interface NeonDrop {
  x: number;
  y: number;
  speed: number;
  chars: string[];
  colorH: number; // Hue
  brightness: number;
  fontSize: number;
  length: number;
}

export interface FireworkParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  char: string;
  color: string;
  life: number;
  maxLife: number;
  size: number;
}

// Galaxy / Orbit
export interface GalaxyStar {
  x: number;
  y: number;
  z: number; // Depth
  angle: number; // Orbital angle
  radius: number; // Distance from center
  speed: number; // Orbital speed
  char: string;
  size: number;
  color: string;
}

// Eclipse / Shadow
export interface ShadowObject {
  text: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

// Velocity / Warp
export interface WarpParticle {
  x: number; // -1 to 1 (normalized screen space)
  y: number; // -1 to 1
  z: number; // distance from camera (starts at FAR, moves to 0)
  char: string;
  color: string;
  angle: number; // rotation
}

// Bloom / Flower
export interface BloomParticle {
  char: string;
  x: number;
  y: number;
  originX: number;
  originY: number;
  size: number;
  baseColor: string;
  bloomColor: string; // HSL string
  rotation: number;
  scale: number;
  bloomState: number; // 0 to 1
  phase: number;
}

// Noir / Smoke
export interface NoirParticle {
  char: string;
  x: number;
  y: number;
  originX: number;
  originY: number;
  vx: number;
  vy: number;
  alpha: number;
  blur: number;
  size: number;
}