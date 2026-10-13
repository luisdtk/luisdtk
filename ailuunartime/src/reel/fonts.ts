import { loadFont } from "@remotion/fonts";
import { staticFile } from "remotion";

import { font } from "./tokens";

/** Fonts are local files (OFL, from @fontsource), loaded before the first frame renders. */
export const fontsReady = Promise.all([
  loadFont({ family: font.display, url: staticFile("fonts/anton-latin-400-normal.woff2"), weight: "400" }),
  loadFont({ family: font.ui, url: staticFile("fonts/inter-latin-400-normal.woff2"), weight: "400" }),
  loadFont({ family: font.ui, url: staticFile("fonts/inter-latin-500-normal.woff2"), weight: "500" }),
  loadFont({ family: font.ui, url: staticFile("fonts/inter-latin-600-normal.woff2"), weight: "600" }),
  loadFont({ family: font.ui, url: staticFile("fonts/inter-latin-800-normal.woff2"), weight: "800" }),
  loadFont({ family: font.mono, url: staticFile("fonts/jetbrains-mono-latin-500-normal.woff2"), weight: "500" }),
]);
