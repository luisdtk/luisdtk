import React from "react";
import { AbsoluteFill, interpolateColors } from "remotion";
import { config } from "../config";
import { CODE_P4 } from "../codeText";
import {
  C,
  INTER,
  SERIF,
  born,
  clamp01,
  ease,
  easeIn,
  easeOut,
  measure,
  mix,
  motionBlur,
  prog,
  snap,
  snapStrong,
} from "../theme";
import { glowGradient } from "../components/Background";
import { Check, ClaudeSymbol, MacCursor, SendButton } from "../components/Pieces";

// ---------- O fundo claro que abre a partir do centro ----------
export const lightRadius = (f: number) => mix(60, 1380, prog(f, 896, 907, ease));
export const lightFade = (f: number) => 1 - prog(f, 1490, 1501, ease);
/** Quanto do ponto (x, y) da tela já está coberto pelo claro (0 a 1). */
export const lightCoverage = (f: number, x: number, y: number) => {
  if (f < 896) return 0;
  const r = lightRadius(f);
  const d = Math.hypot(x - 960, y - 540);
  return clamp01((r + 45 - d) / 90) * lightFade(f);
};

// ---------- Câmera ----------
type Row = [number, number, number | null, number, number, number, "drift" | "move" | null];
const CAM: Row[] = [
  [886, 960, 345, 1.34, 0, 0, null],
  [918, 960, 343, 1.27, 0, 0, "drift"],
  [930, 960, 505, 1.0, 0, 0, "move"],
  [969, 960, 500, 1.04, 0, 0, "drift"],
  [981, 960, 650, 1.2, 0, 0, "move"],
  [1068, 960, 656, 1.245, 0, 0, "drift"],
  [1082, 980, 262, 1.3, -4, 1.5, "move"],
  [1094, 970, 266, 1.32, -2, 0, "drift"],
  [1106, 770, 328, 1.7, 3, 0, "move"],
  [1112, 772, 330, 1.72, 3, 0, "drift"],
  [1124, 810, null, 1.52, 8, 2, "move"],
  [1140, 805, null, 1.55, 4, 1, "drift"],
  [1160, 800, null, 1.58, 0, 0, "drift"],
  [1180, 800, null, 1.6, -3, 0, "drift"],
  [1196, 760, 1508, 1.66, 0, 0, "move"],
  [1206, 655, 1766, 1.5, -3, 2, "move"],
  [1244, 649, 1775, 1.57, -1, 0.5, "drift"],
  [1266, 1010, 1798, 1.23, 4, 1, "move"],
  [1318, 1012, 1800, 1.25, 0.5, 0.5, "drift"],
  [1366, 1009, 1800, 1.25, -3, 0, "drift"],
  [1452, 1012, 1802, 1.25, 2, 0, "drift"],
  [1466, 1330, 1804, 1.38, -3, 1, "move"],
  [1507, 1330, 1806, 1.41, 0, 0, "drift"],
];

// ---------- O código que o Claude escreve ----------
const CODE_START = 1116;
const CODE_END = 1180;
const LINE_PAUSE = 5;
const totalUnits = CODE_P4.reduce((a, [, t]) => a + t.length, 0) + LINE_PAUSE * (CODE_P4.length - 1);
const RATE = (CODE_END - CODE_START) / totalUnits; // quadros por letra
const lineStart: number[] = [];
{
  let u = 0;
  CODE_P4.forEach(([, t], i) => {
    lineStart.push(CODE_START + u * RATE);
    u += t.length + (i < CODE_P4.length - 1 ? LINE_PAUSE : 0);
  });
}
const CODE_TOP = 392;
const lineTopY = (i: number) => CODE_TOP + 70 + 40 * i;
const currentLine = (f: number) => {
  let cur = 0;
  for (let i = 0; i < lineStart.length; i++) if (f >= lineStart[i]) cur = i;
  return cur;
};
const rawLineY = (f: number) => lineTopY(currentLine(f)) + 20 - 50;
const lineY = (f: number) => {
  let s = 0;
  for (let k = -10; k <= 10; k++) s += rawLineY(f + k);
  return s / 21;
};

