import React from "react";
import { useCurrentFrame } from "remotion";
import { COLORS } from "../config";
import { mixColor } from "../lib/anim";

export type Segment = { text: string; color?: string; glowHold?: number };

/**
 * Progressive typing. Each new character glows cyan, then settles to its color.
 * Hidden characters keep their layout space so line breaks never jump.
 */
export const TypeText: React.FC<{
  segments: Segment[];
  start: number;
  framesPerChar: number;
  color?: string;
  glow?: string;
  settle?: number;
  ghost?: number; // opacity of not-yet-typed characters
  cursor?: boolean;
  cursorColor?: string;
  style?: React.CSSProperties;
}> = ({
  segments,
  start,
  framesPerChar,
  color = COLORS.text,
  glow = COLORS.cyan,
  settle = 12,
  ghost = 0,
  cursor = false,
  cursorColor = COLORS.cyan,
  style,
}) => {
  const frame = useCurrentFrame();
  let idx = 0;
  const totalChars = segments.reduce((a, s) => a + s.text.length, 0);
  const visibleCount = Math.max(0, Math.min(totalChars, Math.floor((frame - start) / framesPerChar) + 1));
  const typingDone = visibleCount >= totalChars;
  const blinkOn = Math.floor(frame / 9) % 2 === 0 || !typingDone;
  const nodes: React.ReactNode[] = [];

  segments.forEach((seg, si) => {
    const base = seg.color ?? color;
    seg.text.split("").forEach((ch, ci) => {
      const i = idx++;
      const appear = start + i * framesPerChar;
      const age = frame - appear;
      const visible = age >= 0;
      const hold = seg.glowHold ?? 0;
      const t = Math.max(0, (age - hold) / settle);
      const c = visible ? mixColor(t, glow, base) : base;
      const g = visible ? Math.max(0, 1 - t) : 0;
      nodes.push(
        <span
          key={`${si}-${ci}`}
          style={{
            color: c,
            opacity: visible ? 1 : ghost,
            textShadow: g > 0.02 ? `0 0 ${18 * g}px ${glow}, 0 0 ${4 * g}px ${glow}` : undefined,
          }}
        >
          {ch}
        </span>,
      );
      if (cursor && i === visibleCount - 1 && frame >= start) {
        nodes.push(
          <span key="cursor" style={{ position: "relative", display: "inline-block", width: 0 }}>
            <span
              style={{
                position: "absolute",
                left: 4,
                top: "-0.82em",
                width: "0.08em",
                minWidth: 3,
                height: "0.95em",
                background: cursorColor,
                opacity: blinkOn ? 1 : 0,
                boxShadow: `0 0 10px ${cursorColor}`,
              }}
            />
          </span>,
        );
      }
    });
  });
  return <span style={style}>{nodes}</span>;
};
