"""Render a How They Profit pixel-art Short.

Each scene is drawn on a 270x480 canvas and upscaled 4x with nearest-neighbour
to 1080x1920, so every shape stays a crisp pixel. The voice comes from edge-tts
with word timings, which drive the one-word-at-a-time captions.

Usage: python3 pixel_short.py <video_dir>   (reads script.json, writes video.mp4)
"""
import asyncio, json, math, os, random, subprocess, sys, tempfile
from PIL import Image, ImageDraw
import edge_tts
import music, scenes
from pixelfont import draw_text_centered, text_width

LW, LH, SCALE, FPS = 270, 480, 4, 30
VOICE, RATE = "en-US-AndrewNeural", "+6%"
CAPTION_Y = 352
CREAM, INK, GREEN = (244, 234, 208), (0, 0, 0), (0, 214, 110)


async def _tts(text, path):
    com = edge_tts.Communicate(text, VOICE, rate=RATE, boundary="WordBoundary", proxy=os.environ.get("HTTPS_PROXY"))
    words = []
    with open(path, "wb") as f:
        async for ch in com.stream():
            if ch["type"] == "audio":
                f.write(ch["data"])
            elif ch["type"] == "WordBoundary":
                words.append((ch["offset"] / 1e7, (ch["offset"] + ch["duration"]) / 1e7, ch["text"]))
    return words


def tts(text, path):
    os.environ.setdefault("SSL_CERT_FILE", "/root/.ccr/ca-bundle.crt")
    return asyncio.run(_tts(text, path))


def duration(path):
    out = subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", path],
                         capture_output=True, text=True, check=True).stdout
    return float(out)


def build_audio(segs, tmp):
    """Synthesize each segment, then join them with their pauses. Returns (wav path, words, scene spans)."""
    parts, words, spans, t = [], [], [], 0.0
    for i, s in enumerate(segs):
        mp3 = os.path.join(tmp, f"s{i:02d}.mp3")
        w = tts(s["say"], mp3)
        d = duration(mp3)
        pause = s.get("pause", 0.12)
        wav = os.path.join(tmp, f"s{i:02d}.wav")
        subprocess.run(["ffmpeg", "-y", "-v", "error", "-i", mp3, "-af", f"apad=pad_dur={pause}",
                        "-ar", "44100", "-ac", "2", wav], check=True)
        parts.append(wav)
        words += [(a + t, b + t, txt, i) for a, b, txt in w]
        spans.append((t, t + d + pause))
        t += d + pause
    lst = os.path.join(tmp, "list.txt")
    with open(lst, "w") as f:
        f.writelines(f"file '{p}'\n" for p in parts)
    voice = os.path.join(tmp, "voice.wav")
    subprocess.run(["ffmpeg", "-y", "-v", "error", "-f", "concat", "-safe", "0", "-i", lst, "-c", "copy", voice], check=True)
    return voice, words, spans


def mix_audio(voice, sfx_times, total, tmp):
    """Voice + the channel's 8-bit loop (ducked under the voice) + room tone + a 'blip' on every scene cut."""
    out = os.path.join(tmp, "mix.wav")
    track = os.path.join(tmp, "music.wav")
    music.write(track, total)
    blips = "".join(f"[b{i}]" for i in range(len(sfx_times)))
    filters = ["[0:a]asplit=2[v][key]",
               "[1:a]aformat=channel_layouts=stereo,volume=0.22[m]",
               "[m][key]sidechaincompress=threshold=0.03:ratio=5:attack=15:release=350[duck]",
               f"anoisesrc=color=brown:amplitude=0.5:duration={total:.2f},lowpass=f=180,volume=0.06[amb]"]
    for i, ts in enumerate(sfx_times):
        filters.append(f"sine=frequency=880:duration=0.06,volume=0.12,adelay={int(ts * 1000)}|{int(ts * 1000)},"
                       f"aformat=channel_layouts=stereo[b{i}]")
    filters.append(f"[v][duck][amb]{blips}amix=inputs={3 + len(sfx_times)}:normalize=0:duration=first,"
                   "loudnorm=I=-14:TP=-1.5:LRA=11[out]")
    subprocess.run(["ffmpeg", "-y", "-v", "error", "-i", voice, "-i", track, "-filter_complex", ";".join(filters),
                    "-map", "[out]", "-ar", "44100", out], check=True)
    return out


