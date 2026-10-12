import { loadFont } from "@remotion/fonts";
import { staticFile } from "remotion";

// Fonts are bundled locally in public/fonts (no network requests at render time).
const fonts = [
  { family: "Inter", file: "fonts/Inter.woff2" },
  { family: "Source Serif 4", file: "fonts/SourceSerif4.woff2" },
  { family: "JetBrains Mono", file: "fonts/JetBrainsMono.woff2" },
  { family: "Outfit", file: "fonts/Outfit.woff2" },
];

export const fontsReady = Promise.all(
  fonts.map((f) =>
    loadFont({
      family: f.family,
      url: staticFile(f.file),
      weight: "100 900",
      format: "woff2",
    }),
  ),
);
