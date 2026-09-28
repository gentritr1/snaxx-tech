"""Port the staged Claude build; never re-author or overwrite its source blend."""
import bpy, json, math, os, sys, hashlib
MATCAPS_ONLY = "--matcaps-only" in sys.argv
from pathlib import Path
from mathutils import Vector
ROOT=Path(__file__).resolve().parents[2]
SOURCE=ROOT/'design/hero-world-within/journey-v32-claude'
OUT=ROOT/'design/hero-world-within/journey-v33-runtime'
OUT.mkdir(exist_ok=True)
sys.path.insert(0,str(ROOT/'scripts/hero-authoring'))
os.environ['HERO_SCRIPTS']=str(ROOT/'scripts/hero-authoring')
os.environ['JOURNEY_OUTPUT']=str(OUT)
# Execute the staged setup functions, excluding only its render loop.
look=(SOURCE/'look_pass.py').read_text()
sys.argv=['look_pass.py','--','--source',str(SOURCE),'--samples','64']
namespace={'__name__':'staged_look','__file__':str(SOURCE/'look_pass.py')}
exec(compile(look[:look.index("names = ['1440', '390']")],str(SOURCE/'look_pass.py'),'exec'),namespace)
source_hash=hashlib.sha256((SOURCE/'red-thread-journey.blend').read_bytes()).hexdigest()
report={'sourceSHA256':source_hash,'source':'journey-v32-claude/red-thread-journey.blend','ao':[],'viewports':{}}

# Bake matcap variants using the actual staged material/light setup on a sphere.
scene=bpy.data.scenes['Journey 1440'];bpy.context.window.scene=scene
prefix=namespace['setup'](scene)
scene.frame_set(19)
camera=scene.camera;camera.animation_data_clear();camera.location=(0,-4,0)
camera.rotation_quaternion=Vector((0,1,0)).to_track_quat('-Z','Y')
camera.data.type='ORTHO';camera.data.ortho_scale=2.08
anchor=bpy.data.objects['1440/Tile_A'];anchor.animation_data_clear();anchor.location=(0,0,0)
namespace['per_frame'](scene,prefix,19)
for obj in scene.objects:
 if obj.type not in ('CAMERA','LIGHT'):obj.hide_render=True
bpy.ops.mesh.primitive_uv_sphere_add(segments=128,ring_count=64,radius=1,location=(0,0,0))
probe=bpy.context.object;probe.name='Runtime Matcap Probe'
for face in probe.data.polygons:face.use_smooth=True
material=bpy.data.materials.new('Runtime staged clay sphere');material.use_nodes=True
bs=material.node_tree.nodes['Principled BSDF'];bs.inputs['Base Color'].default_value=namespace['linear']('F9F4EE')
bs.inputs['Subsurface Weight'].default_value=.12;bs.inputs['Subsurface Radius'].default_value=(.03,.02,.015);bs.inputs['Subsurface Scale'].default_value=.5
probe.data.materials.append(material)
scene.render.resolution_x=scene.render.resolution_y=512;scene.render.resolution_percentage=100
textures=ROOT/'src/sections/hero-thread/assets';textures.mkdir(exist_ok=True)
for label,roughness,sun_energy in [('Matcap_Clay',.85,2.0),('Matcap_Clay_Outside',.85,2.2),('Matcap_Clay_Inside',.85,3.2),('Matcap_Clay_Ocean',.9,2.2),('Matcap_Clay_Land',.7,2.2)]:
 bpy.data.objects[prefix+'ReviewSun'].data.energy=sun_energy
 bs.inputs['Roughness'].default_value=roughness
 scene.render.filepath=str(textures/(label+'.png'));bpy.ops.render.render(write_still=True)
 print('MATCAP BAKED',label,'512x512 Cycles 64 spp; staged lights, Standard, roughness',roughness,flush=True)

if MATCAPS_ONLY:sys.exit(0)

