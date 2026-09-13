"""Report film evidence without promoting render checks to device acceptance."""
import argparse
import colorsys
import json
from pathlib import Path

import numpy as np
from PIL import Image
from scipy.ndimage import binary_erosion

parser=argparse.ArgumentParser()
parser.add_argument('output',type=Path)
args=parser.parse_args()
root=args.output
report={'deviceStatus':'UNVERIFIED on device','population':{},'cordColour':{},'staging':{}}
geometry=json.loads((root/'geometry-audit.json').read_text())
staging=json.loads((root/'staging-preflight.json').read_text())
for name,expected in [('1440',70),('390',35)]:
    palette=json.loads((root/name/'population-ids'/'palette.json').read_text())
    rows=[]
    for frame in [171,180,187,216]:
        pixels=np.asarray(Image.open(root/name/'population-ids'/f'{frame:04d}.png').convert('RGB')).astype(int)
        counts={key:int((np.abs(pixels-np.array(colour)).max(axis=2)<=3).sum()) for key,colour in palette.items()}
        missing=[key for key,count in counts.items() if count==0]
        rows.append({'frame':frame,'p':frame/240,'visibleInstances':expected-len(missing),'missing':missing,'pixelCounts':counts})
    report['population'][name]={'expected':expected,'method':'unique RGB object IDs; at least one pixel within 3 RGB levels; depth occlusion respected; four samples only','samples':rows}
    print('VISIBLE POPULATION',name,[(r['p'],r['visibleInstances']) for r in rows],flush=True)
    colour_rows=[]
    for frame in [19,72,132,187]:
        ids=np.asarray(Image.open(root/name/'object-ids'/f'{frame:04d}.png').convert('RGB')).astype(int)
        mask=np.abs(ids-np.array([255,64,128])).max(axis=2)<=3
        mask=binary_erosion(mask)
        pixels=np.asarray(Image.open(root/name/'raw'/f'{frame:04d}.png').convert('RGB'))[mask]/255
        hsv=np.array([colorsys.rgb_to_hsv(*pixel) for pixel in pixels])
        if len(hsv):
            row={'frame':frame,'p':frame/240,'pixels':len(hsv),'meanSaturation':float(hsv[:,1].mean()),'meanValue':float(hsv[:,2].mean())}
            row['pass']=row['meanSaturation']>=.6 and row['meanValue']>=.6
        else:row={'frame':frame,'p':frame/240,'pixels':0,'pass':None}
        colour_rows.append(row)
    report['cordColour'][name]={'method':'eroded visible cord ID mask; four keyframes; not the runtime 40-frame centreline test','samples':colour_rows}
    print('CORD COLOUR',name,json.dumps(colour_rows),flush=True)
    candidates=geometry['viewports'][name]['nearCandidates']
    rows=[row for row in geometry['viewports'][name]['frames'] if not row['coveredByWhiteout'] and row['nearestCandidate']]
    nearest=min(rows,key=lambda row:row['nearestCandidate']['distance'])
    report['staging'][name]={'strictBoxViolationCount':len(staging[name]['overlapCandidates']),'deadAirCandidates':staging[name]['deadAirCandidates'],'nearCandidateCount':len(candidates),'nearestSample':nearest}
    print('STAGING',name,json.dumps(report['staging'][name]),flush=True)
(root/'film-evidence-summary.json').write_text(json.dumps(report,indent=2))
