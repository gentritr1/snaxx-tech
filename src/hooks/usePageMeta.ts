import { useEffect } from 'react';
import { SITE_URL, type PageMeta } from '@/seo';

function upsert(selector: string, create: () => HTMLElement): HTMLElement {
  return document.head.querySelector<HTMLElement>(selector) ?? document.head.appendChild(create());
}

/** Keeps title, description, canonical and robots in step with the route. */
export function usePageMeta(meta: PageMeta) {
  const { title, description, path, noindex } = meta;
  useEffect(() => {
    document.title = title;
    upsert('meta[name="description"]', () => Object.assign(document.createElement('meta'), { name: 'description' })).setAttribute('content', description);
    upsert('link[rel="canonical"]', () => Object.assign(document.createElement('link'), { rel: 'canonical' })).setAttribute('href', SITE_URL + path);
    const robots = upsert('meta[name="robots"]', () => Object.assign(document.createElement('meta'), { name: 'robots' }));
    robots.setAttribute('content', noindex ? 'noindex' : 'index, follow');
  }, [title, description, path, noindex]);
}
