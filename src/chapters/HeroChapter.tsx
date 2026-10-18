import { useRef, type MouseEvent } from 'react';
import { ArrowDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { heroConfig } from '@/config';
import { AnimatedButton } from '@/components/AnimatedButton';
import { scrollToHash } from '@/lib/scroll';
import { useChapterReveal } from '@/hooks/useChapterReveal';

export function HeroChapter({ awake }: { awake: boolean }) {
  const section = useRef<HTMLElement>(null);
  const copy = useRef<HTMLDivElement>(null);
  useChapterReveal(section, copy, { fadeIn: 0, fadeOutAt: 0.5 });

  const onPrimary = (e: MouseEvent<HTMLElement>) => {
    e.preventDefault();
    scrollToHash(heroConfig.primaryCta.href);
  };

  return (
    <section id="hero" ref={section} className="relative" style={{ height: '160vh' }}>
      <div className="chapter-stage">
        {/* Phones: copy sits on the bottom of the screen, the core above it. */}
        <div className="container-large w-full self-end px-6 lg:self-auto lg:px-12">
          <div ref={copy} className="chapter-copy flex w-full items-end lg:items-center">
            <div className="w-full max-w-2xl pb-10 lg:pb-0">
              <h1 className="hero-rise font-display type-display text-ink">
                <span className="block">{heroConfig.headline[0]}</span>
                <span className="block">{heroConfig.headline[1]}</span>
              </h1>
              <p className="hero-rise type-lead mt-7 max-w-lg" style={{ animationDelay: '120ms' }}>
                {heroConfig.intro}
              </p>
              <div className="hero-rise mt-9 flex flex-wrap items-center gap-3" style={{ animationDelay: '240ms' }}>
                <AnimatedButton href={heroConfig.primaryCta.href} variant="primary" size="lg" showIcon onClick={onPrimary}>
                  {heroConfig.primaryCta.label}
                </AnimatedButton>
                <AnimatedButton href={heroConfig.secondaryCta.href} variant="outline" size="lg" external>
                  {heroConfig.secondaryCta.label}
                </AnimatedButton>
              </div>
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
          <span className="label text-mist">Scroll to open</span>
          <ArrowDown className="scroll-cue h-3.5 w-3.5 text-mist" />
        </div>
      </div>
    </section>
  );
}
