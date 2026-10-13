# AI Is Changing The World — Reel

A 58.8 s, 1080×1920, 30 fps Instagram Reel built with [Remotion](https://remotion.dev).
Light editorial look: off-white paper, near-black serif type (Newsreader), Inter for UI text, green accent.

## Structure

| Scene | Time | File |
|---|---|---|
| 01 Hook | 0.0–4.4 s | `src/scenes/Scene01Hook.jsx` |
| 02 Worlds colliding (Steve → portal → uploaded gameplay) | 4.4–13.1 s | `Scene02WorldsColliding.jsx` |
| 03 One world, infinite possibilities | 13.1–20.6 s | `Scene03OneWorld.jsx` |
| 04 Meta moment — "Claude is editing this video." | 20.6–33.4 s | `Scene04MetaMoment.jsx` |
| 05 Code becomes creation | 33.4–39.6 s | `Scene05CodeBecomesCreation.jsx` |
| 06 The viewer is part of it | 39.6–42.2 s | `Scene06ViewerIsPartOfIt.jsx` |
| 07 Beyond gaming | 42.2–47.5 s | `Scene07BeyondGaming.jsx` |
| 08 The future is already here | 47.5–51.1 s | `Scene08FutureIsHere.jsx` |
| 09 Claude | 51.1–54.1 s | `Scene09ClaudeBrand.jsx` |
| 10 Final impact | 54.1–58.8 s | `Scene10FinalImpact.jsx` |

`src/timeline.json` is the single source of truth: scene cuts and narration phrase times
(used by the scenes, captions, editor UI and the music ducking).

## Assets

- `public/video/footage.mp4` — the uploaded Minecraft × GTA V gameplay (hotbar cropped, audio removed).
- `public/audio/voice.wav` — the ElevenLabs narration, pauses tightened and tempo ×1.05 to fit under 59 s.
- `public/audio/user/*` — sounds sliced from the supplied effects track.
- `public/audio/music.wav`, `public/audio/sfx/*` — original procedural score and SFX from `tools/build_audio.py`.
- Sound cues are placed per frame in `src/audio/SoundTrack.jsx`.

## Commands

```bash
npm install
npm run audio -- <voice.mp3> <effects.mp3>   # rebuild audio assets (needs python3, numpy, soundfile, ffmpeg)
npm run studio                               # preview
npm run render && npm run master             # out/ai-revolution-reel.mp4 (loudness -14 LUFS)
```

The Steve character, block world, portal, worlds, interfaces and city are original procedural
drawings; the official Claude logo is not included.
