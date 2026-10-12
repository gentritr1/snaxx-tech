import { cn } from '@/lib/utils';
import { navigationConfig } from '@/config';

interface PageOverlayProps {
  isVisible: boolean;
}

/** Boot screen shown while the 3D stage compiles. */
export function PageOverlay({ isVisible }: PageOverlayProps) {
  return (
    <div
      className={cn('page-overlay', !isVisible && 'hidden')}
      role="status"
      aria-live="polite"
      aria-label={isVisible ? 'Loading Snaxx Tech' : undefined}
    >
      <div className="flex flex-col items-center gap-6">
        <div className="flex items-center gap-3">
          <img src="/images/wordmark/letter-5.webp" alt="" draggable={false} className="h-7 w-auto select-none" />
          <span className="font-display text-xl font-medium tracking-[-0.02em] text-silver">{navigationConfig.logo}</span>
        </div>
        <div className="h-px w-28 overflow-hidden rounded-full bg-steel">
          <div className="boot-bar h-full w-1/3 rounded-full bg-ember" />
        </div>
        <span className="label-mono text-mist">Preheating the core</span>
      </div>
    </div>
  );
}
