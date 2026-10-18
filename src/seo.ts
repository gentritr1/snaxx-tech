// Page <head> data, shared by the React pages (client-side navigation) and the
// build step that writes one static HTML file per route (scripts/seo-pages.ts),
// so what a crawler reads and what a visitor's tab shows never drift apart.
// Pure data: no React, no DOM, so the Vite config can import it.
import { siteConfig } from './config';
import { KIND_TITLES, type AppLegal, type LegalKind } from './legal/content';

/** The canonical origin. The apex and the vercel.app host redirect here. */
export const SITE_URL = 'https://www.snaxxtech.com';

export interface PageMeta {
  title: string;
  description: string;
  /** Canonical path on SITE_URL. */
  path: string;
  noindex?: boolean;
}

export const HOME_META: PageMeta = {
  title: siteConfig.title,
  description: siteConfig.description,
  path: '/',
};

export const LEGAL_INDEX_META: PageMeta = {
  title: 'Legal and privacy — Snaxx Tech',
  description: 'Privacy policies, terms of service and support pages for every Snaxx Tech app and game.',
  path: '/legal',
};

export const NOT_FOUND_META: PageMeta = {
  title: 'Page not found — Snaxx Tech',
  description: 'This Snaxx Tech page does not exist.',
  path: '/404',
  noindex: true,
};

export function legalMeta(app: AppLegal, kind: LegalKind): PageMeta {
  return {
    title: `${app.appName} ${KIND_TITLES[kind]} — Snaxx Tech`,
    description:
      kind === 'support'
        ? `Help and troubleshooting for ${app.appName}, a ${app.appKind} by Snaxx Tech.`
        : `${KIND_TITLES[kind]} for ${app.appName}, a ${app.appKind} by Snaxx Tech. ${app.summary}.`,
    path: `/${app.slug}/${kind}`,
  };
}
