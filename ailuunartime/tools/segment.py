"""Split each manga panel into a character layer and a background layer for 2.5D parallax.

1. isnet-anime (rembg's anime model, MIT) predicts a character matte for each panel.
2. The character layer is the panel with that matte as alpha (soft edge).
3. The background layer is the panel with the character painted out (OpenCV inpaint on a
   dilated matte), so the camera can slide the character over it without revealing a hole.

    # model: github.com/danielgatis/rembg/releases/download/v0.0.0/isnet-anime.onnx
    uv run --with onnxruntime --with numpy --with pillow --with opencv-python-headless \
        python3 tools/segment.py <path to isnet-anime.onnx>
"""

import sys
from pathlib import Path

import cv2
import numpy as np
import onnxruntime as ort
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
PANELS = ROOT / "public" / "images" / "panels"
OUT = ROOT / "public" / "images" / "layers"
# only the wide shots: in the close-ups the character fills the panel, so there is no background to split off
NAMES = ["sword", "tornado"]


def matte(session, rgb: np.ndarray) -> np.ndarray:
    h, w = rgb.shape[:2]
    x = cv2.resize(rgb, (1024, 1024), interpolation=cv2.INTER_AREA).astype(np.float32) / 255.0
    x = (x - 0.5) / 1.0
    x = x.transpose(2, 0, 1)[None]
    y = session.run(None, {session.get_inputs()[0].name: x})[0][0, 0]
    y = (y - y.min()) / (y.max() - y.min() + 1e-8)
    return cv2.resize(y, (w, h), interpolation=cv2.INTER_LINEAR)


def main(model: str):
    OUT.mkdir(parents=True, exist_ok=True)
    session = ort.InferenceSession(model, providers=["CPUExecutionProvider"])
    for name in NAMES:
        src = Image.open(PANELS / f"{name}.png").convert("RGB")
        rgb = np.asarray(src)
        m = matte(session, rgb)
        alpha = np.clip((m - 0.25) / 0.5, 0, 1)
        # foreground: the panel with the matte as alpha
        fg = np.dstack([rgb, (alpha * 255).astype(np.uint8)])
        Image.fromarray(fg, "RGBA").save(OUT / f"{name}-fg.png", optimize=True)
        # background: paint the character out, on a smaller copy for speed, then scale back up
        scale = 0.35
        small = cv2.resize(rgb, None, fx=scale, fy=scale, interpolation=cv2.INTER_AREA)
        hole = (cv2.resize(alpha, (small.shape[1], small.shape[0])) > 0.15).astype(np.uint8) * 255
        hole = cv2.dilate(hole, np.ones((15, 15), np.uint8))
        filled = cv2.inpaint(small, hole, 9, cv2.INPAINT_TELEA)
        filled = cv2.resize(filled, (rgb.shape[1], rgb.shape[0]), interpolation=cv2.INTER_CUBIC)
        big_hole = cv2.resize(hole, (rgb.shape[1], rgb.shape[0])).astype(np.float32)[..., None] / 255
        big_hole = cv2.GaussianBlur(big_hole, (0, 0), 6)[..., None] if big_hole.ndim == 2 else cv2.GaussianBlur(big_hole, (0, 0), 6)[..., None]
        bg = (rgb * (1 - big_hole) + filled * big_hole).astype(np.uint8)
        Image.fromarray(bg, "RGB").save(OUT / f"{name}-bg.png", optimize=True)
        print(name, rgb.shape[1], "x", rgb.shape[0], "matte coverage", round(float(alpha.mean()), 3))


if __name__ == "__main__":
    main(sys.argv[1])
