import { AbsoluteFill, Img, staticFile } from "remotion";

import { step, track } from "../kit/spring";
import { clamp01, progress } from "../kit/time";
import { cue } from "./cues";
import { Embers } from "./fx";
import { DirectionalBlur, PanelView, PANELS, shotAt, snappy } from "./panel";
import { color, easeIn, easeInOut, easeOut, FRAME, seeded } from "./tokens";
import { Wind } from "./wind";

const W = FRAME.width;
const H = FRAME.height;

/**
 * Scene 2, after the scroll-driven manga sites: the Black Clover pages are one long page the
 * camera scrolls down. Every panel arrives its own way (focus lines, a split, an ink bleed, a red sun)
 * and its layers keep moving after it lands.
 */

/** The scroll position of the long page, on a spring that retargets at each panel. */
const scrollKeys = () =>
  [
    [cue.manga, 0],
    [cue.swordWipe, H],
    [cue.tornado, 2 * H],
    [cue.astaSlam, 3 * H],
  ] as const;
const scrollSpring = { stiffness: 190, damping: 25 };
const scrollAt = (t: number) => track(t, scrollKeys(), scrollSpring);

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

/** Anime focus lines: thin ink spikes converging on a point, redrawn 12 times a second. */
function FocusLines({ t, cx, cy, strength }: { t: number; cx: number; cy: number; strength: number }) {
  if (strength <= 0) return null;
  const rand = seeded(Math.floor(t * 12) + 5);
  return (
    <svg width={W} height={H} style={{ position: "absolute", inset: 0, opacity: strength }}>
      {Array.from({ length: 90 }, (_, i) => {
        const a = (i / 90) * Math.PI * 2 + rand() * 0.06;
        const r0 = 520 + rand() * 260;
        const r1 = 1500;
        const w = 2 + rand() * 7;
        const n = { x: -Math.sin(a), y: Math.cos(a) };
        const p0 = { x: cx + Math.cos(a) * r0, y: cy + Math.sin(a) * r0 };
        const p1 = { x: cx + Math.cos(a) * r1, y: cy + Math.sin(a) * r1 };
        return <path key={i} d={`M${p0.x} ${p0.y} L${p1.x + n.x * w * 3} ${p1.y + n.y * w * 3} L${p1.x - n.x * w * 3} ${p1.y - n.y * w * 3} Z`} fill="#0b0b0b" />;
      })}
    </svg>
  );
}

/** Ink bleed: a turbulence mask whose threshold sweeps from nothing to everything. */
function InkBleed({ id, amount }: { id: string; amount: number }) {
  const slope = 9;
  const intercept = slope * (amount * 1.5 - 1.0);
  return (
    <svg width={0} height={0} style={{ position: "absolute" }}>
      <filter id={id} x="0" y="0" width="100%" height="100%" colorInterpolationFilters="sRGB">
        <feTurbulence type="fractalNoise" baseFrequency="0.006 0.012" numOctaves={4} seed={9} result="noise" />
        <feColorMatrix in="noise" type="luminanceToAlpha" result="lum" />
        <feComponentTransfer in="lum" result="mask">
          <feFuncA type="linear" slope={slope} intercept={intercept} />
        </feComponentTransfer>
        <feComposite in="SourceGraphic" in2="mask" operator="in" />
      </filter>
    </svg>
  );
}

