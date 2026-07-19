import { Component, Suspense, lazy, useEffect, useState, type ReactNode } from 'react';
import { ArrowDown, Sparkle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { heroConfig } from '@/config';

// three.js / drei / fiber live behind this lazy boundary so they land in a
// separate chunk — the main entry (and legal-page visitors) never pay for them.
const HeroCanvas = lazy(() => import('@/components/HeroCanvas'));

/** Cheap, synchronous WebGL feature-detect on a throwaway canvas. */
function detectWebGL(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const canvas = document.createElement('canvas');
    return !!(
      window.WebGLRenderingContext &&
      (canvas.getContext('webgl2') || canvas.getContext('webgl'))
    );
  } catch {
    return false;
  }
}

/** Static dark backdrop shown while the 3D chunk loads or when it can't run. */
function HeroBackdrop() {
  return (
    <div className="absolute inset-0 bg-[#131313] bg-[radial-gradient(ellipse_at_50%_40%,rgba(45,140,255,0.10),transparent_55%),radial-gradient(ellipse_at_70%_70%,rgba(255,122,41,0.08),transparent_55%)]" />
  );
}

/**
 * Isolates the 3D canvas: if the lazy chunk fails to load/evaluate, WebGL is
 * lost, or the scene throws at runtime, we fall back to the static backdrop
 * instead of unmounting the whole page. The wordmark/nav overlay is rendered
 * outside this boundary and always stays visible.
 */
class CanvasBoundary extends Component<{ children: ReactNode; fallback: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}

export function Hero() {
  // Hooks must run unconditionally — keep them above any early return.
  const [isLoaded, setIsLoaded] = useState(false);
  const [webglOk] = useState(detectWebGL);
  const [reducedMotion, setReducedMotion] = useState(
    () =>
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
  );

  useEffect(() => {
    const timer = setTimeout(() => setIsLoaded(true), 300);
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

  if (!heroConfig.name && heroConfig.roles.length === 0) return null;

  return (
    <section id="hero" className="relative w-full min-h-screen overflow-hidden bg-exvia-black">
      {/* 3D playground — decorative; screen readers get the wordmark below. */}
      <div
        aria-hidden="true"
        className={cn(
          'absolute inset-0 transition-opacity duration-[1400ms]',
          isLoaded ? 'opacity-100' : 'opacity-0'
        )}
      >
        {webglOk ? (
          <CanvasBoundary fallback={<HeroBackdrop />}>
            <Suspense fallback={<HeroBackdrop />}>
              <HeroCanvas reducedMotion={reducedMotion} />
            </Suspense>
          </CanvasBoundary>
        ) : (
          <HeroBackdrop />
        )}
      </div>

      {/* soft vignette so the overlay text always pops */}
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_center,transparent_45%,rgba(19,19,19,0.55)_100%)]" />

      {/* Role labels on sides */}
      {heroConfig.roles[0] && (
        <div
          className={cn(
            'hidden lg:block absolute left-8 lg:left-16 top-1/2 -translate-y-1/2 z-30 pointer-events-none transition-all duration-[1200ms] ease-out-quart',
            isLoaded ? 'opacity-100' : 'opacity-0'
          )}
          style={{ transitionDelay: '800ms' }}
        >
          <span className="text-xs font-geist-mono uppercase tracking-[0.3em] text-white/70">
            {heroConfig.roles[0]}
          </span>
        </div>
      )}
      {heroConfig.roles[1] && (
        <div
          className={cn(
            'hidden lg:block absolute right-8 lg:right-16 top-1/2 -translate-y-1/2 z-30 pointer-events-none transition-all duration-[1200ms] ease-out-quart',
            isLoaded ? 'opacity-100' : 'opacity-0'
          )}
          style={{ transitionDelay: '900ms' }}
        >
          <span className="text-xs font-geist-mono uppercase tracking-[0.3em] text-white/70">
            {heroConfig.roles[1]}
          </span>
        </div>
      )}

      {/* Bottom content */}
      <div className="relative z-30 flex flex-col items-center justify-end min-h-screen px-6 lg:px-12 pointer-events-none">
        <div
          className={cn(
            'text-center transition-all duration-[1200ms] ease-out-quart pb-10 md:pb-14',
            isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          )}
          style={{ transitionDelay: '600ms' }}
        >
          {/* playful indie badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 mb-6 border border-white/15 bg-white/5 backdrop-blur-sm rounded-full">
            <Sparkle className="w-3.5 h-3.5 text-[#FFD166]" />
            <span className="text-[0.7rem] font-geist-mono uppercase tracking-[0.25em] text-white/75">
              Indie &amp; proud — we make the fun stuff
            </span>
          </div>

          <h1 className="text-[clamp(3rem,12vw,12rem)] font-black text-white tracking-[-0.04em] leading-[0.85]">
            {heroConfig.name}
          </h1>
        </div>
      </div>

      {/* scroll cue */}
      <div
        className={cn(
          'absolute bottom-8 right-8 lg:right-12 z-30 pointer-events-none hidden sm:flex items-center gap-2 transition-opacity duration-1000',
          isLoaded ? 'opacity-100' : 'opacity-0'
        )}
        style={{ transitionDelay: '1400ms' }}
      >
        <span className="text-[0.65rem] font-geist-mono uppercase tracking-[0.25em] text-white/45">
          scroll
        </span>
        <ArrowDown className="w-3.5 h-3.5 text-white/45 animate-bounce" />
      </div>
    </section>
  );
}
