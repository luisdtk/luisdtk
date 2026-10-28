"""Pixel-art scenes for How They Profit. Every scene draws on a 270x480 canvas.

Signature: scene(img, lt, p, seg, t) -> optional dict(zoom=..., shake=(dx, dy))
  lt = seconds since the scene started, p = scene progress 0..1, t = global time.
"""
import math
from PIL import Image, ImageDraw
from pixelfont import draw_text, draw_text_centered, text_width

W, H = 270, 480
NIGHT = (10, 11, 20)
WALL = (22, 24, 42)
WALL_LINE = (30, 33, 56)
WOOD = (92, 52, 28)
WOOD_HI = (132, 80, 40)
WOOD_DK = (58, 32, 18)
BRASS = (196, 150, 60)
CREAM = (244, 234, 208)
PAPER = (226, 208, 160)
PAPER_DK = (186, 164, 116)
RED = (200, 34, 44)
RED_DK = (120, 18, 26)
GREEN = (0, 214, 110)
GREEN_DK = (0, 96, 52)
GREY = (150, 150, 156)
GREY_DK = (100, 100, 108)
BUN = (214, 150, 76)
BUN_DK = (168, 104, 48)
SAUSAGE = (176, 58, 42)
MUSTARD = (240, 196, 40)
BOARD = (16, 18, 30)
BOARD_FRAME = (60, 52, 40)


def ease(x):
    x = max(0.0, min(1.0, x))
    return 1 - (1 - x) ** 3


def pop(x):
    """0..1 -> overshooting scale for things that appear."""
    x = max(0.0, min(1.0, x))
    c = 1.7
    return 1 + (c + 1) * (x - 1) ** 3 + c * (x - 1) ** 2


# ---------- building blocks ----------

def room(d, floor_y=330):
    d.rectangle((0, 0, W, floor_y), fill=WALL)
    for x in range(0, W, 18):
        d.line((x, 0, x, floor_y), fill=WALL_LINE)
    d.rectangle((0, floor_y - 40, W, floor_y), fill=(30, 22, 26))
    d.line((0, floor_y - 40, W, floor_y - 40), fill=WOOD_DK, width=2)
    d.rectangle((0, floor_y, W, H), fill=(26, 18, 14))
    for y in range(floor_y + 6, H, 10):
        d.line((0, y, W, y), fill=(34, 24, 18))


def lamp(img, x, y, cone_h=260, glow=1.0):
    d = ImageDraw.Draw(img)
    d.line((x, 0, x, y - 8), fill=(40, 40, 40), width=1)
    d.polygon([(x - 18, y), (x + 18, y), (x + 10, y - 9), (x - 10, y - 9)], fill=(28, 70, 50))
    d.line((x - 18, y, x + 18, y), fill=(60, 120, 90))
    d.rectangle((x - 4, y + 1, x + 4, y + 3), fill=(255, 236, 170))
    cone = Image.new("RGBA", (W, H))
    cd = ImageDraw.Draw(cone)
    for i, a in enumerate((18, 14, 10)):
        spread = 40 + i * 22
        cd.polygon([(x - 14, y + 2), (x + 14, y + 2), (x + spread + 30, y + cone_h), (x - spread - 30, y + cone_h)],
                   fill=(255, 220, 140, int(a * glow)))
    img.paste(Image.alpha_composite(img.convert("RGBA"), cone).convert("RGB"))


def counter(d, y=340):
    d.rectangle((0, y, W, y + 14), fill=WOOD_HI)
    d.rectangle((0, y + 14, W, H), fill=WOOD)
    d.line((0, y, W, y), fill=BRASS)
    for x in range(10, W, 46):
        d.line((x, y + 20, x + 20, y + 20), fill=WOOD_DK)


