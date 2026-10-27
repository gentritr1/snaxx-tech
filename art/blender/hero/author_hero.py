"""Snaxx Tech hero: one canonical chocolate bonbon, rest and open poses in one scene.

Run headless from the repo root:
  /Applications/Blender.app/Contents/MacOS/Blender -b -P art/blender/hero/author_hero.py -- [--render] [--export]

Writes art/blender/hero/hero.blend, and with flags the contact-sheet renders
(renders/) and the browser asset (export/hero.glb).

Geometry is built in a local frame whose +Z is the opening axis; the root
empty tilts that axis 25 degrees off vertical so the closed ribbons read as
diagonal bands (reference 01B). Mechanics, in order:
  t 0.00-0.30  ribbons loosen from the shell (radius x1.48, width kept)
  t 0.30-0.75  the two halves slide apart along the opening axis, through the loose ribbons
  t 0.70-1.00  ribbons tighten around the amber core
A ring of radius r tilted by g from the opening axis clears a unit shell
sliding along that axis when r*cos(g) > 1 + band half-width; the loose radii
satisfy that, and check_intersections() verifies every frame.
"""
import math
import os
import sys

import bmesh
import bpy
from mathutils import Euler, Matrix, Vector
from mathutils.bvhtree import BVHTree

HERE = os.path.dirname(os.path.abspath(__file__))
ARGS = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []

R_OUT, R_IN = 1.0, 0.86  # shell thickness 0.14: visible chocolate on every cut edge
GROOVE = 0.03  # linear gap between panels
CORE_R = 0.62
AXIS_TILT = math.radians(25)
FRAMES = 120  # open clip: frame 1 = rest, frame 121 = open
OPEN_GAP = 1.35  # each half's travel along the axis
# (name, rest radius, loose radius, final radius, tilt Euler in the local frame)
RIBBONS = [
    # Rings sit nearly across the opening axis, tipped toward the camera so they read as diagonal bands.
    # Rest radii hug the shell (inner faces at 1.03 and 1.105); the two bands never share a radius.
    ("Ribbon_A", 1.065, 1.66, 0.86, (math.radians(24), math.radians(-6), 0)),
    ("Ribbon_B", 1.14, 1.80, 0.97, (math.radians(-20), math.radians(14), 0)),
]
RIBBON_WIDTH, RIBBON_THICK = 0.36, 0.07
if "--control" in ARGS:  # negative control for the intersection check: ribbons never loosen
    RIBBONS = [(n, r0, r0, rf, tilt) for n, r0, _, rf, tilt in RIBBONS]
WINDOW_LON = -100  # centre (deg) of the window panels left of the camera axis


# --------------------------------------------------------------------- scene
def reset():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    s = bpy.context.scene
    s.frame_start, s.frame_end = 1, FRAMES + 1
    s.render.fps = 60
    return s


def coll(name, parent=None):
    c = bpy.data.collections.new(name)
    (parent or bpy.context.scene.collection).children.link(c)
    return c


def link(obj, c):
    c.objects.link(obj)
    return obj


# ----------------------------------------------------------------- materials
def principled(name, **inputs):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    bsdf = next(n for n in m.node_tree.nodes if n.type == "BSDF_PRINCIPLED")
    for key, value in inputs.items():
        bsdf.inputs[key].default_value = value
    return m


