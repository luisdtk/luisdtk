import { Easing, interpolate, interpolateColors } from "remotion";

// Standard smooth curve ≈ cubic-bezier(0.45, 0, 0.2, 1)
export const SMOOTH = Easing.bezier(0.45, 0, 0.2, 1);
export const OUT = Easing.out(Easing.cubic);
export const IN = Easing.in(Easing.cubic);
export const OVERSHOOT = Easing.bezier(0.34, 1.56, 0.64, 1);

type EaseFn = (t: number) => number;

/** Clamped interpolation between two frames. */
export const ramp = (
  frame: number,
  start: number,
  end: number,
  from = 0,
  to = 1,
  easing: EaseFn = SMOOTH,
) =>
  interpolate(frame, [start, end], [from, to], {
    easing,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

/** Fade in (ease-out) then fade out (ease-in). */
export const inOut = (
  frame: number,
  inStart: number,
  inEnd: number,
  outStart: number,
  outEnd: number,
) => ramp(frame, inStart, inEnd, 0, 1, OUT) * ramp(frame, outStart, outEnd, 1, 0, IN);

export const mixColor = (t: number, a: string, b: string) =>
  interpolateColors(Math.max(0, Math.min(1, t)), [0, 1], [a, b]);

/**
 * Directional blur derived from velocity. Returns 0 when the value is not moving,
 * so text is always crisp while stationary.
 */
export const motionBlur = (
  fn: (f: number) => number,
  frame: number,
  strength = 0.25,
  max = 10,
) => {
  const v = Math.abs(fn(frame) - fn(frame - 1));
  const b = Math.min(max, v * strength);
  return b < 0.15 ? 0 : b;
};

/** Typing progress: number of visible characters. */
export const typed = (frame: number, start: number, end: number, total: number) =>
  Math.floor(ramp(frame, start, end, 0, total, (t) => t));

/** Smooth pulse (0→1→0) centered at `at`. */
export const pulse = (frame: number, at: number, width = 12) => {
  const d = (frame - at) / width;
  return Math.exp(-d * d * 2.5);
};

export const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
