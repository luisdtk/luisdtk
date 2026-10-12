import React, { useMemo } from "react";
import { AbsoluteFill, Easing, interpolate, random, useCurrentFrame } from "remotion";
import { COLORS, FONTS, SCENES, TRANSFORMATION } from "../config";
import { EnergySymbol } from "../components/EnergySymbol";
import { Segment, TypeText } from "../components/TypeText";
import { CodeBlock, glass, Pointer, ProgressBar, ThinkingDots } from "../components/UI";
import { IN, motionBlur, OUT, OVERSHOOT, pulse, ramp, SMOOTH } from "../lib/anim";

const T = TRANSFORMATION.t;
const WIN = { x: 330, y: 150, w: 1440, h: 780 };

// ---------------------------------------------------------------------
//  Camera keyframes (screen space, origin = frame center)
// ---------------------------------------------------------------------
const cam = (f: number, out: number[]) =>
  interpolate(f, [264, 296, 300, 326, 348, 404, 420, 488, 512, 556, 600, 612, 640], out, {
    easing: SMOOTH,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
const camS = (f: number) => cam(f, [1.14, 1, 1, 1.12, 1.12, 1.0, 1.0, 1.03, 1.3, 1.3, 1.3, 1.3, 0.55]);
const camX = (f: number) => cam(f, [0, 0, 0, 100, 100, 40, 40, 0, -520, -520, -520, -520, 0]);
const camY = (f: number) => cam(f, [40, 0, 0, 30, 30, 0, 0, 0, -305, -305, -305, -305, 0]);

// Word reveal timing in the answer
const ANSWER = TRANSFORMATION.answer;
const FPC = (T.answerEnd - T.answerStart) / ANSWER.length;
const wordFrame = (w: string) => T.answerStart + ANSWER.indexOf(w) * FPC;

const answerSegments = (): Segment[] => {
  const segs: Segment[] = [];
  let rest = ANSWER;
  TRANSFORMATION.highlightWords.forEach((w) => {
    const i = rest.indexOf(w);
    segs.push({ text: rest.slice(0, i) });
    segs.push({ text: w, color: COLORS.cyan, glowHold: 8 });
    rest = rest.slice(i + w.length);
  });
  segs.push({ text: rest });
  return segs;
};

const label: React.CSSProperties = {
  fontFamily: FONTS.mono,
  fontSize: 15,
  letterSpacing: "0.16em",
  color: COLORS.textDim,
  textTransform: "uppercase",
};

// ---------------------------------------------------------------------
//  Visualization cells (right pane)
// ---------------------------------------------------------------------
const Cell: React.FC<{ x: number; y: number; title: string; active: number; children: React.ReactNode }> = ({ x, y, title, active, children }) => (
  <div
    style={{
      position: "absolute",
      left: x,
      top: y,
      width: 390,
      height: 190,
      borderRadius: 16,
      border: `1px solid ${active > 0.5 ? "rgba(98,230,255,0.35)" : COLORS.panelBorder}`,
      background: `rgba(98,230,255,${0.02 + 0.04 * active})`,
      boxShadow: active > 0 ? `0 0 ${30 * active}px rgba(98,230,255,${0.12 * active})` : undefined,
      overflow: "hidden",
    }}
  >
    <div style={{ ...label, position: "absolute", left: 18, top: 14, color: active > 0.5 ? COLORS.cyan : COLORS.textDim }}>{title}</div>
    {children}
  </div>
);

const WorkCell: React.FC<{ a: number; frame: number }> = ({ a, frame }) => (
  <svg width={390} height={190} style={{ position: "absolute" }}>
    {[0, 1, 2, 3].map((i) => {
      const lit = ramp(a, i * 0.2, i * 0.2 + 0.3, 0, 1, (t) => t);
      const x = 30 + i * 90;
      return (
        <g key={i}>
          {i < 3 && <line x1={x + 60} y1={110} x2={x + 90} y2={110} stroke={lit > 0.5 ? COLORS.cyan : COLORS.textDim} strokeWidth={2} opacity={0.4 + 0.6 * lit} />}
          {i < 3 && lit > 0.9 && <circle cx={x + 60 + ((frame * 1.5) % 30)} cy={110} r={3} fill={COLORS.white} />}
          <rect x={x} y={84} width={60} height={52} rx={10} fill={lit > 0.5 ? "rgba(98,230,255,0.16)" : "rgba(146,152,165,0.08)"} stroke={lit > 0.5 ? COLORS.cyan : COLORS.panelBorder} strokeWidth={1.5} />
          <rect x={x + 12} y={102} width={36 * lit} height={5} rx={2} fill={COLORS.cyan} />
          <rect x={x + 12} y={114} width={24} height={5} rx={2} fill={COLORS.textDim} opacity={0.5} />
        </g>
      );
    })}
  </svg>
);

const CreateCell: React.FC<{ a: number; frame: number }> = ({ a, frame }) => {
  const r = frame * 0.8;
  return (
    <svg width={390} height={190} style={{ position: "absolute" }}>
      <g transform={`translate(${120 - 30 * a} 110) rotate(${r})`} opacity={0.3 + 0.7 * a}>
        <rect x={-34} y={-34} width={68} height={68} rx={6} fill="none" stroke={COLORS.cyan} strokeWidth={2} />
      </g>
      <circle cx={195} cy={110} r={22 + 22 * a} fill={`rgba(166,139,255,${0.15 + 0.35 * a})`} stroke={COLORS.violet} strokeWidth={1.5} />
      <g transform={`translate(${270 + 30 * a} 110) rotate(${-r * 0.6})`} opacity={0.3 + 0.7 * a}>
        <path d="M0,-38 L33,19 L-33,19 Z" fill={`rgba(98,230,255,${0.25 * a})`} stroke={COLORS.cyan} strokeWidth={2} />
      </g>
    </svg>
  );
};

const LEARN_NODES = [
  [60, 80], [130, 140], [200, 70], [250, 150], [320, 90], [90, 160], [340, 160], [180, 120],
];
const LEARN_EDGES = [[0, 7], [1, 7], [2, 7], [3, 7], [4, 3], [5, 1], [6, 3], [2, 4], [0, 5]];
const LearnCell: React.FC<{ a: number }> = ({ a }) => (
  <svg width={390} height={190} style={{ position: "absolute" }}>
    {LEARN_EDGES.map(([p, q], i) => {
      const t = ramp(a, i * 0.08, i * 0.08 + 0.3, 0, 1, (x) => x);
      const [x1, y1] = LEARN_NODES[p];
      const [x2, y2] = LEARN_NODES[q];
      return <line key={i} x1={x1} y1={y1} x2={x1 + (x2 - x1) * t} y2={y1 + (y2 - y1) * t} stroke={COLORS.cyan} strokeWidth={1.5} opacity={0.75 * t} />;
    })}
    {LEARN_NODES.map(([x, y], i) => (
      <circle key={i} cx={x} cy={y} r={i === 7 ? 9 : 6} fill={a > 0.2 + i * 0.05 ? COLORS.cyan : COLORS.textDim} opacity={0.5 + 0.5 * a} />
    ))}
  </svg>
);

const BuildCell: React.FC<{ a: number }> = ({ a }) => {
  const s = (i: number) => ramp(a, i * 0.15, i * 0.15 + 0.4, 0, 1, OUT);
  return (
    <div style={{ position: "absolute", left: 30, top: 50, width: 330, height: 120 }}>
      <div style={{ position: "absolute", left: 0, top: 0, width: 330, height: 18, borderRadius: 6, background: "rgba(146,152,165,0.18)", opacity: s(0), transform: `translateY(${(1 - s(0)) * -14}px)` }} />
      <div style={{ position: "absolute", left: 0, top: 28, width: 70, height: 92, borderRadius: 8, background: "rgba(146,152,165,0.12)", opacity: s(1), transform: `translateX(${(1 - s(1)) * -20}px)` }} />
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            left: 82 + i * 84,
            top: 28,
            width: 74,
            height: 54,
            borderRadius: 8,
            background: i === 0 ? "rgba(98,230,255,0.25)" : "rgba(146,152,165,0.14)",
            border: i === 0 ? `1px solid ${COLORS.cyan}` : undefined,
            opacity: s(2 + i * 0.5),
            transform: `scale(${0.7 + 0.3 * s(2 + i * 0.5)})`,
          }}
        />
      ))}
      <div style={{ position: "absolute", left: 82, top: 92, width: 240 * s(4), height: 10, borderRadius: 5, background: COLORS.cyan, opacity: 0.8 }} />
    </div>
  );
};

