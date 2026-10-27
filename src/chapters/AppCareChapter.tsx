import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { cn } from '@/lib/utils';
import { appcareConfig } from '@/config';
import { AnimatedButton } from '@/components/AnimatedButton';
import { sceneState, subscribeAppcare, type AppcareStatus, type FlawState } from '@/experience/sceneState';
import { Chapter } from './Chapter';

const CHIP: Record<FlawState, { label: string; className: string }> = {
  hidden: { label: 'Hidden', className: 'border-ink/20 text-mist' },
  found: { label: 'Found', className: 'border-transparent bg-caramel text-ink' },
  mended: { label: 'Mended', className: 'border-transparent bg-ink text-cream' },
};

/** AppCare: the loupe in the 3D stage finds three flaws; this list mirrors it. */
export function AppCareChapter() {
  const [status, setStatus] = useState<AppcareStatus>({ flaws: ['hidden', 'hidden', 'hidden'], allClear: false });
  useEffect(() => subscribeAppcare(setStatus), []);

  // Tell the 3D stand where the copy starts, so on phones it fits the space above.
  const copyRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = copyRef.current;
    if (!el) return;
    // Bottom-anchored on phones (pb-6 = 24px), so its top is stage height minus
    // its own height. offsetTop would read 0: the animated wrapper is the offsetParent.
    const stage = el.closest<HTMLElement>('.chapter-stage');
    const measure = () => {
      sceneState.appcareCopyTop = (stage?.clientHeight ?? window.innerHeight) - el.offsetHeight - 24;
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    window.addEventListener('resize', measure);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', measure);
    };
  }, []);

  return (
    <Chapter id="appcare" height="320vh" align="left" fadeIn={0.05} fadeOutAt={0.95} anchorBottomOnPhone>
      {/* Phones: the copy sits on the bottom of the screen and the stand fits the space above it. */}
      <div ref={copyRef} className="copy-scrim w-full max-w-md lg:max-w-xl shortland:max-w-xl shortland:pt-16" style={{ '--accent': appcareConfig.accent } as CSSProperties}>
        <p className="label product-accent flex items-center gap-2.5 text-ink">
          <span className="product-dot" aria-hidden="true" />
          {appcareConfig.name}
          <span className="text-mist">· {appcareConfig.status}</span>
        </p>
        <h2 className="font-display type-headline mt-3 text-ink lg:text-[clamp(2rem,3.6vw,3.25rem)] shortland:text-[2rem]">{appcareConfig.heading}</h2>
        <div className="relative">
        <ul className="mt-5 space-y-2 sm:mt-6 sm:space-y-2.5 shortland:mt-3 shortland:space-y-1" aria-live="polite">
          {appcareConfig.flaws.map((flaw, i) => {
            const state = status.flaws[i] ?? 'hidden';
            return (
              <li key={flaw} className="flex items-center justify-between gap-4 text-sm text-ink sm:text-base">
                <span className={cn('transition-colors duration-300', state === 'mended' && 'text-mist line-through decoration-ink/30')}>{flaw}</span>
                <span className={cn('label shrink-0 rounded-full border px-2.5 py-0.5 transition-colors duration-300', CHIP[state].className)}>{CHIP[state].label}</span>
              </li>
            );
          })}
        </ul>
        {/* Overlays the gap above the button instead of reserving its own row. */}
        <p
          className={cn('absolute left-0 top-full mt-2 text-sm font-medium text-ink transition-opacity duration-500', status.allClear ? 'opacity-100' : 'opacity-0')}
          aria-hidden={!status.allClear}
        >
          {appcareConfig.clear}
        </p>
        </div>
        {/* Portrait phones get the one-line version, so what AppCare does is never hidden. Short
            screens (landscape phones, 320x568) have no room for it: the price line and the
            disclaimer below come first. */}
        <p className="mt-9 text-sm leading-relaxed text-ink/80 sm:hidden [@media(max-height:600px)]:hidden">{appcareConfig.summary}</p>
        <p className="mt-5 hidden text-sm leading-relaxed text-ink/80 sm:block shortland:hidden">{appcareConfig.body}</p>
        <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 sm:mt-10 shortland:mt-3">
          <AnimatedButton href={`mailto:${appcareConfig.email}?subject=${encodeURIComponent('Tell me when AppCare is on sale')}`} variant="primary" size="md">
            {appcareConfig.cta}
          </AnimatedButton>
          <span className="text-[0.8125rem] text-mist sm:text-sm shortland:text-[0.8125rem]">{appcareConfig.terms}</span>
        </div>
        <p className="mt-3 text-[0.8125rem] text-mist">{appcareConfig.caption}</p>
      </div>
    </Chapter>
  );
}
