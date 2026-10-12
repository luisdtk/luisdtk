import React from "react";
import { AbsoluteFill } from "remotion";
import { config } from "../config";
import { CODE_P2, CODE_P2_SHORT, TRACK_CODE, TRACK_NAMES } from "../codeText";
import { C, INTER, MONO, SERIF, born, ease, easeIn, easeOut, mix, motionBlur, prog, snap, track } from "../theme";
import { Check, ClaudeSymbol, MacCursor, SendButton } from "../components/Pieces";
import { CodeLine } from "../components/Code";
import { MiniOpening, miniLoop } from "../components/MiniOpening";

const MONO_STYLE: React.CSSProperties = { fontFamily: MONO, fontVariantLigatures: "none", fontFeatureSettings: '"liga" 0, "calt" 0' };

// Câmera
const CAM = [
  { f: 264, v: [1040, 372, 1.96] },
  { f: 298, v: [1040, 372, 2.02], mode: "drift" as const },
  { f: 320, v: [960, 540, 1.0], mode: "move" as const },
  { f: 324, v: [960, 540, 1.0], mode: "drift" as const },
  { f: 342, v: [961, 540, 1.08], mode: "move" as const },
  { f: 478, v: [961, 540, 1.1], mode: "drift" as const },
  { f: 494, v: [1280, 792, 1.68], mode: "move" as const },
  { f: 612, v: [1280, 792, 1.74], mode: "drift" as const },
  { f: 630, v: [840, 612, 1.24], mode: "move" as const },
  { f: 683, v: [840, 612, 1.28], mode: "drift" as const },
];

// Painel
const PX = 734;
const PY = 74;
const PW = 1092;
const PH = 932;
const TL_TOP = 626;
const BAR_X0 = 266;
const BAR_W = 806;
const TRACKS = [
  { name: TRACK_NAMES[0], s: 0, d: 0.2 },
  { name: TRACK_NAMES[1], s: 0.14, d: 0.48 },
  { name: TRACK_NAMES[2], s: 0.3, d: 0.56 },
  { name: TRACK_NAMES[3], s: 0.42, d: 0.58 },
  { name: TRACK_NAMES[4], s: 0, d: 1 },
];

// Mouse (no desenho)
const cursorPath = (f: number): { x: number; y: number; o: number } => {
  const k = [
    { f: 488, x: 1460, y: 1130 },
    { f: 498, x: 1400, y: 861 },
    { f: 514, x: 1504, y: 861 },
    { f: 526, x: 1300, y: 811 },
    { f: 542, x: 1216, y: 811 },
    { f: 544, x: 1216, y: 811 },
    { f: 556, x: 1290, y: 1140 },
  ];
  if (f <= k[0].f) return { x: k[0].x, y: k[0].y, o: 0 };
  for (let i = 1; i < k.length; i++) {
    if (f <= k[i].f) {
      const isDrag = i === 2 || i === 4;
      const p = prog(f, k[i - 1].f, k[i].f, isDrag ? ease : i === k.length - 1 ? easeIn : ease);
      return { x: mix(k[i - 1].x, k[i].x, p), y: mix(k[i - 1].y, k[i].y, p), o: 1 };
    }
  }
  return { x: k[k.length - 1].x, y: k[k.length - 1].y, o: 0 };
};

