import { Html5Audio, Sequence, staticFile, useVideoConfig } from "remotion";

import { cue } from "./cues";
import peaks from "../../public/audio/sfx-peaks.json";

type Sfx = keyof typeof peaks;

/** Every hit, placed so its measured peak lands exactly on its cue. */
const HITS: [at: number, sfx: Sfx, volume: number][] = [
  [cue.impact, "impact", 0.9],
  [cue.slash + 0.08, "slash", 0.7],
  [cue.logoIn, "logo-hit", 0.55],
  [cue.sweep, "shimmer", 0.3],
  [cue.manga, "whoosh-heavy", 0.55],
  [cue.manga, "impact", 0.65],
  [cue.swordWipe + 0.12, "swipe", 0.5],
  [cue.swordPan + 0.12, "whoosh", 0.35],
  [cue.swordPull + 0.2, "energy", 0.4],
  [cue.astaSlam, "impact", 0.75],
  [cue.astaSlam + 0.25, "energy", 0.45],
  [cue.reaction, "whoosh-heavy", 0.5],
  [cue.comments[0], "pop", 0.4],
  [cue.comments[1], "pop-low", 0.4],
  [cue.comments[2], "pop", 0.4],
  [cue.comments[3], "pop-low", 0.45],
  [cue.reader + 0.15, "whoosh-heavy", 0.45],
  [cue.motionOn, "tick", 0.55],
  [cue.pushIn + 0.15, "whoosh", 0.3],
  [cue.maskReveal + 0.15, "swipe", 0.4],
  [cue.foreground + 0.1, "whoosh", 0.3],
  [cue.readerEnergy + 0.15, "energy", 0.4],
  [cue.nextPanel + 0.18, "swipe", 0.45],
  [cue.nextPanel + 0.18, "tick", 0.3],
  [cue.thumb, "tick", 0.25],
  [cue.final - 0.02, "whoosh-heavy", 0.55],
  [cue.final, "impact", 0.6],
  [cue.finalHit, "final-hit", 0.9],
];

const VO_LENGTH = [2.9, 2.2, 1.56];

/** Music ducks under the narration. */
function musicVolume(t: number) {
  const base = 0.6;
  const duck = cue.vo.some((start, i) => t > start - 0.1 && t < start + VO_LENGTH[i] + 0.1);
  return duck ? base * 0.5 : base;
}

export function SoundDesign() {
  const { fps } = useVideoConfig();
  return (
    <>
      <Html5Audio src={staticFile("audio/music-bed.wav")} volume={(f) => musicVolume(f / fps)} />
      {cue.vo.map((start, i) => (
        <Sequence key={`vo-${i}`} from={Math.round(start * fps)} name={`VO ${i + 1}`} layout="none">
          <Html5Audio src={staticFile(`audio/vo-${i + 1}.wav`)} volume={1} />
        </Sequence>
      ))}
      {HITS.map(([at, sfx, volume], i) => {
        const start = at - peaks[sfx];
        const from = Math.max(0, Math.round(start * fps));
        const trim = start < 0 ? Math.round(-start * fps) : 0;
        return (
          <Sequence key={i} from={from} name={sfx} layout="none">
            <Html5Audio src={staticFile(`audio/${sfx}.wav`)} volume={volume} trimBefore={trim || undefined} />
          </Sequence>
        );
      })}
    </>
  );
}
