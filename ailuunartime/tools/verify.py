"""Check a rendered reel: format, duration, decoded colours, audio presence per scene, frame sheet.

    uv run --with numpy --with pillow python3 tools/verify.py out/ailuunartime/v1/ailuunartime-reel.mp4
"""

import json
import subprocess
import sys
from pathlib import Path

import numpy as np
from PIL import Image

path = Path(sys.argv[1])
probe = json.loads(subprocess.run(
    ["ffprobe", "-v", "error", "-show_streams", "-show_format", "-of", "json", str(path)],
    capture_output=True, text=True, check=True).stdout)
video = next(s for s in probe["streams"] if s["codec_type"] == "video")
audio = [s for s in probe["streams"] if s["codec_type"] == "audio"]
duration = float(probe["format"]["duration"])
num, den = map(int, video["r_frame_rate"].split("/"))
print(f"video   {video['codec_name']} {video['width']}x{video['height']} @ {num / den:g} fps, {video.get('pix_fmt')}, {video.get('color_space')}")
print(f"frames  {video.get('nb_frames')}   duration {duration:.3f}s   size {path.stat().st_size / 1e6:.1f} MB")
print(f"audio   {[(a['codec_name'], a['sample_rate'], a['channels']) for a in audio]}")

ok = True
def check(cond, label):
    global ok
    ok &= cond
    print(("PASS " if cond else "FAIL ") + label)

check(video["width"] == 1080 and video["height"] == 1920, "1080x1920, 9:16")
check(abs(num / den - 30) < 0.01, "30 fps")
check(10 <= duration <= 20, "duration within 10 to 20 s")
check(len(audio) == 1, "one audio stream")


def frame(t):
    raw = subprocess.run(["ffmpeg", "-v", "error", "-ss", f"{t}", "-i", str(path), "-frames:v", "1", "-f", "rawvideo", "-pix_fmt", "rgb24", "-"],
                         capture_output=True, check=True).stdout
    return np.frombuffer(raw, np.uint8).reshape(1920, 1080, 3)

# no black frames once the hook has started, background reads as #0a0a0a not lifted grey
lum = []
for t in np.arange(0.2, duration - 0.05, 0.25):
    lum.append((round(t, 2), float(frame(t).mean())))
dark = [t for t, l in lum if l < 4]
print("mean luma every 0.25 s:", " ".join(f"{t}:{l:.0f}" for t, l in lum))
check(not dark, f"no near-black frames after 0.2 s {dark}")
corner = frame(12.0)[60:120, 60:120].reshape(-1, 3).mean(0)
check(all(c <= 14 for c in corner), f"dark background not lifted to grey by colour range (got {corner.round(1)}; the vignette takes corners to black)")

# audio: loudness per half second, nothing silent where the reel plays
pcm = subprocess.run(["ffmpeg", "-v", "error", "-i", str(path), "-ac", "1", "-ar", "8000", "-f", "s16le", "-"], capture_output=True, check=True).stdout
samples = np.frombuffer(pcm, np.int16).astype(float) / 32768
win = 4000
rms = [20 * np.log10(np.sqrt(np.mean(samples[i:i + win] ** 2)) + 1e-9) for i in range(0, len(samples) - win, win)]
print("audio dBFS per 0.5 s:", " ".join(f"{r:.0f}" for r in rms))
check(max(rms) < -1 and min(rms[:-1]) > -45, "audio present throughout, no clipping")

# sheet of the scenes for a final look
times = [0.5, 1.2, 2.5, 3.6, 5.6, 6.8, 8.0, 9.0, 9.6, 10.5, 12.0, 13.2, 15.0, duration - 0.12]
tiles = [Image.fromarray(frame(t)).resize((216, 384)) for t in times]
sheet = Image.new("RGB", (7 * 220, 2 * 388), (50, 50, 50))
for i, tile in enumerate(tiles):
    sheet.paste(tile, ((i % 7) * 220, (i // 7) * 388))
sheet.save(path.with_name("contact-sheet.png"))
print("sheet", path.with_name("contact-sheet.png"))
print("ALL CHECKS PASS" if ok else "SOME CHECKS FAILED")