def material_library():
    """Shared snack material family. Values are linear; the site mirrors them in three.js."""
    lib = {
        # Satin dark chocolate: warm, not black; light coat so bevels catch a highlight.
        "Chocolate": principled("Chocolate", **{"Base Color": (0.045, 0.016, 0.007, 1), "Roughness": 0.3,
                                                 "Coat Weight": 0.4, "Coat Roughness": 0.15}),
        # Glossy honey caramel (01B): saturated and mid-dark in the base so Neutral tone mapping
        # keeps it honey rather than washing it to peach; the coat carries the wet highlight.
        # Target on screen (measured from 01B): hue ~22 deg, saturation ~0.76, value ~0.73.
        "Caramel": principled("Caramel", **{"Base Color": (0.22, 0.045, 0.004, 1), "Roughness": 0.12,
                                             "Coat Weight": 1.0, "Coat Roughness": 0.05}),
        # Clear amber glass core with a low inner glow.
        # Target on screen (01B): hue ~24 deg, saturation ~0.98, value ~0.69. Bright emission
        # turns white under Neutral tone mapping, so the glow stays low and deep orange.
        # Opaque: transmission let the inner glow light clip it to pink-white (254,200,191).
        # The glassy read comes from the coat's reflections over a deep, faintly glowing body.
        # Base hue sits ~10 deg yellower than the target: bright orange drifts red under Neutral.
        "Amber": principled("Amber", **{"Base Color": (0.26, 0.055, 0.0, 1), "Roughness": 0.08,
                                         "Coat Weight": 0.6, "Coat Roughness": 0.02, "Coat IOR": 1.6,
                                         "Emission Color": (1.0, 0.3, 0.0, 1), "Emission Strength": 0.12}),
        # Warm porcelain (stands, exhibit bases).
        "Porcelain": principled("Porcelain", **{"Base Color": (0.80, 0.73, 0.62, 1), "Roughness": 0.22,
                                                 "Coat Weight": 1.0, "Coat Roughness": 0.08}),
        # Restrained pale gold: functional hardware only (loupe), never on the hero shell.
        "PaleGold": principled("PaleGold", **{"Base Color": (0.76, 0.58, 0.32, 1), "Metallic": 1.0,
                                               "Roughness": 0.3}),
        "Backdrop": principled("Backdrop", **{"Base Color": (0.93, 0.87, 0.77, 1), "Roughness": 0.9}),
    }
    for m in lib.values():
        m.use_fake_user = True
    try:
        lib["Amber"].surface_render_method = "DITHERED"
        lib["Amber"].use_raytrace_refraction = True
        lib["Caramel"].use_raytrace_refraction = True
    except AttributeError:
        pass
    return lib


# ------------------------------------------------------------------ geometry
def sph(lat, lon, r, zsign):
    cl = math.cos(lat)
    return Vector((r * cl * math.cos(lon), r * cl * math.sin(lon), zsign * r * math.sin(lat)))


def panel_mesh(name, lat0, lat1, lon0, lon1, zsign, full_ring=False):
    """A thick, curved shell panel between two latitudes and longitudes (degrees, local frame)."""
    g = GROOVE / 2
    la0 = math.radians(lat0) + (0 if lat0 == 0 else g / R_OUT)
    la1 = math.radians(lat1) - (0 if lat1 == 90 else g / R_OUT)
    nlat = max(3, round((lat1 - lat0) / 4))
    nlon = max(3, round((lon1 - lon0) / 4))
    bm = bmesh.new()
    grid = {}
    for layer, r in ((0, R_OUT), (1, R_IN)):
        for i in range(nlat + 1):
            lat = la0 + (la1 - la0) * i / nlat
            # Constant-width grooves: the longitude inset grows towards the pole.
            dl = 0 if full_ring else min(math.radians(8), g / (R_OUT * max(math.cos(lat), 0.05)))
            a0, a1 = math.radians(lon0) + dl, math.radians(lon1) - dl
            for j in range(nlon + 1):
                grid[layer, i, j] = bm.verts.new(sph(lat, a0 + (a1 - a0) * j / nlon, r, zsign))

    def quad(a, b, c, d):
        try:
            bm.faces.new((a, b, c, d))
        except ValueError:
            pass

    for i in range(nlat):
        for j in range(nlon):
            quad(grid[0, i, j], grid[0, i, j + 1], grid[0, i + 1, j + 1], grid[0, i + 1, j])
            quad(grid[1, i, j], grid[1, i + 1, j], grid[1, i + 1, j + 1], grid[1, i, j + 1])
    for j in range(nlon):  # latitude walls
        quad(grid[0, 0, j], grid[1, 0, j], grid[1, 0, j + 1], grid[0, 0, j + 1])
        if lat1 != 90:
            quad(grid[0, nlat, j], grid[0, nlat, j + 1], grid[1, nlat, j + 1], grid[1, nlat, j])
    if not full_ring:  # longitude walls
        for i in range(nlat):
            quad(grid[0, i, 0], grid[0, i + 1, 0], grid[1, i + 1, 0], grid[1, i, 0])
            quad(grid[0, i, nlon], grid[1, i, nlon], grid[1, i + 1, nlon], grid[0, i + 1, nlon])
    bmesh.ops.remove_doubles(bm, verts=bm.verts, dist=1e-5)
    bmesh.ops.dissolve_degenerate(bm, edges=bm.edges, dist=1e-6)
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    me = bpy.data.meshes.new(name)
    bm.to_mesh(me)
    bm.free()
    for p in me.polygons:
        p.use_smooth = True
    return me


