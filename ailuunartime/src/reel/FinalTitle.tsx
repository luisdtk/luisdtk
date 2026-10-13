import type { CSSProperties } from "react";
import { AbsoluteFill, Img, staticFile } from "remotion";

import { step } from "../kit/spring";
import { clamp01, progress } from "../kit/time";
import { cue } from "./cues";
import { Embers, Logo } from "./fx";
import { PanelView, shotAt } from "./panel";
import { color, easeOut, font, FRAME, land } from "./tokens";

// Three voices, sentence case: a quiet sans lead-in, an italic serif, then the punch in red.
// Every word keeps its slot from the first frame, so lines never re-centre while they build.
const LINES: { words: string[]; style: CSSProperties }[] = [
  { words: ["Have", "you", "ever"], style: { fontFamily: font.ui, fontWeight: 500, fontSize: 64, letterSpacing: "-0.01em", color: color.white, gap: 18 } },
  { words: ["imagined", "reading"], style: { fontFamily: font.serif, fontStyle: "italic", fontWeight: 400, fontSize: 150, letterSpacing: "-0.02em", lineHeight: 0.95, color: color.white, gap: 30 } },
  { words: ["manga", "like", "this?"], style: { fontFamily: font.geo, fontWeight: 800, fontSize: 78, letterSpacing: "-0.03em", color: color.red, gap: 20, textShadow: "0 0 40px rgba(226,38,43,0.45)" } },
];
const WORD_GAP = 0.11; // seconds between words, a little faster than eighths

/** Scene 5: the line, Asta in red and black over the page, and the logo lockup on the last hit. */
export function FinalTitle({ t }: { t: number }) {
  if (t < cue.final - 0.05) return null;

  const enter = easeOut(progress(t, cue.final, 0.35));
  const flash = Math.max(0, 1 - (t - cue.final) / 0.18);
  const hit = Math.max(0, 1 - Math.abs(t - cue.finalHit) / 0.09);
  const ring = progress(t, cue.finalHit, 0.6);

  const page = shotAt(t, [
    [cue.final, 0.55, 0.36, 1.5],
    [cue.final + 0.2, 0.55, 0.4, 1.18],
  ]);
  const asta = step(t - cue.final - 0.05, { stiffness: 170, damping: 22 });
  const lockup = step(t - cue.lockup, { stiffness: 300, damping: 24 });
  // the second line of narration gets its own beat: a soft ring and a slow push
  const ring2 = progress(t, cue.secondLine, 0.8);
  const push = 1 + 0.05 * easeOut(progress(t, cue.secondLine, cue.finalHit - cue.secondLine));

  let index = 0;
  return (
    <AbsoluteFill style={{ background: color.bg, overflow: "hidden" }}>
      {/* the page, still monochrome, deep in the background */}
      <AbsoluteFill style={{ opacity: 0.32 * enter }}>
        <PanelView panel="sword" width={FRAME.width} height={FRAME.height} shot={{ ...page, fy: page.fy + (t - cue.final) * 0.01 }} imageStyle={{ filter: "contrast(1.1)" }} />
      </AbsoluteFill>
      <AbsoluteFill style={{ background: "linear-gradient(180deg, rgba(10,10,10,0.92) 0%, rgba(10,10,10,0.55) 42%, rgba(10,10,10,0.2) 70%, rgba(10,10,10,0.85) 100%)" }} />
      <AbsoluteFill style={{ background: `radial-gradient(circle at 50% 72%, rgba(226,38,43,${0.4 * enter + hit * 0.3}) 0%, rgba(10,10,10,0) 48%)` }} />

      {/* shock ring on the final hit */}
      {ring > 0 && ring < 1 && (
        <div
          style={{
            position: "absolute",
            left: FRAME.width / 2 - 900 * easeOut(ring),
            top: 1300 - 900 * easeOut(ring),
            width: 1800 * easeOut(ring),
            height: 1800 * easeOut(ring),
            borderRadius: "50%",
            border: `${10 * (1 - ring)}px solid ${color.red}`,
            opacity: 1 - ring,
          }}
        />
      )}

      <Embers t={t} start={cue.final} end={cue.end} count={40} seed={51} area={{ x: 60, y: 900, w: 960, h: 1000 }} rise={480} size={9} />

      {ring2 > 0 && ring2 < 1 && (
        <div style={{ position: "absolute", left: FRAME.width / 2 - 700 * easeOut(ring2), top: 1350 - 700 * easeOut(ring2), width: 1400 * easeOut(ring2), height: 1400 * easeOut(ring2), borderRadius: "50%", border: `${5 * (1 - ring2)}px solid ${color.white}`, opacity: 0.6 * (1 - ring2) }} />
      )}

      {/* Asta, rising into frame */}
      <Img
        src={staticFile("images/asta-redblack.png")}
        style={{
          position: "absolute",
          width: 1240,
          height: 1240,
          left: (FRAME.width - 1240) / 2 + 30,
          top: 760 + (1 - asta) * 380 + Math.sin((t - cue.final) * 2.4) * 6,
          scale: `${(1.06 - 0.06 * asta + hit * 0.02) * push}`,
          opacity: clamp01(asta * 2),
          filter: `drop-shadow(0 0 ${36 + hit * 50}px rgba(226,38,43,0.5))`,
        }}
      />
      <AbsoluteFill style={{ background: "linear-gradient(180deg, rgba(10,10,10,0) 80%, rgba(10,10,10,0.9) 100%)" }} />

      {/* the line */}
      <div style={{ position: "absolute", top: 290, left: 0, width: FRAME.width, display: "flex", flexDirection: "column", alignItems: "center", gap: 10, scale: `${1 + hit * 0.03}` }}>
        {LINES.map((line, li) => (
          <div key={li} style={{ display: "flex", lineHeight: 1.05, textShadow: "0 4px 30px rgba(0,0,0,0.6)", ...line.style }}>
            {line.words.map((word) => {
              const start = cue.title + index++ * WORD_GAP;
              const u = land(progress(t, start, 0.3));
              return (
                <span
                  key={word}
                  style={{
                    display: "inline-block",
                    opacity: u,
                    translate: `0 ${(1 - u) * 36}px`,
                    filter: u < 1 ? `blur(${(1 - u) * 16}px)` : undefined,
                  }}
                >
                  {word}
                </span>
              );
            })}
          </div>
        ))}
      </div>

      {/* logo lockup, on the last hit */}
      <div
        style={{
          position: "absolute",
          left: 0,
          width: FRAME.width,
          top: 730 + (1 - lockup) * 30,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          gap: 18,
          opacity: clamp01(lockup * 2),
        }}
      >
        <Logo width={170} style={{ filter: "drop-shadow(0 0 24px rgba(226,38,43,0.5))" }} />
      </div>

      {flash > 0 && <AbsoluteFill style={{ background: color.white, opacity: flash }} />}
      {hit > 0 && <AbsoluteFill style={{ background: color.white, opacity: hit * 0.35, mixBlendMode: "screen" }} />}
    </AbsoluteFill>
  );
}