const Panel: React.FC<{ f: number }> = ({ f }) => {
  const enter = prog(f, 300, 320, ease);
  // prévia
  const build = f >= 620;
  const t = build ? f - 620 : (((f - 300) % 150) + 150) % 150;
  const mini = build
    ? {
        streak: 1,
        grow: prog(f, 640, 652, easeOut),
        shrink: prog(f, 652, 663, ease),
        greet: prog(f, 663, 673, easeOut),
        box: prog(f, 667, 679, easeOut),
        rot: mix(-70, 0, prog(f, 640, 662, easeOut)),
        opacity: 1,
      }
    : miniLoop(t);
  const sec = Math.floor(t / 30);
  const fr = Math.floor(t % 30);
  const clock = `00:0${sec}.${String(fr).padStart(2, "0")}`;
  const needleX = BAR_X0 + BAR_W * Math.min(1, t / 150);

  // arrasto das barras
  const off2 = 104 * prog(f, 498, 514, ease);
  const off1 = -84 * prog(f, 526, 542, ease);
  const dragging = (i: number) => (i === 2 && f >= 498 && f <= 514) || (i === 1 && f >= 526 && f <= 542);

  // faixas viram texto
  const dark = prog(f, 555, 565, ease) * (1 - prog(f, 612, 624, ease));
  const ring = f >= 456 && f <= 482 ? Math.min(prog(f, 456, 466, easeOut), 1 - prog(f, 472, 482, easeIn)) : 0;

  return (
    <div
      style={{
        position: "absolute",
        left: PX,
        top: PY,
        width: PW,
        height: PH,
        borderRadius: 18,
        background: "#1c1c1c",
        overflow: "hidden",
        border: "1px solid rgba(255,255,255,0.07)",
        boxSizing: "border-box",
        transform: `translateX(${(1 - enter) * 1150}px)`,
        opacity: Math.min(1, enter * 2),
      }}
    >
      {/* barra de cima */}
      <div style={{ position: "absolute", left: 0, top: 0, width: PW, height: 46, background: "#151515", display: "flex", alignItems: "center", fontFamily: INTER, fontSize: 15.5, color: "#cccccc" }}>
        <svg width={18} height={18} viewBox="0 0 20 20" style={{ marginLeft: 18, marginRight: 20 }}>
          <path d="M4 2.5 L17 10 L4 17.5 Z" fill="#ffffff" stroke="#ffffff" strokeWidth={2} strokeLinejoin="round" />
        </svg>
        {["File", "View", "Composition", "Tools", "Help"].map((m) => (
          <span key={m} style={{ marginRight: 22 }}>
            {m}
          </span>
        ))}
        <div style={{ position: "absolute", left: 0, width: PW, textAlign: "center", color: "#929292", pointerEvents: "none" }}>
          {config.painelTitulo} <span style={{ color: "#636363" }}>/</span> <span style={{ color: "#d9d9d9" }}>{config.painelCena}</span>
        </div>
      </div>
      {/* palco */}
      <div style={{ position: "absolute", left: 0, top: 46, width: PW, height: 530, background: "#222222" }} />
      <div style={{ position: "absolute", left: 116, top: 69, width: 860, height: 484, boxShadow: "0 10px 30px rgba(0,0,0,0.4)" }}>
        <MiniOpening width={860} {...mini} />
      </div>
      {ring > 0 && (
        <div
          style={{
            position: "absolute",
            left: 116 - 10,
            top: 69 - 10,
            width: 880,
            height: 504,
            borderRadius: 10,
            border: `4px solid rgba(255,255,255,${0.9 * ring})`,
            boxShadow: `0 0 26px rgba(255,255,255,${0.35 * ring})`,
            boxSizing: "border-box",
          }}
        />
      )}
      {/* controles */}
      <div style={{ position: "absolute", left: 0, top: 576, width: PW, height: 50, background: "#191919", borderTop: "1px solid #2c2c2c", display: "flex", alignItems: "center", fontFamily: INTER, fontSize: 15, color: "#cccccc" }}>
        <span style={{ marginLeft: 18, padding: "4px 10px", background: "#282828", borderRadius: 6 }}>Fit ⌄</span>
        <span style={{ marginLeft: 10, padding: "4px 10px", background: "#282828", borderRadius: 6 }}>1x ⌄</span>
        <div style={{ position: "absolute", left: PW / 2 - 60, display: "flex", gap: 22, alignItems: "center" }}>
          <svg width={20} height={20} viewBox="0 0 20 20">
            <path d="M4 3 V17 M16 3 L7 10 L16 17 Z" stroke="#cccccc" fill="#cccccc" strokeWidth={1.6} strokeLinejoin="round" />
          </svg>
          <svg width={22} height={22} viewBox="0 0 20 20">
            <path d="M5 3 L16 10 L5 17 Z" fill="#e8e8e8" stroke="#e8e8e8" strokeWidth={1.6} strokeLinejoin="round" />
          </svg>
          <svg width={20} height={20} viewBox="0 0 20 20">
            <path d="M16 3 V17 M4 3 L13 10 L4 17 Z" stroke="#cccccc" fill="#cccccc" strokeWidth={1.6} strokeLinejoin="round" />
          </svg>
        </div>
        <span style={{ position: "absolute", right: 16, padding: "6px 16px", background: "#e8e8e8", color: "#0b0b0b", borderRadius: 7, fontWeight: 600 }}>Render</span>
      </div>
      {/* linha do tempo */}
      <div style={{ position: "absolute", left: 0, top: TL_TOP, width: PW, height: PH - TL_TOP, background: "#171717" }}>
        {/* régua */}
        <div style={{ position: "absolute", left: 0, top: 0, width: PW, height: 36, borderBottom: "1px solid #2c2c2c" }}>
          <div style={{ position: "absolute", left: 16, top: 8, ...MONO_STYLE, fontSize: 15, color: "#cccccc" }}>{clock}</div>
          {Array.from({ length: 31 }).map((_, i) => (
            <div
              key={i}
              style={{
                position: "absolute",
                left: BAR_X0 + (BAR_W * i) / 30,
                bottom: 0,
                width: 1,
                height: i % 5 === 0 ? 14 : 7,
                background: "#4d4d4d",
              }}
            />
          ))}
        </div>
        {dark > 0 && <div style={{ position: "absolute", inset: 0, background: `rgba(6,7,8,${0.55 * dark})` }} />}
        {TRACKS.map((tr, i) => {
          const s0 = 555 + 8 * i;
          const toText = prog(f, s0, s0 + 6, ease) * (1 - prog(f, 612, 624, ease));
          const off = i === 2 ? off2 : i === 1 ? off1 : 0;
          const drag = dragging(i);
          const line = TRACK_CODE[i];
          const writeStart = s0 + 4;
          return (
            <div key={i} style={{ position: "absolute", left: 0, top: 36 + 50 * i, width: PW, height: 50, borderBottom: "1px solid #232323" }}>
              <div style={{ opacity: 1 - toText }}>
                <svg width={18} height={18} viewBox="0 0 24 24" style={{ position: "absolute", left: 16, top: 16 }}>
                  <path d="M2 12 C5 6.5 8.5 4.5 12 4.5 C15.5 4.5 19 6.5 22 12 C19 17.5 15.5 19.5 12 19.5 C8.5 19.5 5 17.5 2 12 Z" stroke="#a0a0a0" strokeWidth={1.8} fill="none" />
                  <circle cx={12} cy={12} r={3.2} fill="#a0a0a0" />
                </svg>
                <div style={{ position: "absolute", left: 46, top: 0, lineHeight: "50px", fontFamily: INTER, fontSize: 16, color: "#d9d9d9" }}>{tr.name}</div>
                <div
                  style={{
                    position: "absolute",
                    left: BAR_X0 + tr.s * BAR_W + off,
                    top: 9,
                    width: tr.d * BAR_W - (tr.s + tr.d >= 1 ? 0 : 4),
                    height: 32,
                    borderRadius: 8,
                    background: drag ? "#a0a0a0" : "#7a7a7a",
                    border: drag ? "2px solid #ffffff" : "2px solid transparent",
                    boxSizing: "border-box",
                    boxShadow: drag ? "0 6px 16px rgba(0,0,0,0.5)" : undefined,
                  }}
                />
              </div>
              {toText > 0 && (
                <div style={{ position: "absolute", left: 16, top: 0, lineHeight: "50px", fontFamily: INTER, fontWeight: 500, fontSize: 36, opacity: toText, whiteSpace: "pre" }}>
                  <span style={{ color: "rgba(242,242,242,0.35)" }}>{`${i + 1}  `}</span>
                  <CodeLine line={line} f={f} appearAt={(c) => writeStart + c * 0.4} />
                </div>
              )}
            </div>
          );
        })}
        {/* agulha */}
        <div style={{ position: "absolute", left: needleX - 1, top: 0, width: 2, height: PH - TL_TOP, background: "#ffffff", opacity: 1 - dark }} />
        <div style={{ position: "absolute", left: needleX - 7, top: 0, width: 14, height: 14, background: "#ffffff", clipPath: "polygon(0 0, 100% 0, 50% 100%)", opacity: 1 - dark }} />
      </div>
    </div>
  );
};

