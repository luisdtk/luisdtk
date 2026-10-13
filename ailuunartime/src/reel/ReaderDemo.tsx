import type { CSSProperties, ReactNode } from "react";
import { AbsoluteFill, Img, staticFile } from "remotion";

import { step, track } from "../kit/spring";
import { clamp01, progress } from "../kit/time";
import { cue } from "./cues";
import { Embers, LiveMascot } from "./fx";
import { FocusLines, shake } from "./inkfx";
import { DirectionalBlur, LayeredPanel, PanelView, PANELS, shotAt, type ShotKey } from "./panel";
import { color, easeIn, easeInOut, easeOut, font, FRAME } from "./tokens";
import { LiveAsta } from "./rig";
import { Wind } from "./wind";

/**
 * Scene 4: a concept manga reader, built here as a real interface (not a screenshot).
 * It shows a page, turns Motion on, pushes into a panel, reveals the next one through
 * a mask, lifts the blade as a foreground layer, adds Asta's red energy, then scrolls on.
 */

const PHONE = { w: 720, h: 1480, x: (FRAME.width - 720) / 2, y: 200, bezel: 16, radius: 86 };
const SCREEN = { w: PHONE.w - PHONE.bezel * 2, h: PHONE.h - PHONE.bezel * 2 };
const VIEW = { x: 22, y: 200, w: SCREEN.w - 44, h: 1010 };
const GAP = 10;

/** The page layout inside the reader (viewport units): a strip, the tornado panel, and a row of two. */
const PAGE = (() => {
  const yunoH = Math.round((VIEW.w * PANELS.yuno.h) / PANELS.yuno.w);
  const tornadoH = Math.round((VIEW.w * PANELS.tornado.h) / PANELS.tornado.w);
  const rowY = yunoH + GAP + tornadoH + GAP;
  return {
    yuno: { x: 0, y: 0, w: VIEW.w, h: yunoH },
    tornado: { x: 0, y: yunoH + GAP, w: VIEW.w, h: tornadoH },
    shock: { x: 0, y: rowY, w: (VIEW.w - GAP) * 0.42, h: VIEW.h - rowY },
    scream: { x: (VIEW.w - GAP) * 0.42 + GAP, y: rowY, w: (VIEW.w - GAP) * 0.58, h: VIEW.h - rowY },
  };
})();

/** A panel that wakes up as horizontal slices kicking sideways and snapping back. */
function SliceWake({ t, start, w, h, children }: { t: number; start: number; w: number; h: number; children: ReactNode }) {
  const count = 7;
  const sh = h / count;
  return (
    <>
      {Array.from({ length: count }, (_, i) => {
        const u = progress(t, start + i * 0.03, 0.32);
        const kick = Math.sin(u * Math.PI) * (i % 2 ? 1 : -1) * w * 0.22;
        return (
          <div key={i} style={{ position: "absolute", left: 0, top: i * sh, width: w, height: sh + 1, overflow: "hidden", translate: `${kick}px 0` }}>
            <div style={{ position: "absolute", left: 0, top: -i * sh, width: w, height: h }}>{children}</div>
          </div>
        );
      })}
    </>
  );
}

function Box({ r, children, style }: { r: { x: number; y: number; w: number; h: number }; children: ReactNode; style?: CSSProperties }) {
  return <div style={{ position: "absolute", left: r.x, top: r.y, width: r.w, height: r.h, overflow: "hidden", ...style }}>{children}</div>;
}

function Toggle({ on }: { on: number }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
      <span style={{ fontFamily: font.mono, fontSize: 18, letterSpacing: "0.08em", color: on > 0.5 ? color.white : color.muted }}>MOTION</span>
      <div style={{ width: 74, height: 40, borderRadius: 20, background: on > 0 ? `rgba(226,38,43,${0.25 + on * 0.75})` : color.line, position: "relative" }}>
        <div style={{ position: "absolute", top: 4, left: 4 + on * 34, width: 32, height: 32, borderRadius: 16, background: color.white, boxShadow: "0 2px 6px rgba(0,0,0,0.4)" }} />
      </div>
    </div>
  );
}

