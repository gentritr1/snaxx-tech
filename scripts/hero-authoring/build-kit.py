"""Run with Blender 5.2: blender --background --python scripts/hero-authoring/build-kit.py.
Authoring only. No Blender or geometry-generation code ships in the browser.
"""
import bpy, bmesh, math, json, os
from mathutils import Vector
from mathutils.geometry import tessellate_polygon
from pathlib import Path
ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / 'design/hero-world-within/kit'
OUT.mkdir(parents=True, exist_ok=True)
bpy.ops.object.select_all(action='SELECT'); bpy.ops.object.delete(use_global=False)
scene=bpy.context.scene
scene.render.engine='CYCLES'; scene.cycles.samples=128
scene.world.color=(.8,.8,.8)
def linear(v): return v/12.92 if v<=.04045 else ((v+.055)/1.055)**2.4
def rgb(hex): return tuple(linear(int(hex[i:i+2],16)/255) for i in (0,2,4))+(1,)
def material(name,hex):
 m=bpy.data.materials.new(name);m.use_nodes=True;m.diffuse_color=rgb(hex)
 p=m.node_tree.nodes.get('Principled BSDF');p.inputs['Base Color'].default_value=rgb(hex);p.inputs['Roughness'].default_value=.85;p.inputs['Subsurface Weight'].default_value=.08;p.inputs['Specular IOR Level'].default_value=0
 return m
clay=material('Porcelain','F9F4EE');ink=material('Graphite','2A2D38');red=material('Vermilion','D73626');gridmat=material('GraticuleClay','D9D4CE')
red.node_tree.nodes.get('Principled BSDF').inputs['Roughness'].default_value=.3
kit=[]
def active(o):
 bpy.ops.object.select_all(action='DESELECT');o.select_set(True);bpy.context.view_layer.objects.active=o
 return o
def apply(o,mod):
 active(o);bpy.ops.object.modifier_apply(modifier=mod.name)
def mesh(name,verts,faces,mat=clay):
 d=bpy.data.meshes.new(name);d.from_pydata(verts,[],faces);d.update();bm=bmesh.new();bm.from_mesh(d);bmesh.ops.recalc_face_normals(bm,faces=list(bm.faces));bm.to_mesh(d);bm.free();o=bpy.data.objects.new(name,d);scene.collection.objects.link(o);o.data.materials.append(mat);return o
def smooth(o):
 for p in o.data.polygons:p.use_smooth=True
 return o
def bevel(o,width,segments=3):
 m=o.modifiers.new('Clay edge bevel','BEVEL');m.width=width;m.segments=segments;apply(o,m)
def boolean(o,cutter):
 m=o.modifiers.new('Authored recess','BOOLEAN');m.operation='DIFFERENCE';m.solver='EXACT';m.object=cutter;m.material_mode='TRANSFER';apply(o,m);bpy.data.objects.remove(cutter,do_unlink=True)
def join(objects,name):
 bpy.ops.object.select_all(action='DESELECT')
 for o in objects:o.select_set(True)
 bpy.context.view_layer.objects.active=objects[0];bpy.ops.object.join();objects[0].name=name;return objects[0]
def limit(o,maxtris):
 tris=sum(len(f.vertices)-2 for f in o.data.polygons)
 if tris>maxtris:
  m=o.modifiers.new('Delivery triangle budget','DECIMATE');m.ratio=maxtris/tris*.98;m.delimit={'MATERIAL'};apply(o,m)
def cylinder(radius,depth,loc,rot):
 bpy.ops.mesh.primitive_cylinder_add(vertices=24,radius=radius,depth=depth,location=loc,rotation=rot);return bpy.context.object
