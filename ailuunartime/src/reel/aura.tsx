import { seeded } from "./tokens";

/**
 * Red energy pouring off Asta's blade: flickering streaks rising off the edge, and sparks.
 * `base` and `tip` are the blade's edge in this box's pixels.
 */
export function BladeEnergy({ t, w, h, base, tip, strength = 1, scale = 1 }: { t: number; w: number; h: number; base: { x: number; y: number }; tip: { x: number; y: number }; strength?: number; scale?: number }) {
  if (strength <= 0) return null;
  return (
    <svg width={w} height={h} style={{ position: "absolute", inset: 0, mixBlendMode: "screen", opacity: strength, pointerEvents: "none", overflow: "visible" }}>
      {Array.from({ length: 30 }, (_, i) => {
        const u = (i + 0.5) / 30;
        const px = base.x + (tip.x - base.x) * u;
        const py = base.y + (tip.y - base.y) * u;
        const life = (t * (1.2 + (i % 5) * 0.18) + i * 0.37) % 1;
        const len = (50 + (i % 4) * 34) * (1 - life * 0.5) * scale;
        const drift = life * 110 * scale;
        const x0 = px + drift * 0.9;
        const y0 = py - drift * 0.4;
        const wob = Math.sin(t * 10 + i) * 12 * scale;
        return (
          <path
            key={i}
            d={`M${x0} ${y0} q ${(20 * scale + wob).toFixed(1)} ${(-len * 0.5).toFixed(1)} ${(4 * scale).toFixed(1)} ${(-len).toFixed(1)}`}
            stroke={i % 3 === 0 ? "#ffb3b3" : "#e2262b"}
            strokeWidth={(7 - life * 5) * scale}
            fill="none"
            strokeLinecap="round"
            opacity={Math.sin(life * Math.PI) * 0.95}
            style={{ filter: `drop-shadow(0 0 ${10 * scale}px rgba(226,38,43,0.95))` }}
          />
        );
      })}
    </svg>
  );
}

/**
 * Yuno's wind magic: green and gold streaks and leaves circling him, an orbit that tilts and breathes.
 * `cx, cy` is his centre and `r` the orbit radius, in this box's pixels.
 */
export function YunoAura({ t, w, h, cx, cy, r, strength = 1 }: { t: number; w: number; h: number; cx: number; cy: number; r: number; strength?: number }) {
  if (strength <= 0) return null;
  const rand = seeded(61);
  const colours = ["#4ade80", "#a3e635", "#facc15", "#fde68a", "#22c55e"];
  return (
    <svg width={w} height={h} style={{ position: "absolute", inset: 0, mixBlendMode: "screen", opacity: strength, pointerEvents: "none", overflow: "visible" }}>
      {/* swirling streaks: arcs of an ellipse that spin around him */}
      {Array.from({ length: 16 }, (_, i) => {
        const rr = r * (0.7 + rand() * 0.6);
        const tilt = -0.35 + rand() * 0.2;
        const a0 = t * (2.4 + rand() * 1.6) + i * 0.9;
        const span = 0.9 + rand() * 0.8;
        const pts = Array.from({ length: 14 }, (_, k) => {
          const a = a0 + (span * k) / 13;
          const ex = Math.cos(a) * rr;
          const ey = Math.sin(a) * rr * 0.42;
          return `${k ? "L" : "M"}${(cx + ex * Math.cos(tilt) - ey * Math.sin(tilt)).toFixed(1)} ${(cy + ex * Math.sin(tilt) + ey * Math.cos(tilt) + (i % 4 - 1.5) * r * 0.18).toFixed(1)}`;
        }).join(" ");
        const c = colours[i % colours.length];
        return <path key={i} d={pts} stroke={c} strokeWidth={r * (0.012 + rand() * 0.02)} fill="none" strokeLinecap="round" opacity={0.8} style={{ filter: `drop-shadow(0 0 ${r * 0.05}px ${c})` }} />;
      })}
      {/* leaves and motes riding the wind */}
      {Array.from({ length: 22 }, (_, i) => {
        const a = t * (1.6 + rand()) + i * 0.6;
        const rr = r * (0.5 + rand() * 0.9);
        const x = cx + Math.cos(a) * rr;
        const y = cy + Math.sin(a) * rr * 0.45 - ((t * 60 + i * 40) % (r * 1.6)) * 0.4;
        const s = r * (0.02 + rand() * 0.03);
        const c = colours[(i + 2) % colours.length];
        return <ellipse key={`m${i}`} cx={x} cy={y} rx={s * 1.8} ry={s * 0.7} transform={`rotate(${(a * 57) % 360} ${x} ${y})`} fill={c} opacity={0.85} style={{ filter: `drop-shadow(0 0 ${s * 2}px ${c})` }} />;
      })}
    </svg>
  );
}
