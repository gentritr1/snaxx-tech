import { sceneState } from '@/experience/sceneState';
import { gamesConfig } from '@/config';

/** Smooth-scroll to an in-page anchor (honours reduced motion). */
export function scrollToHash(href: string) {
  const element = document.querySelector<HTMLElement>(href);
  if (!element) return false;
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  element.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth' });
  return true;
}

/** Scroll the page so the games chapter shows exhibit `index`. */
export function scrollToGame(index: number) {
  const section = document.getElementById('games');
  if (!section) return;
  const travel = section.offsetHeight - window.innerHeight;
  const top = section.offsetTop + travel * ((index + 0.5) / gamesConfig.games.length);
  window.scrollTo({ top, behavior: sceneState.reducedMotion ? 'auto' : 'smooth' });
}
