"""Animate the three reader pages inside the art, by what each character is doing.

Every frame is the cleaned page (tools/pages.py) pulled through one smooth displacement field,
the sum of local moves, so nothing tears and the line art stays the artist's:
- wave: hair, wings and feathers ripple (a travelling wave inside a soft region);
- peck: a bird's head jabs toward its target and back, three times a loop;
- bounce / shake: a running or panicking character hops or trembles;
- mouth: a shouting mouth stretches open and shut;
- blink: eyelids drawn over open eyes.
24 frames at 12 fps (2 s), on twos like TV anime. Coordinates are 0..1 of the page
(see out/review/grids/<page>.png).

    uv run --with numpy --with pillow --with opencv-python-headless python3 tools/animate_pages.py
"""

import json
from pathlib import Path

import cv2
import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "public" / "images" / "redink"  # red ink on black (tools/redink.py)
OUT = ROOT / "public" / "anim"
FRAMES = 24
FPS = 12
WIDTH = 1600

# op, centre (x, y), radius (x, y), params
PAGES = {
    "page-4-birds-yuno": [
        # the big bird: wings beat, beak snaps
        ("flap", (0.16, 0.1), (0.07, 0.06), {"amp": 0.012, "speed": 3}),
        ("flap", (0.33, 0.085), (0.07, 0.06), {"amp": 0.012, "speed": 3, "phase": 0.5}),
        ("mouth", (0.257, 0.148), (0.03, 0.02), {"amp": 0.35, "speed": 3}),
        ("wave", (0.25, 0.1), (0.13, 0.09), {"amp": 0.004}),
        # the small birds pestering the boy
        ("bounce", (0.57, 0.12), (0.035, 0.03), {"amp": 0.008, "speed": 4}),
        ("bounce", (0.73, 0.125), (0.035, 0.03), {"amp": 0.008, "speed": 4, "phase": 0.3}),
        ("bounce", (0.78, 0.21), (0.03, 0.025), {"amp": 0.006, "speed": 4, "phase": 0.6}),
        ("bounce", (0.66, 0.285), (0.04, 0.03), {"amp": 0.008, "speed": 4, "phase": 0.15}),
        # Yuno: hair in the wind, a slow blink
        ("wave", (0.33, 0.42), (0.17, 0.08), {"amp": 0.006}),
        ("blink", (0.27, 0.467), (0.022, 0.011), {"at": 14, "skin": 0}),
        ("blink", (0.364, 0.464), (0.022, 0.011), {"at": 14, "skin": 0}),
        ("wave", (0.75, 0.45), (0.05, 0.04), {"amp": 0.004}),
    ],
    "page-5-flock": [
        # Asta shouting while the flock pecks his head
        ("mouth", (0.53, 0.281), (0.07, 0.045), {"amp": 0.45, "speed": 6}),
        ("wave", (0.5, 0.15), (0.15, 0.06), {"amp": 0.004}),
        ("peck", (0.35, 0.157), (0.06, 0.045), {"to": (0.45, 0.18), "phase": 0.0}),
        ("peck", (0.5, 0.081), (0.05, 0.04), {"to": (0.51, 0.14), "phase": 0.33}),
        ("peck", (0.63, 0.105), (0.05, 0.04), {"to": (0.58, 0.15), "phase": 0.66}),
        ("peck", (0.63, 0.333), (0.05, 0.04), {"to": (0.57, 0.3), "phase": 0.2}),
        ("peck", (0.34, 0.314), (0.05, 0.04), {"to": (0.41, 0.29), "phase": 0.5}),
        ("wave", (0.5, 0.2), (0.3, 0.17), {"amp": 0.003, "speed": 2}),
        ("shake", (0.53, 0.24), (0.14, 0.12), {"amp": 0.0025}),
        # the run across the square, the flock overhead
        ("bounce", (0.27, 0.53), (0.07, 0.06), {"amp": 0.01, "speed": 4}),
        ("wave", (0.33, 0.47), (0.17, 0.04), {"amp": 0.006, "speed": 3}),
        # the second shout
        ("mouth", (0.755, 0.555), (0.04, 0.03), {"amp": 0.3, "speed": 6}),
        ("shake", (0.75, 0.53), (0.1, 0.08), {"amp": 0.004}),
    ],
    "page-6-dash": [
        # the big dash: Asta bolts, the birds dive at his head
        ("bounce", (0.64, 0.72), (0.18, 0.16), {"amp": 0.008, "speed": 4}),
        ("mouth", (0.69, 0.714), (0.05, 0.035), {"amp": 0.25, "speed": 6}),
        ("wave", (0.62, 0.66), (0.12, 0.06), {"amp": 0.005, "speed": 3}),
        ("peck", (0.56, 0.58), (0.05, 0.04), {"to": (0.6, 0.64), "phase": 0.0}),
        ("peck", (0.76, 0.571), (0.05, 0.04), {"to": (0.7, 0.63), "phase": 0.4}),
        ("peck", (0.89, 0.857), (0.05, 0.04), {"to": (0.8, 0.8), "phase": 0.2}),
        ("peck", (0.51, 0.829), (0.05, 0.04), {"to": (0.56, 0.78), "phase": 0.7}),
        # the happy grin, the thud, the nun's worry
        ("bounce", (0.12, 0.78), (0.08, 0.07), {"amp": 0.006, "speed": 2}),
        ("wave", (0.12, 0.74), (0.08, 0.03), {"amp": 0.004}),
        ("shake", (0.21, 0.638), (0.05, 0.05), {"amp": 0.004}),
        ("wave", (0.3, 0.6), (0.13, 0.04), {"amp": 0.006, "speed": 3}),
        ("blink", (0.089, 0.412), (0.02, 0.012), {"at": 8, "skin": 0}),
        ("blink", (0.164, 0.412), (0.02, 0.012), {"at": 8, "skin": 0}),
    ],
}


