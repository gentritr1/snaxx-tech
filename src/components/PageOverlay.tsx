import { } from 'react';
import { cn } from '@/lib/utils';
import { siteConfig } from '@/config';

interface PageOverlayProps {
  isVisible: boolean;
}

export function PageOverlay({ isVisible }: PageOverlayProps) {
  return (
    <div
      className={cn(
        'fixed inset-0 z-[9999] bg-almanac-paper flex items-center justify-center transition-opacity duration-500 ease-out-cubic',
        isVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'
      )}
    >
      <div className="flex flex-col items-center gap-4">
        <span className="text-2xl font-display font-semibold tracking-wide text-almanac-ink-strong animate-pulse">
          {siteConfig.title || 'Loading'}
        </span>
        <div className="w-24 h-0.5 bg-almanac-paper-deep rounded-full overflow-hidden">
          <div className="h-full bg-almanac-ink animate-[slide_1s_ease-in-out_infinite] w-1/3 rounded-full" />
        </div>
      </div>

      <style>{`
        @keyframes slide {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(400%); }
        }
      `}</style>
    </div>
  );
}
