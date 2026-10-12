import type React from "react";
import { Easing, interpolate, interpolateColors } from "remotion";
import { loadFont as loadSerif } from "@remotion/google-fonts/SourceSerif4";
import { loadFont as loadInter } from "@remotion/google-fonts/Inter";
import { loadFont as loadMono } from "@remotion/google-fonts/JetBrainsMono";
import { loadFont as loadUnbounded } from "@remotion/google-fonts/Unbounded";

const serif = loadSerif("normal", { weights: ["400", "600"], subsets: ["latin", "latin-ext"] });
const inter = loadInter("normal", { weights: ["400", "500", "600", "700"], subsets: ["latin", "latin-ext"] });
const mono = loadMono("normal", { weights: ["400"], subsets: ["latin"] });
const unbounded = loadUnbounded("normal", { weights: ["300"], subsets: ["latin", "latin-ext"] });

export const fontsReady = () =>
  Promise.all([serif.waitUntilDone(), inter.waitUntilDone(), mono.waitUntilDone(), unbounded.waitUntilDone()]);

export const SERIF = serif.fontFamily;
export const INTER = inter.fontFamily;
export const MONO = mono.fontFamily;
export const UNBOUNDED = unbounded.fontFamily;

export const C = {
  // mundo escuro (preto e branco)
  bg: "#0a0a0a",
  cream: "#f2f2f2", // títulos e textos
  light: "#c4c4c4",
  accent: "#ffffff", // destaque branco puro
  hot: "#ffffff", // texto que acabou de nascer
  mid: "#8a8a8a", // rótulos
  box: "rgba(26,26,26,0.94)",
  boxBorder: "rgba(255,255,255,0.12)",
  boxShadow: "0 18px 50px rgba(0,0,0,0.5)",
  // tela clara
  paper: "#fcfcfc",
  ink: "#0b0b0b",
  codeInk: "#383838",
  support: "#525252",
  faint: "#8a8a8a",
  bubble: "#efefef",
  codeBg: "#f5f5f5",
  // Instagram (preto e branco)
  igGray: "#737373",
  igDiv: "#efefef",
  igBorder: "#dbdbdb",
  igMention: "#000000",
  igSend: "#111111",
  igLike: "#000000",
  kb: "#d4d4d4",
  kbSpecial: "#adadad",
};

export const ease = Easing.bezier(0.45, 0, 0.2, 1);
export const easeOut = Easing.out(Easing.cubic);
export const easeIn = Easing.in(Easing.cubic);
export const snap = Easing.out(Easing.back(1.6));
export const snapStrong = Easing.out(Easing.back(2.2));
export const linear = (x: number) => x;

/** Progresso de 0 a 1 entre os quadros a e b, com curva. */
export const prog = (f: number, a: number, b: number, easing: (x: number) => number = ease) =>
  interpolate(f, [a, b], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing });

export const mix = (a: number, b: number, p: number) => a + (b - a) * p;

export const clamp01 = (x: number) => Math.max(0, Math.min(1, x));

const peakCache = new Map<(x: number) => number, number>();
const peakSpeed = (e: (x: number) => number) => {
  const c = peakCache.get(e);
  if (c) return c;
  let m = 0;
  for (let i = 0; i <= 200; i++) {
    const x = i / 200;
    const d = Math.abs(e(Math.min(1, x + 0.002)) - e(Math.max(0, x - 0.002))) / 0.004;
    m = Math.max(m, d);
  }
  peakCache.set(e, m);
  return m;
};

/** Borrão proporcional à velocidade do movimento (zero quando a peça para). */
export const motionBlur = (f: number, a: number, b: number, max: number, easing: (x: number) => number = ease) => {
  if (f <= a || f >= b) return 0;
  const x = (f - a) / (b - a);
  const d = Math.abs(easing(Math.min(1, x + 0.002)) - easing(Math.max(0, x - 0.002))) / 0.004;
  return Math.min(max, (max * d) / peakSpeed(easing));
};

/** Texto que acabou de nascer: mais contraste e um brilho suave, esfriando em ~16 quadros.
 * No escuro: branco puro com halo branco. No claro: preto puro, um pouco mais grosso, com halo cinza fraco. */
export const born = (age: number, normal: string, dur = 16, light = false): React.CSSProperties => {
  const hot = light ? "#000000" : "#ffffff";
  if (age < 0) return { color: hot };
  const p = clamp01(age / dur);
  const pe = easeOut(p);
  const color = interpolateColors(pe, [0, 1], [hot, normal]);
  const g = 1 - pe;
  if (g < 0.01) return { color };
  return light
    ? {
        color,
        WebkitTextStroke: `${(0.7 * g).toFixed(2)}px #000`,
        textShadow: `0 0 ${8 + 6 * g}px rgba(0,0,0,${(0.18 * g).toFixed(3)})`,
      }
    : {
        color,
        textShadow: `0 0 ${10 + 10 * g}px rgba(255,255,255,${(0.75 * g).toFixed(3)})`,
      };
};

/** Pico em forma de triângulo. */
export const tri = (f: number, peak: number, half: number) => Math.max(0, 1 - Math.abs(f - peak) / half);

type Key = { f: number; v: number[]; mode?: "drift" | "move" };

/** Trilha de câmera com quadros-chave. Retorna os valores e a "velocidade" relativa do movimento. */
export const track = (f: number, keys: Key[]) => {
  if (f <= keys[0].f) return { v: keys[0].v, moving: 0 };
  for (let i = 1; i < keys.length; i++) {
    const k0 = keys[i - 1];
    const k1 = keys[i];
    if (f <= k1.f) {
      const x = (f - k0.f) / (k1.f - k0.f);
      const isMove = k1.mode === "move";
      const p = isMove ? ease(x) : x;
      const v = k0.v.map((a, j) => mix(a, k1.v[j], p));
      const moving = isMove ? motionBlur(f, k0.f, k1.f, 1) : 0;
      return { v, moving, seg: i };
    }
  }
  return { v: keys[keys.length - 1].v, moving: 0 };
};

/** Medida de texto com o canvas do navegador (as fontes já estão carregadas). */
let ctx: CanvasRenderingContext2D | null = null;
export const measure = (text: string, font: string, letterSpacingPx = 0) => {
  if (!ctx) ctx = document.createElement("canvas").getContext("2d");
  if (!ctx) return text.length * 20;
  ctx.font = font;
  return ctx.measureText(text).width + letterSpacingPx * text.length;
};

export const W = 1920;
export const H = 1080;
export const FPS = 30;
export const DURATION = 1710;
