import { at, type Grid } from "../kit/time";

/**
 * The beat sheet as data. 120 BPM, 4/4: a beat is 0.5 s, a bar 2 s.
 * Scene code reads these names, never literal times.
 */
export const GRID: Grid = { bpm: 120, firstBeat: 0, pickupBeats: 0, beatsPerBar: 4 };
const b = (bar: number, beat = 1, fraction = 0) => at(GRID, bar, beat, fraction);

export const DURATION = 15;

export const cue = {
  // Scene 1, the hook (bar 1)
  impact: b(1),
  slash: b(1, 1, 0.16),
  logoIn: b(1, 1, 0.75),
  sweep: b(1, 2, 0.2),
  wordmark: b(1, 2),
  introOut: b(1, 4, 0.6),

  // Scene 2, Asta comes alive (bars 2 to 3.5)
  manga: b(2),
  scream: b(2),
  swordWipe: b(2, 2, 0.6),
  swordPan: b(2, 3, 0.5),
  swordPull: b(2, 4),
  energy: b(2, 4),
  astaSlam: b(3),
  mangaOut: b(3, 2, 0.9),

  // Scene 3, the reaction (bars 3.5 to 4.75)
  reaction: b(3, 3),
  comments: [b(3, 3, 0.4), b(3, 4, 0.5), b(4, 1, 0.6), b(4, 2, 0.7)],
  reactionOut: b(4, 3, 0.9),

  // Scene 4, the reader (bars 4.75 to 7.25)
  reader: b(4, 4),
  motionOn: b(5, 1, 0.6),
  pushIn: b(5, 2, 0.2),
  maskReveal: b(5, 3),
  foreground: b(5, 4),
  readerEnergy: b(6, 1, 0.6),
  nextPanel: b(6, 2, 0.2),
  thumb: b(6, 3, 0.8),
  readerOut: b(6, 4, 0.8),

  // Scene 5, the final message (bars 7.25 to 8.5)
  final: b(7, 2),
  title: b(7, 2, 0.2),
  finalHit: b(8, 1, 0.7),
  end: DURATION,

  // Narration (Kokoro am_michael), placed on the scenes it belongs to
  vo: [b(2, 1, 0.2), b(4, 4, 0.7), b(7, 2, 0.5)],
} as const;
