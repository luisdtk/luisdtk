"""Contact sheet of review stills, labelled with frame and seconds (30 fps)."""
import sys
from pathlib import Path
from PIL import Image, ImageDraw

src, out, cols = Path(sys.argv[1]), sys.argv[2], int(sys.argv[3])
frames = [int(f) for f in sys.argv[4:]]
W, H = 270, 480
rows = (len(frames) + cols - 1) // cols
sheet = Image.new("RGB", (cols * (W + 6), rows * (H + 6)), (60, 60, 60))
for i, f in enumerate(frames):
    im = Image.open(src / f"f{f}.png").convert("RGB").resize((W, H), Image.LANCZOS)
    d = ImageDraw.Draw(im)
    d.rectangle([0, 0, 92, 16], fill=(0, 0, 0))
    d.text((3, 3), f"{f} {f/30:.2f}s", fill=(255, 255, 0))
    sheet.paste(im, ((i % cols) * (W + 6), (i // cols) * (H + 6)))
sheet.save(out)
