import { Curve, Vector3, Quaternion, Matrix4 } from "three";
import splineData from "./assets/journey-spline.json";

export const clamp = (value: number) => Math.max(0, Math.min(1, value));
export const easeOutQuart = (value: number) => 1 - (1 - clamp(value)) ** 4;
export const range = (p: number, start: number, end: number) =>
  easeOutQuart((p - start) / (end - start));
export const R = 2.2;
export const interiorStartT = splineData.interiorStartT;
export const exteriorEndT = splineData.wrapEndT;
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
export const pinAnchor = threadCurve.getPointAt(splineData.pinT);

export const cameraKeys = [
  0, 0.2, 0.3, 0.45, 0.55, 0.65, 0.67, 0.7, 0.78, 0.9, 1,
] as const;
const cameraT = [
  splineData.wordCameraT,
  splineData.wordCameraT,
  splineData.worldCameraT,
  splineData.pinT - 0.03,
  splineData.pinT - 0.03,
  splineData.pinT - 0.03,
  splineData.pinT,
  0.49,
  splineData.flightCameraT,
  0.83,
  0.89,
];
const crossing = pinAnchor
  .clone()
  .sub(globeCenter)
  .normalize()
  .multiplyScalar(R)
  .add(globeCenter);
// Authored positions become local (side, up, back) offsets in each spline frame.
// Interpolation then follows the centerline, with frame quaternions slerped across keys.
const authoredPositions = [
  [0, 1.2, 12],
  [0, 1.2, 12],
  [3, 1.0, 11.5],
  [4.8, 3.3, 9],
  [12, 4, 2.1],
  [9.4, 2.3, 1.9],
  crossing.toArray(),
  [5, 2, 6],
  [7, 1, 6],
  [8, 3, 8],
  [10, 4, 10],
].map((p) => new Vector3(...p));
for (const [index, distance] of [
  [3, 3.2 * R],
  [5, 1.05 * R],
]) {
  authoredPositions[index]
    .sub(pinAnchor)
    .normalize()
    .multiplyScalar(distance)
    .add(pinAnchor);
}
const cameraFrames = cameraT.map((t) =>
  sampleFrame(t, new Quaternion()).clone(),
);
const cameraOffsets = authoredPositions.map((point, i) =>
  point
    .clone()
    .sub(threadCurve.getPointAt(cameraT[i]))
    .applyQuaternion(cameraFrames[i].clone().invert()),
);
const phoneT = [...cameraT];
phoneT[2] = splineData.phoneWorldCameraT;
phoneT[3] = splineData.pinT - 0.03;
const phonePositions = authoredPositions.map((point) => point.clone());
phonePositions[0].z = phonePositions[1].z = 22;
phonePositions[2].set(4, 1, 26);
phonePositions[8].z += 4;
const phoneFrames = phoneT.map((t) => sampleFrame(t, new Quaternion()).clone());
const phoneOffsets = phonePositions.map((point, i) =>
  point
    .clone()
    .sub(threadCurve.getPointAt(phoneT[i]))
    .applyQuaternion(phoneFrames[i].clone().invert()),
);
const cameraFrame = new Quaternion(),
  cameraOffset = new Vector3();
export function sampleCamera(
  p: number,
  position: Vector3,
  target: Vector3,
  mobile = false,
) {
  const index = Math.min(
    cameraKeys.length - 2,
    Math.max(
      0,
      cameraKeys.reduce<number>((found, key, i) => (p >= key ? i : found), 0),
    ),
  );
  const u = clamp(
    (p - cameraKeys[index]) / (cameraKeys[index + 1] - cameraKeys[index]),
  );
  const blend = u * u * (3 - 2 * u);
  const parameters = mobile ? phoneT : cameraT;
  const frames = mobile ? phoneFrames : cameraFrames;
  const offsets = mobile ? phoneOffsets : cameraOffsets;
  const t =
    parameters[index] + (parameters[index + 1] - parameters[index]) * blend;
  cameraFrame.copy(frames[index]).slerp(frames[index + 1], blend);
  cameraOffset
    .copy(offsets[index])
    .lerp(offsets[index + 1], blend)
    .applyQuaternion(cameraFrame);
  threadCurve.getPointAt(t, position).add(cameraOffset);
  threadCurve.getPointAt(Math.min(1, t + 0.03), target);
}
export function tileParameter(p: number, index: number) {
  return clamp(
    splineData.wordStartT +
      index * splineData.wordSpacingT +
      p * splineData.tileSpeedT,
  );
}
export function tileClick(p: number, index: number) {
  const seat =
    splineData.wordStartT +
    index * splineData.wordSpacingT +
    index * 0.03 * splineData.tileSpeedT;
  const distance = Math.abs(tileParameter(p, index) - seat);
  return 1 + Math.max(0, 1 - distance / 0.003) * 0.06;
}
export function planeParameter(p: number) {
  if (p <= 0.45) return splineData.planeStartT;
  if (p <= 0.65) {
    const t = clamp((p - 0.45) / 0.2);
    return (
      splineData.planeStartT +
      (splineData.pinT - splineData.planeStartT) * t * t * (3 - 2 * t)
    );
  }
  if (p < 0.7) {
    const t = (p - 0.65) / 0.05;
    return splineData.pinT + (0.7 - splineData.pinT) * t * t * (3 - 2 * t);
  }
  return p;
}
export function sampleThread(t: number, _p: number, point: Vector3) {
  return threadCurve.getPointAt(clamp(t), point);
}
