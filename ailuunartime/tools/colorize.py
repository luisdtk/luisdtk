"""Colour the characters on the manga panels with their series colours, like a coloured manga.

Flat colours are multiplied over the line art inside traced regions (normalised 0..1 of each
panel, see out/review/grids/), so inks and screentones stay intact and backgrounds stay black
and white. In the panels with a cut-out character the colour is also limited to its matte.

Asta: silver hair, green eyes, peach skin, pale blue shirt. Yuno: black hair with a blue cast,
golden eyes, peach skin. Asta's blade keeps its red and black.

Writes public/images/color/<panel>.png and the coloured character layers
(public/images/layers/<name>-color.png), which tools/animate.py animates.

    uv run --with numpy --with pillow python3 tools/colorize.py
"""

from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFilter

ROOT = Path(__file__).resolve().parent.parent
IMG = ROOT / "public" / "images"
OUT = IMG / "color"

SKIN = (247, 205, 176)
ASTA_HAIR = (214, 207, 194)
ASTA_EYES = (58, 160, 80)
SHIRT = (206, 220, 242)
MOUTH = (178, 58, 58)
YUNO_HAIR = (52, 58, 78)
YUNO_EYES = (226, 168, 58)
PANTS = (221, 213, 197)
BOOK = (239, 223, 184)

# panel: (character matte or None, [(shape, geometry, colour)]); later regions paint over earlier ones,
# and colour None punches a hole (eye whites, lettering) that keeps the original.
REGIONS = {
    "asta-scream": (None, [
        ("poly", [(0.12, 0.2), (0.25, 0.12), (0.4, 0.08), (0.6, 0.07), (0.75, 0.12), (0.88, 0.2), (0.93, 0.32), (0.85, 0.42), (0.7, 0.35), (0.5, 0.3), (0.3, 0.32), (0.17, 0.38), (0.1, 0.3)], ASTA_HAIR),
        ("poly", [(0.17, 0.38), (0.35, 0.36), (0.6, 0.35), (0.78, 0.42), (0.8, 0.55), (0.72, 0.65), (0.58, 0.78), (0.45, 0.8), (0.3, 0.72), (0.2, 0.6), (0.15, 0.5)], SKIN),
        ("ellipse", (0.52, 0.67, 0.09, 0.08), MOUTH),
        ("ellipse", (0.44, 0.45, 0.07, 0.05), None),
        ("ellipse", (0.67, 0.51, 0.05, 0.04), None),
    ]),
    "shock": (None, [
        ("poly", [(0.25, 0.02), (1.0, 0.02), (1.0, 0.22), (0.6, 0.25), (0.4, 0.2), (0.25, 0.15)], ASTA_HAIR),
        ("poly", [(0.1, 0.2), (0.3, 0.18), (0.55, 0.25), (1.0, 0.3), (1.0, 0.82), (0.3, 0.82), (0.2, 0.7), (0.12, 0.5)], SKIN),
        ("ellipse", (0.43, 0.27, 0.18, 0.08), None),
        ("ellipse", (1.0, 0.28, 0.1, 0.08), None),
        ("poly", [(0.52, 0.44), (0.95, 0.44), (0.95, 0.64), (0.52, 0.64)], None),
    ]),
    "sword": ("layers/sword-fg-noblade.png", [
        ("poly", [(0.33, 0.1), (0.57, 0.1), (0.57, 0.24), (0.47, 0.22), (0.36, 0.25)], ASTA_HAIR),
        ("poly", [(0.38, 0.22), (0.55, 0.22), (0.55, 0.36), (0.44, 0.39), (0.38, 0.33)], SKIN),
        ("poly", [(0.4, 0.37), (0.52, 0.37), (0.53, 0.55), (0.42, 0.6), (0.36, 0.55)], SHIRT),
        ("ellipse", (0.436, 0.284, 0.02, 0.014), None),
        ("ellipse", (0.522, 0.286, 0.02, 0.014), None),
        ("ellipse", (0.436, 0.284, 0.007, 0.006), ASTA_EYES),
        ("ellipse", (0.522, 0.286, 0.007, 0.006), ASTA_EYES),
    ]),
    "tornado": ("layers/tornado-fg.png", [
        ("poly", [(0.2, 0.0), (0.42, 0.0), (0.4, 0.18), (0.3, 0.2), (0.22, 0.17)], YUNO_HAIR),
        ("poly", [(0.3, 0.08), (0.37, 0.1), (0.4, 0.2), (0.35, 0.26), (0.3, 0.22)], SKIN),
        ("poly", [(0.25, 0.2), (0.33, 0.2), (0.3, 0.33), (0.24, 0.28)], SKIN),
        ("poly", [(0.0, 0.58), (0.08, 0.58), (0.08, 0.76), (0.0, 0.76)], SKIN),
        ("poly", [(0.05, 0.55), (0.38, 0.55), (0.42, 1.0), (0.0, 1.0)], PANTS),
        ("ellipse", (0.48, 0.42, 0.09, 0.12), BOOK),
    ]),
    "yuno-smile": (None, [
        ("ellipse", (0.52, 0.75, 0.36, 0.8), SKIN),
        ("ellipse", (0.462, 0.34, 0.02, 0.08), YUNO_EYES),
        ("ellipse", (0.732, 0.34, 0.02, 0.08), YUNO_EYES),
    ]),
}


def region_mask(size, shape, geo):
    w, h = size
    m = Image.new("L", size, 0)
    d = ImageDraw.Draw(m)
    if shape == "poly":
        d.polygon([(x * w, y * h) for x, y in geo], fill=255)
    else:
        cx, cy, rx, ry = geo
        d.ellipse([(cx - rx) * w, (cy - ry) * h, (cx + rx) * w, (cy + ry) * h], fill=255)
    return np.asarray(m.filter(ImageFilter.GaussianBlur(max(w, h) / 500))).astype(np.float32) / 255


def colorize(name, matte_src, regions):
    src = Image.open(IMG / "panels" / f"{name}.png").convert("RGB")
    rgb = np.asarray(src).astype(np.float32)
    tint = np.ones_like(rgb) * 255  # white = no change under multiply
    for shape, geo, colour in regions:
        m = region_mask(src.size, shape, geo)[..., None]
        target = np.array(colour if colour else (255, 255, 255), np.float32)
        tint = tint * (1 - m) + target * m
    if matte_src:
        matte = np.asarray(Image.open(IMG / matte_src).convert("RGBA")).astype(np.float32)[..., 3:] / 255
        tint = 255 - (255 - tint) * matte
    out = (rgb * tint / 255).clip(0, 255).astype(np.uint8)
    Image.fromarray(out).save(OUT / f"{name}.png", optimize=True)
    return out


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    for name, (matte, regions) in REGIONS.items():
        out = colorize(name, matte, regions)
        print("coloured", name, out.shape[1], "x", out.shape[0])
    # coloured character layers: the coloured panel under the existing cut-out mattes
    for layer, panel in (("sword-fg-noblade", "sword"), ("tornado-fg", "tornado")):
        alpha = np.asarray(Image.open(IMG / "layers" / f"{layer}.png").convert("RGBA"))[..., 3:]
        rgb = np.asarray(Image.open(OUT / f"{panel}.png").convert("RGB"))
        Image.fromarray(np.concatenate([rgb, alpha], axis=2), "RGBA").save(IMG / "layers" / f"{layer}-color.png", optimize=True)
        print("layer", f"{layer}-color")


if __name__ == "__main__":
    main()
