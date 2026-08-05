import { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { heroConfig, type HeroClip } from '@/config';

/**
 * Hero — "The Snaxx Almanac" living illustration.
 *
 * Plays an endless random chain of ambient clips. Every clip in the pool
 * starts and ends on the same canonical base frame (enforced at build time
 * with motion-interpolated bookends), so swapping videos on `ended` is a
 * pixel-continuous hard cut: the scene keeps living — plane bobbing, smoke
 * rising, sometimes a shooting star — without ever visibly restarting.
 *
 * Two stacked <video> elements alternate: while one plays, the other
 * preloads the next randomly chosen clip. Reduced motion or any load error
 * falls back to the identical still frame.
 */

/** Weighted random pick, avoiding an immediate repeat when possible. */
function pickClip(clips: HeroClip[], avoidSrc: string | null): HeroClip {
  const pool = clips.length > 1 && avoidSrc ? clips.filter((c) => c.src !== avoidSrc) : clips;
  const total = pool.reduce((sum, c) => sum + c.weight, 0);
  let roll = Math.random() * total;
  for (const clip of pool) {
    roll -= clip.weight;
    if (roll <= 0) return clip;
  }
  return pool[pool.length - 1];
}

export function Hero() {
  const videoRefA = useRef<HTMLVideoElement>(null);
  const videoRefB = useRef<HTMLVideoElement>(null);
  /** Which element is currently front-and-playing: 0 = A, 1 = B. */
  const [activeSlot, setActiveSlot] = useState(0);
  const activeSlotRef = useRef(0);
  const [isLoaded, setIsLoaded] = useState(false);
  const [videoFailed, setVideoFailed] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(
    () =>
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
  );

  useEffect(() => {
    const timer = setTimeout(() => setIsLoaded(true), 200);
    return () => clearTimeout(timer);
  }, []);

  // Listen once for live changes to the reduced-motion preference.
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const onChange = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  const showVideo = !reducedMotion && !videoFailed;

  /** Load the first clip into A and preload a different one into B. */
  useEffect(() => {
    if (!showVideo) return;
    const a = videoRefA.current;
    const b = videoRefB.current;
    if (!a || !b || a.src) return; // already initialised
    const first = pickClip(heroConfig.clips, null);
    const next = pickClip(heroConfig.clips, first.src);
    a.src = first.src;
    b.src = next.src;
    b.load();
    a.play().catch(() => {
      /* autoplay refused (battery saver etc.) — poster frame remains */
    });
  }, [showVideo]);

  /**
   * Every clip is cut so its first and last frames sit at the same motion
   * phase (plane mid-bob, matched pose vs the base artwork) while the scene
   * is in full motion. Shortly before the active clip runs out, the
   * preloaded standby starts and a 200ms opacity crossfade hands over —
   * motion never pauses, so no join reads as a restart.
   */
  const switchingRef = useRef(false);

  const beginHandover = useCallback((fromSlot: 0 | 1) => {
    if (fromSlot !== activeSlotRef.current || switchingRef.current) return;
    const outgoing = fromSlot === 0 ? videoRefA.current : videoRefB.current;
    const standby = fromSlot === 0 ? videoRefB.current : videoRefA.current;
    if (!outgoing || !standby) return;
    switchingRef.current = true;
    const nextSlot = fromSlot === 0 ? 1 : 0;
    activeSlotRef.current = nextSlot;
    setActiveSlot(nextSlot);
    standby.play().catch(() => {
      // Standby refused to start (rare) — revert the swap and replay the
      // outgoing clip instead of fading to a paused element.
      activeSlotRef.current = fromSlot;
      setActiveSlot(fromSlot);
      outgoing.currentTime = 0;
      outgoing.play().catch(() => {});
    });
    // After the fade completes, retire the outgoing element and turn it
    // into the preloader for the following pick.
    setTimeout(() => {
      outgoing.pause();
      const upcoming = pickClip(heroConfig.clips, standby.currentSrc);
      outgoing.src = upcoming.src;
      outgoing.load();
      switchingRef.current = false;
    }, 450);
  }, []);

  /** Fire the handover ~0.35s before the end (timeupdate ticks ~4Hz). */
  const handleTimeUpdate = useCallback(
    (slot: 0 | 1) => {
      const v = slot === 0 ? videoRefA.current : videoRefB.current;
      if (!v || !v.duration) return;
      if (v.duration - v.currentTime <= 0.35) beginHandover(slot);
    },
    [beginHandover]
  );

  // Chrome pauses muted video-only media in background tabs and doesn't
  // reliably resume on return — nudge the active clip back to life.
  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState !== 'visible') return;
      const active = activeSlotRef.current === 0 ? videoRefA.current : videoRefB.current;
      if (active && active.paused && active.src) {
        active.play().catch(() => {});
      }
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, []);

  const videoClass = (slot: 0 | 1) =>
    cn(
      'absolute inset-0 h-full w-full object-cover transition-opacity duration-200 ease-linear',
      activeSlot === slot ? 'opacity-100' : 'opacity-0'
    );

  return (
    <section id="hero" className="relative w-full min-h-screen overflow-hidden bg-[#F2E9D6]">
      <h1 className="sr-only">
        The Snaxx Almanac — {heroConfig.roles[0] ?? 'apps, games & useful little things'} by Snaxx
        Tech
      </h1>

      {/* The animated illustration is decorative; the sr-only heading above
          and the sections below carry the real content. */}
      <div
        aria-hidden="true"
        className={cn(
          'absolute inset-0 transition-opacity duration-1000',
          isLoaded ? 'opacity-100' : 'opacity-0'
        )}
      >
        {showVideo ? (
          <>
            {/* Poster underlay — identical to every clip's first frame, so
                there is no flash while the first video buffers. */}
            <img
              className="absolute inset-0 h-full w-full object-cover"
              src={heroConfig.posterSrc}
              alt=""
              draggable={false}
            />
            <video
              ref={videoRefA}
              className={videoClass(0)}
              muted
              playsInline
              preload="auto"
              disablePictureInPicture
              onTimeUpdate={() => handleTimeUpdate(0)}
              onEnded={() => beginHandover(0)}
              onError={() => setVideoFailed(true)}
            />
            <video
              ref={videoRefB}
              className={videoClass(1)}
              muted
              playsInline
              preload="auto"
              disablePictureInPicture
              onTimeUpdate={() => handleTimeUpdate(1)}
              onEnded={() => beginHandover(1)}
              onError={() => setVideoFailed(true)}
            />
          </>
        ) : (
          <img
            className="absolute inset-0 h-full w-full object-cover"
            src={heroConfig.posterSrc}
            alt=""
            draggable={false}
          />
        )}
      </div>

      {/* scroll cue */}
      <div
        className={cn(
          'absolute bottom-6 left-1/2 -translate-x-1/2 z-30 pointer-events-none hidden sm:flex items-center gap-2 transition-opacity duration-1000',
          isLoaded ? 'opacity-100' : 'opacity-0'
        )}
        style={{ transitionDelay: '1200ms' }}
      >
        <span className="text-[0.65rem] font-geist-mono uppercase tracking-[0.25em] text-exvia-black/50">
          scroll
        </span>
        <ArrowDown className="w-3.5 h-3.5 text-exvia-black/50 scroll-cue" />
      </div>
    </section>
  );
}
