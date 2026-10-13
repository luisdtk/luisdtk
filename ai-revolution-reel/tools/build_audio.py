"""Builds every audio asset the reel uses.

Usage:
  python tools/build_audio.py <voice.mp3> <effects.mp3>

Outputs (in public/audio):
  voice.wav      the ElevenLabs narration with pauses tightened and a 1.05x
                 tempo so it fits the 59 s limit, compressed and loudness-normalised
  music.wav      original procedural score (120 BPM, A minor) following the scene
                 structure in src/timeline.json, ducked under the narration
  sfx/*.wav      synthesised impacts, whooshes, glitches, clicks, risers …
  user/*.wav     individual sounds sliced from the supplied effects track
"""
import json
import os
import re
import subprocess
import sys

import numpy as np
import soundfile as sf

SR = 48000
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "public", "audio")
TL = json.load(open(os.path.join(ROOT, "src", "timeline.json")))
TOTAL = TL["durationInFrames"] / TL["fps"]
rng = np.random.default_rng(7)


def ff_decode(path, channels):
    raw = subprocess.run(
        ["ffmpeg", "-v", "error", "-i", path, "-f", "f32le", "-ac", str(channels), "-ar", str(SR), "-"],
        capture_output=True, check=True,
    ).stdout
    return np.frombuffer(raw, dtype=np.float32).reshape(-1, channels).copy()


def silences(path, noise="-35dB", dur=0.25):
    log = subprocess.run(
        ["ffmpeg", "-i", path, "-af", f"silencedetect=n={noise}:d={dur}", "-f", "null", "-"],
        capture_output=True, text=True,
    ).stderr
    st = [float(x) for x in re.findall(r"silence_start: ([\d.]+)", log)]
    en = [float(x) for x in re.findall(r"silence_end: ([\d.]+)", log)]
    return list(zip(st, en))


def write(name, x):
    path = os.path.join(OUT, name)
    os.makedirs(os.path.dirname(path), exist_ok=True)
    sf.write(path, np.clip(x, -1, 1).astype(np.float32), SR, subtype="PCM_16")


# ---------------------------------------------------------------- voice
def build_voice(src):
    a = ff_decode(src, 1)[:, 0]
    keep = 0.13
    parts, pos = [], 0.0
    for s, e in silences(src):
        if e - keep <= s + keep:
            continue
        parts.append(a[int(pos * SR):int((s + keep) * SR)])
        pos = e - keep
    parts.append(a[int(pos * SR):])
    f = int(0.008 * SR)
    for p in parts:
        p[:f] *= np.linspace(0, 1, f)
        p[-f:] *= np.linspace(1, 0, f)
    tmp = os.path.join(OUT, "_voice_tight.wav")
    sf.write(tmp, np.concatenate(parts), SR)
    subprocess.run([
        "ffmpeg", "-v", "error", "-y", "-i", tmp, "-af",
        "atempo=1.05,highpass=f=70,acompressor=threshold=-20dB:ratio=3:attack=5:release=80,"
        "loudnorm=I=-16:TP=-1.5:LRA=7",
        "-ar", str(SR), "-ac", "1", os.path.join(OUT, "voice.wav"),
    ], check=True)
    os.remove(tmp)


# ---------------------------------------------------------------- user effects
# Sounds sliced from the supplied effects track, by start/end second and role.
USER_SLICES = {
    "boom_a": (0.48, 1.20),
    "low_hit": (1.27, 1.70),
    "tick_hi": (2.00, 2.30),
    "glitch_run": (3.29, 6.40),
    "riser_low": (7.85, 10.50),
    "tick_a": (11.36, 11.52),
    "tick_b": (12.29, 12.45),
    "data_burst": (14.50, 15.50),
    "boom_b": (15.89, 16.80),
    "digital_burst": (18.62, 19.72),
    "riser_hit": (21.17, 25.30),
    "swish_hi": (25.84, 26.20),
    "processing": (29.08, 30.96),
    "click_a": (32.50, 32.76),
    "click_b": (32.92, 33.14),
    "shimmer": (37.14, 39.32),
    "whoosh_mid": (39.50, 40.50),
    "typing": (46.28, 48.80),
    "scatter": (50.23, 51.70),
    "final_swell": (52.22, 55.90),
}