def bevel(obj, width=0.014):
    mod = obj.modifiers.new("Bevel", "BEVEL")
    mod.width, mod.segments, mod.limit_method = width, 3, "ANGLE"
    mod.angle_limit = math.radians(35)
    mod.harden_normals = True
    return mod


def build_half(label, zsign, parent, c, mat):
    """One hemisphere: 2 latitude bands + a cap. The window panel is left out of band 1."""
    bands = [(0, 32, 10, WINDOW_LON - 18), (32, 62, 8, WINDOW_LON - 22.5)]
    count = 0
    for b, (lat0, lat1, n, start) in enumerate(bands):
        step = 360 / n
        for k in range(n):
            lon0 = start + k * step
            if b == 0 and k == 0:
                continue  # the art-directed window onto the core (01B)
            me = panel_mesh(f"{label}_b{b}_{k}", lat0, lat1, lon0, lon0 + step, zsign)
            ob = link(bpy.data.objects.new(me.name, me), c)
            ob.parent = parent
            me.materials.append(mat)
            bevel(ob)
            count += 1
    me = panel_mesh(f"{label}_cap", 62, 90, 0, 360, zsign, full_ring=True)
    ob = link(bpy.data.objects.new(me.name, me), c)
    ob.parent = parent
    me.materials.append(mat)
    bevel(ob)
    return count + 1


def ribbon_mesh(name, radius):
    """A broad band of honey caramel that follows the sphere: a slice of a spherical
    shell (every point between radius -/+ half the thickness), with rounded edges."""
    t = RIBBON_THICK / 2
    beta = math.asin(RIBBON_WIDTH / 2 / radius)
    arc = 12
    prof = []  # (radial, axial) in the ring's own frame, a closed loop
    for k in range(arc + 1):  # outer face, one edge to the other
        phi = -beta + 2 * beta * k / arc
        prof.append(((radius + t) * math.cos(phi), (radius + t) * math.sin(phi)))
    for phi, sign in ((beta, 1), (-beta, -1)):  # rounded edge, then the inner face back
        n = (math.cos(phi), math.sin(phi))
        tan = (-math.sin(phi) * sign, math.cos(phi) * sign)
        c = (radius * n[0], radius * n[1])
        for k in range(1, 6):  # outer -> inner on the first edge, inner -> outer on the second
            th = math.pi * k / 6 if sign > 0 else math.pi * (6 - k) / 6
            prof.append((c[0] + t * (math.cos(th) * n[0] + math.sin(th) * tan[0]),
                         c[1] + t * (math.cos(th) * n[1] + math.sin(th) * tan[1])))
        if sign > 0:
            for k in range(arc + 1):
                phi2 = beta - 2 * beta * k / arc
                prof.append(((radius - t) * math.cos(phi2), (radius - t) * math.sin(phi2)))
    segs = 160
    bm = bmesh.new()
    rings = []
    for s in range(segs):
        a = 2 * math.pi * s / segs
        rings.append([bm.verts.new((rr * math.cos(a), rr * math.sin(a), z)) for rr, z in prof])
    n = len(prof)
    for s in range(segs):
        r0, r1 = rings[s], rings[(s + 1) % segs]
        for k in range(n):
            bm.faces.new((r0[k], r0[(k + 1) % n], r1[(k + 1) % n], r1[k]))
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    me = bpy.data.meshes.new(name)
    bm.to_mesh(me)
    bm.free()
    for p in me.polygons:
        p.use_smooth = True
    return me


