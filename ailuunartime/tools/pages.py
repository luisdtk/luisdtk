"""Clean the three reader pages (screenshots of a manga reader) for the phone scene.

1. Crop the page out of the reader's interface (the page sits between two black bars).
2. Find speech balloons automatically: convex white areas closed by ink that hold rows of
   same-height letters. Paint their inside white, so the letters go and empty balloons stay.
   Captions without a balloon are listed by hand in EXTRA.
3. Upscale 2x and clean the line art like the other panels (tools/prepare.py).

    uv run --with numpy --with pillow --with opencv-python-headless python3 tools/pages.py
"""

from pathlib import Path

import cv2
import numpy as np
from PIL import Image, ImageFilter

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "source"
OUT = ROOT / "public" / "images" / "pages"
PAGES = ["page-4-birds-yuno", "page-5-flock", "page-6-dash"]
TOP, BOTTOM = 328, 2137  # the page between the reader's black bars
# text the detector misses (no balloon, or a balloon too small), as normalised (x0, y0, x1, y1);
# only the ink inside each box is inpainted, so the art around the letters survives
EXTRA = {
    "page-4-birds-yuno": [(0.185, 0.795, 0.235, 0.835)],
    "page-5-flock": [(0.435, 0.515, 0.52, 0.58), (0.775, 0.685, 0.945, 0.765)],
    "page-6-dash": [
        (0.025, 0.3, 0.09, 0.36), (0.175, 0.075, 0.24, 0.135), (0.5, 0.03, 0.575, 0.12),
        (0.775, 0.265, 0.93, 0.33), (0.43, 0.46, 0.525, 0.51), (0.8, 0.54, 0.91, 0.64),
        (0.425, 0.89, 0.485, 0.92), (0.15, 0.165, 0.205, 0.195), (0.29, 0.475, 0.335, 0.5),
    ],
}


def balloons(gray):
    """A balloon: a convex white area closed by ink, holding rows of same-height letters."""
    paper = (gray > 200).astype(np.uint8)
    n, labels, stats, _ = cv2.connectedComponentsWithStats(paper, connectivity=4)
    mask = np.zeros_like(paper)
    for i in range(1, n):
        x, y, w, h, area = stats[i]
        if area < 1200 or area > 70000 or w > 420 or h > 520:
            continue
        region = (labels[y:y + h, x:x + w] == i).astype(np.uint8)
        flood = np.pad(region, 1)
        cv2.floodFill(flood, None, (0, 0), 2)
        holes = (flood[1:-1, 1:-1] == 0).astype(np.uint8)
        filled = ((region + holes) > 0).astype(np.uint8)
        contours, _ = cv2.findContours(filled, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        hull = cv2.convexHull(max(contours, key=cv2.contourArea))
        convexity = filled.sum() / max(1.0, cv2.contourArea(hull))
        k, _, hs, _ = cv2.connectedComponentsWithStats(holes)
        heights = [hs[j, 3] for j in range(1, k) if 15 <= hs[j, 4] <= 900 and hs[j, 3] <= 40]
        if len(heights) < 3 or convexity < 0.8:
            continue
        med = float(np.median(heights))
        same = np.mean([0.55 * med <= hh <= 1.7 * med for hh in heights])
        hole_share = holes.sum() / max(1, filled.sum())
        if 7 <= med <= 30 and same > 0.6 and 0.02 < hole_share < 0.4:
            # the inside of the balloon (letters and paper), not its outline: it stays as an empty balloon
            inside = cv2.erode(filled, np.ones((7, 7), np.uint8))
            mask[y:y + h, x:x + w] |= inside
    return mask


def fill(gray, mask):
    """Paint the inside of each balloon paper-white: the letters go, the balloon's outline stays."""
    out = gray.copy()
    out[mask > 0] = 255
    return out


def clean(gray: Image.Image, scale=2) -> Image.Image:
    big = gray.resize((gray.width * scale, gray.height * scale), Image.LANCZOS).filter(ImageFilter.GaussianBlur(0.8))
    a = np.asarray(big).astype(float)
    a = np.clip((a - 38) / (222 - 38), 0, 1) ** 1.08
    return Image.fromarray((a * 255).astype(np.uint8)).filter(ImageFilter.UnsharpMask(radius=2, percent=110, threshold=2))


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    for name in PAGES:
        rgb = np.asarray(Image.open(SRC / f"{name}.png").convert("RGB"))[TOP:BOTTOM]
        gray = cv2.cvtColor(rgb, cv2.COLOR_RGB2GRAY)
        mask = balloons(gray)
        filled = fill(gray, mask)
        h, w = gray.shape
        loose = np.zeros_like(mask)
        for x0, y0, x1, y1 in EXTRA.get(name, []):
            box = (slice(int(y0 * h), int(y1 * h)), slice(int(x0 * w), int(x1 * w)))
            loose[box] = (filled[box] < 160).astype(np.uint8)
        if loose.any():
            loose = cv2.dilate(loose, np.ones((5, 5), np.uint8))
            filled = cv2.inpaint(filled, loose * 255, 5, cv2.INPAINT_TELEA)
            mask |= loose
        clean(Image.fromarray(filled)).save(OUT / f"{name}.png", optimize=True)
        Image.fromarray(mask * 255).save(OUT / f"{name}-balloons.png")
        print(name, filled.shape[1], "x", filled.shape[0], "balloon pixels", int(mask.sum()))


if __name__ == "__main__":
    main()
