"""Pixel-art Asta mascot in the style of the spiky product-film mascot.

Draws on a small grid, then scales up with nearest-neighbour so every
cell stays a crisp square. Palette is limited to red, black and white.

    python3 tools/mascot.py            # writes public/images/asta-mascot*.png
"""

import random
from pathlib import Path

from PIL import Image

GRID = 48
CELL = 24  # 48 * 24 = 1152 px

RED = (226, 38, 43)
RED_DARK = (204, 30, 38)
RED_LIGHT = (236, 58, 58)
INK = (14, 10, 10)
WHITE = (244, 242, 238)
GREY = (176, 174, 170)
CLEAR = (0, 0, 0, 0)

random.seed(7)


def face_edges(y):
    """Left/right edge of the face for row y, with jagged side spikes."""
    left, right = 12, 36
    spikes = {  # row: how far the spike pokes out
        24: 2, 25: 4, 26: 2,
        31: 1, 32: 3, 33: 5, 34: 3, 35: 1,
        38: 2, 39: 3, 40: 1,
    }
    right_spikes = {
        23: 1, 24: 3, 25: 1,
        29: 2, 30: 4, 31: 6, 32: 4, 33: 2,
        37: 1, 38: 3, 39: 1,
    }
    return left - spikes.get(y, 0), right + right_spikes.get(y, 0)


def in_face(x, y):
    if not 20 <= y <= 42:
        return False
    left, right = face_edges(y)
    # slightly tilted chin, like the reference blob
    if y == 42 and x < 15:
        return False
    return left <= x <= right


# hair spikes: (apex_x, apex_y, base_left, base_right) with base on row 21
SPIKES = [
    (7, 13, 11, 17),
    (12, 7, 13, 20),
    (19, 4, 18, 25),
    (26, 6, 23, 30),
    (33, 9, 28, 35),
    (40, 14, 32, 37),
]


def in_hair(x, y):
    if y > 21:
        return False
    for ax, ay, bl, br in SPIKES:
        if y < ay:
            continue
        t = (y - ay) / max(1, 21 - ay)
        left = ax + (bl - ax) * t
        right = ax + (br - ax) * t
        if left - 0.5 <= x <= right + 0.5:
            return True
    return False


def build(expression="smirk"):
    """expression: smirk (the default), smile (happy eyes, open grin) or blink."""
    random.seed(7)  # same skin texture in every expression
    grid = [[CLEAR] * GRID for _ in range(GRID)]
    solid = [[False] * GRID for _ in range(GRID)]

    for y in range(GRID):
        for x in range(GRID):
            if in_face(x, y):
                r = random.random()
                grid[y][x] = RED_DARK if r < 0.05 else RED_LIGHT if r < 0.09 else RED
                solid[y][x] = True
            elif in_hair(x, y):
                # dithered silver hair: checker toward the root, white at the tips
                checker = (x + y) % 2 == 0
                grid[y][x] = GREY if (y >= 16 and checker) else WHITE
                solid[y][x] = True

    # headband across the forehead with Asta's red zig-zag on the left
    for y in (19, 20, 21):
        for x in range(GRID):
            if solid[y][x]:
                grid[y][x] = INK
    for x, y in [(13, 21), (14, 20), (15, 21), (16, 20), (17, 21), (18, 20)]:
        grid[y][x] = RED

    def put(cells, colour):
        for x, y in cells:
            grid[y][x] = colour

    # determined brows, slanting down toward the middle
    put([(16, 24), (17, 24), (18, 25), (19, 25), (20, 26)], INK)
    put([(32, 24), (31, 24), (30, 25), (29, 25), (28, 26)], INK)

    if expression == "smile":
        # happy closed eyes (upturned arcs) and an open grin with a white tooth row
        for ex in (18, 29):
            put([(ex - 1, 30), (ex, 29), (ex + 1, 29), (ex + 2, 30)], INK)
        put([(x, 34) for x in range(20, 29)], INK)
        put([(x, 35) for x in range(20, 29)], WHITE)
        put([(19, 34), (19, 33), (29, 34), (29, 33)], INK)
        put([(x, 36) for x in range(21, 28)], INK)
        put([(x, 37) for x in range(22, 27)], INK)
        put([(23, 37), (24, 37), (25, 37)], RED_DARK)
    else:
        if expression == "blink":
            for ex in (18, 29):
                put([(ex - 1, 30), (ex, 30), (ex + 1, 30), (ex + 2, 30)], INK)
        else:
            # tall pill eyes with a white catch-light
            for ex in (18, 29):
                for y in range(27, 32):
                    put([(ex, y), (ex + 1, y)], INK)
                put([(ex + 1, 28)], WHITE)
        # confident smirk, lifted on one side
        put([(21, 36), (22, 36), (23, 36), (24, 36), (25, 36), (26, 35), (27, 34)], INK)

    # dashed dark outline, like the stitched edge of the reference
    outline = [[False] * GRID for _ in range(GRID)]
    for y in range(GRID):
        for x in range(GRID):
            if solid[y][x]:
                continue
            near = any(
                0 <= x + dx < GRID and 0 <= y + dy < GRID and solid[y + dy][x + dx]
                for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1))
            )
            if near and (x + y) % 3 != 0:
                outline[y][x] = True
    for y in range(GRID):
        for x in range(GRID):
            if outline[y][x]:
                grid[y][x] = INK

    return grid


def render(grid, background=None):
    size = GRID * CELL
    img = Image.new("RGBA", (size, size), background or CLEAR)
    px = Image.new("RGBA", (GRID, GRID), CLEAR)
    for y, row in enumerate(grid):
        for x, colour in enumerate(row):
            if len(colour) == 3:
                px.putpixel((x, y), colour + (255,))
    big = px.resize((size, size), Image.NEAREST)
    img.alpha_composite(big)
    return img


if __name__ == "__main__":
    out = Path(__file__).resolve().parent.parent / "public" / "images"
    grid = build()
    render(grid).save(out / "asta-mascot.png")
    render(grid, (10, 10, 10, 255)).convert("RGB").save(out / "asta-mascot-on-black.png")
    for expression in ("smile", "blink"):
        render(build(expression)).save(out / f"asta-mascot-{expression}.png")
    print("wrote", out / "asta-mascot*.png")
