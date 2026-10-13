# Ailuunartime: AI manga motion reel

A 19.5 s vertical reel (1080×1920, 30 fps, H.264 + AAC) for Instagram Reels, made with Remotion following the `product-film` skill (`.claude/skills/product-film`).

> "Have you ever imagined reading manga like this?"

## Scenes (timed to the narration, `src/reel/cues.ts`)

| Time | Narration | Scene | Component |
|---|---|---|---|
| 0.0–3.0 s | "Imagine reading Black Clover like this." | A red slash draws the logo (small, centred); six manga folders burst out and float; the mouse glides to Black Clover, hovers, and clicks as the narration names it; the folder opens and its pages fly into a sideways carousel of moving panels (2.5D); the blade card grows to fill the frame | `IntroLogo.tsx`, `Folders.tsx`, `MangaCarousel.tsx` |
| 3.0–7.2 s | "The characters move. The scenes come to life. And suddenly" | Manga-to-anime 2.5D, after the user's reference: characters cut from their backgrounds (`tools/segment.py`, isnet-anime) so slow dollies open real depth; backgrounds out of focus, soft bloom and haze, red bokeh in front; shots hand over with a blurred pan and a focus pull; Asta under a red sun and pillars at their own depths | `MangaScene.tsx`, `panel.tsx` (`LayeredPanel`) |
| 7.2–11.2 s | "reading manga feels like watching anime. And the crazy part?" | Concept reader on a phone: the pixel mascot bobs and blinks, then hops and grins as Motion turns on; every panel wakes up (slices, focus lines, shakes, an impact frame) and lifts off the page; push-in, mask reveal, blade layer, red energy, panel scroll | `ReaderDemo.tsx`, `inkfx.tsx` |
| 11.2–13.8 s | "AI is making things like this possible." | A generic social post of the animated page: comment sheet slides up, new comments land on top and push the rest down (the brief's four among other readers'), likes climb, hearts rise | `PostScene.tsx` |
| 13.8–19.5 s | "The AI era is here. Imagine manga that moves like anime." | "Have you ever / imagined reading / manga like this?" in three typefaces, the logo, final hit | `FinalTitle.tsx` |

Sound: `SoundDesign.tsx` places every effect on its cue (offset by the measured peak in `public/audio/sfx-peaks.json`) and ducks the music under the narration.

## Assets

- `source/`: the three Black Clover pages and the logo as supplied.
- Folder pages for Naruto, JoJo, One Piece, Demon Slayer and Chainsaw Man are drawn in code (`DrawnPage`), not real pages; swap in supplied pages via `FOLDERS` in `IntroLogo.tsx`.
- `public/images/asta.png`: the supplied Asta PNG; `asta-redblack.png` is its red-and-black duotone.
- `public/images/logo-white.png`, `logo-red.png`: the supplied Ailuunartime logo cut out of its white background (`tools/logo.py`).
- `public/images/asta-mascot*.png`: the pixel Asta mascot in three expressions (smirk, smile, blink), animated as the reader app icon (`tools/mascot.py`).
- `public/images/layers/`: character and background layers for the sword and wind panels (isnet-anime matte + OpenCV inpaint, `tools/segment.py`).
- `public/images/panels/`: panels cropped to the art (no balloons), upscaled 3× with line-art cleanup; only Asta's sword is painted red and black (`tools/prepare.py`).
- `public/audio/`: every sound synthesized from scratch with numpy (`tools/audio.py`); `narration.wav` is the supplied ElevenLabs narration (+5 dB). `tools/voiceover.py` keeps the earlier Kokoro TTS fallback.
- `public/fonts/`: Inter, JetBrains Mono, Instrument Serif (italic), Syne (800), Anton (SIL OFL, from @fontsource). Scenes use different voices; the final line mixes Inter, Instrument Serif and Syne.

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
