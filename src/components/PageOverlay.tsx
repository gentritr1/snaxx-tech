import { cn } from '@/lib/utils';

interface PageOverlayProps {
  isVisible: boolean;
}

/** Curtain over the 3D stage while it compiles; the copy stays readable above it. */
export function PageOverlay({ isVisible }: PageOverlayProps) {
  return (
    <div
      className={cn('page-overlay', !isVisible && 'hidden')}
      role="status"
      aria-live="polite"
      aria-label={isVisible ? 'Loading Snaxx Tech' : undefined}
    >
      <div className="flex flex-col items-center gap-4">
        <div className="h-px w-28 overflow-hidden rounded-full bg-steel">
          <div className="boot-bar h-full w-1/3 rounded-full bg-ember" />
        </div>
        <span className="label text-mist">Preheating the core</span>
      </div>
    </div>
  );
}