glyphs=json.loads((OUT/'glyphs.json').read_text())
# Rounded silhouette with a second bevel around the front/back lip.
for i,(name,letter) in enumerate(zip(['F','J','A','L','E'],'FJALË')):
 outline=[]
 for cx,cz,start in [(.34,.34,0),(-.34,.34,90),(-.34,-.34,180),(.34,-.34,270)]:
  for j in range(7):
   a=math.radians(start+j*15);outline.append((cx+.16*math.cos(a),cz+.16*math.sin(a)))
 n=len(outline);verts=[(x,y,z) for y in [-.18,.18] for x,z in outline]
 faces=[tuple(range(n-1,-1,-1)),tuple(range(n,2*n))]+[(j,(j+1)%n,(j+1)%n+n,j+n) for j in range(n)]
 tile=mesh('Tile_'+name,verts,faces);bevel(tile,.06)
 # SIMPLE subdivision preserves the authored planar face and bevel profile.
 sub=tile.modifiers.new('Subdivision 2','SUBSURF');sub.subdivision_type='SIMPLE';sub.levels=2;apply(tile,sub)
 boolean(tile,cylinder(.066,1.4,(0,0,0),(0,math.pi/2,0)))
 def text_object(depth,y):
  data=glyphs[letter];n=len(data['vertices'])
  verts=[(x,y+d,z) for d in [-depth,depth] for x,z in data['vertices']]
  faces=[tuple(reversed(t)) for t in data['faces']]+[tuple(i+n for i in t) for t in data['faces']]
  for ring in data['rings']:
   for a,b in zip(ring,ring[1:]+ring[:1]):faces.append((a,b,b+n,a+n))
  return mesh('Bricolage 700 '+letter,verts,faces,red if name=='E' else ink)

 cutter=text_object(.03,-.18);cutter.data.materials.append(red if name=='E' else ink);boolean(tile,cutter)
 active(tile);bpy.ops.object.mode_set(mode='EDIT');bpy.ops.mesh.select_all(action='SELECT');bpy.ops.mesh.dissolve_limited(angle_limit=.005,delimit={'MATERIAL'});bpy.ops.object.mode_set(mode='OBJECT')
 limit(tile,5200)
 glyph=text_object(.0005,-.1505);glyph.data.materials.append(red if name=='E' else ink)
 tile=join([tile,glyph],'Tile_'+name);smooth(tile);weighted=tile.modifiers.new('Porcelain face normals','WEIGHTED_NORMAL');weighted.keep_sharp=True;apply(tile,weighted);kit.append(tile)
# Real Natural Earth boundaries are triangulated in map coordinates, then subdivided
# before projection so continents follow the sphere rather than becoming flat caps.
land=json.loads((OUT/'land-mesh.json').read_text())
verts=land['vertices'];faces=land['faces']
def sphere(lon,lat,r):
 a=math.radians(lon-15);b=math.radians(lat)
 return (r*math.sin(a)*math.cos(b),-r*math.cos(a)*math.cos(b),r*math.sin(b))
relief=mesh('Raised Natural Earth',verts,faces);active(relief)
bpy.ops.object.mode_set(mode='EDIT');bpy.ops.mesh.select_all(action='SELECT');bpy.ops.mesh.remove_doubles(threshold=.0001);bpy.ops.mesh.normals_make_consistent(inside=False);bpy.ops.object.mode_set(mode='OBJECT')
solid=relief.modifiers.new('Land relief 0.045','SOLIDIFY');solid.thickness=.045;solid.offset=-1;apply(relief,solid);bevel(relief,.01,2)
bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=5,radius=2.2);ball=bpy.context.object;ball.data.materials.append(clay)
globe=join([ball,relief],'Globe');limit(globe,20500);smooth(globe);kit.append(globe)
# Separate tubular graticule, never flat screen-space lines.
def curves(name,paths,radius,resolution=2,mat=clay,cyclic=False):
 data=bpy.data.curves.new(name,'CURVE');data.dimensions='3D';data.bevel_depth=radius;data.bevel_resolution=resolution;data.resolution_u=16
 for points in paths:
  s=data.splines.new('POLY');s.points.add(len(points)-1)
  for p,co in zip(s.points,points):p.co=(*co,1)
  s.use_cyclic_u=cyclic
 o=bpy.data.objects.new(name,data);scene.collection.objects.link(o);o.data.materials.append(mat);active(o);bpy.ops.object.convert(target='MESH');return smooth(bpy.context.object)
paths=[[sphere(lon,lat,2.207) for lat in range(-90,91,3)] for lon in range(-180,180,15)]
paths += [[sphere(lon,-90+180*(i+1)/13,2.207) for lon in range(-180,181,3)] for i in range(12)]
grid=curves('Graticule',paths,.006,1,gridmat);kit.append(grid)
# Pin silhouette with an inset porcelain bead.
outline=[]
for i in range(33):
 a=2*math.pi*i/32;x=.105*math.sin(a);z=.23+.12*math.cos(a)
 if z<.23:z=max(0,z-.11*(1-abs(math.sin(a))))
 outline.append((x,z))
