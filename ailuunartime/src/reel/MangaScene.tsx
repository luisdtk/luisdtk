import { AbsoluteFill, Img, staticFile } from "remotion";

import { step } from "../kit/spring";
import { clamp01, progress } from "../kit/time";
import { cue } from "./cues";
import { Embers } from "./fx";
import { DirectionalBlur, PanelView, PANELS, shotAt, snappy } from "./panel";
import { color, easeIn, easeInOut, easeOut, FRAME } from "./tokens";
import { Wind } from "./wind";

const W = FRAME.width;
const H = FRAME.height;

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

/** Scene 2: the manga page wakes up. Scream, then a pan along the red-black blade, then Asta in front. */
export function MangaScene({ t }: { t: number }) {
  if (t < cue.manga - 0.05 || t > cue.reader + 0.12) return null;

  // a) the scream: the intro's diagonal cut opens onto it with a punch-in
  const open = easeOut(progress(t, cue.manga - 0.04, 0.2));
  const screamShot = shotAt(t, [
    [cue.manga - 0.1, 0.5, 0.42, 1.42],
    [cue.manga, 0.5, 0.4, 1.12],
    [cue.manga + 0.4, 0.52, 0.44, 1.18],
  ], snappy);
  const screamDrift = (t - cue.manga) * 18;

  // b) the blade: slides in from the right with directional blur
  const wipe = easeInOut(progress(t, cue.swordWipe, 0.24));
  const wipeBlur = Math.sin(wipe * Math.PI) * 42;
  const swordShot = shotAt(t, [
    [cue.swordWipe, 0.44, 0.24, 2.1],
    [cue.swordPan, 0.78, 0.18, 1.7],
    [cue.swordPull, 0.56, 0.42, 1.04],
    [cue.tornado - 0.3, 0.5, 0.3, 1.16],
  ]);
  const pull = easeOut(progress(t, cue.swordPull, 0.6));
  const panBlur = Math.max(0, 1 - Math.abs(t - (cue.swordPan + 0.12)) / 0.14) * 16;
  const glow = 0.6 + 0.4 * Math.sin(t * 11);

  // b2) "the scenes come to life": a vertical slice wipe to the wind panel, its tornado turning
  const slice = easeInOut(progress(t, cue.tornado, 0.26));
  const sliceBlur = Math.sin(slice * Math.PI) * 30;
  const tornadoShot = shotAt(t, [
    [cue.tornado, 0.42, 0.45, 1.5],
    [cue.tornado + 0.3, 0.5, 0.5, 1.05],
    [cue.astaSlam, 0.55, 0.5, 1.12],
  ]);

  // c) Asta slams in front, the page dims behind him
  const slam = step(t - cue.astaSlam, { stiffness: 230, damping: 19 });
  const dim = easeOut(progress(t, cue.astaSlam, 0.25));
  const flash = Math.max(0, 1 - Math.abs(t - cue.astaSlam - 0.02) / 0.07);
  const float = Math.sin((t - cue.astaSlam) * 3) * 8;

  // exit: whip pan left
  const out = easeIn(progress(t, cue.mangaOut, 0.14));
  const outBlur = out * 60;

  return (
    <AbsoluteFill style={{ background: color.bg, overflow: "hidden" }}>
      <DirectionalBlur id="wipe-blur" x={wipeBlur} />
      <DirectionalBlur id="pan-blur" x={panBlur} y={panBlur * 0.3} />
      <DirectionalBlur id="out-blur" x={outBlur} />
      <DirectionalBlur id="slice-blur" y={sliceBlur} />

      <AbsoluteFill style={{ translate: `${-out * W}px 0`, filter: outBlur > 0.5 ? "url(#out-blur)" : undefined }}>
        {/* a) scream, until the blade covers it */}
        {t < cue.swordWipe + 0.3 && (
          <AbsoluteFill style={{ clipPath: `polygon(0 0, ${open * 260}% 0, ${open * 260 - 160}% 100%, 0 100%)` }}>
            <PanelView panel="scream" width={W} height={H} shot={{ ...screamShot, fy: screamShot.fy + screamDrift / 4000 }} style={{ translate: `${-wipe * W * 0.35}px 0` }} />
          </AbsoluteFill>
        )}

        {/* b) the blade panel and its parallax layer */}
        {t >= cue.swordWipe && (
          <AbsoluteFill style={{ translate: `${(1 - wipe) * W}px 0`, filter: wipeBlur > 0.5 ? "url(#wipe-blur)" : panBlur > 0.5 ? "url(#pan-blur)" : undefined }}>
            <PanelView panel="sword" width={W} height={H} shot={swordShot} imageStyle={{ filter: dim > 0 ? `brightness(${1 - dim * 0.72}) contrast(${1 + dim * 0.2})` : undefined }}>
              {(place) => (
                <Img
                  src={staticFile(PANELS.blade.src)}
                  style={{
                    position: "absolute",
                    left: place.x + pull * 26,
                    top: place.y - pull * 18,
                    width: place.w * (1 + pull * 0.025),
                    height: place.h * (1 + pull * 0.025),
                    maxWidth: "none",
                    filter: `drop-shadow(0 0 ${18 + glow * 26}px rgba(226,38,43,${0.55 + dim * 0.3})) brightness(${1 - dim * 0.35})`,
                  }}
                />
              )}
            </PanelView>
            {/* the red edge of the wipe */}
            {wipe > 0 && wipe < 1 && <div style={{ position: "absolute", left: -10, top: 0, width: 14, height: H, background: color.red, boxShadow: `0 0 40px 10px rgba(226,38,43,0.7)` }} />}
          </AbsoluteFill>
        )}

        {t >= cue.tornado && (
          <AbsoluteFill style={{ translate: `0 ${(1 - slice) * -H}px`, filter: sliceBlur > 0.5 ? "url(#slice-blur)" : undefined }}>
            <PanelView panel="tornado" width={W} height={H} shot={tornadoShot} imageStyle={{ filter: dim > 0 ? `brightness(${1 - dim * 0.72}) contrast(${1 + dim * 0.2})` : undefined }}>
              {() => <Wind t={t} w={W} h={H} strength={1 - dim * 0.7} />}
            </PanelView>
            {slice > 0 && slice < 1 && <div style={{ position: "absolute", left: 0, bottom: -10, width: W, height: 14, background: color.red, boxShadow: `0 0 40px 10px rgba(226,38,43,0.7)` }} />}
          </AbsoluteFill>
        )}

        <Embers t={t} start={cue.swordPull} end={cue.tornado + 0.2} count={34} seed={7} area={{ x: 420, y: 500, w: 560, h: 1100 }} rise={380} />

        {/* c) Asta, red and black, in front of the page */}
        {t >= cue.astaSlam && (
          <>
            <AbsoluteFill style={{ background: `radial-gradient(circle at 50% 52%, rgba(226,38,43,${0.35 * dim}) 0%, rgba(10,10,10,0) 55%)` }} />
            <Burst t={t} start={cue.astaSlam} cx={W / 2} cy={1010} />
            <Img
              src={staticFile("images/asta-redblack.png")}
              style={{
                position: "absolute",
                width: 1320,
                height: 1320,
                left: (W - 1320) / 2 + 40,
                top: H - 1320 + 40 + (1 - slam) * 420 + float,
                scale: `${1.18 - 0.18 * slam}`,
                opacity: clamp01(slam * 3),
                filter: "drop-shadow(0 0 40px rgba(226,38,43,0.45))",
              }}
            />
            <Embers t={t} start={cue.astaSlam} end={cue.mangaOut} count={26} seed={11} area={{ x: 80, y: 800, w: 920, h: 900 }} rise={420} size={10} />
          </>
        )}
      </AbsoluteFill>

      {flash > 0 && <AbsoluteFill style={{ background: color.white, opacity: flash * 0.9 }} />}
    </AbsoluteFill>
  );
}