// ---------------------------------------------------------------------
//  Product preview assembled from particles
// ---------------------------------------------------------------------
const ProductPreview: React.FC<{ frame: number }> = ({ frame }) => {
  const s = (i: number) => ramp(frame, T.dissolve + 6 + i * 3, T.dissolve + 18 + i * 3, 0, 1, OVERSHOOT);
  const days = ["M", "T", "W", "T", "F", "S", "S"];
  return (
    <div style={{ position: "absolute", left: 640, top: 86, width: 760, height: 380, borderRadius: 18, ...glass(true), overflow: "hidden", opacity: ramp(frame, T.dissolve + 4, T.dissolve + 12) }}>
      <div style={{ position: "absolute", left: 28, top: 24, display: "flex", alignItems: "center", gap: 14, opacity: s(0), transform: `translateY(${(1 - s(0)) * 20}px)` }}>
        <EnergySymbol size={30} rotation={frame} glow={0.6} />
        <span style={{ fontFamily: FONTS.sans, fontWeight: 600, fontSize: 30, color: COLORS.text }}>{TRANSFORMATION.productTitle}</span>
      </div>
      <div style={{ position: "absolute", right: 28, top: 28, padding: "8px 18px", borderRadius: 20, background: COLORS.cyan, color: COLORS.bg, fontFamily: FONTS.sans, fontWeight: 600, fontSize: 18, opacity: s(1), transform: `scale(${s(1)})` }}>
        + New task
      </div>
      {days.map((d, i) => {
        const v = s(2 + i * 0.5);
        const h1 = 40 + ((i * 37) % 70);
        const h2 = 30 + ((i * 53) % 60);
        return (
          <div key={i} style={{ position: "absolute", left: 28 + i * 102, top: 96, width: 90, opacity: v, transform: `translateY(${(1 - v) * 30}px)` }}>
            <div style={{ fontFamily: FONTS.mono, fontSize: 16, color: COLORS.textDim, marginBottom: 10 }}>{d}</div>
            <div style={{ height: h1, borderRadius: 8, background: i % 3 === 0 ? "rgba(166,139,255,0.35)" : "rgba(98,230,255,0.28)", marginBottom: 8 }} />
            <div style={{ height: h2, borderRadius: 8, background: "rgba(146,152,165,0.18)" }} />
          </div>
        );
      })}
      <div style={{ position: "absolute", left: 28, bottom: 26, opacity: s(6) }}>
        <ProgressBar value={ramp(frame, T.productDone - 8, T.productDone + 30, 0.1, 0.72)} width={704} />
      </div>
    </div>
  );
};

