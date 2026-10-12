import React from "react";
import { config } from "../config";
import { C, INTER, SERIF, ease, easeOut, measure, mix, prog } from "../theme";
import { glowGradient } from "./Background";
import { ClaudeSymbol, SendButton } from "./Pieces";

/** A abertura do vídeo em miniatura, desenhada em 1920x1080 e reduzida para width. */
export const MiniOpening: React.FC<{
  width: number;
  grow: number; // símbolo nasce (0 a 1)
  shrink: number; // símbolo encolhe para a esquerda (0 a 1)
  greet: number; // saudação (0 a 1)
  box: number; // caixa (0 a 1)
  streak?: number; // riscos (0 a 1)
  opacity?: number;
  rot?: number;
}> = ({ width, grow, shrink, greet, box, streak = 1, opacity = 1, rot = 0 }) => {
  const k = width / 1920;
  const tw = measure(config.saudacaoAbertura, `400 108px ${SERIF}`);
  const left = 960 - (86 + 30 + tw) / 2;
  const size = mix(300 * grow, 86, shrink);
  const sx = mix(960, left + 43, shrink);
  const sy = mix(540, 392, shrink);
  return (
    <div style={{ width, height: 1080 * k, overflow: "hidden", position: "relative", background: C.bg }}>
      <div style={{ position: "absolute", left: 0, top: 0, width: 1920, height: 1080, transform: `scale(${k})`, transformOrigin: "0 0", opacity }}>
        <div style={{ position: "absolute", inset: 0, background: glowGradient(0.24, 520, "255,255,255") }} />
        {streak < 1 &&
          [
            [-50, 300],
            [1290, -50],
            [1970, 780],
            [630, 1130],
          ].map(([x, y], i) => {
            const p = easeOut(streak);
            const hx = mix(x, 960, p);
            const hy = mix(y, 540, p);
            const ang = (Math.atan2(540 - y, 960 - x) * 180) / Math.PI;
            return (
              <div
                key={i}
                style={{
                  position: "absolute",
                  left: hx - 500,
                  top: hy - 4,
                  width: 500,
                  height: 8,
                  borderRadius: 4,
                  transformOrigin: "500px 4px",
                  transform: `rotate(${ang}deg)`,
                  background: "linear-gradient(90deg, rgba(255,255,255,0), rgba(255,255,255,1))",
                }}
              />
            );
          })}
        {grow > 0 && (
          <div style={{ position: "absolute", left: sx - size / 2, top: sy - size / 2 }}>
            <ClaudeSymbol size={size} rotate={rot} />
          </div>
        )}
        {greet > 0 && (
          <div
            style={{
              position: "absolute",
              left: left + 116,
              top: 392 - 70 + (1 - greet) * 60,
              fontFamily: SERIF,
              fontSize: 108,
              lineHeight: "140px",
              color: C.cream,
              whiteSpace: "nowrap",
              opacity: greet,
            }}
          >
            {config.saudacaoAbertura}
          </div>
        )}
        {box > 0 && (
          <div
            style={{
              position: "absolute",
              left: 400,
              top: 500 + (1 - box) * 46,
              width: 1120,
              height: 226,
              borderRadius: 34,
              background: C.box,
              border: `1.5px solid ${C.boxBorder}`,
              boxSizing: "border-box",
              opacity: box,
            }}
          >
            <div style={{ position: "absolute", left: 38, top: 30, fontFamily: INTER, fontSize: 41, color: "rgba(242,242,242,0.38)" }}>
              {config.textoApagadoPergunta}
            </div>
            <div style={{ position: "absolute", right: 20, bottom: 20 }}>
              <SendButton size={54} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

/** Estados da miniatura num ciclo de 150 quadros. */
export const miniLoop = (t: number) => ({
  streak: prog(t, 0, 14, (x) => x),
  grow: prog(t, 12, 26, easeOut),
  shrink: prog(t, 34, 50, ease),
  greet: prog(t, 44, 56, easeOut),
  box: prog(t, 50, 66, easeOut),
  rot: mix(-70, 0, prog(t, 12, 48, easeOut)),
  opacity: 1 - prog(t, 136, 150, ease),
});
