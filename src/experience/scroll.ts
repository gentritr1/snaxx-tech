import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { sceneState } from './sceneState';

gsap.registerPlugin(ScrollTrigger);

export const CHAPTER_IDS = ['hero', 'core', 'inside', 'software', 'portal', 'games', 'studio', 'contact'] as const;
export type ChapterId = (typeof CHAPTER_IDS)[number];

interface Range {
  start: number;
  end: number;
}

/**
 * Measure where each chapter sits as a fraction of the page's scroll
 * distance. `start` is when the chapter's top reaches the viewport top,
 * `end` when its bottom reaches the viewport bottom. The 3D keyframes are
 * expressed relative to these, so the scene stays aligned with the copy at
 * any viewport size.
 */
function measure(root: HTMLElement): Record<ChapterId, Range> {
  const max = Math.max(1, root.offsetHeight - window.innerHeight);
  const out = {} as Record<ChapterId, Range>;
  for (const id of CHAPTER_IDS) {
    const el = document.getElementById(id);
    if (!el) {
      out[id] = { start: 0, end: 0 };
      continue;
    }
    const top = el.offsetTop;
    const h = el.offsetHeight;
    out[id] = {
      start: Math.min(1, top / max),
      end: Math.min(1, Math.max(top, top + h - window.innerHeight) / max),
    };
  }
  return out;
}

interface CamKey {
  p: number;
  cam: [number, number, number];
  target: [number, number, number];
  fov: number;
  ease?: string;
}

