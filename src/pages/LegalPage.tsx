import { useEffect } from 'react';
import { Link, useParams } from 'react-router';
import { ArrowUpRight, Mail } from 'lucide-react';
import { getAppLegal } from '@/legal/content';
import { LegalLayout, type LegalKind } from '@/components/LegalLayout';

interface LegalPageProps {
  kind: LegalKind;
}

export default function LegalPage({ kind }: LegalPageProps) {
  const { appSlug } = useParams<{ appSlug: string }>();
  const app = getAppLegal(appSlug);

  const docTitle = kind === 'privacy' ? 'Privacy Policy' : 'Terms of Service';

  useEffect(() => {
    const description = document.querySelector<HTMLMetaElement>('meta[name="description"]');
    const previousDescription = description?.content;
    const canonical = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    const previousCanonical = canonical?.href;

    document.title = app
      ? `${app.appName} ${docTitle} — Snaxx Tech`
      : 'Page Not Found — Snaxx Tech';

    if (description) {
      description.content = app
        ? `${docTitle} for ${app.appName}, an Android ${app.appKind} by Snaxx Tech.`
        : 'The requested Snaxx Tech page could not be found.';
    }

    const canonicalLink = canonical ?? document.createElement('link');
    if (!canonical) {
      canonicalLink.rel = 'canonical';
      document.head.appendChild(canonicalLink);
    }
    canonicalLink.href = window.location.href.split(/[?#]/)[0];

    return () => {
      document.title = 'Snaxx Tech — Indie Apps & Games Studio';
      if (description && previousDescription) description.content = previousDescription;
      if (canonical && previousCanonical) canonical.href = previousCanonical;
      if (!canonical) canonicalLink.remove();
    };
  }, [app, docTitle]);

  if (!app) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center px-6 text-center">
        <p className="text-xs font-geist-mono uppercase tracking-widest text-exvia-black/60">404</p>
        <h1 className="mt-4 text-3xl lg:text-5xl font-semibold text-exvia-black">
          We couldn't find that page.
        </h1>
        <p className="mt-4 text-exvia-black/60 max-w-md">
          The legal document you're looking for doesn't exist. Try one of our apps' policy pages
          instead.
        </p>
        <Link
          to="/"
          className="mt-8 inline-flex min-h-11 items-center gap-2 rounded-lg bg-exvia-black px-5 py-3 text-sm font-medium text-white transition-colors hover:bg-exvia-black/85 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-exvia-focus focus-visible:ring-offset-2"
        >
          Back to Snaxx Tech
        </Link>
      </div>
    );
  }

  const sections = kind === 'privacy' ? app.privacy : app.terms;

  return (
    <LegalLayout app={app} kind={kind}>
      <div className="grid min-w-0 grid-cols-1 gap-12 lg:grid-cols-12">
        {/* Table of contents */}
        <aside className="hidden lg:block lg:col-span-3" aria-label={`${docTitle} contents`}>
          <div className="sticky top-28">
            <p className="mb-4 text-xs font-geist-mono uppercase tracking-widest text-exvia-black/60">
              On this page
            </p>
            <nav className="space-y-1 border-l border-exvia-border">
              {sections.map((section) => (
                <a
                  key={section.id}
                  href={`#${section.id}`}
                  className="block py-1.5 pl-4 -ml-px border-l-2 border-transparent text-sm text-exvia-black/60 hover:text-exvia-black hover:border-exvia-black transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-exvia-focus focus-visible:ring-offset-2"
                >
                  {section.title}
                </a>
              ))}
            </nav>
          </div>
        </aside>

        <details className="min-w-0 rounded-xl border border-exvia-border bg-exvia-subtle/30 p-4 lg:hidden">
          <summary className="cursor-pointer text-sm font-medium text-exvia-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-exvia-focus focus-visible:ring-offset-2">
            On this page
          </summary>
          <nav className="mt-3 grid gap-1" aria-label={`${docTitle} contents`}>
            {sections.map((section) => (
              <a
                key={section.id}
                href={`#${section.id}`}
                className="flex min-h-11 items-center rounded-md px-2 text-sm text-exvia-black/70 hover:bg-white hover:text-exvia-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-exvia-focus"
              >
                {section.title}
              </a>
            ))}
          </nav>
        </details>

        {/* Document content */}
        <article className="min-w-0 max-w-[70ch] break-words lg:col-span-8 lg:col-start-5">
          {sections.map((section) => (
            <section key={section.id} id={section.id} className="scroll-mt-28 mb-12 last:mb-0">
              <h2 className="text-xl lg:text-2xl font-semibold text-exvia-black tracking-tight">
                {section.title}
              </h2>
              {section.paragraphs?.map((paragraph, i) => (
                <p key={i} className="mt-4 text-base text-exvia-black/70 leading-relaxed">
                  {paragraph}
                </p>
              ))}
              {section.list && (
                <ul className="mt-4 space-y-3">
                  {section.list.map((item, i) => (
                    <li key={i} className="flex gap-3 text-base text-exvia-black/70 leading-relaxed">
                      <span
                        className="mt-[0.65rem] w-1.5 h-1.5 rounded-full flex-shrink-0"
                        style={{ backgroundColor: app.accent }}
                        aria-hidden="true"
                      />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              )}
              {section.links && (
                <div className="mt-5 divide-y divide-exvia-border border-y border-exvia-border">
                  {section.links.map((link) => (
                    <a
                      key={link.href}
                      href={link.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group flex min-h-16 items-center justify-between gap-4 py-3 text-exvia-black hover:text-exvia-blue focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-exvia-focus focus-visible:ring-offset-2"
                    >
                      <span>
                        <span className="block text-sm font-medium">{link.label}</span>
                        <span className="mt-0.5 block text-sm leading-relaxed text-exvia-black/60">
                          {link.description}
                        </span>
                      </span>
                      <ArrowUpRight
                        className="h-4 w-4 shrink-0 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                        aria-hidden="true"
                      />
                    </a>
                  ))}
                </div>
              )}
            </section>
          ))}

          {/* Contact card */}
          <div
            className="mt-16 rounded-xl border border-exvia-border bg-exvia-subtle/30 p-6 lg:p-8"
          >
            <div className="flex items-center gap-3">
              <span
                className="h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: app.accent }}
                aria-hidden="true"
              />
              <h3 className="text-lg font-semibold text-exvia-black">
                Questions about this document?
              </h3>
            </div>
            <p className="mt-2 text-sm text-exvia-black/60 leading-relaxed">
              We're a small studio and we read every message. Email us and we'll get back to you
              within a few business days.
            </p>
            <a
              href={`mailto:${app.contactEmail}`}
              className="mt-3 inline-flex min-h-11 items-center gap-2 rounded-md text-sm font-medium text-exvia-black hover:text-exvia-blue transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-exvia-focus focus-visible:ring-offset-2"
            >
              <Mail className="w-4 h-4" aria-hidden="true" />
              <span>{app.contactEmail}</span>
            </a>
          </div>
        </article>
      </div>
    </LegalLayout>
  );
}
