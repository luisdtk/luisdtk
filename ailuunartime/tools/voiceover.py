"""Narration with Kokoro (Apache-2.0, kokoro-onnx), voice am_michael.

The script is used verbatim, one line per file, so each line can sit on its scene.

    # model files from github.com/thewh1teagle/kokoro-onnx/releases (model-files-v1.0)
    uv run --with kokoro-onnx --with soundfile python3 tools/voiceover.py <dir with kokoro-v1.0.onnx and voices-v1.0.bin>
    # then resample: ffmpeg -i vo-N.wav -ar 48000 -ac 2 public/audio/vo-N.wav
"""

import sys
from pathlib import Path

import soundfile as sf
from kokoro_onnx import Kokoro

LINES = [
    "Have you ever imagined reading manga like this?",
    "What if manga could move like anime?",
    "The AI era is here.",
]
VOICE = "am_michael"

models = Path(sys.argv[1] if len(sys.argv) > 1 else ".")
kokoro = Kokoro(str(models / "kokoro-v1.0.onnx"), str(models / "voices-v1.0.bin"))
for i, line in enumerate(LINES, 1):
    samples, rate = kokoro.create(line, voice=VOICE, speed=1.05, lang="en-us")
    sf.write(f"vo-{i}.wav", samples, rate)
    print(i, f"{len(samples) / rate:.2f}s", line)