const Particles: React.FC<{ frame: number }> = ({ frame }) => {
  const parts = useMemo(
    () =>
      new Array(70).fill(0).map((_, i) => ({
        sx: 40 + random(`cpx${i}`) * 600,
        sy: 120 + random(`cpy${i}`) * 340,
        ex: 660 + random(`cex${i}`) * 720,
        ey: 100 + random(`cey${i}`) * 350,
        d: random(`cd${i}`) * 8,
        r: 1.5 + random(`cr${i}`) * 2.5,
      })),
    [],
  );
  if (frame < T.dissolve || frame > T.dissolve + 30) return null;
  return (
    <svg width={WIN.w} height={WIN.h} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
      {parts.map((p, i) => {
        const t = ramp(frame, T.dissolve + p.d, T.dissolve + p.d + 16, 0, 1, Easing.inOut(Easing.cubic));
        const x = p.sx + (p.ex - p.sx) * t;
        const y = p.sy + (p.ey - p.sy) * t - Math.sin(t * Math.PI) * 80;
        const o = Math.sin(Math.min(1, t * 1.1) * Math.PI);
        return <circle key={i} cx={x} cy={y} r={p.r} fill={i % 4 === 0 ? COLORS.white : COLORS.cyan} opacity={o} style={{ filter: `drop-shadow(0 0 4px ${COLORS.cyan})` }} />;
      })}
    </svg>
  );
};

