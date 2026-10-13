import { AbsoluteFill, staticFile } from "remotion";

import { step } from "../kit/spring";
import { clamp01, progress } from "../kit/time";
import { cue } from "./cues";
import { Folder, type FolderSpec } from "./Folders";
import { Embers, Logo, LOGO_ASPECT, Slash } from "./fx";
import { MangaCarousel } from "./MangaCarousel";
import { color, easeIn, easeInOut, easeOut, FRAME, lerp } from "./tokens";

const LOGO_W = 300;
const LOGO_H = LOGO_W / LOGO_ASPECT;
const CENTER = { x: FRAME.width / 2, y: FRAME.height / 2 };

/** Six series around the logo. Black Clover holds the supplied pages; the others hold drawn stand-in pages. */
const FOLDERS: FolderSpec[] = [
  { title: "NARUTO", x: 290, y: 600, pages: [11, 12, 13], tilt: -6 },
  { title: "BLACK CLOVER", x: 790, y: 600, pages: ["tornado", "sword", "scream"], tilt: 5 },
  { title: "JOJO", x: 220, y: 975, pages: [21, 22, 23], tilt: -3 },
  { title: "ONE PIECE", x: 860, y: 975, pages: [31, 32, 33], tilt: 4 },
  { title: "DEMON SLAYER", x: 290, y: 1350, pages: [41, 42, 43], tilt: 6 },
  { title: "CHAINSAW MAN", x: 790, y: 1350, pages: [51, 52, 53], tilt: -5 },
];
const SELECTED = 1;
const STAGGER = 0.05;

/** The mouse: glides on a slight arc to the Black Clover folder, presses, releases. */
const CURSOR_FROM = { x: 980, y: 1560 };
const CURSOR_TO = { x: 815, y: 585 };

function Cursor({ t }: { t: number }) {
  const glide = easeInOut(progress(t, cue.cursor, cue.select - cue.cursor + 0.02));
  if (t < cue.cursor || t > cue.carousel + 0.25) return null;
  const arc = Math.sin(glide * Math.PI) * 120;
  const x = lerp(CURSOR_FROM.x, CURSOR_TO.x, glide) + arc;
  const y = lerp(CURSOR_FROM.y, CURSOR_TO.y, glide);
  const press = Math.max(0, 1 - Math.abs(t - cue.click - 0.04) / 0.07);
  const fade = 1 - clamp01((t - cue.carousel) / 0.2);
  const ring = progress(t, cue.click, 0.45);
  return (
    <>
      {ring > 0 && ring < 1 && (
        <div style={{ position: "absolute", left: x - 90 * easeOut(ring), top: y - 90 * easeOut(ring), width: 180 * easeOut(ring), height: 180 * easeOut(ring), borderRadius: "50%", border: `${6 * (1 - ring)}px solid ${color.red}`, opacity: 1 - ring }} />
      )}
      <svg width={64} height={64} viewBox="0 0 24 24" style={{ position: "absolute", left: x - 6, top: y - 3, scale: `${1 - press * 0.18}`, transformOrigin: "6px 3px", opacity: fade, filter: "drop-shadow(0 6px 10px rgba(0,0,0,0.6))" }}>
        <path d="M4 2 L4 19 L8.6 14.8 L11.6 21.4 L14.4 20.2 L11.4 13.7 L17.6 13.5 Z" fill={color.white} stroke="#000" strokeWidth={1.3} strokeLinejoin="round" />
      </svg>
    </>
  );
}

/**
 * Scene 1: impact, a red slash draws the logo (small, centred), six manga folders burst out and
 * float, the mouse glides to Black Clover and clicks it as the narration names it, the folder
 * opens, and its pages fly out into a sideways carousel of moving panels (MangaCarousel).
 */
