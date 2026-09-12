"""Quantize the unaltered p=.78 desktop screenshot to 16 RGB colours."""
from pathlib import Path
from PIL import Image
path = Path('/tmp/red-thread-evidence/desktop-K3.png')
image = Image.open(path).convert('RGB').quantize(colors=16, method=Image.Quantize.FASTOCTREE, dither=Image.Dither.NONE).convert('RGB')
print('1440 x 900 =', image.width * image.height, 'pixels; Pillow fast-octree, 16 RGB bins')
for count, rgb in sorted(image.getcolors(image.width * image.height), reverse=True):
    print(f'{count:8d}  rgb{rgb}  #{rgb[0]:02X}{rgb[1]:02X}{rgb[2]:02X}')
