import React from "react";
import { COLORS } from "../config";

const starPath = (points: number, radii: (i: number) => number, inner: number) => {
  const total = points * 2;
  let d = "";
  for (let k = 0; k < total; k++) {
    const a = (k / total) * Math.PI * 2 - Math.PI / 2;
    const r = k % 2 === 0 ? radii(k / 2) : inner;
    d += `${k === 0 ? "M" : "L"}${(Math.cos(a) * r).toFixed(2)},${(Math.sin(a) * r).toFixed(2)} `;
  }
  return d + "Z";
};

// Twelve-point energy symbol: 4 long primary rays, 8 shorter secondary rays.
const TWELVE = starPath(12, (i) => (i % 3 === 0 ? 50 : 26), 6.5);

/** The recurring twelve-point energy symbol (custom generated). */
export const EnergySymbol: React.FC<{
  size: number;
  rotation?: number;
  glow?: number;
  color?: string;
  core?: string;
  style?: React.CSSProperties;
}> = ({ size, rotation = 0, glow = 1, color = COLORS.cyan, core = COLORS.white, style }) => {
  const id = `es-${(color + core).replace(/[^a-zA-Z0-9]/g, "")}`;
  return (
    <svg
      width={size}
      height={size}
      viewBox="-60 -60 120 120"
      style={{
        overflow: "visible",
        filter: glow > 0 ? `drop-shadow(0 0 ${6 * glow}px ${color}) drop-shadow(0 0 ${18 * glow}px ${color}88)` : undefined,
        ...style,
      }}
    >
      <defs>
        <radialGradient id={id}>
          <stop offset="0%" stopColor={core} />
          <stop offset="35%" stopColor={core} />
          <stop offset="100%" stopColor={color} />
        </radialGradient>
      </defs>
      <g transform={`rotate(${rotation})`}>
        <path d={TWELVE} fill={`url(#${id})`} />
        <circle r={5} fill={core} />
      </g>
    </svg>
  );
};

/** Custom four-point star. */
export const FourStar: React.FC<{
  size: number;
  rotation?: number;
  color?: string;
  glow?: number;
  style?: React.CSSProperties;
}> = ({ size, rotation = 0, color = COLORS.white, glow = 1, style }) => {
  const R = 50;
  const c = 7;
  const d = `M0,${-R} Q${c},${-c} ${R},0 Q${c},${c} 0,${R} Q${-c},${c} ${-R},0 Q${-c},${-c} 0,${-R} Z`;
  return (
    <svg
      width={size}
      height={size}
      viewBox="-60 -60 120 120"
      style={{
        overflow: "visible",
        filter: glow > 0 ? `drop-shadow(0 0 ${6 * glow}px ${COLORS.cyan}) drop-shadow(0 0 ${16 * glow}px ${COLORS.cyan}66)` : undefined,
        ...style,
      }}
    >
      <path d={d} fill={color} transform={`rotate(${rotation})`} />
    </svg>
  );
};
