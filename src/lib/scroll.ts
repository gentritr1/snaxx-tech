import { sceneState } from '@/experience/sceneState';
import { gamesConfig } from '@/config';

// Where in a chapter's scroll travel its copy is fully in (every chapter's
// copy is at full opacity from ~0.15 to ~0.8 of its travel; games at 0.12
// shows the header and the first card). Landing on the section top instead
// stops before the fade-in, on an empty screen.
const READ_AT: Record<string, number> = { core: 0.3, inside: 0.3, software: 0.3, appcare: 0.1, portal: 0.3, games: 0.12, studio: 0.3, contact: 0.3 };

/** Smooth-scroll to an in-page anchor (honours reduced motion). */
export function scrollToHash(href: string) {
  const element = document.querySelector<HTMLElement>(href);
  if (!element) return false;
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const at = READ_AT[element.id];
  if (at === undefined || reducedMotion) {
    element.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth' });
    return true;
  }
  const top = element.offsetTop + Math.max(0, element.offsetHeight - window.innerHeight) * at;
  window.scrollTo({ top, behavior: 'smooth' });
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

/**
 * True when a click that reached the 3D layer actually landed on a DOM
 * control. The canvas listens on the page root so it can raycast through the
 * copy, which means every link, button and card click also arrives here;
 * 3D click handlers must ignore those.
 */
export function isDomControlClick(event: { nativeEvent: Event }) {
  const target = event.nativeEvent.target;
  return target instanceof Element && target.closest('a, button, article, nav, input, textarea, select') !== null;
}