function buildTimeline(r: Record<ChapterId, Range>) {
  const tl = gsap.timeline({ paused: true, defaults: { ease: 'power2.inOut', immediateRender: false } });
  const at = (id: ChapterId, t: number) => r[id].start + (r[id].end - r[id].start) * t;

  // --- Camera path -----------------------------------------------------
  const keys: CamKey[] = [
    { p: 0, cam: [0, 0.5, 12.4], target: [0, 0, 0], fov: 40 },
    { p: at('hero', 1), cam: [0.6, 0.8, 11.2], target: [0, 0, 0], fov: 40, ease: 'none' },
    { p: at('core', 0.5), cam: [3.4, 1.6, 7.8], target: [0, 0.1, 0], fov: 40 },
    { p: at('core', 1), cam: [1.6, 0.5, 4.1], target: [0, 0, 0], fov: 44 },
    { p: at('inside', 0.38), cam: [0, 0.15, 1.35], target: [0, 0, -2], fov: 56, ease: 'power1.inOut' },
    { p: at('inside', 0.72), cam: [0, 0, -2.6], target: [0, 0, -9], fov: 60, ease: 'power1.inOut' },
    { p: at('software', 0.18), cam: [-0.5, 0.35, -9.8], target: [0, 0.1, -14], fov: 40 },
    { p: at('software', 0.82), cam: [0.75, 0.05, -9.4], target: [0, 0.1, -14], fov: 38, ease: 'none' },
    { p: at('portal', 0.55), cam: [0, 0, -17.6], target: [0, 0, -22], fov: 48 },
    { p: at('portal', 1), cam: [0, 0, -24.6], target: [0, 0, -34], fov: 60, ease: 'power1.inOut' },
    { p: at('games', 0.12), cam: [-7.5, 0.5, -31.6], target: [-7.5, -0.1, -38], fov: 42 },
    { p: at('games', 0.36), cam: [-2.5, 0.5, -31.6], target: [-2.5, -0.1, -38], fov: 42 },
    { p: at('games', 0.38), cam: [-2.5, 0.5, -31.6], target: [-2.5, -0.1, -38], fov: 42, ease: 'none' },
    { p: at('games', 0.62), cam: [2.5, 0.5, -31.6], target: [2.5, -0.1, -38], fov: 42 },
    { p: at('games', 0.64), cam: [2.5, 0.5, -31.6], target: [2.5, -0.1, -38], fov: 42, ease: 'none' },
    { p: at('games', 0.88), cam: [7.5, 0.5, -31.6], target: [7.5, -0.1, -38], fov: 42 },
    { p: at('studio', 0.6), cam: [0, 6.8, -23.5], target: [0, -0.6, -38], fov: 36 },
    { p: at('contact', 0.7), cam: [0, 3.4, -18.5], target: [0, 0.4, -38], fov: 38 },
  ];
  for (let i = 1; i < keys.length; i++) {
    const a = keys[i - 1];
    const b = keys[i];
    const duration = Math.max(0.0001, b.p - a.p);
    const ease = b.ease ?? 'power2.inOut';
    tl.fromTo(sceneState.cam, { x: a.cam[0], y: a.cam[1], z: a.cam[2] }, { x: b.cam[0], y: b.cam[1], z: b.cam[2], duration, ease }, a.p);
    tl.fromTo(sceneState.target, { x: a.target[0], y: a.target[1], z: a.target[2] }, { x: b.target[0], y: b.target[1], z: b.target[2], duration, ease }, a.p);
    tl.fromTo(sceneState, { fov: a.fov }, { fov: b.fov, duration, ease }, a.p);
  }

  // --- Scalar choreography --------------------------------------------
  const seg = (key: keyof typeof sceneState, from: number, to: number, p0: number, p1: number, ease = 'power2.inOut') => {
    tl.fromTo(sceneState, { [key]: from }, { [key]: to, duration: Math.max(0.0001, p1 - p0), ease }, p0);
  };

  // Plates: shell → exploded → frame → ring → sky
  seg('formation', 0, 1, at('core', 0.15), at('core', 0.85), 'power3.inOut');
  seg('formation', 1, 2, at('inside', 0.5), at('software', 0.34), 'power2.inOut');
  seg('formation', 2, 3, at('software', 0.82), at('portal', 0.5), 'power2.inOut');
  seg('formation', 3, 4, at('portal', 0.72), at('games', 0.16), 'power2.in');

  seg('ringSpread', 0, 1, at('core', 0.1), at('core', 0.9));

  // Energy surge as we pass through the heart
  seg('energy', 1, 1.6, at('inside', 0.15), at('inside', 0.5));
  seg('energy', 1.6, 0.9, at('inside', 0.6), at('software', 0.1));

  // Particles stream during the two fly-throughs
  seg('flow', 0, 1, at('inside', 0.18), at('inside', 0.55));
  seg('flow', 1, 0.18, at('inside', 0.74), at('software', 0.16));
  seg('flow', 0.18, 0.9, at('portal', 0.32), at('portal', 0.9));
  seg('flow', 0.9, 0, at('games', 0), at('games', 0.2));

  // Environment turns digital, then into the games world
  seg('world', 0, 0.55, at('inside', 0.5), at('software', 0.2));
  seg('world', 0.55, 1, at('portal', 0.3), at('portal', 1));

  // Holographic interfaces assemble, then disassemble into the portal
  seg('holo', 0, 1, at('software', 0.08), at('software', 0.44), 'power2.out');
  seg('holo', 1, 0, at('software', 0.8), at('portal', 0.16), 'power2.in');

  seg('portal', 0, 1, at('portal', 0.1), at('portal', 0.62));
  seg('portal', 1, 0, at('games', 0.08), at('games', 0.4));

  seg('gamesReveal', 0, 1, at('portal', 0.7), at('games', 0.14), 'power2.out');
  seg('gamesFocus', 0, 1, at('games', 0.12), at('games', 0.36));
  seg('gamesFocus', 1, 2, at('games', 0.38), at('games', 0.62));
  seg('gamesFocus', 2, 3, at('games', 0.64), at('games', 0.88));

  seg('calm', 0, 1, at('studio', 0), at('studio', 0.8));

  // Framing: keep the subject clear of the copy.
  const shiftKeys: [number, number, number][] = [
    [0, -2.3, -1.3],
    [at('core', 0.5), -1.8, -1.0],
    [at('inside', 0.3), 0, 0],
    [at('software', 0.18), 1.7, -1.4],
    [at('software', 0.82), 1.7, -1.4],
    [at('portal', 0.5), 0, 0],
    [at('games', 0.12), -1.5, -0.45],
    [at('games', 0.88), -1.5, -0.45],
    [at('studio', 0.6), 0.6, 0],
    [at('contact', 0.7), 0, 0],
  ];
  for (let i = 1; i < shiftKeys.length; i++) {
    const [p0, x0, y0] = shiftKeys[i - 1];
    const [p1, x1, y1] = shiftKeys[i];
    tl.fromTo(sceneState, { shiftX: x0, shiftY: y0 }, { shiftX: x1, shiftY: y1, duration: Math.max(0.0001, p1 - p0), ease: 'power2.inOut' }, p0);
  }

  // Pad to exactly 1 so progress maps 1:1 onto page scroll.
  tl.to({}, { duration: Math.max(0, 1 - tl.duration()) }, tl.duration());
  return tl;
}

