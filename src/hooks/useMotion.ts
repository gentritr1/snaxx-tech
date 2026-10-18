import { useEffect, useRef } from 'react';

// Shared motion helper — magnetic buttons.
// All respect prefers-reduced-motion and desktop pointer-fine where relevant.

// Gently attract an element toward the cursor (<= maxOffset px), rAF-driven.
// Desktop pointer-fine only; disabled under reduced motion.
export function useMagnetic<T extends HTMLElement = HTMLDivElement>(maxOffset = 8) {
  const ref = useRef<T>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!fine || reduced) return;

    let rafId: number | null = null;
    const target = { x: 0, y: 0 };
    const current = { x: 0, y: 0 };

    // 0.18 of the gap per 60 Hz frame, scaled by elapsed time so 120 Hz
    // screens settle at the same speed.
    let last = 0;
    const tick = (now: number) => {
      const a = last ? 1 - Math.pow(0.82, (now - last) / 16.67) : 0.18;
      last = now;
      current.x += (target.x - current.x) * a;
      current.y += (target.y - current.y) * a;
      el.style.transform = `translate3d(${current.x}px, ${current.y}px, 0)`;
      if (Math.abs(target.x - current.x) > 0.1 || Math.abs(target.y - current.y) > 0.1) {
        rafId = requestAnimationFrame(tick);
      } else {
        el.style.transform = `translate3d(${target.x}px, ${target.y}px, 0)`;
        rafId = null;
        last = 0;
      }
    };

    const start = () => {
      if (rafId == null) rafId = requestAnimationFrame(tick);
    };

    const onMove = (e: MouseEvent) => {
      const rect = el.getBoundingClientRect();
      const dx = e.clientX - (rect.left + rect.width / 2);
      const dy = e.clientY - (rect.top + rect.height / 2);
      const clamp = (v: number) => Math.max(-maxOffset, Math.min(maxOffset, v));
      target.x = clamp(dx * 0.4);
      target.y = clamp(dy * 0.4);
      start();
    };

    const onLeave = () => {
      target.x = 0;
      target.y = 0;
      start();
    };

    el.addEventListener('mousemove', onMove);
    el.addEventListener('mouseleave', onLeave);

    return () => {
      el.removeEventListener('mousemove', onMove);
      el.removeEventListener('mouseleave', onLeave);
      if (rafId != null) cancelAnimationFrame(rafId);
      el.style.transform = '';
    };
  }, [maxOffset]);

  return ref;
}
