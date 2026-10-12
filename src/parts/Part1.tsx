import React from "react";
import { AbsoluteFill } from "remotion";
import { config } from "../config";
import { C, INTER, SERIF, born, ease, easeIn, easeOut, measure, mix, motionBlur, prog, snap } from "../theme";
import { ClaudeSymbol, SendButton } from "../components/Pieces";
import { MaskRise } from "../components/Text";

// ---------- 1. Riscos de luz ----------
const STARTS: [number, number][] = [
  [-50, 300],
  [1290, -50],
  [1970, 780],
  [630, 1130],
];
const END: [number, number] = [960, 540];

const bez = (p0: number[], c: number[], p1: number[], t: number) => [
  (1 - t) * (1 - t) * p0[0] + 2 * (1 - t) * t * c[0] + t * t * p1[0],
  (1 - t) * (1 - t) * p0[1] + 2 * (1 - t) * t * c[1] + t * t * p1[1],
];

const Streaks: React.FC<{ f: number }> = ({ f }) => {
  if (f > 34) return null;
  const tailFade = 1 - prog(f, 24, 33, easeOut);
  return (
    <svg width={1920} height={1080} style={{ position: "absolute", inset: 0, overflow: "visible" }}>
      <defs>
        <radialGradient id="head">
          <stop offset="0%" stopColor="#ffffff" stopOpacity={1} />
          <stop offset="22%" stopColor="#f0f0f0" stopOpacity={0.95} />
          <stop offset="50%" stopColor="#bdbdbd" stopOpacity={0.45} />
          <stop offset="100%" stopColor="#9a9a9a" stopOpacity={0} />
        </radialGradient>
        <filter id="streakHalo" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation={12} />
        </filter>
      </defs>
      {STARTS.map((s, i) => {
        const t0 = i * 0.8;
        const dx = END[0] - s[0];
        const dy = END[1] - s[1];
        const len = Math.hypot(dx, dy);
        // arco aberto: ponto de controle deslocado sempre para o mesmo lado
        const c = [s[0] + dx / 2 + (-dy / len) * len * 0.42, s[1] + dy / 2 + (dx / len) * len * 0.42];
        const raw = (f - t0) / (24 - t0);
        const tHead = Math.min(1, ease(Math.max(0, Math.min(1, raw))));
        const arcLen = len * 1.25;
        const tailT = 720 / arcLen;
        const N = 30;
        const pts: number[][] = [];
        for (let k = 0; k <= N; k++) {
          pts.push(bez(s, c, END, tHead - (tailT * k) / N));
        }
        const head = pts[0];
        const segs = [];
        for (let k = 0; k < N; k++) {
          const q = k / N;
          segs.push(
            <line
              key={k}
              x1={pts[k][0]}
              y1={pts[k][1]}
              x2={pts[k + 1][0]}
              y2={pts[k + 1][1]}
              stroke={k < 3 ? "#ffffff" : "#d0d0d0"}
              strokeWidth={7 * (1 - q) + 0.5}
              strokeOpacity={Math.pow(1 - q, 1.6) * tailFade}
              strokeLinecap="round"
            />,
          );
        }
        const halo = [];
        for (let k = 0; k < N; k += 2) {
          const q = k / N;
          halo.push(
            <line
              key={k}
              x1={pts[k][0]}
              y1={pts[k][1]}
              x2={pts[Math.min(N, k + 2)][0]}
              y2={pts[Math.min(N, k + 2)][1]}
              stroke="#a0a0a0"
              strokeWidth={28 * (1 - q) + 2}
              strokeOpacity={0.35 * Math.pow(1 - q, 1.4) * tailFade}
              strokeLinecap="round"
            />,
          );
        }
        const headOpacity = f < 24 ? 1 : 1 - prog(f, 24, 30);
        return (
          <g key={i}>
            <g filter="url(#streakHalo)">{halo}</g>
            {segs}
            <circle cx={head[0]} cy={head[1]} r={34} fill="url(#head)" opacity={headOpacity} />
          </g>
        );
      })}
    </svg>
  );
};

const Flash: React.FC<{ f: number }> = ({ f }) => {
  if (f < 22 || f > 36) return null;
  const r = mix(120, 520, prog(f, 22, 36, easeOut));
  const o = f < 25 ? prog(f, 22, 25, easeOut) : 1 - prog(f, 25, 36, easeOut);
  return (
    <div
      style={{
        position: "absolute",
        left: 960 - r,
        top: 540 - r,
        width: 2 * r,
        height: 2 * r,
        borderRadius: "50%",
        opacity: o,
        background:
          "radial-gradient(circle, rgba(255,255,255,0.95) 0%, rgba(235,235,235,0.8) 10%, rgba(190,190,190,0.45) 28%, rgba(255,255,255,0.2) 50%, rgba(255,255,255,0.07) 72%, rgba(255,255,255,0) 100%)",
      }}
    />
  );
};

