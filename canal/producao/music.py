"""Original 8-bit suspense loop for How They Profit, synthesized from scratch (no samples, no copyright claims).

Usage: python3 music.py out.wav seconds
"""
import sys, wave
import numpy as np

SR = 44100
BPM = 112
STEP = 60 / BPM / 4  # one 16th note
# A minor suspense progression, one bar each: Am - F - Dm - E
CHORDS = [(57, 60, 64), (53, 57, 60), (50, 53, 57), (52, 56, 59)]


def hz(midi):
    return 440.0 * 2 ** ((midi - 69) / 12)


def pulse(freq, n, duty):
    ph = (np.arange(n) * freq / SR) % 1.0
    return np.where(ph < duty, 1.0, -1.0)


def env(n, attack=0.004, decay=0.12):
    t = np.arange(n) / SR
    return np.minimum(1.0, t / attack) * np.exp(-t / decay)


def kick(n):
    t = np.arange(n) / SR
    f = 45 + 110 * np.exp(-t * 30)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 9)


def noise(n, decay, rng):
    t = np.arange(n) / SR
    return rng.uniform(-1, 1, n) * np.exp(-t / decay)


def render(seconds):
    rng = np.random.default_rng(7)
    total = int(seconds * SR) + SR
    out = np.zeros(total)
    step_n = int(STEP * SR)
    steps = int(seconds / STEP) + 16
    for s in range(steps):
        i0 = s * step_n
        if i0 >= total:
            break
        bar, pos = divmod(s, 16)
        chord = CHORDS[bar % 4]
        seg = min(step_n * 2, total - i0)
        # arpeggio: 16ths up and down the chord, an octave up
        arp = [0, 1, 2, 1][pos % 4]
        note = chord[arp] + 12 + (12 if pos in (6, 14) else 0)
        out[i0:i0 + seg] += 0.10 * pulse(hz(note), seg, 0.125) * env(seg, decay=0.09)
        # bass: driving 8ths on the root
        if pos % 2 == 0:
            n = min(step_n * 2, total - i0)
            out[i0:i0 + n] += 0.16 * pulse(hz(chord[0] - 12), n, 0.25) * env(n, decay=0.16)
        # drums come in after the first bar so the hook stays clean
        if bar >= 1:
            if pos in (0, 8, 10):
                n = min(int(0.35 * SR), total - i0)
                out[i0:i0 + n] += 0.55 * kick(n)
            if pos in (4, 12):
                n = min(int(0.18 * SR), total - i0)
                out[i0:i0 + n] += 0.18 * noise(n, 0.05, rng)
            if pos % 2 == 1:
                n = min(int(0.04 * SR), total - i0)
                out[i0:i0 + n] += 0.05 * noise(n, 0.01, rng)
    out = out[:int(seconds * SR)]
    fade = int(0.4 * SR)
    out[-fade:] *= np.linspace(1, 0, fade)
    out /= max(1e-9, np.abs(out).max())
    return (out * 0.8 * 32767).astype(np.int16)


def write(path, seconds):
    data = render(seconds)
    with wave.open(path, "wb") as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes(data.tobytes())


if __name__ == "__main__":
    write(sys.argv[1], float(sys.argv[2]))
