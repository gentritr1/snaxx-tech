// Preview flags, read once per page load. `?hero=bonbon` turns on the Blender
// hero for this tab (sticky across in-app navigation); `?hero=classic` turns it
// off again. Default: off.

function sticky(name: string, on: string): boolean {
  try {
    const value = new URLSearchParams(window.location.search).get(name);
    if (value !== null) sessionStorage.setItem(`flag:${name}`, value);
    return (value ?? sessionStorage.getItem(`flag:${name}`)) === on;
  } catch {
    return false; // storage blocked: flags stay at their defaults
  }
}

export const HERO_BONBON = typeof window !== 'undefined' && sticky('hero', 'bonbon');
