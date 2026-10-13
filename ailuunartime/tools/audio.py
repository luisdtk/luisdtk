"""Synthesize every sound in the reel: the music bed and the effects.

Nothing is sampled or downloaded: each sound is built from sine waves and
filtered noise, so the whole soundtrack is original. Writes 48 kHz WAVs to
public/audio/ and the peak time of each effect to public/audio/sfx-peaks.json
(Remotion places each hit at cue - peak so the transient lands on the frame).

    uv run --with numpy python3 tools/audio.py
"""

import json
import wave
from pathlib import Path

import numpy as np

SR = 48000
OUT = Path(__file__).resolve().parent.parent / "public" / "audio"
rng = np.random.default_rng(11)

BPM = 120
BEAT = 60 / BPM
LENGTH = 19.5

# scene hits from src/reel/cues.ts (seconds)
SCENES = [2.0, 3.05, 5.25, 6.33, 7.17, 11.18, 13.84]
READER = (7.17, 11.18)
FINAL = 13.84


# ---------- building blocks ----------

def t_axis(seconds):
    return np.arange(int(seconds * SR)) / SR


def noise(seconds):
    return rng.standard_normal(int(seconds * SR))


def band(signal, low, high):
    """Brick-wall band-pass through the FFT (fine for short effects)."""
    spec = np.fft.rfft(signal)
    freqs = np.fft.rfftfreq(len(signal), 1 / SR)
    spec[(freqs < low) | (freqs > high)] = 0
    return np.fft.irfft(spec, len(signal))


def sweep_filter(signal, start_hz, end_hz, width=0.6, chunks=48):
    """A moving band-pass: the noise 'travels' from start_hz to end_hz."""
    out = np.zeros_like(signal)
    edges = np.linspace(0, len(signal), chunks + 1).astype(int)
    win = np.hanning(2 * (edges[1] - edges[0]) + 2)
    for i in range(chunks):
        a, b = edges[i], edges[i + 1]
        lo_i, hi_i = max(0, a - (b - a)), min(len(signal), b + (b - a))
        centre = start_hz * (end_hz / start_hz) ** (i / (chunks - 1))
        piece = band(signal[lo_i:hi_i], centre * (1 - width), centre * (1 + width))
        w = np.hanning(len(piece))
        out[lo_i:hi_i] += piece * w * 0.5
    return out


def env(seconds, attack, decay_power=3.0, hold=0.0):
    t = t_axis(seconds)
    rise = np.clip(t / max(attack, 1e-4), 0, 1)
    fall = np.clip(1 - (t - attack - hold) / max(seconds - attack - hold, 1e-4), 0, 1) ** decay_power
    fall[t < attack + hold] = 1
    return rise * fall


def sine_sweep(seconds, f0, f1, curve=2.0):
    t = t_axis(seconds)
    u = (t / seconds) ** (1 / curve)
    freq = f0 + (f1 - f0) * u
    return np.sin(2 * np.pi * np.cumsum(freq) / SR)


def reverb(signal, seconds=1.2, mix=0.25, tone=6000):
    tail = band(noise(seconds), 200, tone) * np.exp(-t_axis(seconds) * 5 / seconds)
    tail /= np.sqrt(np.sum(tail ** 2))
    n = len(signal) + len(tail)
    wet = np.fft.irfft(np.fft.rfft(signal, n) * np.fft.rfft(tail, n), n)
    dry = np.concatenate([signal, np.zeros(len(tail))])
    return dry * (1 - mix) + wet * mix * 3


def soft_clip(x, drive=1.5):
    return np.tanh(x * drive) / np.tanh(drive)


def normalise(x, peak=0.89):
    return x / (np.max(np.abs(x)) + 1e-9) * peak


def write(name, signal, peak=0.89):
    signal = normalise(signal, peak)
    fade = min(len(signal), int(0.004 * SR))
    signal[-fade:] *= np.linspace(1, 0, fade)
    stereo = np.repeat(signal[:, None], 2, axis=1)
    pcm = (np.clip(stereo, -1, 1) * 32767).astype(np.int16)
    with wave.open(str(OUT / f"{name}.wav"), "wb") as f:
        f.setnchannels(2)
        f.setsampwidth(2)
        f.setframerate(SR)
        f.writeframes(pcm.tobytes())
    return int(np.argmax(np.abs(signal))) / SR


