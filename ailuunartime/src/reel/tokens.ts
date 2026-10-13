/** The reel's look: black, white and Asta red. Hex only (anything here may animate). */
export const color = {
  bg: "#0a0a0a",
  surface: "#141414",
  surfaceRaised: "#1b1b1b",
  line: "#2a2a2a",
  ink: "#0a0a0a",
  paper: "#f4f2ee",
  white: "#ffffff",
  muted: "#8a8a8a",
  red: "#e2262b",
  redHot: "#ff3b3f",
  redDeep: "#5a0609",
} as const;

export const font = {
  display: "Anton",
  ui: "Inter",
  mono: "JetBrains Mono",
} as const;

export const FRAME = { width: 1080, height: 1920 } as const;

/** Instagram Reels safe area: keep important content inside. */
export const SAFE = { top: 250, bottom: 1580, left: 72, right: 1008 } as const;

/** Expo-out: fast and settled, the reel's default for entrances. */
export const easeOut = (u: number) => (u >= 1 ? 1 : 1 - Math.pow(2, -10 * u));
export const easeIn = (u: number) => (u <= 0 ? 0 : Math.pow(2, 10 * u - 10));
export const easeInOut = (u: number) =>
  u <= 0 ? 0 : u >= 1 ? 1 : u < 0.5 ? Math.pow(2, 20 * u - 10) / 2 : (2 - Math.pow(2, -20 * u + 10)) / 2;
/** cubic-bezier(0.22, 1, 0.36, 1), the punchline landing curve from the skill. */
export const land = (u: number) => {
  if (u <= 0) return 0;
  if (u >= 1) return 1;
  // solve the bezier x(s) = u by bisection, return y(s)
  const bx = (s: number) => 3 * (1 - s) ** 2 * s * 0.22 + 3 * (1 - s) * s * s * 0.36 + s ** 3;
  const by = (s: number) => 3 * (1 - s) ** 2 * s * 1 + 3 * (1 - s) * s * s * 1 + s ** 3;
  let lo = 0;
  let hi = 1;
  for (let i = 0; i < 24; i++) {
    const mid = (lo + hi) / 2;
    if (bx(mid) < u) lo = mid;
    else hi = mid;
  }
  return by((lo + hi) / 2);
};

export const lerp = (a: number, b: number, u: number) => a + (b - a) * u;

/** Deterministic pseudo-random numbers (seeded), so every render paints the same frame. */
export function seeded(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
