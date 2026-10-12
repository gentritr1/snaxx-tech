// Adaptive rendering quality. Tier detection is heuristic (no network GPU
// benchmark: the site's CSP forbids third-party requests) and the
// PerformanceMonitor in Experience.tsx steps the pixel ratio down on
// sustained low frame rates.

export type Tier = 'high' | 'medium' | 'low';

export interface Quality {
  tier: Tier;
  /** [min, max] device pixel ratio handed to the canvas. */
  dpr: [number, number];
  plates: number;
  particles: number;
  fragments: number;
  dof: boolean;
  transmission: boolean;
  multisampling: number;
}

export const QUALITY: Record<Tier, Quality> = {
  high: { tier: 'high', dpr: [1, 2], plates: 900, particles: 6000, fragments: 220, dof: true, transmission: true, multisampling: 4 },
  medium: { tier: 'medium', dpr: [1, 1.5], plates: 600, particles: 3200, fragments: 160, dof: false, transmission: true, multisampling: 2 },
  low: { tier: 'low', dpr: [1, 1.25], plates: 320, particles: 1400, fragments: 90, dof: false, transmission: false, multisampling: 0 },
};

export function detectTier(): Tier {
  if (typeof window === 'undefined') return 'medium';
  const nav = navigator as Navigator & { deviceMemory?: number };
  const coarse = window.matchMedia('(pointer: coarse)').matches;
  const small = Math.min(window.innerWidth, window.innerHeight) < 640;
  const memory = nav.deviceMemory ?? 8;
  const cores = navigator.hardwareConcurrency ?? 8;
  if (coarse || small || memory <= 4 || cores <= 4) return 'low';
  if (memory < 8 || cores < 8 || window.devicePixelRatio > 2.5) return 'medium';
  return 'high';
}

export function prefersReducedMotion(): boolean {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export function webglAvailable(): boolean {
  if (typeof document === 'undefined') return false;
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl2') ?? canvas.getContext('webgl');
    return Boolean(gl);
  } catch {
    return false;
  }
}
