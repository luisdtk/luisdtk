// Renders inspection stills: node scripts/stills.mjs <outDir> <frame> [frame...]
import { bundle } from "@remotion/bundler";
import { renderStill, selectComposition } from "@remotion/renderer";
import path from "node:path";
import fs from "node:fs";

const [outDir, ...frames] = process.argv.slice(2);
fs.mkdirSync(outDir, { recursive: true });
const serveUrl = await bundle({ entryPoint: path.resolve("src/index.ts") });
const local = "/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell";
const browserExecutable = fs.existsSync(local) ? local : null;
const composition = await selectComposition({ serveUrl, id: "Video", browserExecutable });
for (const f of frames.map(Number)) {
  await renderStill({ serveUrl, composition, frame: f, browserExecutable, output: path.join(outDir, `f${String(f).padStart(4, "0")}.png`) });
  console.log("rendered", f);
}
