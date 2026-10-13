"""The devil (supplied art) for the opening carousel, in the reel's red duotone.

    uv run --with numpy --with pillow --with opencv-python-headless python3 tools/devil.py
"""

from pathlib import Path

import cv2
import numpy as np
from PIL import Image

from duotone import duotone

ROOT = Path(__file__).resolve().parent.parent
rgb = np.asarray(Image.open(ROOT / "source" / "devil.webp").convert("RGB"))
rgb = cv2.resize(rgb, None, fx=2, fy=2, interpolation=cv2.INTER_LANCZOS4)
Image.fromarray(duotone(rgb)).save(ROOT / "public" / "images" / "redink" / "devil.png", optimize=True)
print("devil", rgb.shape[1], rgb.shape[0])