// ---------- 6. Frase digitada ----------
const LETTERS_PER_FRAME = 22 / 30;

const TypedText: React.FC<{ f: number }> = ({ f }) => {
  const lines: React.ReactNode[][] = [[]];
  let lastAppear = -Infinity;
  let doneAt = 0;
  config.fraseDigitada.forEach((w, wi) => {
    if (w.quebra) lines.push([]);
    const line = lines[lines.length - 1];
    const prefix = line.length > 0 ? " " : "";
    const chars = (prefix + w.palavra).split("");
    chars.forEach((ch, ci) => {
      const appear = w.quadro + ci / LETTERS_PER_FRAME;
      doneAt = Math.max(doneAt, appear);
      if (f < appear) return;
      lastAppear = Math.max(lastAppear, appear);
      line.push(
        <span
          key={`${wi}-${ci}`}
          style={{ ...born(f - appear, "destaque" in w && w.destaque ? "#ffffff" : C.cream), fontWeight: "destaque" in w && w.destaque ? 600 : 400 }}
        >
          {ch === " " ? " " : ch}
        </span>,
      );
    });
  });
  const typing = f <= doneAt + 1;
  const cursorOn = typing || Math.floor((f - doneAt) / 15) % 2 === 1;
  // o cursor fica na última linha que tem letras
  let lastLine = 0;
  lines.forEach((l, i) => {
    if (l.length) lastLine = i;
  });
  return (
    <div style={{ position: "absolute", left: 38, top: 30, fontFamily: INTER, fontSize: 41, lineHeight: "56px" }}>
      {lines.map((l, i) => (
        <div key={i} style={{ height: 56, whiteSpace: "pre", display: "flex", alignItems: "center" }}>
          {l}
          {i === lastLine && f >= config.fraseDigitada[0].quadro && (
            <span
              style={{
                display: "inline-block",
                width: 3,
                height: 44,
                marginLeft: 3,
                background: C.accent,
                opacity: cursorOn ? 1 : 0,
              }}
            />
          )}
        </div>
      ))}
    </div>
  );
};

// ---------- A caixa de pergunta ----------
const PromptBox: React.FC<{ f: number }> = ({ f }) => {
  const rise = prog(f, 54, 72, easeOut);
  const exit = prog(f, 197, 205, easeIn);
  const blur = motionBlur(f, 197, 205, 22, easeIn);
  const btnPress = f >= 194 && f <= 200 ? Math.sin(Math.PI * prog(f, 194, 200, (x) => x)) : 0;
  const typingStarted = f >= config.fraseDigitada[0].quadro;
  return (
    <div
      style={{
        position: "absolute",
        left: 400,
        top: 500,
        width: 1120,
        height: 226,
        borderRadius: 34,
        background: C.box,
        border: `1.5px solid ${C.boxBorder}`,
        boxShadow: C.boxShadow,
        boxSizing: "border-box",
        opacity: rise * (1 - exit),
        transform: `translateY(${(1 - rise) * 46 - exit * (260 / 1.5)}px)`,
        filter: blur > 0.05 ? `blur(${blur}px)` : undefined,
      }}
    >
      {!typingStarted && (
        <div style={{ position: "absolute", left: 38, top: 30, fontFamily: INTER, fontSize: 41, lineHeight: "56px", color: "rgba(242,242,242,0.38)" }}>
          {config.textoApagadoPergunta}
        </div>
      )}
      <TypedText f={f} />
      <svg width={34} height={34} viewBox="0 0 24 24" style={{ position: "absolute", left: 32, bottom: 26 }}>
        <path d="M12 4.5 V19.5 M4.5 12 H19.5" stroke="rgba(242,242,242,0.62)" strokeWidth={1.6} strokeLinecap="round" />
      </svg>
      <div style={{ position: "absolute", right: 20, bottom: 20, display: "flex", alignItems: "center", gap: 22 }}>
        <span style={{ fontFamily: INTER, fontSize: 24, color: "rgba(196,196,196,0.75)" }}>{config.modeloEscuro} ⌄</span>
        <SendButton size={54} scale={1 - 0.14 * btnPress} />
      </div>
    </div>
  );
};

// ---------- 7. A lixeira ----------
// Desenho local de 220 por 260; a boca (110, 30) fica no ponto (1500, 800) da tela.
const TR_X = 1390;
const TR_Y = 770;
const bodyPath = "M10,30 L40,246 Q42,256 52,256 L168,256 Q178,256 180,246 L210,30";
const ribs = [0.2, 0.35, 0.5, 0.65, 0.8];

