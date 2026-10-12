import React from "react";
import { AbsoluteFill, interpolateColors } from "remotion";
import { config } from "../config";
import { C, SERIF, UNBOUNDED, born, ease, easeIn, easeOut, measure, mix, motionBlur, prog, snap } from "../theme";
import { ClaudeSymbol } from "../components/Pieces";
import { lightCoverage } from "./Part4";

// Frases que saem do símbolo do canto: [sai, volta, linhas, tamanho]
const PHRASES: [number, number, string[], number][] = [
  [909, 956, [config.passos[0]], 76],
  [967, 998, [config.passos[1]], 76],
  [1010, 1066, [config.passos[2]], 76],
  [1079, 1106, [config.passos[3]], 76],
  [1258, 1308, config.frasesSegundaMetade.semCodigo, 70],
  [1319, 1366, config.frasesSegundaMetade.querMudar, 70],
  [1457, 1486, [config.frasesSegundaMetade.final], 76],
];
const COMMENT_PHRASE: [number, number] = [1507, 1597];

const pulseAt = (f: number) => {
  const times: number[] = [];
  PHRASES.forEach(([a, b]) => times.push(a, b));
  times.push(COMMENT_PHRASE[0], COMMENT_PHRASE[1]);
  let s = 0;
  for (const t of times) if (f >= t && f < t + 10) s = Math.max(s, Math.sin((Math.PI * (f - t)) / 10));
  return s;
};

/** Estado de uma frase: progresso de saída e de volta. */
const phraseAnim = (f: number, a: number, b: number) => {
  const out = prog(f, a, a + 12, snap);
  const back = prog(f, b, b + 10, easeIn);
  const blur = motionBlur(f, a, a + 12, 10, easeOut) + motionBlur(f, b, b + 10, 10, easeIn);
  const sway = Math.sin((f - a) / 9) * 4 * prog(f, a + 12, a + 18) * (1 - back);
  const p = out * (1 - back);
  return {
    visible: f >= a && f < b + 10,
    style: {
      opacity: Math.min(1, prog(f, a, a + 4)) * (1 - back),
      transform: `translateX(${(1 - out) * -60 - back * 60 + sway}px) scale(${mix(0.3, 1, p)})`,
      transformOrigin: "0 50%",
      filter: blur > 0.1 ? `blur(${blur}px)` : undefined,
    } as React.CSSProperties,
  };
};

export const Mascot: React.FC<{ frame: number }> = ({ frame: f }) => {
  if (f < 886) return null;

  // posição e tamanho do símbolo
  let cx = 118;
  let cy = 130;
  let size = 76;
  let blur = 0;
  let rot = f * 0.6;
  let scale = prog(f, 886, 897, snap);
  // recolhe enquanto a câmera desce para o código, volta no 1248
  if (f >= 1116 && f < 1248) scale *= 1 - prog(f, 1116, 1125, easeIn);
  if (f >= 1248 && f < 1262) scale *= prog(f, 1248, 1258, snap);
  scale *= 1 + 0.2 * pulseAt(f);
  // atravessa a tela na troca para a parte 5
  const cross = prog(f, 1490, 1504, ease);
  cx = mix(118, 1450, cross);
  blur += motionBlur(f, 1490, 1504, 14, ease);
  const float = f < 1606 ? Math.sin(f / 18) * 4 : 0;
  // assinatura: o símbolo vai para o centro, cresce e gira; depois sai para a esquerda
  const toCenter = prog(f, 1606, 1621, ease);
  const groupOut = prog(f, 1653, 1659, easeIn);
  if (f >= 1606) {
    cx = mix(1450, 960, toCenter);
    cy = mix(130, 540, toCenter);
    size = mix(76, 300, toCenter);
    rot += toCenter * 220;
    blur += motionBlur(f, 1606, 1621, 6, ease);
  }
  const groupShift = -70 * groupOut;
  blur += motionBlur(f, 1653, 1659, 14, easeIn);

  // cor: preto quando está sobre o claro, branco no escuro
  const cov = lightCoverage(f, cx, cy);
  const color = interpolateColors(cov, [0, 1], ["#f2f2f2", C.ink]);
  const halo = cov > 0.5 ? "rgba(0,0,0,0.12)" : "rgba(255,255,255,0.16)";

  // frase final
  const nameIn = prog(f, 1658, 1665, easeOut);
  const nameBlur = motionBlur(f, 1658, 1665, 14, easeOut);
  const nameScale = mix(0.97, 1.03, prog(f, 1658, 1709, (x) => x));

  return (
    <AbsoluteFill>
      {f < 1659 && (
        <div
          style={{
            position: "absolute",
            left: cx - size / 2 + groupShift,
            top: cy - size / 2 + float,
            width: size,
            height: size,
            transform: `scale(${scale})`,
            opacity: 1 - groupOut,
            filter: [`drop-shadow(0 0 ${size * 0.16}px ${halo})`, blur > 0.1 ? `blur(${blur}px)` : ""].join(" "),
          }}
        >
          <ClaudeSymbol size={size} color={color} rotate={rot} />
        </div>
      )}
      {/* frases da parte 4 (cor da tinta) */}
      {PHRASES.map(([a, b, lines, fs], i) => {
        const an = phraseAnim(f, a, b);
        if (!an.visible) return null;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: 118 + 64,
              top: 130 + float,
              transform: "translateY(-50%)",
            }}
          >
            <div style={{ ...an.style, fontFamily: SERIF, fontSize: fs, lineHeight: 1.12, whiteSpace: "nowrap", ...born(f - a, C.ink, 16, true) }}>
              {lines.map((l, j) => (
                <div key={j}>{l}</div>
              ))}
            </div>
          </div>
        );
      })}
      {/* frase do comentário (parte 5) */}
      {(() => {
        const [a, b] = COMMENT_PHRASE;
        const an = phraseAnim(f, a, b);
        if (!an.visible) return null;
        return (
          <div style={{ position: "absolute", left: 1450 + 64, top: 130 + float, transform: "translateY(-50%)" }}>
            <div style={{ ...an.style, fontFamily: SERIF, fontSize: 76, lineHeight: 1.12, whiteSpace: "nowrap" }}>
              <div style={born(f - a, C.cream)}>{config.fraseComentario}</div>
              <div style={{ color: "#ffffff", fontWeight: 600, textShadow: "0 0 24px rgba(255,255,255,0.45)" }}>{config.palavraComentario}</div>
            </div>
          </div>
        );
      })()}
      {/* a frase final */}
      {f >= 1658 && (
        <AbsoluteFill style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div
            style={{
              transform: `translateX(${(1 - nameIn) * 70}px) scale(${nameScale})`,
              opacity: nameIn,
              filter: nameBlur > 0.1 ? `blur(${nameBlur}px)` : undefined,
            }}
          >
            <div
              style={{
                fontFamily: UNBOUNDED,
                fontWeight: 300,
                fontSize: (100 * 1180) / measure(config.fraseFinal, `300 100px ${UNBOUNDED}`),
                lineHeight: 1,
                color: C.cream,
                whiteSpace: "nowrap",
              }}
            >
              {config.fraseFinal}
            </div>
          </div>
        </AbsoluteFill>
      )}
    </AbsoluteFill>
  );
};
