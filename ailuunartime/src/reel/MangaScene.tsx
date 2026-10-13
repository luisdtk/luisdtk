import { AbsoluteFill, Img, staticFile } from "remotion";

import { step } from "../kit/spring";
import { clamp01, progress } from "../kit/time";
import { cue } from "./cues";
import { Embers } from "./fx";
import { FocusLines } from "./inkfx";
import { DirectionalBlur, LayeredPanel, PanelView, PANELS, shotAt, snappy } from "./panel";
import { color, easeIn, easeInOut, easeOut, FRAME, lerp, seeded } from "./tokens";
import { Wind } from "./wind";

const W = FRAME.width;
const H = FRAME.height;

/**
 * Scene 2, after the manga-to-anime edits the user referenced: the camera never stops,
 * characters are cut from their backgrounds (tools/segment.py) so a dolly opens real depth,
 * backgrounds sit out of focus under a soft bloom, and shots hand over with focus pulls and
 * blurred pans instead of cuts.
 */

/** Red energy rays bursting from a point behind Asta. */
function Burst({ t, start, cx, cy }: { t: number; start: number; cx: number; cy: number }) {
  const u = progress(t, start, 0.5);
  if (u <= 0) return null;
  const grow = easeOut(u);
  const rays = 28;
  return (
    <svg width={W} height={H} style={{ position: "absolute", inset: 0 }}>
      {Array.from({ length: rays }, (_, i) => {
        const a = (i / rays) * Math.PI * 2 + (i % 2) * 0.05;
        const r0 = 120 + grow * 140;
        const len = (i % 3 === 0 ? 1300 : 800) * grow;
        const wobble = 0.8 + 0.2 * Math.sin(t * 14 + i);
        return (
          <line
            key={i}
            x1={cx + Math.cos(a) * r0}
            y1={cy + Math.sin(a) * r0}
            x2={cx + Math.cos(a) * (r0 + len * wobble)}
            y2={cy + Math.sin(a) * (r0 + len * wobble)}
            stroke={i % 4 === 0 ? color.white : color.red}
            strokeWidth={i % 3 === 0 ? 10 : 4}
            strokeLinecap="round"
            opacity={(i % 4 === 0 ? 0.35 : 0.75) * (0.6 + 0.4 * Math.sin(t * 9 + i * 1.7))}
          />
        );
      })}
    </svg>
  );
}

/** Out-of-focus red sparks drifting in front of the lens: depth in front of the character. */
function Bokeh({ t, start, end, seed }: { t: number; start: number; end: number; seed: number }) {
  const fade = clamp01((t - start) / 0.3) * (1 - clamp01((t - end) / 0.3));
  if (fade <= 0) return null;
  const rand = seeded(seed);
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      {Array.from({ length: 9 }, (_, i) => {
        const size = 40 + rand() * 110;
        const x = rand() * W + Math.sin(t * 0.8 + i) * 40 - (t - start) * (30 + rand() * 60);
        const y = rand() * H - (t - start) * (40 + rand() * 50);
        return <div key={i} style={{ position: "absolute", left: x, top: y, width: size, height: size, borderRadius: "50%", background: color.red, filter: `blur(${size * 0.28}px)`, opacity: (0.35 + rand() * 0.3) * fade }} />;
      })}
    </AbsoluteFill>
  );
}

/** Soft light from the top of frame, like sun haze over the page. */
function Haze({ amount }: { amount: number }) {
  return <AbsoluteFill style={{ background: `radial-gradient(ellipse 90% 45% at 70% 0%, rgba(255,255,255,${0.35 * amount}) 0%, rgba(255,255,255,0) 70%)`, mixBlendMode: "screen", pointerEvents: "none" }} />;
}

/** Red pillars rising from the floor. */
function Pillars({ t, start }: { t: number; start: number }) {
  const rand = seeded(77);
  return (
    <>
      {Array.from({ length: 14 }, (_, i) => {
        const x = (i / 14) * W + rand() * 20;
        const w = W / 14 - 10 - rand() * 18;
        const hMax = 420 + rand() * 760;
        const u = easeOut(progress(t, start + rand() * 0.25, 0.4));
        const sway = Math.sin(t * 3 + i) * 6;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: x,
              bottom: 0,
              width: w,
              height: hMax * u + sway,
              background: `linear-gradient(180deg, ${color.red}, ${color.redDeep})`,
              clipPath: "polygon(0 6%, 50% 0, 100% 6%, 100% 100%, 0 100%)",
              opacity: 0.9,
            }}
          />
        );
      })}
    </>
  );
}

