import React from "react";
import { Composition } from "remotion";
import { VIDEO } from "./config";
import { Video } from "./Video";
import "./fonts";

export const RemotionRoot: React.FC = () => {
  return (
    <Composition
      id={VIDEO.id}
      component={Video}
      durationInFrames={VIDEO.durationInFrames}
      fps={VIDEO.fps}
      width={VIDEO.width}
      height={VIDEO.height}
    />
  );
};
