import { useEffect } from 'react';
import { Link } from 'react-router';
import { ArrowUpRight, Target } from 'lucide-react';

// Playful, arrow-themed 404 — matches the dark cinematic hero aesthetic.
export default function NotFound() {
  useEffect(() => {
    document.title = 'Page Not Found — Snaxx Tech';
    return () => {
      document.title = 'Snaxx Tech — Indie Apps & Games Studio';
    };
  }, []);

  return (
    <div className="relative min-h-screen bg-neutral-900 flex flex-col items-center justify-center px-6 text-center overflow-hidden">
      {/* Faint crosshair backdrop, echoing the hero */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-[0.06]">
        <div className="w-[1px] h-full bg-white" />
        <div className="absolute w-full h-[1px] bg-white" />
      </div>

      <div className="relative z-10 flex flex-col items-center">
        <Target className="notfound-arrow w-14 h-14 text-white/80" aria-hidden="true" />

        <p className="mt-8 text-xs font-geist-mono uppercase tracking-[0.3em] text-white/40">
          Error 404
        </p>
        <h1 className="mt-4 text-4xl lg:text-6xl font-black text-white tracking-[-0.04em] leading-[0.95]">
          You aimed off target.
        </h1>
        <p className="mt-6 max-w-md text-white/60 leading-relaxed">
          This page doesn&apos;t exist — but our apps do. Let&apos;s get you back to solid ground.
        </p>

        <Link
          to="/"
          className="group mt-10 inline-flex items-center gap-2 px-6 py-3 bg-white text-exvia-black text-sm font-geist-mono rounded-full hover:bg-white/90 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-900 focus-visible:ring-white"
        >
          <span>Back to Snaxx Tech</span>
          <ArrowUpRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
        </Link>
      </div>
    </div>
  );
}