n=len(outline);v=[(x,y,z) for y in [-.035,.035] for x,z in outline];f=[tuple(range(n-1,-1,-1)),tuple(range(n,2*n))]+[(i,(i+1)%n,(i+1)%n+n,i+n) for i in range(n)]
pin=mesh('Pin',v,f,red);bevel(pin,.01,2)
bpy.ops.mesh.primitive_uv_sphere_add(segments=16,ring_count=8,radius=.044,location=(0,-.04,.235));bead=bpy.context.object;bead.data.materials.append(clay);pin=join([pin,bead],'Pin');smooth(pin);kit.append(pin)
# +X is the exported tangent direction for the plane and arrows.
plane=mesh('Plane',[(.8,0,.10),(-.6,-.55,0),(-.35,-.07,-.10),(-.6,0,.08),(-.35,.07,-.10),(-.6,.55,0)],[(0,1,2),(0,2,3),(0,3,4),(0,4,5)])
solid=plane.modifiers.new('Paper thickness','SOLIDIFY');solid.thickness=.025;apply(plane,solid);bevel(plane,.01,2)
boolean(plane,cylinder(.026,.2,(-.25,0,-.045),(0,math.pi/2,0)));limit(plane,1900)
for v in plane.data.vertices:
 x,y,z=v.co;roll=-0.205905194703051;v.co=Vector((x,y*math.cos(roll)-z*math.sin(roll),y*math.sin(roll)+z*math.cos(roll)))
kit.append(plane)
arrow=mesh('Arrow',[(.3,0,0),(-.2,-.07,-.045),(-.2,.07,-.045),(-.2,0,.07)],[(0,2,1),(0,3,2),(0,1,3),(1,2,3)])
bevel(arrow,.012,2);limit(arrow,290);kit.append(arrow)
# Authored Bezier centerline; re-sampled by distance for all runtime riders.
# Word run -> exterior wrap -> interior rising flight. World coordinates are +Y up.
controls=[(-12,-2.0,0),(-6,-1.2,0),(-3,-1,0),(0,-1.12,0),(3,.1,.2),(4.4,.7,1.1)]
for i in range(13):
 a=2.5-i/12*2*math.pi;controls.append((7+2.27*math.cos(a),2.27*math.sin(a)*math.sin(math.radians(40)),2.27*math.sin(a)*math.cos(math.radians(40))))
 if i==1:controls.append((7.2,2.6,1.6))
wrap_end=controls[-1];wrap_end_index=len(controls)-1
# Long interior flight arc reserves enough arclength for the wrap to end by .45.
controls += [(7.8,.2,1.8),(7.4,-.3,.6),(6.3,-1.1,-.4)]
# Depth folds keep the long train legible as one ascending curve in the film camera.
for i in range(85):
 t=i/84
 depth=8+2.5*math.cos(14*math.pi*t+5.19235452468313)
 controls.append((7+.8*(t-.35)*depth,1+.6*(t*t-.35*.35)*depth,6-depth))
controls += [(12,3.5,-2),(14,4.5,0)]

def bz(v):return (v[0],-v[2],v[1])
cd=bpy.data.curves.new('Authored journey Bezier','CURVE');cd.dimensions='3D';cd.resolution_u=16;cd.bevel_depth=.055;cd.bevel_resolution=7
sp=cd.splines.new('BEZIER');sp.bezier_points.add(len(controls)-1)
for pt,co in zip(sp.bezier_points,controls):pt.co=bz(co);pt.handle_left_type='AUTO';pt.handle_right_type='AUTO'
thread=bpy.data.objects.new('Thread',cd);scene.collection.objects.link(thread);thread.data.materials.append(red)
# Evaluate the actual Blender Bezier handles, not a second approximation.
dense=[]
for a,b in zip(sp.bezier_points,sp.bezier_points[1:]):
 for j in range(128):
  t=j/128;v=a.co*(1-t)**3+3*a.handle_right*(1-t)**2*t+3*b.handle_left*(1-t)*t*t+b.co*t**3
  dense.append(Vector((v.x,v.z,-v.y)))
