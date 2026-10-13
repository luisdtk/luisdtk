import type { ReactNode } from "react";
import { AbsoluteFill, Img, staticFile } from "remotion";

import { step } from "../kit/spring";
import { clamp01, progress } from "../kit/time";
import { cue } from "./cues";
import { FocusLines, shake } from "./inkfx";
import { LayeredPanel, PanelView, PANELS } from "./panel";
import { color, easeInOut, easeOut, FRAME, lerp } from "./tokens";
import { Wind } from "./wind";

const W = FRAME.width;
const H = FRAME.height;
const CARD = 0.6; // card scale: each card is a full frame drawn at 60%
const GAP = 44;
const STRIDE = W * CARD + GAP;

/**
 * The opened folder's pages fly out into a sideways carousel. Every card is already moving the
 * 2.5D way (layers, dolly, focus lines), the carousel slides from the scream to the blade, and
 * the blade card grows to fill the frame, handing over to the manga scene on the same framing.
 */
const CARDS = ["scream", "sword", "tornado", "shock"] as const;
const FOCUS_END = 1; // the blade card

function CardContent({ name, t }: { name: (typeof CARDS)[number]; t: number }): ReactNode {
  const u = progress(t, cue.carousel, cue.manga - cue.carousel);
  const glow = 0.6 + 0.4 * Math.sin(t * 9);
  if (name === "sword") {
    // the manga scene's opening framing, approached by a short dolly so the handover is seamless
    return (
      <LayeredPanel
        layers="sword"
        width={W}
        height={H}
        fx={0.52}
        fy={0.36}
        zoomBg={lerp(1.0, 1.06, easeOut(u))}
        zoomFg={lerp(0.9, 1.0, easeOut(u))}
        driftFg={{ x: 30, y: 40 }}
        blurBg={3}
        fgExtra={(place) => (
          <Img src={staticFile(PANELS.blade.src)} style={{ position: "absolute", left: place.x, top: place.y, width: place.w, height: place.h, maxWidth: "none", opacity: 0.85, filter: `drop-shadow(0 0 ${18 + glow * 28}px rgba(226,38,43,0.75))` }} />
        )}
      />
    );
  }
  if (name === "tornado") {
    const e = easeInOut(u);
    return (
      <LayeredPanel
        layers="tornado"
        width={W}
        height={H}
        fx={lerp(0.18, 0.26, e)}
        fy={0.42}
        zoomBg={lerp(1.25, 1.1, e)}
        zoomFg={lerp(1.4, 1.1, e)}
        blurBg={4}
        bloom={0.3}
        between={
          <div style={{ position: "absolute", inset: 0, opacity: 0.8 }}>
            <Wind t={t} w={W} h={H} strength={1} />
          </div>
        }
      />
    );
  }
  if (name === "scream") {
    const invert = t > cue.carousel + 0.32 && t < cue.carousel + 0.39;
    return (
      <div style={{ position: "absolute", inset: 0, filter: invert ? "invert(1)" : undefined }}>
        <div style={{ position: "absolute", inset: 0, scale: `${1.05 + 0.18 * easeInOut(u)}` }}>
          <PanelView panel="scream" width={W} height={H} shot={{ fx: 0.5, fy: 0.42, zoom: 1.12 }} />
        </div>
        <FocusLines t={t} w={W} h={H} cx={W * 0.5} cy={H * 0.5} strength={0.55} />
      </div>
    );
  }
  const jolt = shake(t, 10, 5);
  return (
    <div style={{ position: "absolute", inset: 0 }}>
      <div style={{ position: "absolute", inset: 0, translate: `${jolt.x}px ${jolt.y}px`, scale: `${1.05 + 0.12 * u}` }}>
        <PanelView panel="shock" width={W} height={H} shot={{ fx: 0.5, fy: 0.42, zoom: 1.05 }} />
      </div>
      <FocusLines t={t} w={W} h={H} cx={W * 0.5} cy={H * 0.55} strength={0.6} />
    </div>
  );
}

export function MangaCarousel({ t, origin }: { t: number; origin: { x: number; y: number } }) {
  if (t < cue.carousel || t > cue.manga + 0.12) return null;

  // the carousel slides sideways: scream first, then on to the blade
  const focus = FOCUS_END * easeInOut(progress(t, cue.carousel + 0.35, cue.expand - cue.carousel - 0.4));
  const expand = easeInOut(progress(t, cue.expand, cue.manga - cue.expand));

  return (
    <AbsoluteFill style={{ perspective: 2200 }}>
      {CARDS.map((name, i) => {
        // each card launches out of the folder, staggered
        const launch = step(t - cue.carousel - i * 0.05, { stiffness: 190, damping: 22 });
        const d = i - focus;
        const side = Math.min(1, Math.abs(d));
        const focused = i === FOCUS_END;
        const slotX = W / 2 + d * STRIDE + (focused ? 0 : Math.sign(d) * expand * W);
        const slotScale = CARD * (1 - 0.12 * side) * (focused ? 1 + expand * (1 / CARD - 1) : 1);
        const x = lerp(origin.x, slotX, launch);
        const y = lerp(origin.y, H / 2, launch);
        const scale = lerp(0.12, slotScale, launch);
        return (
          <div
            key={name}
            style={{
              position: "absolute",
              left: x - W / 2,
              top: y - H / 2,
              width: W,
              height: H,
              scale: `${scale}`,
              rotate: `y ${-clamp01(launch) * Math.max(-1, Math.min(1, d)) * 16 * (1 - expand)}deg`,
              opacity: clamp01(launch * 2) * (focused ? 1 : 1 - expand),
              filter: !focused && side > 0.05 ? `brightness(${1 - 0.35 * side}) blur(${side * 2}px)` : undefined,
              borderRadius: 48 * (1 - expand),
              overflow: "hidden",
              boxShadow: `0 40px 90px rgba(0,0,0,0.7)${focused ? `, 0 0 0 ${4 * (1 - expand)}px ${color.red}` : ""}`,
              zIndex: focused ? 2 : 1,
            }}
          >
            <CardContent name={name} t={t} />
          </div>
        );
      })}
    </AbsoluteFill>
  );
}