# ---------- effects ----------

def impact(seconds=1.6, low=110, punch=1.0):
    boom = sine_sweep(seconds, low, 32, curve=0.35) * env(seconds, 0.003, 4)
    crack = band(noise(0.12), 1500, 9000) * env(0.12, 0.001, 6)
    body = band(noise(seconds), 40, 400) * env(seconds, 0.002, 7) * 0.6
    x = boom * 1.2 + body
    x[: len(crack)] += crack * 0.8 * punch
    return reverb(soft_clip(x, 2.2), 1.4, 0.22, 3000)


def slash(seconds=0.42):
    hiss = sweep_filter(noise(seconds), 9000, 1800, 0.5) * env(seconds, 0.06, 2)
    ring = (np.sin(2 * np.pi * 3150 * t_axis(seconds)) + 0.6 * np.sin(2 * np.pi * 4720 * t_axis(seconds)))
    ring *= env(seconds, 0.05, 5) * 0.18
    return reverb(hiss + ring, 0.6, 0.2, 9000)


def whoosh(seconds=0.55, f0=500, f1=3500, peak_at=0.65):
    t = t_axis(seconds)
    shape = np.exp(-((t / seconds - peak_at) ** 2) / 0.035)
    return sweep_filter(noise(seconds), f0, f1, 0.55) * shape


def shimmer(seconds=1.4):
    t = t_axis(seconds)
    x = np.zeros_like(t)
    for i, f in enumerate([2093, 2637, 3136, 3951, 4699]):
        start = i * 0.045
        e = np.clip((t - start) / 0.01, 0, 1) * np.exp(-np.clip(t - start, 0, None) * 4.5)
        x += np.sin(2 * np.pi * f * t) * e * (0.8 ** i)
    return reverb(x, 1.2, 0.35, 12000)


def energy(seconds=1.1):
    t = t_axis(seconds)
    saw = 2 * ((np.cumsum(70 + 260 * (t / seconds) ** 1.6) / SR) % 1) - 1
    crackle = band(noise(seconds), 2000, 9000) * (rng.random(len(t)) > 0.985) * 3
    hum = soft_clip(saw * 0.6, 3) * env(seconds, 0.25, 1.2, 0.4)
    x = band(hum, 60, 5000) + crackle * env(seconds, 0.1, 1.5)
    return reverb(x, 0.8, 0.2, 7000)


def pop(seconds=0.16, f0=780, f1=1320):
    blip = sine_sweep(seconds, f0, f1, 0.6) * env(seconds, 0.002, 5)
    click = band(noise(0.01), 3000, 12000) * env(0.01, 0.0005, 4)
    blip[: len(click)] += click * 0.4
    return reverb(blip, 0.3, 0.15, 9000)


def tick(seconds=0.06):
    x = band(noise(seconds), 2500, 11000) * env(seconds, 0.0005, 9)
    x += np.sin(2 * np.pi * 1900 * t_axis(seconds)) * env(seconds, 0.0005, 12) * 0.5
    return x


def riser(seconds=1.0):
    t = t_axis(seconds)
    x = sweep_filter(noise(seconds), 300, 7000, 0.4) * (t / seconds) ** 2.2
    x += sine_sweep(seconds, 180, 720, 1.0) * (t / seconds) ** 3 * 0.25
    return x


def final_hit():
    x = impact(2.6, 90, 1.3)
    sh = shimmer(1.6)
    n = max(len(x), len(sh))
    x = np.pad(x, (0, n - len(x))) + np.pad(sh, (0, n - len(sh))) * 0.35
    return x


# ---------- music bed (120 BPM, D minor, 15 s) ----------

def kick():
    s = 0.45
    return sine_sweep(s, 150, 42, 0.3) * env(s, 0.002, 5)


