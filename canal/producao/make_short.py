"""Render a How They Profit Short: edge-tts voice + animated captions -> 1080x1920 MP4.
Usage: python3 make_short.py script.json out.mp4
"""
import json, math, os, subprocess, sys, tempfile
from PIL import Image, ImageDraw, ImageFont

W, H, FPS = 1080, 1920, 30
BG, GRID, GREEN, WHITE, GREY = (12, 12, 14), (24, 24, 28), (0, 214, 110), (255, 255, 255), (150, 150, 158)
FONT = "/usr/share/fonts/opentype/inter/InterDisplay-Black.otf"
VOICE, RATE = "en-US-AndrewNeural", "+10%"
CA = "/root/.ccr/ca-bundle.crt"


def tts(text, path):
    env = dict(os.environ, SSL_CERT_FILE=CA)
    cmd = ["edge-tts", "--voice", VOICE, f"--rate={RATE}", "--text", text, "--write-media", path]
    if os.environ.get("HTTPS_PROXY"):
        cmd[1:1] = ["--proxy", os.environ["HTTPS_PROXY"]]
    subprocess.run(cmd, check=True, env=env, capture_output=True)


def duration(path):
    out = subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", path],
                         capture_output=True, text=True, check=True).stdout
    return float(out)


def chunks(text, n=3):
    words = text.split()
    return [" ".join(words[i:i + n]) for i in range(0, len(words), n)]


def ease_out_back(t):
    c = 1.70158
    return 1 + (c + 1) * (t - 1) ** 3 + c * (t - 1) ** 2


def wrap(draw, words, font, maxw):
    lines, cur = [], []
    for w in words:
        test = " ".join(cur + [w])
        if cur and draw.textlength(test, font=font) > maxw:
            lines.append(cur); cur = [w]
        else:
            cur.append(w)
    if cur:
        lines.append(cur)
    return lines


def draw_caption(img, text, highlight, t_local, y_center):
    scale = min(1.0, ease_out_back(min(t_local / 0.18, 1.0))) if t_local < 0.18 else 1.0
    size = max(10, int(118 * (0.75 + 0.25 * scale)))
    font = ImageFont.truetype(FONT, size)
    d = ImageDraw.Draw(img)
    words = text.upper().split()
    lines = wrap(d, words, font, W - 140)
    lh = int(size * 1.12)
    y = y_center - lh * len(lines) // 2
    hl = {h.upper().strip(".,!?") for h in highlight}
    for line in lines:
        lw = d.textlength(" ".join(line), font=font)
        x = (W - lw) / 2
        for w in line:
            col = GREEN if w.strip(".,!?:") in hl else WHITE
            d.text((x, y), w, font=font, fill=col, stroke_width=10, stroke_fill=(0, 0, 0))
            x += d.textlength(w + " ", font=font)
        y += lh


def draw_big(img, big, t_local):
    p = min(t_local / 0.25, 1.0)
    s = ease_out_back(p) if p < 1 else 1.0
    size = max(10, int(300 * s))
    font = ImageFont.truetype(FONT, size)
    d = ImageDraw.Draw(img)
    d.text((W / 2, 640), big, font=font, fill=GREEN, anchor="mm", stroke_width=6, stroke_fill=(0, 60, 34))


def background(t, seg_idx):
    img = Image.new("RGB", (W, H), BG)
    d = ImageDraw.Draw(img)
    off = int(t * 40) % 90
    for x in range(-90, W + 90, 90):
        d.line((x + off, 0, x + off, H), fill=GRID, width=2)
    for y in range(-90, H + 90, 90):
        d.line((0, y + off, W, y + off), fill=GRID, width=2)
    # rising chart line that grows across the video
    pts, n = [], 14
    for i in range(n + 1):
        x = i * W / n
        y = 1650 - i * 55 - (60 if i % 3 == 1 else 0) + 30 * math.sin(t * 2 + i)
        pts.append((x, y))
    d.line(pts, fill=(0, 70, 40), width=10)
    # progress bar at the top keeps eyes on the screen
    return img


def main(script_path, out_path):
    spec = json.load(open(script_path))
    tmp = tempfile.mkdtemp()
    segs = []
    for i, s in enumerate(spec["segments"]):
        a = os.path.join(tmp, f"a{i:02d}.mp3")
        tts(s["say"], a)
        segs.append({**s, "audio": a, "dur": duration(a) + s.get("pause", 0.08)})
    total = sum(s["dur"] for s in segs)

    # concatenate audio with small gaps
    lst = os.path.join(tmp, "list.txt")
    parts = []
    for i, s in enumerate(segs):
        padded = os.path.join(tmp, f"p{i:02d}.wav")
        subprocess.run(["ffmpeg", "-y", "-v", "error", "-i", s["audio"], "-af", f"apad=pad_dur={s.get('pause', 0.08)}",
                        "-ar", "44100", "-ac", "2", padded], check=True)
        parts.append(padded)
    open(lst, "w").write("".join(f"file '{p}'\n" for p in parts))
    voice = os.path.join(tmp, "voice.wav")
    subprocess.run(["ffmpeg", "-y", "-v", "error", "-f", "concat", "-safe", "0", "-i", lst, "-c", "copy", voice], check=True)
    total = duration(voice)

    # timeline of caption chunks
    timeline, t0 = [], 0.0
    for idx, s in enumerate(segs):
        cs = chunks(s.get("show", s["say"]), s.get("words", 3))
        weights = [len(c) + 4 for c in cs]
        speak = s["dur"] - s.get("pause", 0.08)
        tt = t0
        for c, w in zip(cs, weights):
            d = speak * w / sum(weights)
            timeline.append((tt, tt + d, c, s.get("hl", []), s.get("big"), t0, idx))
            tt += d
        t0 += s["dur"]

    frames = os.path.join(tmp, "f")
    os.makedirs(frames)
    nframes = int(total * FPS) + 1
    ci = 0
    for f in range(nframes):
        t = f / FPS
        while ci < len(timeline) - 1 and t >= timeline[ci][1]:
            ci += 1
        start, end, text, hl, big, seg_start, sidx = timeline[ci]
        img = background(t, sidx)
        d = ImageDraw.Draw(img)
        d.rectangle((0, 0, int(W * t / total), 14), fill=GREEN)
        if big:
            draw_big(img, big, t - seg_start)
        draw_caption(img, text, hl, t - start, 1080 if big else 960)
        img.save(os.path.join(frames, f"{f:05d}.png"), compress_level=1)

    subprocess.run(["ffmpeg", "-y", "-v", "error", "-framerate", str(FPS), "-i", os.path.join(frames, "%05d.png"),
                    "-i", voice, "-c:v", "libx264", "-pix_fmt", "yuv420p", "-crf", "20", "-preset", "medium",
                    "-c:a", "aac", "-b:a", "160k", "-shortest", "-movflags", "+faststart", out_path], check=True)
    print(f"{out_path}: {total:.1f}s")


if __name__ == "__main__":
    main(sys.argv[1], sys.argv[2])
