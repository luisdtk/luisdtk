"""The chapter cover (Asta and Yuno with the blade) for the end of the reader.

Crops the page out of the reader screenshot, removes the chapter title, crushes the textured
ground to black, lifts the characters to white, and paints only Asta's blade black and red.
Writes public/images/redink/cover.png, animated by tools/animate_pages.py.

    uv run --with numpy --with pillow python3 tools/cover.py
"""

from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFilter

ROOT = Path(__file__).resolve().parent.parent
# the blade and its hilt, normalised to the cropped page
BLADE = [(0.022, 0.055), (0.12, 0.048), (0.69, 0.372), (0.6, 0.47), (0.03, 0.118)]
HILT = [(0.6, 0.42), (0.66, 0.41), (0.84, 0.555), (0.8, 0.575)]

im = Image.open(ROOT / "source" / "page-2-cover.png").convert("RGB").crop((0, 268, 1206, 2080))
a = np.asarray(im).astype(np.float32)
a[60:135, 290:1110] = np.median(a[140:200, 300:1100].reshape(-1, 3), axis=0)  # the chapter title
lum = a.mean(axis=2) / 255
# ground to black, characters to white: a steep curve around the ground's grey
v = np.clip((lum - 0.2) / 0.62, 0, 1) ** 0.85
import sys as _sys

_sys.path.insert(0, str(Path(__file__).resolve().parent))
from duotone import duotone  # noqa: E402

out = duotone(a.clip(0, 255).astype(np.uint8)).astype(np.float32)
w, h = im.size
mask = Image.new("L", im.size, 0)
d = ImageDraw.Draw(mask)
for poly in (BLADE, HILT):
    d.polygon([(x * w, y * h) for x, y in poly], fill=255)
m = np.asarray(mask.filter(ImageFilter.GaussianBlur(3))).astype(np.float32) / 255
# only the blade's own pixels (lighter than the black ground) inside the traced shape
m = (m * np.clip((v - 0.06) / 0.12, 0, 1))[..., None]
# the blade: its pale steel turns black, its dark mottling turns Asta red
stops = [(0.0, (10, 5, 6)), (0.3, (60, 6, 10)), (0.6, (226, 38, 43)), (1.0, (255, 90, 80))]
v_blade = np.clip(1 - v * 1.15, 0, 1)
red = np.zeros_like(out)
for (p0, c0), (p1, c1) in zip(stops, stops[1:]):
    sel = (v_blade >= p0) & (v_blade <= p1)
    u = ((v_blade - p0) / (p1 - p0))[sel][:, None]
    red[sel] = np.array(c0) + (np.array(c1) - np.array(c0)) * u
out = out * (1 - m) + red * m
Image.fromarray(out.clip(0, 255).astype(np.uint8)).save(ROOT / "public" / "images" / "redink" / "cover.png", optimize=True)
print("cover", im.size)
