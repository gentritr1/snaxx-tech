import { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { heroConfig, isThreadHero, type HeroClip } from '@/config';
import ThreadHero from './hero-thread/ThreadHero';

/**
 * Hero — "The Snaxx Almanac" living illustration.
 *
 * ONE ambient clip per visit (weighted random pick). Each file is a baked
 * self-loop whose last and first frames are content-continuous, but native
 * `<video loop>` is NOT used: Chrome's loop wrap seeks the decoder back to
 * frame 0 and can stall playback for a few frames — a visible hitch even
 * when the content is seamless.
 *
 * Instead the SAME clip is double-buffered across two video elements: while
 * one plays, the other sits fully decoded and parked on frame 0. On
 * `ended`, the standby starts and an instant visibility swap hands over —
 * no live element ever seeks, so the wrap costs zero playback stall. The
 * retired element then re-parks itself on frame 0 for the next wrap.
 *
 * Reduced motion or any load error falls back to the clip's first-frame
 * still (also the underlay poster, so nothing flashes while buffering).
 */

/** Weighted random pick. */
function pickClip(clips: HeroClip[]): HeroClip {
  const total = clips.reduce((sum, c) => sum + c.weight, 0);
  let roll = Math.random() * total;
  for (const clip of clips) {
    roll -= clip.weight;
    if (roll <= 0) return clip;
  }
  return clips[clips.length - 1];
}

export function Hero() {
  return isThreadHero() ? <ThreadHero /> : <AlmanacHero />;
}

function AlmanacHero() {
  const videoRefA = useRef<HTMLVideoElement>(null);
  const videoRefB = useRef<HTMLVideoElement>(null);
  const activeSlotRef = useRef<0 | 1>(0);
  const [activeSlot, setActiveSlot] = useState<0 | 1>(0);
  const [clip] = useState(() => pickClip(heroConfig.clips));
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

  // Start the active player; park the standby fully decoded on frame 0.
  useEffect(() => {
    if (!showVideo) return;
    const a = videoRefA.current;
    const b = videoRefB.current;
    if (!a || !b) return;
    a.play().catch(() => {
      /* autoplay refused (battery saver etc.) — poster frame remains */
    });
    b.load();
  }, [showVideo]);

  /**
   * Wrap handover: the standby is already decoded at frame 0, whose content
   * continues the ended element's last frame. Instant swap, zero seek.
   */
  const handleEnded = useCallback((endedSlot: 0 | 1) => {
    if (endedSlot !== activeSlotRef.current) return;
    const ended = endedSlot === 0 ? videoRefA.current : videoRefB.current;
    const standby = endedSlot === 0 ? videoRefB.current : videoRefA.current;
    if (!ended || !standby) return;
    const nextSlot: 0 | 1 = endedSlot === 0 ? 1 : 0;
    activeSlotRef.current = nextSlot;
    setActiveSlot(nextSlot);
    standby.play().catch(() => {
      // Standby refused (rare) — fall back to rewinding the ended element.
      activeSlotRef.current = endedSlot;
      setActiveSlot(endedSlot);
      ended.currentTime = 0;
      ended.play().catch(() => {});
    });
    // Re-park the retired element on frame 0, decoded, for the next wrap.
    ended.currentTime = 0;
  }, []);

  // Chrome pauses muted video-only media in background tabs and doesn't
  // reliably resume on return — nudge the active player back to life.
  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState !== 'visible') return;
      const active = activeSlotRef.current === 0 ? videoRefA.current : videoRefB.current;
      if (active && active.paused) {
        active.play().catch(() => {});
      }
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, []);

  // Instant swap — no opacity transition: the two frames at the boundary
  // are content-continuous, so any crossfade would only add ghosting.
  const videoClass = (slot: 0 | 1) =>
    cn(
      'absolute inset-0 h-full w-full object-cover',
      activeSlot === slot ? 'visible' : 'invisible'
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
        {/* Underlay — the clip's exact first frame: no flash while the
            video buffers, and the reduced-motion / error fallback. */}
        <img
          className="absolute inset-0 h-full w-full object-cover"
          src={showVideo ? clip.poster : heroConfig.posterSrc}
          alt=""
          draggable={false}
        />
        {showVideo && (
          <>
            <video
              ref={videoRefA}
              className={videoClass(0)}
              src={clip.src}
              poster={clip.poster}
              muted
              playsInline
              autoPlay
              preload="auto"
              disablePictureInPicture
              onEnded={() => handleEnded(0)}
              onError={() => setVideoFailed(true)}
            />
            <video
              ref={videoRefB}
              className={videoClass(1)}
              src={clip.src}
              muted
              playsInline
              preload="auto"
              disablePictureInPicture
              onEnded={() => handleEnded(1)}
              onError={() => setVideoFailed(true)}
            />
          </>
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
