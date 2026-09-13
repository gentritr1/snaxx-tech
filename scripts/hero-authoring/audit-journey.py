"""Blender staging preflight. Conservative boxes; final browser §8 follows approval."""
import sys
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parent))
from journey_common import *
import json
bpy.ops.wm.open_mainfile(filepath=str(OUT/'red-thread-journey.blend'))
TIMES={'word':(0,.20),'world':(.24,.48),'descent':(.49,.63),'arrow':(.71,.91)}
def intersects(a,b):return a[0]<b[2] and a[2]>b[0] and a[1]<b[3] and a[3]>b[1]
def bounds(obj,camera,w,h):
 points=[project(camera,obj.matrix_world@Vector(p),w,h) for p in obj.bound_box]
 points=[p for p in points if p]
 if not points:return None
 return [min(p[0] for p in points),min(p[1] for p in points),max(p[0] for p in points),max(p[1] for p in points)]
reports={}
for name in ['1440','390']:
 scene=bpy.data.scenes['Journey '+name];bpy.context.window.scene=scene
 w,h=scene.render.resolution_x,scene.render.resolution_y
 metadata=json.loads((OUT/name/'journey-spline.json').read_text())
 zones=metadata['zones'];rows=[];overlaps=[];dead=[]
 for frame in range(0,240,6):
  scene.frame_set(frame);p=frame/240;camera=scene.camera
  active=next((key for key,(a,b) in TIMES.items() if a<p<b),None)
  boxes={}
  for obj in scene.objects:
   if obj.type!='MESH' or obj.get('reviewOnly') or max(abs(v) for v in obj.scale)<1e-6:continue
   box=bounds(obj,camera,w,h)
   if box and intersects(box,[0,0,w,h]):boxes[obj.name.split('/')[-1]]=box
  # The shell encloses the camera: its full 8-corner box is not its visible band.
  # Keep that conservative violation in the report rather than silently dropping it.
  if active:
   for key,box in boxes.items():
    if intersects(box,zones[active]):
     zone=zones[active];overlaps.append({'p':p,'object':key,'zone':active,'box':box,'intersectionPixels':[min(box[2],zone[2])-max(box[0],zone[0]),min(box[3],zone[3])-max(box[1],zone[1])]})
  heroes=[(key,box) for key,box in boxes.items() if key.startswith(('Tile_','Arrow_')) or key in ('Globe','Globe_Smooth','Plane')]
  if .20<=p<=.90 and not .66<=p<=.68 and not any(intersects(box,[w/3,h/3,2*w/3,2*h/3]) for key,box in heroes):dead.append(p)
  rows.append({'frame':frame,'p':p,'copy':active,'boxes':boxes})
 reports[name]={'method':'conservative projected 8-corner boxes; occlusion not subtracted; not browser §8 acceptance','overlapCandidates':overlaps,'deadAirCandidates':dead,'frames':rows}
 print('PREFLIGHT',name,'overlap candidates',len(overlaps),'dead-air candidates',dead)
(OUT/'staging-preflight.json').write_text(json.dumps(reports,indent=2))
