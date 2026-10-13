import { AbsoluteFill, staticFile } from "remotion";

import { step } from "../kit/spring";
import { clamp01, progress } from "../kit/time";
import { cue } from "./cues";
import { FOLDER, Folder, PAGE_H, PAGE_RISE, PAGE_W, type FolderSpec } from "./Folders";
import { Embers, Logo, LOGO_ASPECT, Slash } from "./fx";
import { PanelView } from "./panel";
import { color, easeIn, easeInOut, easeOut, FRAME } from "./tokens";

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

/** Where the front page of a fully open folder sits in the frame (centre, size, rotation). */
function frontPage(spec: FolderSpec, scale: number) {
  const pageW = PAGE_W;
  const pageH = PAGE_H;
  const fan = ((spec.pages.length - 1) / 2) * 9;
  // pivot: the page's bottom centre once fully risen, in folder coordinates (see Folder)
  const pivot = { x: FOLDER.w / 2 + fan * 4, y: FOLDER.h - 6 - pageH * PAGE_RISE };
  const r = (fan * Math.PI) / 180;
  const local = { x: pivot.x + (Math.sin(r) * pageH) / 2, y: pivot.y - (Math.cos(r) * pageH) / 2 };
  const rel = { x: local.x - FOLDER.w / 2, y: local.y - FOLDER.h / 2 };
  const ft = (spec.tilt * Math.PI) / 180;
  return {
    x: spec.x + (rel.x * Math.cos(ft) - rel.y * Math.sin(ft)) * scale,
    y: spec.y + (rel.x * Math.sin(ft) + rel.y * Math.cos(ft)) * scale,
    w: pageW * scale,
    h: pageH * scale,
    rotate: fan + spec.tilt,
  };
}

/**
 * Scene 1: impact, a red slash draws the logo (small, centred), six manga folders burst open
 * around it, Black Clover lights up as the narration names it, and the camera dives into its page.
 */
export function IntroLogo({ t }: { t: number }) {
  if (t > cue.manga + 0.12) return null;

  const slash = progress(t, cue.slash, 0.34);
  const flash = Math.max(0, 1 - Math.abs(t - (cue.slash + 0.12)) / 0.06);
  const reveal = easeOut(progress(t, cue.slash + 0.06, 0.42));
  const pop = step(t - cue.slash, { stiffness: 260, damping: 22 });
  const sweep = progress(t, cue.sweep, 0.45);

  const select = easeOut(progress(t, cue.select, 0.2));
  const dive = progress(t, cue.dive, cue.manga - cue.dive);
  const diveEase = easeInOut(dive);
  const logoOut = easeIn(progress(t, cue.dive - 0.05, 0.2));

  // the traveller: Black Clover's front page grows from the folder to the full frame
  const from = frontPage(FOLDERS[SELECTED], 1.06);
  const to = { x: CENTER.x, y: CENTER.y, w: FRAME.width, h: FRAME.height, rotate: 0 };
  const lerp = (a: number, b: number) => a + (b - a) * diveEase;
  const page = { x: lerp(from.x, to.x), y: lerp(from.y, to.y), w: lerp(from.w, to.w), h: lerp(from.h, to.h), rotate: lerp(from.rotate, to.rotate) };

  return (
    <AbsoluteFill style={{ background: color.bg }}>
      <AbsoluteFill style={{ background: `radial-gradient(circle at 50% 50%, rgba(226,38,43,${0.3 * reveal * (1 - logoOut)}) 0%, rgba(226,38,43,0) 30%)` }} />
      <Embers t={t} start={cue.slash + 0.3} end={cue.dive} count={30} seed={3} area={{ x: 120, y: 500, w: 840, h: 1000 }} rise={300} />

      {/* the folders, pushed past the camera as it dives */}
      <AbsoluteFill style={{ scale: `${1 + diveEase * 1.6}`, transformOrigin: `${from.x}px ${from.y}px`, opacity: 1 - clamp01(dive * 1.6) }}>
        {FOLDERS.map((spec, i) => (
          <Folder
            key={spec.title}
            spec={spec}
            t={t}
            start={cue.folders + i * STAGGER}
            origin={CENTER}
            selected={i === SELECTED ? select : 0}
            dim={i === SELECTED ? 0 : select}
            style={i === SELECTED && dive > 0 ? { visibility: "hidden" } : undefined}
          />
        ))}
      </AbsoluteFill>

      {/* the logo, small and centred */}
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", opacity: 1 - logoOut, scale: `${(0.86 + 0.14 * pop) * (1 - logoOut * 0.4)}` }}>
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

      {/* the dive: Black Clover's front page becomes the frame */}
      {dive > 0 && (
        <div
          style={{
            position: "absolute",
            left: page.x - page.w / 2,
            top: page.y - page.h / 2,
            width: page.w,
            height: page.h,
            rotate: `${page.rotate}deg`,
            overflow: "hidden",
            borderRadius: 4 * (1 - diveEase),
            boxShadow: `0 0 ${60 * (1 - diveEase)}px rgba(226,38,43,0.7)`,
          }}
        >
          <PanelView panel="scream" width={page.w} height={page.h} shot={{ fx: 0.5, fy: 0.42, zoom: 1.02 + diveEase * 0.4 }} />
        </div>
      )}

      <Slash progress={slash} angle={-24} y={CENTER.y + 10} thickness={10} />
      {flash > 0 && <AbsoluteFill style={{ background: color.white, opacity: flash * 0.85 }} />}
    </AbsoluteFill>
  );
}
