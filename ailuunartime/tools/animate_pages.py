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
FRAMES = 48
FPS = 24  # every frame drawn: smooth, not on twos
WIDTH = 1600

# op, centre (x, y), radius (x, y), params
PAGES = {
    "cover": [
        # Yuno: hair and cape in his own wind, the swirl in his hand turns, the grimoire's light breathes
        ("wave", (0.55, 0.13), (0.1, 0.06), {"amp": 0.006, "speed": 2}),
        ("wave", (0.09, 0.27), (0.07, 0.1), {"amp": 0.012, "speed": 3}),
        ("wave", (0.68, 0.24), (0.15, 0.13), {"amp": 0.007, "speed": 2}),
        ("bounce", (0.68, 0.24), (0.1, 0.07), {"amp": 0.004, "speed": 1}),
        # Asta: hair, cape and the black grimoire's flames
        ("wave", (0.48, 0.46), (0.12, 0.05), {"amp": 0.006, "speed": 2}),
        ("wave", (0.27, 0.62), (0.08, 0.1), {"amp": 0.008, "speed": 2, "phase": 0.3}),
        ("wave", (0.5, 0.72), (0.2, 0.12), {"amp": 0.006, "speed": 3}),
        ("blink", (0.493, 0.554), (0.017, 0.008), {"at": 18, "skin": 238}),
        ("blink", (0.56, 0.552), (0.017, 0.008), {"at": 18, "skin": 238}),
    ],
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
        ("blink", (0.27, 0.467), (0.022, 0.011), {"at": 14, "skin": 240}),
        ("blink", (0.364, 0.464), (0.022, 0.011), {"at": 14, "skin": 240}),
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
        ("blink", (0.089, 0.412), (0.02, 0.012), {"at": 8, "skin": 240}),
        ("blink", (0.164, 0.412), (0.02, 0.012), {"at": 8, "skin": 240}),
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
    b = p["at"] * 2
    shut = {b: 0.4, b + 1: 0.85, b + 2: 1.0, b + 3: 0.85, b + 4: 0.4}.get(f, 0)
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
    cv2.polylines(frame, [pts], False, (15, 12, 12), max(2, int(RY * 0.45)), cv2.LINE_AA)
    return frame


def panel_breathing(name, xs, ys):
    """Per-panel masks (soft inside the box, zero on its border, so the frame lines hold still)."""
    layout = json.loads((ROOT / "public" / "images" / "mattes" / "panels.json").read_text()).get(name, [])
    out = []
    for i, (x, y, w, h) in enumerate(layout):
        edge = 0.012
        fx = np.clip(np.minimum(xs - x, x + w - xs) / edge, 0, 1)
        fy = np.clip(np.minimum(ys - y, y + h - ys) / (edge * 0.67), 0, 1)
        mask = (fx * fy).astype(np.float32)
        mask = mask * mask * (3 - 2 * mask)  # smoothstep
        out.append((x + w / 2, y + h / 2, mask, i * 1.3))
    return out


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
        breathe = panel_breathing(name, xs_n, ys_n)
        for f in range(FRAMES):
            dx = np.zeros((H, W), np.float32)
            dy = np.zeros((H, W), np.float32)
            # every panel moves: a slow camera breath inside its own frame, and the air stirs
            u = 2 * np.pi * f / FRAMES
            for (cx, cy, mask, phase) in breathe:
                s = 0.022 * (0.5 - 0.5 * np.cos(u + phase))  # zoom in and out, about the panel centre
                dx += -(xs - cx * W) * s * mask + np.sin(u + phase) * 0.004 * W * mask
                dy += -(ys - cy * H) * s * mask + np.cos(u + phase) * 0.003 * H * mask
            dx += 0.0018 * W * np.sin(u + xs_n * 9 + ys_n * 5)
            dy += 0.0012 * H * np.cos(u + ys_n * 8)
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
            Image.fromarray(frame).save(folder / f"{f}.webp", "WEBP", quality=82, method=4)
        manifest[name] = {"frames": FRAMES, "fps": FPS, "width": W, "height": H}
        size = sum(q.stat().st_size for q in folder.glob("*.webp"))
        print(f"{name}: {W}x{H}, {size / 1e6:.1f} MB")
    (OUT / "manifest.json").write_text(json.dumps(manifest, indent=2) + "\n")


if __name__ == "__main__":
    main()
