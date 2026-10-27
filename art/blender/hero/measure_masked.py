"""On-screen colour of one material as the viewer sees it, in context.

  Blender -b --python art/blender/hero/measure_masked.py -- <all.png> <without.png>

The material's pixels are the ones that change when it is hidden (luma or chroma
step > 0.06); their median hue/saturation/value is read from <all.png>, so haze,
bloom and neighbours stay in the reading. Run from the repo root.
"""
import sys

import bpy
import numpy as np


def load(path):
    img = bpy.data.images.load(path)
    img.colorspace_settings.name = "Non-Color"  # the stored sRGB bytes as they are
    w, h = img.size
    return np.array(img.pixels[:], dtype=np.float32).reshape(h, w, 4)[:, :, :3]


full, without = (load(p) for p in sys.argv[sys.argv.index("--") + 1:][:2])
mask = np.abs(full - without).max(axis=2) > 0.06
px = full[mask]
mx, mn = px.max(1), px.min(1)
sat = np.where(mx > 0, (mx - mn) / np.maximum(mx, 1e-6), 0)
r, g, b = px.T
hue = np.degrees(np.arctan2(np.sqrt(3) * (g - b), 2 * r - g - b)) % 360
print(f"MASKED n={mask.sum()} hue={np.median(hue):.1f} sat={np.median(sat):.2f} val={np.median(mx):.2f}")