dense.append(Vector(controls[-1]));length=[0]
for a,b in zip(dense,dense[1:]):length.append(length[-1]+(b-a).length)
points=[];cursor=0
for i in range(1025):
 d=length[-1]*i/1024
 while cursor<len(length)-2 and length[cursor+1]<d:cursor+=1
 t=(d-length[cursor])/(length[cursor+1]-length[cursor]);points.append(dense[cursor].lerp(dense[cursor+1],t))
tangents=[(points[min(1024,i+1)]-points[max(0,i-1)]).normalized() for i in range(1025)]
normals=[];normal=Vector((0,1,0))
for i,t in enumerate(tangents):
 if i:normal=tangents[i-1].rotation_difference(t)@normal
 normal=(normal-t*normal.dot(t)).normalized();normals.append(normal.copy())
export={'version':2,'source':'Blender 5.2 authored Bezier; uniform arclength, parallel-transport Frenet frames','coordinateSystem':'Y_UP','length':length[-1],'points':[list(p) for p in points],'tangents':[list(t) for t in tangents],'normals':[list(n) for n in normals]}
def nearest_t(co):
 v=Vector(co);return min(range(len(points)),key=lambda i:(points[i]-v).length_squared)/(len(points)-1)
export.update({'phoneWorldCameraT':nearest_t((4,.5,.8))-.03,'interiorStartT':nearest_t(controls[23]),'flightCameraT':nearest_t((7,1,6-(8+2.5*math.cos(14*math.pi*.35+5.19235452468313))))-.03, 'planeStartT':nearest_t((7.2,2.6,1.6))-.006, 'wrapEndT':length[wrap_end_index*128]/length[-1], 'pinT':nearest_t((7.27,1.45,1.73)), 'wordStartT':nearest_t((-2.76,-1,0)), 'wordSpacingT':1.3/length[-1], 'tileSpeedT':4.3/length[-1], 'wordCameraT':nearest_t((.3,-1.12,0))-.03, 'worldCameraT':nearest_t((3,.1,.2))-.03})
# Choose readable authored rider seats, using the same transported frames as runtime.
def face_visibility(i,camera):
 view=(Vector(camera)-points[i]).normalized()
 face=normals[i]*math.cos(-.205905194703051)+tangents[i].cross(normals[i])*math.sin(-.205905194703051)
 return abs(view.dot(face))
plane_candidates=[i for i,p in enumerate(points) if p.y>1.8 and (p-Vector((7.2,2.6,1.6))).length<1.3 and i/1024<export['pinT']]
if plane_candidates:export['planeStartT']=max(plane_candidates,key=lambda i:face_visibility(i,(3,1,11.5)))/1024
export['flightLeadT']=max(range(math.ceil(.74*1024),math.floor(.78*1024)+1),key=lambda i:face_visibility(i,(7,1,6)))/1024
(OUT/'journey-spline.json').write_text(json.dumps(export,separators=(',',':')))
active(thread);bpy.ops.object.convert(target='MESH');thread=bpy.context.object;kit.append(thread)
# One shared UV atlas baked from the actual recessed meshes.
for o in kit:
 active(o)
 if not o.data.uv_layers:o.data.uv_layers.new(name='UVMap')
 for old in list(o.data.color_attributes):o.data.color_attributes.remove(old)
 attr=o.data.color_attributes.new(name='Color',type='BYTE_COLOR',domain='CORNER')
 for p in o.data.polygons:
  color=o.data.materials[p.material_index].diffuse_color
  for loop in p.loop_indices:attr.data[loop].color=color
# Pack only AO recipients; separate them during bake to avoid unintended inter-object occlusion.
recipients=[o for o in kit if o.name.startswith('Tile_') or o.name in ['Globe','Plane']]
for i,o in enumerate(recipients):o.location.x=i*7
bpy.ops.object.select_all(action='DESELECT')
for o in recipients:o.select_set(True)
bpy.context.view_layer.objects.active=recipients[0];bpy.ops.object.mode_set(mode='EDIT');bpy.ops.mesh.select_all(action='SELECT');bpy.ops.uv.smart_project(angle_limit=math.radians(66),island_margin=.02);bpy.ops.object.mode_set(mode='OBJECT')
ao=bpy.data.images.new('AO_Clay',width=1024,height=1024);ao.colorspace_settings.name='Non-Color'
for m in (clay,ink,red):
 node=m.node_tree.nodes.new('ShaderNodeTexImage');node.image=ao;m.node_tree.nodes.active=node
