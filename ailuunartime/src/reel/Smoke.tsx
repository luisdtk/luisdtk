import { seeded } from "./tokens";

/**
 * Cigarette smoke: soft puffs born at the tip, rising and drifting with the wind, swelling and
 * thinning as they go, plus a thin curling wisp. Every puff's path is a function of t.
 */
export function Smoke({ t, x, y, w, h, wind = -1 }: { t: number; x: number; y: number; w: number; h: number; wind?: number }) {
  const rand = seeded(17);
  const LIFE = 1.8;
  const puffs = Array.from({ length: 34 }, (_, i) => {
    const born = i * (LIFE / 34) + rand() * 0.04;
    const u = (((t - born) % LIFE) + LIFE) % LIFE / LIFE;
    const curl = Math.sin(u * 6 + i) * (10 + u * 26);
    const px = x + wind * u * 230 + curl;
    const py = y - u * 190 - Math.sin(u * 3 + i) * 8;
    const r = 6 + u * 46 + rand() * 6;
    const a = Math.sin(Math.min(1, u * 4) * Math.PI * 0.5) * (1 - u) * 0.42;
    return <circle key={i} cx={px} cy={py} r={r} fill="#e9e6e2" opacity={a} />;
  });
  const wisp = Array.from({ length: 24 }, (_, k) => {
    const u = k / 23;
    const px = x + wind * u * 150 + Math.sin(t * 3 + u * 7) * 12 * u;
    const py = y - u * 130;
    return `${k ? "L" : "M"}${px.toFixed(1)} ${py.toFixed(1)}`;
  }).join(" ");
  return (
    <svg width={w} height={h} style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
      <defs>
        <filter id="smoke-soft" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="7" />
        </filter>
      </defs>
      <g filter="url(#smoke-soft)">{puffs}</g>
      <path d={wisp} stroke="#f2f0ec" strokeWidth={3} fill="none" opacity={0.55} strokeLinecap="round" style={{ filter: "blur(1.2px)" }} />
    </svg>
  );
}

/** Wind: thin streaks crossing the frame, the way an anime shot shows a gust. */
export function Gust({ t, w, h, wind = -1 }: { t: number; w: number; h: number; wind?: number }) {
  const rand = seeded(23);
  return (
    <svg width={w} height={h} style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
      {Array.from({ length: 14 }, (_, i) => {
        const y = rand() * h;
        const speed = 900 + rand() * 700;
        const len = 80 + rand() * 160;
        const span = w + len * 2;
        const x = wind < 0 ? span - ((t * speed + rand() * span) % span) - len : ((t * speed + rand() * span) % span) - len;
        return <line key={i} x1={x} y1={y} x2={x + len} y2={y - 6} stroke="#ffffff" strokeWidth={1.6} opacity={0.18 + rand() * 0.2} strokeLinecap="round" />;
      })}
    </svg>
  );
}
