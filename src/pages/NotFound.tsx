import { useEffect } from 'react';
import { Link } from 'react-router';
import { ArrowUpRight } from 'lucide-react';

export default function NotFound() {
  useEffect(() => {
    document.title = 'Page Not Found — Snaxx Tech';
    document.documentElement.dataset.surface = 'void';
    return () => {
      document.title = 'Snaxx Tech — Bite-sized apps & games';
      delete document.documentElement.dataset.surface;
    };
  }, []);

  return (
    <div className="page-enter relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-void px-6 text-center text-ink">
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center" aria-hidden="true">
        <div className="h-[60vmin] w-[60vmin] rounded-full border border-ink/10" />
        <div className="absolute h-[40vmin] w-[40vmin] rounded-full border border-ink/10" />
        <div className="absolute h-[18vmin] w-[18vmin] rounded-full bg-ember-soft/40 blur-3xl" />
      </div>

      <div className="relative z-10 flex flex-col items-center">
        <p className="label text-ember">Error 404</p>
        <h1 className="font-display type-headline mt-5 text-ink">This shelf of the pantry is empty.</h1>
        <p className="type-lead mt-5 max-w-md">The page you asked for is not here. The rest of the snacks are.</p>
        <Link
          to="/"
          className="pressable group mt-10 inline-flex min-h-11 items-center gap-2 rounded-lg bg-ink px-6 py-3 text-sm font-medium text-cream transition-colors hover:bg-cocoa focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ember focus-visible:ring-offset-2 focus-visible:ring-offset-void"
        >
          <span>Back to Snaxx Tech</span>
          <ArrowUpRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" aria-hidden="true" />
        </Link>
      </div>
    </div>
  );
}
