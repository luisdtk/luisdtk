import React, { useMemo } from "react";
import { AbsoluteFill, random, useCurrentFrame } from "remotion";
import { COLORS, LIGHT_PULSES } from "../config";
import { pulse } from "../lib/anim";

/** Strength of the global light at a frame (slow breathing + key-moment pulses). */
export const lightLevel = (frame: number) => {
  const breathe = 0.5 + 0.5 * Math.sin(frame / 42);
  const p = LIGHT_PULSES.reduce((acc, at) => acc + pulse(frame, at, 14), 0);
  return { breathe, pulse: Math.min(1, p) };
};

/**
 * Reusable dark cinematic background: animated deep-charcoal gradient,
 * diffuse elliptical light rising from below, drifting particles and a vignette.
 */
export const Atmosphere: React.FC<{
  tint?: string;
  particleBoost?: number;
  lightBoost?: number;
}> = ({ tint = COLORS.cyan, particleBoost = 0, lightBoost = 0 }) => {
  const frame = useCurrentFrame();
  const { breathe, pulse: p } = lightLevel(frame);
  const light = 0.1 + breathe * 0.05 + p * 0.09 + lightBoost;
  const angle = 160 + Math.sin(frame / 90) * 18;

  const particles = useMemo(
    () =>
      new Array(90).fill(0).map((_, i) => ({
        x: random(`px${i}`) * 1920,
        y: random(`py${i}`) * 1080,
        r: 0.6 + random(`pr${i}`) * 1.8,
        speed: 0.08 + random(`ps${i}`) * 0.35,
        drift: random(`pd${i}`) * Math.PI * 2,
        depth: random(`pz${i}`),
        tw: random(`pt${i}`) * 100,
      })),
    [],
  );

  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.bg, overflow: "hidden" }}>
      <AbsoluteFill
        style={{
          background: `linear-gradient(${angle}deg, #0D1119 0%, ${COLORS.bg} 45%, #06080C 100%)`,
        }}
      />
      {/* Elliptical light rising from below */}
      <AbsoluteFill
        style={{
          background: `radial-gradient(ellipse 70% 55% at 50% ${112 - breathe * 6}%, ${hexA(tint, light)} 0%, ${hexA(
            tint,
            light * 0.35,
          )} 38%, transparent 72%)`,
        }}
      />
      <AbsoluteFill
        style={{
          background: `radial-gradient(ellipse 40% 30% at ${30 + Math.sin(frame / 120) * 8}% 18%, rgba(166,139,255,${
            0.035 + p * 0.03
          }) 0%, transparent 70%)`,
        }}
      />
      <svg width={1920} height={1080} style={{ position: "absolute" }}>
        {particles.map((pt, i) => {
          const y = (pt.y - frame * pt.speed * (0.5 + pt.depth) + 1080 * 4) % 1100 - 10;
          const x = pt.x + Math.sin(frame / 60 + pt.drift) * 14 * pt.depth;
          const tw = 0.5 + 0.5 * Math.sin(frame / 18 + pt.tw);
          const o = (0.12 + 0.35 * pt.depth) * (0.6 + 0.4 * tw) + p * 0.35 + particleBoost * pt.depth;
          return <circle key={i} cx={x} cy={y} r={pt.r * (0.6 + pt.depth)} fill={i % 7 === 0 ? COLORS.cyan : COLORS.text} opacity={Math.min(0.9, o)} />;
        })}
      </svg>
      <AbsoluteFill
        style={{
          background: "radial-gradient(ellipse 85% 80% at 50% 50%, transparent 55%, rgba(0,0,0,0.55) 100%)",
        }}
      />
    </AbsoluteFill>
  );
};

export const hexA = (hex: string, a: number) => {
  const h = hex.replace("#", "");
  const n = parseInt(h, 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${Math.max(0, Math.min(1, a)).toFixed(3)})`;
};
