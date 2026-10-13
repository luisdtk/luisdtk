import { AbsoluteFill } from "remotion";

import { step } from "../kit/spring";
import { clamp01, progress } from "../kit/time";
import { cue } from "./cues";
import { Embers, Logo } from "./fx";
import { color, easeIn, easeOut, font } from "./tokens";

type Comment = {
  text: string;
  accent?: string;
  user: string;
  x: number;
  y: number;
  from: readonly [dx: number, dy: number];
};

// Positions sit inside the Reels safe area, alternating sides so no two collide.
const COMMENTS: Comment[] = [
  { text: "How is this possible?", user: "kenji.reads", x: 96, y: 330, from: [-1, 0] },
  { text: "How did you make this?", user: "mari_draws", x: 300, y: 560, from: [1, 0] },
  { text: "I want to read manga like this.", user: "otaku.lens", x: 96, y: 1290, from: [0, 1] },
  { text: "Is the AI era here?", accent: "AI era", user: "panelzero", x: 330, y: 1500, from: [1, 0.4] },
];
const HOLD = 0.85;

function Bubble({ c, t, start }: { c: Comment; t: number; start: number }) {
  const enter = step(t - start, { stiffness: 340, damping: 28 });
  const leave = easeIn(progress(t, start + HOLD, 0.22));
  if (t < start || leave >= 1) return null;
  const travel = 220 * (1 - enter);
  const parts = c.accent ? c.text.split(c.accent) : [c.text];
  return (
    <div
      style={{
        position: "absolute",
        left: c.x + c.from[0] * travel,
        top: c.y + c.from[1] * travel - leave * 40,
        opacity: clamp01(enter * 2) * (1 - leave),
        filter: leave > 0 ? `blur(${leave * 12}px)` : undefined,
        scale: `${0.92 + 0.08 * enter}`,
        display: "flex",
        alignItems: "center",
        gap: 22,
        padding: "24px 34px 24px 24px",
        borderRadius: 999,
        background: "rgba(22,22,22,0.92)",
        border: `1.5px solid ${color.line}`,
        boxShadow: "0 24px 60px rgba(0,0,0,0.55)",
      }}
    >
      <div
        style={{
          width: 64,
          height: 64,
          borderRadius: 32,
          background: color.surfaceRaised,
          border: `2px solid ${color.red}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: font.mono,
          fontWeight: 500,
          fontSize: 24,
          color: color.white,
          textTransform: "uppercase",
        }}
      >
        {c.user.slice(0, 1)}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        <div style={{ fontFamily: font.mono, fontSize: 22, color: color.muted, letterSpacing: "0.02em" }}>@{c.user}</div>
        <div style={{ fontFamily: font.ui, fontWeight: 500, fontSize: 42, color: color.white, letterSpacing: "-0.01em", whiteSpace: "nowrap" }}>
          {parts.length > 1 ? (
            <>
              {parts[0]}
              <span style={{ color: color.red, fontWeight: 600 }}>{c.accent}</span>
              {parts[1]}
            </>
          ) : (
            c.text
          )}
        </div>
      </div>
    </div>
  );
}

/** Scene 3: the reaction. The logo holds the centre while comments pop in, one at a time. */
export function CommentSequence({ t }: { t: number }) {
  if (t < cue.reaction - 0.05 || t > cue.final + 0.1) return null;

  const enter = easeOut(progress(t, cue.reaction, 0.3));
  const out = easeIn(progress(t, cue.reactionOut, 0.12));
  // the logo answers each comment with a small pulse
  const pulse = cue.comments.reduce((acc, c) => acc + Math.max(0, 1 - Math.abs(t - c - 0.05) / 0.12) * 0.035, 0);

  return (
    <AbsoluteFill style={{ background: color.bg, opacity: 1 - out }}>
      {/* a faint dot grid: the interface surface */}
      <AbsoluteFill
        style={{
          backgroundImage: `radial-gradient(${color.line} 1.6px, transparent 1.6px)`,
          backgroundSize: "44px 44px",
          backgroundPosition: `0 ${-(t - cue.reaction) * 30}px`,
          opacity: 0.55 * enter,
        }}
      />
      <AbsoluteFill style={{ background: `radial-gradient(circle at 50% 50%, rgba(226,38,43,${0.22 * enter}) 0%, rgba(10,10,10,0) 40%)` }} />
      <Embers t={t} start={cue.reaction} end={cue.reactionOut} count={18} seed={21} area={{ x: 240, y: 760, w: 600, h: 500 }} rise={200} size={7} intensity={0.7} />

      <AbsoluteFill
        style={{
          alignItems: "center",
          justifyContent: "center",
          scale: `${(0.8 + 0.2 * enter) * (1 + pulse) * (1 + out * 0.5)}`,
          opacity: enter,
          filter: out > 0 ? `blur(${out * 16}px)` : undefined,
        }}
      >
        <Logo width={300} style={{ filter: "drop-shadow(0 0 40px rgba(226,38,43,0.45))" }} />
      </AbsoluteFill>

      {COMMENTS.map((c, i) => (
        <Bubble key={c.text} c={c} t={t} start={cue.comments[i]} />
      ))}
      {/* the reader's dive lands here as a white flash that falls away */}
      {t < cue.reaction + 0.2 && <AbsoluteFill style={{ background: color.white, opacity: 1 - easeOut(progress(t, cue.reaction, 0.2)) }} />}
    </AbsoluteFill>
  );
}

