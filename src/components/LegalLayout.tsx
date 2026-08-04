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
  const siblings = siblingKinds(app, kind);
  const otherApp = Object.values(legalApps).find((a) => a.slug !== app.slug);

  return (
    <div className="min-h-screen bg-almanac-paper">
      <a
        href="#legal-content"
        className="fixed left-4 top-3 z-[60] -translate-y-20 rounded-md bg-almanac-ink-strong px-4 py-2 text-sm font-medium text-almanac-paper transition-transform focus:translate-y-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-almanac-blue focus-visible:ring-offset-2"
      >
        Skip to document
      </a>
      {/* Top bar */}
      <header className="sticky top-0 z-50 bg-almanac-paper/90 backdrop-blur-md border-b border-almanac-ink-faint">
        <div className="container-large px-6 lg:px-12 h-16 flex items-center justify-between">
          <Link
            to="/"
            className="inline-flex min-h-11 items-center rounded-md font-display text-xl font-semibold tracking-wide text-almanac-ink-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-almanac-blue focus-visible:ring-offset-2"
          >
            Snaxx Tech
          </Link>
          <Link
            to="/"
            aria-label="Back to home"
            className="inline-flex h-11 w-11 shrink-0 items-center justify-center gap-2 rounded-md text-sm text-almanac-ink-soft transition-colors hover:text-almanac-ink-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-almanac-blue focus-visible:ring-offset-2 sm:w-auto sm:px-1"
          >
            <ArrowLeft className="w-4 h-4" aria-hidden="true" />
            <span className="hidden sm:inline">Back to home</span>
          </Link>
        </div>
      </header>

      {/* Document header band */}
      <div className="bg-almanac-paper-deep/50 border-b border-almanac-ink-faint">
        <div className="container-large px-6 lg:px-12 py-14 lg:py-20">
          <div className="max-w-3xl">
            {/* App chip */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-almanac-paper-card border border-almanac-ink-faint rounded-full">
              <span
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: app.accent }}
                aria-hidden="true"
              />
              <span className="text-xs font-geist-mono uppercase tracking-widest text-almanac-ink-soft">
                {app.appName}
              </span>
            </div>

            <h1 className="mt-6 font-display text-4xl lg:text-6xl font-semibold tracking-tight text-almanac-ink-strong">
              {meta.title}
            </h1>

            {kind !== 'support' && (
              <p className="mt-4 text-sm font-geist-mono leading-relaxed text-almanac-ink-soft">
                Last updated: {app.lastUpdated ?? app.effectiveDate}
                {app.lastUpdated && app.lastUpdated !== app.effectiveDate && (
                  <> · Effective: {app.effectiveDate}</>
                )}
              </p>
            )}

            <p className="mt-4 text-sm text-almanac-ink-soft">
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
                      ? 'pressable group inline-flex min-h-11 items-center gap-2 rounded-lg bg-almanac-ink-strong px-4 py-2.5 text-sm font-medium text-almanac-paper transition-colors hover:bg-almanac-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-almanac-blue focus-visible:ring-offset-2'
                      : 'pressable group inline-flex min-h-11 items-center gap-2 rounded-lg border border-almanac-ink-faint bg-almanac-paper-card px-4 py-2.5 text-sm font-medium text-almanac-ink transition-colors hover:bg-almanac-paper-deep/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-almanac-blue focus-visible:ring-offset-2'
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
                  className="pressable group inline-flex min-h-11 items-center gap-2 rounded-lg border border-almanac-ink-faint bg-almanac-paper-card px-4 py-2.5 text-sm font-medium text-almanac-ink transition-colors hover:bg-almanac-paper-deep/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-almanac-blue focus-visible:ring-offset-2"
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
      <footer className="border-t border-almanac-ink-faint">
        <div className="container-large px-6 lg:px-12 py-10">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <p className="text-xs text-almanac-ink-soft">© 2026 Snaxx Tech. All rights reserved.</p>
            <nav className="flex flex-wrap gap-x-4" aria-label="App legal documents">
              {Object.values(legalApps).map((a) => (
                <span key={a.slug} className="flex flex-wrap gap-x-4">
                  <Link
                    to={`/${a.slug}/privacy`}
                    className="inline-flex min-h-11 items-center rounded-md text-xs text-almanac-ink-soft hover:text-almanac-ink-strong transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-almanac-blue focus-visible:ring-offset-2"
                  >
                    {a.appName} Privacy
                  </Link>
                  <Link
                    to={`/${a.slug}/terms`}
                    className="inline-flex min-h-11 items-center rounded-md text-xs text-almanac-ink-soft hover:text-almanac-ink-strong transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-almanac-blue focus-visible:ring-offset-2"
                  >
                    {a.appName} Terms
                  </Link>
                  {a.support && (
                    <Link
                      to={`/${a.slug}/support`}
                      className="inline-flex min-h-11 items-center rounded-md text-xs text-almanac-ink-soft hover:text-almanac-ink-strong transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-almanac-blue focus-visible:ring-offset-2"
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
