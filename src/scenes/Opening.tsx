import React from "react";
import { AbsoluteFill, Easing, useCurrentFrame } from "remotion";
import { COLORS, FONTS, OPENING, SCENES } from "../config";
import { EnergySymbol } from "../components/EnergySymbol";
import { TypeText } from "../components/TypeText";
import { IN, motionBlur, OUT, OVERSHOOT, pulse, ramp, SMOOTH } from "../lib/anim";
import { glass } from "../components/UI";

type P = [number, number];
const TRAILS: [P, P, P, P][] = [
  [[-140, 160], [420, -80], [640, 520], [960, 540]],
  [[2060, 110], [1520, 420], [1280, 760], [960, 540]],
  [[-120, 1010], [320, 1140], [720, 560], [960, 540]],
  [[2040, 1060], [1720, 680], [1140, 300], [960, 540]],
];
const bez = (b: [P, P, P, P], t: number): P => {
  const u = 1 - t;
  const w = [u * u * u, 3 * u * u * t, 3 * u * t * t, t * t * t];
  return [w.reduce((a, wi, i) => a + wi * b[i][0], 0), w.reduce((a, wi, i) => a + wi * b[i][1], 0)];
};
const TRAIL_EASE = Easing.bezier(0.35, 0, 0.75, 1);

const LightTrails: React.FC<{ frame: number }> = ({ frame }) => {
  if (frame > 30) return null;
  return (
    <svg width={1920} height={1080} style={{ position: "absolute" }}>
      {TRAILS.map((b, ti) => {
        const s = ti * 1.5;
        const head = ramp(frame, s, OPENING.t.trailsEnd, 0, 1, TRAIL_EASE);
        const tail = ramp(frame, s + 5, OPENING.t.trailsEnd + 7, 0, 1, TRAIL_EASE);
        const N = 28;
        const segs = [];
        for (let i = 0; i < N; i++) {
          const t0 = tail + ((head - tail) * i) / N;
          const t1 = tail + ((head - tail) * (i + 1)) / N;
          const [x0, y0] = bez(b, t0);
          const [x1, y1] = bez(b, t1);
          const k = (i + 1) / N;
          segs.push(
            <line key={i} x1={x0} y1={y0} x2={x1} y2={y1} stroke={COLORS.cyan} strokeWidth={0.6 + 3.2 * k * k} strokeLinecap="round" opacity={k * k * 0.95} />,
          );
        }
        const [hx, hy] = bez(b, head);
        const tipO = head < 1 ? 1 : 0;
        return (
          <g key={ti} style={{ filter: `drop-shadow(0 0 6px ${COLORS.cyan})` }}>
            {segs}
            <circle cx={hx} cy={hy} r={14} fill={COLORS.cyan} opacity={0.25 * tipO} />
            <circle cx={hx} cy={hy} r={4.5} fill={COLORS.white} opacity={tipO} />
          </g>
        );
      })}
    </svg>
  );
};