def build_user_fx(src):
    a = ff_decode(src, 2)
    for name, (s, e) in USER_SLICES.items():
        x = a[int(s * SR):int(e * SR)].copy()
        f = int(0.006 * SR)
        x[:f] *= np.linspace(0, 1, f)[:, None]
        x[-f * 4:] *= np.linspace(1, 0, f * 4)[:, None]
        write(f"user/{name}.wav", norm(x, 0.7))


# ---------------------------------------------------------------- dsp helpers
def t_axis(d):
    return np.arange(int(d * SR)) / SR


def onepole_lp(x, cutoff):
    """One-pole low-pass; cutoff may be an array (time-varying)."""
    cutoff = np.broadcast_to(np.asarray(cutoff, dtype=np.float64), x.shape)
    a = np.exp(-2 * np.pi * cutoff / SR)
    y = np.empty_like(x)
    acc = 0.0
    for i in range(len(x)):
        acc = (1 - a[i]) * x[i] + a[i] * acc
        y[i] = acc
    return y


def lp(x, cutoff, order=2):
    for _ in range(order):
        x = onepole_lp(x, cutoff)
    return x


def fast_lp(x, cutoff):
    """Static low-pass via FFT brick-wall with soft knee (fast for long buffers)."""
    X = np.fft.rfft(x)
    f = np.fft.rfftfreq(len(x), 1 / SR)
    X *= 1 / (1 + (f / cutoff) ** 4)
    return np.fft.irfft(X, len(x))


def fast_hp(x, cutoff):
    X = np.fft.rfft(x)
    f = np.fft.rfftfreq(len(x), 1 / SR)
    X *= 1 / (1 + (cutoff / np.maximum(f, 1)) ** 4)
    return np.fft.irfft(X, len(x))


def bandnoise(d, lo, hi):
    n = rng.standard_normal(int(d * SR))
    return fast_hp(fast_lp(n, hi), lo)


def saw(freq, t, detune=0.0):
    ph = (freq * (1 + detune)) * t
    return 2 * (ph - np.floor(ph + 0.5))


def env_adsr(n, a, d, s, r, sustain_len):
    a, d, r = int(a * SR), int(d * SR), int(r * SR)
    sl = max(int(sustain_len * SR), 0)
    e = np.concatenate([
        np.linspace(0, 1, max(a, 1)), np.linspace(1, s, max(d, 1)),
        np.full(sl, s), np.linspace(s, 0, max(r, 1)),
    ])
    return np.pad(e, (0, max(0, n - len(e))))[:n]


def stereo(x, width=0.0):
    if x.ndim == 2:
        return x
    if width == 0:
        return np.stack([x, x], 1)
    d = int(0.012 * SR)
    r = np.concatenate([np.zeros(d), x[:-d]])
    return np.stack([x, x * (1 - width) + r * width], 1)


def norm(x, peak=0.9):
    m = np.abs(x).max()
    return x * (peak / m) if m > 0 else x


# ---------------------------------------------------------------- synth sfx
def sfx_impact(big=False):
    d = 2.6 if big else 1.6
    t = t_axis(d)
    f = 30 + 90 * np.exp(-t * (9 if big else 14))
    body = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * (1.6 if big else 2.6))
    crack = bandnoise(d, 300, 7000) * np.exp(-t * 28)
    tail = bandnoise(d, 80, 1200) * np.exp(-t * 3.0) * 0.25
    x = np.tanh(1.8 * body) + 0.55 * crack + tail
    return stereo(norm(x, 0.95), 0.35)


def sfx_whoosh(d=0.7, up=True):
    t = t_axis(d)
    n = rng.standard_normal(len(t))
    pos = t / d
    shape = np.sin(np.pi * pos) ** 2
    cutoff = 400 + 7000 * (pos if up else 1 - pos) ** 1.4
    x = lp(n, cutoff, 2) * shape
    pan = np.sin(np.pi * pos)
    return norm(np.stack([x * (1 - 0.5 * pan), x * (0.5 + 0.5 * pan)], 1), 0.8)


