"""Turn the supplied manga pages and Asta PNG into film-ready layers.

- Crops the chosen panels (art only: speech balloons and page captions stay out).
- Upscales 3x and cleans the line art (soft denoise, levels, unsharp), still pure black and white.
- Paints Asta's sword red and black (the only colour on the manga).
- Cuts the sword out as its own layer for parallax.
- Gives the Asta PNG the red-and-black duotone.

    uv run --with numpy --with pillow python3 tools/prepare.py
"""

from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFilter

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "source"
OUT = ROOT / "public" / "images"
SCALE = 3

# page, crop box (page pixels)
PANELS = {
    "sword": ("page-1-colosseum", (330, 860, 905, 1560)),
    "yuno-smile": ("page-1-colosseum", (104, 486, 960, 690)),
    "asta-scream": ("page-2-wizard-king", (290, 0, 790, 751)),
    "tornado": ("page-3-tornado", (102, 338, 1206, 1120)),
    "shock": ("page-3-tornado", (470, 1148, 780, 1790)),
}

# Asta's blade on page 1, traced on a coordinate grid (page pixels)
SWORD = [
    (655, 860), (893, 860), (879, 960), (859, 1060), (829, 1130), (785, 1198),
    (736, 1256), (688, 1298), (655, 1322), (640, 1280), (643, 1150), (646, 1000), (650, 900),
]

RED = np.array([226, 38, 43], float)
INK = np.array([10, 6, 7], float)


def clean(gray: Image.Image) -> Image.Image:
    """3x upscale with line-art cleanup: crisp blacks, paper whites."""
    big = gray.resize((gray.width * SCALE, gray.height * SCALE), Image.LANCZOS)
    big = big.filter(ImageFilter.GaussianBlur(0.9))
    a = np.asarray(big).astype(float)
    a = np.clip((a - 38) / (222 - 38), 0, 1) ** 1.08
    big = Image.fromarray((a * 255).astype(np.uint8))
    return big.filter(ImageFilter.UnsharpMask(radius=2.2, percent=110, threshold=2))


def sword_mask(box, size):
    x0, y0 = box[0], box[1]
    mask = Image.new("L", size, 0)
    pts = [((x - x0) * SCALE, (y - y0) * SCALE) for x, y in SWORD]
    ImageDraw.Draw(mask).polygon(pts, fill=255)
    return mask.filter(ImageFilter.GaussianBlur(4))


def paint_sword(panel: Image.Image, mask: Image.Image):
    """Black stays black, the blade's light streaks turn Asta red."""
    lum = np.asarray(panel).astype(float)[..., None] / 255
    m = np.asarray(mask).astype(float)[..., None] / 255
    grey = np.repeat(lum * 255, 3, axis=2)
    red = INK + (RED - INK) * np.clip(lum * 1.35, 0, 1)
    rgb = grey * (1 - m) + red * m
    colour = Image.fromarray(rgb.astype(np.uint8), "RGB")
    # the blade alone, transparent elsewhere, for the parallax layer
    layer = colour.convert("RGBA")
    layer.putalpha(mask)
    return colour, layer


def duotone(src: Image.Image) -> Image.Image:
    rgba = np.asarray(src.convert("RGBA")).astype(float)
    lum = (rgba[..., :3] @ np.array([0.299, 0.587, 0.114])) / 255
    stops = [(0.0, (6, 4, 5)), (0.32, (60, 6, 10)), (0.62, (226, 38, 43)), (0.86, (255, 120, 110)), (1.0, (255, 244, 240))]
    out = np.zeros(lum.shape + (3,))
    for (p0, c0), (p1, c1) in zip(stops, stops[1:]):
        sel = (lum >= p0) & (lum <= p1)
        u = ((lum - p0) / (p1 - p0))[sel][:, None]
        out[sel] = np.array(c0) + (np.array(c1) - np.array(c0)) * u
    rgba[..., :3] = out
    return Image.fromarray(rgba.astype(np.uint8), "RGBA")


def main():
    (OUT / "panels").mkdir(parents=True, exist_ok=True)
    for name, (page, box) in PANELS.items():
        gray = Image.open(SRC / f"{page}.jpg").convert("L").crop(box)
        panel = clean(gray)
        if name == "sword":
            colour, blade = paint_sword(panel, sword_mask(box, panel.size))
            colour.save(OUT / "panels" / "sword.png", optimize=True)
            blade.save(OUT / "panels" / "sword-blade.png", optimize=True)
        else:
            panel.convert("RGB").save(OUT / "panels" / f"{name}.png", optimize=True)
        print(name, panel.size)

    asta = Image.open(OUT / "asta.png")
    asta = asta.resize((1400, 1400), Image.LANCZOS)
    duotone(asta).save(OUT / "asta-redblack.png", optimize=True)
    print("asta-redblack", asta.size)


if __name__ == "__main__":
    main()
