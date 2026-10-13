/** Shared by the manga scene and the reader. */
/** Wind lines circling over the tornado panel, monochrome like the ink. */
export function Wind({ t, w, h, strength }: { t: number; w: number; h: number; strength: number }) {
  if (strength <= 0) return null;
  const cx = w * 0.62;
  const cy = h * 0.5;
  return (
    <svg width={w} height={h} style={{ position: "absolute", inset: 0, mixBlendMode: "multiply" }}>
      {Array.from({ length: 14 }, (_, i) => {
        const r = 30 + i * 16;
        const spin = t * (5 + i * 0.35) + i * 1.3;
        const len = 0.9 + (i % 3) * 0.4;
        const a0 = spin;
        const a1 = spin + len;
        const x0 = cx + Math.cos(a0) * r * 1.5;
        const y0 = cy + Math.sin(a0) * r * 0.45 - i * 14 + 90;
        const x1 = cx + Math.cos(a1) * r * 1.5;
        const y1 = cy + Math.sin(a1) * r * 0.45 - i * 14 + 90;
        return <path key={i} d={`M${x0} ${y0} A ${r * 1.5} ${r * 0.45} 0 0 1 ${x1} ${y1}`} stroke="#1a1a1a" strokeWidth={2.4} fill="none" strokeLinecap="round" opacity={0.75 * strength} />;
      })}
    </svg>
  );
}
