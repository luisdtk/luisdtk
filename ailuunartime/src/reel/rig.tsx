import type { CSSProperties } from "react";
import { Img, staticFile } from "remotion";

import manifest from "../../public/anim/manifest.json";

/**
 * Animation inside the art, Live2D-style, drawn offline by tools/animate.py: hair and cloth
 * flow on travelling waves, eyes blink, 24-frame loops at 12 fps ("on twos", like TV anime).
 * The reel only picks the frame for each instant, so renders stay deterministic.
 */
export type AnimName = keyof typeof manifest;

/** The frame of an animated loop at time t (`phase` in seconds shifts the loop). */
export function animSrc(name: AnimName, t: number, phase = 0) {
  const { frames, fps } = manifest[name];
  const i = ((Math.floor((t + phase) * fps) % frames) + frames) % frames;
  return staticFile(`anim/${name}/${i}.webp`);
}

/** Asta in his own colours, alive: hair and cape flow, and he blinks. Drop-in for the plain <Img>. */
export function LiveAsta({ t, size, style, phase = 0, anim = "asta" }: { t: number; size: number; style?: CSSProperties; phase?: number; anim?: "asta" | "asta-red" }) {
  return (
    <div style={{ position: "absolute", width: size, height: size, ...style }}>
      <Img src={animSrc(anim, t, phase)} style={{ position: "absolute", inset: 0, width: size, height: size }} />
    </div>
  );
}
