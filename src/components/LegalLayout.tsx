import { Link } from 'react-router';
import { ArrowLeft, ArrowUpRight } from 'lucide-react';
import { legalApps, type AppLegal } from '@/legal/content';

export type LegalKind = 'privacy' | 'terms';

interface LegalLayoutProps {
  app: AppLegal;
  kind: LegalKind;
  children: React.ReactNode;
}

const KIND_META: Record<LegalKind, { title: string; sibling: LegalKind; siblingTitle: string }> = {
  privacy: { title: 'Privacy Policy', sibling: 'terms', siblingTitle: 'Terms of Service' },
  terms: { title: 'Terms of Service', sibling: 'privacy', siblingTitle: 'Privacy Policy' },
};

export function LegalLayout({ app, kind, children }: LegalLayoutProps) {
  const meta = KIND_META[kind];
  const otherApp = Object.values(legalApps).find((a) => a.slug !== app.slug);

  return (
    <div className="min-h-screen bg-white">
      <a
        href="#legal-content"
        className="fixed left-4 top-3 z-[60] -translate-y-20 rounded-md bg-exvia-black px-4 py-2 text-sm font-medium text-white transition-transform focus:translate-y-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-exvia-focus focus-visible:ring-offset-2"
      >
        Skip to document
      </a>
      {/* Top bar */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-exvia-border">
        <div className="container-large px-6 lg:px-12 h-16 flex items-center justify-between">
          <Link
            to="/"
            className="inline-flex min-h-11 items-center rounded-md text-lg font-semibold tracking-tight text-exvia-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-exvia-focus focus-visible:ring-offset-2"
          >
            Snaxx Tech
          </Link>
          <Link
            to="/"
            aria-label="Back to home"
            className="inline-flex h-11 w-11 shrink-0 items-center justify-center gap-2 rounded-md text-sm text-exvia-black/60 transition-colors hover:text-exvia-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-exvia-focus focus-visible:ring-offset-2 sm:w-auto sm:px-1"
          >
            <ArrowLeft className="w-4 h-4" aria-hidden="true" />
            <span className="hidden sm:inline">Back to home</span>
          </Link>
        </div>
      </header>

      {/* Document header band */}
      <div className="bg-exvia-subtle/40 border-b border-exvia-border">
        <div className="container-large px-6 lg:px-12 py-14 lg:py-20">
          <div className="max-w-3xl">
            {/* App chip */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-white border border-exvia-border rounded-full">
              <span
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: app.accent }}
                aria-hidden="true"
              />
              <span className="text-xs font-geist-mono uppercase tracking-widest text-exvia-black/70">
                {app.appName}
              </span>
            </div>

            <h1 className="mt-6 text-4xl lg:text-6xl font-semibold tracking-tight text-exvia-black">
              {meta.title}
            </h1>

            <p className="mt-4 text-sm font-geist-mono leading-relaxed text-exvia-black/60">
              Last updated: {app.effectiveDate}
            </p>

            <p className="mt-4 text-sm text-exvia-black/60">
              Android · No Snaxx Tech account · Ad-supported
            </p>

            {/* Cross links */}
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link
                to={`/${meta.sibling}/${app.slug}`}
                className="pressable group inline-flex min-h-11 items-center gap-2 rounded-lg bg-exvia-black px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-exvia-black/85 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-exvia-focus focus-visible:ring-offset-2"
              >
                <span>
                  {app.appName} {meta.siblingTitle}
                </span>
                <ArrowUpRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" aria-hidden="true" />
              </Link>
              {otherApp && (
                <Link
                  to={`/${kind}/${otherApp.slug}`}
                  className="pressable group inline-flex min-h-11 items-center gap-2 rounded-lg border border-exvia-border bg-white px-4 py-2.5 text-sm font-medium text-exvia-black transition-colors hover:bg-exvia-subtle/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-exvia-focus focus-visible:ring-offset-2"
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
      <footer className="border-t border-exvia-border">
        <div className="container-large px-6 lg:px-12 py-10">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <p className="text-xs text-exvia-black/60">© 2026 Snaxx Tech. All rights reserved.</p>
            <nav className="flex flex-wrap gap-x-4" aria-label="App legal documents">
              {Object.values(legalApps).map((a) => (
                <span key={a.slug} className="flex flex-wrap gap-x-4">
                  <Link
                    to={`/privacy/${a.slug}`}
                    className="inline-flex min-h-11 items-center rounded-md text-xs text-exvia-black/60 hover:text-exvia-black transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-exvia-focus focus-visible:ring-offset-2"
                  >
                    {a.appName} Privacy
                  </Link>
                  <Link
                    to={`/terms/${a.slug}`}
                    className="inline-flex min-h-11 items-center rounded-md text-xs text-exvia-black/60 hover:text-exvia-black transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-exvia-focus focus-visible:ring-offset-2"
                  >
                    {a.appName} Terms
                  </Link>
                </span>
              ))}
            </nav>
          </div>
        </div>
      </footer>
    </div>
  );
}
