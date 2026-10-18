import { useEffect } from 'react';
import { Link } from 'react-router';
import { ArrowLeft, ArrowUpRight } from 'lucide-react';
import { legalApps, KIND_TITLES, type AppLegal, type LegalKind } from '@/legal/content';

interface LegalLayoutProps {
  app: AppLegal;
  kind: LegalKind;
  children: React.ReactNode;
}

// Documents this app actually publishes, in a stable order — support only
// exists for apps that define it.
function siblingKinds(app: AppLegal, kind: LegalKind): LegalKind[] {
  const all: LegalKind[] = ['privacy', 'terms', 'support'];
  return all.filter((k) => k !== kind && (k !== 'support' || Boolean(app.support)));
}

export function LegalLayout({ app, kind, children }: LegalLayoutProps) {
  const meta = { title: KIND_TITLES[kind] };

  // Reading surface: the document pages are light, the rest of the site dark.
  useEffect(() => {
    document.documentElement.dataset.surface = 'paper';
    return () => {
      delete document.documentElement.dataset.surface;
    };
  }, []);
  const siblings = siblingKinds(app, kind);
  const otherApp = Object.values(legalApps).find((a) => a.slug !== app.slug);

  return (
    <div className="min-h-screen bg-paper">
      <a
        href="#legal-content"
        className="fixed left-4 top-3 z-[60] -translate-y-20 rounded-md bg-ink px-4 py-2 text-sm font-medium text-paper transition-transform focus:translate-y-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2F6BFF] focus-visible:ring-offset-2"
      >
        Skip to document
      </a>
      {/* Top bar */}
      <header className="sticky top-0 z-50 bg-paper/85 backdrop-blur-md border-b border-ink/10">
        <div className="container-large px-6 lg:px-12 h-16 flex items-center justify-between">
          <Link
            to="/"
            className="inline-flex min-h-11 items-center gap-2.5 rounded-md font-display text-lg font-medium tracking-[-0.02em] text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2F6BFF] focus-visible:ring-offset-2"
          >
            <img src="/images/wordmark/letter-5.webp" alt="" draggable={false} className="h-5 w-auto select-none" />
            Snaxx Tech
          </Link>
          <Link
            to="/"
            aria-label="Back to home"
            className="inline-flex h-11 w-11 shrink-0 items-center justify-center gap-2 rounded-md text-sm text-ink-soft transition-colors hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2F6BFF] focus-visible:ring-offset-2 sm:w-auto sm:px-1"
          >
            <ArrowLeft className="w-4 h-4" aria-hidden="true" />
            <span className="hidden sm:inline">Back to home</span>
          </Link>
        </div>
      </header>

      {/* Document header band */}
      <div className="bg-paper-deep/70 border-b border-ink/10">
        <div className="container-large px-6 lg:px-12 py-14 lg:py-20">
          <div className="max-w-3xl">
            {/* App chip */}
            <div className="inline-flex items-center gap-2 rounded-full border border-ink/10 bg-white px-3 py-1.5">
              <span
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: app.accent }}
                aria-hidden="true"
              />
              <span className="label-mono text-ink-soft">
                {app.appName}
              </span>
            </div>

            <h1 className="mt-6 font-display type-headline text-ink">
              {meta.title}
            </h1>

            {kind !== 'support' && (
              <p className="mt-4 text-sm font-geist-mono leading-relaxed text-ink-soft">
                Last updated: {app.lastUpdated ?? app.effectiveDate}
                {app.lastUpdated && app.lastUpdated !== app.effectiveDate && (
                  <> · Effective: {app.effectiveDate}</>
                )}
              </p>
            )}

            <p className="mt-4 text-sm text-ink-soft">
              Android · No Snaxx Tech account · Ad-supported
            </p>

            {/* Cross links */}
            <div className="mt-8 flex flex-wrap items-center gap-3">
              {siblings.map((siblingKind, i) => (
                <Link
                  key={siblingKind}
                  to={`/${app.slug}/${siblingKind}`}
                  className={
                    i === 0
                      ? 'pressable group inline-flex min-h-11 items-center gap-2 rounded-lg bg-ink px-4 py-2.5 text-sm font-medium text-paper transition-colors hover:bg-graphite focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2F6BFF] focus-visible:ring-offset-2'
                      : 'pressable group inline-flex min-h-11 items-center gap-2 rounded-lg border border-ink/10 bg-white px-4 py-2.5 text-sm font-medium text-ink transition-colors hover:bg-paper-deep focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2F6BFF] focus-visible:ring-offset-2'
                  }
                >
                  <span>
                    {app.appName} {KIND_TITLES[siblingKind]}
                  </span>
                  <ArrowUpRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" aria-hidden="true" />
                </Link>
              ))}
              {otherApp && kind !== 'support' && (
                <Link
                  to={`/${otherApp.slug}/${kind}`}
                  className="pressable group inline-flex min-h-11 items-center gap-2 rounded-lg border border-ink/10 bg-white px-4 py-2.5 text-sm font-medium text-ink transition-colors hover:bg-paper-deep focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2F6BFF] focus-visible:ring-offset-2"
                >
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: otherApp.accent }} aria-hidden="true" />
                  <span>
                    {meta.title} for {otherApp.appName}
                  </span>
                  <ArrowUpRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" aria-hidden="true" />
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Body */}
      <main id="legal-content" data-route-focus tabIndex={-1} className="container-large px-6 lg:px-12 py-14 lg:py-20 focus:outline-none">
        {children}
      </main>

      {/* Mini footer */}
      <footer className="border-t border-ink/10">
        <div className="container-large px-6 lg:px-12 py-10">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <p className="text-xs text-ink-soft">© 2026 Snaxx Tech. All rights reserved.</p>
            <nav className="flex flex-wrap gap-x-4" aria-label="App legal documents">
              {Object.values(legalApps).map((a) => (
                <span key={a.slug} className="flex flex-wrap gap-x-4">
                  <Link
                    to={`/${a.slug}/privacy`}
                    className="inline-flex min-h-11 items-center rounded-md text-xs text-ink-soft hover:text-ink transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2F6BFF] focus-visible:ring-offset-2"
                  >
                    {a.appName} Privacy
                  </Link>
                  <Link
                    to={`/${a.slug}/terms`}
                    className="inline-flex min-h-11 items-center rounded-md text-xs text-ink-soft hover:text-ink transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2F6BFF] focus-visible:ring-offset-2"
                  >
                    {a.appName} Terms
                  </Link>
                  {a.support && (
                    <Link
                      to={`/${a.slug}/support`}
                      className="inline-flex min-h-11 items-center rounded-md text-xs text-ink-soft hover:text-ink transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2F6BFF] focus-visible:ring-offset-2"
                    >
                      {a.appName} Support
                    </Link>
                  )}
                </span>
              ))}
            </nav>
          </div>
        </div>
      </footer>
    </div>
  );
}
