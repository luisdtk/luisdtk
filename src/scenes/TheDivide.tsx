import React, { useMemo } from "react";
import { AbsoluteFill, random, useCurrentFrame } from "remotion";
import { COLORS, DIVIDE, FONTS, SCENES } from "../config";
import { Avatar, glass, ProgressBar } from "../components/UI";
import { IN, mixColor, motionBlur, OUT, ramp, SMOOTH } from "../lib/anim";

const T = DIVIDE.t;

const mono: React.CSSProperties = { fontFamily: FONTS.mono, fontVariantLigatures: "none" };

/** Counter that flips upward through the configured values. */
const Counter: React.FC<{ frame: number; label: string; offset: number; color: string }> = ({ frame, label, offset, color }) => {
  const steps = DIVIDE.counterSteps.map((s) => s + offset);
  let idx = 0;
  steps.forEach((s, i) => {
    if (frame >= s) idx = i;
  });
  const flip = ramp(frame, steps[idx], steps[idx] + 6, 0, 1, OUT);
  const prev = idx > 0 ? DIVIDE.counterValues[idx - 1] : null;
  return (
    <div>
      <div style={{ ...mono, fontSize: 20, letterSpacing: "0.2em", color: COLORS.textDim, marginBottom: 6 }}>{label}</div>
      <div style={{ display: "flex", alignItems: "center", gap: 26 }}>
        <div style={{ position: "relative", height: 160, width: 200, overflow: "hidden" }}>
          {prev && flip < 1 && (
            <div style={{ ...mono, position: "absolute", fontSize: 150, lineHeight: "160px", fontWeight: 600, color, opacity: 1 - flip, transform: `translateY(${-flip * 160}px)` }}>{prev}</div>
          )}
          <div
            style={{
              ...mono,
              position: "absolute",
              fontSize: 150,
              lineHeight: "160px",
              fontWeight: 600,
              color,
              opacity: frame >= steps[0] ? flip : 0,
              transform: `translateY(${(1 - flip) * 160}px)`,
              textShadow: `0 0 30px ${color}55`,
            }}
          >
            {DIVIDE.counterValues[idx]}
          </div>
        </div>
        <div style={{ ...mono, fontSize: 26, color: COLORS.textDim, letterSpacing: "0.1em" }}>
          {DIVIDE.counterValues.map((v, i) => (
            <span key={v} style={{ color: i <= idx && frame >= steps[0] ? COLORS.cyan : "rgba(146,152,165,0.35)" }}>
              {v}
              {i < DIVIDE.counterValues.length - 1 ? " → " : ""}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};

export const TheDivide: React.FC = () => {
  const frame = useCurrentFrame();
  const nodes = useMemo(
    () =>
      new Array(26).fill(0).map((_, i) => ({
        x: 60 + random(`dl${i}`) * 840,
        y: 80 + random(`dt${i}`) * 920,
        r: 2 + random(`dr${i}`) * 3,
        a: random(`da${i}`) * 6.28,
        len: 14 + random(`dlen${i}`) * 26,
      })),
    [],
  );
  if (frame < SCENES.divide.from || frame > SCENES.divide.to) return null;

  const sceneIn = ramp(frame, 686, 706, 0, 1, OUT);
  const divider = ramp(frame, T.divider, T.divider + 20, 0, 1, SMOOTH);
  const dividerColor = mixColor(ramp(frame, 720, 775), COLORS.textDim, COLORS.cyan);
  const dividerOut = ramp(frame, 846, 858, 0, 1, IN);
  const countersOut = ramp(frame, T.countersOut, T.countersOut + 12, 0, 1, IN);
  const countersY = (f: number) => -80 * ramp(f, T.countersOut, T.countersOut + 12, 0, 1, IN);
  const stalled = ramp(frame, 690, 730, 0.06, DIVIDE.stalledProgress, OUT);
  const leftDark = ramp(frame, T.commentsFade, 860) * 0.55;
  const staticCard = sceneIn * (1 - 0.65 * ramp(frame, T.comments[0] - 6, T.comments[0] + 6)) * (1 - ramp(frame, 846, 856));
  const recede = ramp(frame, 846, 862, 0, 1, SMOOTH);

  const finalIn = ramp(frame, T.finalIn, T.finalIn + 14, 0, 1, OUT);
  const finalScale = 1.15 - 0.15 * finalIn;
  const finalBlur = (1 - finalIn) * 12;
  const finalOut = ramp(frame, T.finalOut, T.finalOut + 14, 0, 1, IN);
  const finalY = (f: number) => -90 * ramp(f, T.finalOut, T.finalOut + 14, 0, 1, IN);
  const fy = motionBlur(finalY, frame, 0.4, 8);

  return (
    <AbsoluteFill>
      {/* ---------- Left: the static world ---------- */}
      <AbsoluteFill style={{ opacity: sceneIn * (1 - 0.6 * recede) }}>
        <svg width={960} height={1080} style={{ position: "absolute" }}>
          {nodes.map((n, i) => {
            const fade = i % 4 === 0 ? ramp(frame, 700 + i * 3, 760 + i * 3, 0.7, 0.08) : 0;
            return (
              <g key={i}>
                <line x1={n.x} y1={n.y} x2={n.x + Math.cos(n.a) * n.len} y2={n.y + Math.sin(n.a) * n.len} stroke={COLORS.textDim} strokeWidth={1} opacity={0.18} />
                <circle cx={n.x} cy={n.y} r={n.r} fill={COLORS.textDim} opacity={0.3} />
                {fade > 0 && <circle cx={n.x} cy={n.y} r={n.r * 2.2} fill={COLORS.cyan} opacity={fade * 0.5} />}
              </g>
            );
          })}
        </svg>
        <div style={{ position: "absolute", left: 150, top: 190, width: 620, padding: "28px 32px", ...glass(true), background: "rgba(16,19,26,0.8)", opacity: staticCard }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 22 }}>
            <span style={{ ...mono, fontSize: 20, color: COLORS.textDim }}>{DIVIDE.staticLabel}</span>
            <span style={{ display: "flex", gap: 6 }}>
              <span style={{ width: 6, height: 20, background: COLORS.textDim, borderRadius: 2 }} />
              <span style={{ width: 6, height: 20, background: COLORS.textDim, borderRadius: 2 }} />
            </span>
          </div>
          <ProgressBar value={stalled} width={556} color={COLORS.textDim} height={8} />
          <div style={{ ...mono, fontSize: 18, color: "rgba(146,152,165,0.6)", marginTop: 14 }}>{Math.round(stalled * 100)}% · no change</div>
        </div>
      </AbsoluteFill>
      <AbsoluteFill style={{ background: `linear-gradient(90deg, rgba(5,7,11,${leftDark}) 0%, rgba(5,7,11,${leftDark * 0.8}) 48%, transparent 52%)` }} />

      {/* ---------- Right: the connected world counters ---------- */}
      {frame < T.countersOut + 13 && (
        <div
          style={{
            position: "absolute",
            left: 1120,
            top: 230,
            opacity: sceneIn * (1 - countersOut),
            transform: `translateY(${countersY(frame)}px)`,
            filter: motionBlur(countersY, frame, 0.4, 8) > 0 ? `blur(${motionBlur(countersY, frame, 0.4, 8)}px)` : undefined,
            display: "flex",
            flexDirection: "column",
            gap: 70,
          }}
        >
          <Counter frame={frame} label={DIVIDE.counterLabels[0]} offset={0} color={COLORS.text} />
          <Counter frame={frame} label={DIVIDE.counterLabels[1]} offset={4} color={COLORS.cyan} />
        </div>
      )}

      {/* ---------- Divider ---------- */}
      <div
        style={{
          position: "absolute",
          left: 959,
          top: 540 - 470 * divider,
          width: 2,
          height: 940 * divider,
          background: `linear-gradient(180deg, transparent, ${dividerColor} 20%, ${dividerColor} 80%, transparent)`,
          boxShadow: `0 0 18px ${dividerColor}`,
          opacity: 1 - dividerOut,
        }}
      />

      {/* ---------- Anonymous comments ---------- */}
      {frame >= T.comments[0] && (
        <AbsoluteFill style={{ transform: `scale(${1 - 0.08 * recede})`, opacity: 1 - 0.85 * recede, filter: recede > 0.01 ? `blur(${recede * 6}px)` : undefined }}>
          {DIVIDE.comments.map((c, i) => {
            const v = ramp(frame, T.comments[i], T.comments[i] + 12, 0, 1, OUT);
            const fade = ramp(frame, T.commentsFade + i * 3, T.commentsFade + 18 + i * 3, 1, 0.45);
            return (
              <div
                key={c}
                style={{
                  position: "absolute",
                  left: 150,
                  top: 420 + i * 150,
                  width: 640,
                  height: 124,
                  ...glass(true),
                  borderRadius: 18,
                  display: "flex",
                  alignItems: "center",
                  gap: 22,
                  padding: "0 28px",
                  opacity: v * fade,
                  transform: `translateY(${(1 - v) * 30}px)`,
                }}
              >
                <Avatar size={56} hue={["#3B4252", "#34404A", "#423B4C"][i]} />
                <div>
                  <div style={{ ...mono, fontSize: 17, color: COLORS.textDim, marginBottom: 6 }}>
                    {DIVIDE.commentHandle} · {i + 1}m
                  </div>
                  <div style={{ fontFamily: FONTS.sans, fontSize: 32, fontWeight: 500, color: COLORS.text }}>{c}</div>
                </div>
              </div>
            );
          })}
        </AbsoluteFill>
      )}

      {/* ---------- YOU WILL BE LEFT BEHIND. ---------- */}
      {frame >= T.finalIn && (
        <AbsoluteFill
          style={{
            alignItems: "center",
            justifyContent: "center",
            opacity: finalIn * (1 - finalOut),
            transform: `translateY(${finalY(frame)}px) scale(${finalScale})`,
            filter: finalBlur + fy > 0.15 ? `blur(${finalBlur + fy}px)` : undefined,
          }}
        >
          <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse 55% 45% at 50% 50%, rgba(9,11,16,0.85), transparent 75%)" }} />
          <div style={{ position: "relative", fontFamily: FONTS.serif, fontWeight: 600, fontSize: 168, lineHeight: 1.02, letterSpacing: "-0.025em", textAlign: "center" }}>
            <div style={{ color: COLORS.text }}>{DIVIDE.finalLine1}</div>
            <div style={{ color: COLORS.cyan, textShadow: "0 0 40px rgba(98,230,255,0.35)" }}>{DIVIDE.finalLine2}</div>
          </div>
        </AbsoluteFill>
      )}
    </AbsoluteFill>
  );
};
