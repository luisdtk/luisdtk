import { AbsoluteFill } from "remotion";

import { useTime } from "../kit/time";
import { FinalTitle } from "./FinalTitle";
import "./fonts";
import { Grain, Vignette } from "./fx";
import { IntroLogo } from "./IntroLogo";
import { MangaScene } from "./MangaScene";
import { PostScene } from "./PostScene";
import { ReaderDemo } from "./ReaderDemo";
import { SoundDesign } from "./SoundDesign";
import { color } from "./tokens";

export type ReelProps = { fps: number };

/** Ailuunartime: AI manga motion reel. Every layer reads time once and is a pure function of it. */
export function Reel() {
  const t = useTime();
  return (
    <AbsoluteFill style={{ background: color.bg }}>
      <IntroLogo t={t} />
      <MangaScene t={t} />
      <ReaderDemo t={t} />
      <PostScene t={t} />
      <FinalTitle t={t} />
      <Vignette strength={0.55} />
      <Grain t={t} opacity={0.06} />
      <SoundDesign />
    </AbsoluteFill>
  );
}