def build_hero(lib):
    c = coll("Hero")
    root = link(bpy.data.objects.new("Hero_Root", None), c)
    root.rotation_euler = (0, AXIS_TILT, 0)  # opening axis 25 deg off vertical, leaning right
    top = link(bpy.data.objects.new("Half_Top", None), c)
    bottom = link(bpy.data.objects.new("Half_Bottom", None), c)
    for h in (top, bottom):
        h.parent = root
    panels = build_half("Shell_Top", 1, top, c, lib["Chocolate"]) + build_half("Shell_Bottom", -1, bottom, c, lib["Chocolate"])

    bpy.ops.mesh.primitive_uv_sphere_add(segments=64, ring_count=32, radius=CORE_R)
    core = bpy.context.active_object
    core.name = "Core"
    for col in core.users_collection:
        col.objects.unlink(core)
    c.objects.link(core)
    core.parent = root
    core.data.materials.append(lib["Amber"])
    core.data.shade_smooth()

    # The core lights the shell from inside: inner faces, cut edges and grooves glow amber.
    # No shadow, so it passes the core; outward faces point away from it and stay unlit.
    glow = bpy.data.lights.new("Core_Glow", "POINT")
    glow.energy, glow.color, glow.shadow_soft_size = 60, (1.0, 0.45, 0.1), 0.3
    glow.use_shadow = False
    link(bpy.data.objects.new("Core_Glow", glow), c).parent = root

    ribbons = []
    for name, r0, _, _, tilt in RIBBONS:
        ob = link(bpy.data.objects.new(name, ribbon_mesh(name, r0)), c)
        ob.parent = root
        ob.rotation_euler = tilt
        ob.data.materials.append(lib["Caramel"])
        ribbons.append(ob)
    return root, top, bottom, core, ribbons, panels


# ----------------------------------------------------------------- animation
def key(obj, path, frame, value, index=-1):
    if index >= 0:
        getattr(obj, path)[index] = value
    else:
        setattr(obj, path, value)
    obj.keyframe_insert(path, index=index, frame=frame)


def animate(top, bottom, ribbons):
    f = lambda t: 1 + round(t * FRAMES)  # noqa: E731
    seam = GROOVE / 2
    for half, sign in ((top, 1), (bottom, -1)):
        for t, d in ((0, seam), (0.30, seam), (0.75, OPEN_GAP)):
            key(half, "location", f(t), sign * d, index=2)
    for (name, r0, r_loose, r_final, _), ob in zip(RIBBONS, ribbons):
        for t, r in ((0, r0), (0.30, r_loose), (0.70, r_loose), (1.0, r_final)):
            for i in (0, 1):  # scale the ring plane only, so the band keeps its width
                key(ob, "scale", f(t), r / r0, index=i)
    for ob in (top, bottom, *ribbons):
        ob.animation_data.action.name = f"{ob.name}_Open"
        for fc in _fcurves(ob.animation_data.action):
            for kp in fc.keyframe_points:
                kp.interpolation = "BEZIER"
                kp.easing = "AUTO"


def _fcurves(action):
    if hasattr(action, "fcurves"):
        return action.fcurves
    out = []  # Blender 5 layered actions
    for layer in action.layers:
        for strip in layer.strips:
            for bag in strip.channelbags:
                out.extend(bag.fcurves)
    return out


# ------------------------------------------------------------ verification
def world_bvh(obj, depsgraph):
    ev = obj.evaluated_get(depsgraph)
    me = ev.to_mesh()
    mw = ev.matrix_world
    verts = [mw @ v.co for v in me.vertices]
    polys = [tuple(p.vertices) for p in me.polygons]
    ev.to_mesh_clear()
    return BVHTree.FromPolygons(verts, polys)


def check_intersections(scene, groups, step=2):
    """Every frame (step 2): no part of one moving group may intersect another group."""
    names = list(groups)
    worst = []
    for frame in range(scene.frame_start, scene.frame_end + 1, step):
        scene.frame_set(frame)
        dg = bpy.context.evaluated_depsgraph_get()
        trees = {k: [world_bvh(o, dg) for o in v] for k, v in groups.items()}
        for i, a in enumerate(names):
            for b in names[i + 1:]:
                hits = sum(len(ta.overlap(tb)) for ta in trees[a] for tb in trees[b])
                if hits:
                    worst.append((frame, a, b, hits))
    scene.frame_set(scene.frame_start)
    return worst


def check_panels_static(scene, objs):
    dg = bpy.context.evaluated_depsgraph_get()
    trees = [(o.name, world_bvh(o, dg)) for o in objs]
    bad = []
    for i, (na, ta) in enumerate(trees):
        for nb, tb in trees[i + 1:]:
            if ta.overlap(tb):
                bad.append((na, nb))
    return bad


