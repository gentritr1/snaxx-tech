"""Compose only captured browser pixels; no alignment, warping, or replacement art."""
import json, sys, colorsys
from pathlib import Path
import numpy as np
from PIL import Image, ImageDraw, ImageFont, ImageOps
from scipy.ndimage import distance_transform_edt, binary_erosion
ROOT=Path(__file__).resolve().parents[2]
DESIGN=ROOT/'design/hero-world-within'
OUT=Path(sys.argv[1]) if len(sys.argv)>1 else DESIGN/'journey-v33-runtime/evidence'
FONT=ImageFont.truetype('/System/Library/Fonts/Menlo.ttc',14)
BG='#FEFBF8'
report={'method':'Runtime browser viewport captures; UNVERIFIED on device','referenceRegistration':'None; contain only, except previously prescribed phone Word crop','viewports':{}}
def intersects(a,b):return a[2]>a[0] and a[3]>a[1] and b[2]>b[0] and b[3]>b[1] and a[0]<b[2] and a[2]>b[0] and a[1]<b[3] and a[3]>b[1]
def red(im):
 a=np.asarray(im).astype(float);return (a[:,:,0]>90)&(a[:,:,0]>1.5*a[:,:,1])&(a[:,:,0]>1.5*a[:,:,2])
def reference(v,p,size):
 name={.08:'rt-word.png',.3:'pair-thread.png',.55:'rt-descent.png',.78:'rt-arrow.png',1:None}[p]
 if v=='390' and p==.3:name='rt-k1-mobile.png'
 if v=='390' and p==.78:name='rt-k3-mobile.png'
 if name is None:
  return Image.open(DESIGN/'journey-v32-claude'/v/'composed/0240.png').convert('RGB'),'Authored endpoint; no supplied named raster reference'
 src=Image.open(DESIGN/name).convert('RGB');canvas=Image.new('RGB',size,BG)
 if v=='390' and p==.08:
  src=src.resize((524,round(src.height*.39)),Image.Resampling.LANCZOS);canvas.paste(src,(-67,146));return canvas,name+'; previously prescribed .39 phone crop, offset -67,146'
 src=ImageOps.contain(src,size,Image.Resampling.LANCZOS);canvas.paste(src,((size[0]-src.width)//2,(size[1]-src.height)//2));return canvas,name+'; aspect-preserving contain'
for v,size in [('1440',(1440,900)),('390',(390,844))]:
 folder=OUT/v
 if not (folder/'frame-39.png').exists():continue
 w,h=size;thumb=(360,225) if v=='1440' else (195,422)
 sheet=Image.new('RGB',(8*thumb[0],5*(thumb[1]+24)+38),'white');draw=ImageDraw.Draw(sheet)
 draw.text((10,10),f'RUNTIME {w} x {h} — UNVERIFIED on device',font=FONT,fill='#222')
 results={'copyExclusivityViolations':[],'strictBoxViolations':[],'deadAirCandidates':[],'cordSamples':[],'cordSamplingUnavailable':[],'keys':[],'silhouetteIDPass':'NOT CERTIFIED: Globe_Inner and Graticule require the occlusion-aware ID pass'}
 for i in range(40):
  p=i*.025;im=Image.open(folder/f'frame-{i:02}.png').convert('RGB');audit=json.loads((folder/f'frame-{i:02}.json').read_text());geo=audit['geometry']
  x=(i%8)*thumb[0];y=38+(i//8)*(thumb[1]+24);sheet.paste(im.resize(thumb,Image.Resampling.LANCZOS),(x,y+24));draw.text((x+6,y+4),f'p {p:.3f}',font=FONT,fill='#222')
  active=[b['act'] for b in audit['blocks'] if float(b['opacity'])>.02]
  if len(active)>1:results['copyExclusivityViolations'].append({'p':p,'acts':active})
  for act in active:
   zone=geo['zones'][act]
   for o in geo['objects']:
    if o['name'] not in ['Globe_Inner','Graticule'] and intersects(o['box'],zone):results['strictBoxViolations'].append({'p':p,'act':act,'object':o['name'],'box':o['box'],'crossesCameraClip':o['crossesCameraClip'],'overlapWidthPx':min(o['box'][2],zone[2])-max(o['box'][0],zone[0]),'overlapHeightPx':min(o['box'][3],zone[3])-max(o['box'][1],zone[1])})
  if .2<=p<=.9 and not any(intersects(o['box'],[0,h/3,w,2*h/3]) for o in geo['objects']):results['deadAirCandidates'].append(p)
  rgb=np.asarray(im);samples=[]
  for x,y in geo['cord']:
   if y<80 or x>w-34:continue
   pixel=rgb[min(h-1,round(y)),min(w-1,round(x))]/255
   hue,sat,val=colorsys.rgb_to_hsv(*pixel)
   # Occluded cord centres and DOM pixels do not count as visible cord.
   if (hue<.08 or hue>.94) and sat>.3 and val>.1 and not any(intersects([x,y,x+1,y+1], [b['rect']['x'],b['rect']['y'],b['rect']['x']+b['rect']['width'],b['rect']['y']+b['rect']['height']]) for b in audit['blocks'] if float(b['opacity'])>.02):samples.append((sat,val))
  if samples:
   values=np.array(samples);results['cordSamples'].append({'p':p,'count':len(samples),'meanS':float(values[:,0].mean()),'meanV':float(values[:,1].mean()),'minS':float(values[:,0].min()),'minV':float(values[:,1].min())})
  else:results['cordSamplingUnavailable'].append({'p':p,'count':0,'meanS':None,'meanV':None,'reason':'No qualifying visible centreline samples; cannot certify colour'})
 sheet.save(OUT/f'contact-sheet-{v}.png')
 for p in [.08,.3,.55,.78,1.]:
  delivered=Image.open(folder/f'key-{p:.2f}.png').convert('RGB');ref,mapping=reference(v,p,size)
  panel=Image.new('RGB',(w*3,h+56),'white');d=ImageDraw.Draw(panel)
  for col,(label,picture) in enumerate([('REFERENCE',ref),('RUNTIME',delivered),('50% OVERLAY — NO ALIGNMENT',Image.blend(ref,delivered,.5))]):
   panel.paste(picture,(col*w,56));d.text((col*w+10,8),label,font=FONT,fill='#222');d.text((col*w+10,30),f'p {p:.2f} — UNVERIFIED on device',font=FONT,fill='#222')
  panel.save(OUT/f'match-{v}-{p:.2f}.png')
  # Additional provenance comparison, distinct from the named-reference gate.
  # Blender has only 24 fps frames, so disclose the nearest authored p.
  frame=round(p*240);staged=Image.open(DESIGN/'journey-v32-claude'/v/'composed'/f'{frame:04}.png').convert('RGB')
  film_panel=Image.new('RGB',(w*3,h+56),'white');fd=ImageDraw.Draw(film_panel)
  for col,(label,picture) in enumerate([('STAGED CYCLES',staged),('RUNTIME',delivered),('50% OVERLAY — NO ALIGNMENT',Image.blend(staged,delivered,.5))]):
   film_panel.paste(picture,(col*w,56));fd.text((col*w+10,8),label,font=FONT,fill='#222');fd.text((col*w+10,30),f'film p {frame/240:.5f} / runtime {p:.2f}; UNVERIFIED on device',font=FONT,fill='#222')
  film_panel.save(OUT/f'port-{v}-{p:.2f}.png')
  entry={'p':p,'reference':mapping,'thresholdPx':w*.03}
  if p<1:
   a,b=red(ref),red(delivered)
   # Remove runtime DOM elements from the art comparison, not from the delivered panel.
   audit=json.loads((folder/f'key-{p:.2f}.json').read_text());b[:80,:]=False;b[:,w-34:]=False
   for block in audit['blocks']:
    if float(block['opacity'])<=.02:continue
    r=block['rect'];x0=max(0,int(r['x']));y0=max(0,int(r['y']));x1=min(w,int(r['x']+r['width']+1));y1=min(h,int(r['y']+r['height']+1));b[y0:y1,x0:x1]=False
   a &= ~binary_erosion(a);b &= ~binary_erosion(b)
   if a.any() and b.any():
    distances=np.r_[distance_transform_edt(~b)[a],distance_transform_edt(~a)[b]]
    entry.update(redArtworkMaxPx=float(distances.max()),redArtworkP95Px=float(np.percentile(distances,95)),redArtworkPass=bool(distances.max()<=w*.03))
   entry['fullSilhouettePass']=False if not entry.get('redArtworkPass') else None
  results['keys'].append(entry)
 # A shareable, reproducible 16x16x16 RGB histogram of the five actual runtime keys.
 histogram=np.zeros((16,16,16),dtype=np.int64)
 for p in [.08,.3,.55,.78,1.]:
  rgb=np.asarray(Image.open(folder/f'key-{p:.2f}.png').convert('RGB')).reshape(-1,3)
  histogram+=np.histogramdd(rgb,bins=(16,16,16),range=((0,256),)*3)[0].astype(np.int64)
 (OUT/f'colour-histogram-{v}.json').write_text(json.dumps({'binsPerChannel':16,'pixels':int(histogram.sum()),'counts':histogram.flatten().tolist()}))
 chart=Image.new('RGB',(960,420),'white');cd=ImageDraw.Draw(chart)
 cd.text((20,12),f'{v}: RGB histogram of five runtime frames — UNVERIFIED on device',font=FONT,fill='#222')
 for channel,colour in enumerate(['#D73626','#27794A','#3469A8']):
  marginal=histogram.sum(axis=tuple(i for i in range(3) if i!=channel))/histogram.sum()
  left=20+channel*315;cd.text((left,42),'RGB'[channel],font=FONT,fill=colour)
  for i,fraction in enumerate(marginal):
   x=left+i*18;height=int(fraction*300)
   cd.rectangle((x,365-height,x+14,365),fill=colour)
  cd.text((left,380),'0             128             255',font=FONT,fill='#222')
 chart.save(OUT/f'colour-histogram-{v}.png')
 results['cordSamplingLimitations']='Diagnostic projected centre samples, using vermilion hue to reject occluders. Not a full object-ID visibility certification. White-out is included in the raw result.'
 results['uncoveredCordMeanMinimumS']=min((c['meanS'] for c in results['cordSamples'] if not .63<=c['p']<=.71),default=None)
 results['uncoveredCordMeanMinimumV']=min((c['meanV'] for c in results['cordSamples'] if not .63<=c['p']<=.71),default=None)
 report['viewports'][v]=results
(OUT/'runtime-acceptance.json').write_text(json.dumps(report,indent=2))
print(json.dumps({v:{'copyViolations':len(d['copyExclusivityViolations']),'strictBoxViolations':len(d['strictBoxViolations']),'deadAirCandidates':d['deadAirCandidates'],'cordMeanMinimumS':min((c['meanS'] for c in d['cordSamples']),default=None),'cordMeanMinimumV':min((c['meanV'] for c in d['cordSamples']),default=None),'keys':d['keys']} for v,d in report['viewports'].items()},indent=2))

# The same exported desktop clip at supplemental aspect ratios.
framing=Image.new('RGB',(1152,5*330+40),'white');fd=ImageDraw.Draw(framing)
fd.text((10,10),'HORIZONTAL SENSOR FIT — runtime, UNVERIFIED on device',font=FONT,fill='#222')
for row,p in enumerate([.08,.3,.55,.78,1.]):
 for col,(v,w,h) in enumerate([('1024',1024,768),('1440',1440,900),('1920',1920,1080)]):
  file=OUT/v/f'key-{p:.2f}.png'
  if not file.exists():continue
  pic=Image.open(file).convert('RGB');pic.thumbnail((384,290),Image.Resampling.LANCZOS)
  x=col*384;y=40+row*330
  fd.text((x+8,y+4),f'{w} x {h} / p {p:.2f}',font=FONT,fill='#222');framing.paste(pic,(x,y+28))
framing.save(OUT/'desktop-framing.png')
