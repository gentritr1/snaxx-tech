import { Curve, Vector3 } from "three";
import { clamp } from "./motion";

export type ScalarKey = {
  p: number;
  value: number;
  left: [number, number];
  right: [number, number];
  interpolation: "BEZIER" | "LINEAR" | "CONSTANT";
};
export type JourneyData = {
  duration: number;
  referenceSize: [number, number];
  pixelRadius: number;
  points: [number, number, number][];
  tangents: [number, number, number][];
  sourceSHA256: string;
  reveal: { start: ScalarKey[]; end: ScalarKey[] };
  revealVerification: [number, number, number][];
  zones: Record<string, [number, number, number, number]>;
};

const bezier = (a: number, b: number, c: number, d: number, t: number) => {
  const s = 1 - t;
  return s * s * s * a + 3 * s * s * t * b + 3 * s * t * t * c + t * t * t * d;
};

/** Read the saved Blender scalar curve. Its time handles are not necessarily linear. */
export function sampleScalar(keys: ScalarKey[], p: number): number {
  if (p <= keys[0].p) return keys[0].value;
  if (p >= keys[keys.length - 1].p) return keys[keys.length - 1].value;
  let low = 0, high = keys.length - 1;
  while (high - low > 1) {
    const middle = (low + high) >>> 1;
    if (keys[middle].p <= p) low = middle;
    else high = middle;
  }
  const a = keys[low], b = keys[high];
  if (a.interpolation === "CONSTANT") return a.value;
  if (a.interpolation === "LINEAR") return a.value + (b.value - a.value) * (p - a.p) / (b.p - a.p);
  let left = 0, right = 1;
  for (let i = 0; i < 24; i++) {
    const t = (left + right) / 2;
    if (bezier(a.p, a.right[0], b.left[0], b.p, t) < p) left = t;
    else right = t;
  }
  return bezier(a.value, a.right[1], b.left[1], b.value, (left + right) / 2);
}

export function createThreadCurve(data: JourneyData) {
  const points = data.points.map((v) => new Vector3(...v));
  const tangents = data.tangents.map((v) => new Vector3(...v));
  const interpolate = (values: Vector3[], t: number, target: Vector3) => {
    const segment = clamp(t) * (values.length - 1);
    const index = Math.min(values.length - 2, Math.floor(segment));
    return target.copy(values[index]).lerp(values[index + 1], segment - index);
  };
  return new (class extends Curve<Vector3> {
    constructor() { super(); }
    getPoint(t: number, target = new Vector3()) { return interpolate(points, t, target); }
    getPointAt(t: number, target = new Vector3()) { return this.getPoint(t, target); }
    getTangent(t: number, target = new Vector3()) { return interpolate(tangents, t, target).normalize(); }
    getTangentAt(t: number, target = new Vector3()) { return this.getTangent(t, target); }
  })();
}
