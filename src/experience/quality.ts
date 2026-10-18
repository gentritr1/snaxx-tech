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
  bloom: boolean;
  multisampling: number;
}

export const QUALITY: Record<Tier, Quality> = {
  // Pixel ratio is the biggest lever: a retina canvas is four times the
  // pixels of a 1x one. Every tier caps below the device's native ratio.
  high: { tier: 'high', dpr: [1, 1.5], plates: 640, particles: 3200, fragments: 150, bloom: true, multisampling: 2 },
  medium: { tier: 'medium', dpr: [1, 1.25], plates: 420, particles: 1800, fragments: 100, bloom: true, multisampling: 2 },
  low: { tier: 'low', dpr: [1, 1], plates: 240, particles: 900, fragments: 60, bloom: false, multisampling: 0 },
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

let webglChecked: boolean | undefined;

/** Probes once per page load and releases the throwaway context it made. */
export function webglAvailable(): boolean {
  if (typeof document === 'undefined') return false;
  if (webglChecked !== undefined) return webglChecked;
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl2') ?? canvas.getContext('webgl');
    gl?.getExtension('WEBGL_lose_context')?.loseContext();
    webglChecked = Boolean(gl);
  } catch {
    webglChecked = false;
  }
  return webglChecked;
}
