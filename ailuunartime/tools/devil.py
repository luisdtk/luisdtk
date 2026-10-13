"""The devil (supplied art) for the opening carousel: black ground, the figure white with red ink.

    uv run --with onnxruntime --with numpy --with pillow --with opencv-python-headless \\
        python3 tools/devil.py <path to isnet-anime.onnx>
"""

import sys
from pathlib import Path

import cv2
import numpy as np
import onnxruntime as ort
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
RED = np.array([226, 38, 43], np.float32)
WHITE = np.array([244, 242, 238], np.float32)

rgb = np.asarray(Image.open(ROOT / "source" / "devil.webp").convert("RGB"))
rgb = cv2.resize(rgb, None, fx=2, fy=2, interpolation=cv2.INTER_LANCZOS4)
h, w = rgb.shape[:2]
session = ort.InferenceSession(sys.argv[1], providers=["CPUExecutionProvider"])
x = cv2.resize(rgb, (1024, 1024), interpolation=cv2.INTER_AREA).astype(np.float32) / 255 - 0.5
y = session.run(None, {session.get_inputs()[0].name: x.transpose(2, 0, 1)[None]})[0][0, 0]
y = (y - y.min()) / (y.max() - y.min() + 1e-6)
matte = np.clip((cv2.resize(y, (w, h)) - 0.3) / 0.4, 0, 1)
matte = cv2.GaussianBlur(matte, (0, 0), 2)[..., None]

lum = rgb.astype(np.float32).mean(axis=2, keepdims=True) / 255
ink = np.clip((1 - lum - 0.04) / 0.92, 0, 1) ** 0.9
# large solid blacks stay black; only lines, hatching and details go red
solid = cv2.GaussianBlur(ink[..., 0], (0, 0), 6)[..., None]
lines = ink * np.clip((0.82 - solid) / 0.3, 0, 1)
BLACK = np.array([10, 8, 8], np.float32)
figure = WHITE * (1 - ink) + BLACK * (ink - lines) + RED * lines  # white, solid blacks kept, lines red
ground = WHITE * 0.12 * (1 - ink)  # the ground stays black (the white floor dims to a faint grey)
out = figure * matte + ground * (1 - matte)
Image.fromarray(out.clip(0, 255).astype(np.uint8)).save(ROOT / "public" / "images" / "redink" / "devil.png", optimize=True)
print("devil", w, h)