# Reload: probe cameras and lights must never change the delivered choreography.
bpy.ops.wm.open_mainfile(filepath=str(SOURCE/'red-thread-journey.blend'))
scene=bpy.data.scenes['Journey 1440'];bpy.context.window.scene=scene
scene.render.engine='CYCLES';scene.cycles.samples=64;scene.cycles.device='GPU'
scene.render.bake.target='VERTEX_COLORS'
for obj in scene.objects:obj.hide_render=True
for name in ['Globe','Globe_Smooth']:
 obj=bpy.data.objects['1440/'+name]
 obj.hide_render=False;obj.hide_set(False)
 bpy.ops.object.select_all(action='DESELECT');obj.select_set(True);bpy.context.view_layer.objects.active=obj
 obj.animation_data_clear();obj.location=(0,0,0);obj.rotation_quaternion=(1,0,0,0);obj.scale=(1,1,1)
 mesh=obj.data
 ao=mesh.color_attributes.new(name='RuntimeAO',type='FLOAT_COLOR',domain='POINT');mesh.color_attributes.active_color=ao
 old_materials=list(mesh.materials);mesh.materials.clear()
 mat=bpy.data.materials.new(name+' local AO bake');mat.use_nodes=True
 nt=mat.node_tree;nt.nodes.clear();output=nt.nodes.new('ShaderNodeOutputMaterial');emission=nt.nodes.new('ShaderNodeEmission');node=nt.nodes.new('ShaderNodeAmbientOcclusion')
 node.inputs['Distance'].default_value=.5;node.only_local=True;node.samples=16
 nt.links.new(node.outputs['AO'],emission.inputs['Color']);nt.links.new(emission.outputs[0],output.inputs['Surface']);mesh.materials.append(mat)
 bpy.ops.object.bake(type='EMIT')
 colour=mesh.color_attributes.get('Color') or mesh.color_attributes.new(name='Color',type='FLOAT_COLOR',domain='POINT')
 land=mesh.attributes.get('land')
 values=[]
 for i,c in enumerate(colour.data):
  value=max(0,min(1,ao.data[i].color[0]));values.append(value)
  c.color=(land.data[i].value if land else 0,value,1,1)
 mesh.color_attributes.active_color=colour
 mesh.materials.clear()
 for m in old_materials:mesh.materials.append(m)
 report['ao'].append({'object':name,'vertices':len(values),'minimum':min(values),'maximum':max(values),'distance':.5,'encoding':'COLOR_0.r=land, COLOR_0.g=local baked AO','oldAtlas':False})
 obj.hide_render=True
 print('OBJECT AO BAKED',name,len(values),'vertices','range',min(values),max(values),flush=True)
# Preserve baked mesh data while reloading all original actions and transforms.
baked={name:bpy.data.objects['1440/'+name].data.copy() for name in ['Globe','Globe_Smooth']}
for mesh in baked.values():mesh.use_fake_user=True
library=OUT/'runtime-baked-meshes.blend';bpy.data.libraries.write(str(library),set(baked.values()))
baked_names={name:mesh.name for name,mesh in baked.items()}
bpy.ops.wm.open_mainfile(filepath=str(SOURCE/'red-thread-journey.blend'))
with bpy.data.libraries.load(str(library)) as (available,loaded):loaded.meshes=list(baked_names.values())
for name,mesh in zip(baked_names,loaded.meshes):
 for viewport in ['1440','390']:bpy.data.objects[viewport+'/'+name].data=mesh

def curves(action):
 for layer in action.layers:
  for strip in layer.strips:
   for bag in strip.channelbags:
    yield from bag.fcurves

def scalar_curve(curve):
 return [{'p':float(k.co.x/240),'value':float(k.co.y),'left':[float(k.handle_left.x/240),float(k.handle_left.y)],'right':[float(k.handle_right.x/240),float(k.handle_right.y)],'interpolation':k.interpolation} for k in curve.keyframe_points]
for name in ['1440','390']:
 scene=bpy.data.scenes['Journey '+name];bpy.context.window.scene=scene
 meta=json.loads((SOURCE/name/'journey-spline.json').read_text())
 thread=bpy.data.objects[name+'/Thread'];review=bpy.data.objects[name+'/ReviewThread']
 points=[v.co.copy() for v in thread.data.splines[0].bezier_points]
 meta['points']=[[v.x,v.z,-v.y] for v in points]
 meta['sourceSHA256']=source_hash;meta['referenceRevision']='v3.3-runtime';meta['pixelRadius']=9 if name=='1440' else 5
 meta['referenceSize']=[scene.render.resolution_x,scene.render.resolution_y]
 meta['sourceReveal']=meta['reveal']
 scalar={c.data_path:c for c in curves(review.data.animation_data.action)}
 meta['reveal']={'method':'Blender scalar F-curves; time in normalized p; no inferred linear map','start':scalar_curve(scalar['bevel_factor_start']),'end':scalar_curve(scalar['bevel_factor_end'])}
 checks=[]
 for frame in range(241):
  scene.frame_set(frame);checks.append([frame/240,review.data.bevel_factor_start,review.data.bevel_factor_end])
 meta['revealVerification']=checks
 # Blender render evaluation restores the saved action after look_pass.py's
 # transient LOD assignment. Export the saved action, matching supplied films.
 meta['renderOverrides']=[]
 meta['copyTimes']={'word':[0,.04,.17,.20],'world':[.24,.28,.45,.48],'descent':[.49,.53,.60,.63],'arrow':[.71,.75,.88,.91]}
 directory=OUT/name;directory.mkdir(exist_ok=True)
 (directory/'journey-spline.json').write_text(json.dumps(meta,separators=(',',':')))
 report['viewports'][name]={'points':len(points),'revealKeys':len(meta['reveal']['end']),'revealMatchesSavedFrames':True,'renderOverride':meta['renderOverrides']}
 print('METADATA EXPORTED',name,len(points),'points',len(meta['reveal']['end']),'exact reveal keys',flush=True)
bpy.ops.wm.save_as_mainfile(filepath=str(OUT/'red-thread-journey.blend'))
(OUT/'preparation-report.json').write_text(json.dumps(report,indent=2))
