import { execFileSync } from "node:child_process";
import { mkdirSync, rmSync, statSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { bundle } from "@remotion/bundler";
import { renderMedia, selectComposition } from "@remotion/renderer";

/**
 * Final render, after the product-film skill's pipeline, sized for a 30 fps Reel:
 * 1. master at 60 fps (sub-frames), with the full audio mix
 * 2. motion blur: tmix averages each pair of sub-frames (a 180-degree shutter), select keeps one, 30 fps
 * 3. colour converted once (limited-range BT.601 master -> BT.709, tagged), H.264 + AAC 256k, faststart
 *
 *   bun scripts/render.ts [version]
 */
const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const version = process.argv[2] ?? "v1";
const out = join(root, "out", "ailuunartime", version);
mkdirSync(out, { recursive: true });
const master = join(out, "master-60fps.mp4");
const final = join(out, "ailuunartime-reel.mp4");
const browserExecutable = process.env.REMOTION_BROWSER ?? undefined;

const serveUrl = await bundle({ entryPoint: join(root, "src/index.ts"), publicDir: join(root, "public") });
const inputProps = { fps: 60 };
const composition = await selectComposition({ serveUrl, id: "AilunarReel", inputProps, browserExecutable });

let last = 0;
await renderMedia({
  serveUrl,
  composition,
  inputProps,
  codec: "h264",
  crf: 10,
  pixelFormat: "yuv444p",
  imageFormat: "jpeg",
  jpegQuality: 95,
  audioCodec: "aac",
  audioBitrate: "320k",
  outputLocation: master,
  overwrite: true,
  concurrency: 4,
  browserExecutable,
  onProgress: ({ progress }) => {
    const pct = Math.floor(progress * 100);
    if (pct >= last + 10) {
      last = pct;
      console.log(`master ${pct}%`);
    }
  },
});

execFileSync("ffmpeg", [
  "-v", "error", "-y", "-i", master,
  "-vf", "tmix=frames=2,select='not(mod(n+1\\,2))',setpts=N/(30*TB),scale=in_range=tv:out_range=tv:in_color_matrix=bt601:out_color_matrix=bt709,format=yuv420p",
  "-r", "30", "-c:v", "libx264", "-preset", "slow", "-crf", "16", "-profile:v", "high",
  "-color_primaries", "bt709", "-color_trc", "bt709", "-colorspace", "bt709", "-color_range", "tv",
  "-c:a", "aac", "-b:a", "256k", "-ar", "48000", "-movflags", "+faststart",
  final,
], { stdio: "inherit" });

execFileSync("ffmpeg", ["-v", "error", "-y", "-ss", "13.8", "-i", final, "-frames:v", "1", "-q:v", "2", join(out, "poster.jpg")], { stdio: "inherit" });
rmSync(master);
console.log(final, `${(statSync(final).size / 1e6).toFixed(1)} MB`);
