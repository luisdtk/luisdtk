import { step } from "../kit/spring";
import { clamp01, progress } from "../kit/time";
import { color, easeIn, font } from "./tokens";

/** The Claude mark, drawn as a vector: a terracotta starburst of rounded rays. */
export function ClaudeMark({ size }: { size: number }) {
  const rays = [1, 0.72, 0.9, 0.66, 0.95, 0.7, 0.88, 0.74, 1, 0.68, 0.92, 0.7];
  return (
    <svg width={size} height={size} viewBox="-50 -50 100 100">
      {rays.map((len, i) => {
        const a = (i / rays.length) * Math.PI * 2 + 0.13 * (i % 3);
        const r = 44 * len;
        const w = 6.5;
        const x = Math.cos(a);
        const y = Math.sin(a);
        const nx = -y * w;
        const ny = x * w;
        return <path key={i} d={`M${nx * 0.5} ${ny * 0.5} L${x * r + nx * 0.35} ${y * r + ny * 0.35} L${x * r - nx * 0.35} ${y * r - ny * 0.35} L${-nx * 0.5} ${-ny * 0.5} Z`} fill="#D97757" strokeLinejoin="round" stroke="#D97757" strokeWidth={3} />;
      })}
    </svg>
  );
}

/** An iOS-style banner that drops in from the top of the phone screen, holds, and slides back up. */
export function ClaudeNotification({ t, at, hold = 2.2, width }: { t: number; at: number; hold?: number; width: number }) {
  if (t < at - 0.05 || t > at + hold + 0.5) return null;
  const drop = step(t - at, { stiffness: 260, damping: 22 });
  const away = easeIn(progress(t, at + hold, 0.35));
  const y = -160 + 160 * drop - 190 * away;
  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        top: 0,
        width,
        translate: `0 ${y}px`,
        opacity: clamp01(drop * 2) * (1 - away),
        display: "flex",
        alignItems: "center",
        gap: 18,
        padding: "20px 22px",
        boxSizing: "border-box",
        borderRadius: 34,
        background: "rgba(38,38,40,0.985)",
        boxShadow: "0 18px 50px rgba(0,0,0,0.6)",
        border: "1px solid rgba(255,255,255,0.08)",
        zIndex: 20,
      }}
    >
      <div style={{ width: 76, height: 76, borderRadius: 18, background: "#F5F0E8", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        <ClaudeMark size={54} />
      </div>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 4, minWidth: 0 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
          <span style={{ fontFamily: font.ui, fontWeight: 600, fontSize: 27, color: color.white }}>Claude</span>
          <span style={{ fontFamily: font.ui, fontSize: 21, color: "#9a9a9e" }}>now</span>
        </div>
        <span style={{ fontFamily: font.ui, fontWeight: 400, fontSize: 25, lineHeight: 1.25, color: "#e8e8ea" }}>This video was edited entirely by Claude.</span>
      </div>
    </div>
  );
}
