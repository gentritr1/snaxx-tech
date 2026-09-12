import type { RefObject } from "react";

export const clamp = (value: number) => Math.max(0, Math.min(1, value));
export const dampProgress = (current: number, target: number, dt: number) =>
  current + (target - current) * (1 - Math.exp(-dt * 9));

export interface MotionDriver {
  targetP: RefObject<number>;
  p: number;
  inView: boolean;
  wake: () => void;
  present: (p: number, dt: number) => void;
  reviewStill: boolean;
}

export const actAt = (p: number) =>
  p < 0.225
    ? "word"
    : p < 0.45
      ? "world"
      : p < 0.665
        ? "descent"
        : p < 0.9
          ? "arrow"
          : "landed";
