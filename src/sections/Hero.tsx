import { useEffect, useRef, useState } from 'react';
import { ArrowDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { heroConfig, type HeroClip } from '@/config';

/**
 * Hero — "The Snaxx Almanac" living illustration.
 *
 * Plays ONE ambient clip per visit, chosen by weighted random pick, as a
 * native `<video loop>`. Each file is a baked self-loop: cut at
 * phase-matched frames with the seam blend inside the file, so the wrap is
 * two adjacent source frames and motion never stops or restarts. Variety
 * (including the rare shooting-star easter egg) lives BETWEEN visits —
 * transitions between different AI generations always shimmer, so the
 * player simply never performs one.
 *
 * The underlay <img> is the chosen clip's exact first frame: no pose jump
 * when playback begins. Reduced motion or any load error falls back to a
 * still.
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
  const videoRef = useRef<HTMLVideoElement>(null);
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

  useEffect(() => {
    if (!showVideo) return;
    videoRef.current?.play().catch(() => {
      /* autoplay refused (battery saver etc.) — poster frame remains */
    });
  }, [showVideo]);

  // Chrome pauses muted video-only media in background tabs and doesn't
  // reliably resume on return — nudge the clip back to life.
  useEffect(() => {
    const onVisible = () => {
      const v = videoRef.current;
      if (document.visibilityState === 'visible' && v && v.paused) {
        v.play().catch(() => {});
      }
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, []);

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
        {/* Underlay — the chosen clip's exact first frame, so there is no
            flash or pose jump while the video buffers. Doubles as the
            reduced-motion / error fallback. */}
        <img
          className="absolute inset-0 h-full w-full object-cover"
          src={showVideo ? clip.poster : heroConfig.posterSrc}
          alt=""
          draggable={false}
        />
        {showVideo && (
          <video
            ref={videoRef}
            className="absolute inset-0 h-full w-full object-cover"
            src={clip.src}
            poster={clip.poster}
            loop
            muted
            playsInline
            autoPlay
            preload="auto"
            disablePictureInPicture
            onError={() => setVideoFailed(true)}
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
