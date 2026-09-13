"""Reference / delivered frame / unregistered 50% overlay. No best-fit alignment."""
import argparse
import json
from pathlib import Path
import importlib.util
import numpy as np
from PIL import Image, ImageDraw, ImageOps
from scipy.ndimage import distance_transform_edt, binary_erosion

ROOT = Path(__file__).resolve().parents[2]
DESIGN = ROOT / 'design/hero-world-within'
parser = argparse.ArgumentParser()
parser.add_argument('output', type=Path)
args = parser.parse_args()
spec = importlib.util.spec_from_file_location('compose', Path(__file__).with_name('compose-journey.py'))
compose = importlib.util.module_from_spec(spec)
spec.loader.exec_module(compose)
compose.prepare_fonts()
report = {'comparison': 'No registration, translation fit, or image warping to the rendered frame', 'keys': []}
keys = [(.08, 19, 'rt-word.png'), (.30, 72, 'pair-thread.png'), (.55, 132, 'rt-descent.png'), (.78, 187, 'rt-arrow.png'), (1., 240, None)]


def reference(name, source, size, p):
    canvas = Image.new('RGB', size, compose.BG)
    if source is None:
        canvas = Image.alpha_composite(canvas.convert('RGBA'), compose.copy_overlay(size, 1, {}, False)).convert('RGB')
        return canvas, 'Specified empty stage with Apps underline; no supplied raster'
    if name == '390' and p == .30: source = 'rt-k1-mobile.png'
    if name == '390' and p == .78: source = 'rt-k3-mobile.png'
    picture = Image.open(DESIGN / source).convert('RGB')
    picture = ImageOps.contain(picture, size, Image.Resampling.LANCZOS)
    x, y = (size[0]-picture.width)//2, (size[1]-picture.height)//2
    canvas.paste(picture, (x,y))
    return canvas, f'{source}; aspect-preserving contain; offset {x},{y}; size {picture.size}; phone K0/K2 crop not specified in §5'


def red_mask(image):
    a = np.asarray(image).astype(float)
    return (a[:,:,0] > a[:,:,1]*1.5) & (a[:,:,0] > a[:,:,2]*1.5) & (a[:,:,0] > 90)


for name, size in [('1440',(1440,900)), ('390',(390,844))]:
    destination = args.output / 'matches'
    destination.mkdir(exist_ok=True)
    for p, frame, source in keys:
        ref, mapping = reference(name, source, size, p)
        film = Image.open(args.output/name/'composed'/f'{frame:04d}.png').convert('RGB')
        art = Image.open(args.output/name/'raw'/f'{frame:04d}.png').convert('RGB')
        overlay = Image.blend(ref, film, .5)
        panel = Image.new('RGB', (size[0]*3, size[1]+68), 'white')
        draw = ImageDraw.Draw(panel)
        for i,(label,picture) in enumerate([('REFERENCE',ref),('FILM FRAME',film),('50% OVERLAY — NO REGISTRATION',overlay)]):
            panel.paste(picture,(i*size[0],68))
            draw.text((i*size[0]+12,12),label,font=compose.font(14,'mono'),fill=compose.INK)
            draw.text((i*size[0]+12,36),f'p target {p:.2f}; sampled {frame/240:.5f}',font=compose.font(12,'mono'),fill=compose.INK)
        filename=f'match-{name}-{p:.2f}.png'
        panel.save(destination/filename)
        entry={'viewport':name,'p':p,'sampledP':frame/240,'referenceMapping':mapping,'file':filename,'thresholdPx':.03*size[0]}
        if source:
            a,b=red_mask(ref),red_mask(art)
            a &= ~binary_erosion(a); b &= ~binary_erosion(b)
            if a.any() and b.any():
                distances=np.concatenate([distance_transform_edt(~b)[a],distance_transform_edt(~a)[b]])
                entry.update(cordEdgeMaxPx=float(distances.max()),cordEdgeP95Px=float(np.percentile(distances,95)),cordEdgePass=bool(distances.max()<=.03*size[0]))
            else: entry['cordEdgePass']=False
            entry['fullSilhouettePass']=False
            entry['status']='NOT PASSED — red-edge screen-space check only; globe/plane/tile silhouette proof outstanding'
        else:
            entry['endpointExact']=bool(np.array_equal(np.asarray(ref),np.asarray(film)))
        report['keys'].append(entry)
    # Vertical scan at unobstructed K0 cord centre: actual raster measurement.
    image=np.asarray(Image.open(args.output/name/'raw'/'0019.png'))
    mask=red_mask(Image.fromarray(image))
    column=mask[:,12]
    report[name+'CordWidthPx']=int(column.sum())
    print('K0 CORD RASTER WIDTH', name, int(column.sum()), 'px at x=12')
(args.output/'reference-match-report.json').write_text(json.dumps(report,indent=2))
print(json.dumps(report,indent=2))
