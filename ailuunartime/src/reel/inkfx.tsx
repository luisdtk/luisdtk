import { seeded } from "./tokens";

/**
 * Anime focus lines: thin ink spikes converging on a point, redrawn 12 times a second.
 * Sized to any box, so the full-frame scene and the small reader panels share it.
 */
export function FocusLines({ t, w, h, cx, cy, strength, count = 90, inner = 0.48 }: { t: number; w: number; h: number; cx: number; cy: number; strength: number; count?: number; inner?: number }) {
  if (strength <= 0) return null;
  const rand = seeded(Math.floor(t * 12) + 5);
  const reach = Math.hypot(w, h);
  const r0Base = Math.min(w, h) * inner;
  const thick = Math.max(1, Math.min(w, h) / 1080) * 3;
  return (
    <svg width={w} height={h} style={{ position: "absolute", inset: 0, opacity: strength, pointerEvents: "none" }}>
      {Array.from({ length: count }, (_, i) => {
        const a = (i / count) * Math.PI * 2 + rand() * 0.06;
        const r0 = r0Base * (1 + rand() * 0.5);
        const wd = thick * (0.6 + rand() * 2.2);
        const n = { x: -Math.sin(a), y: Math.cos(a) };
        const p0 = { x: cx + Math.cos(a) * r0, y: cy + Math.sin(a) * r0 };
        const p1 = { x: cx + Math.cos(a) * reach, y: cy + Math.sin(a) * reach };
        return <path key={i} d={`M${p0.x} ${p0.y} L${p1.x + n.x * wd} ${p1.y + n.y * wd} L${p1.x - n.x * wd} ${p1.y - n.y * wd} Z`} fill="#e2262b" />;
      })}
    </svg>
  );
}

/** A deterministic impact shake (pixels), re-rolled 24 times a second while `amount` > 0. */
export function shake(t: number, amount: number, seed = 1) {
  if (amount <= 0) return { x: 0, y: 0 };
  const rand = seeded(Math.floor(t * 24) * 31 + seed);
  return { x: (rand() - 0.5) * 2 * amount, y: (rand() - 0.5) * 2 * amount };
}
