"""Blender-only helpers for the V3 approval film. Never imported by the app."""
import bisect
import math
import os
from pathlib import Path
import bpy
from mathutils import Vector, Quaternion
from mathutils.bvhtree import BVHTree

ROOT = Path(__file__).resolve().parents[2]
KIT = ROOT / 'design/hero-world-within/kit'
OUT = Path(os.environ.get('JOURNEY_OUTPUT', str(ROOT / 'design/hero-world-within/journey-v3')))
OUT.mkdir(parents=True, exist_ok=True)


def clamp(x):
    return max(0.0, min(1.0, x))


def phase(p, a, b):
    return clamp((p-a)/(b-a))


def quart(x):
    return 1-(1-clamp(x))**4


def cubic(x):
    x = clamp(x)
    return 4*x**3 if x < .5 else 1-(-2*x+2)**3/2


def lerp(a, b, t):
    return a*(1-t)+b*t


def inside_u(p):
    return lerp(.10, .95, quart(phase(p, .68, .90)))


def inside_parameter(u):
    # §13C replaces negative-u hiding with a baked, visible entry pre-roll.
    return clamp((u+.63)/1.63)


def draw_t(p, t_in):
    if p < .66:
        return t_in*p/.66
    if p < .68:
        return t_in+.06
    return min(1, t_in+inside_parameter(inside_u(p))*(1-t_in)+.04)


def action_for(obj, action):
    obj.animation_data_create()
    obj.animation_data.action = action
    obj.animation_data.action_slot = action.slots.new(id_type=obj.id_type, name=obj.name)


def key_transform(obj, frame):
    for path in ('location', 'rotation_quaternion', 'scale'):
        obj.keyframe_insert(path, frame=frame)


def finish_handles(action):
    # Samples come from the specified analytic eases, not default Blender easing.
    # Explicit Hermite handles preserve their local velocity between baked frames.
    for layer in action.layers:
        for strip in layer.strips:
            for bag in strip.channelbags:
                for curve in bag.fcurves:
                    keys = curve.keyframe_points
                    for i, key in enumerate(keys):
                        key.interpolation = 'BEZIER'
                        key.handle_left_type = key.handle_right_type = 'FREE'
                        left, right = keys[max(0,i-1)], keys[min(len(keys)-1,i+1)]
                        dx = right.co.x-left.co.x
                        slope = (right.co.y-left.co.y)/dx if dx else 0
                        if i and i+1 < len(keys) and (key.co.y-left.co.y)*(right.co.y-key.co.y) <= 0:
                            slope = 0
                        key.handle_left = (key.co.x-1/3, key.co.y-slope/3)
                        key.handle_right = (key.co.x+1/3, key.co.y+slope/3)


def linked_object(source, name, scene, action=None):
    obj = source.copy()
    obj.data = source.data
    obj.name = name
    obj.animation_data_clear()
    obj.constraints.clear()
    obj.location = (0,0,0)
    obj.rotation_mode = 'QUATERNION'
    obj.rotation_quaternion = Quaternion()
    obj.scale = (1,1,1)
    obj.hide_render = False
    obj.hide_viewport = False
    scene.collection.objects.link(obj)
    if action:
        action_for(obj, action)
    return obj


def make_lods(source):
    # Resample the relief onto a closed regular sphere: no extruded edge walls.
    tree = BVHTree.FromPolygons([v.co.copy() for v in source.data.vertices],
                               [list(p.vertices) for p in source.data.polygons])
    bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=5, radius=2.2)
    smooth = bpy.context.object
    smooth.name = 'Source_Globe_Smooth'
    smooth.data.materials.append(bpy.data.materials['Porcelain'])
    for vertex in smooth.data.vertices:
        direction = vertex.co.normalized()
        hit = tree.ray_cast(Vector((0,0,0)), direction, 3)[0]
        height = clamp(((hit.length if hit else 2.2)-2.2)/.045)
        vertex.co = direction*(2.2+.012*height)
    for polygon in smooth.data.polygons:
        polygon.use_smooth = True
    bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=5, radius=2.2)
    inner = bpy.context.object
    inner.name = 'Source_Globe_Inner'
    inner.data.materials.append(bpy.data.materials['Porcelain'])
    for polygon in inner.data.polygons:
        polygon.flip()
        polygon.use_smooth = True
    return smooth, inner