const camAt = (f: number) => {
  if (f <= CAM[0][0]) return { x: CAM[0][1], y: CAM[0][2] as number, z: CAM[0][3], ry: 0, rx: 0, moving: 0 };
  for (let i = 1; i < CAM.length; i++) {
    const a = CAM[i - 1];
    const b = CAM[i];
    if (f <= b[0]) {
      const x = (f - a[0]) / (b[0] - a[0]);
      const move = b[6] === "move";
      const p = move ? ease(x) : x;
      // quando o destino é a "linha da vez", o alvo acompanha a escrita
      const ya = a[2] === null ? (b[2] === null ? lineY(f) : lineY(a[0])) : a[2];
      const yb = b[2] === null ? lineY(f) : b[2];
      const y = a[2] === null && b[2] === null ? lineY(f) : mix(ya, yb, p);
      return {
        x: mix(a[1], b[1], p),
        y,
        z: mix(a[3], b[3], p),
        ry: mix(a[4], b[4], p),
        rx: mix(a[5], b[5], p),
        moving: move ? motionBlur(f, a[0], b[0], 1) : 0,
      };
    }
  }
  const l = CAM[CAM.length - 1];
  return { x: l[1], y: l[2] as number, z: l[3], ry: l[4], rx: l[5], moving: 0 };
};

// ---------- Peças da página ----------
const PlusIcon: React.FC<{ size: number; color: string }> = ({ size, color }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" style={{ display: "block" }}>
    <path d="M12 4.5 V19.5 M4.5 12 H19.5" stroke={color} strokeWidth={1.6} strokeLinecap="round" />
  </svg>
);
const MicIcon: React.FC<{ size: number }> = ({ size }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" style={{ display: "block" }}>
    <rect x={9} y={3} width={6} height={11} rx={3} stroke={C.support} strokeWidth={1.6} fill="none" />
    <path d="M5.5 11 A6.5 6.5 0 0 0 18.5 11 M12 17.5 V21" stroke={C.support} strokeWidth={1.6} fill="none" strokeLinecap="round" />
  </svg>
);
const VoiceIcon: React.FC<{ size: number }> = ({ size }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" style={{ display: "block" }}>
    {[
      [4, 9, 15],
      [8, 6, 18],
      [12, 3, 21],
      [16, 7, 17],
      [20, 10, 14],
    ].map(([x, a, b], i) => (
      <line key={i} x1={x} y1={a} x2={x} y2={b} stroke={C.support} strokeWidth={1.8} strokeLinecap="round" />
    ))}
  </svg>
);

/** Pedaço de código que acabou de nascer: preto puro, em negrito, com um sublinhado de luz cinza. */
const codeHot = (age: number): React.CSSProperties => {
  if (age < 0) return {};
  const p = clamp01((age - 5) / 23);
  const g = 1 - easeOut(p);
  return {
    color: interpolateColors(1 - g, [0, 1], ["#000000", C.codeInk]),
    WebkitTextStroke: g > 0.02 ? `${(0.75 * g).toFixed(2)}px #000` : undefined,
    textDecorationLine: g > 0.02 ? "underline" : undefined,
    textDecorationColor: `rgba(0,0,0,${(0.28 * g).toFixed(3)})`,
    textDecorationThickness: 4,
    textUnderlineOffset: 7,
  };
};

const CodeBlock: React.FC<{ f: number }> = ({ f }) => {
  if (f < 1109 || f > 1232) return null;
  const inP = prog(f, 1109, 1121, easeOut);
  const blur = motionBlur(f, 1109, 1121, 14, easeOut);
  const out = prog(f, 1214, 1232, ease);
  const cur = currentLine(f);
  const h = Math.min(1020, 70 + 40 * (cur + 4) + 10);
  return (
    <div
      style={{
        position: "absolute",
        left: 290,
        top: CODE_TOP + (1 - inP) * 90,
        width: 1340,
        height: h,
        borderRadius: 20,
        background: C.codeBg,
        border: "1.5px solid rgba(11,11,11,0.08)",
        boxSizing: "border-box",
        opacity: inP * (1 - out),
        filter: blur > 0.1 ? `blur(${blur}px)` : undefined,
        overflow: "hidden",
      }}
    >
      <div style={{ position: "absolute", left: 28, top: 20, fontFamily: INTER, fontSize: 22, color: C.faint }}>{config.arquivoCodigo}</div>
      {CODE_P4.map(([lvl, text], i) => {
        if (f < lineStart[i]) return null;
        const chunks: React.ReactNode[] = [];
        for (let j = 0; j < text.length; j += 3) {
          const at = lineStart[i] + j * RATE;
          if (f < at) break;
          chunks.push(
            <span key={j} style={codeHot(f - at)}>
              {text.slice(j, j + 3)}
            </span>,
          );
        }
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: 28 + 34 * lvl,
              top: 70 + 40 * i,
              height: 40,
              lineHeight: "40px",
              fontFamily: lvl === 0 && text.length > 0 ? SERIF : INTER,
              fontWeight: lvl === 0 ? 600 : 400,
              fontSize: lvl === 0 ? 27 : 25,
              color: C.codeInk,
              whiteSpace: "pre",
            }}
          >
            {chunks}
          </div>
        );
      })}
    </div>
  );
};

