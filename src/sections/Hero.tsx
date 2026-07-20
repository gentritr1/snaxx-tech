import { Component, Suspense, lazy, useCallback, useEffect, useState, type ReactNode } from 'react';
import { ArrowDown, Sparkle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { heroConfig } from '@/config';
import { playMiniPop } from '@/utils/popSound';

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
  const [biteKey, setBiteKey] = useState(0);
  const [biteStage, setBiteStage] = useState(0); // 0 = whole, 1 = first chomp, 2 = bitten

  // Two-step chomp, JS-timed so the mask itself never needs to animate.
  useEffect(() => {
    const letterCount = heroConfig.name.length;
    // First replay (biteKey > 0) chomps immediately; on load, wait for the
    // slowest letter to land (600ms base + stagger + duration) plus a beat.
    const startDelay = biteKey === 0 ? 600 + 110 * (letterCount - 1) + 450 + 500 : 0;
    const t1 = setTimeout(() => setBiteStage(1), startDelay);
    const t2 = setTimeout(() => setBiteStage(2), startDelay + 140);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [biteKey]);

  // Replay the chomp on demand — click is a user gesture, so sound is allowed.
  const replayBite = useCallback(() => {
    setBiteStage(0); // heal for a blink, then the effect re-chomps
    setBiteKey((k) => k + 1);
    playMiniPop();
  }, []);
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
            'hidden lg:block absolute left-8 lg:left-16 top-1/2 -translate-y-1/2 z-30 pointer-events-none transition-[opacity,transform] duration-[1200ms] ease-out-quart',
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
            'hidden lg:block absolute right-8 lg:right-16 top-1/2 -translate-y-1/2 z-30 pointer-events-none transition-[opacity,transform] duration-[1200ms] ease-out-quart',
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
            'text-center transition-[opacity,transform] duration-[1200ms] ease-out-quart pb-10 md:pb-14',
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

          {/* Wordmark: letters land right-to-left, then the last X gets bitten
              (SNAXX ≈ snacks). Click replays the chomp with a soft pop. */}
          <h1
            role="button"
            tabIndex={0}
            aria-label={`${heroConfig.name} — take a bite`}
            onClick={replayBite}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                replayBite();
              }
            }}
            className="text-[clamp(3rem,12vw,12rem)] font-black text-white tracking-[-0.04em] leading-[0.85] pointer-events-auto cursor-pointer select-none rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
          >
            {heroConfig.name.split('').map((_, i, letters) => {
              const style = { '--i': letters.length - 1 - i } as React.CSSProperties;
              const glyph = (
                <img
                  src={`/images/wordmark/letter-${i + 1}.webp`}
                  alt=""
                  draggable={false}
                  fetchPriority="high"
                  className="snaxx-glyph"
                />
              );
              if (i !== letters.length - 1) {
                return (
                  <span key={i} aria-hidden="true" className="snaxx-letter" style={style}>
                    {glyph}
                  </span>
                );
              }
              return (
                <span key={i} aria-hidden="true" className="snaxx-letter relative" style={style}>
                  <span
                    key={`bite-${biteKey}`}
                    className={cn('snaxx-bitten', biteStage >= 1 && 'bite-wobble')}
                  >
                    {glyph}
                  </span>
                  {biteStage >= 2 && (
                    <>
                      <span
                        key={`c1-${biteKey}`}
                        className="snaxx-crumb"
                        style={{ top: '4%', right: '-3%', '--cx': '1.4rem', '--cy': '-0.6rem' } as React.CSSProperties}
                      />
                      <span
                        key={`c2-${biteKey}`}
                        className="snaxx-crumb"
                        style={{ top: '14%', right: '-5%', '--cx': '1.8rem', '--cy': '0.4rem' } as React.CSSProperties}
                      />
                      <span
                        key={`c3-${biteKey}`}
                        className="snaxx-crumb"
                        style={{ top: '24%', right: '-1%', '--cx': '1rem', '--cy': '1rem' } as React.CSSProperties}
                      />
                    </>
                  )}
                </span>
              );
            })}
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
