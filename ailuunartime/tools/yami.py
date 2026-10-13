"""Cut Yami (supplied art) out of its white background with isnet-anime.

The painted smoke is left out: the reel draws its own smoke, rising and curling from the
cigarette (src/reel/Smoke.tsx), so it can move.

    uv run --with onnxruntime --with numpy --with pillow --with opencv-python-headless \\
        python3 tools/yami.py <path to isnet-anime.onnx>
"""

import sys
from pathlib import Path

import cv2
import numpy as np
import onnxruntime as ort
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent

# source/yami-x2.png: the supplied art denoised (fastNlMeans) and upscaled 2x with EDSR
# (OpenCV dnn_superres, model from github.com/Saafke/EDSR_Tensorflow)
rgb = np.asarray(Image.open(ROOT / "source" / "yami-x2.png").convert("RGB"))
h, w = rgb.shape[:2]
session = ort.InferenceSession(sys.argv[1], providers=["CPUExecutionProvider"])
x = cv2.resize(rgb, (1024, 1024), interpolation=cv2.INTER_AREA).astype(np.float32) / 255 - 0.5
y = session.run(None, {session.get_inputs()[0].name: x.transpose(2, 0, 1)[None]})[0][0, 0]
y = (y - y.min()) / (y.max() - y.min())
alpha = np.clip((cv2.resize(y, (w, h)) - 0.4) / 0.4, 0, 1)
# choke the edge by a pixel and pull leftover paper-white out of it, so no white halo rims him
alpha = cv2.erode(alpha, np.ones((3, 3), np.uint8))
gray = rgb.mean(axis=2)
whiteish = np.clip((gray - 200) / 55, 0, 1)
alpha = alpha * (1 - whiteish * (alpha < 0.98))
# around his dark hair the source has light, grey compression blocks. Drop the light, colourless
# pixels that connect to the outside: the face and hands are closed by ink lines, so they stay.
hsv = cv2.cvtColor(rgb, cv2.COLOR_RGB2HSV)
grey_light = (gray > 120) & (gray < 236) & (hsv[..., 1] < 60)
candidate = (grey_light | (alpha < 0.5)).astype(np.uint8)
candidate[int(0.3 * h):, :] = 0  # the white tank top starts below
n, labels = cv2.connectedComponents(candidate, connectivity=4)
outside = set(np.unique(labels[alpha < 0.05])) - {0}
alpha[np.isin(labels, list(outside)) & grey_light] = 0
alpha = cv2.GaussianBlur(alpha.astype(np.float32), (0, 0), 0.8)
# the painted smoke trail, left of the hand, goes
alpha[: int(0.24 * h), : int(0.6 * w)] = 0
big = Image.fromarray(np.dstack([rgb, (alpha * 255).astype(np.uint8)]), "RGBA")
big.save(ROOT / "public" / "images" / "yami.png", optimize=True)
print("yami", big.size)