def resample(points, count=1025):
    distances = [0.0]
    for a,b in zip(points, points[1:]):
        distances.append(distances[-1]+(b-a).length)
    result = []
    for i in range(count):
        d = distances[-1]*i/(count-1)
        j = min(len(points)-2, max(0,bisect.bisect_right(distances,d)-1))
        result.append(points[j].lerp(points[j+1], (d-distances[j])/max(1e-9, distances[j+1]-distances[j])))
    return result, distances[-1]


def bezier(a, b, c, d, steps=96):
    a,b,c,d = map(Vector, (a,b,c,d))
    return [a*(1-t)**3+b*3*(1-t)**2*t+c*3*(1-t)*t*t+d*t**3
            for t in (i/steps for i in range(steps))]


def make_path(name, points, scene):
    data = bpy.data.curves.new(name, 'CURVE')
    data.dimensions = '3D'
    data.path_duration = 240
    data.resolution_u = 24
    spline = data.splines.new('BEZIER')
    spline.bezier_points.add(len(points)-1)
    for i, (point, co) in enumerate(zip(spline.bezier_points, points)):
        point.co = co
        tangent = (points[min(len(points)-1,i+1)]-points[max(0,i-1)])/6
        point.handle_left_type = point.handle_right_type = 'FREE'
        point.handle_left = co-tangent
        point.handle_right = co+tangent
    obj = bpy.data.objects.new(name, data)
    scene.collection.objects.link(obj)
    obj.hide_render = True
    return obj


def point_at(points, t):
    index = clamp(t)*(len(points)-1)
    i = min(len(points)-2, int(index))
    return points[i].lerp(points[i+1],index-i)


def frame_at(points, t):
    tangent = (point_at(points, min(1,t+.001))-point_at(points,max(0,t-.001))).normalized()
    # Kit's travel axis is +X, face normal -Y, and up +Z.
    normal = Vector((0,0,1))
    normal -= tangent*normal.dot(tangent)
    if normal.length < .01:
        normal = Vector((0,1,0))
        normal -= tangent*normal.dot(tangent)
    normal.normalize()
    side = normal.cross(tangent).normalized()
    from mathutils import Matrix
    return Matrix((tangent,side,normal)).transposed().to_quaternion()


def camera_pose(camera, location, target):
    camera.location = location
    camera.rotation_quaternion = (Vector(target)-camera.location).to_track_quat('-Z','Y')


def project(camera, point, width, height):
    view = camera.matrix_world.inverted() @ Vector(point)
    focal = width*camera.data.lens/camera.data.sensor_width
    if view.z >= 0:
        return None
    return (width/2+focal*view.x/-view.z, height/2-focal*view.y/-view.z)


def camera_point(camera, x, y, depth, width, height):
    focal = width*camera.data.lens/camera.data.sensor_width
    local = Vector(((x-width/2)*depth/focal, (height/2-y)*depth/focal, -depth))
    return camera.matrix_world @ local


def whiteout_plane(scene, camera, prefix):
    mesh = bpy.data.meshes.new(prefix+'ReviewWhiteout')
    mesh.from_pydata([(-2,-2,0),(2,-2,0),(2,2,0),(-2,2,0)],[],[(0,1,2,3)])
    obj = bpy.data.objects.new(prefix+'ReviewWhiteout',mesh)
    scene.collection.objects.link(obj)
    obj.parent = camera
    obj.location = (0,0,-.1)
    mat = bpy.data.materials.new(prefix+'ReviewWhiteout')
    mat.use_nodes = True
    nodes = mat.node_tree.nodes
    nodes.clear()
    out = nodes.new('ShaderNodeOutputMaterial')
    mix = nodes.new('ShaderNodeMixShader')
    transparent = nodes.new('ShaderNodeBsdfTransparent')
    emission = nodes.new('ShaderNodeEmission')
    emission.inputs['Color'].default_value=(1,1,1,1)
    mat.node_tree.links.new(transparent.outputs[0],mix.inputs[1])
    mat.node_tree.links.new(emission.outputs[0],mix.inputs[2])
    mat.node_tree.links.new(mix.outputs[0],out.inputs['Surface'])
    for p,value in [(0,0),(.63,0),(.64,1),(.68,1),(.71,0),(1,0)]:
        mix.inputs[0].default_value=value
        mix.inputs[0].keyframe_insert('default_value',frame=p*240)
    obj.data.materials.append(mat)
    for layer in mat.node_tree.animation_data.action.layers:
        for strip in layer.strips:
            for bag in strip.channelbags:
                for curve in bag.fcurves:
                    for key in curve.keyframe_points:key.interpolation='LINEAR'
    return obj


