"""V3.1 review lighting. Does not alter Journey transforms or timing."""
import math
import bpy
from mathutils import Vector
from journey_common import KIT


def linear_hex(value):
    def linear(c):
        return c / 12.92 if c <= .04045 else ((c + .055) / 1.055) ** 2.4
    return tuple(linear(int(value[i:i+2], 16) / 255) for i in (0, 2, 4)) + (1,)


def material(name, colour, clay=False, cord=False, atlas=True):
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    nodes, links = mat.node_tree.nodes, mat.node_tree.links
    shader = nodes.get('Principled BSDF')
    shader.inputs['Base Color'].default_value = linear_hex(colour)
    shader.inputs['Roughness'].default_value = .3 if cord else .85
    shader.inputs['Subsurface Weight'].default_value = .08 if clay else 0
    shader.inputs['Coat Weight'].default_value = 1 if cord else 0
    if cord:
        shader.inputs['Emission Color'].default_value = linear_hex(colour)
        shader.inputs['Emission Strength'].default_value = 1
    if clay:
        # Eevee Next removed the old scene GTAO switch. Its AO shader supplies
        # the prescribed .6 distance / 1.0 factor, multiplied by the baked atlas.
        ao = nodes.new('ShaderNodeAmbientOcclusion')
        ao.inputs['Distance'].default_value = .6
        ao.inputs['Color'].default_value = linear_hex(colour)
        texture = nodes.new('ShaderNodeTexImage')
        texture.image = bpy.data.images.load(str(KIT / 'AO_Clay.png'), check_existing=True)
        texture.image.colorspace_settings.name = 'Non-Color'
        multiply = nodes.new('ShaderNodeMixRGB')
        multiply.blend_type = 'MULTIPLY'
        multiply.inputs[0].default_value = 1
        links.new(ao.outputs['Color'], multiply.inputs[1])
        links.new(texture.outputs['Color'], multiply.inputs[2])
        links.new(multiply.outputs[0] if atlas else ao.outputs['Color'], shader.inputs['Base Color'])
    return mat


def apply_settings(scene):
    scene.render.filter_size = 1.5
    scene.view_settings.view_transform = 'Standard'
    scene.view_settings.look = 'None'
    scene.eevee.taa_render_samples = 64
    if scene.get('referenceRevision')=='v3.1':
        scene.world.node_tree.nodes['Background'].inputs['Strength'].default_value=.3
        scene.render.film_transparent=True
        scene.render.image_settings.color_mode='RGBA'
    if hasattr(scene.eevee, 'use_gtao'):
        scene.eevee.use_gtao = True
    for obj in scene.objects:
        if obj.type == 'LIGHT':
            obj.hide_render = True
    prefix = scene.camera.name.split('/')[0] + '/'
    for label, kind, energy, location in [('ReviewSun', 'SUN', .9, (-10, 12, -4)), ('ReviewFill', 'AREA', 120, (6, 4, -6))]:
        data = bpy.data.lights.new(prefix + label, kind)
        data.energy = energy
        data.use_shadow = True
        if kind == 'SUN':
            data.angle = math.radians(2)
        else:
            data.size = 12
        obj = bpy.data.objects.new(prefix + label, data)
        scene.collection.objects.link(obj)
        obj.parent = scene.camera
        obj.location = location
        obj.rotation_euler = (Vector((0, 0, -16)) - obj.location).to_track_quat('-Z', 'Y').to_euler()
        obj['reviewOnly'] = True
    cache = {}
    for obj in scene.objects:
        if obj.type not in ('MESH', 'CURVE') or 'Whiteout' in obj.name:
            continue
        for slot in obj.material_slots:
            old = slot.material
            if old is None:
                continue
            source = old.get('sourceMaterial', old.name)
            is_cord = 'Thread' in obj.name
            clay = source in ('Porcelain', 'GraticuleClay') or 'InnerWall' in old.name
            if obj.type == 'MESH' and not obj.data.uv_layers:
                clay = False
            colour = 'D73626' if is_cord or 'Vermilion' in source else ('2A2D38' if 'Graphite' in source else 'F9F4EE')
            contract_name=obj.name.split('/')[-1]
            # build-kit.py bakes exactly these recipients; Arrow, Pin,
            # Graticule and the new LODs have no atlas allocation.
            atlas=contract_name.startswith('Tile_') or contract_name in ('Globe','Plane')
            key = (colour, clay, is_cord, atlas)
            if key not in cache:
                cache[key] = material(prefix + 'ReviewPrincipled/' + str(key), colour, clay, is_cord, atlas)
                cache[key]['sourceMaterial'] = source
            slot.link = 'OBJECT'
            slot.material = cache[key]
            if scene.get('referenceRevision')=='v3.1' and 'Globe_Inner' in obj.name:
                slot.material=inner_gradient(cache[key])
    print('RENDER SETTINGS: Standard; filter=1.5 px; AO shader distance=.6 factor=1 plus baked AO_Clay; sun angle=2 degrees; soft shadows; clay roughness=.85 subsurface=.08; cord roughness=.3 coat=1', flush=True)


