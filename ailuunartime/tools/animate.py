"""Animate inside the art, offline: hair and cloth flow, eyes blink, loops drawn "on twos".

For each rigged image this writes a 24-frame loop at 12 fps (2 s, the cadence of TV anime):
- flow: each pixel is displaced by smooth travelling waves, scaled by the image's weight map
  (tools/rig.py: white = hair, cape, pages, tornado; black = faces, which hold still);
- blink: eyelids drawn over the eyes for three frames of the loop.
Frames go to public/anim/<name>/<i>.webp (alpha kept for cut-out layers). The reel picks the
frame for each instant (src/reel/anim.ts), so rendering stays deterministic.

    uv run --with numpy --with pillow --with opencv-python-headless python3 tools/animate.py
"""

import json
from pathlib import Path

import cv2
import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
IMG = ROOT / "public" / "images"
OUT = ROOT / "public" / "anim"
FRAMES = 48
FPS = 24  # every frame drawn: smooth, not on twos

# name: source, weight map, max width, displacement (px at that width), eyes, eyelid colour, quality
ASSETS = {
    "asta": dict(src="asta.png", map="asta", width=1200, amp=16, eyes=[(0.385, 0.437, 0.048, 0.036), (0.53, 0.398, 0.052, 0.04)], skin=(250, 186, 150), blink=10),
    "asta-red": dict(src="asta-redblack.png", map="asta", width=1200, amp=16, eyes=[(0.385, 0.437, 0.048, 0.036), (0.53, 0.398, 0.052, 0.04)], skin=(240, 86, 80), blink=10),
    "yami": dict(src="yami.png", map="yami", width=1152, amp=14, eyes=[], skin=None, blink=None),
    "sword-fg": dict(src="redink/sword-fg-noblade.png", map="sword-fg", width=1725, amp=8, eyes=[(0.436, 0.284, 0.016, 0.011), (0.522, 0.286, 0.016, 0.011)], skin=(240, 238, 234), blink=15),
    "tornado-fg": dict(src="redink/tornado-fg.png", map="tornado-fg", width=3312, amp=18, eyes=[], skin=None, blink=None),
    "tornado-bg": dict(src="redink/tornado-bg.png", map="tornado-bg", width=1656, amp=16, eyes=[], skin=None, blink=None),
    "scream": dict(src="redink/asta-scream.png", map="scream", width=1500, amp=11, eyes=[], skin=None, blink=None, mouth=(0.52, 0.66, 0.13, 0.1, 0.55)),
    "shock": dict(src="redink/shock.png", map="shock", width=930, amp=8, eyes=[], skin=None, blink=None),
}


def smooth_field(h, w, cells, seed):
    rng = np.random.default_rng(seed)
    grid = rng.random((cells, cells)).astype(np.float32)
    return cv2.resize(grid, (w, h), interpolation=cv2.INTER_CUBIC)


def draw_lids(rgba, eyes, skin, shut):
    h, w = rgba.shape[:2]
    out = rgba.copy()
    for cx, cy, rx, ry in eyes:
        X, Y, RX, RY = cx * w, cy * h, rx * w, ry * h
        lid = Y - RY + 2 * RY * shut
        mask = np.zeros((h, w), np.uint8)
        cv2.ellipse(mask, (int(X), int(Y)), (int(RX * 1.12), int(RY * 1.25)), 0, 0, 360, 255, -1, cv2.LINE_AA)
        mask[int(lid):, :] = 0
        m = mask.astype(np.float32)[..., None] / 255
        out[..., :3] = (out[..., :3] * (1 - m) + np.array(skin, np.float32) * m).astype(np.uint8)
        out[..., 3:] = np.maximum(out[..., 3:], (m * 255).astype(np.uint8))
        pts = np.array([[X - RX * 1.1 + i * RX * 2.2 / 20, lid - RY * 0.15 + RY * 0.5 * np.sin(np.pi * i / 20)] for i in range(21)], np.int32)
        cv2.polylines(out, [pts], False, (20, 8, 8, 255), max(2, int(RY * 0.35)), cv2.LINE_AA)
    return out


def main(only=None):
    manifest = json.loads((OUT / "manifest.json").read_text()) if (OUT / "manifest.json").exists() else {}
    for name, a in ASSETS.items():
        if only and name not in only:
            continue
        src = Image.open(IMG / a["src"]).convert("RGBA")
        if src.width > a["width"]:
            src = src.resize((a["width"], round(src.height * a["width"] / src.width)), Image.LANCZOS)
        rgba = np.asarray(src).copy()
        h, w = rgba.shape[:2]
        weight = cv2.resize(np.asarray(Image.open(IMG / "rig" / f"{a['map']}.png").convert("L")).astype(np.float32) / 255, (w, h), interpolation=cv2.INTER_CUBIC)
        # travelling waves: spatially varying phase, so the motion ripples across hair and cloth
        phx = smooth_field(h, w, 5, 1) * 2 * np.pi * 1.5 + np.linspace(0, 3 * np.pi, w)[None, :]
        phy = smooth_field(h, w, 5, 2) * 2 * np.pi * 1.5 + np.linspace(0, 2 * np.pi, h)[:, None]
        ys, xs = np.mgrid[0:h, 0:w].astype(np.float32)
        amp = a["amp"] * weight
        has_alpha = name in ("asta", "asta-red", "yami", "sword-fg", "tornado-fg")
        folder = OUT / name
        folder.mkdir(parents=True, exist_ok=True)
        for f in range(FRAMES):
            p = 2 * np.pi * f / FRAMES
            dx = amp * (np.sin(p + phx) + 0.35 * np.sin(2 * p + 1.7 * phy))
            dy = amp * 0.6 * np.cos(p + phy)
            if a.get("mouth"):
                # a shouting mouth: the jaw stretches open and snaps shut, three times a loop
                mx, my, mrx, mry, mamp = a["mouth"]
                g = np.exp(-(((xs / w - mx) / mrx) ** 2 + ((ys / h - my) / mry) ** 2) * 2.2)
                k = 0.5 + 0.5 * np.sin(3 * p)
                dy = dy - (ys - my * h) * mamp * k * g
            frame = cv2.remap(rgba, xs + dx.astype(np.float32), ys + dy.astype(np.float32), cv2.INTER_CUBIC, borderMode=cv2.BORDER_REFLECT)
            if a["blink"] is not None and a["eyes"]:
                b = a["blink"] * 2
                shut = {b: 0.4, b + 1: 0.85, b + 2: 1.0, b + 3: 0.85, b + 4: 0.4}.get(f, 0)
                if shut:
                    frame = draw_lids(frame, a["eyes"], a["skin"], shut)
            im = Image.fromarray(frame, "RGBA")
            if not has_alpha:
                im = im.convert("RGB")
            im.save(folder / f"{f}.webp", "WEBP", quality=82, method=4)
        size = sum(p.stat().st_size for p in folder.glob("*.webp"))
        manifest[name] = {"frames": FRAMES, "fps": FPS, "width": w, "height": h}
        print(f"{name}: {w}x{h}, {FRAMES} frames, {size / 1e6:.1f} MB")
    (OUT / "manifest.json").write_text(json.dumps(manifest, indent=2) + "\n")


if __name__ == "__main__":
    import sys

    main(sys.argv[1:] or None)  # optionally: names of the loops to regenerate
