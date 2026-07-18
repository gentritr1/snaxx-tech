import { cn } from '@/lib/utils';

// Infinite ticker bridging the dark hero and the white About section.
// Two identical sequences slide left by 50% for a seamless loop; CSS pauses
// on hover and disables the animation under prefers-reduced-motion.

const ITEMS = ['ARROWS', 'ROWFLARE', 'FJALË', 'MORE IN THE LAB', 'EST. 2026'];

function Sequence() {
  return (
    <>
      {ITEMS.map((item, i) => (
        <span key={i} className="inline-flex items-center">
          <span className="px-6 text-sm font-geist-mono uppercase tracking-[0.2em] text-white/80">
            {item}
          </span>
          <span aria-hidden="true" className="text-white/30">
            ✦
          </span>
        </span>
      ))}
    </>
  );
}

export function Marquee() {
  return (
    <div className="w-full bg-exvia-black border-y border-white/10 py-4 overflow-hidden">
      <div className={cn('marquee')} aria-hidden="true">
        <div className="marquee-track">
          {/* Two copies so translateX(-50%) wraps seamlessly */}
          <Sequence />
          <Sequence />
        </div>
      </div>
      {/* Accessible, non-animated label for screen readers */}
      <span className="sr-only">Snaxx Tech apps: Arrows, Rowflare, FJALË, and more in the lab. Established 2026.</span>
    </div>
  );
}