def sfx_glitch(d=0.45):
    t = t_axis(d)
    x = np.zeros_like(t)
    seg = int(0.03 * SR)
    for i in range(0, len(t), seg):
        kind = rng.integers(0, 4)
        tt = t[i:i + seg]
        if kind == 0:
            x[i:i + seg] = np.sign(np.sin(2 * np.pi * rng.uniform(200, 3000) * tt))
        elif kind == 1:
            x[i:i + seg] = rng.standard_normal(len(tt))
        elif kind == 2:
            x[i:i + seg] = np.round(np.sin(2 * np.pi * rng.uniform(60, 400) * tt) * 3) / 3
    x *= np.exp(-t * 3)
    return stereo(norm(x, 0.55), 0.6)


def sfx_click(freq=2400):
    t = t_axis(0.06)
    x = np.sin(2 * np.pi * freq * t) * np.exp(-t * 120) + 0.3 * rng.standard_normal(len(t)) * np.exp(-t * 300)
    return stereo(norm(x, 0.6))


def sfx_keys(d=1.6, rate=11):
    t = t_axis(d)
    x = np.zeros_like(t)
    tt = 0.0
    while tt < d - 0.05:
        i = int(tt * SR)
        k = t_axis(0.035)
        click = bandnoise(0.035, 1500, 9000) * np.exp(-k * 160) + np.sin(2 * np.pi * rng.uniform(180, 320) * k) * np.exp(-k * 90) * 0.5
        x[i:i + len(k)] += click[: len(x) - i] * rng.uniform(0.5, 1.0)
        tt += rng.uniform(0.6, 1.4) / rate
    return stereo(norm(x, 0.5), 0.3)


def sfx_riser(d=2.0):
    t = t_axis(d)
    pos = t / d
    n = rng.standard_normal(len(t))
    cutoff = 200 + 9000 * pos ** 2.2
    x = lp(n, cutoff, 2) * pos ** 1.8
    f = 110 * 2 ** (pos * 2.5)
    tone = saw(1, np.cumsum(f) / SR) * 0.25 * pos ** 2
    return stereo(norm(x + fast_lp(tone, 4000), 0.75), 0.5)


def sfx_portal():
    d = 1.8
    t = t_axis(d)
    pos = t / d
    wob = np.sin(2 * np.pi * (3 + 9 * pos) * t)
    f = 90 + 60 * wob + 400 * pos ** 2
    tone = np.sin(2 * np.pi * np.cumsum(f) / SR)
    shim = bandnoise(d, 2000, 9000) * (0.5 + 0.5 * wob) * 0.4
    x = (tone + shim) * np.sin(np.pi * pos) ** 0.6
    return stereo(norm(x, 0.7), 0.7)


def sfx_pulse():
    t = t_axis(0.5)
    x = np.sin(2 * np.pi * 55 * t) * np.exp(-t * 8) + 0.4 * np.sin(2 * np.pi * 880 * t) * np.exp(-t * 30)
    return stereo(norm(x, 0.7))


def sfx_shimmer(d=2.5):
    t = t_axis(d)
    x = np.zeros_like(t)
    for k, f in enumerate([1760, 2217, 2637, 3520, 4434]):
        x += np.sin(2 * np.pi * f * t + k) * np.sin(np.pi * np.clip(t / d * 1.2 - k * 0.04, 0, 1)) ** 2
    x *= 0.6 + 0.4 * np.sin(2 * np.pi * 7 * t)
    return stereo(norm(x, 0.35), 0.8)


def sfx_freeze():
    t = t_axis(0.4)
    tape = np.sin(2 * np.pi * np.cumsum(400 * np.exp(-t * 9)) / SR) * np.exp(-t * 4)
    return stereo(norm(tape + 0.3 * sfx_glitch(0.4)[:, 0], 0.6), 0.4)


def build_sfx():
    write("sfx/impact.wav", sfx_impact())
    write("sfx/impact_big.wav", sfx_impact(big=True))
    write("sfx/whoosh.wav", sfx_whoosh(0.7))
    write("sfx/whoosh_short.wav", sfx_whoosh(0.35))
    write("sfx/whoosh_down.wav", sfx_whoosh(0.6, up=False))
    write("sfx/glitch.wav", sfx_glitch())
    write("sfx/glitch_long.wav", sfx_glitch(0.9))
    write("sfx/click.wav", sfx_click())
    write("sfx/click_low.wav", sfx_click(1300))
    write("sfx/keys.wav", sfx_keys())
    write("sfx/riser_2s.wav", sfx_riser(2.0))
    write("sfx/riser_4s.wav", sfx_riser(4.0))
    write("sfx/portal.wav", sfx_portal())
    write("sfx/pulse.wav", sfx_pulse())
    write("sfx/shimmer.wav", sfx_shimmer())
    write("sfx/freeze.wav", sfx_freeze())