/** Red pillars rising from the floor, like the red wall in the reference sites. */
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
  const scroll = scrollAt(t);
  const velocity = (scrollAt(t + 1 / 120) - scrollAt(t - 1 / 120)) * 60;
  const scrollBlur = Math.min(42, Math.abs(velocity) / 140);

  // A) the scream: strips, then a punch-in and a one-frame impact (inverted) frame
  const screamShot = shotAt(t, [
    [cue.manga - 0.1, 0.5, 0.42, 1.42],
    [cue.manga, 0.5, 0.4, 1.12],
    [cue.manga + 0.5, 0.52, 0.46, 1.22],
  ], snappy);
  const impactFrame = t > cue.manga + 0.36 && t < cue.manga + 0.43;
  const focus = easeOut(progress(t, cue.manga + 0.05, 0.2)) * 0.9;

  // B) the blade: two halves slide in opposite directions and lock, then the camera works the panel
  const lock = easeOut(progress(t, cue.swordWipe - 0.1, 0.5));
  const swordShot = shotAt(t, [
    [cue.swordWipe, 0.5, 0.36, 1.25],
    [cue.swordPan, 0.47, 0.25, 1.9],
    [cue.swordPan + 0.45, 0.78, 0.2, 1.6],
    [cue.swordPull, 0.56, 0.42, 1.04],
  ]);
  const pull = easeOut(progress(t, cue.swordPull, 0.6));
  const glow = 0.6 + 0.4 * Math.sin(t * 11);

  // C) the wind panel bleeds in like ink and its tornado turns
  const ink = easeInOut(progress(t, cue.tornado - 0.12, 0.6));
  const tornadoShot = shotAt(t, [
    [cue.tornado, 0.45, 0.5, 1.35],
    [cue.tornado + 0.35, 0.52, 0.5, 1.08],
  ]);

  // D) Asta: a red sun, red pillars, and Asta in front
  const sun = easeOut(progress(t, cue.astaSlam - 0.05, 0.4));
  const slam = step(t - cue.astaSlam - 0.08, { stiffness: 230, damping: 19 });
  const flash = Math.max(0, 1 - Math.abs(t - cue.astaSlam - 0.1) / 0.07);
  const float = Math.sin((t - cue.astaSlam) * 3) * 8;

  // exit: whip pan left into the reader
  const out = easeIn(progress(t, cue.mangaOut, 0.14));
  const outBlur = out * 60;

  const blade = (place: { x: number; y: number; w: number; h: number }) => (
    <Img
      src={staticFile(PANELS.blade.src)}
      style={{
        position: "absolute",
        // the blade rides its own layer: it drifts against the page as it scrolls, then lifts toward camera
        left: place.x + pull * 26,
        top: place.y - pull * 18 - (scroll - H) * 0.12,
        width: place.w * (1 + pull * 0.03),
        height: place.h * (1 + pull * 0.03),
        maxWidth: "none",
        filter: `drop-shadow(0 0 ${18 + glow * 26}px rgba(226,38,43,0.6))`,
      }}
    />
  );

  return (
    <AbsoluteFill style={{ background: open < 1 ? undefined : color.bg, overflow: "hidden" }}>
      <DirectionalBlur id="scroll-v" y={scrollBlur} />
      <DirectionalBlur id="out-blur" x={outBlur} />
      <InkBleed id="ink" amount={ink} />

      <AbsoluteFill style={{ opacity: open, translate: `${-out * W}px 0`, filter: outBlur > 0.5 ? "url(#out-blur)" : undefined }}>
        {/* the long page */}
        <div style={{ position: "absolute", left: 0, top: 0, width: W, height: 4 * H, translate: `0 ${-scroll}px`, filter: scrollBlur > 0.6 ? "url(#scroll-v)" : undefined }}>
          {/* A) scream */}
          <div style={{ position: "absolute", left: 0, top: 0, width: W, height: H, overflow: "hidden", filter: impactFrame ? "invert(1)" : undefined }}>
            <PanelView panel="scream" width={W} height={H} shot={screamShot} />
            <FocusLines t={t} cx={W * 0.5} cy={H * 0.5} strength={focus} />
          </div>

          {/* B) the blade, in two halves that lock together */}
          <div style={{ position: "absolute", left: 0, top: H, width: W, height: H, overflow: "hidden", background: color.bg }}>
            {[0, 1].map((half) => (
              <div key={half} style={{ position: "absolute", inset: 0, clipPath: half === 0 ? "inset(0 50% 0 0)" : "inset(0 0 0 50%)", translate: `0 ${(half === 0 ? 1 : -1) * (1 - lock) * 380}px` }}>
                <PanelView panel="sword" width={W} height={H} shot={swordShot}>
                  {blade}
                </PanelView>
              </div>
            ))}
            {lock < 1 && <div style={{ position: "absolute", left: W / 2 - 4, top: 0, width: 8, height: H, background: color.red, opacity: 1 - lock, boxShadow: "0 0 30px rgba(226,38,43,0.8)" }} />}
            <Embers t={t} start={cue.swordPull} end={cue.tornado + 0.2} count={34} seed={7} area={{ x: 420, y: 500, w: 560, h: 1100 }} rise={380} />
          </div>

          {/* C) the wind panel, bleeding in like ink */}
          <div style={{ position: "absolute", left: 0, top: 2 * H, width: W, height: H, overflow: "hidden", background: color.bg }}>
            <div style={{ position: "absolute", inset: 0, filter: ink < 1 ? "url(#ink)" : undefined }}>
              <PanelView panel="tornado" width={W} height={H} shot={tornadoShot}>
                {() => <Wind t={t} w={W} h={H} strength={1} />}
              </PanelView>
            </div>
          </div>

          {/* D) Asta under a red sun */}
          <div style={{ position: "absolute", left: 0, top: 3 * H, width: W, height: H, overflow: "hidden", background: color.bg }}>
            <div style={{ position: "absolute", left: W / 2 - 430 * sun, top: 860 - 430 * sun, width: 860 * sun, height: 860 * sun, borderRadius: "50%", background: color.red, boxShadow: `0 0 120px rgba(226,38,43,${0.6 * sun})` }} />
            <Pillars t={t} start={cue.astaSlam} />
            <Burst t={t} start={cue.astaSlam + 0.08} cx={W / 2} cy={980} />
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
                filter: "drop-shadow(0 0 40px rgba(0,0,0,0.6))",
              }}
            />
            <Embers t={t} start={cue.astaSlam} end={cue.mangaOut} count={26} seed={11} area={{ x: 80, y: 800, w: 920, h: 900 }} rise={420} size={10} />
          </div>
        </div>
      </AbsoluteFill>

      {flash > 0 && <AbsoluteFill style={{ background: color.white, opacity: flash * 0.9 }} />}
    </AbsoluteFill>
  );
}