def taiko():
    s = 0.7
    body = sine_sweep(s, 120, 70, 0.5) * env(s, 0.002, 4)
    skin = band(noise(s), 150, 1200) * env(s, 0.001, 9) * 0.6
    return reverb(body + skin, 0.9, 0.25, 2500)


def hat():
    s = 0.07
    return band(noise(s), 7000, 15000) * env(s, 0.0005, 6)


def place(track, sound, at, gain=1.0):
    i = int(at * SR)
    if i >= len(track):
        return
    end = min(len(track), i + len(sound))
    track[i:end] += sound[: end - i] * gain


def music():
    n = int(LENGTH * SR)
    t = np.arange(n) / SR
    bed = np.zeros(n)

    # drone: D1 + A1 + D2, slowly breathing, cut short in the gaps
    d = 36.71
    drone = (np.sin(2 * np.pi * d * t) + 0.5 * np.sin(2 * np.pi * d * 1.5 * t) + 0.35 * np.sin(2 * np.pi * d * 2 * t + 0.4))
    drone *= 0.55 + 0.45 * np.sin(2 * np.pi * t / 4) ** 2
    pad = band(noise(LENGTH), 140, 900) * 0.08
    level = np.interp(t, [0, 0.3, 1.9, 2.0, FINAL - 0.1, FINAL, LENGTH - 0.8, LENGTH], [0.0, 0.5, 0.7, 1.0, 1.0, 0.85, 0.9, 0.0])
    bed += (drone * 0.35 + pad) * level

    # dark arpeggio (D minor: D F A C) on eighths from bar 2, softer under the reactions
    notes = [146.83, 174.61, 220.0, 261.63, 220.0, 174.61, 146.83, 130.81]
    for i, start in enumerate(np.arange(2.0, FINAL, BEAT / 2)):
        s = 0.22
        f = notes[i % len(notes)] * (2 if READER[0] <= start < READER[1] else 1)
        tone = (np.sin(2 * np.pi * f * t_axis(s)) + 0.3 * np.sin(2 * np.pi * f * 2 * t_axis(s))) * env(s, 0.004, 3)
        place(bed, tone, start, 0.12)

    # pulse: kick on every beat from 2 s, taiko accents on the scene hits
    for start in np.arange(2.0, FINAL, BEAT):
        place(bed, kick(), start, 0.55)
    for start in np.arange(READER[0], FINAL, BEAT / 2):
        place(bed, hat(), start + BEAT / 4, 0.12)
    for start in SCENES[:-1]:
        place(bed, taiko(), start, 0.5)

    # risers into the two big moments
    place(bed, riser(1.0), 1.0, 0.35)
    place(bed, riser(1.0), FINAL - 1.0, 0.4)

    # final: a slow pulse under the last lines, then one big chord that rings out
    for start in np.arange(FINAL, LENGTH - 1.0, BEAT * 2):
        place(bed, kick(), start, 0.35)
    s = 4.5
    chord = sum(np.sin(2 * np.pi * f * t_axis(s)) for f in (73.42, 110.0, 146.83, 174.61)) * env(s, 0.01, 2)
    place(bed, reverb(chord, 1.5, 0.35, 3000), FINAL, 0.35)

    bed = soft_clip(bed, 1.2)
    fade = int(0.6 * SR)
    bed[-fade:] *= np.linspace(1, 0, fade)
    return bed


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    effects = {
        "impact": impact(),
        "slash": slash(),
        "logo-hit": impact(1.4, 80, 0.6),
        "shimmer": shimmer(),
        "whoosh": whoosh(),
        "whoosh-heavy": whoosh(0.8, 200, 2200, 0.7),
        "swipe": whoosh(0.3, 1200, 6000, 0.6),
        "energy": energy(),
        "pop": pop(),
        "pop-low": pop(0.16, 560, 900),
        "tick": tick(),
        "riser": riser(),
        "final-hit": final_hit(),
    }
    peaks = {name: round(write(name, sound), 4) for name, sound in effects.items()}
    write("music-bed", music(), 0.8)
    (OUT / "sfx-peaks.json").write_text(json.dumps(peaks, indent=2) + "\n")
    print(json.dumps(peaks))


if __name__ == "__main__":
    main()
