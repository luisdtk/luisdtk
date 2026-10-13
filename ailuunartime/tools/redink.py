"""Red ink on black: the manga's paper goes black and its ink goes Asta red.

Each pixel's darkness (1 - luminance) becomes the strength of red, so solid blacks turn full red,
screentones turn deep red and paper turns black. Transparency is kept for cut-out layers.
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


def redink(rgba: np.ndarray) -> np.ndarray:
    rgb = rgba[..., :3].astype(np.float32) / 255
    lum = rgb @ np.array([0.299, 0.587, 0.114], np.float32)
    ink = np.clip((1 - lum - 0.04) / 0.92, 0, 1) ** 0.9
    out = rgba.copy()
    out[..., :3] = (ink[..., None] * RED).astype(np.uint8)
    return out


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    for name, src in SOURCES.items():
        im = Image.open(IMG / src)
        mode = "RGBA" if im.mode in ("RGBA", "LA") else "RGB"
        a = np.asarray(im.convert("RGBA"))
        out = Image.fromarray(redink(a), "RGBA")
        (out if mode == "RGBA" else out.convert("RGB")).save(OUT / f"{name}.png", optimize=True)
        print(name)


if __name__ == "__main__":
    main()
