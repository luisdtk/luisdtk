import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { motionBlur, pulse, SMOOTH } from "../lib/anim";
import { Network } from "./Network";

const k = (frame: number, input: number[], output: number[]) =>
  interpolate(frame, input, output, { easing: SMOOTH, extrapolateLeft: "clamp", extrapolateRight: "clamp" });

// One continuous network world shared by scenes 1–3 (global keyframes).
const opacityAt = (f: number) =>
  k(f, [118, 165, 245, 280, 292, 322, 612, 642, 878, 902], [0, 0.6, 0.6, 0.9, 0.9, 0.2, 0.2, 0.95, 0.95, 0]);
const scaleAt = (f: number) =>
  k(f, [118, 192, 246, 286, 600, 612, 652, 664, 704], [0.82, 1, 1, 2.3, 1.35, 1.35, 0.86, 0.86, 0.74]);
const xAt = (f: number) => k(f, [662, 704], [0, 520]);
const activationAt = (f: number) => k(f, [122, 192, 246, 286, 330, 560, 612, 652], [0, 0.42, 0.42, 0.6, 0.6, 0.8, 0.8, 1]);

export const WorldNetwork: React.FC = () => {
  const frame = useCurrentFrame();
  const opacity = opacityAt(frame);
  if (opacity <= 0.001) return null;
  const scale = scaleAt(frame);
  const x = xAt(frame);
  const blur = motionBlur((f) => scaleAt(f) * 400 + xAt(f), frame, 0.12, 8);
  const p = Math.min(1, pulse(frame, 128, 10) + pulse(frame, 648, 9) + pulse(frame, 866, 10));
  // Scene 3: the connected world lives on the right half only.
  const clipLeft = k(frame, [684, 712], [0, 960]);
  return (
    <AbsoluteFill style={{ opacity, clipPath: clipLeft > 0 ? `inset(0 0 0 ${clipLeft}px)` : undefined }}>
      <AbsoluteFill
        style={{
          transform: `translateX(${x}px) scale(${scale}) rotate(${frame * 0.012}deg)`,
          filter: blur > 0 ? `blur(${blur}px)` : undefined,
        }}
      >
        <Network activation={activationAt(frame)} pulse={p} />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
