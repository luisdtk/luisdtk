import type { CSSProperties, ReactNode } from "react";
import { Img, staticFile } from "remotion";

import { track, type SpringConfig } from "../kit/spring";
import { BladeEnergy } from "./aura";
import { animSrc, type AnimName } from "./rig";

/** Natural sizes of the prepared layers (tools/prepare.py output), in pixels. */
export const PANELS = {
  // red ink on black (tools/redink.py): the paper goes black, the ink goes Asta red
  scream: { src: "images/redink/asta-scream.png", w: 1500, h: 2253 },
  sword: { src: "images/redink/sword.png", w: 1725, h: 2100 },
  blade: { src: "images/panels/sword-blade.png", w: 1725, h: 2100 },
  tornado: { src: "images/redink/tornado.png", w: 3312, h: 2346 },
  shock: { src: "images/redink/shock.png", w: 930, h: 1926 },
  yuno: { src: "images/redink/yuno-smile.png", w: 2568, h: 612 },
} as const;
export type PanelName = keyof typeof PANELS;

/** Camera inside a panel: the focus point (0..1 of the image) at the box centre, and a zoom over "cover". */
export type Shot = { fx: number; fy: number; zoom: number };
export type ShotKey = readonly [time: number, fx: number, fy: number, zoom: number];

export const heavy: SpringConfig = { stiffness: 140, damping: 26, mass: 1 };
export const snappy: SpringConfig = { stiffness: 320, damping: 32, mass: 1 };

export function shotAt(t: number, keys: readonly ShotKey[], config: SpringConfig = heavy): Shot {
  return {
    fx: track(t, keys.map(([k, fx]) => [k, fx] as const), config),
    fy: track(t, keys.map(([k, , fy]) => [k, fy] as const), config),
    zoom: Math.exp(track(t, keys.map(([k, , , z]) => [k, Math.log(z)] as const), config)),
  };
}

/** Where the image sits inside a box for a shot (cover, then zoom; the focus is clamped so no edge shows). */
export function placeImage(panel: PanelName, boxW: number, boxH: number, shot: Shot) {
  const { w, h } = PANELS[panel];
  const cover = Math.max(boxW / w, boxH / h);
  const s = cover * shot.zoom;
  const iw = w * s;
  const ih = h * s;
  const x = Math.min(0, Math.max(boxW - iw, boxW / 2 - shot.fx * iw));
  const y = Math.min(0, Math.max(boxH - ih, boxH / 2 - shot.fy * ih));
  return { x, y, w: iw, h: ih };
}

/** A manga panel filmed by a camera, clipped to its box. Extra layers (the blade) share the placement. */
export function PanelView({
  panel,
  width,
  height,
  shot,
  style,
  imageStyle,
  children,
  flow,
}: {
  panel: PanelName;
  width: number;
  height: number;
  shot: Shot;
  style?: CSSProperties;
  imageStyle?: CSSProperties;
  children?: (place: ReturnType<typeof placeImage>) => ReactNode;
  /** play the panel's animated loop (tools/animate.py) instead of the still */
  flow?: { t: number; anim: AnimName };
}) {
  const place = placeImage(panel, width, height, shot);
  return (
    <div style={{ position: "relative", width, height, overflow: "hidden", background: "#f4f2ee", ...style }}>
      <Img
        src={flow ? animSrc(flow.anim, flow.t) : staticFile(PANELS[panel].src)}
        style={{ position: "absolute", left: place.x, top: place.y, width: place.w, height: place.h, maxWidth: "none", ...imageStyle }}
      />
      {children?.(place)}
    </div>
  );
}

/** A directional (horizontal or vertical) motion-blur filter, defined once per amount. */
export function DirectionalBlur({ id, x = 0, y = 0 }: { id: string; x?: number; y?: number }) {
  return (
    <svg width={0} height={0} style={{ position: "absolute" }}>
      <filter id={id} x="-20%" y="-20%" width="140%" height="140%">
        <feGaussianBlur stdDeviation={`${Math.max(0, x)} ${Math.max(0, y)}`} />
      </filter>
    </svg>
  );
}

/**
 * Character / background layer pairs cut by tools/segment.py (same pixel size as the panel).
 * The character (and the tornado behind Yuno) play their animated loops (tools/animate.py);
 * Asta's blade is its own layer and sways on its hilt.
 */
