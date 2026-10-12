import React from "react";
import { easeOut, motionBlur, prog } from "../theme";

/** Texto que sobe de baixo de uma máscara, com borrão no caminho. */
export const MaskRise: React.FC<{
  f: number;
  start: number;
  end: number;
  distance: number;
  height: number;
  children: React.ReactNode;
}> = ({ f, start, end, distance, height, children }) => {
  const p = prog(f, start, end, easeOut);
  const blur = motionBlur(f, start, end, 10, easeOut);
  return (
    <div style={{ height, overflow: "hidden", paddingLeft: 20, paddingRight: 20, marginLeft: -20, marginRight: -20 }}>
      <div
        style={{
          transform: `translateY(${(1 - p) * distance}px)`,
          opacity: Math.min(1, p * 1.6),
          filter: blur > 0.05 ? `blur(${blur}px)` : undefined,
        }}
      >
        {children}
      </div>
    </div>
  );
};
