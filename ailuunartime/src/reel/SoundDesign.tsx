import { Html5Audio, Sequence, staticFile, useVideoConfig } from "remotion";

import { cue, NARRATION_START } from "./cues";
import { COMMENT_CUES } from "./PostScene";
import peaks from "../../public/audio/sfx-peaks.json";

type Sfx = keyof typeof peaks;

/** Every hit, placed so its measured peak lands exactly on its cue. */
const HITS: [at: number, sfx: Sfx, volume: number][] = [
  [cue.impact, "impact", 0.9],
  [cue.slash + 0.08, "slash", 0.7],
  [cue.slash + 0.3, "logo-hit", 0.45],
  [cue.sweep, "shimmer", 0.25],
  [cue.folders + 0.15, "whoosh-heavy", 0.45],
  [cue.folders + 0.3, "pop-low", 0.3],
  [cue.folders + 0.42, "pop", 0.28],
  [cue.folders + 0.54, "pop-low", 0.26],
  [cue.cursor + 0.2, "whoosh", 0.18],
  [cue.select, "shimmer", 0.2],
  [cue.click, "tick", 0.6],
  [cue.click + 0.02, "pop-low", 0.35],
  [cue.carousel + 0.1, "whoosh-heavy", 0.45],
  [cue.carousel + 0.34, "impact", 0.4],
  [cue.carousel + 0.75, "swipe", 0.32],
  [cue.carousel + 1.05, "swipe", 0.3],
  [cue.expand + 0.1, "whoosh-heavy", 0.45],
  [cue.manga + 0.05, "impact", 0.55],
  [cue.swordPan + 0.12, "whoosh", 0.32],
  [cue.swordPull + 0.2, "energy", 0.35],
  [cue.tornado + 0.13, "whoosh-heavy", 0.4],
  [cue.astaSlam, "impact", 0.7],
  [cue.astaSlam + 0.25, "energy", 0.4],
  [cue.reader + 0.15, "whoosh-heavy", 0.4],
  [cue.motionOn, "tick", 0.5],
  [cue.pushIn + 0.15, "whoosh", 0.28],
  [cue.maskReveal + 0.15, "swipe", 0.36],
  [cue.foreground + 0.1, "whoosh", 0.28],
  [cue.readerEnergy + 0.15, "energy", 0.36],
  [cue.page5 + 0.2, "whoosh", 0.3],
  [cue.page5 + 0.5, "pop", 0.22],
  [cue.page5 + 0.75, "pop-low", 0.2],
  [cue.page6 + 0.2, "whoosh", 0.3],
  [cue.page6 + 0.45, "impact", 0.3],
  [cue.reaction, "whoosh-heavy", 0.45],
  [cue.reaction + 0.1, "swipe", 0.3],
  ...COMMENT_CUES.map(([at, brief], i): [number, Sfx, number] => [at, i % 2 ? "pop-low" : "pop", brief ? 0.42 : 0.2]),
  [cue.reaction + 0.5, "tick", 0.35],
  [cue.final - 0.02, "whoosh-heavy", 0.5],
  [cue.final, "impact", 0.55],
  [cue.lockup, "shimmer", 0.25],
  [cue.secondLine, "logo-hit", 0.3],
  [cue.finalHit, "final-hit", 0.85],
];

export function SoundDesign() {
  const { fps } = useVideoConfig();
  return (
    <>
      <Sequence from={Math.round(NARRATION_START * fps)} name="Narration" layout="none">
        <Html5Audio src={staticFile("audio/narration.wav")} volume={1} />
      </Sequence>
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
