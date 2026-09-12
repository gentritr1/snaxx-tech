"""Prepare a conforming Natural Earth land mesh for Blender, never runtime."""
import json, math
from pathlib import Path
import numpy as np
from scipy.spatial import Delaunay
from shapely.geometry import Polygon, Point
ROOT=Path(__file__).resolve().parents[2]
polygons=json.loads((ROOT/'scripts/hero-authoring/natural-earth-polygons.json').read_text())
vertices=[];faces=[]
for ring in polygons:
 polygon=Polygon(ring).buffer(0)
 for poly in ([polygon] if polygon.geom_type=='Polygon' else polygon.geoms):
  if poly.area<.5:continue
  poly=poly.segmentize(2)
  points=list(poly.exterior.coords)[:-1]
  minx,miny,maxx,maxy=poly.bounds
  for x in np.arange(minx,maxx,2):
   for y in np.arange(miny,maxy,2):
    if poly.contains(Point(x,y)):points.append((x,y))
  if len(points)<4:continue
  array=np.array(points);tri=Delaunay(array);offset=len(vertices)
  for lon,lat in points:
   a=math.radians(lon-15);b=math.radians(lat);r=2.245
   vertices.append((r*math.sin(a)*math.cos(b),-r*math.cos(a)*math.cos(b),r*math.sin(b)))
  for ids in tri.simplices:
   if poly.covers(Polygon(array[ids])):faces.append([offset+int(i) for i in ids])
(ROOT/'design/hero-world-within/kit/land-mesh.json').write_text(json.dumps({'vertices':vertices,'faces':faces},separators=(',',':')))
print('Conforming land mesh',len(vertices),'vertices',len(faces),'faces')