# ------------------------------------------------------------ light + camera
def stage(scene, lib):
    world = bpy.data.worlds.new("Cream")
    scene.world = world
    world.use_nodes = True
    bg = next(n for n in world.node_tree.nodes if n.type == "BACKGROUND")
    bg.inputs["Color"].default_value = (0.93, 0.87, 0.77, 1)  # site cream #F7F0E4 in linear
    # The site's cream (#F7F0E4) sits near linear 1.3 under Neutral tone mapping; no floor, the bonbon
    # levitates. As in three.js (scene.background vs environment), what the camera sees and what lights
    # the objects are separate: lit at full backdrop strength, every colour washed toward cream.
    nodes, links = world.node_tree.nodes, world.node_tree.links
    out = next(n for n in nodes if n.type == "OUTPUT_WORLD")
    bg.inputs["Strength"].default_value = 0.55  # lighting
    seen = nodes.new("ShaderNodeBackground")
    seen.inputs["Color"].default_value = bg.inputs["Color"].default_value
    seen.inputs["Strength"].default_value = 1.4  # backdrop
    path, mix = nodes.new("ShaderNodeLightPath"), nodes.new("ShaderNodeMixShader")
    links.new(path.outputs["Is Camera Ray"], mix.inputs["Fac"])
    links.new(bg.outputs["Background"], mix.inputs[1])
    links.new(seen.outputs["Background"], mix.inputs[2])
    links.new(mix.outputs["Shader"], out.inputs["Surface"])
    c = coll("Stage")

    # One light direction for the whole site: soft key from upper left, front.
    def area(name, loc, energy, size, color=(1, 0.96, 0.9)):
        light = bpy.data.lights.new(name, "AREA")
        light.energy, light.size, light.color = energy, size, color
        ob = link(bpy.data.objects.new(name, light), c)
        ob.location = loc
        ob.rotation_euler = (Vector((0, 0, 0)) - Vector(loc)).to_track_quat("-Z", "Y").to_euler()
        return ob

    area("Key", (-4.5, -5.5, 5.0), 1400, 5)
    area("Fill", (5.5, -4.0, 0.5), 300, 6, (1, 0.93, 0.85))
    area("Rim", (2.5, 6.0, 3.5), 900, 3)

    def cam(name, loc, target, angles, fit, res):
        """`angles`: (rest, open) field of view in degrees; held to t 0.3, widened by t 0.75."""
        data = bpy.data.cameras.new(name)
        data.sensor_fit = fit
        ob = link(bpy.data.objects.new(name, data), c)
        ob.location = loc
        ob.rotation_euler = (Vector(target) - Vector(loc)).to_track_quat("-Z", "Y").to_euler()
        ob["resolution"] = res
        for t, a in ((0, angles[0]), (0.30, angles[0]), (0.75, angles[1])):
            # `angle` follows the sensor width whatever the fit; set the fitted axis explicitly.
            if fit == "VERTICAL":
                data.angle_y = math.radians(a)
            else:
                data.angle_x = math.radians(a)
            data.keyframe_insert("lens", frame=1 + round(t * FRAMES))
        return ob

    # Desktop (01B): the closed bonbon fills ~60% of the height, centred at ~2/3 across;
    # the copy column on the left stays clear. The shot widens as the halves part.
    desk = cam("Cam_Desktop", (-1.0, -11.5, 0.6), (-1.0, 0, 0), (16, 24), "VERTICAL", (1600, 900))
    # Phone: subject in the top half, copy below it (its own composition, not a crop).
    phone = cam("Cam_Phone", (0, -12.5, -1.3), (0, 0, -1.3), (13.5, 16.5), "HORIZONTAL", (780, 1688))
    return desk, phone


def render_settings(scene):
    for engine in ("BLENDER_EEVEE", "BLENDER_EEVEE_NEXT"):
        try:
            scene.render.engine = engine
            break
        except TypeError:
            continue
    ee = scene.eevee
    for attr, value in (("taa_render_samples", 64), ("use_raytracing", True), ("use_shadows", True)):
        if hasattr(ee, attr):
            setattr(ee, attr, value)
    # The site tone-maps with Khronos PBR Neutral; render with the same curve. (The view list is
    # built at runtime from OCIO, so the RNA enum reads empty: assign by name.)
    scene.view_settings.view_transform = "Khronos PBR Neutral"
    print("VIEW_TRANSFORM", scene.view_settings.view_transform)
    scene.render.image_settings.file_format = "PNG"
    scene.render.film_transparent = False