const AeTile: React.FC<{ x: number; y: number; rot: number; scale: number; opacity?: number }> = ({ x, y, rot, scale, opacity = 1 }) => (
  <div
    style={{
      position: "absolute",
      left: x - 75,
      top: y - 75,
      width: 150,
      height: 150,
      borderRadius: 30,
      background: "#141414",
      border: "4px solid #e6e6e6",
      boxSizing: "border-box",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontFamily: INTER,
      fontWeight: 600,
      fontSize: 74,
      color: "#ffffff",
      letterSpacing: -1,
      transform: `rotate(${rot}deg) scale(${scale})`,
      opacity,
    }}
  >
    Ae
  </div>
);

const tilePos = (f: number) => {
  const t = Math.max(0, Math.min(1, (f - 136) / 24));
  const te = t * t * (3 - 2 * t) * 0.35 + t * 0.65;
  const p = bez([640, 1180], [1080, -110], [1500, 905], te);
  return { x: p[0] - TR_X, y: p[1] - TR_Y, rot: -335 * te, scale: 1 - 0.2 * te };
};

const Trash: React.FC<{ f: number }> = ({ f }) => {
  if (f < 120 || f > 192) return null;
  const inP = prog(f, 122, 136, snap);
  const outP = prog(f, 178, 190, easeIn);
  const ty = (1 - inP) * 340 + outP * 360;
  const sq = f >= 160 && f <= 172 ? Math.sin(Math.PI * prog(f, 160, 172, (x) => x)) * Math.exp(-prog(f, 160, 172, (x) => x) * 1.2) : 0;
  const sx = 1 + 0.08 * sq;
  const sy = 1 - 0.1 * sq;
  const stroke = C.cream;
  const sw = 5;
  const showTile = f >= 136 && f < 160;
  const dashP = prog(f, 160, 170, easeOut);
  return (
    <div
      style={{
        position: "absolute",
        left: TR_X,
        top: TR_Y,
        width: 220,
        height: 260,
        transform: `translateY(${ty}px) scale(${sx}, ${sy})`,
        transformOrigin: "110px 256px",
        opacity: 1 - outP * 0.6,
      }}
    >
      {/* fundo da lixeira */}
      <svg width={220} height={260} style={{ position: "absolute", overflow: "visible" }}>
        <ellipse cx={110} cy={30} rx={100} ry={22} fill="#060507" />
        <path d="M10,30 A100,22 0 0 1 210,30" stroke={stroke} strokeWidth={sw} fill="none" strokeLinecap="round" />
      </svg>
      {/* ladrilho e fantasmas, recortados pela boca */}
      {showTile && (
        <div
          style={{
            position: "absolute",
            left: -2000,
            top: -2000,
            width: 4220,
            height: 4260,
            clipPath:
              f >= 150
                ? `polygon(0 0, 4220px 0, 4220px 2030px, 2210px 2030px, 2180px 2256px, 2040px 2256px, 2010px 2030px, 0 2030px)`
                : undefined,
          }}
        >
          <div style={{ position: "absolute", left: 2000, top: 2000 }}>
            {[4.8, 3.2, 1.6].map((lag, i) => {
              const g = tilePos(f - lag);
              if (f - lag < 136) return null;
              return <AeTile key={i} {...g} opacity={[0.07, 0.13, 0.22][i]} />;
            })}
            <AeTile {...tilePos(f)} />
          </div>
        </div>
      )}
      {/* frente da lixeira */}
      <svg width={220} height={260} style={{ position: "absolute", overflow: "visible" }}>
        <path d={`${bodyPath} A100,22 0 0 1 10,30 Z`} fill={C.bg} />
        <path d={bodyPath} stroke={stroke} strokeWidth={sw} fill="none" strokeLinejoin="round" strokeLinecap="round" />
        <path d="M10,30 A100,22 0 0 0 210,30" stroke={stroke} strokeWidth={sw} fill="none" strokeLinecap="round" />
        {ribs.map((r, i) => {
          const xt = mix(10, 210, r);
          const xb = mix(46, 174, r);
          return <line key={i} x1={mix(xt, 110, 0.04)} y1={66} x2={xb} y2={232} stroke={stroke} strokeWidth={3.4} strokeLinecap="round" />;
        })}
        {dashP > 0 && dashP < 1 &&
          [-38, 0, 38].map((a, i) => {
            const rad = (a * Math.PI) / 180;
            const d0 = 24 + dashP * 46;
            const d1 = d0 + 22 * (1 - dashP * 0.5);
            const ox = 110 + a * 1.3;
            return (
              <line
                key={i}
                x1={ox + Math.sin(rad) * d0}
                y1={14 - Math.cos(rad) * d0}
                x2={ox + Math.sin(rad) * d1}
                y2={14 - Math.cos(rad) * d1}
                stroke={stroke}
                strokeWidth={4.5}
                strokeLinecap="round"
                opacity={1 - dashP}
              />
            );
          })}
      </svg>
    </div>
  );
};

