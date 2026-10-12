import React from "react";
import { useCurrentFrame } from "remotion";
import { COLORS, FONTS } from "../config";
import { Segment, TypeText } from "./TypeText";

/** Custom pointer cursor. */
export const Pointer: React.FC<{ x: number; y: number; press?: number; dark?: boolean; opacity?: number }> = ({
  x,
  y,
  press = 0,
  dark = false,
  opacity = 1,
}) => (
  <div style={{ position: "absolute", left: x, top: y, opacity, zIndex: 50 }}>
    {press > 0 && (
      <div
        style={{
          position: "absolute",
          left: -22,
          top: -22,
          width: 44,
          height: 44,
          borderRadius: 22,
          border: `2px solid ${COLORS.cyan}`,
          opacity: 1 - press,
          transform: `scale(${0.5 + press})`,
        }}
      />
    )}
    <svg width={30} height={38} viewBox="0 0 30 38" style={{ transform: `scale(${1 - 0.12 * Math.sin(press * Math.PI)})`, transformOrigin: "0 0" }}>
      <path
        d="M2 2 L2 30 L9.5 23 L14.5 35 L19.5 33 L14.5 21.5 L25 21.5 Z"
        fill={dark ? COLORS.ink : COLORS.text}
        stroke={dark ? COLORS.white : COLORS.bg}
        strokeWidth={2}
        strokeLinejoin="round"
      />
    </svg>
  </div>
);

export const ThinkingDots: React.FC<{ color?: string; size?: number }> = ({ color = COLORS.cyan, size = 8 }) => {
  const frame = useCurrentFrame();
  return (
    <span style={{ display: "inline-flex", gap: size * 0.8, alignItems: "center" }}>
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          style={{
            width: size,
            height: size,
            borderRadius: size,
            background: color,
            opacity: 0.3 + 0.7 * Math.max(0, Math.sin(frame / 5 - i * 0.9)),
          }}
        />
      ))}
    </span>
  );
};

export const Check: React.FC<{ size?: number; progress?: number; color?: string }> = ({ size = 28, progress = 1, color = COLORS.cyan }) => (
  <svg width={size} height={size} viewBox="0 0 28 28">
    <circle cx={14} cy={14} r={13} fill={color} opacity={0.18 + 0.82 * Math.min(1, progress * 1.5)} />
    <path
      d="M8 14.5 L12.4 19 L20.5 10"
      fill="none"
      stroke={COLORS.bg}
      strokeWidth={3}
      strokeLinecap="round"
      strokeLinejoin="round"
      pathLength={1}
      strokeDasharray="1 1"
      strokeDashoffset={1 - progress}
    />
  </svg>
);

/** Anonymous avatar — abstract gradient, no face, no identity. */
export const Avatar: React.FC<{ size?: number; hue?: string; brand?: boolean }> = ({ size = 44, hue = "#3A4150", brand = false }) => (
  <div
    style={{
      width: size,
      height: size,
      borderRadius: size,
      flexShrink: 0,
      background: brand ? `radial-gradient(circle at 35% 30%, #1B2433, ${COLORS.bg})` : `linear-gradient(135deg, ${hue}, #1A1E27)`,
      border: brand ? `1.5px solid ${COLORS.cyan}` : "1px solid rgba(255,255,255,0.08)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
    }}
  >
    {!brand && <div style={{ width: size * 0.32, height: size * 0.32, borderRadius: size, background: "rgba(255,255,255,0.14)" }} />}
    {brand && (
      <svg width={size * 0.55} height={size * 0.55} viewBox="-60 -60 120 120">
        <path d="M0,-50 Q7,-7 50,0 Q7,7 0,50 Q-7,7 -50,0 Q-7,-7 0,-50 Z" fill={COLORS.cyan} />
      </svg>
    )}
  </div>
);

