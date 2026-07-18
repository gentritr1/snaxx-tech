import { useEffect, useRef, useState } from 'react';

// Shared motion helpers — magnetic buttons and count-up stats.
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

    const tick = () => {
      current.x += (target.x - current.x) * 0.18;
      current.y += (target.y - current.y) * 0.18;
      el.style.transform = `translate3d(${current.x}px, ${current.y}px, 0)`;
      if (Math.abs(target.x - current.x) > 0.1 || Math.abs(target.y - current.y) > 0.1) {
        rafId = requestAnimationFrame(tick);
      } else {
        el.style.transform = `translate3d(${target.x}px, ${target.y}px, 0)`;
        rafId = null;
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

// Count a numeric string (e.g. "3", "100%") up from 0 when scrolled into view, once.
// Non-numeric values (e.g. "Soon") pass through unchanged. Static under reduced motion.
export function useCountUp<T extends HTMLElement = HTMLDivElement>(
  value: string,
  duration = 800,
) {
  const ref = useRef<T>(null);
  const match = value.match(/^(\d+)(.*)$/);
  const targetNum = match ? parseInt(match[1], 10) : null;
  const suffix = match ? match[2] : '';
  // Lazy initializer avoids synchronous setState in the effect:
  // non-numeric values and reduced-motion users start at their final value.
  const [display, setDisplay] = useState<string>(() => {
    if (targetNum == null) return value;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return `${targetNum}${suffix}`;
    }
    return `0${suffix}`;
  });

  useEffect(() => {
    if (targetNum == null) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const el = ref.current;
    if (!el) return;

    let rafId: number | null = null;
    let started = false;

    const run = () => {
      const startTime = performance.now();
      const step = (now: number) => {
        const t = Math.min(1, (now - startTime) / duration);
        const eased = 1 - Math.pow(1 - t, 3); // ease-out-cubic
        setDisplay(`${Math.round(eased * targetNum)}${suffix}`);
        if (t < 1) rafId = requestAnimationFrame(step);
      };
      rafId = requestAnimationFrame(step);
    };

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !started) {
            started = true;
            run();
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.4 },
    );
    observer.observe(el);

    return () => {
      observer.disconnect();
      if (rafId != null) cancelAnimationFrame(rafId);
    };
  }, [targetNum, suffix, duration]);

  return { ref, display };
}
