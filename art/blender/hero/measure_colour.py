"""Median on-screen hue/saturation/value of the caramel family, reference vs render.

  Blender -b --python art/blender/hero/measure_colour.py -- <image> [x0 y0 x1 y1]

Counts pixels with hue 10-50 deg, saturation > 0.35 and value > 0.25 (honey, amber,
caramel; excludes cream and chocolate). An optional rect (top-left origin, pixels)
restricts the sample, e.g. to one ribbon.
"""
import colorsys
import sys

import bpy
import numpy as np

args = sys.argv[sys.argv.index("--") + 1:]
img = bpy.data.images.load(args[0])
img.colorspace_settings.name = "Non-Color"  # read the stored sRGB bytes as they are
w, h = img.size
px = np.array(img.pixels[:], dtype=np.float32).reshape(h, w, 4)[::-1, :, :3]  # top row first
if len(args) == 5:
    x0, y0, x1, y1 = map(int, args[1:])
    px = px[y0:y1, x0:x1]
flat = px.reshape(-1, 3)
mx, mn = flat.max(1), flat.min(1)
sat = np.where(mx > 0, (mx - mn) / np.maximum(mx, 1e-6), 0)
r, g, b = flat.T
hue = np.degrees(np.arctan2(np.sqrt(3) * (g - b), 2 * r - g - b)) % 360
mask = (hue > 10) & (hue < 50) & (sat > 0.35) & (mx > 0.25)
n = int(mask.sum())
if n:
    print(f"COLOUR n={n} share={n / len(flat):.3f} hue={np.median(hue[mask]):.1f} sat={np.median(sat[mask]):.2f} val={np.median(mx[mask]):.2f}")
else:
    print("COLOUR n=0")
