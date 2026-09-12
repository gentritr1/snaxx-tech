import { CatmullRomCurve3, Vector3 } from 'three';

export const clamp = (value: number) => Math.max(0, Math.min(1, value));
export const easeOutQuart = (value: number) => 1 - (1 - clamp(value)) ** 4;
export const range = (p: number, start: number, end: number) => easeOutQuart((p - start) / (end - start));
export const R = 2.2;
export const globeCenter = new Vector3(7, 0, 0);

/** §3: K0 .00–.20 Word; K1 .20–.45 World; K2 .45–.65 Descent;
 * K3 .65–.90 Arrow; K4 .90–1 Landed. Native scroll is linear in p.
 * Only individual property ranges are eased; thread arc length is always p.
 * §6's 420vh/300vh wrappers give 320vh/200vh of sticky travel.
 */
export const keys = [0, 0.2, 0.45, 0.65, 0.9, 1] as const;

// One continuous thread: Word → one globe wrap → surface pin → interior → exit.
const word = [[-9, 1.7, 0], [-5, 1.7, 0], [-2.4, 1.6, 0], [0, 1.7, 0], [2.4, 1.6, 0], [4, 1.3, 0]];
const wrap = Array.from({ length: 17 }, (_, i) => {
  const angle = -Math.PI / 2 + (i / 16) * Math.PI * 2;
  return [7 + Math.sin(angle) * R * 1.025, Math.cos(angle) * R * 0.42, Math.cos(angle) * R * 0.93];
});
export const threadCurve = new CatmullRomCurve3([
  ...word, ...wrap, [6.1, 0.4, 2.05], [7, 0, 1.4], [7.6, -0.4, 0.1],
  [7, -0.8, -1.2], [8.5, -0.4, -2.7], [10.5, 0.3, -4], [14, 3, -6],
].map(([x, y, z]) => new Vector3(x, y, z)));
threadCurve.arcLengthDivisions = 2048;

// The camera spline has a point per key plus a settled inside pose at .78.
export const cameraKeys = [0, 0.2, 0.45, 0.65, 0.78, 0.9, 1] as const;
export const cameraCurve = new CatmullRomCurve3([
  [0, 0, 12], [0, 0, 12], [4.3, 1.0, 7.04], [6.1, 0.4, 2.31],
  [7.1, 0.2, 0.85], [7.7, 0.15, 0.1], [9, 1.5, -1],
].map(([x, y, z]) => new Vector3(x, y, z)));
export const cameraTargets = [
  [0, 0, 0], [0, 0, 0], [4.3, 0.1, 0], [6.1, 0.4, 0],
  [8.3, -0.1, -3], [9.5, 0, -4], [11, -2, -5],
].map(([x, y, z]) => new Vector3(x, y, z));

export function sampleCamera(p: number, position: Vector3, target: Vector3) {
  const index = Math.min(cameraKeys.length - 2, Math.max(0, cameraKeys.reduce<number>((found, key, i) => p >= key ? i : found, 0)));
  const blend = range(p, cameraKeys[index], cameraKeys[index + 1]);
  cameraCurve.getPoint((index + blend) / (cameraKeys.length - 1), position);
  target.copy(cameraTargets[index]).lerp(cameraTargets[index + 1], blend);
}

/** A reversible pulse: 0.03 of the 3-second reference scrub = 90ms per tile. */
export function tileClick(p: number, index: number) {
  const t = clamp((p - index * 0.03) / 0.03);
  return 1 + Math.sin(t * Math.PI) * 0.06;
}