export function IntroLogo({ t }: { t: number }) {
  if (t > cue.manga + 0.12) return null;

  const slash = progress(t, cue.slash, 0.34);
  const flash = Math.max(0, 1 - Math.abs(t - (cue.slash + 0.12)) / 0.06);
  const reveal = easeOut(progress(t, cue.slash + 0.06, 0.42));
  const pop = step(t - cue.slash, { stiffness: 260, damping: 22 });
  const sweep = progress(t, cue.sweep, 0.45);

  const hover = easeOut(progress(t, cue.select, 0.15));
  const clicked = easeOut(progress(t, cue.click, 0.2));
  const away = easeIn(progress(t, cue.carousel, 0.35));
  const logoOut = easeIn(progress(t, cue.click + 0.05, 0.25));
  // the whole room drifts slowly, like a camera breathing
  const drift = { x: Math.sin(t * 0.9) * 14, y: Math.cos(t * 0.7) * 10, s: 1 + 0.03 * easeInOut(progress(t, cue.folders, 1.2)) };

  const bc = FOLDERS[SELECTED];
  return (
    <AbsoluteFill style={{ background: color.bg }}>
      <AbsoluteFill style={{ background: `radial-gradient(circle at 50% 50%, rgba(226,38,43,${0.3 * reveal * (1 - away)}) 0%, rgba(226,38,43,0) 34%)` }} />
      <Embers t={t} start={cue.slash + 0.3} end={cue.manga} count={30} seed={3} area={{ x: 120, y: 500, w: 840, h: 1000 }} rise={300} />

      {/* the folders: float, the chosen one opens, then the room falls away behind the carousel */}
      <AbsoluteFill style={{ translate: `${drift.x}px ${drift.y}px`, scale: `${drift.s * (1 + away * 0.25)}`, transformOrigin: `${bc.x}px ${bc.y}px`, opacity: 1 - away * 0.85, filter: away > 0 ? `blur(${away * 10}px)` : undefined }}>
        {FOLDERS.map((spec, i) => (
          <Folder
            key={spec.title}
            spec={spec}
            t={t}
            start={cue.folders + i * STAGGER}
            origin={CENTER}
            phase={i}
            selected={i === SELECTED ? hover : 0}
            dim={i === SELECTED ? 0 : clicked}
            openAt={i === SELECTED ? cue.click : undefined}
          />
        ))}
      </AbsoluteFill>

      {/* the logo, small and centred, steps back once the folder is clicked */}
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", opacity: 1 - logoOut, scale: `${(0.86 + 0.14 * pop) * (1 - logoOut * 0.3)}` }}>
        <div style={{ position: "relative", width: LOGO_W, height: LOGO_H }}>
          <div style={{ clipPath: reveal >= 1 ? undefined : `polygon(0 0, ${reveal * 125}% 0, ${reveal * 125 - 25}% 100%, 0 100%)`, filter: `drop-shadow(0 0 ${24 + 24 * (1 - reveal)}px rgba(226,38,43,0.6))` }}>
            <Logo width={LOGO_W} />
          </div>
          {sweep > 0 && sweep < 1 && (
            <div
              style={{
                position: "absolute",
                inset: 0,
                maskImage: `url(${staticFile("images/logo-white.png")})`,
                WebkitMaskImage: `url(${staticFile("images/logo-white.png")})`,
                maskSize: "100% 100%",
                WebkitMaskSize: "100% 100%",
                background: `linear-gradient(115deg, rgba(255,255,255,0) ${sweep * 140 - 30}%, rgba(226,38,43,0.95) ${sweep * 140 - 15}%, rgba(255,255,255,0) ${sweep * 140}%)`,
              }}
            />
          )}
        </div>
      </AbsoluteFill>

      <MangaCarousel t={t} origin={{ x: bc.x + drift.x, y: bc.y - 60 + drift.y }} />
      <Cursor t={t} />

      <Slash progress={slash} angle={-24} y={CENTER.y + 10} thickness={10} />
      {flash > 0 && <AbsoluteFill style={{ background: color.white, opacity: flash * 0.85 }} />}
    </AbsoluteFill>
  );
}