// ---------------------------------------------------------------------
//  Timeline (acceleration)
// ---------------------------------------------------------------------
const TRACK_X = 800;
const TRACK_W = 590;
const Timeline: React.FC<{ frame: number; opacity: number }> = ({ frame, opacity }) => {
  const a = ramp(frame, T.dragA[0], T.dragA[1], 0, 1, SMOOTH);
  const b = ramp(frame, T.dragB[0], T.dragB[1], 0, 1, SMOOTH);
  // Design dragged earlier (A). Launch follows automatically, then is dragged (B).
  const follow = ramp(frame, T.dragA[0] + 4, T.dragA[1] + 6, 0, 1, OVERSHOOT);
  const bars = [
    [0.02, 0.3],
    [0.52 - 0.2 * a, 0.8 - 0.2 * a],
    [0.82 - 0.2 * follow - 0.12 * b, 0.99 - 0.2 * follow - 0.12 * b],
  ];
  const ys = [548, 600, 652];
  const px = (v: number) => TRACK_X + v * TRACK_W;
  const ptr = (() => {
    const gA = [px(0.66), ys[1] + 16];
    const gA2 = [px(0.46), ys[1] + 16];
    const gB = [px(0.65), ys[2] + 16];
    const gB2 = [px(0.53), ys[2] + 16];
    if (frame < T.dragA[0]) {
      const t = ramp(frame, T.dragA[0] - 12, T.dragA[0], 0, 1, OUT);
      return [gA[0] + 120 * (1 - t), gA[1] + 90 * (1 - t)];
    }
    if (frame <= T.dragA[1]) return [gA[0] + (gA2[0] - gA[0]) * a, gA[1]];
    if (frame < T.dragB[0]) {
      const t = ramp(frame, T.dragA[1] + 2, T.dragB[0], 0, 1, SMOOTH);
      return [gA2[0] + (gB[0] - gA2[0]) * t, gA2[1] + (gB[1] - gA2[1]) * t];
    }
    return [gB[0] + (gB2[0] - gB[0]) * b, gB[1]];
  })();
  const dragging = (frame >= T.dragA[0] && frame <= T.dragA[1]) || (frame >= T.dragB[0] && frame <= T.dragB[1]);
  const progStart = T.dragA[0];
  return (
    <div style={{ position: "absolute", left: 0, top: 0, width: WIN.w, height: WIN.h, opacity }}>
      <div style={{ ...label, position: "absolute", left: 640, top: 500 }}>Timeline</div>
      {/* week grid */}
      {new Array(7).fill(0).map((_, i) => (
        <div key={i} style={{ position: "absolute", left: px(i / 6), top: 530, width: 1, height: 160, background: "rgba(146,152,165,0.12)" }} />
      ))}
      {TRANSFORMATION.timelineTracks.map((t, i) => (
        <div key={t} style={{ position: "absolute", left: 640, top: ys[i] + 4, fontFamily: FONTS.sans, fontSize: 20, color: COLORS.text, opacity: 0.85 }}>
          {t}
        </div>
      ))}
      <svg width={WIN.w} height={WIN.h} style={{ position: "absolute", left: 0, top: 0 }}>
        {[0, 1].map((i) => (
          <path
            key={i}
            d={`M${px(bars[i][1])},${ys[i] + 16} C${px(bars[i][1]) + 30},${ys[i] + 16} ${px(bars[i + 1][0]) - 30},${ys[i + 1] + 16} ${px(bars[i + 1][0])},${ys[i + 1] + 16}`}
            stroke={COLORS.cyan}
            strokeWidth={1.5}
            fill="none"
            opacity={0.7}
            strokeDasharray="4 5"
          />
        ))}
      </svg>
      {bars.map(([s, e], i) => {
        const active = (i === 1 && frame >= T.dragA[0] && frame <= T.dragA[1]) || (i === 2 && frame >= T.dragB[0] && frame <= T.dragB[1]);
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: px(s),
              top: ys[i],
              width: (e - s) * TRACK_W,
              height: 32,
              borderRadius: 8,
              background: i === 1 ? "rgba(166,139,255,0.35)" : "rgba(98,230,255,0.25)",
              border: `1.5px solid ${i === 1 ? COLORS.violet : COLORS.cyan}`,
              boxShadow: active ? `0 0 24px ${COLORS.cyan}` : undefined,
            }}
          />
        );
      })}
      {/* progress indicators accelerate */}
      {TRANSFORMATION.progressLabels.map((l, i) => {
        const v = ramp(frame, progStart + i * 4, 556 - i * 2, 0.08 + i * 0.05, 1, Easing.in(Easing.exp));
        return (
          <div key={l} style={{ position: "absolute", left: 640 + i * 262, top: 708, width: 240 }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontFamily: FONTS.mono, fontSize: 16, color: COLORS.textDim, marginBottom: 8, fontVariantLigatures: "none" }}>
              <span>{l}</span>
              <span style={{ color: v > 0.99 ? COLORS.cyan : COLORS.text }}>{Math.round(v * 100)}%</span>
            </div>
            <ProgressBar value={v} width={240} />
          </div>
        );
      })}
      {frame >= T.dragA[0] - 12 && frame <= T.dragB[1] + 8 && <Pointer x={ptr[0]} y={ptr[1]} press={dragging ? 0.2 : 0} />}
    </div>
  );
};

