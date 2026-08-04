import { useEffect } from 'react';
import { Link } from 'react-router';
import { ArrowUpRight, Target } from 'lucide-react';

// Playful, arrow-themed 404 — an ink-band page matching the Almanac theme.
export default function NotFound() {
  useEffect(() => {
    document.title = 'Page Not Found — Snaxx Tech';
    return () => {
      document.title = 'Snaxx Tech — Indie Apps & Games Studio';
    };
  }, []);

  return (
    <div className="page-enter relative min-h-screen bg-almanac-ink-strong flex flex-col items-center justify-center px-6 text-center overflow-hidden">
      {/* Faint crosshair backdrop, echoing the hero */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-[0.06]">
        <div className="w-[1px] h-full bg-almanac-paper" />
        <div className="absolute w-full h-[1px] bg-almanac-paper" />
      </div>

      <div className="relative z-10 flex flex-col items-center">
        <Target className="notfound-arrow w-14 h-14 text-almanac-paper/80" aria-hidden="true" />

        <p className="mt-8 text-xs font-geist-mono uppercase tracking-[0.3em] text-almanac-paper/50">
          Error 404
        </p>
        <h1 className="mt-4 font-display text-4xl lg:text-6xl font-semibold text-almanac-paper tracking-normal leading-[0.95]">
          You aimed off target.
        </h1>
        <p className="mt-6 max-w-md text-almanac-paper/70 leading-relaxed">
          This page doesn&apos;t exist — but our apps do. Let&apos;s get you back to solid ground.
        </p>

        <Link
          to="/"
          className="group pressable mt-10 inline-flex items-center gap-2 px-6 py-3 bg-almanac-paper text-almanac-ink-strong text-sm font-geist-mono rounded-full hover:bg-almanac-paper/90 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-almanac-ink-strong focus-visible:ring-almanac-paper"
        >
          <span>Back to Snaxx Tech</span>
          <ArrowUpRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
        </Link>
      </div>
    </div>
  );
}
