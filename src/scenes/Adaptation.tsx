import React from "react";
import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from "remotion";
import { ADAPTATION, COLORS, FONTS, SCENES } from "../config";
import { EnergySymbol } from "../components/EnergySymbol";
import { DirectionalBlur } from "../components/DirectionalBlur";
import { TypeText } from "../components/TypeText";
import { Check, CodeBlock, glass, Pointer, ProgressBar, ThinkingDots } from "../components/UI";
import { IN, mixColor, OUT, OVERSHOOT, pulse, ramp, SMOOTH } from "../lib/anim";

const T = ADAPTATION.t;
const DEEP_CYAN = "#0A8FB0";

// ---------------------------------------------------------------------
//  Camera: one tall page, scrolled with eased moves.
// ---------------------------------------------------------------------
const scrollAt = (f: number) =>
  interpolate(
    f,
    [T.scroll2[0], T.scroll2[1], T.scroll3[0], T.scroll3[1], T.scroll4[0], T.scroll4[1]],
    [0, 1080, 1080, 2160, 2160, 3240],
    { easing: SMOOTH, extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );
const zoomAt = (f: number) =>
  interpolate(f, [T.scroll4[0], T.scroll4[1], T.challengeIn, T.toDark[1]], [0.96, 1, 1, 0.93], {
    easing: SMOOTH,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

const ink = COLORS.ink;
const soft = COLORS.inkSoft;

const StepHeader: React.FC<{ frame: number; start: number; n: string; title: string; width?: number }> = ({ frame, start, n, title, width = 760 }) => {
  const v = ramp(frame, start, start + 14, 0, 1, OUT);
  const line = ramp(frame, start + 4, start + 22, 0, 1, SMOOTH);
  return (
    <div style={{ width }}>
      <div style={{ display: "flex", alignItems: "center", gap: 18, opacity: v, transform: `translateY(${(1 - v) * 20}px)` }}>
        <span style={{ fontFamily: FONTS.mono, fontSize: 22, color: DEEP_CYAN, fontWeight: 600, padding: "6px 12px", border: `1.5px solid ${COLORS.cyan}`, borderRadius: 8 }}>{n}</span>
        <div style={{ height: 1.5, width: 120 * line, background: COLORS.cyan }} />
      </div>
      <div
        style={{
          fontFamily: FONTS.serif,
          fontSize: 62,
          fontWeight: 600,
          letterSpacing: "-0.02em",
          color: ink,
          marginTop: 22,
          lineHeight: 1.1,
          opacity: ramp(frame, start + 3, start + 16, 0, 1, OUT),
          transform: `translateY(${(1 - ramp(frame, start + 3, start + 16, 0, 1, OUT)) * 26}px)`,
        }}
      >
        {n} — {title}
      </div>
      <div style={{ height: 1, background: COLORS.divider, marginTop: 26, width: `${line * 100}%` }} />
    </div>
  );
};

const Body: React.FC<{ frame: number; start: number; children: React.ReactNode; width?: number }> = ({ frame, start, children, width = 700 }) => {
  const v = ramp(frame, start, start + 14, 0, 1, OUT);
  return (
    <div style={{ fontFamily: FONTS.sans, fontSize: 30, lineHeight: 1.5, color: soft, width, marginTop: 26, opacity: v, transform: `translateY(${(1 - v) * 18}px)` }}>{children}</div>
  );
};

// ---------------------------------------------------------------------
//  Section A — reset + step 01
// ---------------------------------------------------------------------
const ToolIcon: React.FC<{ i: number; color: string }> = ({ i, color }) => (
  <svg width={56} height={56} viewBox="0 0 56 56">
    {i === 0 && (
      <g fill="none" stroke={color} strokeWidth={3} strokeLinecap="round">
        <path d="M12 18 H44 M12 28 H38 M12 38 H30" />
      </g>
    )}
    {i === 1 && (
      <g fill="none" stroke={color} strokeWidth={3}>
        <circle cx={25} cy={25} r={12} />
        <path d="M34 34 L44 44" strokeLinecap="round" />
      </g>
    )}
    {i === 2 && (
      <g fill="none" stroke={color} strokeWidth={3} strokeLinejoin="round">
        <rect x={10} y={12} width={36} height={34} rx={6} />
        <path d="M10 22 H46 M20 8 V16 M36 8 V16" strokeLinecap="round" />
      </g>
    )}
  </svg>
);

const SectionA: React.FC<{ frame: number }> = ({ frame }) => {
  const promptIn = ramp(frame, T.promptIn, T.promptIn + 14, 0, 1, OUT);
  const pick = 2;
  const press = ramp(frame, T.toolPick + 10, T.toolPick + 16, 0, 1, OUT);
  const chosen = frame >= T.toolPick + 11;
  const px = interpolate(frame, [T.toolPick - 4, T.toolPick + 10], [1640, 1540], { easing: OUT, extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const py = interpolate(frame, [T.toolPick - 4, T.toolPick + 10], [1000, 700], { easing: OUT, extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <div style={{ position: "absolute", left: 0, top: 0, width: 1920, height: 1080 }}>
      {/* Title */}
      <div style={{ position: "absolute", left: 0, top: 118, width: 1920, textAlign: "center", fontFamily: FONTS.serif, fontSize: 100, fontWeight: 600, letterSpacing: "-0.025em" }}>
        <TypeText segments={[{ text: ADAPTATION.title }]} start={T.titleIn} framesPerChar={0.75} color={ink} glow={COLORS.cyan} settle={16} />
      </div>
      {/* Prompt field */}
      <div
        style={{
          position: "absolute",
          left: 460,
          top: 285,
          width: 1000,
          height: 86,
          borderRadius: 43,
          ...glass(false),
          display: "flex",
          alignItems: "center",
          padding: "0 14px 0 36px",
          opacity: promptIn,
          transform: `translateY(${(1 - promptIn) * 24}px)`,
        }}
      >
        <EnergySymbol size={26} rotation={frame * 2} glow={0} color={COLORS.cyan} core={DEEP_CYAN} />
        <span style={{ fontFamily: FONTS.sans, fontSize: 28, color: "#A2A6AE", marginLeft: 18 }}>{ADAPTATION.promptPlaceholder}</span>
        <span style={{ width: 2.5, height: 32, background: COLORS.cyan, marginLeft: 6, opacity: Math.floor(frame / 9) % 2 ? 0 : 1 }} />
        <div style={{ marginLeft: "auto", width: 58, height: 58, borderRadius: 29, background: ink, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <svg width={24} height={24} viewBox="0 0 24 24">
            <path d="M12 19 V5 M5 12 L12 5 L19 12" stroke={COLORS.white} strokeWidth={2.5} fill="none" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      </div>
      {/* Step 01 */}
      <div style={{ position: "absolute", left: 200, top: 500 }}>
        <StepHeader frame={frame} start={T.step1In} n={ADAPTATION.steps[0].n} title={ADAPTATION.steps[0].title} width={720} />
        <Body frame={frame} start={T.step1In + 10} width={700}>
          {ADAPTATION.steps[0].body}
        </Body>
      </div>
      {/* Tool picker */}
      <div style={{ position: "absolute", left: 1010, top: 540, display: "flex", gap: 24 }}>
        {ADAPTATION.tools.map((t, i) => {
          const v = ramp(frame, T.step1In + 6 + i * 4, T.step1In + 20 + i * 4, 0, 1, OVERSHOOT);
          const sel = chosen && i === pick;
          return (
            <div
              key={t}
              style={{
                width: 220,
                height: 230,
                ...glass(false),
                borderRadius: 20,
                border: sel ? `2px solid ${COLORS.cyan}` : `1px solid ${COLORS.divider}`,
                boxShadow: sel ? `0 20px 60px rgba(98,230,255,0.28)` : glass(false).boxShadow,
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                padding: 26,
                opacity: Math.min(1, v),
                transform: `translateY(${(1 - v) * 40}px) scale(${sel ? 1 + 0.04 * press : 1})`,
              }}
            >
              <ToolIcon i={i} color={sel ? DEEP_CYAN : soft} />
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontFamily: FONTS.sans, fontSize: 26, fontWeight: 600, color: ink }}>{t}</span>
                {sel && <Check size={28} progress={press} />}
              </div>
            </div>
          );
        })}
      </div>
      {frame >= T.toolPick - 4 && <Pointer x={px} y={py} press={frame >= T.toolPick + 10 ? ramp(frame, T.toolPick + 10, T.toolPick + 20) : 0} dark />}
    </div>
  );
};

// ---------------------------------------------------------------------
//  Section B — step 02
// ---------------------------------------------------------------------
const SectionB: React.FC<{ frame: number }> = ({ frame }) => {
  const step = ADAPTATION.steps[1];
  const start = T.scroll2[0] - 2;
  const hl = step.highlights ?? [];
  // Split the body into plain text and highlighted words.
  const parts: { text: string; k: number }[] = [];
  let rest = step.body;
  hl.forEach((w, k) => {
    const i = rest.indexOf(w);
    parts.push({ text: rest.slice(0, i), k: -1 });
    parts.push({ text: w, k });
    rest = rest.slice(i + w.length);
  });
  parts.push({ text: rest, k: -1 });

  const card = ramp(frame, start + 6, start + 22, 0, 1, OUT);
  const r = (i: number) => ramp(frame, T.result2[0] + i * 5, T.result2[0] + i * 5 + 14, 0, 1, OVERSHOOT);
  const nodes = [
    { label: "Goal", x: 60, y: 150 },
    { label: "Steps", x: 270, y: 150 },
    { label: "First version", x: 480, y: 150 },
  ];
  return (
    <div style={{ position: "absolute", left: 0, top: 1080, width: 1920, height: 1080 }}>
      <div style={{ position: "absolute", left: 200, top: 230 }}>
        <StepHeader frame={frame} start={start} n={step.n} title={step.title} width={700} />
        <Body frame={frame} start={start + 10} width={700}>
          {parts.map((p, i) => {
            if (p.k < 0) return <span key={i}>{p.text}</span>;
            const on = ramp(frame, T.highlights[p.k], T.highlights[p.k] + 8);
            return (
              <span
                key={i}
                style={{
                  color: mixColor(on, soft, ink),
                  fontWeight: 600,
                  backgroundImage: `linear-gradient(transparent 62%, rgba(98,230,255,${0.55 * on}) 62%)`,
                  backgroundSize: `${on * 100}% 100%`,
                  backgroundRepeat: "no-repeat",
                }}
              >
                {p.text}
              </span>
            );
          })}
        </Body>
      </div>
      {/* AI interface */}
      <div style={{ position: "absolute", left: 1000, top: 170, width: 720, height: 740, ...glass(false), opacity: card, transform: `translateY(${(1 - card) * 40}px)`, overflow: "hidden" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "24px 30px", borderBottom: `1px solid ${COLORS.divider}` }}>
          <EnergySymbol size={28} rotation={frame * 2} glow={0} core={DEEP_CYAN} />
          <span style={{ fontFamily: FONTS.sans, fontSize: 22, fontWeight: 600, color: ink }}>AI assistant</span>
        </div>
        <div style={{ margin: "28px 30px 0", padding: "22px 26px", borderRadius: 16, background: "#F3F4F2", border: `1px solid ${COLORS.divider}`, fontFamily: FONTS.sans, fontSize: 27, lineHeight: 1.4, color: ink, minHeight: 112 }}>
          <TypeText
            segments={[{ text: ADAPTATION.stepTwoPrompt }]}
            start={T.prompt2Type[0]}
            framesPerChar={(T.prompt2Type[1] - T.prompt2Type[0]) / ADAPTATION.stepTwoPrompt.length}
            color={ink}
            settle={8}
            cursor
          />
        </div>
        {/* Result assembled from text, shapes and connections */}
        <div style={{ position: "absolute", left: 30, top: 300, width: 660, height: 410 }}>
          <div style={{ fontFamily: FONTS.mono, fontSize: 17, letterSpacing: "0.14em", color: DEEP_CYAN, opacity: r(0) }}>RESULT</div>
          <div style={{ fontFamily: FONTS.serif, fontSize: 40, fontWeight: 600, color: ink, marginTop: 10, opacity: r(0), transform: `translateY(${(1 - r(0)) * 16}px)` }}>Your idea, organized.</div>
          <svg width={660} height={300} style={{ position: "absolute", left: 0, top: 90 }}>
            {[0, 1].map((i) => {
              const t = ramp(frame, T.result2[0] + 14 + i * 6, T.result2[0] + 24 + i * 6);
              const x1 = nodes[i].x + 140;
              const x2 = nodes[i + 1].x;
              return <line key={i} x1={x1} y1={70} x2={x1 + (x2 - x1) * t} y2={70} stroke={COLORS.cyan} strokeWidth={3} />;
            })}
          </svg>
          {nodes.map((n, i) => {
            const v = r(1 + i);
            const shape = i === 0 ? 30 : i === 1 ? 8 : 16;
            return (
              <div
                key={n.label}
                style={{
                  position: "absolute",
                  left: n.x,
                  top: n.y,
                  width: 140,
                  height: 120,
                  borderRadius: 16,
                  background: i === 2 ? "rgba(98,230,255,0.16)" : COLORS.white,
                  border: `1.5px solid ${i === 2 ? COLORS.cyan : COLORS.divider}`,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 12,
                  opacity: Math.min(1, v),
                  transform: `scale(${0.6 + 0.4 * v})`,
                }}
              >
                <div style={{ width: 34, height: 34, borderRadius: shape, background: i === 2 ? COLORS.cyan : "#D9DBDE" }} />
                <span style={{ fontFamily: FONTS.sans, fontSize: 19, fontWeight: 600, color: ink }}>{n.label}</span>
              </div>
            );
          })}
          <div style={{ position: "absolute", left: 60, top: 310, opacity: r(4) }}>
            <ProgressBar value={ramp(frame, T.result2[0] + 20, T.result2[1] + 10, 0.1, 0.85)} width={560} track="#ECEDEB" height={8} />
          </div>
        </div>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------
//  Section C — step 03 workflow
// ---------------------------------------------------------------------
const SectionC: React.FC<{ frame: number }> = ({ frame }) => {
  const step = ADAPTATION.steps[2];
  const s = T.flow3;
  const boxes = [
    { x: 200, label: ADAPTATION.workflow[0] },
    { x: 780, label: ADAPTATION.workflow[1] },
    { x: 1360, label: ADAPTATION.workflow[2] },
  ];
  const boxIn = (i: number) => ramp(frame, s + 4 + i * 10, s + 16 + i * 10, 0, 1, OVERSHOOT);
  const arrow = (i: number) => ramp(frame, s + 10 + i * 10, s + 20 + i * 10, 0, 1, SMOOTH);
  return (
    <div style={{ position: "absolute", left: 0, top: 2160, width: 1920, height: 1080 }}>
      <div style={{ position: "absolute", left: 200, top: 150 }}>
        <StepHeader frame={frame} start={T.scroll3[0] - 2} n={step.n} title={step.title} width={1100} />
        <Body frame={frame} start={T.scroll3[0] + 6} width={1100}>
          {step.body}
        </Body>
      </div>
      {/* human inputs */}
      {ADAPTATION.humanInputs.map((h, i) => {
        const v = ramp(frame, s + 12 + i * 3, s + 24 + i * 3, 0, 1, OUT);
        const x = 790 + i * 120;
        return (
          <React.Fragment key={h}>
            <div
              style={{
                position: "absolute",
                left: x - 50,
                top: 520,
                width: 160,
                textAlign: "center",
                fontFamily: FONTS.mono,
                fontSize: 19,
                color: ink,
                padding: "8px 0",
                borderRadius: 20,
                border: `1px solid ${COLORS.divider}`,
                background: COLORS.white,
                opacity: v,
                transform: `translateY(${(1 - v) * -20}px)`,
              }}
            >
              {h}
            </div>
            <div style={{ position: "absolute", left: x + 29, top: 562, width: 1.5, height: 70 * v, background: COLORS.cyan }} />
          </React.Fragment>
        );
      })}
      <svg width={1920} height={1080} style={{ position: "absolute", left: 0, top: 0 }}>
        {[0, 1].map((i) => {
          const x1 = boxes[i].x + 360 + 10;
          const x2 = boxes[i + 1].x - 14;
          const t = arrow(i);
          const xe = x1 + (x2 - x1) * t;
          return (
            <g key={i} opacity={t > 0 ? 1 : 0}>
              <line x1={x1} y1={720} x2={xe} y2={720} stroke={ink} strokeWidth={2} />
              <path d={`M${xe - 12},${712} L${xe},720 L${xe - 12},${728}`} stroke={ink} strokeWidth={2} fill="none" />
              <circle cx={x1 + ((frame * 6) % Math.max(1, xe - x1))} cy={720} r={4} fill={COLORS.cyan} opacity={t >= 1 ? 1 : 0} />
            </g>
          );
        })}
      </svg>
      {boxes.map((b, i) => {
        const v = boxIn(i);
        const isAI = i === 1;
        const isResult = i === 2;
        return (
          <div
            key={b.label}
            style={{
              position: "absolute",
              left: b.x,
              top: 632,
              width: 360,
              height: 176,
              ...glass(false),
              borderRadius: 20,
              border: isAI ? `2px solid ${COLORS.cyan}` : `1px solid ${COLORS.divider}`,
              padding: "26px 28px",
              opacity: Math.min(1, v),
              transform: `scale(${0.75 + 0.25 * v})`,
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              {isAI ? <EnergySymbol size={30} rotation={frame * 4} glow={0} core={DEEP_CYAN} /> : <div style={{ width: 14, height: 14, borderRadius: isResult ? 4 : 7, background: isResult ? COLORS.cyan : ink }} />}
              <span style={{ fontFamily: FONTS.sans, fontSize: 26, fontWeight: 600, color: ink }}>{b.label}</span>
            </div>
            {i === 0 && <div style={{ fontFamily: FONTS.serif, fontSize: 24, fontStyle: "italic", color: soft }}>“what if…”</div>}
            {isAI && <ProgressBar value={ramp(frame, s + 16, s + 40, 0.05, 1)} width={300} track="#ECEDEB" />}
            {isResult && (
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ flex: 1, height: 50, borderRadius: 10, background: `linear-gradient(120deg, ${COLORS.cyan}, ${COLORS.violet})` }} />
                <Check size={32} progress={ramp(frame, s + 34, s + 42)} />
              </div>
            )}
          </div>
        );
      })}
      <div style={{ position: "absolute", left: 780, top: 850, width: 360, textAlign: "center", fontFamily: FONTS.sans, fontSize: 22, color: soft, opacity: ramp(frame, s + 24, s + 34) }}>
        AI amplifies your thinking.
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------
//  Section D — process, iteration, core message, challenge (camera parked)
// ---------------------------------------------------------------------
const MiniPreview: React.FC<{ frame: number; scale: number }> = ({ frame, scale }) => {
  const v2 = frame >= T.requests[0] + 6;
  const designT = ramp(frame, T.requests[0] + 4, T.requests[0] + 14, 0, 1, SMOOTH);
  const colorT = ramp(frame, T.requests[1] + 4, T.requests[1] + 14);
  const fast = ramp(frame, T.requests[2] + 4, T.requests[2] + 14);
  const accent = mixColor(colorT, COLORS.cyan, COLORS.violet);
  const speed = 1 + 3 * fast;
  // Integrated phase so speed changes stay continuous.
  const phase = frame + 3 * Math.max(0, frame - (T.requests[2] + 9));
  const prog = ((phase * 0.012) % 1 + 1) % 1;
  const wipe = ((phase * 0.008) % 1 + 1) % 1;
  return (
    <div style={{ position: "absolute", inset: 0, borderRadius: 14 * scale, overflow: "hidden", background: COLORS.bg }}>
      <div style={{ position: "absolute", inset: 0, opacity: 0.3, background: `radial-gradient(ellipse 80% 80% at 50% 115%, ${accent}, transparent 70%)` }} />
      {/* clean transition wipe */}
      <div style={{ position: "absolute", top: 0, bottom: 0, left: `${wipe * 140 - 40}%`, width: "18%", opacity: 0.16, background: `linear-gradient(90deg, transparent, ${accent}, transparent)` }} />
      <div
        style={{
          position: "absolute",
          left: interpolate(designT, [0, 1], [50, 8]) + "%",
          top: interpolate(designT, [0, 1], [26, 18]) + "%",
          transform: `translateX(${interpolate(designT, [0, 1], [-50, 0])}%)`,
          display: "flex",
          flexDirection: designT > 0.5 ? "row" : "column",
          alignItems: "center",
          gap: 18 * scale,
        }}
      >
        <EnergySymbol size={70 * scale} rotation={phase * 2.2} glow={0.9} color={accent} />
        <span style={{ fontFamily: FONTS.serif, fontWeight: 600, fontSize: 44 * scale, color: COLORS.text, whiteSpace: "nowrap" }}>
          {v2 ? ADAPTATION.previewTitles[1] : ADAPTATION.previewTitles[0]}
        </span>
      </div>
      <div style={{ position: "absolute", left: "8%", right: "8%", bottom: "16%" }}>
        <div style={{ height: 8 * scale, borderRadius: 8, background: "rgba(146,152,165,0.25)", overflow: "hidden" }}>
          <div style={{ width: `${prog * 100}%`, height: "100%", background: accent, boxShadow: `0 0 12px ${accent}` }} />
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 10 * scale, fontFamily: FONTS.mono, fontSize: 15 * scale, color: COLORS.textDim, fontVariantLigatures: "none" }}>
          <span>speed ×{speed.toFixed(1)}</span>
          <span>{Math.round(prog * 100)}%</span>
        </div>
      </div>
    </div>
  );
};

const SectionD: React.FC<{ frame: number }> = ({ frame }) => {
  const panelIn = ramp(frame, T.scroll4[0] + 6, T.scroll4[1], 0, 1, OUT);
  const building = frame < T.done;
  const toPreview = ramp(frame, T.preview - 4, T.preview + 14, 0, 1, SMOOTH);
  const done = ramp(frame, T.done, T.done + 12, 0, 1, OVERSHOOT);
  const expand = ramp(frame, T.expand[0], T.expand[1], 0, 1, SMOOTH);
  const dimAll = ramp(frame, T.phrasesCenter[0], T.phrasesCenter[1], 0, 1, SMOOTH);
  const uiGone = ramp(frame, 1392, 1404, 0, 1, IN);

  // Preview rect: small card (process) → large editing panel (iteration)
  const pv = {
    x: interpolate(expand, [0, 1], [1010, 780]),
    y: interpolate(expand, [0, 1], [190, 330]),
    w: interpolate(expand, [0, 1], [710, 940]),
    h: interpolate(expand, [0, 1], [450, 620]),
  };
  const codeOpacity = (1 - 0.6 * toPreview) * (1 - ramp(frame, T.expand[0] - 6, T.expand[0] + 6));

  // Core phrases
  const p1 = ramp(frame, T.phrase1, T.phrase1 + 16, 0, 1, OUT);
  const p2 = ramp(frame, T.phrase2, T.phrase2 + 16, 0, 1, OUT);
  const p1Swap = ramp(frame, T.phrase2 - 6, T.phrase2 + 8, 0, 1, SMOOTH) * (1 - dimAll);
  const phraseOut = ramp(frame, 1388, 1400, 0, 1, IN);

  // Journey
  const jIn = ramp(frame, T.journey[0], T.journey[0] + 12, 0, 1, OUT);
  const jOut = ramp(frame, T.challengeIn - 8, T.challengeIn + 2, 0, 1, IN);
  const jt = ramp(frame, T.journey[0] + 6, T.journey[1], 0, 1, SMOOTH);

  // Challenge
  const cIn = ramp(frame, T.challengeIn, T.challengeIn + 14, 0, 1, OUT);
  const keyIn = ramp(frame, T.challengeKey, T.challengeKey + 12, 0, 1, OUT);
  const cOut = ramp(frame, 1488, 1500, 0, 1, IN);
  const textFlip = ramp(frame, T.toDark[0] - 2, T.toDark[0] + 8);
  const keyGlow = pulse(frame, T.challengeKey + 10, 10);

  const phraseStyle: React.CSSProperties = { fontFamily: FONTS.serif, fontWeight: 600, letterSpacing: "-0.02em", color: ink, whiteSpace: "nowrap" };
  const centerScale = interpolate(dimAll, [0, 1], [1, 1.25]);

  return (
    <div style={{ position: "absolute", left: 0, top: 3240, width: 1920, height: 1080 }}>
      {/* ---- the working interface ---- */}
      <div style={{ position: "absolute", inset: 0, opacity: (1 - 0.94 * dimAll) * (1 - uiGone), transform: `scale(${1 - 0.04 * dimAll})`, filter: dimAll > 0.01 ? `blur(${dimAll * 4}px)` : undefined }}>
        <div style={{ position: "absolute", left: 160, top: 120 + (1 - panelIn) * 60, width: 1600, height: 840, ...glass(false), borderRadius: 28, opacity: panelIn * (1 - expand) }} />
        {/* code panel */}
        <div style={{ position: "absolute", left: 200, top: 160, width: 740, height: 760, opacity: panelIn * codeOpacity, transform: `translateX(${-40 * toPreview}px) scale(${1 - 0.06 * toPreview})`, transformOrigin: "left center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 18px", borderRadius: 24, background: building ? "rgba(98,230,255,0.14)" : "rgba(98,230,255,0.22)", fontFamily: FONTS.sans, fontSize: 21, fontWeight: 600, color: ink }}>
              {building ? <EnergySymbol size={22} rotation={frame * 6} glow={0} core={DEEP_CYAN} /> : <Check size={22} />}
              {building ? ADAPTATION.buildingStatus : "Ready"}
            </div>
          </div>
          <div style={{ marginTop: 26, borderRadius: 18, background: "#F6F6F4", border: `1px solid ${COLORS.divider}`, padding: "0 0 22px", minHeight: 500 }}>
            <div style={{ display: "flex", gap: 0, borderBottom: `1px solid ${COLORS.divider}` }}>
              <div style={{ padding: "14px 22px", fontFamily: FONTS.mono, fontSize: 18, color: ink, borderBottom: `2px solid ${COLORS.cyan}`, fontVariantLigatures: "none" }}>{ADAPTATION.fileName}</div>
            </div>
            <div style={{ padding: "18px 22px 0" }}>
              <CodeBlock lines={ADAPTATION.projectCode} start={T.codeType[0]} framesPerChar={(T.codeType[1] - T.codeType[0]) / ADAPTATION.projectCode.join("").length} theme="light" fontSize={22} lineHeight={1.7} />
            </div>
          </div>
        </div>
        {/* preview placeholder while building */}
        {toPreview < 1 && (
          <div style={{ position: "absolute", left: 1010, top: 190, width: 710, height: 570, borderRadius: 24, border: `2px dashed ${COLORS.divider}`, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 18, opacity: panelIn * (1 - toPreview) }}>
            <EnergySymbol size={44} rotation={frame * 4} glow={0} core={DEEP_CYAN} />
            <span style={{ fontFamily: FONTS.mono, fontSize: 20, letterSpacing: "0.14em", color: "#A2A6AE" }}>PREVIEW</span>
            <ThinkingDots color={COLORS.cyan} size={8} />
          </div>
        )}
        {/* preview card (bright card with subtle shadow) */}
        <div
          style={{
            position: "absolute",
            left: pv.x,
            top: pv.y,
            width: pv.w,
            height: pv.h + 120 * (1 - expand),
            ...glass(false),
            borderRadius: 24,
            padding: 18,
            opacity: toPreview,
            transform: `scale(${0.9 + 0.1 * toPreview})`,
          }}
        >
          <div style={{ position: "relative", width: "100%", height: pv.h - 36 }}>
            <MiniPreview frame={frame} scale={pv.w / 710} />
          </div>
          {expand < 0.5 && (
            <div style={{ display: "flex", alignItems: "center", gap: 14, marginTop: 24, opacity: done * (1 - expand * 2) }}>
              <Check size={34} progress={ramp(frame, T.done + 2, T.done + 12)} />
              <span style={{ fontFamily: FONTS.sans, fontSize: 26, fontWeight: 600, color: ink }}>{ADAPTATION.doneMessage}</span>
            </div>
          )}
        </div>
        {/* response field with requests */}
        {frame >= T.expand[0] && (
          <div style={{ position: "absolute", left: 200, top: 330, width: 520, height: 620, ...glass(false), borderRadius: 24, padding: 28, opacity: expand, transform: `translateX(${(1 - expand) * -40}px)` }}>
            <div style={{ fontFamily: FONTS.mono, fontSize: 17, letterSpacing: "0.14em", color: DEEP_CYAN, marginBottom: 22 }}>YOUR REQUESTS</div>
            {ADAPTATION.requests.map((q, i) => {
              const v = ramp(frame, T.requests[i], T.requests[i] + 10, 0, 1, OVERSHOOT);
              const ok = ramp(frame, T.requests[i] + 8, T.requests[i] + 14);
              return (
                <div key={q} style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", gap: 12, marginBottom: 20, opacity: Math.min(1, v), transform: `translateY(${(1 - v) * 20}px)`, transformOrigin: "right" }}>
                  {ok > 0 && <Check size={26} progress={ok} />}
                  <div style={{ background: ink, color: COLORS.white, borderRadius: "20px 20px 6px 20px", padding: "16px 22px", fontFamily: FONTS.sans, fontSize: 26, fontWeight: 500 }}>{q}</div>
                </div>
              );
            })}
            <div style={{ position: "absolute", left: 28, right: 28, bottom: 28, height: 64, borderRadius: 32, border: `1px solid ${COLORS.divider}`, display: "flex", alignItems: "center", padding: "0 24px", fontFamily: FONTS.sans, fontSize: 22, color: "#A2A6AE" }}>
              Describe a change…
            </div>
          </div>
        )}
      </div>

      {/* ---- core phrases ---- */}
      {frame >= T.phrase1 && frame < 1402 && (
        <div style={{ position: "absolute", inset: 0, opacity: 1 - phraseOut }}>
          <div
            style={{
              position: "absolute",
              left: interpolate(dimAll, [0, 1], [200, 960]),
              top: interpolate(dimAll, [0, 1], [120, 400]),
              transform: `translateX(${-50 * dimAll}%) scale(${centerScale})`,
              transformOrigin: "center top",
              opacity: p1 * (1 - p1Swap),
            }}
          >
            <div style={{ ...phraseStyle, fontSize: 70, transform: `translateY(${(1 - p1) * 30}px)` }}>
              {ADAPTATION.corePhrase1.before}
              <span style={{ color: DEEP_CYAN }}>{ADAPTATION.corePhrase1.key}</span>
              {ADAPTATION.corePhrase1.after}
            </div>
          </div>
          <div
            style={{
              position: "absolute",
              left: interpolate(dimAll, [0, 1], [200, 960]),
              top: interpolate(dimAll, [0, 1], [120, 540]),
              transform: `translateX(${-50 * dimAll}%) scale(${centerScale})`,
              transformOrigin: "center top",
              opacity: p2,
            }}
          >
            <div style={{ ...phraseStyle, fontSize: 70, transform: `translateY(${(1 - p2) * 30}px)` }}>
              {ADAPTATION.corePhrase2.before}
              <span style={{ color: DEEP_CYAN }}>{ADAPTATION.corePhrase2.key}</span>
              {ADAPTATION.corePhrase2.after}
            </div>
          </div>
        </div>
      )}

      {/* ---- learning journey (progress motif) ---- */}
      {frame >= T.journey[0] && frame < T.challengeIn + 3 && (
        <div style={{ position: "absolute", inset: 0, opacity: jIn * (1 - jOut) }}>
          <div style={{ position: "absolute", left: 0, width: 1920, top: 330, textAlign: "center", fontFamily: FONTS.mono, fontSize: 22, letterSpacing: "0.22em", color: soft }}>YOUR PATH</div>
          <div style={{ position: "absolute", left: 300, top: 539, width: 1320, height: 2, background: COLORS.divider }} />
          <div style={{ position: "absolute", left: 300, top: 538, width: 1320 * jt, height: 4, background: COLORS.cyan, boxShadow: `0 0 16px ${COLORS.cyan}` }} />
          {ADAPTATION.journey.map((j, i) => {
            const at = i / 2;
            const lit = ramp(jt, at - 0.02, at + 0.06, 0, 1, (x) => x);
            return (
              <div key={j} style={{ position: "absolute", left: 300 + 1320 * at - 160, top: 516, width: 320, display: "flex", flexDirection: "column", alignItems: "center" }}>
                <div style={{ width: 48, height: 48, borderRadius: 24, background: lit > 0.5 ? COLORS.cyan : COLORS.white, border: `2px solid ${lit > 0.5 ? COLORS.cyan : COLORS.divider}`, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: FONTS.mono, fontSize: 18, color: ink, fontWeight: 600 }}>
                  0{i + 1}
                </div>
                <div style={{ marginTop: 22, fontFamily: FONTS.sans, fontSize: 30, fontWeight: 600, color: mixColor(lit, "#A2A6AE", ink), textAlign: "center" }}>{j}</div>
              </div>
            );
          })}
          <div style={{ position: "absolute", left: 300 + 1320 * jt - 34, top: 540 - 100 }}>
            <EnergySymbol size={68} rotation={frame * 3} glow={0.6} core={DEEP_CYAN} />
          </div>
        </div>
      )}

      {/* ---- the challenge ---- */}
      {frame >= T.challengeIn && (
        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", opacity: cIn * (1 - cOut), transform: `translateY(${(1 - cIn) * 30 - 60 * cOut}px)` }}>
          <div style={{ ...phraseStyle, fontSize: 92, color: mixColor(textFlip, ink, COLORS.text) }}>
            {ADAPTATION.challenge}{" "}
            <span
              style={{
                display: "inline-block",
                color: mixColor(textFlip, DEEP_CYAN, COLORS.cyan),
                fontStyle: "italic",
                opacity: keyIn,
                transform: `translateY(${(1 - keyIn) * 24}px)`,
                textShadow: `0 0 ${30 * keyGlow}px rgba(98,230,255,${0.6 * keyGlow})`,
              }}
            >
              {ADAPTATION.challengeKey}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

// ---------------------------------------------------------------------
//  Scene
// ---------------------------------------------------------------------
export const Adaptation: React.FC = () => {
  const frame = useCurrentFrame();
  if (frame < SCENES.adaptation.from || frame > SCENES.adaptation.to) return null;

  const symIn = ramp(frame, T.symbolIn + 2, T.symbolIn + 16, 0, 1, OVERSHOOT);
  const reveal = ramp(frame, T.reveal[0], T.reveal[1], 0, 1, Easing.inOut(Easing.cubic));
  const toCorner = ramp(frame, 912, 938, 0, 1, SMOOTH);
  const dark = ramp(frame, T.toDark[0], T.toDark[1], 0, 1, SMOOTH);
  const scroll = scrollAt(frame);
  const zoom = zoomAt(frame);
  const vBlur = Math.min(14, Math.abs(scrollAt(frame) - scrollAt(frame - 1)) * 0.18);
  const symX = interpolate(toCorner, [0, 1], [960, 84]);
  const symY = interpolate(toCorner, [0, 1], [540, 76]);
  const symSize = interpolate(toCorner, [0, 1], [150, 56]);
  const symFade = 1 - ramp(frame, T.toDark[0], T.toDark[1]);

  return (
    <AbsoluteFill>
      {/* bright world, revealed by a soft circle */}
      <AbsoluteFill
        style={{
          clipPath: reveal < 1 ? `circle(${reveal * 1150}px at 960px 540px)` : undefined,
          opacity: 1 - dark,
          backgroundColor: COLORS.paper,
        }}
      >
        <AbsoluteFill style={{ background: "radial-gradient(ellipse 60% 50% at 80% 0%, rgba(98,230,255,0.08), transparent 70%), radial-gradient(ellipse 50% 40% at 10% 100%, rgba(166,139,255,0.06), transparent 70%)" }} />
        <DirectionalBlur id="scrollBlur" y={vBlur < 0.3 ? 0 : vBlur}>
          <AbsoluteFill style={{ transform: `scale(${zoom})` }}>
            <div style={{ position: "absolute", left: 0, top: -scroll, width: 1920, height: 4320 }}>
              {frame < T.scroll2[1] + 2 && <SectionA frame={frame} />}
              {frame >= T.scroll2[0] - 2 && frame < T.scroll3[1] + 2 && <SectionB frame={frame} />}
              {frame >= T.scroll3[0] - 2 && frame < T.scroll4[1] + 2 && <SectionC frame={frame} />}
              {frame >= T.scroll4[0] - 2 && <SectionD frame={frame} />}
            </div>
          </AbsoluteFill>
        </DirectionalBlur>
      </AbsoluteFill>
      {/* soft edge of the reveal */}
      {reveal > 0 && reveal < 1 && (
        <div
          style={{
            position: "absolute",
            left: 960 - reveal * 1150,
            top: 540 - reveal * 1150,
            width: reveal * 2300,
            height: reveal * 2300,
            borderRadius: "50%",
            boxShadow: `0 0 80px 30px rgba(98,230,255,${0.5 * (1 - reveal)})`,
          }}
        />
      )}
      {/* the guide symbol */}
      <div style={{ position: "absolute", left: symX - symSize / 2, top: symY - symSize / 2, transform: `scale(${symIn})`, opacity: symFade }}>
        <EnergySymbol size={symSize} rotation={frame * 1.5} glow={1.4 - toCorner * 1.1} core={mixColor(reveal, COLORS.white, DEEP_CYAN)} />
      </div>
    </AbsoluteFill>
  );
};

