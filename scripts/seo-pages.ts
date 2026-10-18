// Build step: one static HTML file per route, so crawlers, link previews and
// store reviewers get the right <head> (and, for legal pages, the full text)
// without running JavaScript. Also writes robots.txt, sitemap.xml and the
// 404.html Vercel serves with a real 404 status. Everything comes from
// src/config.ts, src/legal/content.ts and src/seo.ts: add a product there and
// its pages appear here on the next build.
import fs from 'node:fs';
import path from 'node:path';
import type { Plugin } from 'vite';
import { gamesConfig, softwareConfig } from '../src/config';
import { KIND_TITLES, LEGACY_SLUGS, legalAppList, legalApps, legalKindsFor, type AppLegal, type LegalKind } from '../src/legal/content';
import { HOME_META, LEGAL_INDEX_META, NOT_FOUND_META, SITE_URL, legalMeta, type PageMeta } from '../src/seo';

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

function setHead(shell: string, meta: PageMeta, extraHead = ''): string {
  const url = SITE_URL + meta.path;
  return shell
    .replace(/<title>[\s\S]*?<\/title>/, `<title>${esc(meta.title)}</title>`)
    .replace(/(<meta\s+name="description"\s+content=")[^"]*(")/, `$1${esc(meta.description)}$2`)
    .replace(/(<meta\s+property="og:title"\s+content=")[^"]*(")/, `$1${esc(meta.title)}$2`)
    .replace(/(<meta\s+property="og:description"\s+content=")[^"]*(")/, `$1${esc(meta.description)}$2`)
    .replace(/(<meta\s+name="twitter:title"\s+content=")[^"]*(")/, `$1${esc(meta.title)}$2`)
    .replace(/(<meta\s+name="twitter:description"\s+content=")[^"]*(")/, `$1${esc(meta.description)}$2`)
    .replace(/(<link\s+rel="canonical"\s+href=")[^"]*(")/, `$1${url}$2`)
    .replace(/(<meta\s+property="og:url"\s+content=")[^"]*(")/, `$1${url}$2`)
    .replace('</head>', `${meta.noindex ? '    <meta name="robots" content="noindex" />\n' : ''}${extraHead}  </head>`);
}

const setBody = (html: string, body: string) => html.replace('<div id="root"></div>', `<div id="root"><div class="seo-static">${body}</div></div>`);

function legalBody(app: AppLegal, kind: LegalKind): string {
  const doc = kind === 'privacy' ? app.privacy : kind === 'terms' ? app.terms : (app.support ?? []);
  const sections = doc
    .map((s) => {
      const paras = (s.paragraphs ?? []).map((p) => `<p>${esc(p)}</p>`).join('');
      const list = s.list ? `<ul>${s.list.map((i) => `<li>${esc(i)}</li>`).join('')}</ul>` : '';
      const links = s.links ? `<ul>${s.links.map((l) => `<li><a href="${esc(l.href)}">${esc(l.label)}</a>: ${esc(l.description)}</li>`).join('')}</ul>` : '';
      return `<h2 id="${esc(s.id)}">${esc(s.title)}</h2>${paras}${list}${links}`;
    })
    .join('');
  const others = legalKindsFor(app).filter((k) => k !== kind).map((k) => `<a href="/${app.slug}/${k}">${app.appName} ${KIND_TITLES[k]}</a>`).join(' · ');
  return `<p><a href="/">Snaxx Tech</a> · <a href="/legal">All legal documents</a></p><h1>${esc(app.appName)} ${KIND_TITLES[kind]}</h1><p>Last updated: ${esc(app.lastUpdated ?? app.effectiveDate)}</p><p>${others}</p>${sections}`;
}

function legalIndexBody(): string {
  const rows = legalAppList
    .map((app) => `<li><h2>${esc(app.appName)}</h2><p>${esc(app.summary)}</p><p>${legalKindsFor(app).map((k) => `<a href="/${app.slug}/${k}">${KIND_TITLES[k]}</a>`).join(' · ')}</p></li>`)
    .join('');
  return `<p><a href="/">Snaxx Tech</a></p><h1>Legal and privacy</h1><ul>${rows}</ul>`;
}

function homeJsonLd(): string {
  const data = {
    '@context': 'https://schema.org',
    '@graph': [
      { '@type': 'Organization', '@id': `${SITE_URL}/#org`, name: 'Snaxx Tech', url: `${SITE_URL}/`, logo: `${SITE_URL}/icon-512.png`, email: 'techsnaxx@gmail.com' },
      { '@type': 'WebSite', name: 'Snaxx Tech', url: `${SITE_URL}/`, publisher: { '@id': `${SITE_URL}/#org` } },
      ...gamesConfig.games.filter((g) => g.href).map((g) => ({
        '@type': g.href!.includes('play.google.com') ? 'MobileApplication' : 'WebApplication',
        name: g.name,
        applicationCategory: 'GameApplication',
        operatingSystem: g.href!.includes('play.google.com') ? 'Android' : 'Any',
        url: g.href,
        description: g.description,
        publisher: { '@id': `${SITE_URL}/#org` },
      })),
    ],
  };
  return `    <script type="application/ld+json">${JSON.stringify(data).replace(/</g, '\\u003c')}</script>\n`;
}

// Home body for clients without JavaScript; React replaces it on mount.
function homeNoscript(): string {
  const items = [...softwareConfig.products, ...gamesConfig.games].map((p) => `<li>${esc(p.name)}: ${esc(p.description)}</li>`).join('');
  return `<noscript><div class="seo-static"><h1>Snaxx Tech</h1><p>${esc(HOME_META.description)}</p><ul>${items}</ul><p><a href="/legal">Legal and privacy</a> · <a href="mailto:techsnaxx@gmail.com">techsnaxx@gmail.com</a></p></div></noscript>`;
}

export function seoPages(): Plugin {
  let outDir = 'dist';
  return {
    name: 'snaxx-seo-pages',
    apply: 'build',
    configResolved(config) {
      outDir = path.resolve(config.root, config.build.outDir);
    },
    closeBundle() {
      const shell = fs.readFileSync(path.join(outDir, 'index.html'), 'utf8');
      const write = (route: string, html: string) => {
        const file = route === '/' ? 'index.html' : `${route.slice(1)}.html`;
        fs.mkdirSync(path.dirname(path.join(outDir, file)), { recursive: true });
        fs.writeFileSync(path.join(outDir, file), html);
      };

      write('/', setHead(shell, HOME_META, homeJsonLd()).replace('<div id="root"></div>', `<div id="root"></div>${homeNoscript()}`));
      write('/legal', setBody(setHead(shell, LEGAL_INDEX_META), legalIndexBody()));
      write('/404', setHead(shell, NOT_FOUND_META));

      const sitemap: { loc: string; lastmod?: string }[] = [{ loc: '/' }, { loc: '/legal' }];
      for (const app of legalAppList) {
        for (const kind of legalKindsFor(app)) {
          const meta = legalMeta(app, kind);
          const page = setBody(setHead(shell, meta), legalBody(app, kind));
          write(meta.path, page);
          // Older and renamed URLs still resolve; their canonical points here.
          if (kind !== 'support') write(`/${kind}/${app.slug}`, page);
          const updated = new Date(`${app.lastUpdated ?? app.effectiveDate} UTC`);
          sitemap.push({ loc: meta.path, lastmod: Number.isNaN(+updated) ? undefined : updated.toISOString().slice(0, 10) });
        }
      }
      for (const [legacy, target] of Object.entries(LEGACY_SLUGS)) {
        const app = legalApps[target];
        for (const kind of legalKindsFor(app)) {
          const page = setBody(setHead(shell, legalMeta(app, kind)), legalBody(app, kind));
          write(`/${legacy}/${kind}`, page);
          if (kind !== 'support') write(`/${kind}/${legacy}`, page);
        }
      }

      fs.writeFileSync(path.join(outDir, 'robots.txt'), `User-agent: *\nAllow: /\n\nSitemap: ${SITE_URL}/sitemap.xml\n`);
      fs.writeFileSync(
        path.join(outDir, 'sitemap.xml'),
        `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${sitemap
          .map((u) => `  <url><loc>${SITE_URL}${u.loc}</loc>${u.lastmod ? `<lastmod>${u.lastmod}</lastmod>` : ''}</url>`)
          .join('\n')}\n</urlset>\n`,
      );
    },
  };
}