def inner_gradient(original):
    mat=original.copy();mat.name='ReviewPrincipled/InnerGradient'
    nodes,links=mat.node_tree.nodes,mat.node_tree.links
    shader=nodes.get('Principled BSDF')
    coordinates=nodes.new('ShaderNodeTexCoord')
    split=nodes.new('ShaderNodeSeparateXYZ');links.new(coordinates.outputs['Window'],split.inputs[0])
    def math_node(operation,a,b):
        node=nodes.new('ShaderNodeMath');node.operation=operation
        for index,value in enumerate((a,b)):
            if isinstance(value,(int,float)):node.inputs[index].default_value=value
            else:links.new(value,node.inputs[index])
        return node.outputs[0]
    x=math_node('SUBTRACT',split.outputs['X'],.5)
    sag=math_node('MULTIPLY',math_node('MULTIPLY',x,x),.48)
    height=math_node('ADD',split.outputs['Y'],sag)
    ramp=nodes.new('ShaderNodeMapRange');ramp.clamp=True
    ramp.inputs['From Min'].default_value=0;ramp.inputs['From Max'].default_value=.2
    ramp.inputs['To Min'].default_value=.94;ramp.inputs['To Max'].default_value=1
    links.new(height,ramp.inputs['Value'])
    multiply=nodes.new('ShaderNodeMixRGB');multiply.blend_type='MULTIPLY';multiply.inputs[0].default_value=1
    multiply.inputs[1].default_value=linear_hex('F9F4EE')
    links.new(ramp.outputs[0],multiply.inputs[2]);links.new(multiply.outputs[0],shader.inputs['Base Color'])
    # §13C specifies luminance, independently of the studio's exposure. The
    # review wall supplies that flat gradient; all kit clay remains Principled.
    emission=nodes.new('ShaderNodeEmission')
    links.new(multiply.outputs[0],emission.inputs['Color'])
    links.new(emission.outputs[0],nodes.get('Material Output').inputs['Surface'])
    mat['horizon']='linear luminance .94 at bottom centre to 1 at 20% height; curved latitude falloff toward sides'
    return mat


def shadow_receivers(scene, p):
    prefix = scene.camera.name.split('/')[0] + '/'
    if scene.get('referenceRevision')=='v3.1':
        for suffix in ('ReviewSun','ReviewFill'):
            light=bpy.data.objects.get(prefix+suffix)
            if light:
                # The enclosing inner wall must not shadow the entire studio.
                # Interior riders are airborne; local AO retains their folds.
                light.data.use_shadow=p<.67
                if suffix=='ReviewSun':light.data.energy=2.5
                else:
                    target=bpy.data.objects[prefix+('Tile_A' if p<.2 else ('Plane' if p>=.48 else 'Globe'))]
                    depth=max(1,-(scene.camera.matrix_world.inverted()@target.location).z)
                    light.location=(depth*.35,depth*.2,-depth*.2)
                    light.data.size=depth*.8
                    light.data.energy=depth*depth*1.5
    floor = bpy.data.objects.get(prefix + 'ReviewFloor')
    if floor:
        floor.hide_render = not (.22 < p < .48)
    name = prefix + 'ReviewBackdrop'
    backdrop = bpy.data.objects.get(name)
    if backdrop is None:
        mesh = bpy.data.meshes.new(name)
        mesh.from_pydata([(-100,-100,0),(100,-100,0),(100,100,0),(-100,100,0)], [], [(0,1,2,3)])
        backdrop = bpy.data.objects.new(name, mesh)
        scene.collection.objects.link(backdrop)
        backdrop['reviewOnly'] = True
        backdrop.data.materials.append(material(name, 'F9F4EE'))
    tile = bpy.data.objects[prefix + 'Tile_A']
    camera = scene.camera
    backdrop.rotation_mode = 'QUATERNION'
    backdrop.rotation_quaternion = camera.rotation_quaternion
    backdrop.location = tile.location + camera.rotation_quaternion @ Vector((0,0,-tile.scale.x*.195))
    backdrop.hide_render = p > .20
