import { CatmullRomCurve3, Curve, Vector3, Quaternion, Matrix4 } from "three";
import splineData from "./assets/journey-spline.json";

export const clamp = (value: number) => Math.max(0, Math.min(1, value));
export const easeOutQuart = (value: number) => 1 - (1 - clamp(value)) ** 4;
export const range = (p: number, start: number, end: number) =>
  easeOutQuart((p - start) / (end - start));
export const R = 2.2;
export const globeCenter = new Vector3(7, 0, 0);

/** §3: K0 .00–.20 Word; K1 .20–.45 World; K2 .45–.65 Descent;
 * K3 .65–.90 Arrow; K4 .90–1 Landed. Native scroll is linear in p.
 * Only individual property ranges are eased; thread arc length is always p.
 * §6's 420vh/300vh wrappers give 320vh/200vh of sticky travel.
 */
export const keys = [0, 0.2, 0.45, 0.65, 0.9, 1] as const;

// The same exported points and transported Frenet frames are used by the kit and every rider.
const points = splineData.points.map((p) => new Vector3(...p));
const tangents = splineData.tangents.map((p) => new Vector3(...p));
const normals = splineData.normals.map((p) => new Vector3(...p));
function interpolate(values: Vector3[], t: number, result: Vector3) {
  const segment = clamp(t) * (values.length - 1);
  const index = Math.min(values.length - 2, Math.floor(segment));
  return result.copy(values[index]).lerp(values[index + 1], segment - index);
}
class ExportedJourney extends Curve<Vector3> {
  constructor() {
    super();
  }
  getPoint(t: number, result = new Vector3()) {
    return interpolate(points, t, result);
  }
  getPointAt(t: number, result = new Vector3()) {
    return this.getPoint(t, result);
  }
  getTangent(t: number, result = new Vector3()) {
    return interpolate(tangents, t, result).normalize();
  }
  getTangentAt(t: number, result = new Vector3()) {
    return this.getTangent(t, result);
  }
}
export const threadCurve = new ExportedJourney();
const frameTangent = new Vector3(),
  frameNormal = new Vector3(),
  frameBinormal = new Vector3();
const frameMatrix = new Matrix4();
export function sampleFrame(t: number, quaternion: Quaternion) {
  interpolate(tangents, t, frameTangent).normalize();
  interpolate(normals, t, frameNormal).normalize();
  frameBinormal.crossVectors(frameTangent, frameNormal).normalize();
  frameNormal.crossVectors(frameBinormal, frameTangent).normalize();
  return quaternion.setFromRotationMatrix(
    frameMatrix.makeBasis(frameTangent, frameNormal, frameBinormal),
  );
}
export const pinAnchor = threadCurve.getPointAt(0.37);

// Distances in §6 are measured from the pin: 3.2R at .45, 1.05R at .65.
// The .67 surface crossing is hidden by the reversible porcelain white-out.
export const cameraKeys = [
  0, 0.2, 0.3, 0.45, 0.65, 0.67, 0.78, 0.9, 1,
] as const;
export const cameraCurve = new CatmullRomCurve3(
  [
    [0, 0, 12],
    [0, 0, 12],
    [5.2, 0.4, 9.5],
    [pinAnchor.x, pinAnchor.y, pinAnchor.z + 3.2 * R],
    [pinAnchor.x, pinAnchor.y, pinAnchor.z + 1.05 * R],
    [pinAnchor.x, pinAnchor.y, pinAnchor.z - 0.1],
    [7.7, 0.8, 1.5],
    [7.7, 0.15, 0.1],
    [9, 1.5, -1],
  ].map(([x, y, z]) => new Vector3(x, y, z)),
);
export const cameraTargets = [
  [0, 0, 0],
  [0, 0, 0],
  [4.5, 0, 0],
  [4.5, 0.1, 0],
  [pinAnchor.x, pinAnchor.y, 0],
  [pinAnchor.x, pinAnchor.y, 0],
  [4.5, -3.5, -3],
  [9.5, 0, -4],
  [11, -2, -5],
].map(([x, y, z]) => new Vector3(x, y, z));

export function sampleCamera(p: number, position: Vector3, target: Vector3) {
  if (p <= 0.2) {
    position.copy(cameraCurve.points[0]);
    target.copy(cameraTargets[0]);
    return;
  }
  const index = Math.min(
    cameraKeys.length - 2,
    Math.max(
      0,
      cameraKeys.reduce<number>((found, key, i) => (p >= key ? i : found), 0),
    ),
  );
  const blend = range(p, cameraKeys[index], cameraKeys[index + 1]);
  cameraCurve.getPoint((index + blend) / (cameraKeys.length - 1), position);
  target.copy(cameraTargets[index]).lerp(cameraTargets[index + 1], blend);
}

/** A reversible pulse: 0.03 of the 3-second reference scrub = 90ms per tile. */
export function tileClick(p: number, index: number) {
  const t = clamp((p - index * 0.03) / 0.03);
  return 1 + Math.sin(t * Math.PI) * 0.06;
}

/** The slack Word strand settles below Act II copy; all riders share this deformation. */
export function sampleThread(t: number, p: number, point: Vector3) {
  threadCurve.getPointAt(clamp(t), point);
  const x = clamp((t - 0.28) / 0.06);
  point.y -= range(p, 0.2, 0.3) * 4 * (1 - x * x * (3 - 2 * x));
  return point;
}
