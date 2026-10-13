"""The devil (supplied art) for the opening carousel, on white paper in red ink.

The art is white figure on black night, so it is inverted: the night becomes paper and the
figure's white becomes red line work and red fills, like the cover (tools/cover.py).

    uv run --with numpy --with pillow python3 tools/devil.py
"""

from pathlib import Path

import cv2
import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
PAPER = np.array([244, 242, 238], np.float32)
RED = np.array([226, 38, 43], np.float32)

rgb = np.asarray(Image.open(ROOT / "source" / "devil.webp").convert("RGB"))
rgb = cv2.resize(rgb, None, fx=2, fy=2, interpolation=cv2.INTER_LANCZOS4)
v = rgb.astype(np.float32).mean(axis=2) / 255
edges = np.clip(np.abs(np.gradient(v, axis=0)) + np.abs(np.gradient(v, axis=1)), 0, 1) * 5
k = np.clip(v * 0.55 + edges, 0, 1)[..., None]
out = PAPER * (1 - k) + RED * k
Image.fromarray(out.clip(0, 255).astype(np.uint8)).save(ROOT / "public" / "images" / "redink" / "devil.png", optimize=True)
print("devil", rgb.shape[1], rgb.shape[0])
