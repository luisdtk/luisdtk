"""Rig maps for animating inside the art, Live2D-style (no generative video).

For each image this writes a soft greyscale weight map: white where the art may flow (hair,
cape, the blade's energy, book pages, the tornado), black where it must hold still (faces).
tools/animate.py uses it to displace only those regions, so faces hold still and nothing tears.
It also cuts Asta's blade out of the sword panel's character layer, so the blade can sway
on its own pivot, and prints the skin colours used to draw eyelids for blinks.

Regions are traced on a normalised grid (0..1 of the image), see out/review/grids/.

    uv run --with numpy --with pillow python3 tools/rig.py
"""

from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFilter

ROOT = Path(__file__).resolve().parent.parent
IMG = ROOT / "public" / "images"
OUT = IMG / "rig"
SIZE = 512  # maps are small; the filter stretches them over the image

# name: (source image, [(shape, points or (cx, cy, rx, ry), strength)])
MAPS = {
    "sword-fg": ("panels/sword.png", [
        ("poly", [(0.33, 0.08), (0.58, 0.08), (0.58, 0.22), (0.33, 0.22)], 1.0),  # hair
        ("ellipse", (0.37, 0.48, 0.12, 0.14), 0.8),  # cape and tunic
    ]),
    "sword-blade": ("panels/sword.png", [
        ("poly", [(0.55, 0.0), (0.98, 0.0), (0.72, 0.55), (0.52, 0.66), (0.54, 0.3)], 1.0),
    ]),
    "tornado-fg": ("panels/tornado.png", [
        ("poly", [(0.2, 0.0), (0.42, 0.0), (0.4, 0.2), (0.22, 0.18)], 1.0),  # hair
        ("ellipse", (0.48, 0.42, 0.09, 0.12), 0.9),  # the book's pages
    ]),
    "tornado-bg": ("panels/tornado.png", [
        ("poly", [(0.45, 0.0), (0.88, 0.0), (0.88, 1.0), (0.45, 1.0)], 1.0),  # the tornado
    ]),
    "asta": ("asta-redblack.png", [
        ("poly", [(0.22, 0.18), (0.5, 0.0), (0.8, 0.12), (0.78, 0.33), (0.62, 0.28), (0.4, 0.3), (0.26, 0.36)], 1.0),  # hair
        ("ellipse", (0.27, 0.42, 0.05, 0.05), 0.7),  # side spikes
        ("ellipse", (0.68, 0.47, 0.05, 0.07), 0.7),
        ("poly", [(0.47, 0.62), (0.75, 0.6), (1.0, 0.64), (1.0, 0.94), (0.85, 0.96), (0.6, 0.88), (0.5, 0.75)], 1.0),  # cape
        ("ellipse", (0.36, 0.63, 0.07, 0.04), 0.5),  # collar
    ]),
    "scream": ("panels/asta-scream.png", [
        ("poly", [(0.0, 0.0), (1.0, 0.0), (1.0, 0.22), (0.0, 0.3)], 0.9),  # hair
    ]),
    "shock": ("panels/shock.png", [
        ("poly", [(0.0, 0.0), (1.0, 0.0), (1.0, 0.22), (0.0, 0.26)], 0.8),  # hair
    ]),
}


def weight_map(size, regions):
    w, h = size
    scale = SIZE / max(w, h)
    mw, mh = max(1, round(w * scale)), max(1, round(h * scale))
    canvas = Image.new("L", (mw, mh), 0)
    for shape, pts, strength in regions:
        layer = Image.new("L", (mw, mh), 0)
        d = ImageDraw.Draw(layer)
        value = int(255 * strength)
        if shape == "poly":
            d.polygon([(x * mw, y * mh) for x, y in pts], fill=value)
        else:
            cx, cy, rx, ry = pts
            d.ellipse([(cx - rx) * mw, (cy - ry) * mh, (cx + rx) * mw, (cy + ry) * mh], fill=value)
        canvas = Image.fromarray(np.maximum(np.asarray(canvas), np.asarray(layer)))
    return canvas.filter(ImageFilter.GaussianBlur(mw / 40)).convert("RGB")


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    for name, (src, regions) in MAPS.items():
        size = Image.open(IMG / src).size
        weight_map(size, regions).save(OUT / f"{name}.png", optimize=True)
        print(name, size)

    # the sword panel's character layer without the blade, so the blade can sway on its own
    fg = np.asarray(Image.open(IMG / "layers" / "sword-fg.png").convert("RGBA")).astype(float)
    blade = np.asarray(Image.open(IMG / "panels" / "sword-blade.png").convert("RGBA")).astype(float)[..., 3:] / 255
    fg[..., 3:] *= 1 - np.clip(blade * 1.4, 0, 1)
    Image.fromarray(fg.astype(np.uint8), "RGBA").save(IMG / "layers" / "sword-fg-noblade.png", optimize=True)

    # skin colours under the eyes, for the eyelids drawn on blinks
    asta = np.asarray(Image.open(IMG / "asta-redblack.png").convert("RGB"))
    for label, (x, y) in {"asta below left eye": (0.39, 0.49), "asta below right eye": (0.55, 0.45)}.items():
        px = asta[int(y * asta.shape[0]) - 4:int(y * asta.shape[0]) + 4, int(x * asta.shape[1]) - 4:int(x * asta.shape[1]) + 4].reshape(-1, 3).mean(0)
        print(label, "#%02x%02x%02x" % tuple(int(c) for c in px))


if __name__ == "__main__":
    main()