export const LAYERS = {
  sword: { fg: "sword-fg", bg: undefined, bgStill: "images/redink/sword-bg.png", panel: "sword", blade: { pivot: { x: 0.5, y: 0.64 } } },
  tornado: { fg: "tornado-fg", bg: "tornado-bg", bgStill: "images/redink/tornado-bg.png", panel: "tornado", blade: undefined },
} as const;

/**
 * A panel filmed in 2.5D: the background and the character are separate layers on one camera.
 * The character's zoom runs ahead of the background's, so a dolly opens real depth (parallax);
 * the background sits out of focus, and a soft bloom lifts the whites like the reference edits.
 */
export function LayeredPanel({
  layers,
  width,
  height,
  fx,
  fy,
  zoomBg,
  zoomFg,
  driftFg = { x: 0, y: 0 },
  blurBg = 5,
  blurFg = 0,
  bloom = 0.35,
  fgExtra,
  between,
  t,
  id,
}: {
  layers: keyof typeof LAYERS;
  width: number;
  height: number;
  fx: number;
  fy: number;
  zoomBg: number;
  zoomFg: number;
  driftFg?: { x: number; y: number };
  blurBg?: number;
  blurFg?: number;
  bloom?: number;
  fgExtra?: (place: ReturnType<typeof placeImage>) => ReactNode;
  /** drawn between the background and the character (wind, smoke) */
  between?: ReactNode;
  /** time, for the rig: hair and cloth flow, blinks, the blade's sway */
  t: number;
  /** unique per instance (filter ids) */
  id: string;
}) {
  const { fg, bg, bgStill, panel, blade } = LAYERS[layers];
  const back = placeImage(panel, width, height, { fx, fy, zoom: zoomBg });
  const front = placeImage(panel, width, height, { fx, fy, zoom: zoomFg });
  const at = (p: typeof back, extra = { x: 0, y: 0 }): CSSProperties => ({ position: "absolute", left: p.x + extra.x, top: p.y + extra.y, width: p.w, height: p.h, maxWidth: "none" });
  const fgPlace = { ...front, x: front.x + driftFg.x, y: front.y + driftFg.y };
  const fgSrc = animSrc(fg, t);
  const bgSrc = bg ? animSrc(bg, t) : staticFile(bgStill);
  // the blade sways on its hilt, slowly, with a quicker tremor of energy on top
  const sway = Math.sin(t * 2.2) * 1.6 + Math.sin(t * 7.3) * 0.35;
  return (
    <div data-rig={id} style={{ position: "relative", width, height, overflow: "hidden", background: "#f4f2ee" }}>
      <Img src={bgSrc} style={{ ...at(back), filter: blurBg > 0.3 ? `blur(${blurBg}px) brightness(0.96)` : undefined }} />
      {between}
      <Img src={fgSrc} style={{ ...at(front, driftFg), filter: blurFg > 0.3 ? `blur(${blurFg}px)` : undefined }} />
      {blade && (
        <div style={{ position: "absolute", left: fgPlace.x, top: fgPlace.y, width: fgPlace.w, height: fgPlace.h, rotate: `${sway}deg`, transformOrigin: `${blade.pivot.x * 100}% ${blade.pivot.y * 100}%` }}>
          <Img src={staticFile(PANELS.blade.src)} style={{ position: "absolute", inset: 0, width: fgPlace.w, height: fgPlace.h, maxWidth: "none", filter: `drop-shadow(0 0 ${22 + 18 * Math.sin(t * 9)}px rgba(226,38,43,0.75))` }} />
          {/* energy pouring off the blade's edge (measured on the sword panel) */}
          <BladeEnergy t={t} w={fgPlace.w} h={fgPlace.h} base={{ x: 0.53 * fgPlace.w, y: 0.6 * fgPlace.h }} tip={{ x: 0.92 * fgPlace.w, y: 0.03 * fgPlace.h }} scale={fgPlace.w / 1100} />
        </div>
      )}
      {fgExtra?.(fgPlace)}
      {bloom > 0 && (
        <Img src={fgSrc} style={{ ...at(front, driftFg), filter: "blur(22px) brightness(1.25)", mixBlendMode: "screen", opacity: bloom }} />
      )}
    </div>
  );
}
