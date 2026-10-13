import type { CSSProperties } from "react";

import { step } from "../kit/spring";
import { clamp01, progress } from "../kit/time";
import { PanelView, type PanelName } from "./panel";
import { color, easeInOut, font, seeded } from "./tokens";

export const FOLDER = { w: 340, h: 250, tab: 46 } as const;
/** Pages start fully inside the folder (behind the flap) and rise out of it. */
export const PAGE_W = FOLDER.w * 0.5;
export const PAGE_H = PAGE_W * 1.42;
export const PAGE_RISE = 0.62;

export type FolderSpec = {
  title: string;
  x: number; // centre, frame pixels
  y: number;
  pages: readonly (PanelName | number)[]; // a real panel, or a seed for a drawn placeholder page
  tilt: number;
};

/**
 * A manga-style page drawn in code: a panel grid with screentone, hatching and speed lines.
 * No characters and no lettering: it stands in for series whose pages were not supplied.
 */
export function DrawnPage({ seed, w, h }: { seed: number; w: number; h: number }) {
  const rand = seeded(seed);
  const m = 8;
  const gutter = 6;
  const split = 0.35 + rand() * 0.3;
  const splitX = 0.4 + rand() * 0.2;
  const panels = [
    { x: m, y: m, w: w - 2 * m, h: (h - 2 * m) * split - gutter / 2 },
    { x: m, y: m + (h - 2 * m) * split + gutter / 2, w: (w - 2 * m) * splitX - gutter / 2, h: (h - 2 * m) * (1 - split) - gutter / 2 },
    { x: m + (w - 2 * m) * splitX + gutter / 2, y: m + (h - 2 * m) * split + gutter / 2, w: (w - 2 * m) * (1 - splitX) - gutter / 2, h: (h - 2 * m) * (1 - split) - gutter / 2 },
  ];
  const id = `tone-${seed}`;
  return (
    <svg width={w} height={h} style={{ display: "block", background: color.paper }}>
      <defs>
        <pattern id={id} width={6} height={6} patternUnits="userSpaceOnUse">
          <circle cx={3} cy={3} r={1.3} fill="#1a1a1a" />
        </pattern>
      </defs>
      {panels.map((p, i) => {
        const kind = Math.floor(rand() * 3);
        const cx = p.x + p.w * (0.3 + rand() * 0.4);
        const cy = p.y + p.h * (0.3 + rand() * 0.4);
        return (
          <g key={i}>
            <clipPath id={`clip-${seed}-${i}`}>
              <rect x={p.x} y={p.y} width={p.w} height={p.h} />
            </clipPath>
            <g clipPath={`url(#clip-${seed}-${i})`}>
              {kind === 0 &&
                Array.from({ length: 40 }, (_, k) => {
                  const a = (k / 40) * Math.PI * 2 + rand() * 0.08;
                  const r0 = 12 + rand() * 20;
                  return <line key={k} x1={cx + Math.cos(a) * r0} y1={cy + Math.sin(a) * r0} x2={cx + Math.cos(a) * 400} y2={cy + Math.sin(a) * 400} stroke="#111" strokeWidth={0.8 + rand() * 1.6} />;
                })}
              {kind === 1 && (
                <>
                  <rect x={p.x} y={p.y} width={p.w} height={p.h} fill={`url(#${id})`} opacity={0.8} />
                  <path d={`M${p.x} ${p.y + p.h * 0.7} Q ${cx} ${p.y + p.h * 0.2} ${p.x + p.w} ${p.y + p.h * 0.55} L ${p.x + p.w} ${p.y + p.h} L ${p.x} ${p.y + p.h} Z`} fill="#121212" />
                </>
              )}
              {kind === 2 &&
                Array.from({ length: 26 }, (_, k) => (
                  <line key={k} x1={p.x + k * 10 - 40} y1={p.y} x2={p.x + k * 10 + 40} y2={p.y + p.h} stroke="#151515" strokeWidth={1.2} />
                ))}
              {kind === 2 && <ellipse cx={cx} cy={cy} rx={p.w * 0.22} ry={p.h * 0.3} fill={color.paper} stroke="#111" strokeWidth={3} />}
            </g>
            <rect x={p.x} y={p.y} width={p.w} height={p.h} fill="none" stroke="#0d0d0d" strokeWidth={3} />
          </g>
        );
      })}
    </svg>
  );
}

