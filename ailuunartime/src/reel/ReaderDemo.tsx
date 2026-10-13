import { AbsoluteFill, Img, staticFile } from "remotion";

import { step, track } from "../kit/spring";
import { clamp01, progress } from "../kit/time";
import { cue } from "./cues";
import { Embers, LiveMascot } from "./fx";
import { DirectionalBlur, LayeredPanel, PanelView, PANELS, shotAt, type ShotKey } from "./panel";
import { color, easeIn, easeInOut, easeOut, font, FRAME } from "./tokens";
import { BladeEnergy } from "./aura";
import { ClaudeNotification } from "./Notification";
import { animSrc, LiveAsta } from "./rig";

/**
 * Scene 4: a concept manga reader, built here as a real interface (not a screenshot).
 * Motion turns on and the three pages of the chapter come alive (tools/animate_pages.py): the
 * reader scrolls softly down through them while they play, then the blade panel opens through
 * a mask with red energy pouring off the sword.
 */

const PHONE = { w: 720, h: 1480, x: (FRAME.width - 720) / 2, y: 200, bezel: 16, radius: 86 };
const SCREEN = { w: PHONE.w - PHONE.bezel * 2, h: PHONE.h - PHONE.bezel * 2 };
const VIEW = { x: 22, y: 200, w: SCREEN.w - 44, h: 1010 };
const GAP = 10;

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

/** The three pages of the chapter, stacked as one long strip the reader scrolls down. */
const PAGES = ["page-4-birds-yuno", "page-5-flock", "page-6-dash"] as const;
const PH = Math.round(VIEW.w * 1.5); // pages are 2:3
const STRIP_GAP = 24;
const pageTop = (i: number) => i * (PH + STRIP_GAP);

/** Camera over the strip: [time, focus x (0..1 of the page), page index + focus y (0..1), zoom]. */
const CAMERA: readonly (readonly [number, number, number, number])[] = [
  [cue.reader, 0.5, 0.5, 1.0],
  [cue.pushIn, 0.3, 0.5, 1.55], // Yuno, and the birds above him
  [cue.pushIn + 0.45, 0.32, 0.28, 1.5], // drift up to the big bird
  [cue.page5, 0.52, 1.22, 1.5], // down: the flock pecking Asta
  [cue.page5 + 0.55, 0.5, 1.32, 1.6],
  [cue.page6, 0.66, 2.72, 1.55], // down: the dash, birds diving at him
  [cue.page6 + 0.5, 0.62, 2.7, 1.7],
];
const scrollSpring = { stiffness: 70, damping: 17 }; // soft, unhurried: a thumb flick that settles

function cameraAt(t: number) {
  const fx = track(t, CAMERA.map(([k, x]) => [k, x] as const), scrollSpring);
  const fy = track(t, CAMERA.map(([k, , y]) => [k, y] as const), scrollSpring);
  const z = Math.exp(track(t, CAMERA.map(([k, , , z]) => [k, Math.log(z)] as const), scrollSpring));
  const page = Math.floor(fy);
  const sy = pageTop(page) + (fy - page) * PH;
  return { x: VIEW.w / 2 - fx * VIEW.w * z, y: VIEW.h / 2 - sy * z, z, fy };
}

