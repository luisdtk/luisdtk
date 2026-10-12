import React, { useEffect, useState } from "react";
import { AbsoluteFill, Audio, continueRender, delayRender, getStaticFiles, staticFile, useCurrentFrame } from "remotion";
import { C, fontsReady } from "./theme";
import { Glow, Grain } from "./components/Background";
import { Part1 } from "./parts/Part1";
import { Part2 } from "./parts/Part2";
import { Part3 } from "./parts/Part3";
import { Part4 } from "./parts/Part4";
import { Part5 } from "./parts/Part5";
import { Mascot } from "./parts/Mascot";

const hasFile = (name: string) => getStaticFiles().some((s) => s.name === name);

export const Video: React.FC = () => {
  const frame = useCurrentFrame();
  const [ready, setReady] = useState(false);
  const [handle] = useState(() => delayRender("Carregando fontes"));
  useEffect(() => {
    fontsReady().then(() => {
      setReady(true);
      continueRender(handle);
    });
  }, [handle]);

  return (
    <AbsoluteFill style={{ background: C.bg, filter: "grayscale(1)" }}>
      {hasFile("narracao.mp3") && <Audio src={staticFile("narracao.mp3")} />}
      {hasFile("efeitos.mp3") && <Audio src={staticFile("efeitos.mp3")} />}
      {ready && (
        <>
          <Glow frame={frame} />
          <Part1 frame={frame} />
          <Part2 frame={frame} />
          <Grain frame={frame} />
          <Part3 frame={frame} />
          <Part4 frame={frame} />
          <Part5 frame={frame} />
          <Mascot frame={frame} />
        </>
      )}
    </AbsoluteFill>
  );
};
