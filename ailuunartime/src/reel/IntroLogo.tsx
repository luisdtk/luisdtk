import { AbsoluteFill, staticFile } from "remotion";

import { bayerPath } from "../kit/dither";
import { step } from "../kit/spring";
import { clamp01, progress } from "../kit/time";
import { cue } from "./cues";
import { Embers, Mascot, Slash, Wordmark } from "./fx";
import { color, easeIn, easeOut } from "./tokens";

const MASCOT = 520;

/** Scene 1: black, an impact, a red slash, and the logo switches on like new tech. */
export function IntroLogo({ t }: { t: number }) {
  if (t > cue.manga + 0.1) return null;

  // the slash cuts the frame, then the logo resolves out of dithered pixels
  const slash = progress(t, cue.slash, 0.34);
  const flash = Math.max(0, 1 - Math.abs(t - (cue.slash + 0.12)) / 0.06);
  const dither = easeOut(progress(t, cue.logoIn, 0.42));
  const pop = step(t - cue.logoIn, { stiffness: 260, damping: 22 });
  const scale = 0.86 + 0.14 * pop;

  // light sweep across the mark
  const sweep = progress(t, cue.sweep, 0.45);

  // exit: the mark pushes toward camera and smears, a second slash wipes to the manga
  const out = easeIn(progress(t, cue.introOut, 0.22));
  const exitSlash = progress(t, cue.introOut - 0.02, 0.26);

  const path = bayerPath({ width: MASCOT, height: MASCOT, cell: 24, progress: dither, sweep: "out", band: 0.6 });

  return (
    <AbsoluteFill style={{ background: color.bg }}>
      {/* red bloom behind the logo */}
      <AbsoluteFill
        style={{
          background: `radial-gradient(circle at 50% 44%, rgba(226,38,43,${0.32 * dither * (1 - out)}) 0%, rgba(226,38,43,0) 42%)`,
        }}
      />
      <Embers t={t} start={cue.logoIn} end={cue.introOut} count={30} seed={3} area={{ x: 160, y: 700, w: 760, h: 700 }} rise={320} />

      <AbsoluteFill
        style={{
          alignItems: "center",
          justifyContent: "center",
          scale: `${scale * (1 + out * 0.6)}`,
          opacity: 1 - out,
          filter: out > 0 ? `blur(${out * 18}px)` : undefined,
        }}
      >
        <div style={{ position: "relative", width: MASCOT, height: MASCOT, marginTop: -120 }}>
          <div style={{ clipPath: dither >= 1 ? undefined : `path("${path || "M0 0"}")` }}>
            <Mascot size={MASCOT} />
          </div>
          {/* the light sweep, masked to the mascot's own pixels */}
          {sweep > 0 && sweep < 1 && (
            <div
              style={{
                position: "absolute",
                inset: 0,
                maskImage: `url(${staticFile("images/asta-mascot.png")})`,
                WebkitMaskImage: `url(${staticFile("images/asta-mascot.png")})`,
                maskSize: "100% 100%",
                WebkitMaskSize: "100% 100%",
                background: `linear-gradient(115deg, rgba(255,255,255,0) ${sweep * 140 - 30}%, rgba(255,255,255,0.85) ${sweep * 140 - 15}%, rgba(255,255,255,0) ${sweep * 140}%)`,
                mixBlendMode: "screen",
              }}
            />
          )}
        </div>
        <Wordmark size={120} reveal={easeOut(progress(t, cue.wordmark, 0.55))} tracking={0.02 + 0.1 * (1 - easeOut(progress(t, cue.wordmark, 0.9)))} style={{ marginTop: 28 }} />
      </AbsoluteFill>

      <Slash progress={slash} angle={-28} y={940} thickness={12} />
      <Slash progress={exitSlash} angle={-28} y={980} thickness={22} glow={1.6} />

      {/* the diagonal cut that opens onto the manga: black falls away behind the slash */}
      {exitSlash > 0.25 && (
        <AbsoluteFill
          style={{
            background: color.white,
            opacity: clamp01((exitSlash - 0.25) / 0.2) * (1 - clamp01((t - cue.manga) / 0.08)),
            mixBlendMode: "screen",
          }}
        />
      )}
      {flash > 0 && <AbsoluteFill style={{ background: color.white, opacity: flash * 0.85 }} />}
    </AbsoluteFill>
  );
}
