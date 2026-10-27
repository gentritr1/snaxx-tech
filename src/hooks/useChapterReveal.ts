import { useEffect, type RefObject } from 'react';
import { gsap, ScrollTrigger } from '@/experience/scroll';
import { prefersReducedMotion } from '@/experience/quality';
import { readTop } from '@/lib/scroll';

interface Options {
  /** Fraction of the section's scroll distance over which the copy fades in. 0 = already visible. */
  fadeIn?: number;
  /** Fraction at which the copy starts fading out. 1 = never. */
  fadeOutAt?: number;
}

/**
 * Fades a chapter's copy in as its section scrolls into place and out as
 * it leaves, scrubbed to the scroll position so it stays in step with the
 * 3D choreography. Reduced motion: copy is simply visible.
 */
export function useChapterReveal(
  section: RefObject<HTMLElement | null>,
  copy: RefObject<HTMLElement | null>,
  { fadeIn = 0.2, fadeOutAt = 0.82 }: Options = {},
) {
  useEffect(() => {
    const sectionEl = section.current;
    const copyEl = copy.current;
    if (!sectionEl || !copyEl) return;
    if (prefersReducedMotion()) {
      gsap.set(copyEl, { opacity: 1, y: 0 });
      return;
    }
    const tl = gsap.timeline({
      scrollTrigger: { trigger: sectionEl, start: 'top top', end: 'bottom bottom', scrub: true },
      defaults: { ease: 'none' },
    });
    if (fadeIn > 0) {
      tl.fromTo(copyEl, { opacity: 0, y: 48 }, { opacity: 1, y: 0, duration: fadeIn, ease: 'power2.out' }, 0);
    } else {
      gsap.set(copyEl, { opacity: 1, y: 0 });
    }
    if (fadeOutAt < 1) {
      tl.to(copyEl, { opacity: 0, y: -36, duration: 1 - fadeOutAt, ease: 'power2.in' }, fadeOutAt);
    }
    // Without a fade-out the timeline would be only `fadeIn` long and the
    // scrub would stretch the fade-in over the whole chapter.
    if (tl.duration() < 1) tl.set({}, {}, 1);
    // Faded copy stays in the tab order (keyboard users can reach every
    // chapter); when focus lands in it, bring the chapter to where it reads.
    // The scroll waits a frame: the browser's own focus scroll runs after this event and would win.
    const onFocus = () => {
      if (Number(getComputedStyle(copyEl).opacity) > 0.9) return;
      requestAnimationFrame(() =>
        window.scrollTo({ top: readTop(sectionEl, (fadeIn + Math.min(fadeOutAt, 1)) / 2), behavior: 'instant' }),
      );
    };
    copyEl.addEventListener('focusin', onFocus);
    return () => {
      copyEl.removeEventListener('focusin', onFocus);
      tl.scrollTrigger?.kill();
      tl.kill();
    };
  }, [section, copy, fadeIn, fadeOutAt]);
}

/** Sequential reveals inside one section: item i is shown during its slice. */
export function useSequenceReveal(
  section: RefObject<HTMLElement | null>,
  items: RefObject<(HTMLElement | null)[]>,
  count: number,
) {
  useEffect(() => {
    const sectionEl = section.current;
    const els = items.current?.slice(0, count) ?? [];
    if (!sectionEl || els.length === 0) return;
    if (prefersReducedMotion()) {
      // Reduced motion: every item is simply shown (the caller lays them out in flow).
      els.forEach((el) => el && gsap.set(el, { autoAlpha: 1, y: 0, pointerEvents: 'auto' }));
      return;
    }
    const tl = gsap.timeline({
      scrollTrigger: { trigger: sectionEl, start: 'top top', end: 'bottom bottom', scrub: true },
      defaults: { ease: 'none' },
    });
    const slice = 1 / count;
    const edge = slice * 0.18;
    els.forEach((el, i) => {
      if (!el) return;
      const start = i * slice;
      const end = (i + 1) * slice;
      // autoAlpha toggles `visibility` along with opacity, so an inactive
      // item's links are removed from the tab order and the accessibility tree.
      gsap.set(el, { autoAlpha: 0, y: 40, pointerEvents: 'none' });
      tl.to(el, { autoAlpha: 1, y: 0, pointerEvents: 'auto', duration: edge, ease: 'power2.out' }, start + (i === 0 ? 0.02 : edge * 0.4));
      tl.to(el, { autoAlpha: 0, y: -30, pointerEvents: 'none', duration: edge, ease: 'power2.in' }, end - edge - (i === count - 1 ? 0.04 : 0));
    });
    return () => {
      tl.scrollTrigger?.kill();
      tl.kill();
    };
  }, [section, items, count]);
}

export { ScrollTrigger };
