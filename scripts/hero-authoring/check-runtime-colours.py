"""Decode both delivered Draco files and inspect the actual vertex colours."""
import bpy
import json
from pathlib import Path
root = Path.cwd()
for variant in ['1440', '390']:
    bpy.ops.wm.read_factory_settings(use_empty=True)
    bpy.ops.import_scene.gltf(filepath=str(root / f'public/models/red-thread-kit-{variant}.glb'))
    for name in ['Globe', 'Globe_Smooth']:
        obj = bpy.data.objects[name]
        colour = obj.data.color_attributes.active_color
        assert colour, f'{variant}/{name}: missing decoded COLOR_0'
        values = [item.color for item in colour.data]
        land = [v[0] for v in values]
        ao = [v[1] for v in values]
        if name == "Globe":
            assert min(land) < .01 and max(land) > .99
        else:
            assert max(land) == 0, "Saved smooth LOD has no land attribute"
        assert min(ao) > .5 and max(ao) <= 1.0001
        assert all(abs(v[2] - 1) < .001 for v in values)
        print('RUNTIME COLOUR PASS', json.dumps({'viewport':variant,'object':name,'vertices':len(obj.data.vertices),'landRange':[min(land),max(land)],'aoRange':[min(ao),max(ao)],'oldAtlas':False}), flush=True)
