import type { CSSProperties, ReactNode } from "react";
import { Img, staticFile } from "remotion";

import { track, type SpringConfig } from "../kit/spring";

/** Natural sizes of the prepared layers (tools/prepare.py output), in pixels. */
export const PANELS = {
  scream: { src: "images/panels/asta-scream.png", w: 1500, h: 2253 },
  sword: { src: "images/panels/sword.png", w: 1725, h: 2100 },
  blade: { src: "images/panels/sword-blade.png", w: 1725, h: 2100 },
  tornado: { src: "images/panels/tornado.png", w: 3312, h: 2346 },
  shock: { src: "images/panels/shock.png", w: 930, h: 1926 },
  yuno: { src: "images/panels/yuno-smile.png", w: 2568, h: 612 },
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
}: {
  panel: PanelName;
  width: number;
  height: number;
  shot: Shot;
  style?: CSSProperties;
  imageStyle?: CSSProperties;
  children?: (place: ReturnType<typeof placeImage>) => ReactNode;
}) {
  const place = placeImage(panel, width, height, shot);
  return (
    <div style={{ position: "relative", width, height, overflow: "hidden", background: "#f4f2ee", ...style }}>
      <Img
        src={staticFile(PANELS[panel].src)}
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