function Page({ page, w, h }: { page: PanelName | number; w: number; h: number }) {
  if (typeof page === "number") return <DrawnPage seed={page} w={w} h={h} />;
  return <PanelView panel={page} width={w} height={h} shot={{ fx: 0.5, fy: 0.42, zoom: 1.02 }} />;
}

/**
 * A folder that flies out from the logo, opens its front flap, and lets its pages slide up.
 * `selected` lights it red (Black Clover); `dim` pushes the others back.
 */
export function Folder({
  spec,
  t,
  start,
  origin,
  selected = 0,
  dim = 0,
  style,
}: {
  spec: FolderSpec;
  t: number;
  start: number;
  origin: { x: number; y: number };
  selected?: number;
  dim?: number;
  style?: CSSProperties;
}) {
  const fly = step(t - start, { stiffness: 210, damping: 20 });
  const open = easeInOut(progress(t, start + 0.22, 0.32));
  const x = origin.x + (spec.x - origin.x) * fly;
  const y = origin.y + (spec.y - origin.y) * fly;
  const pageW = PAGE_W;
  const pageH = PAGE_H;
  const glow = selected > 0 ? `0 0 ${40 * selected}px rgba(226,38,43,${0.7 * selected}), 0 0 0 ${3 * selected}px ${color.red}` : "0 30px 60px rgba(0,0,0,0.55)";

  if (t < start) return null;
  return (
    <div
      style={{
        position: "absolute",
        left: x - FOLDER.w / 2,
        top: y - FOLDER.h / 2,
        width: FOLDER.w,
        height: FOLDER.h,
        scale: `${(0.25 + 0.75 * fly) * (1 + selected * 0.06)}`,
        rotate: `${spec.tilt * fly}deg`,
        opacity: clamp01(fly * 3) * (1 - dim * 0.75),
        filter: dim > 0 ? `blur(${dim * 6}px)` : undefined,
        perspective: 900,
        ...style,
      }}
    >
      {/* back of the folder with its tab */}
      <div style={{ position: "absolute", left: 0, top: -FOLDER.tab + 8, width: FOLDER.w * 0.46, height: FOLDER.tab, borderRadius: "14px 14px 0 0", background: selected > 0.5 ? color.red : "#232323", display: "flex", alignItems: "center", paddingLeft: 16, zIndex: 4, boxShadow: "0 6px 14px rgba(0,0,0,0.45)" }}>
        <span style={{ fontFamily: font.mono, fontWeight: 500, fontSize: 19, letterSpacing: "0.08em", color: color.white, whiteSpace: "nowrap" }}>{spec.title}</span>
      </div>
      <div style={{ position: "absolute", inset: 0, borderRadius: "0 18px 18px 18px", background: "#1d1d1d", boxShadow: glow }} />

      {/* pages slide up out of the folder, fanned */}
      {spec.pages.map((page, i) => {
        const u = easeInOut(progress(t, start + 0.3 + i * 0.06, 0.34));
        const fan = (i - (spec.pages.length - 1) / 2) * 9;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: FOLDER.w / 2 - pageW / 2 + fan * 4 * u,
              top: FOLDER.h - pageH - 6 - u * pageH * PAGE_RISE,
              width: pageW,
              height: pageH,
              rotate: `${fan * u}deg`,
              transformOrigin: "50% 100%",
              boxShadow: "0 10px 30px rgba(0,0,0,0.5)",
              borderRadius: 4,
              overflow: "hidden",
              zIndex: i === spec.pages.length - 1 ? 2 : 1,
            }}
          >
            <Page page={page} w={pageW} h={pageH} />
          </div>
        );
      })}

      {/* front flap: drops open toward the camera */}
      <div
        style={{
          position: "absolute",
          left: 0,
          top: FOLDER.h * 0.28,
          width: FOLDER.w,
          height: FOLDER.h * 0.72,
          borderRadius: "10px 10px 18px 18px",
          background: "linear-gradient(180deg, #2b2b2b, #1a1a1a)",
          borderTop: `2px solid ${selected > 0.5 ? color.red : "#3a3a3a"}`,
          transformOrigin: "50% 100%",
          rotate: `x ${-open * 58}deg`,
          zIndex: 3,
        }}
      />
    </div>
  );
}