// ---------- Parte 1 ----------
export const Part1: React.FC<{ frame: number }> = ({ frame: f }) => {
  if (f > 274) return null;

  // Saudação + símbolo centralizados
  const gFont = `400 108px ${SERIF}`;
  const tw = measure(config.saudacaoAbertura, gFont);
  const groupW = 86 + 30 + tw;
  const left = 960 - groupW / 2;
  const symFinalX = left + 43;
  const symFinalY = 392;

  const grow = prog(f, 24, 38, easeOut);
  const shrink = prog(f, 42, 57, ease);
  const symSize = mix(300 * grow, 86, shrink);
  const symX = mix(960, symFinalX, shrink);
  const symY = mix(540, symFinalY, shrink);
  const symRot = mix(-70, 0, prog(f, 24, 60, easeOut));
  const fadeGreeting = 1 - prog(f, 98, 109, ease);

  // Câmera (98 a 116)
  const cam = prog(f, 98, 116, ease);
  const camScale = mix(1, 1.5, cam);
  const camDy = mix(0, 370 - 613, cam);
  const camBlur = motionBlur(f, 98, 116, 6, ease);

  // Título
  const titleScale = mix(1, 1.035, prog(f, 239, 300, (x) => x));
  const titleExit = prog(f, 264, 273, easeIn);
  const titleBlur = motionBlur(f, 264, 273, 14, easeIn);

  return (
    <AbsoluteFill>
      <Streaks f={f} />
      <Flash f={f} />
      {/* mundo com câmera */}
      <AbsoluteFill
        style={{
          transform: `translateY(${camDy}px) scale(${camScale})`,
          transformOrigin: "960px 613px",
          filter: camBlur > 0.05 ? `blur(${camBlur}px)` : undefined,
        }}
      >
        {f >= 24 && f < 110 && (
          <div
            style={{
              position: "absolute",
              left: symX - symSize / 2,
              top: symY - symSize / 2,
              opacity: fadeGreeting,
            }}
          >
            <ClaudeSymbol size={symSize} rotate={symRot} />
          </div>
        )}
        {f >= 51 && f < 110 && (
          <div style={{ position: "absolute", left: left + 116, top: symFinalY - 70, height: 140, opacity: fadeGreeting }}>
            <MaskRise f={f} start={51} end={62} distance={70} height={140}>
              <div style={{ fontFamily: SERIF, fontSize: 108, lineHeight: "140px", color: C.cream, whiteSpace: "nowrap" }}>
                {config.saudacaoAbertura}
              </div>
            </MaskRise>
          </div>
        )}
        {f >= 54 && f <= 206 && <PromptBox f={f} />}
      </AbsoluteFill>
      <Trash f={f} />
      {/* Título */}
      {f >= 205 && (
        <AbsoluteFill
          style={{
            transform: `translateY(${-170 * titleExit}px) scale(${titleScale})`,
            transformOrigin: "960px 540px",
            opacity: 1 - titleExit,
            filter: titleBlur > 0.05 ? `blur(${titleBlur}px)` : undefined,
          }}
        >
          <div style={{ position: "absolute", left: 0, width: 1920, top: 320, height: 140, display: "flex", justifyContent: "center" }}>
            <MaskRise f={f} start={205} end={216} distance={90} height={140}>
              <div style={{ fontFamily: SERIF, fontSize: 96, lineHeight: "140px", color: C.cream, whiteSpace: "nowrap" }}>
                {config.tituloLinha1}
              </div>
            </MaskRise>
          </div>
          <div style={{ position: "absolute", left: 0, width: 1920, top: 440, height: 330, display: "flex", justifyContent: "center" }}>
            <MaskRise f={f} start={237} end={248} distance={200} height={330}>
              <div
                style={{
                  fontFamily: SERIF,
                  fontWeight: 600,
                  fontSize: 270,
                  lineHeight: "330px",
                  color: "#ffffff",
                  letterSpacing: "-0.03em",
                  textShadow: "0 0 40px rgba(255,255,255,0.18)",
                  whiteSpace: "nowrap",
                }}
              >
                {config.tituloLinha2}
              </div>
            </MaskRise>
          </div>
        </AbsoluteFill>
      )}
    </AbsoluteFill>
  );
};