scene.render.bake.use_clear=True;scene.render.bake.margin=8
# A bounded AO node keeps distant objects from muddying broad porcelain faces.
for m in (clay,ink,red):
 nodes=m.node_tree.nodes;occ=nodes.new('ShaderNodeAmbientOcclusion');occ.inputs['Distance'].default_value=.06
 emission=nodes.new('ShaderNodeEmission');m.node_tree.links.new(occ.outputs['Color'],emission.inputs['Color']);m.node_tree.links.new(emission.outputs[0],nodes.get('Material Output').inputs['Surface'])
bpy.ops.object.bake(type='EMIT')
for m in (clay,ink,red):m.node_tree.links.new(m.node_tree.nodes.get('Principled BSDF').outputs[0],m.node_tree.nodes.get('Material Output').inputs['Surface'])
ao.filepath_raw=str(OUT/'AO_Clay.png');ao.file_format='PNG';ao.save()
for o in recipients:o.location=(0,0,0)
# The distant interior horizon uses the same land mask with subtler relief.
horizon=globe.copy();horizon.data=globe.data.copy();horizon.name='Horizon';scene.collection.objects.link(horizon)
for v in horizon.data.vertices:
 radius=v.co.length
 if radius>2.2:v.co.normalize();v.co*=2.2+(radius-2.2)*.12
kit.append(horizon)
for o in kit:o.hide_render=True
# Bake a genuine studio-lit matcap by photographing a clay sphere orthographically.
bpy.ops.mesh.primitive_uv_sphere_add(segments=96,ring_count=64,radius=1);sphereObj=bpy.context.object;sphereObj.data.materials.append(clay);smooth(sphereObj)
bpy.ops.object.camera_add(location=(0,-5,0));camera=bpy.context.object;camera.rotation_euler=(Vector((0,0,0))-camera.location).to_track_quat('-Z','Y').to_euler();camera.data.type='ORTHO';camera.data.ortho_scale=2.02;scene.camera=camera
bpy.ops.object.light_add(type='AREA',location=(-3,-4,5));key=bpy.context.object;key.data.energy=450;key.data.shape='DISK';key.data.size=5;key.rotation_euler=(-key.location).to_track_quat('-Z','Y').to_euler()
scene.world.use_nodes=True;scene.world.node_tree.nodes['Background'].inputs[0].default_value=(1,1,1,1);scene.world.node_tree.nodes['Background'].inputs[1].default_value=.65
scene.view_settings.view_transform='Standard';scene.render.resolution_x=512;scene.render.resolution_y=512;scene.render.resolution_percentage=100;scene.render.image_settings.file_format='PNG';scene.render.filepath=str(OUT/'Matcap_Clay.png');bpy.ops.render.render(write_still=True)
bpy.data.objects.remove(sphereObj,do_unlink=True)
for o in kit:o.hide_render=False
# Keep the reproducible authored file outside the application repository.
bpy.ops.wm.save_as_mainfile(filepath=str(OUT/'red-thread-kit.blend'))
bpy.ops.object.select_all(action='DESELECT')
for o in kit:o.select_set(True)
bpy.context.view_layer.objects.active=kit[0]
bpy.ops.export_scene.gltf(filepath=str(OUT/'red-thread-kit.glb'),export_format='GLB',use_selection=True,export_apply=True,export_yup=True,export_vertex_color='NAME',export_vertex_color_name='Color',export_all_vertex_colors=False,export_animations=False,export_cameras=False,export_lights=False,export_draco_mesh_compression_enable=True,export_draco_mesh_compression_level=7)
counts={o.name:sum(len(f.vertices)-2 for f in o.data.polygons) for o in kit}
(OUT/'kit-report.json').write_text(json.dumps({'triangles':counts,'glbBytes':(OUT/'red-thread-kit.glb').stat().st_size,'splinePoints':len(points),'arcLength':length[-1]},indent=2))
print('KIT_REPORT',json.dumps(counts))
