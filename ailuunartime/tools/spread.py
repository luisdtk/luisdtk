"""The Asta vs Yuno spread for the post's feed.

Characters white with red ink (isnet-anime matte, run on each half), the sky and ground black
with dim red ink, Yuno's coat buttons green.
Writes public/images/redink/spread.png (2x), animated by tools/animate_pages.py.

    uv run --with onnxruntime --with numpy --with pillow --with opencv-python-headless \\
        python3 tools/spread.py <path to isnet-anime.onnx>
"""

import sys
from pathlib import Path

import cv2
import numpy as np
import onnxruntime as ort
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
RED = np.array([226, 38, 43], np.float32)
GREEN = np.array([52, 211, 110], np.float32)

rgb = np.asarray(Image.open(ROOT / "source" / "spread-asta-yuno.jpg").convert("RGB"))
rgb = cv2.resize(rgb, None, fx=2, fy=2, interpolation=cv2.INTER_LANCZOS4)
h, w = rgb.shape[:2]
session = ort.InferenceSession(sys.argv[1], providers=["CPUExecutionProvider"])


def run(img):
    x = cv2.resize(img, (1024, 1024), interpolation=cv2.INTER_AREA).astype(np.float32) / 255 - 0.5
    y = session.run(None, {session.get_inputs()[0].name: x.transpose(2, 0, 1)[None]})[0][0, 0]
    y = (y - y.min()) / (y.max() - y.min() + 1e-6)
    return cv2.resize(y, (img.shape[1], img.shape[0]))


matte = np.zeros((h, w), np.float32)
for x0, x1 in ((0, int(0.36 * w)), (int(0.64 * w), w)):  # Asta on the left, Yuno on the right
    matte[:, x0:x1] = np.maximum(matte[:, x0:x1], run(rgb[:, x0:x1]))
matte = np.clip((matte - 0.3) / 0.4, 0, 1)
# in the horizon band the model takes the ground for character: there, keep only the heads and shoulders
band = np.zeros((h, w), np.uint8)
band[int(0.0 * h):int(0.31 * h), :] = 1
heads = np.zeros((h, w), np.uint8)
cv2.ellipse(heads, (int(0.18 * w), int(0.17 * h)), (int(0.075 * w), int(0.11 * h)), -10, 0, 360, 1, -1)
cv2.fillPoly(heads, [np.array([[0.1, 0.24], [0.255, 0.24], [0.255, 0.31], [0.06, 0.31]]) * [w, h]].astype(np.int32) if False else [(np.array([[0.1, 0.24], [0.255, 0.24], [0.255, 0.31], [0.06, 0.31]]) * [w, h]).astype(np.int32)], 1)
cv2.ellipse(heads, (int(0.78 * w), int(0.1 * h)), (int(0.08 * w), int(0.11 * h)), 0, 0, 360, 1, -1)
cv2.fillPoly(heads, [(np.array([[0.715, 0.17], [0.93, 0.15], [0.95, 0.31], [0.7, 0.31]]) * [w, h]).astype(np.int32)], 1)
matte = np.where(band > 0, matte * heads, matte)
matte = cv2.GaussianBlur(matte, (0, 0), 2)[..., None]

lum = rgb.astype(np.float32).mean(axis=2, keepdims=True) / 255
ink = np.clip((1 - lum - 0.04) / 0.92, 0, 1) ** 0.9
# large solid blacks stay black; only lines, hatching and details go red
solid = cv2.GaussianBlur(ink[..., 0], (0, 0), 6)[..., None]
lines = ink * np.clip((0.82 - solid) / 0.3, 0, 1)
BLACK = np.array([10, 8, 8], np.float32)
# characters: white with red ink; sky and ground: black with dim red ink
WHITE = np.array([244, 242, 238], np.float32)
character = WHITE * (1 - ink) + BLACK * (ink - lines) + RED * lines
ground = WHITE * (1 - ink) + BLACK * ink  # sky and ground: the manga as drawn, on white paper
out = character * matte + ground * (1 - matte)

# Asta's headband: its dark band turns red
hb = np.zeros((h, w), np.float32)
cv2.ellipse(hb, (int(0.185 * w), int(0.165 * h)), (int(0.062 * w), int(0.03 * h)), -14, 0, 360, 1, -1)
hb = cv2.GaussianBlur(hb, (0, 0), 3)[..., None] * ink
out = out * (1 - hb) + RED * 1.0 * hb  # already red ink; kept so the band reads solid

# Yuno's buttons, located on a zoomed grid of his coat (normalised x, y)
BUTTONS = [(0.7905, 0.259), (0.7923, 0.301), (0.7885, 0.359), (0.791, 0.408), (0.7944, 0.529),
           (0.738, 0.254), (0.7345, 0.331), (0.7345, 0.38), (0.7386, 0.434), (0.7412, 0.512), (0.7448, 0.564)]
btn = np.zeros((h, w), np.float32)
for bx, by in BUTTONS:
    cv2.circle(btn, (int(bx * w), int(by * h)), int(0.0052 * w), 1, -1)
n = len(BUTTONS)
btn = cv2.GaussianBlur(btn, (0, 0), 1.5)[..., None]
out = out * (1 - btn) + (GREEN * (1 - ink * 0.6)) * btn

Image.fromarray(out.clip(0, 255).astype(np.uint8)).save(ROOT / "public" / "images" / "redink" / "spread.png", optimize=True)
print("spread", w, h, "buttons", n)