function Screen({ t }: { t: number }) {
  const on = step(t - cue.motionOn, { stiffness: 420, damping: 30 });
  // panel life once Motion is on: a lift off the page, impact pulses, shakes, one inverted impact frame
  const wake = easeOut(progress(t, cue.motionOn + 0.1, 0.4));
  const lifted = (i: number): CSSProperties => ({
    scale: `${1 + 0.025 * wake}`,
    translate: `${(i % 2 ? 1 : -1) * 4 * wake}px ${-6 * wake}px`,
    boxShadow: wake > 0 ? `0 ${18 * wake}px ${40 * wake}px rgba(0,0,0,0.55)` : undefined,
    zIndex: 1 + i,
  });
  const pulse = (at: number) => Math.max(0, 1 - Math.abs(t - at) / 0.18);
  const invertAt = (at: number) => t > at && t < at + 0.07;
  const shockShake = shake(t, 5 * on * (0.4 + pulse(cue.motionOn + 0.25)), 3);
  const screamShake = shake(t, 4 * on * (0.3 + pulse(cue.motionOn + 0.4)), 7);
  const live = on > 0.5;

  // camera inside the viewport: the page, then into the tornado panel
  const pageZoom = Math.exp(track(t, [
    [cue.reader, 0],
    [cue.pushIn, Math.log(1.55)],
  ], { stiffness: 120, damping: 24 }));
  const focus = { x: PAGE.tornado.x + PAGE.tornado.w * 0.55, y: PAGE.tornado.y + PAGE.tornado.h * 0.5 };
  const pageX = VIEW.w / 2 - focus.x * pageZoom;
  const pageY = VIEW.h / 2 - focus.y * pageZoom;
  const pushU = easeOut(progress(t, cue.pushIn, 0.6));
  const camX = pageX * pushU + 0 * (1 - pushU);
  const camY = pageY * pushU + 0 * (1 - pushU);

  // the next panel opens through an expanding mask from the blade
  const reveal = easeInOut(progress(t, cue.maskReveal, 0.45));
  const revealR = reveal * Math.hypot(VIEW.w, VIEW.h) * 0.52;
  const bladeShot = shotAt(t, [
    [cue.maskReveal, 0.47, 0.27, 1.5],
    [cue.foreground, 0.54, 0.4, 1.12],
  ] as ShotKey[]);
  const lift = easeOut(progress(t, cue.foreground, 0.5));
  const energy = easeOut(progress(t, cue.readerEnergy, 0.3));
  const glow = 0.6 + 0.4 * Math.sin(t * 12);

  // then the reader scrolls to the next panel, with vertical motion blur
  const scroll = easeInOut(progress(t, cue.nextPanel, 0.36));
  const scrollBlur = Math.sin(scroll * Math.PI) * 26;
  const screamShot = shotAt(t, [
    [cue.nextPanel, 0.5, 0.35, 1.3],
    [cue.nextPanel + 0.4, 0.5, 0.42, 1.08],
  ] as ShotKey[]);

  const pageNumber = 12 + (t >= cue.nextPanel + 0.18 ? 1 : 0);
  const active = t < cue.maskReveal + 0.2 ? 0 : t < cue.nextPanel + 0.18 ? 1 : 2;
  const progressBar = 0.22 + 0.06 * clamp01((t - cue.reader) / 0.6) + 0.05 * easeOut(progress(t, cue.maskReveal, 0.4)) + 0.06 * easeOut(progress(t, cue.nextPanel, 0.4));
  const dot = 0.5 + 0.5 * Math.sin(t * 10);

  return (
    <div style={{ position: "absolute", inset: 0, background: "#0d0d0d", borderRadius: PHONE.radius - PHONE.bezel, overflow: "hidden", fontFamily: font.ui, color: color.white }}>
      <DirectionalBlur id="scroll-blur" y={scrollBlur} />

      {/* status bar */}
      <div style={{ position: "absolute", top: 26, left: 56, right: 56, display: "flex", justifyContent: "space-between", fontFamily: font.ui, fontWeight: 600, fontSize: 24 }}>
        <span>9:41</span>
        <span style={{ fontFamily: font.mono, fontWeight: 500, fontSize: 16, letterSpacing: "0.14em", color: color.muted, paddingTop: 4 }}>CONCEPT</span>
        <span style={{ display: "flex", gap: 6, alignItems: "flex-end", paddingBottom: 4 }}>
          {[10, 14, 18, 22].map((h) => (
            <span key={h} style={{ width: 6, height: h, borderRadius: 2, background: color.white }} />
          ))}
        </span>
      </div>

      {/* header */}
      <div style={{ position: "absolute", top: 84, left: 22, right: 22, height: 96, display: "flex", alignItems: "center", gap: 16 }}>
        <LiveMascot t={t} size={84} happyAt={cue.motionOn} />
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
          <span style={{ fontWeight: 600, fontSize: 32, letterSpacing: "-0.01em" }}>Black Clover</span>
          <span style={{ fontFamily: font.mono, fontSize: 19, letterSpacing: "0.06em", color: color.muted }}>CH. 03 · WIZARD KING</span>
        </div>
        <Toggle on={on} />
      </div>

      {/* the reading viewport */}
      <div style={{ position: "absolute", left: VIEW.x, top: VIEW.y, width: VIEW.w, height: VIEW.h, borderRadius: 26, overflow: "hidden", background: color.ink, boxShadow: live ? `0 0 0 2px rgba(226,38,43,${0.35 + 0.25 * glow * energy})` : `0 0 0 1px ${color.line}` }}>
        {/* page: strip, tornado, row of two (scrolls away with the camera) */}
        <div style={{ position: "absolute", left: 0, top: 0, width: VIEW.w, height: VIEW.h, background: color.ink, transformOrigin: "0 0", translate: `${camX}px ${camY}px`, scale: `${1 + (pageZoom - 1) * pushU}` }}>
          {/* with Motion on, every panel wakes up its own way and lifts off the page */}
          <Box r={PAGE.yuno} style={lifted(0)}>
            <PanelView panel="yuno" width={PAGE.yuno.w} height={PAGE.yuno.h} shot={{ fx: 0.5 + 0.12 * on * Math.sin(t * 0.9), fy: 0.45, zoom: 1 + 0.35 * on }} />
          </Box>
          <Box r={PAGE.tornado} style={lifted(1)}>
            <SliceWake t={t} start={cue.motionOn} w={PAGE.tornado.w} h={PAGE.tornado.h}>
              <PanelView panel="tornado" width={PAGE.tornado.w} height={PAGE.tornado.h} shot={{ fx: 0.55 + 0.03 * on * Math.sin(t * 1.6), fy: 0.5, zoom: 1 + 0.08 * on }}  />
              <Wind t={t} w={PAGE.tornado.w} h={PAGE.tornado.h} strength={on} />
            </SliceWake>
          </Box>
          <Box r={PAGE.shock} style={lifted(2)}>
            <div style={{ position: "absolute", inset: 0, translate: `${shockShake.x}px ${shockShake.y}px`, scale: `${1 + 0.06 * pulse(cue.motionOn + 0.25)}` }}>
              <PanelView panel="shock" width={PAGE.shock.w} height={PAGE.shock.h} shot={{ fx: 0.5, fy: 0.42, zoom: 1.05 + 0.1 * on }} flow={on > 0 ? { t, anim: "shock" } : undefined} />
            </div>
            <FocusLines t={t} w={PAGE.shock.w} h={PAGE.shock.h} cx={PAGE.shock.w * 0.5} cy={PAGE.shock.h * 0.55} strength={on * 0.85} count={44} inner={0.42} />
          </Box>
          <Box r={PAGE.scream} style={lifted(3)}>
            <div style={{ position: "absolute", inset: 0, translate: `${screamShake.x}px ${screamShake.y}px`, scale: `${1 + 0.1 * pulse(cue.motionOn + 0.4)}`, filter: invertAt(cue.motionOn + 0.42) ? "invert(1)" : undefined }}>
              <PanelView panel="scream" width={PAGE.scream.w} height={PAGE.scream.h} shot={{ fx: 0.5, fy: 0.38, zoom: 1.2 + 0.12 * on }} flow={on > 0 ? { t, anim: "scream" } : undefined} />
            </div>
            <FocusLines t={t + 0.04} w={PAGE.scream.w} h={PAGE.scream.h} cx={PAGE.scream.w * 0.5} cy={PAGE.scream.h * 0.5} strength={on * 0.8} count={50} inner={0.45} />
          </Box>
        </div>

        {/* next panel: the blade, opened through a circular mask */}
        {reveal > 0 && (
          <div style={{ position: "absolute", inset: 0, clipPath: `circle(${revealR}px at 50% 50%)`, translate: `0 ${-scroll * VIEW.h}px`, filter: scrollBlur > 0.5 ? "url(#scroll-blur)" : undefined }}>
            {/* the rigged blade panel: Asta lifts off the page as a layer, his hair and cape flow, the blade sways, he blinks */}
            <LayeredPanel
              layers="sword"
              t={t}
              id="reader-sword"
              width={VIEW.w}
              height={VIEW.h}
              fx={bladeShot.fx}
              fy={bladeShot.fy}
              zoomBg={bladeShot.zoom}
              zoomFg={bladeShot.zoom * (1 + lift * 0.04)}
              driftFg={{ x: lift * 14, y: -lift * 12 }}
              blurBg={lift * 3}
              bloom={0.15 + energy * glow * 0.2}
            />
            {/* the mask's red rim while it opens */}
            {reveal > 0 && reveal < 1 && (
              <svg width={VIEW.w} height={VIEW.h} style={{ position: "absolute", inset: 0 }}>
                <circle cx={VIEW.w / 2} cy={VIEW.h / 2} r={Math.max(0, revealR - 4)} fill="none" stroke={color.red} strokeWidth={8} opacity={1 - reveal * 0.6} style={{ filter: "drop-shadow(0 0 12px rgba(226,38,43,0.9))" }} />
              </svg>
            )}
            <Embers t={t} start={cue.readerEnergy} end={cue.nextPanel + 0.3} count={22} seed={31} area={{ x: 180, y: 120, w: 440, h: 820 }} rise={260} size={8} />
          </div>
        )}

        {/* scrolled in: Asta's scream, the panel after */}
        {scroll > 0 && (
          <div style={{ position: "absolute", inset: 0, translate: `0 ${(1 - scroll) * VIEW.h}px`, filter: scrollBlur > 0.5 ? "url(#scroll-blur)" : undefined }}>
            <div style={{ position: "absolute", inset: 0, filter: invertAt(cue.nextPanel + 0.32) ? "invert(1)" : undefined }}>
              <PanelView panel="scream" width={VIEW.w} height={VIEW.h} shot={screamShot} flow={{ t, anim: "scream" }} />
              <FocusLines t={t} w={VIEW.w} h={VIEW.h} cx={VIEW.w * 0.5} cy={VIEW.h * 0.48} strength={0.85} count={70} />
            </div>
          </div>
        )}
      </div>

      {/* reading status */}
      <div style={{ position: "absolute", top: VIEW.y + VIEW.h + 22, left: 26, right: 26, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 16px", borderRadius: 999, background: live ? "rgba(226,38,43,0.14)" : color.surface, border: `1px solid ${live ? "rgba(226,38,43,0.5)" : color.line}` }}>
          <span style={{ width: 12, height: 12, borderRadius: 6, background: live ? color.red : color.muted, opacity: live ? 0.5 + 0.5 * dot : 1, boxShadow: live ? `0 0 10px ${color.red}` : "none" }} />
          <span style={{ fontFamily: font.mono, fontSize: 18, letterSpacing: "0.1em", color: live ? color.white : color.muted }}>{live ? "ANIMATING" : "STATIC"}</span>
        </div>
        <span style={{ fontFamily: font.mono, fontSize: 20, letterSpacing: "0.06em", color: color.muted }}>
          PAGE <span style={{ color: color.white }}>{pageNumber}</span> / 48
        </span>
      </div>

      {/* panel strip */}
      <div style={{ position: "absolute", top: VIEW.y + VIEW.h + 84, left: 26, display: "flex", gap: 14 }}>
        {(["tornado", "sword", "scream", "shock"] as const).map((name, i) => (
          <div key={name} style={{ width: 118, height: 86, borderRadius: 12, overflow: "hidden", outline: i === active ? `3px solid ${color.red}` : `1px solid ${color.line}`, outlineOffset: i === active ? 2 : 0, opacity: i === active ? 1 : 0.55 }}>
            <PanelView panel={name} width={118} height={86} shot={{ fx: 0.5, fy: 0.4, zoom: 1 }} />
          </div>
        ))}
      </div>

      {/* chapter progress */}
      <div style={{ position: "absolute", top: VIEW.y + VIEW.h + 196, left: 26, right: 26, height: 6, borderRadius: 3, background: color.line }}>
        <div style={{ width: `${progressBar * 100}%`, height: "100%", borderRadius: 3, background: color.red, boxShadow: `0 0 12px rgba(226,38,43,0.7)` }} />
      </div>
    </div>
  );
}

export function ReaderDemo({ t }: { t: number }) {
  if (t < cue.reader - 0.1 || t > cue.reaction + 0.1) return null;

  // the phone rises in with a tilt that settles
  const rise = step(t - cue.reader, { stiffness: 150, damping: 21 });
  const tilt = (1 - rise) * 28;

  // outer camera: a push toward the viewport, a settle, then a dive into the panel
  const zoom = Math.exp(track(t, [
    [cue.reader, 0],
    [cue.pushIn, Math.log(1.1)],
    [cue.nextPanel, Math.log(1.04)],
  ], { stiffness: 120, damping: 24 }));
  const dive = easeIn(progress(t, cue.readerOut, cue.reaction - cue.readerOut));
  const diveZoom = 1 + dive * 2.6;
  const focusY = PHONE.y + PHONE.bezel + VIEW.y + VIEW.h / 2;

  // Asta, red and black, steps out of the phone while the blade lifts
  const pop = step(t - cue.foreground, { stiffness: 200, damping: 20 });
  const popOut = easeIn(progress(t, cue.nextPanel - 0.05, 0.25));

  return (
    <AbsoluteFill style={{ background: color.bg, overflow: "hidden" }}>
      <AbsoluteFill style={{ background: `radial-gradient(ellipse 60% 45% at 50% 55%, rgba(226,38,43,${0.16 * rise}) 0%, rgba(10,10,10,0) 70%)` }} />
      <Embers t={t} start={cue.reader} end={cue.readerOut} count={16} seed={41} area={{ x: 0, y: 300, w: FRAME.width, h: 1400 }} rise={180} size={6} intensity={0.5} />

      <AbsoluteFill style={{ perspective: 1800, transformOrigin: `50% ${focusY}px`, scale: `${zoom * diveZoom}` }}>
        <div
          style={{
            position: "absolute",
            left: PHONE.x,
            top: PHONE.y + (1 - rise) * 1100,
            width: PHONE.w,
            height: PHONE.h,
            borderRadius: PHONE.radius,
            background: "linear-gradient(160deg, #2a2a2a, #121212 40%, #1d1d1d)",
            boxShadow: "0 60px 140px rgba(0,0,0,0.7), inset 0 0 0 2px #333",
            rotate: `x ${tilt}deg`,
            transformOrigin: "50% 100%",
          }}
        >
          <div style={{ position: "absolute", left: PHONE.bezel, top: PHONE.bezel, width: SCREEN.w, height: SCREEN.h }}>
            <Screen t={t} />
          </div>
          {/* dynamic island */}
          <div style={{ position: "absolute", top: PHONE.bezel + 14, left: PHONE.w / 2 - 70, width: 140, height: 38, borderRadius: 19, background: "#000" }} />
        </div>

        {pop > 0 && popOut < 1 && (
          <LiveAsta
            t={t}
            size={600}
            phase={0.4}
            style={{
              left: 600 + (1 - pop) * 140 + popOut * 260,
              top: 1010 + (1 - pop) * 110,
              opacity: clamp01(pop * 2) * (1 - popOut),
              filter: "drop-shadow(0 0 30px rgba(226,38,43,0.5)) drop-shadow(0 30px 40px rgba(0,0,0,0.6))",
            }}
          />
        )}
      </AbsoluteFill>

      {dive > 0.6 && <AbsoluteFill style={{ background: color.white, opacity: (dive - 0.6) / 0.4 }} />}
    </AbsoluteFill>
  );
}