def review_materials(scene):
    """Use the shipped clay matcap in the approval renderer, in camera space."""
    cache = {}
    for obj in scene.objects:
        if obj.type != 'MESH' or obj.get('reviewOnly'):
            continue
        for slot in obj.material_slots:
            original = slot.material
            if original is None:
                continue
            if original.name not in cache:
                mat = bpy.data.materials.new('ReviewMat/'+original.name)
                mat['sourceMaterial'] = original.name
                mat.use_nodes = True
                nodes = mat.node_tree.nodes
                nodes.clear()
                out = nodes.new('ShaderNodeOutputMaterial')
                emission = nodes.new('ShaderNodeEmission')
                mat.node_tree.links.new(emission.outputs[0], out.inputs['Surface'])
                if original.name in ('Porcelain', 'GraticuleClay'):
                    geometry = nodes.new('ShaderNodeNewGeometry')
                    transform = nodes.new('ShaderNodeVectorTransform')
                    transform.vector_type='NORMAL';transform.convert_from='WORLD';transform.convert_to='CAMERA'
                    mat.node_tree.links.new(geometry.outputs['Normal'], transform.inputs[0])
                    scale = nodes.new('ShaderNodeVectorMath');scale.operation='MULTIPLY_ADD'
                    scale.inputs[1].default_value=(.5,.5,.5);scale.inputs[2].default_value=(.5,.5,.5)
                    mat.node_tree.links.new(transform.outputs[0],scale.inputs[0])
                    tex = nodes.new('ShaderNodeTexImage');tex.image=bpy.data.images.load(str(KIT/'Matcap_Clay.png'),check_existing=True)
                    mat.node_tree.links.new(scale.outputs[0],tex.inputs[0])
                    tint = nodes.new('ShaderNodeMixRGB');tint.blend_type='MULTIPLY';tint.inputs[0].default_value=1
                    tint.inputs[2].default_value=(1,1,1,1) if original.name=='Porcelain' else (.76,.76,.76,1)
                    mat.node_tree.links.new(tex.outputs['Color'],tint.inputs[1])
                    mat.node_tree.links.new(tint.outputs[0],emission.inputs['Color'])
                else:
                    emission.inputs['Color'].default_value=original.diffuse_color
                cache[original.name]=mat
            slot.link='OBJECT';slot.material=cache[original.name]


def inner_wall_material(material, width, height, focal):
    """A soft latitude-light band on the plain inner wall, not a second mesh."""
    material=material.copy();material.name='ReviewMat/InnerWall'+str(width)
    material['horizonInterpretation']='light band on interior wall'
    material['bandTopScreenFraction']=.8
    material.use_backface_culling=True
    nodes=material.node_tree.nodes;links=material.node_tree.links
    emission=next(n for n in nodes if n.type=='EMISSION')
    clay=emission.inputs['Color'].links[0].from_socket
    geometry=nodes.new('ShaderNodeNewGeometry')
    position=nodes.new('ShaderNodeVectorTransform');position.vector_type='POINT';position.convert_from='WORLD';position.convert_to='CAMERA'
    links.new(geometry.outputs['Position'],position.inputs[0])
    split=nodes.new('ShaderNodeSeparateXYZ');links.new(position.outputs[0],split.inputs[0])
    def operation(kind,a,b):
        node=nodes.new('ShaderNodeMath');node.operation=kind
        for index,value in enumerate((a,b)):
            if isinstance(value,(int,float)):node.inputs[index].default_value=value
            else:links.new(value,node.inputs[index])
        return node.outputs[0]
    depth=operation('MULTIPLY',split.outputs['Z'],-1)
    x=operation('MULTIPLY',operation('DIVIDE',split.outputs['X'],depth),focal/width)
    y=operation('MULTIPLY',operation('DIVIDE',split.outputs['Y'],depth),focal/height)
    sag=operation('MULTIPLY',operation('MULTIPLY',x,x),.5)
    band=operation('ADD',y,sag)
    ramp=nodes.new('ShaderNodeMapRange');ramp.clamp=True;ramp.interpolation_type='SMOOTHSTEP'
    ramp.inputs['From Min'].default_value=-.34;ramp.inputs['From Max'].default_value=-.30
    ramp.inputs['To Min'].default_value=.22;ramp.inputs['To Max'].default_value=0
    links.new(band,ramp.inputs['Value'])
    mix=nodes.new('ShaderNodeMixRGB');mix.inputs[1].default_value=(.991,.965,.939,1)
    links.new(ramp.outputs[0],mix.inputs[0]);links.new(clay,mix.inputs[2]);links.new(mix.outputs[0],emission.inputs['Color'])
    return material
