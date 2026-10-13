"""White paper, characters drawn in red: scenery keeps its black ink, characters' lines turn red.

Each pixel's darkness (1 - luminance) becomes the strength of red ink. Inside a character's matte
(tools/mattes.py) the paper stays white, so characters stand out white; outside it the paper goes
black. Transparency is kept for cut-out layers.
Writes public/images/redink/<name>.png; tools/animate.py and tools/animate_pages.py animate these.

    uv run --with numpy --with pillow python3 tools/redink.py
"""

from pathlib import Path

import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
IMG = ROOT / "public" / "images"
OUT = IMG / "redink"
RED = np.array([226, 38, 43], np.float32)

SOURCES = {
    "asta-scream": "panels/asta-scream.png",
    "shock": "panels/shock.png",
    "sword": "panels/sword.png",
    "tornado": "panels/tornado.png",
    "yuno-smile": "panels/yuno-smile.png",
    "sword-bg": "layers/sword-bg.png",
    "sword-fg-noblade": "layers/sword-fg-noblade.png",
    "tornado-bg": "layers/tornado-bg.png",
    "tornado-fg": "layers/tornado-fg.png",
    "page-4-birds-yuno": "pages/page-4-birds-yuno.png",
    "page-5-flock": "pages/page-5-flock.png",
    "page-6-dash": "pages/page-6-dash.png",
}


WHITE = np.array([244, 242, 238], np.float32)
# which matte (public/images/mattes) marks the characters in each image; none = background only
MATTE = {
    "asta-scream": "asta-scream", "shock": "shock", "yuno-smile": "yuno-smile",
    "sword": "sword-fg-noblade", "tornado": "tornado-fg",
    "sword-fg-noblade": "sword-fg-noblade", "tornado-fg": "tornado-fg",
    "page-4-birds-yuno": "page-4-birds-yuno", "page-5-flock": "page-5-flock", "page-6-dash": "page-6-dash",
}


def redink(rgba: np.ndarray, matte: np.ndarray) -> np.ndarray:
    """White paper everywhere; scenery keeps its black ink; characters' lines turn red."""
    import cv2

    rgb = rgba[..., :3].astype(np.float32) / 255
    lum = rgb @ np.array([0.299, 0.587, 0.114], np.float32)
    ink = (np.clip((1 - lum - 0.04) / 0.92, 0, 1) ** 0.9)[..., None]
    # large solid blacks (hair, clothes) stay black; lines, hatching and details go red
    solid = cv2.GaussianBlur(ink[..., 0], (0, 0), 6)[..., None]
    lines = ink * np.clip((0.82 - solid) / 0.3, 0, 1)
    BLACK = np.array([12, 10, 10], np.float32)
    m = matte[..., None]
    character = WHITE * (1 - ink) + BLACK * (ink - lines) + RED * lines
    page = WHITE * (1 - ink) + BLACK * ink
    out = rgba.copy()
    out[..., :3] = (character * m + page * (1 - m)).clip(0, 255).astype(np.uint8)
    return out


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    for name, src in SOURCES.items():
        im = Image.open(IMG / src)
        mode = "RGBA" if im.mode in ("RGBA", "LA") else "RGB"
        a = np.asarray(im.convert("RGBA"))
        if name in MATTE:
            mi = Image.open(IMG / "mattes" / f"{MATTE[name]}.png").convert("L").resize(im.size, Image.BILINEAR)
            matte = np.asarray(mi).astype(np.float32) / 255
        else:
            matte = np.zeros(a.shape[:2], np.float32)
        res = redink(a, matte)
        if name in ("sword",):
            # Asta's blade keeps its black and red (painted by tools/prepare.py)
            blade = np.asarray(Image.open(IMG / "panels" / "sword-blade.png").convert("RGBA")).astype(np.float32)
            k = blade[..., 3:] / 255
            res[..., :3] = (res[..., :3] * (1 - k) + blade[..., :3] * k).astype(np.uint8)
        out = Image.fromarray(res, "RGBA")
        (out if mode == "RGBA" else out.convert("RGB")).save(OUT / f"{name}.png", optimize=True)
        print(name)


if __name__ == "__main__":
    main()