/** The scroll position (as timeline progress) that shows a chapter's "still". */
function stillPoint(r: Record<ChapterId, Range>, id: ChapterId) {
  const mid: Record<ChapterId, number> = { hero: 0, core: 1, inside: 0.3, software: 0.5, portal: 0.5, games: 0.5, studio: 0.7, contact: 0.8 };
  return r[id].start + (r[id].end - r[id].start) * mid[id];
}

export interface Choreography {
  kill: () => void;
  refresh: () => void;
}

export function createChoreography(root: HTMLElement, reducedMotion: boolean): Choreography {
  let ranges = measure(root);
  let tl = buildTimeline(ranges);
  let trigger: ScrollTrigger | undefined;

  const build = () => {
    trigger?.kill();
    if (!reducedMotion) {
      trigger = ScrollTrigger.create({
        trigger: root,
        start: 'top top',
        end: 'bottom bottom',
        scrub: 0.9,
        animation: tl,
        onUpdate: (self) => {
          sceneState.progress = self.progress;
        },
      });
    } else {
      // Reduced motion: no camera flight, one still composition per chapter.
      trigger = ScrollTrigger.create({
        trigger: root,
        start: 'top top',
        end: 'bottom bottom',
        onUpdate: (self) => {
          const p = self.progress;
          sceneState.progress = p;
          let current: ChapterId = 'hero';
          for (const id of CHAPTER_IDS) if (p >= ranges[id].start - 0.001) current = id;
          tl.progress(stillPoint(ranges, current));
        },
      });
      tl.progress(stillPoint(ranges, 'hero'));
    }
  };

  const refresh = () => {
    ranges = measure(root);
    const progress = tl.progress();
    tl.kill();
    tl = buildTimeline(ranges);
    tl.progress(progress);
    build();
    ScrollTrigger.refresh();
  };

  build();
  let resizeTimer: number | undefined;
  const onResize = () => {
    window.clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(refresh, 180);
  };
  window.addEventListener('resize', onResize);

  return {
    refresh,
    kill: () => {
      window.removeEventListener('resize', onResize);
      window.clearTimeout(resizeTimer);
      trigger?.kill();
      tl.kill();
    },
  };
}

/** The awakening: the core powers on and the camera reveals it. */
export function playAwakening(reducedMotion: boolean) {
  if (reducedMotion) {
    sceneState.intro = 1;
    sceneState.energy = 1;
    return () => {};
  }
  const tl = gsap.timeline();
  tl.fromTo(sceneState, { energy: 0 }, { energy: 1, duration: 2.6, ease: 'power2.inOut' }, 0.2);
  tl.fromTo(sceneState, { intro: 0 }, { intro: 1, duration: 3.4, ease: 'power3.out' }, 0.3);
  tl.fromTo(sceneState, { formation: 0.5 }, { formation: 0, duration: 2.4, ease: 'power3.out' }, 0);
  tl.fromTo(sceneState, { ringSpread: 0.3 }, { ringSpread: 0, duration: 2.2, ease: 'power3.out' }, 0.1);
  return () => {
    tl.kill();
  };
}

export { gsap, ScrollTrigger };