// ---------- O vídeo de exemplo dentro do cartão ----------
const exampleState = (f: number) => {
  // ciclo de 53 quadros; recomeça no 1396; desacelera no 1449
  const start = f >= 1396 ? 1396 : 1258;
  let phase = 0;
  for (let t = start; t < f; t++) phase += mix(1, 0.28, prog(t, 1449, 1453, ease));
  return {
    t: ((phase % 53) + 53) % 53,
    playing: f >= 1258,
    title: f >= 1396 ? config.tituloExemploDepois : config.tituloExemplo,
    renamedAge: f - 1396,
    inv: prog(f, 1419, 1428, ease),
  };
};

const Thumb: React.FC<{ f: number; w: number; h: number }> = ({ f, w, h }) => {
  const st = exampleState(f);
  const k = w / 764;
  const play = 1 - prog(f, 1258, 1268, ease);
  const fg = interpolateColors(st.inv, [0, 1], ["#ffffff", "#0b0b0b"]);
  const bg = interpolateColors(st.inv, [0, 1], ["#0a0a0a", "#f2f2f2"]);
  const titleIn = prog(st.t, 0, 13, easeOut);
  const fadeOut = 1 - prog(st.t, 45, 53, ease);
  const glowWhite = glowGradient(0.32 * (1 - st.inv), 360, "255,255,255", w, h, 0.42 * k);
  const shadowGrey = glowGradient(0.12 * st.inv, 360, "0,0,0", w, h, 0.42 * k);
  const renamedGlow = st.renamedAge >= 0 && st.renamedAge < 18 ? 1 - st.renamedAge / 18 : 0;
  return (
    <div style={{ position: "relative", width: w, height: h, borderRadius: 12, overflow: "hidden", background: bg }}>
      <div style={{ position: "absolute", inset: 0, background: glowWhite }} />
      <div style={{ position: "absolute", inset: 0, background: shadowGrey }} />
      {/* quadro parado: símbolo no canto e botão de play */}
      {play > 0 && (
        <>
          <div style={{ position: "absolute", left: 20 * k, top: 18 * k, opacity: play }}>
            <ClaudeSymbol size={34 * k} color="#f2f2f2" />
          </div>
          <div
            style={{
              position: "absolute",
              left: w / 2 - 53 * (w / 664),
              top: h / 2 - 53 * (w / 664),
              width: 106 * (w / 664),
              height: 106 * (w / 664),
              borderRadius: "50%",
              background: "rgba(20,20,20,0.55)",
              border: `${2.5 * k}px solid #ffffff`,
              boxSizing: "border-box",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              opacity: play,
            }}
          >
            <svg width={40 * k} height={40 * k} viewBox="0 0 20 20">
              <path d="M6 3.5 L16 10 L6 16.5 Z" fill="#ffffff" stroke="#ffffff" strokeWidth={1.5} strokeLinejoin="round" />
            </svg>
          </div>
        </>
      )}
      {st.playing && (
        <div style={{ position: "absolute", inset: 0, opacity: 1 - play }}>
          <div style={{ position: "absolute", left: w / 2 - 42 * k, top: 70 * k, opacity: fadeOut }}>
            <ClaudeSymbol size={84 * k} color={fg} rotate={st.t * 2} />
          </div>
          <div
            style={{
              position: "absolute",
              left: 0,
              width: w,
              top: 180 * k + (1 - titleIn) * 40 * k,
              textAlign: "center",
              fontFamily: SERIF,
              fontWeight: 600,
              fontSize: 80 * k,
              lineHeight: `${96 * k}px`,
              color: fg,
              opacity: titleIn * fadeOut,
              textShadow: renamedGlow > 0 ? `0 0 ${30 * k}px rgba(255,255,255,${0.95 * renamedGlow}), 0 0 ${10 * k}px rgba(255,255,255,${renamedGlow})` : undefined,
              whiteSpace: "nowrap",
            }}
          >
            {st.title}
          </div>
          <div style={{ position: "absolute", left: w / 2 - 140 * k, top: 330 * k, width: 280 * k, height: 6 * k, borderRadius: 3 * k, background: st.inv > 0.5 ? "rgba(0,0,0,0.15)" : "rgba(255,255,255,0.2)", opacity: fadeOut }}>
            <div style={{ width: `${(st.t / 53) * 100}%`, height: "100%", borderRadius: 3 * k, background: fg }} />
          </div>
        </div>
      )}
    </div>
  );
};

