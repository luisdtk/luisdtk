/**
 * The beat sheet as data, in seconds. The narration (ElevenLabs, supplied) sets the timeline:
 * its phrases were measured with silencedetect and transcribed, then each scene was placed on them.
 * The music pulses at 120 BPM underneath (a beat every 0.5 s from 2.0 s).
 * Scene code reads these names, never literal times.
 */

export const DURATION = 19.5;

/** Narration starts a beat after the opening impact. */
export const NARRATION_START = 0.3;

/** Measured phrases in the narration file (seconds in the file), and what they say. */
export const PHRASES = [
  [0.0, 2.4, "Imagine reading Black Clover like this."],
  [2.8, 5.65, "The characters move. The scenes come to life."],
  [5.98, 6.72, "And suddenly"],
  [6.92, 9.09, "reading manga feels like watching anime."],
  [9.47, 10.39, "And the crazy part?"],
  [10.88, 13.21, "AI is making things like this possible."],
  [13.62, 15.36, "The AI era is here."],
  [15.75, 18.36, "Imagine manga that moves like anime."],
] as const;

const say = (index: number) => NARRATION_START + PHRASES[index][0];

export const cue = {
  // Scene 1, the hook: "Imagine reading Black Clover like this."
  impact: 0,
  slash: 0.08,
  sweep: 0.55,
  folders: 0.5,
  select: NARRATION_START + 0.9,
  dive: 1.5,

  // Scene 2, Asta comes alive: "The characters move. The scenes come to life. And suddenly"
  manga: 2.0,
  scream: 2.0,
  swordWipe: say(1) - 0.05,
  swordPan: say(1) + 0.75,
  swordPull: say(1) + 1.5,
  energy: say(1) + 1.5,
  tornado: say(1) + 2.15,
  astaSlam: say(2) + 0.05,
  mangaOut: say(3) - 0.15,

  // Scene 3, the reader: "reading manga feels like watching anime. And the crazy part?"
  reader: say(3) - 0.05,
  motionOn: say(3) + 0.55,
  pushIn: say(3) + 0.9,
  maskReveal: say(3) + 1.45,
  foreground: say(3) + 2.0,
  readerEnergy: say(4) + 0.05,
  nextPanel: say(4) + 0.6,
  thumb: say(4) + 0.8,
  readerOut: say(5) - 0.45,

  // Scene 4, the reaction: "AI is making things like this possible."
  reaction: say(5),
  comments: [say(5) + 0.2, say(5) + 0.75, say(5) + 1.3, say(5) + 1.85],
  reactionOut: say(6) - 0.2,

  // Scene 5, the final message: "The AI era is here. Imagine manga that moves like anime."
  final: say(6) - 0.08,
  title: say(6) + 0.02,
  lockup: say(6) + 1.75,
  secondLine: say(7),
  finalHit: NARRATION_START + PHRASES[7][1] + 0.05,
  end: DURATION,
} as const;
