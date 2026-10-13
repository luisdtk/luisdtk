import { Composition } from "remotion";

import { DURATION } from "./reel/cues";
import { Reel, type ReelProps } from "./reel/Reel";
import { FRAME } from "./reel/tokens";

export function Root() {
  return (
    <Composition
      id="AilunarReel"
      component={Reel}
      width={FRAME.width}
      height={FRAME.height}
      fps={30}
      durationInFrames={DURATION * 30}
      defaultProps={{ fps: 30 } satisfies ReelProps}
      calculateMetadata={({ props }) => ({ fps: props.fps, durationInFrames: Math.round(DURATION * props.fps) })}
    />
  );
}
