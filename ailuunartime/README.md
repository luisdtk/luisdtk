# Ailuunartime: AI manga motion reel

A 19.5 s vertical reel (1080×1920, 30 fps, H.264 + AAC) for Instagram Reels, made with Remotion following the `product-film` skill (`.claude/skills/product-film`).

> "Have you ever imagined reading manga like this?"

## Scenes (timed to the narration, `src/reel/cues.ts`)

| Time | Narration | Scene | Component |
|---|---|---|---|
| 0.0–2.0 s | "Imagine reading Black Clover like this." | Impact, red slash, pixel-Asta logo resolves from dither, light sweep, wordmark | `IntroLogo.tsx` |
| 2.0–7.2 s | "The characters move. The scenes come to life. And suddenly" | Scream panel, wipe to the red-black blade, pan, parallax, wind panel turning, Asta red-black slams in front | `MangaScene.tsx` |
| 7.2–11.2 s | "reading manga feels like watching anime. And the crazy part?" | Concept reader on a phone: Motion toggle, push-in, mask reveal, blade layer, red energy, panel scroll | `ReaderDemo.tsx` |
| 11.2–13.8 s | "AI is making things like this possible." | Logo at the centre, four comments pop in one at a time | `CommentSequence.tsx` |
| 13.8–19.5 s | "The AI era is here. Imagine manga that moves like anime." | "HAVE YOU EVER IMAGINED READING MANGA LIKE THIS?", logo lockup, final hit | `FinalTitle.tsx` |

Sound: `SoundDesign.tsx` places every effect on its cue (offset by the measured peak in `public/audio/sfx-peaks.json`) and ducks the music under the narration.

## Assets

- `source/`: the three Black Clover pages as supplied.
- `public/images/asta.png`: the supplied Asta PNG; `asta-redblack.png` is its red-and-black duotone.
- `public/images/logo-white.png`, `logo-red.png`: the supplied Ailuunartime logo cut out of its white background (`tools/logo.py`).
- `public/images/asta-mascot.png`: the pixel Asta mascot, used as the reader app icon (`tools/mascot.py`).
- `public/images/panels/`: panels cropped to the art (no balloons), upscaled 3× with line-art cleanup; only Asta's sword is painted red and black (`tools/prepare.py`).
- `public/audio/`: every sound synthesized from scratch with numpy (`tools/audio.py`); `narration.wav` is the supplied ElevenLabs narration (+5 dB). `tools/voiceover.py` keeps the earlier Kokoro TTS fallback.
- `public/fonts/`: Anton, Inter, JetBrains Mono (SIL OFL, from @fontsource).

## Commands

```bash
npm install
npm run studio                                    # preview
source scripts/env.sh                             # points Remotion at the preinstalled Chromium
bun scripts/stills.ts out/review/vN 60 150 300 --composition AilunarReel
bun scripts/render.ts v2 30                       # 30 fps master -> MP4 (pass 60 for a motion-blurred master)
uv run --with numpy --with pillow python3 tools/verify.py out/ailuunartime/v2/ailuunartime-reel.mp4
```

Regenerate assets: `tools/mascot.py`, `tools/prepare.py`, `tools/audio.py` (run with `uv run --with numpy --with pillow python3 ...`).

## Notes

- The reader is a concept demo built in code; its status bar says CONCEPT. No working product is claimed.
- Black Clover pages and character art belong to their rights holders; check usage rights before publishing.
