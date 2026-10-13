import type { CSSProperties } from "react";
import { AbsoluteFill, Img, staticFile } from "remotion";

import { clamp01 } from "../kit/time";
import { color, font, FRAME, seeded } from "./tokens";

/** Film grain, re-seeded 24 times a second (pure function of t). */
export function Grain({ t, opacity = 0.07 }: { t: number; opacity?: number }) {
  const seed = Math.floor(t * 24);
  return (
    <AbsoluteFill style={{ pointerEvents: "none", opacity, mixBlendMode: "screen" }}>
      <svg width={FRAME.width} height={FRAME.height}>
        <filter id={`grain-${seed}`}>
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves={2} seed={seed} stitchTiles="stitch" />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        <rect width="100%" height="100%" filter={`url(#grain-${seed})`} />
      </svg>
    </AbsoluteFill>
  );
}

export function Vignette({ strength = 0.75 }: { strength?: number }) {
  return (
    <AbsoluteFill
      style={{
        pointerEvents: "none",
        background: `radial-gradient(ellipse 75% 60% at 50% 50%, rgba(0,0,0,0) 55%, rgba(0,0,0,${strength}) 100%)`,
      }}
    />
  );
}

/**
 * Pixel embers: small red squares that drift up and flicker, echoing the
 * mascot's pixels. Every ember's path is seeded, so frames are repeatable.
 */
export function Embers({
  t,
  start,
  end,
  count = 36,
  seed = 1,
  area = { x: 0, y: 0, w: FRAME.width, h: FRAME.height },
  rise = 260,
  size = 8,
  intensity = 1,
}: {
  t: number;
  start: number;
  end: number;
  count?: number;
  seed?: number;
  area?: { x: number; y: number; w: number; h: number };
  rise?: number;
  size?: number;
  intensity?: number;
}) {
  if (t < start || t > end + 1.2) return null;
  const rand = seeded(seed);
  const fadeIn = clamp01((t - start) / 0.25);
  const fadeOut = 1 - clamp01((t - end) / 0.4);
  const embers = Array.from({ length: count }, (_, i) => {
    const x0 = area.x + rand() * area.w;
    const y0 = area.y + rand() * area.h;
    const speed = 0.5 + rand();
    const phase = rand() * 10;
    const s = Math.round(size * (0.5 + rand()));
    const life = ((t - start) * speed * 0.6 + phase) % 1;
    const y = y0 - life * rise * speed;
    const x = x0 + Math.sin((t + phase) * 2.2) * 14;
    const flicker = 0.55 + 0.45 * Math.sin(t * 19 + i * 3.1);
    const alpha = Math.sin(life * Math.PI) * flicker * fadeIn * fadeOut * intensity;
    const hot = rand() > 0.82;
    return (
      <div
        key={i}
        style={{
          position: "absolute",
          left: Math.round(x / 2) * 2,
          top: Math.round(y / 2) * 2,
          width: s,
          height: s,
          background: hot ? color.white : color.red,
          opacity: Math.max(0, alpha),
          boxShadow: hot ? "none" : `0 0 ${s * 1.5}px ${color.red}`,
        }}
      />
    );
  });
  return <AbsoluteFill style={{ pointerEvents: "none" }}>{embers}</AbsoluteFill>;
}

/** The pixel Asta mascot (the reader app's icon). */
export function Mascot({ size, style }: { size: number; style?: CSSProperties }) {
  return (
    <Img
      src={staticFile("images/asta-mascot.png")}
      style={{ width: size, height: size, imageRendering: "pixelated", display: "block", ...style }}
    />
  );
}

/** The Ailuunartime logo (tools/logo.py cut it out of the white background). Aspect 2833:1383. */
export const LOGO_ASPECT = 2833 / 1383;
export function Logo({ width, red = false, style }: { width: number; red?: boolean; style?: CSSProperties }) {
  return (
    <Img
      src={staticFile(red ? "images/logo-red.png" : "images/logo-white.png")}
      style={{ width, height: width / LOGO_ASPECT, display: "block", ...style }}
    />
  );
}

/** A thin red energy line that cuts across the frame at an angle. */
export function Slash({ progress, angle = -24, y = FRAME.height / 2, thickness = 10, glow = 1 }: { progress: number; angle?: number; y?: number; thickness?: number; glow?: number }) {
  if (progress <= 0 || progress >= 1) return null;
  const head = clamp01(progress / 0.55);
  const tail = clamp01((progress - 0.35) / 0.65);
  const length = 2600;
  return (
    <div
      style={{
        position: "absolute",
        left: FRAME.width / 2 - length / 2,
        top: y - thickness / 2,
        width: length,
        height: thickness,
        rotate: `${angle}deg`,
        pointerEvents: "none",
      }}
    >
      <div
        style={{
          position: "absolute",
          left: `${tail * 100}%`,
          width: `${Math.max(0, head - tail) * 100}%`,
          height: "100%",
          background: `linear-gradient(90deg, rgba(226,38,43,0), ${color.red} 40%, ${color.white} 92%, ${color.white})`,
          boxShadow: `0 0 ${40 * glow}px ${12 * glow}px rgba(226,38,43,0.55)`,
          borderRadius: thickness,
        }}
      />
    </div>
  );
}