# ---------------------------------------------------------------- music
BPM = 120
BEAT = 60 / BPM
A = 110.0
# A minor: Am – F – C – G, one chord per bar (2 s)
CHORDS = [[0, 3, 7], [-4, 0, 3], [3, 7, 10], [-2, 2, 5]]
ROOTS = [0, -4, 3, -2]


def semis(n):
    return 2 ** (n / 12)


# energy per section: (start, end, kick, bass, hats, arp, pad, clap)
SECTIONS = [
    (0.0, 4.43, 0, 1, 0, 0, 1, 0),
    (4.43, 13.13, 1, 1, 1, 0, 1, 0),
    (13.13, 20.63, 1, 1, 2, 1, 1, 1),
    (20.63, 26.6, 0, 1, 1, 1, 1, 0),
    (26.6, 28.6, 0, 0, 1, 0, 1, 0),
    (28.6, 29.5, 0, 0, 0, 0, 0, 0),
    (29.5, 33.4, 2, 1, 0, 0, 1, 0),
    (33.4, 39.6, 1, 1, 2, 1, 1, 1),
    (39.6, 47.47, 1, 1, 2, 1, 1, 1),
    (47.47, 51.07, 2, 1, 1, 1, 1, 0),
    (51.07, 54.07, 0, 0, 0, 1, 1, 0),
    (54.07, 56.4, 1, 1, 2, 1, 1, 1),
    (56.4, TOTAL, 0, 0, 0, 0, 1, 0),
]


def section_at(t):
    for s in SECTIONS:
        if s[0] <= t < s[1]:
            return s
    return SECTIONS[-1]


def kick():
    t = t_axis(0.45)
    f = 45 + 120 * np.exp(-t * 35)
    return np.tanh(2.2 * np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 7))


def hat(open_=False):
    d = 0.25 if open_ else 0.05
    t = t_axis(d)
    return bandnoise(d, 7000, 16000) * np.exp(-t * (14 if open_ else 90))


def clap():
    t = t_axis(0.3)
    n = bandnoise(0.3, 900, 5000)
    e = np.exp(-t * 18) + 0.6 * np.exp(-np.maximum(t - 0.012, 0) * 30) * (t > 0.012)
    return n * e


