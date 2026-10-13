# Ailuunartime: AI manga motion reel

A 15 s vertical reel (1080×1920, 30 fps, H.264 + AAC) for Instagram Reels, made with Remotion following the `product-film` skill (`.claude/skills/product-film`).

> "Have you ever imagined reading manga like this?"

## Scenes (120 BPM grid, `src/reel/cues.ts`)

| Time | Scene | Component |
|---|---|---|
| 0.0–2.0 s | Impact, red slash, pixel-Asta logo resolves from dither, light sweep, wordmark | `IntroLogo.tsx` |
| 2.0–5.0 s | Manga wakes up: scream panel, wipe to the red-black blade, pan, parallax, Asta red-black in front | `MangaScene.tsx` |
| 5.0–7.5 s | Logo at the centre, four comments pop in one at a time | `CommentSequence.tsx` |
| 7.5–12.5 s | Concept reader on a phone: Motion toggle, push-in, mask reveal, blade layer, red energy, panel scroll | `ReaderDemo.tsx` |
| 12.5–15.0 s | "HAVE YOU EVER IMAGINED READING MANGA LIKE THIS?", logo lockup, final hit | `FinalTitle.tsx` |

Sound: `SoundDesign.tsx` places every effect on its cue (offset by the measured peak in `public/audio/sfx-peaks.json`) and ducks the music under the narration.

## Assets

- `source/`: the three Black Clover pages as supplied.
- `public/images/asta.png`: the supplied Asta PNG; `asta-redblack.png` is its red-and-black duotone.
- `public/images/asta-mascot.png`: the pixel Asta mascot used as the Ailuunartime mark (`tools/mascot.py`).
- `public/images/panels/`: panels cropped to the art (no balloons), upscaled 3× with line-art cleanup; only Asta's sword is painted red and black (`tools/prepare.py`).
- `public/audio/`: every sound synthesized from scratch with numpy (`tools/audio.py`); narration generated with Kokoro TTS, voice `am_michael`, Apache-2.0 (`tools/voiceover.py`).
- `public/fonts/`: Anton, Inter, JetBrains Mono (SIL OFL, from @fontsource).

## Commands

```bash
npm install
npm run studio                                    # preview
source scripts/env.sh                             # points Remotion at the preinstalled Chromium
bun scripts/stills.ts out/review/vN 60 150 300 --composition AilunarReel
bun scripts/render.ts v1                          # 60 fps master -> motion blur -> 30 fps MP4
uv run --with numpy --with pillow python3 tools/verify.py out/ailuunartime/v1/ailuunartime-reel.mp4
```

Regenerate assets: `tools/mascot.py`, `tools/prepare.py`, `tools/audio.py` (run with `uv run --with numpy --with pillow python3 ...`).

## Notes

- The reader is a concept demo built in code; its status bar says CONCEPT. No working product is claimed.
- Black Clover pages and character art belong to their rights holders; check usage rights before publishing.
