import type { MouseEvent } from 'react';
import { Link } from 'react-router';
import { ArrowUpRight } from 'lucide-react';
import { footerConfig } from '@/config';
import { scrollToHash } from '@/lib/scroll';

export function Footer() {
  const handleNavClick = (e: MouseEvent<HTMLAnchorElement>, href: string) => {
    if (!href.startsWith('#')) return;
    e.preventDefault();
    scrollToHash(href);
  };

  return (
    <footer className="relative z-10 w-full border-t border-ink/10 bg-void/90 py-16 lg:py-24">
      <div className="container-large px-6 lg:px-12">
        <div className="grid gap-12 lg:grid-cols-12 lg:gap-8">
          <div className="lg:col-span-5">
            <div className="flex items-center gap-2.5">
              <img src="/images/wordmark/letter-5.webp" alt="" draggable={false} className="h-6 w-auto select-none" />
              <span className="font-display text-lg font-medium tracking-[-0.02em] text-ink">{footerConfig.logo}</span>
            </div>
            <p className="mt-5 max-w-sm text-sm leading-relaxed text-mist">{footerConfig.description}</p>
          </div>

          <div className="grid grid-cols-2 gap-8 sm:grid-cols-3 lg:col-span-7">
            {footerConfig.columns.map((column) => (
              <div key={column.title}>
                <h2 className="label-mono text-mist">{column.title}</h2>
                <ul className="mt-5 space-y-1">
                  {column.links.map((link) => {
                    const external = link.href.startsWith('http');
                    const internal = link.href.startsWith('/');
                    const className =
                      'inline-flex min-h-9 items-center gap-1 rounded-md text-sm text-ink/75 transition-colors duration-200 hover:text-ink';
                    return (
                      <li key={link.label}>
                        {internal ? (
                          <Link to={link.href} className={className}>
                            {link.label}
                          </Link>
                        ) : (
                          <a
                            href={link.href}
                            className={className}
                            onClick={(e) => handleNavClick(e, link.href)}
                            target={external ? '_blank' : undefined}
                            rel={external ? 'noopener noreferrer' : undefined}
                          >
                            {link.label}
                            {external && <ArrowUpRight className="h-3.5 w-3.5 text-mist" aria-hidden="true" />}
                          </a>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-14 flex flex-col gap-3 border-t border-ink/10 pt-8 text-xs text-mist sm:flex-row sm:items-center sm:justify-between">
          <p>{footerConfig.copyright}</p>
          <p>{footerConfig.credit}</p>
        </div>
      </div>
    </footer>
  );
}