def build_music():
    n = int(TOTAL * SR)
    drums = np.zeros(n)
    bass = np.zeros(n)
    arp = np.zeros(n)
    pad = np.zeros((n, 2))
    K, H, HO, C = kick(), hat(), hat(True), clap()

    def add(buf, x, t0, g=1.0):
        i = int(t0 * SR)
        if i >= n:
            return
        m = min(len(x), n - i)
        buf[i:i + m] += x[:m] * g

    # drums + bass + arp on a 16th grid
    step = BEAT / 4
    for k in range(int(TOTAL / step)):
        t0 = k * step
        s = section_at(t0)
        _, _, kk, bb, hh, aa, _, cc = s
        sixteenth = k % 16
        bar = int(t0 // (BEAT * 4))
        ci = bar % 4
        if kk == 1 and sixteenth % 4 == 0:
            add(drums, K, t0, 1.0)
        if kk == 2 and sixteenth in (0, 8):  # half-time heartbeat
            add(drums, K, t0, 0.8)
        if cc and sixteenth in (4, 12):
            add(drums, C, t0, 0.45)
        if hh == 1 and sixteenth % 4 == 2:
            add(drums, H, t0, 0.35)
        if hh == 2:
            add(drums, HO if sixteenth % 4 == 2 else H, t0, 0.3 if sixteenth % 4 == 2 else 0.18)
        if bb and sixteenth % 2 == 0 and sixteenth % 4 != 0:
            d = step * 1.6
            tt = t_axis(d)
            f = A / 2 * semis(ROOTS[ci])
            note = (saw(f, tt) + 0.6 * saw(f, tt, 0.006)) * env_adsr(len(tt), 0.004, 0.1, 0.6, 0.06, d - 0.2)
            add(bass, note, t0, 0.5)
        if aa:
            ch = CHORDS[ci]
            pattern = [0, 1, 2, 1, 0, 2, 1, 2]
            iv = ch[pattern[sixteenth % 8]] + (12 if sixteenth % 16 >= 8 else 0)
            tt = t_axis(step * 0.9)
            f = A * 2 * semis(iv)
            sq = np.sign(np.sin(2 * np.pi * f * tt)) * 0.5 + np.sin(2 * np.pi * f * 2 * tt) * 0.3
            add(arp, sq * np.exp(-tt * 18), t0, 0.22)

    # pads: one sustained chord per bar, crossfaded
    bar_d = BEAT * 4
    for b in range(int(TOTAL / bar_d) + 1):
        t0 = b * bar_d
        if not section_at(t0 + 0.01)[6] and not section_at(t0 + bar_d * 0.5)[6]:
            continue
        ci = b % 4
        tt = t_axis(bar_d + 0.6)
        x = np.zeros(len(tt))
        for iv in CHORDS[ci]:
            f = A * semis(iv)
            x += saw(f, tt, -0.004) + saw(f, tt, 0.004) + 0.5 * saw(f * 2, tt, 0.002)
        e = env_adsr(len(tt), 0.35, 0.3, 0.8, 0.6, bar_d - 0.6)
        add(pad[:, 0], x * e, t0, 0.05)
        add(pad[:, 1], np.roll(x, 300) * e, t0, 0.05)
    pad = np.stack([fast_lp(pad[:, 0], 2400), fast_lp(pad[:, 1], 2400)], 1)

    bass = fast_lp(bass, 900)
    arp = fast_hp(arp, 300)

    # editor section filters the arp; brand section keeps only pad + soft arp
    tline = np.arange(n) / SR
    arp_gain = np.ones(n)
    arp_gain[(tline > 20.63) & (tline < 26.6)] = 0.45
    arp_gain[(tline > 51.07) & (tline < 54.07)] = 0.35
    arp *= arp_gain

    mix = stereo(drums) * 0.9 + stereo(bass, 0.1) * 0.8 + stereo(arp, 0.6) * 0.9 + pad * 1.1

    # sub-drop + build risers baked into the score
    def add_st(x, t0, g):
        i = int(t0 * SR)
        m = min(len(x), n - i)
        mix[i:i + m] += x[:m] * g

    add_st(sfx_riser(4.0), 0.43, 0.25)
    add_st(sfx_riser(2.0), 26.6, 0.3)
    add_st(sfx_riser(4.0), 35.6, 0.18)
    add_st(sfx_riser(2.0), 45.47, 0.2)
    add_st(sfx_riser(4.0), 47.07, 0.22)
    add_st(sfx_riser(2.0), 52.07, 0.25)

    mix = norm(mix, 0.7)

    # duck under the narration (offline sidechain from the phrase list)
    duck = np.ones(n)
    for p in TL["phrases"]:
        s, e = p["start"] - 0.08, p["end"] + 0.15
        duck[int(s * SR):int(e * SR)] = 0.42
    kernel = np.hanning(int(0.25 * SR))
    kernel /= kernel.sum()
    duck = np.convolve(duck, kernel, mode="same")
    mix *= duck[:, None]

    # musical drop before "Right now…" and fade-out at the end
    fade = np.ones(n)
    drop = (tline > 28.45) & (tline < 29.5)
    fade[drop] = 0.12
    fade = np.convolve(fade, np.hanning(int(0.08 * SR)) / np.hanning(int(0.08 * SR)).sum(), mode="same")
    fade *= np.clip((TOTAL - tline) / 2.2, 0, 1) ** 1.5
    fade *= np.clip(tline / 0.05, 0, 1)
    mix *= fade[:, None]
    write("music.wav", mix)


if __name__ == "__main__":
    voice_src, fx_src = sys.argv[1], sys.argv[2]
    os.makedirs(OUT, exist_ok=True)
    build_voice(voice_src)
    build_user_fx(fx_src)
    build_sfx()
    build_music()
    print("audio assets written to", OUT)
