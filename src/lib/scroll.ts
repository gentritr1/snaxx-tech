import { prefersReducedMotion } from '@/experience/quality';
import { gamesConfig } from '@/config';

// Where in a chapter's scroll travel its copy is fully in (every chapter's
// copy is at full opacity from ~0.15 to ~0.8 of its travel; games at 0.12
// shows the header and the first card). Landing on the section top instead
// stops before the fade-in, on an empty screen.
const READ_AT: Record<string, number> = { core: 0.3, inside: 0.3, software: 0.3, appcare: 0.1, portal: 0.3, games: 0.12, studio: 0.3, contact: 0.3 };

/** Scroll to an in-page anchor or a game id like `#arrows` (smooth unless reduced motion or `instant`). */
export function scrollToHash(href: string, instant = false) {
  const reducedMotion = prefersReducedMotion();
  const behavior: ScrollBehavior = instant ? 'instant' : reducedMotion ? 'auto' : 'smooth';
  const game = gamesConfig.games.findIndex((g) => `#${g.id}` === href);
  if (game >= 0) return scrollToGame(game, behavior);
  // By id, not querySelector: a deep-link hash like #/ is not a valid selector and would throw.
  const element = href.length > 1 ? document.getElementById(href.slice(1)) : null;
  if (!element) return false;
  const at = READ_AT[element.id];
  if (at === undefined || reducedMotion) {
    element.scrollIntoView({ behavior });
    return true;
  }
  window.scrollTo({ top: readTop(element, at), behavior });
  return true;
}

/** Page offset at which `fraction` of a tall section's scroll travel has passed. */
export function readTop(element: HTMLElement, fraction: number) {
  return element.offsetTop + Math.max(0, element.offsetHeight - window.innerHeight) * fraction;
}

/** Scroll the page so the games chapter shows exhibit `index`. */
export function scrollToGame(index: number, behavior: ScrollBehavior = prefersReducedMotion() ? 'auto' : 'smooth') {
  const section = document.getElementById('games');
  if (!section) return false;
  // Reduced motion lays the cards out in flow: go to the card itself.
  const card = document.getElementById(`game-${gamesConfig.games[index].id}-title`);
  if (prefersReducedMotion() && card) {
    card.scrollIntoView({ behavior, block: 'center' });
    return true;
  }
  window.scrollTo({ top: readTop(section, (index + 0.5) / gamesConfig.games.length), behavior });
  return true;
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
