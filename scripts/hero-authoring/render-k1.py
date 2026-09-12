import bpy, bmesh, json, math
from mathutils.kdtree import KDTree
from mathutils import Vector,Quaternion
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2];OUT=ROOT/'design/hero-world-within/kit'
bpy.ops.wm.open_mainfile(filepath=str(OUT/'red-thread-kit.blend'))
pose=json.load(open('/tmp/red-thread-k1-pose.json'));scene=bpy.context.scene
B=Quaternion((1,0,0),math.pi/2)
def position(v):return Vector((v[0],-v[2],v[1]))
def rider(name,data):
 o=bpy.data.objects[name];o.location=position(data['position']);q=data['quaternion'];o.rotation_mode='QUATERNION';o.rotation_quaternion=B@Quaternion((q[3],q[0],q[1],q[2]))@B.inverted()
for name,data in zip(['Tile_F','Tile_J','Tile_A','Tile_L','Tile_E'],pose['tiles']):rider(name,data)
rider('Plane',pose['plane'])
for name in ['Globe','Graticule']:bpy.data.objects[name].location=(7,0,0)
bpy.data.objects['Pin'].location=position(pose['pin']);bpy.data.objects['Arrow'].hide_render=True
bpy.data.objects.get('Horizon').hide_render=True
# The viewport still uses the exported Thread mesh, clipped at the same arc fraction.
points=json.loads((OUT/'journey-spline.json').read_text())['points'];tree=KDTree(len(points))
for i,p in enumerate(points):tree.insert(position(p),i)
tree.balance();thread=bpy.data.objects['Thread'];bm=bmesh.new();bm.from_mesh(thread.data)
remove=[f for f in bm.faces if tree.find(f.calc_center_median())[1]/(len(points)-1)>.3]
bmesh.ops.delete(bm,geom=remove,context='FACES');bm.to_mesh(thread.data);bm.free()
camera=scene.camera;camera.location=position(pose['camera']);camera.rotation_euler=(position(pose['target'])-camera.location).to_track_quat('-Z','Y').to_euler();camera.data.type='PERSP';camera.data.sensor_fit='VERTICAL';camera.data.sensor_height=24;camera.data.lens=24/(2*math.tan(math.pi/8));camera.data.shift_y=130/1440
bpy.ops.mesh.primitive_plane_add(size=200,location=(0,0,-2.26));ground=bpy.context.object;ground.data.materials.append(bpy.data.materials['Porcelain'])
for o in scene.objects:
 if o.type=='LIGHT':o.location=(-3,-7,12);o.data.energy=1500;o.data.size=8;o.rotation_euler=(Vector((5,0,0))-o.location).to_track_quat('-Z','Y').to_euler()
scene.render.resolution_x=1440;scene.render.resolution_y=900;scene.render.resolution_percentage=100;scene.cycles.samples=64;scene.cycles.use_denoising=True;scene.render.filepath='/tmp/red-thread-blender-k1.png';bpy.ops.render.render(write_still=True)
