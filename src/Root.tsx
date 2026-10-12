import { Composition } from "remotion";
import { Video } from "./Video";
import { DURATION, FPS, H, W } from "./theme";

export const RemotionRoot: React.FC = () => {
  return <Composition id="Video" component={Video} durationInFrames={DURATION} fps={FPS} width={W} height={H} />;
};