const Chat: React.FC<{ f: number }> = ({ f }) => {
  const colX = mix(660, 100, prog(f, 300, 320, ease));
  const chatO = 1 - prog(f, 326, 340, ease) + prog(f, 606, 622, ease);
  const WT = 60; // topo da janela
  const bubble = prog(f, 271, 281, snap);
  // símbolo
  const symY = mix(WT + 352, 575, prog(f, 325, 462, ease));
  const writing = f >= 626 && f <= 676;
  const symRot = f < 330 ? f * 14 : f < 470 ? 330 * 14 + (f - 330) * 5 : writing ? 470 * 5 + (f - 626) * 9 : 0;
  const shout = Math.sin(Math.PI * prog(f, 667, 687, (x) => x));
  const pulse = writing ? 1 + 0.08 * Math.sin((f - 626) * 0.7) : 1;
  const nameIn = prog(f, 612, 624, easeOut);
  const blockIn = prog(f, 616, 628, easeOut);
  return (
    <div style={{ opacity: chatO }}>
      {/* pergunta */}
      <div
        style={{
          position: "absolute",
          left: colX,
          top: WT + 240,
          width: 600,
          display: "flex",
          justifyContent: "flex-end",
        }}
      >
        <div
          style={{
            background: "#2a2a2a",
            borderRadius: 24,
            padding: "16px 26px",
            fontFamily: INTER,
            fontSize: 30,
            color: C.cream,
            transform: `scale(${bubble})`,
            transformOrigin: "100% 100%",
            opacity: Math.min(1, bubble * 3),
            whiteSpace: "nowrap",
          }}
        >
          {config.perguntaChat}
        </div>
      </div>
      {/* resposta */}
      <div style={{ position: "absolute", left: colX, top: WT + 330, width: 600, fontFamily: SERIF, fontSize: 30, lineHeight: "44px" }}>
        {config.respostaChat.map((w, i) =>
          f >= w.quadro ? (
            <span key={i} style={born(f - w.quadro, C.cream)}>
              {w.palavra}{" "}
            </span>
          ) : null,
        )}
      </div>
      {/* símbolo + nome */}
      {f >= 286 && (
        <div style={{ position: "absolute", left: colX, top: symY - 22, height: 44, display: "flex", alignItems: "center", transform: `scale(${1 + 0.22 * shout})`, transformOrigin: "0 50%" }}>
          <div style={{ transform: `scale(${pulse})`, opacity: prog(f, 286, 292) }}>
            <ClaudeSymbol size={44} rotate={symRot} />
          </div>
          {nameIn > 0 && (
            <span
              style={{
                marginLeft: 16,
                fontFamily: SERIF,
                fontWeight: 600,
                fontSize: 52,
                color: shout > 0.02 ? "#ffffff" : C.cream,
                textShadow: shout > 0.05 ? `0 0 ${24 * shout}px rgba(255,255,255,${0.55 * shout})` : undefined,
                opacity: nameIn,
                transform: `translateX(${(1 - nameIn) * -14}px)`,
                display: "inline-block",
                lineHeight: "44px",
              }}
            >
              Claude
            </span>
          )}
        </div>
      )}
      {/* bloco de código */}
      {blockIn > 0 && (
        <div
          style={{
            position: "absolute",
            left: colX,
            top: WT + 558 + (1 - blockIn) * 24,
            width: 600,
            height: 288,
            borderRadius: 16,
            background: "#111111",
            border: "1px solid rgba(255,255,255,0.08)",
            opacity: blockIn,
            overflow: "hidden",
          }}
        >
          <div style={{ height: 40, borderBottom: "1px solid rgba(255,255,255,0.07)", display: "flex", alignItems: "center", paddingLeft: 18, fontFamily: INTER, fontSize: 15, color: "rgba(196,196,196,0.7)" }}>
            {config.painelCena}
          </div>
          <div style={{ padding: "12px 18px", fontFamily: INTER, fontSize: 18.5, lineHeight: "28px" }}>
            {CODE_P2.map((l, i) => {
              const s = 626 + 6 * i;
              return (
                <div key={i} style={{ height: 28 }}>
                  <CodeLine line={l} f={f} appearAt={(c) => s + (8 * c) / l.length} />
                </div>
              );
            })}
          </div>
        </div>
      )}
      {/* caixa Responder */}
      <div
        style={{
          position: "absolute",
          left: colX,
          top: WT + 866,
          width: 600,
          height: 80,
          borderRadius: 22,
          background: C.box,
          border: `1.5px solid ${C.boxBorder}`,
          boxSizing: "border-box",
        }}
      >
        <span style={{ position: "absolute", left: 24, top: 24, fontFamily: INTER, fontSize: 22, color: "rgba(242,242,242,0.38)" }}>Reply...</span>
        <div style={{ position: "absolute", right: 20, top: 20 }}>
          <SendButton size={38} />
        </div>
      </div>
    </div>
  );
};

