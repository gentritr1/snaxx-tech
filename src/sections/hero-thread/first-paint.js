// Build-gated, same-origin boot code. Inert markup never flashes on legal routes.
const posterTemplate = document.querySelector('#thread-first-paint');
if (location.pathname === '/' && posterTemplate instanceof HTMLTemplateElement) {
  document.documentElement.dataset.threadHero = '';
  document.querySelector('#root')?.append(posterTemplate.content.cloneNode(true));
}
posterTemplate?.remove();
for (const stylesheet of document.querySelectorAll('link[data-thread-deferred-style]')) {
  const show = () => { stylesheet.media = 'all'; };
  if (stylesheet.sheet) show();
  else stylesheet.addEventListener('load', show, { once: true });
}
