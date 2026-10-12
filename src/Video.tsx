import React from "react";
import { AbsoluteFill, Audio, staticFile, useCurrentFrame } from "remotion";
import { AUDIO, COLORS } from "./config";
import { Atmosphere } from "./components/Atmosphere";
import { Grain } from "./components/Grain";
import { WorldNetwork } from "./components/WorldNetwork";
import { pulse, ramp } from "./lib/anim";
import { Opening } from "./scenes/Opening";
import { Transformation } from "./scenes/Transformation";
import { TheDivide } from "./scenes/TheDivide";
import { Adaptation } from "./scenes/Adaptation";
import { Finale } from "./scenes/Finale";

export const Video: React.FC = () => {
  const frame = useCurrentFrame();
  // Grain only over dark scenes: fades out as Scene 4 turns bright, returns for the finale.
  const grain = 0.07 * (1 - ramp(frame, 900, 926)) + 0.07 * ramp(frame, 1490, 1510);
  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.bg }}>
      <Atmosphere particleBoost={pulse(frame, 24, 8) * 0.8} lightBoost={ramp(frame, 1490, 1540) * 0.04} />
      <WorldNetwork />
      <Opening />
      <Transformation />
      <TheDivide />
      <Adaptation />
      <Finale />
      <Grain opacity={grain} />
      {AUDIO.narration && <Audio src={staticFile(AUDIO.narration)} />}
      {AUDIO.effects && <Audio src={staticFile(AUDIO.effects)} />}
    </AbsoluteFill>
  );
};
