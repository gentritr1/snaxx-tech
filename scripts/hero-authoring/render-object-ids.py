"""Occlusion-respecting object IDs for the approval-film keyframes."""
import json
import sys
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parent))
from journey_common import *

PALETTE={'Globe':(255,0,0),'Plane':(0,255,0),'Tile_F':(0,0,255),'Tile_J':(255,255,0),'Tile_A':(255,0,255),'Tile_L':(0,255,255),'Tile_E':(128,64,255),'Pin':(255,128,0),'Graticule':(64,128,255),'Arrow':(128,255,64),'Globe_Inner':(192,192,192),'Cord':(255,64,128)}
bpy.ops.wm.open_mainfile(filepath=str(OUT/'red-thread-journey.blend'))
mat=bpy.data.materials.new('Review Object IDs');mat.use_nodes=True
nodes=mat.node_tree.nodes;nodes.clear();links=mat.node_tree.links
output=nodes.new('ShaderNodeOutputMaterial');emission=nodes.new('ShaderNodeEmission');info=nodes.new('ShaderNodeObjectInfo')
links.new(info.outputs['Color'],emission.inputs['Color']);links.new(emission.outputs[0],output.inputs['Surface'])
for name in ['1440','390']:
    scene=bpy.data.scenes['Journey '+name];bpy.context.window.scene=scene
    scene.view_settings.view_transform='Raw';scene.view_settings.look='None'
    scene.render.film_transparent=False;scene.render.image_settings.color_mode='RGB';scene.render.dither_intensity=0
    scene.render.resolution_percentage=100;scene.eevee.taa_render_samples=16
    scene.render.filter_size=1.5
    scene.world.node_tree.nodes['Background'].inputs['Color'].default_value=(0,0,0,1)
    scene.view_layers[0].material_override=mat
    for obj in scene.objects:
        key=obj.name.split('/')[-1]
        if key=='ReviewThread':
            obj.hide_render=False;obj.color=tuple(c/255 for c in PALETTE['Cord'])+(1,);continue
        if obj.type!='MESH' or obj.get('reviewOnly'):
            obj.hide_render=True;continue
        if key.startswith('Arrow_'):key='Arrow'
        if key=='Globe_Smooth':key='Globe'
        colour=PALETTE.get(key,(0,0,0));obj.color=tuple(c/255 for c in colour)+(1,)
    directory=OUT/name/'object-ids';directory.mkdir(parents=True,exist_ok=True)
    for frame in [19,72,132,187,240]:
        scene.frame_set(frame)
        thread=bpy.data.objects[name+'/ReviewThread'];camera=scene.camera
        focal=scene.render.resolution_x*camera.data.lens/camera.data.sensor_width
        view=camera.matrix_world.inverted()
        for point in thread.data.splines[0].bezier_points:
            point.radius=max(.0001,(3 if name=='1440' else 2)*-(view@point.co).z/focal/thread.data.bevel_depth)
        scene.render.filepath=str(directory/f'{frame:04d}.png')
        bpy.ops.render.render(write_still=True)
    print('OBJECT ID PASS',name,'5 frames; scene depth respected; review overlays excluded',flush=True)
    # Unique instance IDs distinguish visible population from mere frustum entry.
    population={}
    for obj in scene.objects:
        key=obj.name.split('/')[-1]
        obj.color=(0,0,0,1)
        if key.startswith('Arrow_'):
            i=int(key.split('_')[1])
            colour=(32+64*(i%4),32+64*((i//4)%4),32+40*(i//16))
            obj.color=tuple(c/255 for c in colour)+(1,)
            population[key]=colour
    directory=OUT/name/'population-ids';directory.mkdir(parents=True,exist_ok=True)
    for frame in [171,180,187,216]:
        scene.frame_set(frame)
        scene.render.filepath=str(directory/f'{frame:04d}.png')
        bpy.ops.render.render(write_still=True)
    (directory/'palette.json').write_text(json.dumps(population,indent=2))
    print('POPULATION ID PASS',name,'4 frames; unique arrow IDs; scene depth respected',flush=True)
(OUT/'object-id-palette.json').write_text(json.dumps(PALETTE,indent=2))