def render_sheet(scene, desk, phone):
    out = os.path.join(HERE, "renders")
    os.makedirs(out, exist_ok=True)
    shots = [(desk, t) for t in (0, 0.25, 0.5, 0.75, 1)] + [(phone, 0), (phone, 1)]
    for camera, t in shots:
        scene.camera = camera
        w, h = camera["resolution"]
        scene.render.resolution_x, scene.render.resolution_y = w // 2, h // 2
        scene.frame_set(1 + round(t * FRAMES))
        scene.render.filepath = os.path.join(out, f"{camera.name[4:].lower()}_{int(t * 100):03d}.png")
        bpy.ops.render.render(write_still=True)
        print("RENDERED", scene.render.filepath)
    scene.frame_set(1)
    contact_sheet(out)


def contact_sheet(out):
    """Desktop rest/25/50/75/open in reading order, then phone rest + open, on the site cream."""
    import numpy as np

    def load(name):
        img = bpy.data.images.load(os.path.join(out, name + ".png"))
        px = np.array(img.pixels[:], dtype=np.float32).reshape(img.size[1], img.size[0], 4)
        return px  # rows run bottom-up

    def fit(px, h):  # nearest-neighbour resize to height h
        ys = (np.arange(h) * px.shape[0] / h).astype(int)
        w = int(px.shape[1] * h / px.shape[0])
        xs = (np.arange(w) * px.shape[1] / w).astype(int)
        return px[ys][:, xs]

    cw, ch = 800, 450
    sheet = np.ones((ch * 2, cw * 3, 4), dtype=np.float32) * np.array([0.97, 0.94, 0.89, 1.0], dtype=np.float32)
    cells = ["desktop_000", "desktop_025", "desktop_050", "desktop_075", "desktop_100"]
    for i, name in enumerate(cells):
        px = fit(load(name), ch)
        row, col = divmod(i, 3)
        y0 = (1 - row) * ch  # top row first, in a bottom-up buffer
        sheet[y0:y0 + ch, col * cw:col * cw + px.shape[1]] = px
    x = 2 * cw + 120
    for name in ("phone_000", "phone_100"):
        px = fit(load(name), ch)
        sheet[0:ch, x:x + px.shape[1]] = px
        x += px.shape[1] + 40
    img = bpy.data.images.new("contact_sheet", cw * 3, ch * 2)
    img.pixels[:] = sheet.ravel()
    img.filepath_raw = os.path.join(out, "contact_sheet.png")
    img.file_format = "PNG"
    img.save()
    print("SHEET", img.filepath_raw)


def export_glb(root):
    out = os.path.join(HERE, "export")
    os.makedirs(out, exist_ok=True)
    bpy.ops.object.select_all(action="DESELECT")
    for ob in [root, *root.children_recursive]:
        ob.select_set(True)
    path = os.path.join(out, "hero.glb")
    bpy.ops.export_scene.gltf(
        filepath=path, export_format="GLB", use_selection=True, export_apply=True,
        export_animations=True, export_animation_mode="SCENE", export_cameras=False, export_lights=False,
        export_yup=True, export_draco_mesh_compression_enable=False,
    )
    print("EXPORTED", path, os.path.getsize(path), "bytes")


def main():
    scene = reset()
    lib = material_library()
    root, top, bottom, core, ribbons, panels = build_hero(lib)
    animate(top, bottom, ribbons)
    desk, phone = stage(scene, lib)
    render_settings(scene)
    scene.frame_set(1)

    shell_top = [o for o in top.children]
    shell_bottom = [o for o in bottom.children]
    print("PANELS", panels, "top", len(shell_top), "bottom", len(shell_bottom))
    static = check_panels_static(scene, shell_top + shell_bottom)
    print("STATIC_OVERLAPS", len(static), static[:6])
    groups = {"top": shell_top, "bottom": shell_bottom, "core": [core], "ribbon_a": [ribbons[0]], "ribbon_b": [ribbons[1]]}
    hits = check_intersections(scene, groups)
    print("MOVING_OVERLAPS", len(hits), hits[:12])

    if "--control" in ARGS:
        return
    bpy.ops.wm.save_as_mainfile(filepath=os.path.join(HERE, "hero.blend"))
    if "--export" in ARGS:
        export_glb(root)
    if "--render" in ARGS:
        render_sheet(scene, desk, phone)


main()
