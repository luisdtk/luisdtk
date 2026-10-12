import React from "react";
import { AbsoluteFill, random } from "remotion";
import { tri } from "../theme";

/** Força e altura do brilho num quadro. */
export const glowState = (f: number) => {
  let force = 0.22 + 0.03 * Math.sin((2 * Math.PI * f) / 240);
  let height = 500 + 40 * Math.sin((2 * Math.PI * f) / 330);
  const pulses: [number, number, number][] = [
    [246, 26, 1],
    [520, 22, 0.7],
    [692, 24, 1],
    [858, 22, 0.8],
  ];
  for (const [p, h, w] of pulses) {
    const t = tri(f, p, h);
    force += 0.12 * w * w * t;
    height += 110 * w * t;
  }
  return { force, height };
};

/** Gradiente do brilho: elipse com centro 120 px abaixo da borda, força × (1 − d)^1.9. */
export const glowGradient = (
  force: number,
  height: number,
  rgb: string,
  w = 1920,
  h = 1080,
  scale = 1,
) => {
  const stops: string[] = [];
  const n = 14;
  for (let i = 0; i <= n; i++) {
    const d = i / n;
    const a = force * Math.pow(1 - d, 1.9);
    stops.push(`rgba(${rgb},${a.toFixed(4)}) ${(d * 100).toFixed(1)}%`);
  }
  const rx = 1560 * scale;
  const ry = (height + 120) * scale;
  return `radial-gradient(${rx}px ${ry}px at ${w / 2}px ${h + 120 * scale}px, ${stops.join(", ")})`;
};

export const Glow: React.FC<{ frame: number }> = ({ frame }) => {
  const { force, height } = glowState(frame);
  return <AbsoluteFill style={{ background: glowGradient(force, height, "255,255,255") }} />;
};

/** Grão de filme: só escurece, troca a cada 2 quadros. */
export const Grain: React.FC<{ frame: number }> = ({ frame }) => {
  const seed = Math.floor(frame / 2);
  const ox = Math.floor(random(`gx${seed}`) * 200);
  const oy = Math.floor(random(`gy${seed}`) * 200);
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <svg width={1920} height={1080} style={{ position: "absolute" }}>
        <filter id={`grain${seed % 50}`} x="0" y="0" width="100%" height="100%">
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves={2} seed={seed % 997} stitchTiles="stitch" />
          <feColorMatrix type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  2.6 0 0 0 -0.95" />
        </filter>
        <rect x={-ox} y={-oy} width={1920 + 200} height={1080 + 200} filter={`url(#grain${seed % 50})`} opacity={0.13} />
      </svg>
    </AbsoluteFill>
  );
};