// Etiquetas (fixas na tela)
const Tags: React.FC<{ f: number }> = ({ f }) => {
  if (f < 338 || f > 420) return null;
  const out = prog(f, 408, 418, easeIn);
  const outBlur = motionBlur(f, 408, 418, 14, easeIn);
  return (
    <>
      {config.etiquetas.map((label, i) => {
        const s = [340, 368, 394][i];
        const p = prog(f, s, s + 11, snap);
        const blur = motionBlur(f, s, s + 11, 10, easeOut) + outBlur;
        if (f < s) return null;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: 50,
              top: 318 + 152 * i,
              height: 128,
              borderRadius: 64,
              background: "rgba(28,26,28,0.96)",
              border: `1.5px solid ${C.boxBorder}`,
              boxShadow: C.boxShadow,
              display: "flex",
              alignItems: "center",
              padding: "0 52px 0 26px",
              gap: 26,
              transform: `translateX(${(1 - p) * -260 - out * 900}px)`,
              opacity: Math.min(1, prog(f, s, s + 5)) * (1 - out),
              filter: blur > 0.1 ? `blur(${blur}px)` : undefined,
            }}
          >
            <Check size={76} />
            <span style={{ fontFamily: INTER, fontWeight: 500, fontSize: 66, color: C.cream, whiteSpace: "nowrap" }}>{label}</span>
          </div>
        );
      })}
    </>
  );
};