export const Opening: React.FC = () => {
  const frame = useCurrentFrame();
  if (frame < SCENES.opening.from || frame > SCENES.opening.to) return null;
  const t = OPENING.t;

  // ---- flash -------------------------------------------------------
  const flash = pulse(frame, t.flash + 1, 4);
  const ring = ramp(frame, t.flash, t.flash + 22, 0, 1, OUT);

  // ---- symbol: forms at center, settles beside WAKE UP. -------------
  const symScaleIn = ramp(frame, t.flash - 2, t.flash + 12, 0, 1, OVERSHOOT);
  const settle = ramp(frame, 30, 50, 0, 1, SMOOTH);
  const symX = (f: number) => 960 + (620 - 960) * ramp(f, 30, 50, 0, 1, SMOOTH);
  const symSize = 190 + (112 - 190) * settle;
  const symRot = ramp(frame, t.flash - 2, 56, -120, 45, OUT) + frame * 0.2;
  const groupOut = ramp(frame, t.wakeUpOut, t.wakeUpOut + 12, 0, 1, IN);
  const groupY = (f: number) => -70 * ramp(f, t.wakeUpOut, t.wakeUpOut + 12, 0, 1, IN);
  const groupBlur = motionBlur(groupY, frame, 0.5, 8);
  const symBlur = motionBlur(symX, frame, 0.1, 5);

  // ---- WAKE UP. ----------------------------------------------------
  const wake = ramp(frame, t.wakeUpIn, t.wakeUpIn + 16, 0, 1, OUT);

  // ---- question panel ----------------------------------------------
  const panelIn = ramp(frame, t.panelIn, t.panelIn + 16, 0, 1, OUT);
  const panelOut = ramp(frame, t.questionOut, t.questionOut + 10, 0, 1, IN);
  const panelY = (f: number) => 160 * (1 - ramp(f, t.panelIn, t.panelIn + 16, 0, 1, OUT)) - 40 * ramp(f, t.questionOut, t.questionOut + 10, 0, 1, IN);
  const push = 1 + 0.07 * ramp(frame, t.panelIn, t.questionOut + 6, 0, 1, (x) => x);
  const panelBlur = motionBlur(panelY, frame, 0.35, 10);

  // ---- realization ---------------------------------------------------
  const realOut = ramp(frame, t.realizationOut, t.realizationOut + 10, 0, 1, IN);
  const realY = (f: number) => -110 * ramp(f, t.realizationOut, t.realizationOut + 10, 0, 1, IN);
  const realBlur = motionBlur(realY, frame, 0.4, 10);

  // ---- statement ----------------------------------------------------
  const words = [...OPENING.statementWords, OPENING.statementLastWord];
  const wordStarts = [t.statementIn, t.statementIn + 6, t.statementIn + 12, t.statementNow];
  const stOut = ramp(frame, t.statementOut, t.statementOut + 14, 0, 1, IN);
  const stY = (f: number) => -90 * ramp(f, t.statementOut, t.statementOut + 14, 0, 1, IN);
  const nowPulse = pulse(frame, t.statementNow + 10, 9);

  return (
    <AbsoluteFill>
      <LightTrails frame={frame} />

      {/* Flash revealing depth */}
      {frame >= t.flash - 2 && frame < t.flash + 26 && (
        <AbsoluteFill>
          <div
            style={{
              position: "absolute",
              left: 960 - 520,
              top: 540 - 520,
              width: 1040,
              height: 1040,
              borderRadius: 520,
              background: `radial-gradient(circle, rgba(255,255,255,${0.75 * flash}) 0%, rgba(98,230,255,${0.35 * flash}) 22%, transparent 62%)`,
            }}
          />
          <div
            style={{
              position: "absolute",
              left: 960 - 700 * ring,
              top: 540 - 700 * ring,
              width: 1400 * ring,
              height: 1400 * ring,
              borderRadius: "50%",
              border: `1.5px solid ${COLORS.cyan}`,
              opacity: 0.6 * (1 - ring),
            }}
          />
        </AbsoluteFill>
      )}

      {/* Symbol + WAKE UP. */}
      {frame < t.wakeUpOut + 13 && (
        <AbsoluteFill
          style={{
            opacity: 1 - groupOut,
            transform: `translateY(${groupY(frame)}px)`,
            filter: groupBlur > 0 ? `blur(${groupBlur}px)` : undefined,
          }}
        >
          <div
            style={{
              position: "absolute",
              left: symX(frame) - symSize / 2,
              top: 540 - symSize / 2,
              transform: `scale(${symScaleIn})`,
              filter: symBlur > 0 ? `blur(${symBlur}px)` : undefined,
            }}
          >
            <EnergySymbol size={symSize} rotation={symRot} glow={1 + flash * 2} />
          </div>
          <div style={{ position: "absolute", left: 742, top: 540 - 80, height: 160, overflow: "hidden" }}>
            <div
              style={{
                fontFamily: FONTS.serif,
                fontSize: 120,
                fontWeight: 600,
                letterSpacing: "-0.015em",
                lineHeight: "160px",
                color: COLORS.text,
                transform: `translateY(${(1 - wake) * 130}px)`,
                opacity: wake,
                whiteSpace: "nowrap",
              }}
            >
              {OPENING.wakeUp}
            </div>
          </div>
        </AbsoluteFill>
      )}

      {/* Question panel */}
      {frame >= t.panelIn && frame < t.questionOut + 11 && (
        <AbsoluteFill style={{ transform: `scale(${push})`, opacity: panelIn * (1 - panelOut) }}>
          <div
            style={{
              position: "absolute",
              left: 960 - 680,
              top: 540 - 120,
              width: 1360,
              height: 240,
              ...glass(true),
              transform: `translateY(${panelY(frame)}px)`,
              filter: panelBlur > 0 ? `blur(${panelBlur}px)` : undefined,
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              padding: "0 64px",
            }}
          >
            <div style={{ fontFamily: FONTS.mono, fontSize: 20, letterSpacing: "0.18em", color: COLORS.cyan, opacity: 0.85, marginBottom: 22 }}>
              INCOMING QUESTION
            </div>
            <div style={{ fontFamily: FONTS.sans, fontSize: 50, fontWeight: 500, letterSpacing: "-0.01em", whiteSpace: "nowrap" }}>
              <TypeText segments={[{ text: OPENING.question }]} start={t.typeStart} framesPerChar={(t.typeEnd - t.typeStart) / OPENING.question.length} ghost={0.16} settle={7} cursor />
            </div>
          </div>
        </AbsoluteFill>
      )}

      {/* AI IS CHANGING EVERYTHING. */}
      {frame >= t.realizationIn && frame < t.realizationOut + 11 && (
        <AbsoluteFill
          style={{
            alignItems: "center",
            justifyContent: "center",
            opacity: 1 - realOut,
            transform: `translateY(${realY(frame)}px)`,
            filter: realBlur > 0 ? `blur(${realBlur}px)` : undefined,
          }}
        >
          <div style={{ fontFamily: FONTS.serif, fontSize: 150, fontWeight: 600, lineHeight: 1.05, letterSpacing: "-0.02em", textAlign: "center" }}>
            <div>
              <TypeText segments={[{ text: "AI", glowHold: 22 }, { text: OPENING.realizationLine1.slice(2) }]} start={t.realizationIn} framesPerChar={1.6} />
            </div>
            <div>
              <TypeText segments={[{ text: OPENING.realizationLine2 }]} start={t.realizationIn + 26} framesPerChar={1.6} cursor />
            </div>
          </div>
        </AbsoluteFill>
      )}

      {/* And it's happening now. */}
      {frame >= t.statementIn && (
        <AbsoluteFill
          style={{
            alignItems: "center",
            justifyContent: "center",
            opacity: 1 - stOut,
            transform: `translateY(${stY(frame)}px)`,
            filter: motionBlur(stY, frame, 0.4, 8) > 0 ? `blur(${motionBlur(stY, frame, 0.4, 8)}px)` : undefined,
          }}
        >
          <div style={{ fontFamily: FONTS.serif, fontSize: 110, fontWeight: 500, letterSpacing: "-0.02em", whiteSpace: "nowrap" }}>
            {words.map((w, i) => {
              const a = ramp(frame, wordStarts[i], wordStarts[i] + 12, 0, 1, OUT);
              const isNow = i === words.length - 1;
              return (
                <span
                  key={i}
                  style={{
                    display: "inline-block",
                    marginRight: i < words.length - 1 ? "0.26em" : 0,
                    opacity: a,
                    transform: `translateY(${(1 - a) * 40}px)`,
                    color: isNow ? COLORS.cyan : COLORS.text,
                    fontStyle: isNow ? "italic" : "normal",
                    textShadow: isNow ? `0 0 ${10 + 40 * nowPulse}px rgba(98,230,255,${0.35 + 0.5 * nowPulse})` : undefined,
                  }}
                >
                  {w}
                </span>
              );
            })}
          </div>
        </AbsoluteFill>
      )}
    </AbsoluteFill>
  );
};