def post_fx(img, t):
    """Vignette, lamp flicker and a light grain, all at low resolution."""
    rnd = random.Random(int(t * FPS))
    flicker = 1.0 if rnd.random() > 0.04 else 0.86
    if flicker < 1:
        img = Image.eval(img, lambda v: int(v * flicker))
    img = Image.alpha_composite(img.convert("RGBA"), VIGNETTE).convert("RGB")
    px = img.load()
    for _ in range(260):
        x, y = rnd.randrange(LW), rnd.randrange(LH)
        r, g, b = px[x, y]
        k = rnd.choice((-10, 10))
        px[x, y] = (max(0, min(255, r + k)), max(0, min(255, g + k)), max(0, min(255, b + k)))
    return img


def make_vignette():
    v = Image.new("RGBA", (LW, LH))
    p = v.load()
    for y in range(LH):
        for x in range(LW):
            dx, dy = (x - LW / 2) / (LW / 2), (y - LH / 2) / (LH / 2)
            a = max(0.0, min(1.0, (math.hypot(dx * 0.9, dy * 0.75) - 0.55) / 0.6))
            p[x, y] = (0, 0, 0, int(200 * a))
    return v


VIGNETTE = make_vignette()


def camera(img, zoom, shake=(0, 0)):
    if zoom == 1 and shake == (0, 0):
        return img
    w, h = int(LW / zoom), int(LH / zoom)
    x0 = (LW - w) // 2 + shake[0]
    y0 = (LH - h) // 2 + shake[1]
    return img.crop((x0, y0, x0 + w, y0 + h)).resize((LW, LH), Image.NEAREST)


def pixelate(img, amount):
    """amount 0..1 -> blocky transition like the reference style."""
    if amount <= 0:
        return img
    f = 1 + int(amount * 14)
    small = img.resize((max(1, LW // f), max(1, LH // f)), Image.BILINEAR)
    return small.resize((LW, LH), Image.NEAREST)


def caption(draw, word, color):
    word = word.upper()
    scale = 3 if text_width(word, 3) <= LW - 16 else 2
    draw_text_centered(draw, LW // 2, CAPTION_Y, word, color, scale=scale, outline=INK)


def main(video_dir):
    spec = json.load(open(os.path.join(video_dir, "script.json")))
    segs = spec["segments"]
    tmp = tempfile.mkdtemp()
    voice, words, spans = build_audio(segs, tmp)
    total = duration(voice)
    audio = mix_audio(voice, [a for a, _ in spans[1:]], total, tmp)
    highlight = {w.upper() for w in spec.get("highlight", [])}

    out = os.path.join(video_dir, "video.mp4")
    ff = subprocess.Popen(["ffmpeg", "-y", "-v", "error", "-f", "rawvideo", "-pix_fmt", "rgb24",
                           "-s", f"{LW * SCALE}x{LH * SCALE}", "-r", str(FPS), "-i", "-", "-i", audio,
                           "-c:v", "libx264", "-pix_fmt", "yuv420p", "-crf", "18", "-preset", "medium",
                           "-c:a", "aac", "-b:a", "192k", "-shortest", "-movflags", "+faststart", out],
                          stdin=subprocess.PIPE)
    nframes = int(total * FPS) + 1
    for f in range(nframes):
        t = f / FPS
        si = next((i for i, (a, b) in enumerate(spans) if a <= t < b), len(spans) - 1)
        a, b = spans[si]
        lt, p = t - a, (t - a) / max(b - a, 1e-6)
        seg = segs[si]
        img = Image.new("RGB", (LW, LH))
        fx = getattr(scenes, seg["scene"])(img, lt, p, seg, t) or {}
        img = camera(img, 1.0 + seg.get("push", 0.06) * p + fx.get("zoom", 0), fx.get("shake", (0, 0)))
        if lt < 0.18 and si > 0:
            img = pixelate(img, 1 - lt / 0.18)
        img = post_fx(img, t)
        # current word, held until the next word starts so the screen is never empty
        cur = None
        for w0, w1, txt, wi in words:
            if w0 <= t + 0.03:
                cur = (txt, wi)
            else:
                break
        if cur and cur[1] == si:
            clean = cur[0].strip(".,!?:\"'").upper()
            col = GREEN if clean in highlight or any(c.isdigit() for c in clean) else CREAM
            caption(ImageDraw.Draw(img), cur[0], col)
        ff.stdin.write(img.resize((LW * SCALE, LH * SCALE), Image.NEAREST).tobytes())
    ff.stdin.close()
    ff.wait()
    print(f"{out}: {total:.1f}s, {nframes} frames")


if __name__ == "__main__":
    main(sys.argv[1])
