/**
 * The single source of truth the scroll timeline writes and the renderer
 * reads. It is a plain mutable object on purpose: GSAP tweens it at scroll
 * rate and React Three Fiber reads it every frame without React re-renders.
 *
 * It deliberately imports nothing from three.js: the home page's DOM code
 * imports this module eagerly, and a three import here would drag the whole
 * 3D library into the entry bundle of every route, legal pages included.
 * Vectors are therefore plain {x, y, z} records; the renderer copies them
 * into its own Vector3 scratch objects.
 */
export const sceneState = {
  /** Awakening on load, 0 → 1. Drives the power-up and the first camera reveal. */
  intro: 0,
  /** Scroll progress across the whole page, 0 → 1 (informational). */
  progress: 0,

  cam: { x: 0, y: 0.5, z: 12.4 },
  target: { x: 0, y: 0, z: 0 },
  fov: 40,
  /** Framing offsets so the subject sits beside the copy (landscape, x) or above it (portrait, y). */
  shiftX: 0,
  shiftY: 0,

  /** Core energy: emissive strength of the heart, filaments and inner light. */
  energy: 0,
  /**
   * Plate formation: 0 sealed shell · 1 exploded · 2 frame around the
   * software panels · 3 portal ring · 4 dispersed into the games sky.
   */
  formation: 0,
  /** Gyroscopic rings expand and separate, 0 → 1. */
  ringSpread: 0,
  /** Particles stream past the camera during the fly-through. */
  flow: 0,
  /** Environment blend: 0 studio void → 1 digital world. */
  world: 0,
  /** Holographic panels assembled, 0 → 1. */
  holo: 0,
  /** Portal iris, 0 closed → 1 open. */
  portal: 0,
  /** Games exhibits revealed, 0 → 1. */
  gamesReveal: 0,
  /** Which exhibit has focus, as a float so adjacent exhibits can blend. */
  gamesFocus: 0,
  /** Outro calm: slows particles and dims accents. */
  calm: 0,

  /** Normalised pointer, -1..1, written by the DOM; damped inside the rig. */
  pointer: { x: 0, y: 0, active: false },
  /** Id of the hovered 3D product, mirrored into the DOM cards. */
  hover: null as string | null,
  reducedMotion: false,
};

export type SceneState = typeof sceneState;

type HoverListener = (id: string | null) => void;
const hoverListeners = new Set<HoverListener>();

export function setHover(id: string | null) {
  if (sceneState.hover === id) return;
  sceneState.hover = id;
  hoverListeners.forEach((listener) => listener(id));
}

export function subscribeHover(listener: HoverListener) {
  hoverListeners.add(listener);
  return () => {
    hoverListeners.delete(listener);
  };
}

/** Smoothstep helper shared by the scene components. */
export function smoothstep(edge0: number, edge1: number, x: number) {
  const t = Math.min(1, Math.max(0, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}

export function clamp01(x: number) {
  return Math.min(1, Math.max(0, x));
}

export function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

/** Seeded pseudo-random so instanced layouts are stable across renders. */
export function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
