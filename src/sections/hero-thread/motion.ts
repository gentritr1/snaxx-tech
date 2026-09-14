import type { RefObject } from "react";
export const clamp = (value: number) => Math.max(0, Math.min(1, value));

/** Exponential follow with a display-frame step ceiling, including delayed frames. */
export function dampProgress(current: number, target: number, dt: number) {
  const delta = (target - current) * (1 - Math.exp(-Math.max(0, dt) * 9));
  const limit = Math.min(.012, Math.max(0, dt) * .72);
  return current + Math.max(-limit, Math.min(limit, delta));
}
export interface MotionDriver {
  targetP: RefObject<number>;
  p: number;
  inView: boolean;
  wake: () => void;
  present: (p: number, dt: number) => void;
  reviewStill: boolean;
}
export const copyTimes = {
  word: [0, .04, .17, .20], world: [.24, .28, .45, .48],
  descent: [.49, .53, .60, .63], arrow: [.71, .75, .88, .91],
} as const;
export type CopyAct = keyof typeof copyTimes;
export function copyPose(act: CopyAct, p: number) {
  const [a, b, c, d] = copyTimes[act];
  const enter = clamp((p - a) / (b - a)), exit = clamp((p - c) / (d - c));
  return { opacity: Math.min(enter, 1 - exit), y: 16 * (1 - enter) - 12 * exit };
}
export const actAt = (p: number) => p < .225 ? "word" : p < .48 ? "world" : p < .67 ? "descent" : p < .91 ? "arrow" : "landed";
