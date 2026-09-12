"""Resolve Bricolage compound outlines to watertight boolean cutters."""
import json
from pathlib import Path
from fontTools.ttLib import TTFont
from fontTools.varLib.instancer import instantiateVariableFont
from fontTools.pens.basePen import BasePen
from shapely.geometry import Polygon
from shapely.ops import unary_union
from shapely import constrained_delaunay_triangles
ROOT=Path(__file__).resolve().parents[2]
f=TTFont(ROOT/'public/fonts/bricolage-grotesque-latin.woff2')
f=instantiateVariableFont(f,{a.axisTag:700 if a.axisTag=='wght' else a.defaultValue for a in f['fvar'].axes})
glyphs=f.getGlyphSet();cmap=f.getBestCmap();scale=.83/f['head'].unitsPerEm
class Outline(BasePen):
 def __init__(self):super().__init__(glyphs);self.rings=[];self.ring=[]
 def _moveTo(self,p):self.ring=[p]
 def _lineTo(self,p):self.ring.append(p)
 def _qCurveToOne(self,b,c):
  a=self._getCurrentPoint()
  for i in range(1,13):
   t=i/12;self.ring.append(tuple((1-t)**2*a[k]+2*(1-t)*t*b[k]+t*t*c[k] for k in (0,1)))
 def _curveToOne(self,b,c,d):
  a=self._getCurrentPoint()
  for i in range(1,13):
   t=i/12;self.ring.append(tuple((1-t)**3*a[k]+3*(1-t)**2*t*b[k]+3*(1-t)*t*t*c[k]+t**3*d[k] for k in (0,1)))
 def _closePath(self):self.rings.append(self.ring)
 def _endPath(self):self._closePath()
def area(r):return sum(a[0]*b[1]-a[1]*b[0] for a,b in zip(r,r[1:]+r[:1]))/2
result={}
for letter in 'FJALË':
 pen=Outline();glyphs[cmap[ord(letter)]].draw(pen)
 sign=1 if area(max(pen.rings,key=lambda r:abs(area(r))))>0 else -1
 outer=[Polygon(r).buffer(0) for r in pen.rings if area(r)*sign>0]
 holes=[Polygon(r).buffer(0) for r in pen.rings if area(r)*sign<0]
 shape=unary_union(outer).difference(unary_union(holes));minx,miny,maxx,maxy=shape.bounds
 vertices=[];faces=[];rings=[];lookup={}
 def vertex(p):
  co=(round((p[0]-(minx+maxx)/2)*scale,7),round((p[1]-(miny+maxy)/2)*scale,7))
  if co not in lookup:lookup[co]=len(vertices);vertices.append(co)
  return lookup[co]
 for poly in ([shape] if shape.geom_type=='Polygon' else shape.geoms):
  for ring in [poly.exterior,*poly.interiors]:rings.append([vertex(p) for p in list(ring.coords)[:-1]])
  for tri in constrained_delaunay_triangles(poly).geoms:faces.append([vertex(p) for p in list(tri.exterior.coords)[:3]])
 result[letter]={'vertices':vertices,'faces':faces,'rings':rings}
 print(letter,len(pen.rings),'font contours',len(vertices),'vertices',len(faces),'cap triangles')
(ROOT/'design/hero-world-within/kit/glyphs.json').write_text(json.dumps(result,separators=(',',':')))
