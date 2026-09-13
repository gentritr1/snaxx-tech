"""Export each scene with exact public names and exactly one Journey clip."""
import sys
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parent))
from journey_common import *
for name in ['1440','390']:
    bpy.ops.wm.open_mainfile(filepath=str(OUT/'red-thread-journey.blend'))
    scene=bpy.data.scenes['Journey '+name];bpy.context.window.scene=scene
    scene.frame_set(0)
    bpy.ops.object.select_all(action='DESELECT')
    selected=[o for o in scene.objects if o.name.startswith(name+'/') and not o.get('reviewOnly')]
    for other in bpy.data.objects:
        if other not in selected:
            other.select_set(False)
            other.name='Excluded/'+other.name
    for obj in selected:
        obj.name=obj.name.split('/',1)[1]
        obj.select_set(True)
        if obj.type=='MESH':
            for slot in obj.material_slots:
                if slot.material and slot.material.get('sourceMaterial'):
                    slot.material=bpy.data.materials[slot.material['sourceMaterial']]
        if obj.type=='CURVE':
            obj.data.resolution_u=1;obj.data.bevel_resolution=7
            obj.data.materials.clear();obj.data.materials.append(bpy.data.materials['Vermilion'])
    bpy.context.view_layer.objects.active=scene.camera
    bpy.data.actions['Journey_'+name].name='Journey'
    bpy.ops.export_scene.gltf(filepath=str(OUT/f'red-thread-kit-{name}.glb'),export_format='GLB',
        use_selection=True,use_active_scene=True,export_apply=True,export_yup=True,export_cameras=True,export_lights=False,
        export_animations=True,export_animation_mode='ACTIVE_ACTIONS',
        export_nla_strips_merged_animation_name='Journey',export_frame_range=True,export_frame_step=1,
        export_optimize_animation_size=True,export_optimize_animation_keep_anim_object=False,
        export_morph=False,export_morph_animation=False,
        export_vertex_color='NAME',export_vertex_color_name='Color',export_all_vertex_colors=False,export_draco_mesh_compression_enable=True,
        export_draco_mesh_compression_level=7,export_extras=True)
    triangles={}
    for obj in selected:
        if obj.type in ('MESH','CURVE'):
            evaluated=obj.evaluated_get(bpy.context.evaluated_depsgraph_get())
            mesh=evaluated.to_mesh()
            triangles[obj.name]=sum(len(face.vertices)-2 for face in mesh.polygons)
            evaluated.to_mesh_clear()
    import json
    (OUT/name/'triangles.json').write_text(json.dumps(triangles,indent=2))
    print('TRIANGLES',name,json.dumps(triangles),flush=True)
    print('EXPORTED',name,(OUT/f'red-thread-kit-{name}.glb').stat().st_size,flush=True)

# Reopen the written files, rather than trusting Blender's export settings.
import importlib.util
spec=importlib.util.spec_from_file_location('journey_contract',Path(__file__).with_name('check-journey-glb.py'))
checker=importlib.util.module_from_spec(spec);spec.loader.exec_module(checker)
reports=[checker.inspect(OUT/'red-thread-kit-1440.glb',70),checker.inspect(OUT/'red-thread-kit-390.glb',35)]
import json
(OUT/'kit-report.json').write_text(json.dumps(reports,indent=2))