export const ProgressBar: React.FC<{ value: number; width: number; color?: string; track?: string; height?: number }> = ({
  value,
  width,
  color = COLORS.cyan,
  track = "rgba(146,152,165,0.18)",
  height = 6,
}) => (
  <div style={{ width, height, borderRadius: height, background: track, overflow: "hidden" }}>
    <div
      style={{
        width: `${Math.max(0, Math.min(1, value)) * 100}%`,
        height: "100%",
        borderRadius: height,
        background: color,
        boxShadow: `0 0 12px ${color}`,
      }}
    />
  </div>
);

// ---------------------------------------------------------------------
//  Code — simple syntax colouring, ligatures disabled.
// ---------------------------------------------------------------------
export type CodeTheme = "dark" | "light";
const THEMES = {
  dark: { plain: COLORS.text, kw: COLORS.violet, str: "#FFC98F", fn: COLORS.cyan, tag: COLORS.cyan, punct: COLORS.textDim, attr: "#FFC98F" },
  light: { plain: COLORS.ink, kw: "#6B4FE0", str: "#B35A1F", fn: "#0A8FB0", tag: "#0A8FB0", punct: "#8A8F99", attr: "#B35A1F" },
};

export const highlight = (line: string, theme: CodeTheme): Segment[] => {
  const c = THEMES[theme];
  const re = /("[^"]*")|\b(const|await|return|export|let)\b|(<\/?[A-Z][A-Za-z]*)|([A-Za-z_][\w.]*)(?=\()|([{}()=;>/<])|([^"{}()=;>/<]+?)/g;
  const out: Segment[] = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(line))) {
    const color = m[1] ? c.str : m[2] ? c.kw : m[3] ? c.tag : m[4] ? c.fn : m[5] ? c.punct : c.plain;
    const last = out[out.length - 1];
    if (last && last.color === color) last.text += m[0];
    else out.push({ text: m[0], color });
  }
  return out;
};

export const CodeBlock: React.FC<{
  lines: string[];
  start: number;
  framesPerChar: number;
  theme?: CodeTheme;
  fontSize?: number;
  lineHeight?: number;
  lineNumbers?: boolean;
}> = ({ lines, start, framesPerChar, theme = "dark", fontSize = 26, lineHeight = 1.6, lineNumbers = true }) => {
  const frame = useCurrentFrame();
  let cursorAt = start;
  const starts = lines.map((l) => {
    const s = cursorAt;
    cursorAt += Math.max(1, l.length) * framesPerChar + 3;
    return s;
  });
  const activeLine = starts.reduce((acc, s, i) => (frame >= s ? i : acc), 0);
  return (
    <div style={{ fontFamily: FONTS.mono, fontSize, lineHeight, fontVariantLigatures: "none", fontFeatureSettings: '"liga" 0, "calt" 0', whiteSpace: "pre" }}>
      {lines.map((l, i) => (
        <div key={i} style={{ display: "flex", opacity: frame >= starts[i] ? 1 : 0 }}>
          {lineNumbers && (
            <span style={{ width: fontSize * 2, color: theme === "dark" ? "rgba(146,152,165,0.45)" : "#B9BCC2", flexShrink: 0 }}>{i + 1}</span>
          )}
          <TypeText
            segments={highlight(l, theme)}
            start={starts[i]}
            framesPerChar={framesPerChar}
            settle={10}
            cursor={i === activeLine}
            cursorColor={COLORS.cyan}
          />
        </div>
      ))}
    </div>
  );
};

export const glass = (dark = true): React.CSSProperties =>
  dark
    ? {
        background: "linear-gradient(180deg, rgba(22,27,37,0.82), rgba(13,16,23,0.86))",
        border: `1px solid ${COLORS.panelBorder}`,
        borderRadius: 22,
        boxShadow: "0 40px 120px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.06)",
      }
    : {
        background: COLORS.white,
        border: `1px solid ${COLORS.divider}`,
        borderRadius: 22,
        boxShadow: "0 30px 80px rgba(14,16,20,0.08), 0 2px 6px rgba(14,16,20,0.04)",
      };