// ---------- Os pedidos ----------
const REQ = [
  { start: 1373, send: 1390, change: 1396, top: 1588 },
  { start: 1399, send: 1413, change: 1419, top: 1694 },
  { start: 1424, send: 1443, change: 1449, top: 1800 },
];

const Card: React.FC<{ f: number }> = ({ f }) => {
  if (f < 1194) return null;
  const inP = prog(f, 1194, 1204, easeOut);
  const blur = motionBlur(f, 1194, 1204, 14, easeOut);
  const g = prog(f, 1246, 1268, ease);
  const gBlur = motionBlur(f, 1246, 1268, 8, ease);
  const left = mix(290, 930, g);
  const width = mix(700, 800, g);
  const tw = width - 36;
  const th = (tw * 9) / 16;
  const checkP = prog(f, 1203, 1213, snapStrong);
  const ringP = prog(f, 1203, 1219, easeOut);
  // rodapé: girando entre o envio e a mudança
  const updating = REQ.some((r) => f >= r.send && f < r.change);
  const lastChange = REQ.filter((r) => f >= r.change).pop();
  const pulse = lastChange && f - lastChange.change < 14 ? Math.sin((Math.PI * (f - lastChange.change)) / 14) : 0;
  return (
    <div
      style={{
        position: "absolute",
        left,
        top: 1560 + (1 - inP) * 60,
        width,
        borderRadius: 26,
        background: "#ffffff",
        boxShadow: `0 10px 30px rgba(0,0,0,0.07), 0 0 0 1.5px rgba(11,11,11,0.08)${pulse > 0 ? `, 0 0 0 ${5 * pulse}px rgba(11,11,11,${0.75 * pulse}), 0 0 ${24 * pulse}px rgba(0,0,0,${0.18 * pulse})` : ""}`,
        opacity: inP,
        filter: blur + gBlur > 0.1 ? `blur(${blur + gBlur}px)` : undefined,
        padding: 18,
        paddingBottom: 0,
        boxSizing: "border-box",
      }}
    >
      <Thumb f={f} w={tw} h={th} />
      <div style={{ height: 84, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ fontFamily: INTER, fontSize: 34, color: C.ink }}>{config.entregaArquivo}</span>
        {f >= 1203 && (
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            {updating ? (
              <>
                <ClaudeSymbol size={42} color={C.ink} rotate={f * 14} />
                <span style={{ fontFamily: INTER, fontWeight: 600, fontSize: 32, color: C.support }}>Updating…</span>
              </>
            ) : (
              <>
                <div style={{ position: "relative", transform: `scale(${checkP * (1 + 0.25 * pulse)})` }}>
                  <Check size={46} light />
                  {ringP > 0 && ringP < 1 && (
                    <div
                      style={{
                        position: "absolute",
                        left: 23 - (23 + 40 * ringP),
                        top: 23 - (23 + 40 * ringP),
                        width: 2 * (23 + 40 * ringP),
                        height: 2 * (23 + 40 * ringP),
                        borderRadius: "50%",
                        border: `2px solid rgba(11,11,11,${0.7 * (1 - ringP)})`,
                        boxSizing: "border-box",
                      }}
                    />
                  )}
                </div>
                <span style={{ fontFamily: INTER, fontWeight: 600, fontSize: 32, color: C.ink }}>{config.entregaPronto}</span>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

const ReplyArea: React.FC<{ f: number }> = ({ f }) => {
  if (f < 1304 || f > 1468) return null;
  const inP = prog(f, 1304, 1325, easeOut);
  const blur = motionBlur(f, 1304, 1325, 14, easeOut);
  const out = prog(f, 1456, 1466, ease);
  const focused = f >= 1319;
  // texto que está sendo digitado
  let typing: { text: string; startF: number; interval: number; idx: number } | null = null;
  REQ.forEach((r, i) => {
    if (f >= r.start && f < r.send) {
      const text = config.pedidos[i];
      typing = { text, startF: r.start, interval: Math.min(1, (r.send - 1 - r.start) / text.length), idx: i };
    }
  });
  const pressing = REQ.find((r) => f >= r.send - 1 && f <= r.send + 5);
  const press = pressing ? Math.sin(Math.PI * prog(f, pressing.send - 1, pressing.send + 5, (x) => x)) : 0;
  const showBtn = REQ.some((r) => f >= r.start && f <= r.send + 5);
  const btnIn = (() => {
    const r = REQ.find((q) => f >= q.start && f <= q.send + 5);
    return r ? prog(f, r.start, r.start + 8, snap) * (1 - prog(f, r.send + 2, r.send + 6, ease)) : 0;
  })();
  const anyText = typing !== null;
  return (
    <div style={{ opacity: 1 - out }}>
      {/* balões */}
      {REQ.map((r, i) => {
        if (f < r.send) return null;
        const text = config.pedidos[i];
        const bw = measure(text, `400 38px ${INTER}`) + 56;
        const p = prog(f, r.send, r.send + 9, ease);
        const startLeft = 290 + 34;
        const finalLeft = 850 - bw;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: mix(startLeft - 28, finalLeft, p),
              top: mix(1936 + 24, r.top, p),
              height: 80,
              width: bw,
              borderRadius: 26,
              background: `rgba(239,239,239,${p})`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontFamily: INTER,
              fontSize: mix(46, 38, p),
              color: C.ink,
              whiteSpace: "nowrap",
              filter: motionBlur(f, r.send, r.send + 9, 6) > 0.1 ? `blur(${motionBlur(f, r.send, r.send + 9, 6)}px)` : undefined,
            }}
          >
            {text}
          </div>
        );
      })}
      {/* caixa de resposta */}
      <div
        style={{
          position: "absolute",
          left: 290,
          top: 1936 + (1 - inP) * 130,
          width: 560,
          height: 156,
          borderRadius: 28,
          background: "#ffffff",
          boxShadow: `0 8px 24px rgba(0,0,0,0.06), 0 0 0 2px rgba(11,11,11,${focused ? 0.4 : 0.14})`,
          opacity: inP,
          filter: blur > 0.1 ? `blur(${blur}px)` : undefined,
        }}
      >
        <div style={{ position: "absolute", left: 30, top: 22, height: 56, display: "flex", alignItems: "center", fontFamily: INTER, fontSize: 46, whiteSpace: "pre" }}>
          {focused && !anyText && <span style={{ display: "inline-block", width: 3, height: 50, marginRight: 2, background: C.ink, opacity: Math.floor(f / 15) % 2 === 0 ? 1 : 0 }} />}
          {!anyText && <span style={{ fontSize: 44, color: C.faint }}>Reply</span>}
          {typing &&
            (() => {
              const t = typing as { text: string; startF: number; interval: number };
              const n = Math.min(t.text.length, Math.floor((f - t.startF) / t.interval) + 1);
              return t.text
                .slice(0, n)
                .split("")
                .map((ch, j) => (
                  <span key={j} style={born(f - (t.startF + j * t.interval), C.ink, 16, true)}>
                    {ch}
                  </span>
                ));
            })()}
          {focused && anyText && <span style={{ display: "inline-block", width: 3, height: 50, marginLeft: 2, background: C.ink }} />}
        </div>
        <div style={{ position: "absolute", left: 26, bottom: 18 }}>
          <PlusIcon size={34} color={C.support} />
        </div>
        {showBtn && (
          <div style={{ position: "absolute", right: 18, bottom: 18, transform: `scale(${btnIn})` }}>
            <SendButton size={58} light scale={1 - 0.14 * press} />
          </div>
        )}
      </div>
    </div>
  );
};

// ---------- Passos 1 e 2: a caixa de pergunta ----------
const PromptBox: React.FC<{ f: number }> = ({ f }) => {
  if (f < 920 || f > 1081) return null;
  const inP = prog(f, 920, 941, easeOut);
  const blur = motionBlur(f, 920, 941, 14, easeOut);
  const grow = prog(f, 991, 1001, snap);
  const toBubble = prog(f, 1068, 1080, ease);
  const inner = 1 - prog(f, 1068, 1073, ease);
  const clicked = f >= 968;
  const left = mix(210, 1070, toBubble);
  const top = mix(470, 150, toBubble) + (1 - inP) * 190;
  const width = mix(1500, 560, toBubble);
  const height = mix(mix(230, 470, grow), 96, toBubble);
  const radius = mix(34, 28, toBubble);
  const pasted = f >= 991;
  const reveal = prog(f, 991, 1001, (x) => x);
  const btnIn = prog(f, 993, 1003, snap);
  const press = f >= 1063 && f <= 1071 ? Math.sin(Math.PI * prog(f, 1063, 1071, (x) => x)) : 0;
  const ringP = prog(f, 1066, 1082, easeOut);
  const footerIn = prog(f, 928, 941, easeOut) * inner;
  const bubbleTextIn = prog(f, 1074, 1080, ease);
  return (
    <>
      <div
        style={{
          position: "absolute",
          left,
          top,
          width,
          height,
          borderRadius: radius,
          background: interpolateColors(toBubble, [0, 1], ["#ffffff", C.bubble]),
          boxShadow:
            toBubble < 1
              ? `0 10px 30px rgba(0,0,0,${0.06 * (1 - toBubble)}), 0 0 0 2px rgba(11,11,11,${(clicked ? 0.42 : 0.14) * (1 - toBubble)})`
              : undefined,
          opacity: inP,
          filter: blur > 0.1 ? `blur(${blur}px)` : undefined,
          overflow: "hidden",
        }}
      >
        <div style={{ opacity: inner }}>
          {!pasted && (
            <div style={{ position: "absolute", left: 56, top: 36, fontFamily: INTER, fontSize: 46, lineHeight: "61px", color: C.faint, whiteSpace: "nowrap" }}>
              {f >= 964 && <span style={{ position: "absolute", left: -6, top: 4, width: 3, height: 54, background: C.ink, opacity: Math.floor((f - 964) / 12) % 2 === 0 ? 1 : 0 }} />}
              {config.textoApagadoPergunta}
            </div>
          )}
          {pasted && (
            <div
              style={{
                position: "absolute",
                left: 56,
                top: 36,
                width: 1412,
                height: 305,
                overflow: "hidden",
                fontFamily: INTER,
                fontSize: 43,
                lineHeight: "61px",
                ...born(f - 991, C.ink, 26, true),
                WebkitMaskImage: `linear-gradient(to bottom, black ${reveal * 330 - 40}px, transparent ${reveal * 330}px), linear-gradient(to bottom, black 230px, transparent 305px)`,
                WebkitMaskComposite: "source-in",
                maskComposite: "intersect",
              }}
            >
              {config.promptColado}
            </div>
          )}
          <div style={{ position: "absolute", left: 50, bottom: 30 }}>
            <PlusIcon size={40} color={C.support} />
          </div>
          {btnIn < 1 && (
            <div style={{ position: "absolute", right: 40, bottom: 34, display: "flex", gap: 26, opacity: 1 - btnIn }}>
              <MicIcon size={38} />
              <VoiceIcon size={38} />
            </div>
          )}
          {pasted && (
            <div style={{ position: "absolute", left: 1608 - 210, top: 838 - 470, transform: `scale(${btnIn})` }}>
              <SendButton size={76} light scale={1 - 0.14 * press} />
            </div>
          )}
        </div>
        {bubbleTextIn > 0 && (
          <div
            style={{
              position: "absolute",
              left: 30,
              right: 30,
              top: 0,
              height: 96,
              lineHeight: "96px",
              fontFamily: INTER,
              fontSize: 34,
              color: C.ink,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
              opacity: bubbleTextIn,
            }}
          >
            {config.balaoMensagem}
          </div>
        )}
      </div>
      {/* anel do envio */}
      {ringP > 0 && ringP < 1 && (
        <div
          style={{
            position: "absolute",
            left: 1646 - mix(48, 238, ringP),
            top: 876 - mix(48, 238, ringP),
            width: 2 * mix(48, 238, ringP),
            height: 2 * mix(48, 238, ringP),
            borderRadius: "50%",
            border: `2px solid rgba(11,11,11,${0.6 * (1 - ringP)})`,
            boxSizing: "border-box",
          }}
        />
      )}
      {/* linha de baixo */}
      {footerIn > 0 && (
        <div
          style={{
            position: "absolute",
            left: 230,
            width: 1460,
            top: 470 + mix(230, 470, grow) + 22,
            display: "flex",
            justifyContent: "space-between",
            fontFamily: INTER,
            fontSize: 31,
            color: C.support,
            opacity: footerIn,
            transform: `translateY(${(1 - prog(f, 928, 941, easeOut)) * 30}px)`,
          }}
        >
          <span>Project ⌄</span>
          <span>{config.modeloClaro} ⌄</span>
        </div>
      )}
    </>
  );
};

// ---------- Seta do mouse (no desenho) ----------
const cursorState = (f: number) => {
  if (f >= 946 && f <= 984) {
    const p = prog(f, 946, 964, ease);
    const click = f >= 964 && f <= 972 ? Math.sin(Math.PI * prog(f, 964, 972, (x) => x)) : 0;
    return { x: mix(1660, 490, p), y: mix(1040, 548, p), s: 1 - 0.12 * click, o: prog(f, 946, 950) * (1 - prog(f, 978, 984)) };
  }
  if (f >= 1042 && f <= 1077) {
    const p = prog(f, 1042, 1062, ease);
    const click = f >= 1063 && f <= 1071 ? Math.sin(Math.PI * prog(f, 1063, 1071, (x) => x)) : 0;
    return { x: mix(1390, 1632, p), y: mix(1110, 868, p), s: 1 - 0.12 * click, o: prog(f, 1042, 1046) * (1 - prog(f, 1071, 1077)) };
  }
  return null;
};

// ---------- A página inteira ----------
const Page: React.FC<{ f: number }> = ({ f }) => {
  // símbolo grande que nasce e vira o da saudação
  const birth = prog(f, 889, 897, snap);
  const shrink = prog(f, 906, 918, ease);
  const gw = measure(config.saudacaoClara, `400 104px ${SERIF}`);
  const groupLeft = 960 - (92 + 28 + gw) / 2;
  const symSize = mix(mix(70, 400, birth), 92, shrink);
  const symX = mix(960, groupLeft + 46, shrink);
  const greetFade = 1 - prog(f, 970, 980, ease);
  // o símbolo passa de branco para preto quando o claro chega nele
  const cov = lightCoverage(f, 960, 540);
  const symColor = interpolateColors(cov, [0, 1], ["#f2f2f2", C.ink]);
  const write = prog(f, 909, 925, (x) => x);
  const persp = prog(f, 909, 928, easeOut);
  const cur = cursorState(f);
  // status e entrega
  const statusIn = prog(f, 1090, 1098, easeOut);
  const statusRot = f < 1184 ? (f - 1090) * 7 : (1184 - 1090) * 7;
  const deliverIn = prog(f, 1186, 1194, easeOut);
  const deliverOut = 1 - prog(f, 1246, 1256, ease);
  return (
    <div style={{ position: "absolute", left: 0, top: 0, width: 1920, height: 2200 }}>
      {/* saudação */}
      {f >= 889 && f < 981 && (
        <div style={{ position: "absolute", left: symX - symSize / 2, top: 345 - symSize / 2, opacity: greetFade }}>
          <ClaudeSymbol size={symSize} color={symColor} rotate={mix(-40, 0, prog(f, 889, 918, easeOut))} />
        </div>
      )}
      {f >= 909 && f < 981 && (
        <div style={{ position: "absolute", left: groupLeft + 120, top: 345 - 70, height: 140, opacity: greetFade, perspective: 900 }}>
          <div
            style={{
              fontFamily: SERIF,
              fontSize: 104,
              lineHeight: "140px",
              whiteSpace: "nowrap",
              transform: `rotateY(${mix(56, 0, persp)}deg)`,
              transformOrigin: "0 50%",
              ...born(f - 916, C.ink, 16, true),
              WebkitMaskImage: `linear-gradient(to right, black ${write * (gw + 60) - 60}px, transparent ${write * (gw + 60)}px)`,
            }}
          >
            {config.saudacaoClara}
          </div>
        </div>
      )}
      <PromptBox f={f} />
      {/* passo 3 */}
      {f >= 1090 && f < 1240 && (
        <div style={{ position: "absolute", left: 290, top: 322 - 30, height: 60, display: "flex", alignItems: "center", gap: 20, opacity: statusIn * (1 - prog(f, 1214, 1232)) }}>
          <ClaudeSymbol size={46} color={C.ink} rotate={statusRot} />
          <span style={{ fontFamily: SERIF, fontSize: 40, ...born(f - 1090, C.ink, 16, true) }}>{config.enquantoTrabalha}</span>
        </div>
      )}
      <CodeBlock f={f} />
      {f >= 1186 && f < 1258 && (
        <div style={{ position: "absolute", left: 290, top: 1498 - 30, height: 60, display: "flex", alignItems: "center", gap: 20, opacity: deliverIn * deliverOut }}>
          <ClaudeSymbol size={46} color={C.ink} />
          <span style={{ fontFamily: SERIF, fontSize: 40, ...born(f - 1186, C.ink, 16, true) }}>{config.entregaTexto}</span>
        </div>
      )}
      <Card f={f} />
      <ReplyArea f={f} />
      {cur && cur.o > 0 && <MacCursor x={cur.x} y={cur.y} height={150} scale={cur.s} opacity={cur.o} />}
    </div>
  );
};

// Teclas ⌘ V (fixas na tela)
const Keys: React.FC<{ f: number }> = ({ f }) => {
  if (f < 978 || f > 1008) return null;
  const inP = prog(f, 978, 986, snap);
  const out = prog(f, 1000, 1008, easeIn);
  const press = f >= 987 && f <= 997 ? Math.sin(Math.PI * prog(f, 987, 997, (x) => x)) : 0;
  return (
    <div style={{ position: "absolute", left: 0, top: 74, width: 1920, display: "flex", justifyContent: "center", gap: 26, opacity: Math.min(1, inP) * (1 - out), transform: `translateY(${(1 - inP) * 30 - out * 20}px)` }}>
      {["⌘", "V"].map((k) => (
        <div
          key={k}
          style={{
            width: 112,
            height: 112,
            borderRadius: 22,
            background: "#ffffff",
            boxShadow: `0 ${10 - 7 * press}px 0 #c8c8c8, 0 ${14 - 8 * press}px 26px rgba(0,0,0,0.14), 0 0 0 1.5px rgba(0,0,0,0.08)`,
            transform: `translateY(${7 * press}px)`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontFamily: INTER,
            fontWeight: 500,
            fontSize: 54,
            color: C.ink,
          }}
        >
          {k}
        </div>
      ))}
    </div>
  );
};

const K = 2; // a página é desenhada com o dobro do tamanho, para o texto ficar nítido

export const Part4: React.FC<{ frame: number }> = ({ frame: f }) => {
  if (f < 886 || f > 1501) return null;
  const cam = camAt(f);
  const camBlur = cam.moving * 22;
  const exit = prog(f, 1490, 1501, easeIn);
  const exitBlur = motionBlur(f, 1490, 1501, 14, easeIn);
  const r = lightRadius(f);
  return (
    <AbsoluteFill
      style={{
        opacity: 1 - exit,
        transform: `scale(${1 + 0.25 * exit})`,
        transformOrigin: "960px 540px",
        filter: exitBlur > 0.1 ? `blur(${exitBlur}px)` : undefined,
      }}
    >
      {/* o claro abrindo do centro */}
      {f >= 896 && (
        <AbsoluteFill
          style={{
            background: f >= 908 ? C.paper : `radial-gradient(circle at 960px 540px, ${C.paper} ${Math.max(0, r - 45)}px, rgba(252,252,252,0) ${r + 45}px)`,
          }}
        />
      )}
      <AbsoluteFill style={{ perspective: 2600, filter: camBlur > 0.1 ? `blur(${camBlur}px)` : undefined }}>
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            transformOrigin: "0 0",
            transform: `translate(960px, 540px) rotateX(${cam.rx}deg) rotateY(${cam.ry}deg) translate(${-cam.x * cam.z}px, ${-cam.y * cam.z}px) scale(${cam.z / K})`,
          }}
        >
          <div style={{ zoom: K, position: "relative", width: 1920, height: 2200 }}>
            <Page f={f} />
          </div>
        </div>
      </AbsoluteFill>
      <Keys f={f} />
    </AbsoluteFill>
  );
};
