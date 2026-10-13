"""Character mattes for every manga image, so characters can be drawn white over a black page.

isnet-anime (rembg's anime model, MIT) on the whole image, and panel by panel for the pages
(panels are found by their white gutters; the model sees each panel large enough).
Writes public/images/mattes/<name>.png (white = character).

    uv run --with onnxruntime --with numpy --with pillow --with opencv-python-headless \\
        python3 tools/mattes.py <path to isnet-anime.onnx>
"""

import sys
from pathlib import Path

import cv2
import numpy as np
import onnxruntime as ort
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
IMG = ROOT / "public" / "images"
OUT = IMG / "mattes"
WHOLE = {"asta-scream": "panels/asta-scream.png", "shock": "panels/shock.png", "yuno-smile": "panels/yuno-smile.png"}
PAGES = {n: f"pages/{n}.png" for n in ["page-4-birds-yuno", "page-5-flock", "page-6-dash"]}


def run(session, rgb):
    h, w = rgb.shape[:2]
    x = cv2.resize(rgb, (1024, 1024), interpolation=cv2.INTER_AREA).astype(np.float32) / 255 - 0.5
    y = session.run(None, {session.get_inputs()[0].name: x.transpose(2, 0, 1)[None]})[0][0, 0]
    y = (y - y.min()) / (y.max() - y.min() + 1e-6)
    return cv2.resize(y, (w, h))


def panels(gray):
    """Panel boxes on a page: ink closed over small gaps, so white gutters split the panels."""
    h, w = gray.shape
    ink = cv2.morphologyEx((gray < 200).astype(np.uint8), cv2.MORPH_CLOSE, np.ones((9, 9), np.uint8))
    n, _, st, _ = cv2.connectedComponentsWithStats(ink)
    return [tuple(int(v) for v in st[i][:4]) for i in range(1, n) if st[i][2] * st[i][3] > 0.02 * w * h]


def per_panel(session, rgb, boxes):
    """The model sees one panel at a time, large enough to find its characters."""
    out = np.zeros(rgb.shape[:2], np.float32)
    for x, y, w, h in boxes:
        out[y:y + h, x:x + w] = np.maximum(out[y:y + h, x:x + w], run(session, rgb[y:y + h, x:x + w]))
    return out


def main(model):
    OUT.mkdir(parents=True, exist_ok=True)
    session = ort.InferenceSession(model, providers=["CPUExecutionProvider"])
    layout = {}
    for name, src in {**WHOLE, **PAGES}.items():
        rgb = np.asarray(Image.open(IMG / src).convert("RGB"))
        if name in PAGES:
            boxes = panels(cv2.cvtColor(rgb, cv2.COLOR_RGB2GRAY))
            h, w = rgb.shape[:2]
            layout[name] = [[x / w, y / h, bw / w, bh / h] for x, y, bw, bh in boxes]
            m = per_panel(session, rgb, boxes)
        elif name == "yuno-smile":
            m = np.ones(rgb.shape[:2], np.float32)  # Yuno's face fills the strip
        else:
            m = run(session, rgb)
        alpha = np.clip((m - 0.3) / 0.4, 0, 1)
        Image.fromarray((alpha * 255).astype(np.uint8)).save(OUT / f"{name}.png", optimize=True)
        print(name, round(float(alpha.mean()), 3))
    for name in ["sword-fg-noblade", "tornado-fg"]:
        a = np.asarray(Image.open(IMG / "layers" / f"{name}.png").convert("RGBA"))[..., 3]
        Image.fromarray(a).save(OUT / f"{name}.png", optimize=True)
    # the panel boxes of each page (0..1), for tools/animate_pages.py: every panel breathes on its own
    import json

    (OUT / "panels.json").write_text(json.dumps(layout, indent=1) + "\n")


if __name__ == "__main__":
    main(sys.argv[1])