// ---------------------------------------------------------------------
//  Scene
// ---------------------------------------------------------------------
export const Transformation: React.FC = () => {
  const frame = useCurrentFrame();
  if (frame < SCENES.transformation.from || frame > SCENES.transformation.to) return null;

  const winIn = ramp(frame, T.windowIn, T.windowIn + 22, 0, 1, OUT);
  const winOut = ramp(frame, T.zoomOut, T.zoomOut + 24, 0, 1, IN);
  const s = camS(frame);
  const blur = motionBlur((f) => camS(f) * 900 + camX(f) + camY(f), frame, 0.12, 8);

  const userIn = ramp(frame, T.userMsg, T.userMsg + 12, 0, 1, OVERSHOOT);
  const thinking = ramp(frame, T.thinkingIn, T.thinkingIn + 8) * ramp(frame, T.answerStart - 4, T.answerStart, 1, 0);
  const acts = TRANSFORMATION.highlightWords.map((w) => ramp(frame, wordFrame(w), wordFrame(w) + 16, 0, 1, OUT));
  const visActive = ramp(frame, T.thinkingIn, T.thinkingIn + 20);
  const gridOut = ramp(frame, T.dissolve - 4, T.dissolve + 8, 0, 1, IN);
  const codeIn = ramp(frame, T.codeIn, T.codeIn + 14, 0, 1, OUT);
  const codeOut = ramp(frame, T.dissolve, T.dissolve + 12, 0, 1, IN);
  const chatDim = 1 - 0.7 * ramp(frame, T.codeIn, T.codeIn + 10);
  const connect = ramp(frame, T.connect, T.connect + 10, 0, 1, OUT);
  const timelineIn = ramp(frame, 470, 488) * ramp(frame, T.instructionsIn - 8, T.instructionsIn + 2, 1, 0);
  const instrIn = frame >= T.instructionsIn - 4;
  const panePulse = pulse(frame, T.rewrittenGlow, 10);

  // Labels WORK / CREATE / LEARN / BUILD — anchored to the screen.
  const labelsOut = ramp(frame, T.labelsOut, T.labelsOut + 10, 0, 1, IN);

  // Statement
  const stIn = ramp(frame, T.statementIn, T.statementIn + 18, 0, 1, OUT);
  const stOut = ramp(frame, T.statementOut, T.statementOut + 14, 0, 1, IN);
  const stY = (f: number) => (1 - ramp(f, T.statementIn, T.statementIn + 18, 0, 1, OUT)) * 40 - 80 * ramp(f, T.statementOut, T.statementOut + 14, 0, 1, IN);
  const glow = pulse(frame, T.rewrittenGlow + 4, 10);

  return (
    <AbsoluteFill>
      {/* ---------------- Application window (camera) ---------------- */}
      {frame < T.zoomOut + 26 && (
        <AbsoluteFill
          style={{
            transform: `translate(${camX(frame)}px, ${camY(frame)}px) scale(${s})`,
            opacity: winIn * (1 - winOut),
            filter: blur > 0 ? `blur(${blur}px)` : undefined,
          }}
        >
          <div style={{ position: "absolute", left: WIN.x, top: WIN.y, width: WIN.w, height: WIN.h, ...glass(true), overflow: "hidden" }}>
            {/* title bar */}
            <div style={{ height: 56, display: "flex", alignItems: "center", padding: "0 22px", gap: 10, borderBottom: `1px solid ${COLORS.panelBorder}` }}>
              {["#3A3F4B", "#3A3F4B", "#3A3F4B"].map((c, i) => (
                <div key={i} style={{ width: 13, height: 13, borderRadius: 7, background: c }} />
              ))}
              <div style={{ ...label, marginLeft: 24, letterSpacing: "0.08em", textTransform: "none", fontSize: 17 }}>{TRANSFORMATION.windowTitle}</div>
              <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 9, height: 9, borderRadius: 5, background: COLORS.cyan, boxShadow: `0 0 10px ${COLORS.cyan}`, opacity: 0.5 + 0.5 * Math.sin(frame / 6) }} />
                <span style={{ ...label, fontSize: 14 }}>live</span>
              </div>
            </div>
            <div style={{ position: "absolute", left: 600, top: 56, width: 1, bottom: 0, background: COLORS.panelBorder }} />

            {/* chat pane */}
            <div style={{ position: "absolute", left: 0, top: 56, width: 600, bottom: 0, padding: "34px 40px", opacity: chatDim }}>
              <div style={{ display: "flex", justifyContent: "flex-end", opacity: userIn, transform: `translateY(${(1 - userIn) * 24}px) scale(${0.92 + 0.08 * userIn})`, transformOrigin: "right center" }}>
                <div style={{ background: "rgba(98,230,255,0.12)", border: "1px solid rgba(98,230,255,0.3)", borderRadius: "20px 20px 6px 20px", padding: "16px 22px", fontFamily: FONTS.sans, fontSize: 26, color: COLORS.text }}>
                  {TRANSFORMATION.userQuestion}
                </div>
              </div>
              <div style={{ marginTop: 40, display: "flex", alignItems: "center", gap: 14, opacity: ramp(frame, T.thinkingIn, T.thinkingIn + 8) }}>
                <EnergySymbol size={34} rotation={frame * 3} glow={0.8} />
                <span style={{ ...label, fontSize: 16, color: COLORS.cyan }}>assistant</span>
                <span style={{ opacity: thinking, display: "flex", alignItems: "center", gap: 10, fontFamily: FONTS.sans, fontSize: 18, color: COLORS.textDim }}>
                  {TRANSFORMATION.thinking} <ThinkingDots size={6} />
                </span>
              </div>
              <div style={{ marginTop: 22, fontFamily: FONTS.serif, fontSize: 34, lineHeight: 1.4, color: COLORS.text, width: 510 }}>
                {frame >= T.answerStart && <TypeText segments={answerSegments()} start={T.answerStart} framesPerChar={FPC} cursor settle={10} />}
              </div>
            </div>

            {/* visualization pane: top grid */}
            <div style={{ position: "absolute", left: 0, top: 0, width: WIN.w, height: WIN.h, opacity: (0.4 + 0.6 * visActive) * (1 - gridOut) }}>
              <Cell x={630} y={86} title={TRANSFORMATION.visTitles[0]} active={acts[0]}>
                <WorkCell a={acts[0]} frame={frame} />
              </Cell>
              <Cell x={1030} y={86} title={TRANSFORMATION.visTitles[1]} active={acts[1]}>
                <CreateCell a={acts[1]} frame={frame} />
              </Cell>
              <Cell x={630} y={290} title={TRANSFORMATION.visTitles[2]} active={acts[2]}>
                <LearnCell a={acts[2]} />
              </Cell>
              <Cell x={1030} y={290} title={TRANSFORMATION.visTitles[3]} active={acts[3]}>
                <BuildCell a={acts[3]} />
              </Cell>
            </div>
            {frame >= T.dissolve && <ProductPreview frame={frame} />}

            {/* lower region: idle signal before the timeline arrives */}
            <div style={{ position: "absolute", left: 640, top: 520, width: 760, opacity: ramp(frame, T.thinkingIn, T.thinkingIn + 20) * (1 - ramp(frame, 462, 474)) }}>
              <div style={{ ...label, marginBottom: 18 }}>Signals</div>
              <svg width={760} height={180}>
                {new Array(48).fill(0).map((_, i) => {
                  const h = 20 + 70 * Math.abs(Math.sin(i * 0.7 + frame / 7)) * (0.3 + 0.7 * visActive) * (0.5 + 0.5 * acts.reduce((a, b) => a + b, 0) / 4);
                  return <rect key={i} x={i * 15.8} y={90 - h / 2} width={6} height={h} rx={3} fill={COLORS.cyan} opacity={0.25 + 0.5 * (i / 48)} />;
                })}
              </svg>
            </div>
            {frame >= 466 && frame < T.instructionsIn + 4 && <Timeline frame={frame} opacity={timelineIn} />}

            {/* instructions */}
            {instrIn && (
              <div style={{ position: "absolute", left: 650, top: 500, fontFamily: FONTS.mono, fontSize: 30, lineHeight: "46px", fontVariantLigatures: "none" }}>
                {TRANSFORMATION.instructions.map((ins, i) => {
                  const st = T.instructionsIn + i * 8;
                  const v = ramp(frame, st, st + 8, 0, 1, OUT);
                  const hl = ramp(frame, st, st + 6) * ramp(frame, st + 10, st + 22, 1, 0);
                  return (
                    <div key={ins} style={{ display: "flex", alignItems: "center", gap: 18, opacity: v, transform: `translateX(${(1 - v) * 30}px)` }}>
                      <span style={{ color: "rgba(146,152,165,0.5)", width: 30 }}>{i + 1}</span>
                      <span style={{ position: "relative", padding: "0 8px" }}>
                        <span style={{ position: "absolute", inset: 0, background: COLORS.cyan, opacity: 0.22 * hl, borderRadius: 4 }} />
                        <TypeText segments={[{ text: ins, color: i % 2 === 0 ? COLORS.cyan : COLORS.text }]} start={st} framesPerChar={0.5} settle={10} />
                      </span>
                    </div>
                  );
                })}
              </div>
            )}

            {/* floating code panel */}
            {frame >= T.codeIn && frame < T.dissolve + 14 && (
              <div
                style={{
                  position: "absolute",
                  left: 26,
                  top: 150,
                  width: 556,
                  height: 300,
                  ...glass(true),
                  background: "rgba(10,13,19,0.96)",
                  padding: "22px 26px",
                  opacity: codeIn * (1 - codeOut),
                  transform: `translateY(${(1 - codeIn) * 40}px) scale(${1 + 0.04 * codeOut})`,
                  filter: codeOut > 0 ? `blur(${codeOut * 8}px)` : undefined,
                }}
              >
                <div style={{ ...label, fontSize: 14, marginBottom: 16, color: COLORS.cyan }}>instructions.ts</div>
                <CodeBlock lines={TRANSFORMATION.code.map((c) => c.t)} start={T.codeTypeStart} framesPerChar={0.22} fontSize={21} lineHeight={1.65} />
              </div>
            )}
            {frame >= T.connect && frame < T.dissolve + 20 && (
              <svg width={WIN.w} height={WIN.h} style={{ position: "absolute", left: 0, top: 0 }}>
                <path
                  d="M584,300 C700,300 700,250 900,250"
                  stroke={COLORS.cyan}
                  strokeWidth={3}
                  fill="none"
                  pathLength={1}
                  strokeDasharray="1 1"
                  strokeDashoffset={1 - connect}
                  opacity={1 - ramp(frame, T.dissolve + 10, T.dissolve + 20)}
                  style={{ filter: `drop-shadow(0 0 8px ${COLORS.cyan})` }}
                />
              </svg>
            )}
            <Particles frame={frame} />
            <AbsoluteFill style={{ background: COLORS.cyan, opacity: 0.06 * panePulse }} />
          </div>
        </AbsoluteFill>
      )}

      {/* ---------------- Screen-anchored labels ---------------- */}
      {frame >= T.labelsIn[0] && frame < T.labelsOut + 11 && (
        <div style={{ position: "absolute", left: 72, top: 360, opacity: 1 - labelsOut, transform: `translateX(${-40 * labelsOut}px)` }}>
          {TRANSFORMATION.labels.map((l, i) => {
            const v = ramp(frame, T.labelsIn[i], T.labelsIn[i] + 14, 0, 1, OVERSHOOT);
            const lit = ramp(frame, T.labelsIn[i] + 4, T.labelsIn[i] + 10);
            return (
              <div key={l} style={{ display: "flex", alignItems: "center", gap: 18, height: 74, opacity: Math.min(1, v * 1.4), transform: `translateX(${(1 - v) * -60}px)` }}>
                <div style={{ width: 12, height: 12, borderRadius: 3, transform: "rotate(45deg)", background: lit > 0.5 ? COLORS.cyan : "transparent", border: `1.5px solid ${COLORS.cyan}`, boxShadow: lit > 0.5 ? `0 0 14px ${COLORS.cyan}` : undefined }} />
                <span style={{ fontFamily: FONTS.sans, fontWeight: 700, fontSize: 32, letterSpacing: "0.2em", color: COLORS.text }}>{l}</span>
              </div>
            );
          })}
        </div>
      )}

      {/* ---------------- The rules are being rewritten. ---------------- */}
      {frame >= T.statementIn && (
        <AbsoluteFill
          style={{
            alignItems: "center",
            justifyContent: "center",
            opacity: stIn * (1 - stOut),
            transform: `translateY(${stY(frame)}px)`,
            filter: motionBlur(stY, frame, 0.4, 8) > 0 ? `blur(${motionBlur(stY, frame, 0.4, 8)}px)` : undefined,
          }}
        >
          <div style={{ fontFamily: FONTS.serif, fontSize: 108, fontWeight: 500, letterSpacing: "-0.02em", color: COLORS.text, whiteSpace: "nowrap", textShadow: "0 4px 40px rgba(9,11,16,0.9)" }}>
            {TRANSFORMATION.statement}{" "}
            <span
              style={{
                color: COLORS.cyan,
                fontStyle: "italic",
                textShadow: `0 0 ${12 + 40 * glow}px rgba(98,230,255,${0.3 + 0.55 * glow})`,
              }}
            >
              {TRANSFORMATION.statementKey}
            </span>
          </div>
        </AbsoluteFill>
      )}
    </AbsoluteFill>
  );
};
