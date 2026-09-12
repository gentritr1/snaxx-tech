"""Pair captured browser viewports with supplied artboards. Never edits source art."""
from pathlib import Path
import sys
from PIL import Image, ImageDraw, ImageFont, ImageOps

root = Path(sys.argv[1])
design = Path(sys.argv[2])
font_path = Path('/System/Library/Fonts/Supplemental/Arial.ttf')
font = ImageFont.truetype(str(font_path), 18) if font_path.exists() else ImageFont.load_default(size=18)

def pair(actual, reference, output, left_label, right_label):
    left = Image.open(actual).convert('RGB')
    right = Image.open(reference).convert('RGB')
    result = Image.new('RGB', (left.width + right.width, max(left.height, right.height) + 36), '#ffffff')
    result.paste(left, (0, 36))
    result.paste(right, (left.width, 36))
    draw = ImageDraw.Draw(result)
    draw.text((12, 9), left_label, font=font, fill='#2a2d38')
    draw.text((left.width + 12, 9), right_label, font=font, fill='#2a2d38')
    result.save(root / output)

for p in root.glob('*-raw.png'):
    if p.name.startswith('artboard'):
        if 'mobile' in p.name:
            Image.open(p).crop((0, 0, 390, 844)).save(str(p).replace('-raw', ''))
        continue
    width, height = (390, 844) if p.name.startswith('mobile') else (1440, 900)
    im = Image.open(p)
    assert im.width >= width and im.height >= height + 42, (p, im.size)
    im.crop((0, 42, width, height + 42)).save(str(p).replace('-raw', ''))

for i in range(5):
    pair(root/f'desktop-K{i}.png', root/f'artboard-K{i}-raw.png', f'desktop-K{i}-comparison.png',
         f'Browser K{i} / 1440 x 900 / UNVERIFIED on device', f'Supplied canvas K{i}')
for i in [0, 1, 3]:
    pair(root/f'mobile-K{i}.png', root/f'artboard-mobile-K{i}.png', f'mobile-K{i}-comparison.png',
         f'Browser K{i} / UNVERIFIED on device', f'Supplied mobile K{i}')
for i in [2, 4]:
    reference = ImageOps.contain(Image.open(root/f'artboard-K{i}-raw.png'), (390, 844))
    reference.save(root/f'reference-desktop-K{i}-scaled.png')
    pair(root/f'mobile-K{i}.png', root/f'reference-desktop-K{i}-scaled.png', f'mobile-K{i}-comparison.png',
         f'Browser K{i} / UNVERIFIED on device', f'Desktop K{i}; no mobile board supplied')
pair(root/'reduced-motion.png', root/'artboard-reduced-raw.png', 'reduced-comparison.png',
     'Native reduced motion / 1440 x 900 / UNVERIFIED on device', 'Supplied reduced-motion canvas')
for key, source in [('K1','pair-thread.png'), ('K3','rt-arrow.png')]:
    ref = ImageOps.contain(Image.open(design/source), (1440,900))
    ref.save(root/f'photo-reference-{key}.png')
    pair(root/f'desktop-{key}.png', root/f'photo-reference-{key}.png', f'photo-{key}-comparison.png',
         f'Runtime {key} / UNVERIFIED on device', f'Supplied {source}')
pair('/tmp/red-thread-blender-k1.png', root/'photo-reference-K1.png', 'blender-K1-comparison.png',
     'Authored Blender K1 / Eevee render', 'Supplied pair-thread.png')
print('Wrote 10 keyframe pairs, reduced still pair, 2 photo pairs, and Blender K1 pair.')