export function MangaScene({ t }: { t: number }) {
  if (t < cue.manga - 0.05 || t > cue.reader + 0.12) return null;

  const open = progress(t, cue.manga - 0.05, 0.1);

  // 1) the scream: a slow push that never stops, a breath of focus lines, one impact frame
  const screamShot = shotAt(t, [
    [cue.manga - 0.1, 0.5, 0.42, 1.42],
    [cue.manga, 0.5, 0.4, 1.12],
  ], snappy);
  const screamPush = 1 + 0.12 * easeInOut(progress(t, cue.manga, cue.swordWipe - cue.manga));
  const impactFrame = t > cue.manga + 0.36 && t < cue.manga + 0.43;
  const focus = easeOut(progress(t, cue.manga + 0.05, 0.2)) * 0.55;

  // 1 -> 2: a blurred pan, the scream slides out left as the blade shot slides in
  const pan = easeInOut(progress(t, cue.swordWipe - 0.18, 0.42));
  const panBlur = Math.sin(pan * Math.PI) * 38;

  // 2) the blade in 2.5D: a slow dolly in, Asta and his sword run ahead of the colosseum
  const swordE = easeInOut(progress(t, cue.swordWipe, cue.tornado - cue.swordWipe));
  const glow = 0.6 + 0.4 * Math.sin(t * 9);

  // 2 -> 3: a focus pull, the blade shot melts out of focus while the wind shot comes into it
  const pull = easeInOut(progress(t, cue.tornado - 0.22, 0.44));

  // 3) the wind in 2.5D: the camera eases back, Yuno holds while the tornado drifts behind him
  const windE = easeOut(progress(t, cue.tornado - 0.2, cue.astaSlam - cue.tornado + 0.2));

  // 4) Asta: a red sun and pillars at their own depths, Asta in front
  const sun = easeOut(progress(t, cue.astaSlam - 0.05, 0.4));
  const slam = step(t - cue.astaSlam - 0.08, { stiffness: 230, damping: 19 });
  const flash = Math.max(0, 1 - Math.abs(t - cue.astaSlam - 0.1) / 0.07);
  const drift = Math.max(0, t - cue.astaSlam);
  const enterRed = easeOut(progress(t, cue.astaSlam - 0.1, 0.18));

  // exit: whip pan left into the reader
  const out = easeIn(progress(t, cue.mangaOut, 0.14));
  const outBlur = out * 60;

  const showScream = t < cue.swordWipe + 0.3;
  const showSword = t >= cue.swordWipe - 0.2 && t < cue.tornado + 0.3;
  const showWind = t >= cue.tornado - 0.25 && t < cue.astaSlam + 0.2;
  const showAsta = t >= cue.astaSlam - 0.12;

  return (
    <AbsoluteFill style={{ background: open < 1 ? undefined : color.bg, overflow: "hidden" }}>
      <DirectionalBlur id="pan-blur" x={panBlur} />
      <DirectionalBlur id="out-blur" x={outBlur} />

      <AbsoluteFill style={{ opacity: open, translate: `${-out * W}px 0`, filter: outBlur > 0.5 ? "url(#out-blur)" : undefined }}>
        {/* 1) scream */}
        {showScream && (
          <AbsoluteFill style={{ translate: `${-pan * W * 0.7}px 0`, filter: impactFrame ? "invert(1)" : panBlur > 0.5 ? "url(#pan-blur)" : undefined }}>
            <div style={{ position: "absolute", inset: 0, scale: `${screamPush}` }}>
              <PanelView panel="scream" width={W} height={H} shot={screamShot} />
              <FocusLines t={t} w={W} h={H} cx={W * 0.5} cy={H * 0.5} strength={focus} />
            </div>
            <Haze amount={0.6} />
          </AbsoluteFill>
        )}

        {/* 2) the blade, in 2.5D */}
        {showSword && (
          <AbsoluteFill style={{ translate: `${(1 - pan) * W * 0.7}px 0`, filter: pull > 0 ? `blur(${pull * 18}px)` : panBlur > 0.5 ? "url(#pan-blur)" : undefined, opacity: 1 - clamp01((pull - 0.5) * 2) }}>
            <LayeredPanel
              layers="sword"
              width={W}
              height={H}
              fx={lerp(0.52, 0.55, swordE)}
              fy={lerp(0.36, 0.4, swordE)}
              zoomBg={lerp(1.06, 1.14, swordE)}
              zoomFg={lerp(1.0, 1.26, swordE)}
              driftFg={{ x: lerp(30, -20, swordE), y: lerp(40, 0, swordE) }}
              blurBg={lerp(3, 6, swordE)}
              fgExtra={(place) => (
                <Img
                  src={staticFile(PANELS.blade.src)}
                  style={{ position: "absolute", left: place.x, top: place.y, width: place.w, height: place.h, maxWidth: "none", opacity: 0.85, filter: `drop-shadow(0 0 ${18 + glow * 28}px rgba(226,38,43,0.75))` }}
                />
              )}
            />
            <Haze amount={0.8} />
            <Embers t={t} start={cue.swordPan} end={cue.tornado} count={28} seed={7} area={{ x: 380, y: 400, w: 620, h: 1200 }} rise={360} />
            <Bokeh t={t} start={cue.swordWipe} end={cue.tornado} seed={17} />
          </AbsoluteFill>
        )}

        {/* 3) the wind, in 2.5D, coming into focus */}
        {showWind && (
          <AbsoluteFill style={{ filter: pull < 1 ? `blur(${(1 - pull) * 18}px)` : undefined, opacity: clamp01(pull * 2) }}>
            <LayeredPanel
              layers="tornado"
              width={W}
              height={H}
              fx={lerp(0.2, 0.27, windE)}
              fy={0.42}
              zoomBg={lerp(1.3, 1.12, windE)}
              zoomFg={lerp(1.42, 1.12, windE)}
              driftFg={{ x: lerp(-40, 0, windE), y: 0 }}
              blurBg={4}
              bloom={0.3}
              between={
                <div style={{ position: "absolute", inset: 0, opacity: 0.8 }}>
                  <Wind t={t} w={W} h={H} strength={1} />
                </div>
              }
            />
            <Haze amount={0.9} />
          </AbsoluteFill>
        )}

        {/* 4) Asta under a red sun, each layer at its own depth */}
        {showAsta && (
          <AbsoluteFill style={{ background: color.bg, opacity: enterRed }}>
            <div style={{ position: "absolute", left: W / 2 - 430 * sun, top: 860 - 430 * sun - drift * 20, width: 860 * sun, height: 860 * sun, borderRadius: "50%", background: color.red, boxShadow: `0 0 140px rgba(226,38,43,${0.6 * sun})`, filter: "blur(2px)" }} />
            <div style={{ position: "absolute", inset: 0, translate: `0 ${drift * 40}px` }}>
              <Pillars t={t} start={cue.astaSlam} />
            </div>
            <Burst t={t} start={cue.astaSlam + 0.08} cx={W / 2} cy={980} />
            <Img
              src={staticFile("images/asta-redblack.png")}
              style={{
                position: "absolute",
                width: 1320,
                height: 1320,
                left: (W - 1320) / 2 + 40 - drift * 30,
                top: H - 1320 + 40 + (1 - slam) * 420 + Math.sin(drift * 3) * 8,
                scale: `${(1.18 - 0.18 * slam) * (1 + drift * 0.05)}`,
                opacity: clamp01(slam * 3),
                filter: "drop-shadow(0 0 40px rgba(0,0,0,0.6))",
              }}
            />
            <Embers t={t} start={cue.astaSlam} end={cue.mangaOut} count={26} seed={11} area={{ x: 80, y: 800, w: 920, h: 900 }} rise={420} size={10} />
            <Bokeh t={t} start={cue.astaSlam} end={cue.mangaOut + 0.2} seed={29} />
          </AbsoluteFill>
        )}
      </AbsoluteFill>

      {flash > 0 && <AbsoluteFill style={{ background: color.white, opacity: flash * 0.9 }} />}
    </AbsoluteFill>
  );
}