def hot_dog(d, cx, cy, s=1, bite=False):
    w, h = 44 * s, 14 * s
    d.rounded_rectangle((cx - w // 2, cy - h // 2 + 3 * s, cx + w // 2, cy + h // 2 + 4 * s), radius=6 * s, fill=BUN_DK)
    d.rounded_rectangle((cx - w // 2 - 4 * s, cy - h // 2 - 2 * s, cx + w // 2 + 4 * s, cy + h // 2 - 2 * s),
                        radius=6 * s, fill=SAUSAGE)
    d.rounded_rectangle((cx - w // 2, cy - 1 * s, cx + w // 2, cy + h // 2 + 2 * s), radius=6 * s, fill=BUN)
    for i in range(-3, 4):
        x = cx + i * 6 * s
        d.line((x - 2 * s, cy - 4 * s, x + 2 * s, cy - 6 * s), fill=MUSTARD, width=max(1, s))
    if bite:
        d.ellipse((cx + w // 2 - 6 * s, cy - h, cx + w // 2 + 10 * s, cy + h), fill=NIGHT)


def soda(d, cx, base_y, s=1):
    d.polygon([(cx - 9 * s, base_y - 34 * s), (cx + 9 * s, base_y - 34 * s), (cx + 7 * s, base_y), (cx - 7 * s, base_y)],
              fill=(210, 40, 50))
    d.rectangle((cx - 10 * s, base_y - 38 * s, cx + 10 * s, base_y - 34 * s), fill=(230, 230, 230))
    d.line((cx + 3 * s, base_y - 38 * s, cx + 6 * s, base_y - 50 * s), fill=(240, 240, 240), width=max(1, s))
    d.rectangle((cx - 7 * s, base_y - 24 * s, cx + 6 * s, base_y - 18 * s), fill=CREAM)


def mannequin(d, cx, base_y, s=1.0, col=GREY, shade=GREY_DK):
    s = float(s)
    hr = int(9 * s)
    d.ellipse((cx - hr, base_y - int(74 * s), cx + hr, base_y - int(56 * s)), fill=col)
    d.rectangle((cx - int(4 * s), base_y - int(57 * s), cx + int(4 * s), base_y - int(52 * s)), fill=shade)
    d.rounded_rectangle((cx - int(18 * s), base_y - int(52 * s), cx + int(18 * s), base_y), radius=int(8 * s), fill=col)
    d.line((cx, base_y - int(48 * s), cx, base_y - 4), fill=shade)


def price_board(d, cx, y, title, value, flash=0.0, w=170):
    h = 86
    d.rectangle((cx - w // 2 - 4, y - 4, cx + w // 2 + 4, y + h + 4), fill=BOARD_FRAME)
    d.rectangle((cx - w // 2, y, cx + w // 2, y + h), fill=BOARD)
    for i, line in enumerate(title.split("|")):
        draw_text_centered(d, cx, y + 8 + i * 10, line, PAPER_DK)
    n = len(value)
    cell = 22
    total = n * cell + (n - 1) * 3
    x = cx - total // 2
    col = CREAM if flash <= 0 else (255, 255, 255)
    for ch in value:
        d.rectangle((x, y + 36, x + cell, y + 36 + 34), fill=(28, 30, 46))
        d.line((x, y + 53, x + cell, y + 53), fill=(12, 12, 20))
        draw_text(d, x + (cell - text_width(ch, 3)) // 2 + 1, y + 43, ch, col, scale=3)
        x += cell + 3


def paper(d, box, lines, scale=1, stamp=None, stamp_p=0.0):
    x0, y0, x1, y1 = box
    d.rectangle((x0 + 4, y0 + 4, x1 + 4, y1 + 4), fill=(0, 0, 0))
    d.rectangle(box, fill=PAPER)
    d.rectangle((x0, y0, x1, y0 + 3), fill=PAPER_DK)
    y = y0 + 14
    for ln in lines:
        col = RED if ln.startswith("!") else (60, 44, 30)
        ln = ln.lstrip("!")
        draw_text_centered(d, (x0 + x1) // 2, y, ln, col, scale=scale)
        y += 9 * scale + 3
    if stamp and stamp_p > 0:
        sc = max(1, int(round(3 - 1.0 * ease(stamp_p * 3))))
        sw = text_width(stamp, sc) + 10
        cx, cy = (x0 + x1) // 2, y1 - 34
        d.rectangle((cx - sw // 2, cy - 6 * sc, cx + sw // 2, cy + 8 * sc), outline=RED, width=2)
        draw_text_centered(d, cx, cy - 3 * sc, stamp, RED, scale=sc)


def coin(d, cx, cy, r=10):
    d.ellipse((cx - r, cy - r + 2, cx + r, cy + r + 2), fill=(150, 110, 30))
    d.ellipse((cx - r, cy - r, cx + r, cy + r), fill=BRASS)
    d.ellipse((cx - r + 3, cy - r + 3, cx + r - 3, cy + r - 3), outline=(240, 200, 90))
    draw_text_centered(d, cx, cy - 3, "$", (120, 80, 20))


def member_card(img, cx, cy, widthf=1.0, glow=0.0):
    w, h = 150, 94
    card = Image.new("RGBA", (w, h))
    cd = ImageDraw.Draw(card)
    cd.rounded_rectangle((0, 0, w - 1, h - 1), radius=8, fill=GREEN_DK)
    cd.rounded_rectangle((3, 3, w - 4, h - 4), radius=6, fill=GREEN)
    cd.rectangle((3, 18, w - 4, 30), fill=GREEN_DK)
    draw_text(cd, 10, 6, "MEMBER", NIGHT)
    draw_text(cd, 10, 21, "ANNUAL", CREAM)
    cd.rectangle((10, 40, 44, 82), fill=CREAM)
    mannequin(cd, 27, 82, s=0.55, col=GREY_DK, shade=(70, 70, 76))
    for i in range(3):
        cd.rectangle((54, 46 + i * 11, 54 + 70 - i * 18, 50 + i * 11), fill=GREEN_DK)
    cw = max(2, int(w * abs(widthf)))
    card = card.resize((cw, h), Image.NEAREST)
    if glow > 0:
        halo = Image.new("RGBA", (W, H))
        ImageDraw.Draw(halo).rounded_rectangle((cx - cw // 2 - 10, cy - h // 2 - 10, cx + cw // 2 + 10, cy + h // 2 + 10),
                                              radius=14, fill=(0, 214, 110, int(70 * glow)))
        img.paste(Image.alpha_composite(img.convert("RGBA"), halo).convert("RGB"))
    base = img.convert("RGBA")
    base.alpha_composite(card, (cx - cw // 2, cy - h // 2))
    img.paste(base.convert("RGB"))


# ---------- scenes ----------

def hook(img, lt, p, seg, t):
    """Dark room, lamp, a lone hot dog on the counter in the spotlight."""
    d = ImageDraw.Draw(img)
    room(d)
    lamp(img, W // 2, 70)
    d = ImageDraw.Draw(img)
    counter(d)
    d.ellipse((W // 2 - 80, 332, W // 2 + 80, 348), fill=(40, 26, 18))
    d.rectangle((W // 2 - 74, 326, W // 2 + 74, 338), fill=(200, 60, 50))
    d.rectangle((W // 2 - 74, 326, W // 2 + 74, 328), fill=(230, 90, 80))
    bob = int(math.sin(t * 3) * 1.5)
    hot_dog(d, W // 2, 306 + bob, s=3)
    return {"zoom": 0.05 * ease(lt / 1.5)}


def combo_price(img, lt, p, seg, t):
    d = ImageDraw.Draw(img)
    room(d)
    lamp(img, W // 2, 40, cone_h=300)
    d = ImageDraw.Draw(img)
    shown = "$1.50" if lt > 0.35 else "$-.--"
    price_board(d, W // 2, 92, "HOT DOG + SODA|COMBO PRICE", shown, flash=1 if 0.35 < lt < 0.5 else 0)
    counter(d)
    hot_dog(d, W // 2 - 30, 326, s=2)
    soda(d, W // 2 + 58, 338, s=1)


def same_price(img, lt, p, seg, t):
    d = ImageDraw.Draw(img)
    room(d)
    lamp(img, W // 2, 40, cone_h=300)
    d = ImageDraw.Draw(img)
    price_board(d, W // 2, 92, "HOT DOG + SODA|COMBO PRICE", "$1.50")
    year = 1985 + int(ease(p * 1.1) * (2026 - 1985))
    d.rectangle((W // 2 - 50, 200, W // 2 + 50, 228), fill=BOARD_FRAME)
    d.rectangle((W // 2 - 47, 203, W // 2 + 47, 225), fill=BOARD)
    draw_text_centered(d, W // 2, 208, str(year), GREEN if year == 2026 else CREAM, scale=2)
    # calendar pages flying off
    for i in range(3):
        k = (lt * 2.4 + i / 3) % 1
        x = W // 2 + 60 + int(k * 70)
        y = 212 - int(k * 60) + int(math.sin(k * 6) * 6)
        d.rectangle((x, y, x + 10, y + 12), fill=PAPER if k < 0.8 else PAPER_DK)
    counter(d)
    hot_dog(d, W // 2, 326, s=2)


def boardroom(img, lt, p, seg, t):
    """An executive points at the price board and wants it to go up."""
    d = ImageDraw.Draw(img)
    room(d, floor_y=300)
    lamp(img, W // 2, 30, cone_h=320)
    d = ImageDraw.Draw(img)
    up = ease((lt - 0.4) / 0.6)
    price_board(d, W // 2, 70, "COMBO PRICE", "$1.50" if up < 0.5 else "$2.00", w=150)
    if up > 0:
        ay = 172 - int(up * 14)
        d.polygon([(W // 2 + 82, ay), (W // 2 + 94, ay + 14), (W // 2 + 70, ay + 14)], fill=RED)
        d.rectangle((W // 2 + 78, ay + 14, W // 2 + 86, ay + 30), fill=RED)
    # table
    d.polygon([(20, 330), (W - 20, 330), (W, 400), (0, 400)], fill=WOOD)
    d.line((20, 330, W - 20, 330), fill=BRASS)
    d.rectangle((0, 400, W, 408), fill=WOOD_DK)
    for cx in (60, 210):
        mannequin(d, cx, 336, s=1.1)
    # the executive stands, arm raised at the board
    mannequin(d, 135, 330, s=1.35, col=(176, 176, 182))
    d.line((150, 270, 185 + int(up * 10), 238 - int(up * 12)), fill=(176, 176, 182), width=6)
    return {"zoom": 0.0}


def confidential(img, lt, p, seg, t):
    d = ImageDraw.Draw(img)
    d.rectangle((0, 0, W, H), fill=WOOD_DK)
    for y in range(0, H, 14):
        d.line((0, y, W, y + 6), fill=WOOD)
    lines = ["CONFIDENTIAL", "", "MEMO FROM", "THE CO-FOUNDER", "", "!IF YOU RAISE", "!THE PRICE OF", "!THE HOT DOG,",
             "!I WILL KILL YOU."]
    paper(d, (16, 40, W - 16, 330), lines, scale=2, stamp="DENIED", stamp_p=max(0.0, (p - 0.62) / 0.38))
    shake = (0, 0)
    if 0.62 < p < 0.75:
        k = int(lt * 60)
        shake = ((k % 3) - 1) * 3, ((k * 7 % 3) - 1) * 3
    return {"shake": shake, "zoom": 0.08 * ease(p)}


def not_for_money(img, lt, p, seg, t):
    d = ImageDraw.Draw(img)
    room(d)
    lamp(img, W // 2, 60)
    d = ImageDraw.Draw(img)
    counter(d)
    hot_dog(d, W // 2 - 50, 320, s=2)
    for i in range(3):
        coin(d, W // 2 + 40 + i * 6, 316 - i * 8, r=14)
    k = ease((lt - 0.3) / 0.3)
    if k > 0:
        cx, cy, r = W // 2 + 46, 300, int(34 * pop(k))
        d.line((cx - r, cy - r, cx + r, cy + r), fill=RED, width=7)
        d.line((cx - r, cy + r, cx + r, cy - r), fill=RED, width=7)


def come_back(img, lt, p, seg, t):
    """A warehouse door; little shoppers keep walking back in."""
    d = ImageDraw.Draw(img)
    d.rectangle((0, 0, W, H), fill=NIGHT)
    for i in range(30):
        d.point(((i * 53) % W, (i * 97) % 170), fill=(80, 80, 110))
    d.rectangle((20, 140, W - 20, 330), fill=(52, 58, 80))
    d.rectangle((20, 140, W - 20, 150), fill=(70, 76, 100))
    d.rectangle((40, 160, W - 40, 186), fill=RED_DK)
    draw_text_centered(d, W // 2, 166, "WAREHOUSE", CREAM, scale=2)
    d.rectangle((W // 2 - 36, 230, W // 2 + 36, 330), fill=(255, 226, 150))
    d.line((W // 2, 230, W // 2, 330), fill=(200, 170, 100))
    d.rectangle((0, 330, W, H), fill=(30, 30, 36))
    for i in range(6):
        k = (lt * 0.45 + i / 6) % 1
        x = int(-20 + k * (W // 2 + 20))
        y = 380 - int(k * 50)
        s = 0.5 + 0.3 * (1 - k)
        if x < W // 2 - 10:
            mannequin(d, x, y, s=s)
    draw_text_centered(d, W // 2, 204, "AGAIN", GREEN, scale=2) if lt % 0.8 < 0.5 else None


def membership(img, lt, p, seg, t):
    d = ImageDraw.Draw(img)
    room(d)
    lamp(img, W // 2, 50, cone_h=300)
    spin = math.cos(min(lt / 0.9, 1) * math.pi * 4) if lt < 0.9 else 1.0
    member_card(img, W // 2, 210, widthf=spin, glow=ease((lt - 0.9) / 0.4))
    d = ImageDraw.Draw(img)
    counter(d)


def renew_meter(img, lt, p, seg, t):
    d = ImageDraw.Draw(img)
    room(d)
    lamp(img, W // 2, 40, cone_h=300)
    d = ImageDraw.Draw(img)
    pct = int(90 * ease(p * 1.3))
    price_board(d, W // 2, 80, "MEMBERS WHO|RENEW EACH YEAR", f"{pct}%")
    x0, y0, x1 = 40, 200, W - 40
    d.rectangle((x0 - 3, y0 - 3, x1 + 3, y0 + 21), fill=BOARD_FRAME)
    d.rectangle((x0, y0, x1, y0 + 18), fill=BOARD)
    fill = x0 + int((x1 - x0) * pct / 100)
    d.rectangle((x0, y0, fill, y0 + 18), fill=GREEN)
    for x in range(x0, fill, 8):
        d.line((x, y0, x, y0 + 18), fill=GREEN_DK)
    for i in range(10):
        on = i < round(pct / 10)
        mannequin(d, 30 + i * 23, 300, s=0.5, col=GREEN if on else GREY_DK, shade=GREEN_DK if on else (70, 70, 76))
    counter(d, y=310)


def cash_stack(img, lt, p, seg, t):
    d = ImageDraw.Draw(img)
    room(d)
    lamp(img, W // 2, 40, cone_h=300)
    d = ImageDraw.Draw(img)
    price_board(d, W // 2, 70, "MEMBERSHIP FEES|PER YEAR", "$4B+")
    counter(d)
    for col in range(5):
        n = int(ease(p * 1.4 - col * 0.08) * 12)
        x = 40 + col * 48
        for i in range(n):
            y = 336 - i * 7
            d.rectangle((x - 16, y - 6, x + 16, y), fill=(60, 130, 70))
            d.rectangle((x - 16, y - 6, x + 16, y - 5), fill=(110, 190, 110))
            d.rectangle((x - 3, y - 5, x + 3, y - 1), fill=(200, 230, 180))
    member_card(img, W // 2, 215, widthf=0.62)


def profit_pie(img, lt, p, seg, t):
    d = ImageDraw.Draw(img)
    room(d)
    lamp(img, W // 2, 40, cone_h=300)
    d = ImageDraw.Draw(img)
    draw_text_centered(d, W // 2, 70, "COSTCO PROFIT", PAPER_DK, scale=2)
    cx, cy, r = W // 2, 190, 78
    d.ellipse((cx - r - 4, cy - r - 4, cx + r + 4, cy + r + 4), fill=BOARD_FRAME)
    d.ellipse((cx - r, cy - r, cx + r, cy + r), fill=GREY_DK)
    ang = 360 * 0.5 * ease(p * 1.4)
    if ang > 1:
        d.pieslice((cx - r, cy - r, cx + r, cy + r), -90, -90 + ang, fill=GREEN)
    d.line((cx, cy - r, cx, cy + r), fill=NIGHT, width=2) if ang >= 179 else None
    draw_text_centered(d, cx + 40, cy - 6, "FEES", NIGHT, scale=1) if ang > 120 else None
    draw_text_centered(d, cx - 40, cy - 6, "STORE", CREAM, scale=1)
    counter(d)


def versus(img, lt, p, seg, t):
    """Hot dog dims, the membership card lights up."""
    d = ImageDraw.Draw(img)
    room(d)
    lamp(img, 70, 40, cone_h=280, glow=max(0.15, 1 - ease(p * 2)))
    lamp(img, 200, 40, cone_h=280, glow=ease(p * 2))
    d = ImageDraw.Draw(img)
    counter(d)
    hot_dog(d, 70, 300, s=2)
    member_card(img, 200, 260, widthf=0.7, glow=ease(p * 2))
    d = ImageDraw.Draw(img)
    if p >= 0.5:
        veil = Image.new("RGBA", (W, H))
        ImageDraw.Draw(veil).rectangle((0, 0, 135, H), fill=(0, 0, 0, int(140 * ease((p - 0.5) * 3))))
        img.paste(Image.alpha_composite(img.convert("RGBA"), veil).convert("RGB"))