def bump(xs, ys, c, r):
    return np.exp(-(((xs - c[0]) / r[0]) ** 2 + ((ys - c[1]) / r[1]) ** 2) * 2.2)


def field(op, c, r, p, f, xs, ys, W, H):
    """Backward displacement (in px) for this op at frame f: output(x) = source(x + d)."""
    u = f / FRAMES
    g = bump(xs, ys, c, r)
    sp = p.get("speed", 2)
    ph = p.get("phase", 0)
    dx = np.zeros_like(xs)
    dy = np.zeros_like(xs)
    if op == "wave":
        a = p["amp"] * W
        dx = a * g * np.sin(2 * np.pi * (u * sp + ph) + xs * 25 + ys * 9)
        dy = 0.5 * a * g * np.cos(2 * np.pi * (u * sp + ph) + ys * 22)
    elif op == "flap":
        dy = -p["amp"] * H * g * np.sin(2 * np.pi * (u * sp + ph))
    elif op in ("bounce", "shake"):
        if op == "bounce":
            s = np.abs(np.sin(np.pi * (u * sp + ph)))
            dy = p["amp"] * H * g * s
        else:
            rnd = np.random.default_rng(f * 7 + int(c[0] * 100))
            dx = p["amp"] * W * g * (rnd.random() - 0.5) * 2
            dy = p["amp"] * H * g * (rnd.random() - 0.5) * 2
    elif op == "peck":
        k = max(0.0, np.sin(2 * np.pi * (u * 3 + ph))) ** 4  # three sharp jabs a loop
        vx = (p["to"][0] - c[0]) * W * 0.65
        vy = (p["to"][1] - c[1]) * H * 0.65
        dx, dy = -vx * k * g, -vy * k * g
    elif op == "mouth":
        k = 0.5 + 0.5 * np.sin(2 * np.pi * (u * sp + ph))
        dy = -(ys - c[1]) * H * p["amp"] * k * g
    return dx, dy


def blink(frame, c, r, p, f):
    shut = {p["at"]: 0.6, p["at"] + 1: 1.0, p["at"] + 2: 0.6}.get(f, 0)
    if not shut:
        return frame
    h, w = frame.shape[:2]
    X, Y, RX, RY = c[0] * w, c[1] * h, r[0] * w, r[1] * h
    lid = Y - RY + 2 * RY * shut
    mask = np.zeros((h, w), np.uint8)
    cv2.ellipse(mask, (int(X), int(Y)), (int(RX * 1.15), int(RY * 1.4)), 0, 0, 360, 255, -1, cv2.LINE_AA)
    mask[int(lid):, :] = 0
    frame[mask > 0] = p["skin"]
    pts = np.array([[X - RX * 1.1 + i * RX * 2.2 / 20, lid + RY * 0.4 * np.sin(np.pi * i / 20)] for i in range(21)], np.int32)
    cv2.polylines(frame, [pts], False, (226, 38, 43), max(2, int(RY * 0.45)), cv2.LINE_AA)
    return frame


def main():
    manifest = json.loads((OUT / "manifest.json").read_text())
    for name, ops in PAGES.items():
        src = Image.open(SRC / f"{name}.png").convert("RGB")
        src = src.resize((WIDTH, round(src.height * WIDTH / src.width)), Image.LANCZOS)
        rgb = np.asarray(src)
        H, W = rgb.shape[:2]
        ys, xs = np.mgrid[0:H, 0:W].astype(np.float32)
        xs_n, ys_n = xs / W, ys / H
        folder = OUT / name
        folder.mkdir(parents=True, exist_ok=True)
        for f in range(FRAMES):
            dx = np.zeros((H, W), np.float32)
            dy = np.zeros((H, W), np.float32)
            for op, c, r, p in ops:
                if op == "blink":
                    continue
                ax, ay = field(op, c, r, p, f, xs_n, ys_n, W, H)
                dx += ax
                dy += ay
            frame = cv2.remap(rgb, xs + dx, ys + dy, cv2.INTER_CUBIC, borderMode=cv2.BORDER_REFLECT)
            for op, c, r, p in ops:
                if op == "blink":
                    frame = blink(frame, c, r, p, f)
            Image.fromarray(frame).save(folder / f"{f}.webp", "WEBP", quality=86, method=4)
        manifest[name] = {"frames": FRAMES, "fps": FPS, "width": W, "height": H}
        size = sum(q.stat().st_size for q in folder.glob("*.webp"))
        print(f"{name}: {W}x{H}, {size / 1e6:.1f} MB")
    (OUT / "manifest.json").write_text(json.dumps(manifest, indent=2) + "\n")


if __name__ == "__main__":
    main()
