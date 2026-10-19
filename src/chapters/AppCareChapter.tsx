import { useEffect, useState, type CSSProperties } from 'react';
import { cn } from '@/lib/utils';
import { appcareConfig } from '@/config';
import { AnimatedButton } from '@/components/AnimatedButton';
import { subscribeAppcare, type AppcareStatus, type FlawState } from '@/experience/sceneState';
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

  return (
    <Chapter id="appcare" height="380vh" align="left" fadeIn={0.05} fadeOutAt={0.95}>
      {/* Phones: the stand sits above, the copy below it. */}
      <div className="w-full max-w-md pt-[44svh] lg:max-w-xl lg:pt-0 shortland:pt-16" style={{ '--accent': appcareConfig.accent } as CSSProperties}>
        <p className="label product-accent flex items-center gap-2.5 text-ink">
          <span className="product-dot" aria-hidden="true" />
          {appcareConfig.name}
          <span className="text-mist">· {appcareConfig.status}</span>
        </p>
        <h2 className="font-display type-headline mt-3 text-ink lg:text-[clamp(2rem,3.6vw,3.25rem)] shortland:text-[2rem]">{appcareConfig.heading}</h2>
        <ul className="mt-6 space-y-2.5" aria-live="polite">
          {appcareConfig.flaws.map((flaw, i) => {
            const state = status.flaws[i] ?? 'hidden';
            return (
              <li key={flaw} className="flex items-center justify-between gap-4 text-sm text-ink sm:text-base">
                <span className={cn('transition-colors duration-300', state === 'mended' && 'text-ink/50 line-through decoration-ink/30')}>{flaw}</span>
                <span className={cn('label shrink-0 rounded-full border px-2.5 py-0.5 transition-colors duration-300', CHIP[state].className)}>{CHIP[state].label}</span>
              </li>
            );
          })}
        </ul>
        <p
          className={cn('mt-4 text-sm font-medium text-ink transition-opacity duration-500', status.allClear ? 'opacity-100' : 'opacity-0')}
          aria-hidden={!status.allClear}
        >
          {appcareConfig.clear}
        </p>
        <p className="mt-5 hidden text-sm leading-relaxed text-ink/80 sm:block shortland:hidden">{appcareConfig.body}</p>
        <div className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-3">
          <AnimatedButton href={`mailto:${appcareConfig.email}?subject=AppCare`} variant="primary" size="md">
            {appcareConfig.cta}
          </AnimatedButton>
          <span className="text-sm text-mist">{appcareConfig.terms}</span>
        </div>
        <p className="mt-4 text-[0.8125rem] text-mist">{appcareConfig.caption}</p>
      </div>
    </Chapter>
  );
}
