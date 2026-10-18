import { useEffect, useRef, useState, type MouseEvent } from 'react';
import { ArrowDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { heroConfig } from '@/config';
import { AnimatedButton } from '@/components/AnimatedButton';
import { scrollToHash } from '@/lib/scroll';
import { useChapterReveal } from '@/hooks/useChapterReveal';

export function HeroChapter({ awake }: { awake: boolean }) {
  const section = useRef<HTMLElement>(null);
  const copy = useRef<HTMLDivElement>(null);
  const [tick, setTick] = useState(0);
  useChapterReveal(section, copy, { fadeIn: 0, fadeOutAt: 0.5 });

  useEffect(() => {
    if (!awake) return;
    const id = window.setInterval(() => setTick((t) => (t + 1) % 3), 2400);
    return () => window.clearInterval(id);
  }, [awake]);

  const onPrimary = (e: MouseEvent<HTMLElement>) => {
    e.preventDefault();
    scrollToHash(heroConfig.primaryCta.href);
  };

  const reveal = (delay: number) =>
    cn(
      'transition-[opacity,transform] duration-1000 ease-out-quart',
      awake ? 'translate-y-0 opacity-100' : 'translate-y-5 opacity-0',
    ) + ` [transition-delay:${delay}ms]`;

  return (
    <section id="hero" ref={section} className="relative" style={{ height: '160vh' }}>
      <div className="chapter-stage">
        <div className="container-large w-full px-6 lg:px-12">
          <div ref={copy} className="chapter-copy flex w-full items-end lg:items-center">
            <div className="w-full max-w-2xl pb-24 pt-28 lg:pb-0 lg:pt-0">
              <p className={cn('label-mono flex items-center gap-3 text-mist', reveal(150))} style={{ transitionDelay: '150ms' }}>
                <span className="product-dot" style={{ '--accent': 'var(--ember)' } as React.CSSProperties} aria-hidden="true" />
                {heroConfig.eyebrow}
              </p>
              <h1 className={cn('font-display type-display mt-6 text-ink', reveal(350))} style={{ transitionDelay: '350ms' }}>
                <span className="block">{heroConfig.headline[0]}</span>
                <span className="block text-ink/60">{heroConfig.headline[1]}</span>
              </h1>
              <p className={cn('type-lead mt-7 max-w-lg', reveal(600))} style={{ transitionDelay: '600ms' }}>
                {heroConfig.intro}
              </p>
              <div className={cn('mt-9 flex flex-wrap items-center gap-3', reveal(800))} style={{ transitionDelay: '800ms' }}>
                <AnimatedButton href={heroConfig.primaryCta.href} variant="primary" size="lg" showIcon onClick={onPrimary}>
                  {heroConfig.primaryCta.label}
                </AnimatedButton>
                <AnimatedButton href={heroConfig.secondaryCta.href} variant="outline" size="lg" external>
                  {heroConfig.secondaryCta.label}
                </AnimatedButton>
              </div>
              <ul className={cn('mt-12 hidden items-center gap-8 sm:flex', reveal(1100))} style={{ transitionDelay: '1100ms' }} aria-hidden="true">
                {heroConfig.readouts.map((r, i) => (
                  <li key={r} className="label-mono flex items-center gap-2 text-[0.625rem] text-mist">
                    <span className={cn('h-1.5 w-1.5 rounded-full transition-colors duration-500', tick === i ? 'bg-ember' : 'bg-ink/20')} />
                    {r}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        <div
          className={cn(
            'pointer-events-none absolute bottom-7 left-1/2 z-10 hidden -translate-x-1/2 items-center gap-2 transition-opacity duration-1000 sm:flex',
            awake ? 'opacity-100' : 'opacity-0',
          )}
          style={{ transitionDelay: '1500ms' }}
          aria-hidden="true"
        >
          <span className="label-mono text-[0.625rem] text-mist">Scroll to open</span>
          <ArrowDown className="scroll-cue h-3.5 w-3.5 text-mist" />
        </div>
      </div>
    </section>
  );
}
