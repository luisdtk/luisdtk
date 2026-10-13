"""The reel's single colour treatment: every manga image mapped from black through deep red and
Asta red to a pale red highlight, the way the red-sun Asta is coloured.

    from duotone import duotone; out = duotone(rgb_uint8)
"""

import numpy as np

STOPS = [(0.0, (8, 3, 4)), (0.3, (62, 5, 9)), (0.6, (196, 28, 32)), (0.85, (228, 44, 44)), (1.0, (240, 78, 70))]


def duotone(rgb: np.ndarray) -> np.ndarray:
    lum = (rgb[..., :3].astype(np.float32) @ np.array([0.299, 0.587, 0.114], np.float32)) / 255
    out = np.zeros(lum.shape + (3,), np.float32)
    for (p0, c0), (p1, c1) in zip(STOPS, STOPS[1:]):
        sel = (lum >= p0) & (lum <= p1)
        u = ((lum - p0) / (p1 - p0))[sel][:, None]
        out[sel] = np.array(c0, np.float32) + (np.array(c1, np.float32) - np.array(c0, np.float32)) * u
    return out.clip(0, 255).astype(np.uint8)
