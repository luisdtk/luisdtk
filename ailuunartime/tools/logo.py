"""Cut the Ailuunartime logo out of its white background.

The mark becomes a transparent PNG in white (for the black video) and in red,
anti-aliased from the original's grey edge pixels, cropped to the mark.

    uv run --with numpy --with pillow python3 tools/logo.py
"""

from pathlib import Path

import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
src = Image.open(ROOT / "source" / "logo-original.jpg").convert("L")
big = src.resize((src.width * 4, src.height * 4), Image.LANCZOS)
lum = np.asarray(big).astype(float)
# ink = 1 where the mark is black, 0 on the white paper, with a soft edge and the JPEG noise cut off
ink = np.clip((235 - lum) / (235 - 25), 0, 1)
# ignore the thin grey frame line at the image border
ink[:16, :] = ink[-16:, :] = 0
ink[:, :16] = ink[:, -16:] = 0
ys, xs = np.where(ink > 0.02)
pad = 24
box = (max(0, xs.min() - pad), max(0, ys.min() - pad), min(big.width, xs.max() + pad), min(big.height, ys.max() + pad))
alpha = (ink * 255).astype(np.uint8)[box[1]:box[3], box[0]:box[2]]
for name, rgb in {"logo-white": (255, 255, 255), "logo-red": (226, 38, 43)}.items():
    out = np.zeros(alpha.shape + (4,), np.uint8)
    out[..., :3] = rgb
    out[..., 3] = alpha
    Image.fromarray(out, "RGBA").save(ROOT / "public" / "images" / f"{name}.png", optimize=True)
print("logo", alpha.shape[1], "x", alpha.shape[0])