function Screen({ t }: { t: number }) {
  const on = step(t - cue.motionOn, { stiffness: 420, damping: 30 });
  const live = on > 0.5;

  // the strip scrolls down, softly; a whisper of vertical blur only while it moves fast
  const cam = cameraAt(t);
  const v = Math.abs(cameraAt(t + 1 / 60).fy - cameraAt(t - 1 / 60).fy) * 30 * PH;
  const scrollBlur = Math.min(8, v / 900);
  const pageIndex = Math.min(2, Math.max(0, Math.round(cam.fy - 0.35)));

  // the blade panel opens through an expanding mask, red energy pouring off the sword
  const reveal = easeInOut(progress(t, cue.maskReveal, 0.45));
  const revealR = reveal * Math.hypot(VIEW.w, VIEW.h) * 0.52;
  const lift = easeOut(progress(t, cue.foreground, 0.5));
  const energy = easeOut(progress(t, cue.readerEnergy, 0.3));
  const glow = 0.6 + 0.4 * Math.sin(t * 12);
  void glow;

  const active = reveal > 0.5 ? 3 : pageIndex;
  const pageNumber = 12 + active;
  const progressBar = 0.2 + 0.07 * active + 0.04 * clamp01((t - cue.reader) / 0.6);
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

      {/* a notification drops in once Motion is on */}
      <div style={{ position: "absolute", left: 14, right: 14, top: 14, height: 0 }}>
        <ClaudeNotification t={t} at={cue.motionOn + 0.35} width={SCREEN.w - 28} />
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

      {/* the reading viewport: three pages, scrolled downward; every page plays its animation as it passes */}
      <div style={{ position: "absolute", left: VIEW.x, top: VIEW.y, width: VIEW.w, height: VIEW.h, borderRadius: 26, overflow: "hidden", background: color.ink, boxShadow: live ? `0 0 0 2px rgba(226,38,43,${0.35 + 0.25 * glow * energy})` : `0 0 0 1px ${color.line}` }}>
        <div style={{ position: "absolute", left: 0, top: 0, width: VIEW.w, height: pageTop(3), transformOrigin: "0 0", translate: `${cam.x}px ${cam.y}px`, scale: `${cam.z}`, filter: scrollBlur > 0.6 ? "url(#scroll-blur)" : undefined }}>
          {PAGES.map((name, i) => (
            <Img
              key={name}
              src={on > 0 ? animSrc(name, t, i * 0.37) : staticFile(`images/redink/${name}.png`)}
              style={{ position: "absolute", left: 0, top: pageTop(i), width: VIEW.w, height: PH, background: color.paper }}
            />
          ))}
        </div>

        {/* last: the blade panel, opened through a circular mask */}
        {reveal > 0 && (
          <div style={{ position: "absolute", inset: 0, clipPath: `circle(${revealR}px at 50% 50%)` }}>
            {/* the chapter cover, alive: Asta and Yuno with the black-and-red blade (tools/cover.py, animate_pages.py) */}
            {(() => {
              const zoom = 1.04 + 0.08 * lift;
              const cw = VIEW.h / 1.5 > VIEW.w ? VIEW.h / 1.5 : VIEW.w;
              const ch = cw * 1.5;
              const w = cw * zoom;
              const h = ch * zoom;
              const x = (VIEW.w - w) / 2;
              const y = (VIEW.h - h) / 2 - 20 * lift;
              return (
                <div style={{ position: "absolute", left: x, top: y, width: w, height: h }}>
                  <Img src={animSrc("cover", t)} style={{ position: "absolute", inset: 0, width: w, height: h }} />
                  {/* the light around Yuno's grimoire breathes */}
                  <div style={{ position: "absolute", left: 0.42 * w, top: 0.08 * h, width: 0.5 * w, height: 0.36 * h, borderRadius: "50%", background: "radial-gradient(circle, rgba(255,255,255,0.5), rgba(255,255,255,0) 65%)", mixBlendMode: "screen", opacity: 0.35 + 0.35 * Math.sin(t * 4) }} />
                  <BladeEnergy t={t} w={w} h={h} base={{ x: 0.6 * w, y: 0.44 * h }} tip={{ x: 0.04 * w, y: 0.06 * h }} strength={energy} scale={w / 1100} />
                </div>
              );
            })()}
            {reveal < 1 && (
              <svg width={VIEW.w} height={VIEW.h} style={{ position: "absolute", inset: 0 }}>
                <circle cx={VIEW.w / 2} cy={VIEW.h / 2} r={Math.max(0, revealR - 4)} fill="none" stroke={color.red} strokeWidth={8} opacity={1 - reveal * 0.6} style={{ filter: "drop-shadow(0 0 12px rgba(226,38,43,0.9))" }} />
              </svg>
            )}
            <Embers t={t} start={cue.readerEnergy} end={cue.readerOut + 0.3} count={26} seed={31} area={{ x: 180, y: 120, w: 440, h: 820 }} rise={260} size={8} />
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

      {/* page strip */}
      <div style={{ position: "absolute", top: VIEW.y + VIEW.h + 84, left: 26, display: "flex", gap: 14 }}>
        {[...PAGES, "sword"].map((name, i) => (
          <div key={name} style={{ width: 118, height: 86, borderRadius: 12, overflow: "hidden", outline: i === active ? `3px solid ${color.red}` : `1px solid ${color.line}`, outlineOffset: i === active ? 2 : 0, opacity: i === active ? 1 : 0.55, background: color.ink }}>
            {name === "sword" ? (
              <PanelView panel="sword" width={118} height={86} shot={{ fx: 0.5, fy: 0.4, zoom: 1 }} />
            ) : (
              <Img src={staticFile(`images/redink/${name}.png`)} style={{ width: 118, height: 177, marginTop: -30 }} />
            )}
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
  if (t < cue.reader - 0.1 || t > cue.reaction + 0.2) return null;

  // the phone rises in with a tilt that settles
  const rise = step(t - cue.reader, { stiffness: 150, damping: 21 });
  const tilt = (1 - rise) * 28;

  // outer camera: a push toward the viewport, a settle; then the whole screen scrolls up and away
  const zoom = Math.exp(track(t, [
    [cue.reader, 0],
    [cue.pushIn, Math.log(1.1)],
    [cue.maskReveal, Math.log(1.04)],
  ], { stiffness: 120, damping: 24 }));
  const leave = easeInOut(progress(t, cue.readerOut, cue.reaction - cue.readerOut + 0.15));
  const focusY = PHONE.y + PHONE.bezel + VIEW.y + VIEW.h / 2;

  // Asta, red and black, steps out of the phone while the blade lifts
  const pop = step(t - cue.foreground, { stiffness: 200, damping: 20 });
  const popOut = easeIn(progress(t, cue.readerOut - 0.05, 0.25));

  return (
    <AbsoluteFill style={{ background: color.bg, overflow: "hidden", translate: `0 ${-leave * FRAME.height}px` }}>
      <AbsoluteFill style={{ background: `radial-gradient(ellipse 60% 45% at 50% 55%, rgba(226,38,43,${0.16 * rise}) 0%, rgba(10,10,10,0) 70%)` }} />
      <Embers t={t} start={cue.reader} end={cue.readerOut} count={16} seed={41} area={{ x: 0, y: 300, w: FRAME.width, h: 1400 }} rise={180} size={6} intensity={0.5} />

      <AbsoluteFill style={{ perspective: 1800, transformOrigin: `50% ${focusY}px`, scale: `${zoom}` }}>
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
              filter: "grayscale(1) contrast(1.15) brightness(1.1) drop-shadow(0 0 30px rgba(226,38,43,0.5)) drop-shadow(0 30px 40px rgba(0,0,0,0.6))",
            }}
          />
        )}
      </AbsoluteFill>

    </AbsoluteFill>
  );
}