// Cartão de código (fixo na tela)
const CodeCard: React.FC<{ f: number }> = ({ f }) => {
  if (f < 420 || f > 488) return null;
  const inP = prog(f, 420, 430, easeOut);
  const out = prog(f, 476, 486, easeIn);
  const blur = motionBlur(f, 420, 430, 10, easeOut) + motionBlur(f, 476, 486, 14, easeIn);
  const arrow = prog(f, 450, 462, easeOut);
  return (
    <>
      <div
        style={{
          position: "absolute",
          left: 50,
          top: 166,
          width: 600,
          height: 470,
          borderRadius: 22,
          background: "#111111",
          border: `1.5px solid ${C.boxBorder}`,
          boxShadow: C.boxShadow,
          transform: `translateX(${(1 - inP) * -120 - out * 760}px)`,
          opacity: inP * (1 - out),
          filter: blur > 0.1 ? `blur(${blur}px)` : undefined,
          overflow: "hidden",
        }}
      >
        <div style={{ height: 56, borderBottom: "1px solid rgba(255,255,255,0.07)", display: "flex", alignItems: "center", paddingLeft: 26, gap: 10, fontFamily: INTER, fontSize: 21, color: "rgba(196,196,196,0.75)" }}>
          prompt.txt
        </div>
        <div style={{ padding: "22px 26px", fontFamily: INTER, fontSize: 28, lineHeight: "45px" }}>
          {CODE_P2_SHORT.map((l, i) => {
            const s = 432 + 4 * i;
            return (
              <div key={i} style={{ height: 45 }}>
                <CodeLine line={l} f={f} appearAt={(c) => s + (4 * c) / l.length} />
              </div>
            );
          })}
        </div>
      </div>
      {arrow > 0 && f < 486 && (
        <svg width={1920} height={1080} style={{ position: "absolute", left: 0, top: 0, opacity: 1 - out }}>
          <line x1={668} y1={400} x2={mix(668, 796, arrow)} y2={400} stroke={C.accent} strokeWidth={5} strokeDasharray="10 9" strokeLinecap="round" />
          <path
            d={`M${mix(668, 810, arrow) - 16},${386} L${mix(668, 810, arrow)},400 L${mix(668, 810, arrow) - 16},414`}
            stroke={C.accent}
            strokeWidth={5}
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity={arrow}
          />
        </svg>
      )}
    </>
  );
};

