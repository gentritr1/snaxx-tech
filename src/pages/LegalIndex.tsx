import { useEffect } from 'react';
import { Link, useLocation } from 'react-router';
import { ArrowUpRight } from 'lucide-react';
import { KIND_TITLES, legalAppList, legalKindsFor } from '@/legal/content';
import { LegalShell } from '@/components/LegalLayout';

/** /legal: every product's privacy policy, terms and support page, A to Z. */
export default function LegalIndex() {
  const { hash } = useLocation();

  useEffect(() => {
    document.title = 'Legal and privacy — Snaxx Tech';
    return () => {
      document.title = 'Snaxx Tech — Bite-sized apps & games';
    };
  }, []);

  // Game cards link to /legal#<slug>; the route-change scroll reset runs
  // first, so jump to the app once the list is on screen.
  useEffect(() => {
    if (hash) document.getElementById(hash.slice(1))?.scrollIntoView({ block: 'start' });
  }, [hash]);

  return (
    <div className="page-enter">
      <LegalShell>
        <div className="bg-paper-deep/70 border-b border-ink/10">
          <div className="container-large px-6 lg:px-12 py-14 lg:py-20">
            <h1 className="max-w-3xl font-display type-headline text-ink">Legal and privacy</h1>
            <p className="mt-4 max-w-xl text-base leading-relaxed text-ink-soft">
              Each app has its own privacy policy and terms, because each one collects different
              things. Pick an app to read exactly what it does with your data.
            </p>
          </div>
        </div>

        <main id="legal-content" data-route-focus tabIndex={-1} className="container-large px-6 lg:px-12 py-14 lg:py-20 focus:outline-none">
          <ul className="max-w-3xl divide-y divide-ink/10 border-y border-ink/10">
            {legalAppList.map((app) => (
              <li key={app.slug} id={app.slug} className="scroll-mt-24 py-6 sm:flex sm:items-start sm:justify-between sm:gap-8">
                <div>
                  <h2 className="flex items-center gap-2.5 font-display text-xl font-medium tracking-tight text-ink">
                    <span className="h-2 w-2 rounded-full" style={{ backgroundColor: app.accent }} aria-hidden="true" />
                    {app.appName}
                  </h2>
                  <p className="mt-1 text-sm text-ink-soft">{app.summary}</p>
                  <p className="mt-1 text-xs text-ink-soft">
                    Updated {app.lastUpdated ?? app.effectiveDate}
                  </p>
                </div>
                <nav className="mt-4 flex flex-wrap gap-2 sm:mt-0 sm:justify-end" aria-label={`${app.appName} documents`}>
                  {legalKindsFor(app).map((kind) => (
                    <Link
                      key={kind}
                      to={`/${app.slug}/${kind}`}
                      className="pressable group inline-flex min-h-11 items-center gap-1.5 rounded-lg border border-ink/10 bg-white px-3.5 text-sm font-medium text-ink transition-colors hover:bg-paper-deep focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2F6BFF] focus-visible:ring-offset-2"
                    >
                      {KIND_TITLES[kind]}
                      <ArrowUpRight className="h-3.5 w-3.5 text-ink-soft" aria-hidden="true" />
                    </Link>
                  ))}
                </nav>
              </li>
            ))}
          </ul>
        </main>
      </LegalShell>
    </div>
  );
}