export const Part2: React.FC<{ frame: number }> = ({ frame: f }) => {
  if (f < 264 || f > 689) return null;
  const cam = track(f, CAM);
  const [cx, cy, z] = cam.v;
  const camBlur = cam.moving * 7;
  const enter = prog(f, 264, 276, easeOut);
  const exit = prog(f, 683, 689, easeIn);
  const exitBlur = motionBlur(f, 683, 689, 14, easeIn);
  const cur = cursorPath(f);
  const blur = camBlur + exitBlur;
  return (
    <AbsoluteFill
      style={{
        opacity: enter * (1 - exit),
        transform: `translateY(${(1 - enter) * 90}px) scale(${1 + 0.3 * exit})`,
        transformOrigin: "960px 540px",
      }}
    >
      <AbsoluteFill style={{ filter: blur > 0.1 ? `blur(${blur}px)` : undefined }}>
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            width: 1920,
            height: 1080,
            transformOrigin: "0 0",
            transform: `translate(960px, 540px) scale(${z}) translate(${-cx}px, ${-cy}px)`,
          }}
        >
          {/* janela */}
          <div
            style={{
              position: "absolute",
              left: 80,
              top: 60,
              width: 1760,
              height: 960,
              borderRadius: 28,
              background: "rgba(20,20,20,0.86)",
              border: "1px solid rgba(255,255,255,0.09)",
              boxShadow: "0 40px 120px rgba(0,0,0,0.55)",
            }}
          >
            {[0, 1, 2].map((i) => (
              <div key={i} style={{ position: "absolute", left: 26 + i * 24, top: 22, width: 13, height: 13, borderRadius: 7, background: "#474747" }} />
            ))}
          </div>
          <Chat f={f} />
          <Panel f={f} />
          {cur.o > 0 && <MacCursor x={cur.x} y={cur.y} height={30} fill="#ffffff" outline="#16181b" />}
        </div>
      </AbsoluteFill>
      <Tags f={f} />
      <CodeCard f={f} />
    </AbsoluteFill>
  );
};
