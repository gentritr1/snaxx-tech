"""V3 film authoring, run in Blender. Runtime choreography is gated on film approval."""
import sys
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parent))
from journey_common import *
import json

bpy.ops.wm.open_mainfile(filepath=str(KIT/'red-thread-kit.blend'))
source_scene = bpy.context.scene
sources = {n:bpy.data.objects[n] for n in ['Tile_F','Tile_J','Tile_A','Tile_L','Tile_E','Globe','Graticule','Pin','Plane','Arrow']}
for name,obj in sources.items():
    obj.name = 'Source/'+name
smooth, inner = make_lods(sources['Globe'])
sources.update(Globe_Smooth=smooth,Globe_Inner=inner)

# The reference's clay projectile has a folded silhouette, while the old kit's
# tetrahedron reads as a dark needle. Keep its .5-unit contract and low budget.
arrow_mesh=bpy.data.meshes.new('Reference clay arrow')
arrow_mesh.from_pydata([(.285714,0,.0357),(-.214286,-.1964,0),(-.125,-.025,-.0357),(-.214286,0,.0286),(-.125,.025,-.0357),(-.214286,.1964,0)],[],[(0,2,1),(0,3,2),(0,4,3),(0,5,4)])
arrow_mesh.materials.append(bpy.data.materials['Porcelain'])
sources['Arrow'].data=arrow_mesh
bpy.ops.object.select_all(action='DESELECT');sources['Arrow'].select_set(True);bpy.context.view_layer.objects.active=sources['Arrow']
thickness=sources['Arrow'].modifiers.new('Clay paper thickness','SOLIDIFY');thickness.thickness=.008
bpy.ops.object.modifier_apply(modifier=thickness.name)
edge=sources['Arrow'].modifiers.new('Soft clay edge','BEVEL');edge.width=.002;edge.segments=2
bpy.ops.object.modifier_apply(modifier=edge.name)

# Two scenes share these mesh data-blocks; their transforms live in separate actions.
LAYOUTS = {
    '1440': {'width':1440,'height':900,'tileSize':112,'centres':[(354,300),(544,330),(726,335),(895,320),(1066,300)],
             'focal':7000,'globeCentre':(1114/1440,433/900),'globeRadius':275,'arrowCount':70,'arrowSpacing':.009,
             'zones':{'word':[0,470,1440,700],'world':[48,150,640,620],'descent':[820,110,1360,330],'arrow':[48,150,640,620]}},
    '390': {'width':390,'height':844,'tileSize':58,'centres':[(63,238),(129,246),(195,252),(261,246),(327,238)],
            'focal':5000,'globeCentre':(272/390,559/844),'globeRadius':117,'arrowCount':35,'arrowSpacing':.018,
            'zones':{'word':[24,330,366,720],'world':[24,118,366,330],'descent':[24,118,366,330],'arrow':[24,118,366,330]}}
}

INTERIOR_ROTATION = Quaternion((1,0,0),math.radians(8))
R = 3.0
G = Vector((18,0,0))
WORD_ORIGIN=Vector((-3,0,8))
normal = Vector((-.08,-math.sqrt(math.tan(math.radians(12))**2-.08**2),1)).normalized()
u_axis = Vector((1,0,.08)).normalized()
v_axis = normal.cross(u_axis).normalized()
WRAP_SWEEP = math.tau
pin_direction=(u_axis*.45-v_axis*.64+normal*.62).normalized()
PIN=G+R*pin_direction
WRAP_POINTS=[G+(R+.055)*(u_axis*math.cos(math.pi-math.tau*i/1024)+v_axis*math.sin(math.pi-math.tau*i/1024))+normal*R*(.175-.35*i/1024) for i in range(1025)]
exit_direction=(WRAP_POINTS[-1]-G).normalized()
launch_direction=(u_axis*.85+v_axis*.2+normal*.6).normalized()
WRAP_POINTS.extend(G+(R+.055)*exit_direction.lerp(launch_direction,i/256).normalized() for i in range(1,257))
L_OUT=resample(WRAP_POINTS)[1]*.66/.12


def catmull(points, steps=48):
    result=[]
    points=list(map(Vector,points))
    for i in range(len(points)-1):
        a=points[max(0,i-1)];b=points[i];c=points[i+1];d=points[min(len(points)-1,i+2)]
        result.extend(bezier(b,b+(c-a)/6,c-(d-b)/6,c,steps))
    result.append(points[-1])
    return result


def author_path(layout):
    w,h,F=layout['width'],layout['height'],layout['focal']
    edge_y=209 if w==390 else 143
    anchors=[(-20,edge_y),*layout['centres'],(w+20,edge_y)]
    pixel_path=catmull([(x-w/2,0,h/2-y) for x,y in anchors])
    _,pixel_length=resample(pixel_path)
    pixel_scale=(L_OUT*.06/.66)/pixel_length
    word=[p*pixel_scale+WORD_ORIGIN for p in pixel_path]
    d_word=F*pixel_scale
    left=WRAP_POINTS[0]
    d1=math.sqrt((F*R/layout['globeRadius'])**2+R**2)
    c1=G+Vector((-(layout['globeCentre'][0]-.5)*w/F*d1,-d1,(layout['globeCentre'][1]-.5)*h/F*d1))
    def screen(x,y):
        return c1+Vector(((x-w/2)*d1/F,d1,(h/2-y)*d1/F))
    shoulder=([screen(-100,820),screen(150,680),screen(400,590),screen(640,510),left]
              if w==1440 else [screen(-90,740),screen(0,690),screen(80,650),screen(160,620),left])
    target=L_OUT*.24/.66
    def approach_at(depth):
        bridge=word[-1].lerp(shoulder[0],.5)+Vector((0,depth if w==1440 else -depth,0))
        return catmull([word[-1],bridge,*shoulder])
    low,high=0,80
    for _ in range(50):
        depth=(low+high)/2
        if resample(approach_at(depth))[1]<target:low=depth
        else:high=depth
    approach=approach_at((low+high)/2)
    _,approach_length=resample(approach)
    assert abs(approach_length-target)<.03,(approach_length,target)
    visible_length=approach_length
    seam=WRAP_POINTS[-1]
    wrap=WRAP_POINTS
    # Author the descent in the pin-facing camera. Its earlier section travels
    # behind the globe and outside this crop; the visible arc approaches the pin.
    from types import SimpleNamespace
    probe=SimpleNamespace()
    # The pin/globe fit leaves one camera-orbit degree of freedom. Choose it
    # offline so the previous act's cord is hidden by the globe or outside crop.
    prefix_samples=resample(word+approach[1:]+wrap[1:],401)[0]
    best=(float('inf'),0)
    for angle in range(0,360,10):
        layout['descentOrbitDegrees']=angle
        descent_composition(probe,.55,layout)
        inv=probe.rotation_quaternion.inverted();score=0
        for point in prefix_samples:
            local=inv@(point-probe.location)
            if local.z>=0:continue
            x=w/2+F*local.x/-local.z;y=h/2-F*local.y/-local.z
            if not(0<x<w and 0<y<h):continue
            delta=point-probe.location;direction=delta.normalized();offset=probe.location-G
            b=offset.dot(direction);disc=b*b-offset.length_squared+R*R
            blocked=disc>=0 and -b-math.sqrt(disc)<delta.length-.08
            if not blocked:score+=1
        if score<best[0]:best=(score,angle)
    layout['descentOrbitDegrees']=best[1]
    print('DESCENT ORBIT',w,best[1],'degrees; prior-cord visible samples',best[0],flush=True)
    descent_composition(probe,.55,layout)
    inverse=probe.rotation_quaternion.inverted()
    globe_depth=-(inverse@(G-probe.location)).z
    def at_pixel(x,y,depth):
        return probe.location+probe.rotation_quaternion@Vector(((x-w/2)*depth/F,(h/2-y)*depth/F,-depth))
    def front_depth(x,y):
        ray=Vector(((x-w/2)/F,(h/2-y)/F,-1)).normalized()
        direction=probe.rotation_quaternion@ray
        offset=probe.location-G;b=offset.dot(direction)
        discriminant=b*b-offset.length_squared+R*R
        return ((-b-math.sqrt(discriminant)-.055)*-ray.z) if discriminant>=0 else globe_depth
    if w==1440:
        arc_pixels=bezier((150,-80,0),(800,650,0),(650,500,0),(1195,554,0),512)
        hidden_pixels=[(1800,700),(1800,-300),(150,-300),(150,-80)]
        peak_q=.17
    else:
        arc_pixels=bezier((-30,335,0),(140,310,0),(220,495,0),(324,450,0),512)
        hidden_pixels=[(400,844),(400,860),(-30,860),(-30,335)]
        peak_q=.34
    first_surface=next(i/512 for i,pixel in enumerate(arc_pixels) if i/512>peak_q and front_depth(pixel.x,pixel.y)<globe_depth-.1)
    def descent(depth,late_depth):
        hidden_depth=globe_depth+R+1
        hidden=catmull([seam,*[at_pixel(x,y,hidden_depth) for x,y in hidden_pixels]])
        arc=[]
        for i,pixel in enumerate(arc_pixels):
            q=i/512;surface=front_depth(pixel.x,pixel.y)
            if q<peak_q:z=lerp(hidden_depth,globe_depth+depth,cubic(q/peak_q))
            elif q<first_surface:
                fraction=phase(q,peak_q,first_surface)
                z=lerp(globe_depth+depth,surface,cubic(fraction))+depth*late_depth*math.sin(math.pi*fraction)**2
            else:z=surface
            arc.append(at_pixel(pixel.x,pixel.y,z))
        arc[-1]=PIN
        return hidden+arc[1:]
    target=L_OUT*.24/.66
    def fit_length(late_depth):
        low,high=0,80
        for _ in range(24):
            depth=(low+high)/2
            points=descent(depth,late_depth)
            length=sum((b-a).length for a,b in zip(points,points[1:]))
            if length<target:low=depth
            else:high=depth
        points=descent((low+high)/2,late_depth)
        peak_index=len(points)-513+round(peak_q*512)
        to_peak=sum((b-a).length for a,b in zip(points[:peak_index],points[1:peak_index+1]))
        return points,to_peak/target
    low,high=0,8
    target_peak=(.55-.42)/(.66-.42)
    for _ in range(14):
        late_depth=(low+high)/2
        descent_points,peak_fraction=fit_length(late_depth)
        if peak_fraction>target_peak:low=late_depth
        else:high=late_depth
    print('DESCENT PEAK',w,'fraction',peak_fraction,'target',target_peak,'late depth',late_depth,flush=True)
    outside=word+approach[1:]+wrap[1:]+descent_points[1:]
    outside,outside_length=resample(outside,2049)
    # The inside lives beyond the covered cut, physically distant from the
    # exterior. Its bridge is not shown; the two stage collections swap under white.
    inside_local=[]
    for i in range(513):
        q=lerp(-.63,1,i/512)
        if w==1440:
            x=lerp(0,1840,q)
            y=lerp(700,120,q)+300*math.sin(math.pi*q)
        else:
            x=lerp(0,480,q)
            y=lerp(650,350,q)+35*math.sin(math.pi*q)
        depth=36-2*q
        inside_local.append(Vector(((x-w/2)/F*depth,depth,(h/2-y)/F*depth)))
    inner_camera=PIN-inside_local[0]
    inside_seed=[inner_camera+point for point in inside_local]
    inside_points,inside_length=resample(inside_seed,2049)
    # Place all of the inner path beyond the wall; its first point is the crossing.
    # At least 40% of total length must belong to this segment.
    if inside_length<outside_length*2/3:
        scale=outside_length*.668/inside_length
        inside_points=[PIN+(point-PIN)*scale for point in inside_points]
        inner_camera=PIN+(inner_camera-PIN)*scale
    inside_points=[PIN+INTERIOR_ROTATION@(point-PIN) for point in inside_points]
    inner_camera=PIN+INTERIOR_ROTATION@(inner_camera-PIN)
    all_points,total=resample(outside+inside_points[1:])
    t_in=outside_length/total
    def nearest(point):
        best=(float('inf'),0)
        for i,(a,b) in enumerate(zip(all_points,all_points[1:])):
            delta=b-a
            fraction=clamp((point-a).dot(delta)/max(delta.length_squared,1e-12))
            distance=(point-a.lerp(b,fraction)).length_squared
            if distance<best[0]:best=(distance,(i+fraction)/1024)
        return best[1]
    word_length=resample(word)[1]
    result={'points':all_points,'length':total,'t_in':t_in,'wordEnd':word_length/total,'limb':(word_length+visible_length)/total,
            'wrapStart':(word_length+approach_length)/total,'wrapEnd':outside_length*.42/.66/total,'insideCamera':list(inner_camera),
            'dWord':d_word,'tileScale':layout['tileSize']*pixel_scale,'wordCentres':[nearest(Vector((x-w/2,0,h/2-y))*pixel_scale+WORD_ORIGIN) for x,y in layout['centres']]}
    return result


def material_thread(prefix):
    mat=bpy.data.materials['Vermilion'].copy();mat.name=prefix+'EmissiveCord'
    node=mat.node_tree.nodes.get('Principled BSDF')
    node.inputs['Base Color'].default_value=(0,0,0,1)
    node.inputs['Emission Color'].default_value=bpy.data.materials['Vermilion'].diffuse_color
    node.inputs['Emission Strength'].default_value=1
    node.inputs['Subsurface Weight'].default_value=0
    node.inputs['Coat Weight'].default_value=1
    node.inputs['Coat Roughness'].default_value=.12
    return mat


def pair_orientation(camera, position, first, second, first_pixel, second_pixel, layout):
    """Aim two world rays at their authored composition, preserving chord angle."""
    from mathutils import Matrix
    def basis(a,b):
        a=a.normalized();b=(b-a*a.dot(b)).normalized();c=a.cross(b).normalized()
        return Matrix((a,b,c)).transposed()
    w,h,F=layout['width'],layout['height'],layout['focal']
    a=Vector(((first_pixel[0]-w/2)/F,(h/2-first_pixel[1])/F,-1))
    b=Vector(((second_pixel[0]-w/2)/F,(h/2-second_pixel[1])/F,-1))
    camera.location=position
    camera.rotation_quaternion=(basis(Vector(first)-position,Vector(second)-position)@basis(a,b).inverted()).to_quaternion()


def mesh_pixels(obj,camera,layout):
    # obj.matrix_world is updated by the depsgraph after each pose is set.
    corners=[project(camera,obj.matrix_world@Vector(c),layout['width'],layout['height']) for c in obj.bound_box]
    corners=[c for c in corners if c]
    if not corners:return None
    return [min(p[0] for p in corners),min(p[1] for p in corners),max(p[0] for p in corners),max(p[1] for p in corners)]


def size_object(obj,camera,pixels,layout):
    obj.scale=(1,1,1);bpy.context.view_layer.update()
    box=mesh_pixels(obj,camera,layout)
    if box:
        obj.scale=(pixels/max(box[2]-box[0],box[3]-box[1],1),)*3


def projected_rider_rotation(camera,position,tangent,bank):
    # Align the visible nose with the projected cord tangent; bank is authored.
    local=camera.rotation_quaternion.inverted()@tangent
    angle=math.atan2(local.y,local.x)
    return camera.rotation_quaternion @ Quaternion((0,0,1),angle) @ Quaternion((1,0,0),bank)


def descent_composition(camera, p, layout):
    """Keep the fixed surface pin and the globe horizon in the reference crop."""
    from mathutils import Matrix
    w,h,F=layout['width'],layout['height'],layout['focal']
    progress=cubic(phase(p,.55,.63))
    if w==1440:
        globe_pixel=(1232,1193)
        radius=lerp(927,990,progress)
        plane_pixel=(1232+(1195-1232)*radius/927,1193+(554-1193)*radius/927)
    else:
        globe_pixel=(340,980)
        radius=lerp(630,680,progress)
        plane_pixel=(340+(324-340)*radius/630,980+(450-980)*radius/630)
    def ray(pixel):
        return Vector(((pixel[0]-w/2)/F,(h/2-pixel[1])/F,-1)).normalized()
    globe_ray,plane_ray=ray(globe_pixel),ray(plane_pixel)
    distance=math.sqrt((F*R/radius)**2+R**2)
    delta=PIN-G
    cosine=globe_ray.dot(plane_ray)
    discriminant=delta.length_squared-distance**2*(1-cosine*cosine)
    # Near the pin the desired rays can separate farther than the physical
    # plane/globe chord. Converge on the pin rather than losing the globe.
    for _ in range(32):
        if discriminant>=0:break
        plane_ray=plane_ray.lerp(globe_ray,.1).normalized()
        cosine=globe_ray.dot(plane_ray)
        discriminant=delta.length_squared-distance**2*(1-cosine*cosine)
    plane_distance=distance*cosine-math.sqrt(max(0,discriminant))
    camera_delta=plane_ray*plane_distance-globe_ray*distance
    def basis(a,up):
        a=a.normalized();b=up-a*up.dot(a)
        if b.length<.01:b=Vector((1,0,0))-a*a.x
        b.normalize();return Matrix((a,b,a.cross(b))).transposed()
    rotation=(basis(delta,Vector((0,0,1)))@basis(camera_delta,Vector((0,1,0))).inverted()).to_quaternion()
    camera.rotation_quaternion=rotation
    camera.location=G-rotation@(globe_ray*distance)
    orbit=Quaternion((PIN-G).normalized(),math.radians(layout.get('descentOrbitDegrees',0)))
    camera.location=G+orbit@(camera.location-G)
    camera.rotation_quaternion=orbit@camera.rotation_quaternion


if '--paths-only' in sys.argv:
    for name,layout in LAYOUTS.items():
        path=author_path(layout)
        print('PATH',name,json.dumps({k:v for k,v in path.items() if k not in ('points',)}))
    sys.exit(0)

def build_scene(name,layout):
    scene=bpy.data.scenes.new('Journey '+name)
    scene['referenceRevision']='v3.1'
    bpy.context.window.scene=scene
    scene.render.engine='BLENDER_EEVEE'
    scene.render.resolution_x=layout['width'];scene.render.resolution_y=layout['height'];scene.render.resolution_percentage=100
    scene.render.fps=24;scene.frame_start=0;scene.frame_end=240
    scene.view_settings.view_transform='Standard'
    scene.view_settings.look='None'
    scene.view_settings.exposure=0;scene.view_settings.gamma=1
    scene.render.image_settings.file_format='PNG'
    scene.render.image_settings.color_mode='RGB'
    scene.world=bpy.data.worlds.new('Studio '+name);scene.world.use_nodes=True
    scene.world.node_tree.nodes['Background'].inputs['Color'].default_value=(.991,.965,.939,1)
    scene.world.node_tree.nodes['Background'].inputs['Strength'].default_value=1
    if hasattr(scene.eevee,'taa_render_samples'):scene.eevee.taa_render_samples=32
    prefix=name+'/'
    action=bpy.data.actions.new('Journey_'+name)
    objects={key:linked_object(source,prefix+key,scene,action) for key,source in sources.items()}
    camera_data=bpy.data.cameras.new(prefix+'Camera')
    camera_data.sensor_fit='HORIZONTAL';camera_data.sensor_width=36
    camera_data.lens=layout['focal']*36/layout['width'];camera_data.clip_start=.02;camera_data.clip_end=5000
    camera=bpy.data.objects.new(prefix+'Camera',camera_data);camera.rotation_mode='QUATERNION';scene.collection.objects.link(camera);scene.camera=camera
    camera['sensorFit']='HORIZONTAL';camera['referenceWidth']=layout['width'];camera['referenceHeight']=layout['height']
    action_for(camera,action);objects['Camera']=camera
    path=author_path(layout);points=path['points'];tin=path['t_in']
    thread=make_path(prefix+'Thread',points,scene);thread.data.bevel_depth=.055;thread.data.bevel_resolution=7
    objects['Thread']=thread
    review=linked_object(thread,prefix+'ReviewThread',scene);review.data=thread.data.copy();review.hide_render=False
    review.data.materials.clear();review.data.materials.append(material_thread(prefix))
    review['reviewOnly']=True
    arrows=[]
    for i in range(layout['arrowCount']):
        arrow=linked_object(sources['Arrow'],prefix+f'Arrow_{i:03d}',scene,action)
        follow=arrow.constraints.new('FOLLOW_PATH');follow.name='Authored cord ride';follow.target=thread
        follow.use_fixed_location=True;follow.use_curve_follow=True;follow.forward_axis='FORWARD_X';follow.up_axis='UP_Z'
        arrows.append(arrow);objects[f'Arrow_{i:03d}']=arrow
    whiteout=whiteout_plane(scene,camera,prefix);whiteout['reviewOnly']=True
    for label,location,power,size in [('Key',(-6,8,-8),1000,10),('Fill',(6,3,-5),350,8)]:
        data=bpy.data.lights.new(prefix+label,'AREA');data.energy=power;data.shape='DISK';data.size=size
        light=bpy.data.objects.new(prefix+label,data);scene.collection.objects.link(light)
        light.parent=camera;light.location=location
        light.rotation_euler=(Vector((0,0,-16))-light.location).to_track_quat('-Z','Y').to_euler();light['reviewOnly']=True
    floor_data=bpy.data.meshes.new(prefix+'ReviewFloor')
    floor_data.from_pydata([(-200,-200,-3),(200,-200,-3),(200,200,-3),(-200,200,-3)],[],[(0,1,2,3)])
    floor=bpy.data.objects.new(prefix+'ReviewFloor',floor_data);scene.collection.objects.link(floor);floor.data.materials.append(bpy.data.materials['Porcelain']);floor['reviewOnly']=True
    w,h,F=layout['width'],layout['height'],layout['focal']
    d1=math.sqrt((F*R/layout['globeRadius'])**2+R**2)
    c0=WORD_ORIGIN+Vector((0,-path['dWord'],0))
    c1=G+Vector((-(layout['globeCentre'][0]-.5)*w/F*d1,-d1,(layout['globeCentre'][1]-.5)*h/F*d1))
    inner_base=Vector(path['insideCamera'])
    reference_t=tin+inside_parameter(inside_u(.78))*(1-tin)
    reference_point=point_at(points,reference_t)
    # Camera offset accounts for the kit origin being behind its projected centre.
    plane_target=(1260,216) if w==1440 else (304.5,412)
    local_reference=INTERIOR_ROTATION.inverted()@(reference_point-PIN)
    local_camera=INTERIOR_ROTATION.inverted()@(inner_base-PIN)
    depth=local_reference.y-local_camera.y
    local_camera.x=local_reference.x-(plane_target[0]-w/2)*depth/F
    local_camera.z=local_reference.z+(plane_target[1]-h/2)*depth/F
    inner_base=PIN+INTERIOR_ROTATION@local_camera
    inner_radius=max(70,depth*1.3)
    snapshots=[];arrow_poses=[[] for _ in arrows]
    initial_gap=(path['wordCentres'][1]-path['wordCentres'][0])*path['length']
    end_gap=(layout['centres'][1][0]-layout['centres'][0][0])*.45*d1/F
    for frame in range(241):
        scene.frame_set(frame);p=frame/240
        q=quart(phase(p,.20,.30))
        opening_camera=c0.lerp(c1,q)
        opening_camera.x=lerp(c0.x,c1.x,q*(2-q))
        camera_pose(camera,opening_camera,opening_camera+Vector((0,1,0)))
        # Every solid is transformed in this one action. Visibility swaps are
        # baked as zero scales so glTF can reproduce them without a visibility API.
        for key in ('Globe','Globe_Smooth','Graticule'):
            objects[key].location=G;objects[key].scale=(R/2.2,)*3
            objects[key].rotation_quaternion=Quaternion((0,0,1),lerp(-.6,.55,q)+.1*phase(p,.30,.42))
        pin=objects['Pin'];pin.location=PIN;pin.rotation_quaternion=Quaternion()
        elapsed=max(0,(p-.42)*10)
        spring=1+math.exp(-8.4*elapsed)*(-math.cos(11.2*elapsed)+(8.040487340577169-8.4)/11.2*math.sin(11.2*elapsed))
        spring=lerp(spring,1,cubic(phase(p,.455,.46)))
        pin.scale=((R/2.2)*(spring if .42<=p<.46 else 1),)*3 if p>=.42 else (0,0,0)
        plane=objects['Plane']
        if p<.42:
            plane_t=path['wrapEnd']+.003
            plane.location=G+Vector((1,1,1));plane.rotation_quaternion=Quaternion();plane.scale=(1,1,1)
        else:
            plane_t=lerp(path['wrapEnd'],tin,phase(p,.42,.66))
            plane.location=point_at(points,plane_t);plane.rotation_quaternion=frame_at(points,plane_t)
            plane.rotation_quaternion @= Quaternion((1,0,0),math.radians(lerp(12,18,phase(p,.50,.63))))
        if .42<=p<.67:
            d=lerp(d1,7.1*R,cubic(phase(p,.45,.63)))
            if p>.63:d=lerp(7.1*R,7.07*R,phase(p,.63,.66))
            direction=(c1-G).normalized().lerp((PIN-G).normalized(),quart(phase(p,.48,.63))).normalized()
            direction=Quaternion((0,0,1),math.radians(18)*cubic(phase(p,.60,.63)))@direction
            position=G+direction*d
            target_a=(lerp(.84*w, min(760,.43*w),quart(phase(p,.42,.45))),lerp(.30*h,.49*h,quart(phase(p,.42,.50))))
            if w==390:target_a=(195,520)
            target_b=(.86*w,.86*h)
            pair_orientation(camera,position,plane.location,point_at(points,plane_t-.025),target_a,(target_a[0]-450,target_a[1]-260),layout)
            if p<.50:
                blend=quart(phase(p,.48,.50))
                final_q=camera.rotation_quaternion.copy()
                base_q=(Vector((0,1,0))).to_track_quat('-Z','Y')
                camera.rotation_quaternion=base_q.slerp(final_q,blend)
                base_position=c1 if p<.45 else G+(c1-G).normalized()*d
                camera.location=base_position.lerp(position,blend)
        if p>=.67:
            dolly=.04*depth*(phase(p,.68,.90)-phase(.78,.68,.90))
            plane_t=tin+inside_parameter(inside_u(p))*(1-tin)
            tracking=INTERIOR_ROTATION.inverted()@(point_at(points,plane_t)-reference_point)
            tracking.y=0
            position=inner_base+INTERIOR_ROTATION@(Vector((0,dolly,0))+tracking)
            camera_pose(camera,position,position+INTERIOR_ROTATION@Vector((0,1,0)))
            if p>.90:camera.rotation_quaternion @= Quaternion((1,0,0),math.radians(-12)*quart(phase(p,.90,.96)))
            if p>.90:plane_t=lerp(plane_t,1,quart(phase(p,.90,.96)))
            plane.location=point_at(points,plane_t);plane.rotation_quaternion=frame_at(points,plane_t)
            plane.rotation_quaternion @= Quaternion((1,0,0),math.radians(15))
        if .48<=p<.67:
            previous_location=camera.location.copy()
            previous_rotation=camera.rotation_quaternion.copy()
            descent_composition(camera,p,layout)
            blend=quart(phase(p,.48,.50))
            first=previous_location-G;last=camera.location-G
            camera.location=G+first.normalized().lerp(last.normalized(),blend).normalized()*lerp(first.length,last.length,blend)
            camera.rotation_quaternion=previous_rotation.slerp(camera.rotation_quaternion,blend)
            for key in ('Globe','Globe_Smooth','Graticule'):
                facing=camera.rotation_quaternion @ Quaternion((1,0,0),-math.pi/2) @ Quaternion((0,0,1),.65)
                objects[key].rotation_quaternion=objects[key].rotation_quaternion.slerp(facing,blend)
        bpy.context.view_layer.update()
        if .48<=p<.67:
            pin.rotation_quaternion=camera.rotation_quaternion @ Quaternion((1,0,0),-math.pi/2)
            size_object(pin,camera,75 if w==1440 else 28,layout)
        if p>=.42:
            tangent=(point_at(points,min(1,plane_t+.001))-point_at(points,max(0,plane_t-.001))).normalized()
            facing=(camera.location-plane.location).normalized()
            facing=(facing-tangent*tangent.dot(facing)).normalized()
            from mathutils import Matrix
            plane.rotation_quaternion=projected_rider_rotation(camera,plane.location,tangent,math.radians(lerp(12,18,phase(p,.50,.63))))
            length=lerp(220,360,cubic(phase(p,.50,.63))) if p<.67 else (230 if w==1440 else 115)
            if w==390 and p<.67:length=lerp(65,100,cubic(phase(p,.50,.63)))
            if p<.45:length*=lerp(.7,1,phase(p,.42,.45))
            size_object(plane,camera,length,layout)
        spacing=lerp(initial_gap,end_gap,q)
        end=path['limb']+quart(phase(p,.30,.42))*(4*end_gap+3)/path['length']
        anchor=lerp(path['wordCentres'][-1],end,q)
        if .20<p<.30:anchor=min(anchor,draw_t(p,tin)-.001)
        for i,key in enumerate(['Tile_F','Tile_J','Tile_A','Tile_L','Tile_E']):
            tile=objects[key]
            exit_spacing=sum(layout['tileSize']*((1.65-.20*j) if w==1440 else (.8-.05*j)) for j in range(i,4))*d1/F
            trail_distance=lerp((4-i)*initial_gap,exit_spacing,q)
            t=path['wordCentres'][i] if p<=.20 else anchor-trail_distance/path['length']
            tile.location=point_at(points,t)
            tilt=lerp([12,5,0,-10,-15][i],-14,q)
            tile.rotation_quaternion=camera.rotation_quaternion @ Quaternion((0,0,1),math.radians(-tilt)) @ Quaternion((1,0,0),-math.pi/2)
            target_scale=layout['tileSize']*lerp(1,.45,i/4)*d1/F
            tile_scale=lerp(path['tileScale'],target_scale,q)
            click_start=.66*path['wordCentres'][i]/tin
            click=math.sin(math.pi*phase(p,click_start,click_start+.008)) if click_start<=p<=click_start+.008 else 0
            tile.location.z-=4*path['dWord']/F*click
            tile.scale=(tile_scale*(1+.05*click),)*3
            if .06<=p<=.17:tile.rotation_quaternion @= Quaternion((1,0,0),math.radians(1.5)*math.sin(2*math.pi*.4*frame/24+i*.7))
            if p>=.42:tile.scale=(0,0,0)
        outside=p<.67
        distance=(camera.location-G).length
        objects['Globe'].scale=(R/2.2,)*3 if outside and distance>=1.6*R else (0,0,0)
        objects['Globe_Smooth'].scale=(R/2.2,)*3 if outside and distance<1.6*R else (0,0,0)
        objects['Globe_Inner'].location=camera.location+INTERIOR_ROTATION@Vector((0,.35*inner_radius,0))
        objects['Globe_Inner'].scale=(inner_radius/2.2,)*3 if not outside else (0,0,0)
        if not outside:
            objects['Graticule'].scale=(0,0,0);pin.scale=(0,0,0)
        objects['Arrow'].scale=(0,0,0)
        floor.hide_render=True
        review.data.bevel_factor_start=tin if not outside else 0
        review.data.bevel_factor_end=draw_t(p,tin)
        review.data.keyframe_insert('bevel_factor_start',frame=frame);review.data.keyframe_insert('bevel_factor_end',frame=frame)
        for i,arrow in enumerate(arrows):
            u=inside_u(p)-layout['arrowSpacing']*i
            if p>.90:u=lerp(u,1+.05,quart(phase(p,.90,.96)))
            factor=tin+inside_parameter(u)*(1-tin)
            arrow.location=(0,0,0);arrow.rotation_quaternion=Quaternion();arrow.scale=(1,1,1)
            arrow.constraints[0].offset_factor=factor
            bpy.context.view_layer.update()
            matrix=arrow.evaluated_get(bpy.context.evaluated_depsgraph_get()).matrix_world.copy()
            location,rotation,_=matrix.decompose()
            if p>=.67:
                tangent=(point_at(points,min(1,factor+.001))-point_at(points,max(0,factor-.001))).normalized()
                facing=(camera.location-location).normalized()
                facing=(facing-tangent*facing.dot(tangent)).normalized()
                rotation=projected_rider_rotation(camera,location,tangent,math.radians(15))
                camera_depth=-(camera.matrix_world.inverted()@location).z
                row=i%(7 if w==1440 else 5)
                side=([0,-48,-24,24,48,-72,72] if w==1440 else [0,-48,-24,24,48])[row]
                # Keep the lead riders distinct from the much larger Plane.
                # These offsets are baked; playback never separates objects.
                if i==0:side=-140 if w==1440 else -90
                elif i<(7 if w==1440 else 5):side-=120 if w==1440 else 90
                location+=camera.rotation_quaternion@Vector((0,side*camera_depth/F,0))
                arrow.location=location;arrow.rotation_quaternion=rotation
                # Larger leading riders, smaller surrounding clay darts.
                pixels=lerp(120 if w==1440 else 58,20 if w==1440 else 10,i/layout['arrowCount']) if row==0 else lerp(28 if w==1440 else 12,7,i/layout['arrowCount'])
                arrow.constraints[0].mute=True
                size_object(arrow,camera,pixels,layout)
                scale=arrow.scale.x
                box=mesh_pixels(arrow,camera,layout)
                if box:
                    dx=max(0,4-box[0])-max(0,box[2]-(w-4))
                    dy=max(0,4-box[1])-max(0,box[3]-(h-4))
                    if w==390 and i>=30:
                        # The narrow crop otherwise piles the last five riders
                        # onto its left edge. Author a separated lower-left tail.
                        tail=1-quart(phase(p,.90,.96))
                        dx=lerp(dx,24+(34-i)*14-(box[0]+box[2])/2,tail)
                        dy=lerp(dy,620+(i-30)*18-(box[1]+box[3])/2,tail)
                    location+=camera.rotation_quaternion@Vector((dx*camera_depth/F,-dy*camera_depth/F,0))
                arrow.constraints[0].mute=False
            else:scale=0
            if not (-.63<=u<=1):scale=0
            arrow_poses[i].append((location,rotation,scale))
        for key,obj in objects.items():
            if key!='Thread' and not key.startswith('Arrow_'):key_transform(obj,frame)
        bpy.context.view_layer.update()
        snapshots.append({'frame':frame,'p':p,'camera':list(camera.location),'planeBox':mesh_pixels(plane,camera,layout),
                          'globeDistanceR':distance/R,'lod':'Globe' if distance>=1.6*R else 'Globe_Smooth','reveal':draw_t(p,tin)})
    for arrow,poses in zip(arrows,arrow_poses):
        arrow.constraints.clear()
        for frame,(location,rotation,scale) in enumerate(poses):
            arrow.location=location;arrow.rotation_quaternion=rotation;arrow.scale=(scale,)*3;key_transform(arrow,frame)
    finish_handles(action)
    review_materials(scene)
    objects['Globe_Inner'].material_slots[0].material=inner_wall_material(objects['Globe_Inner'].material_slots[0].material,w,h,F)
    metadata={'version':3,'referenceRevision':'v3.1','viewport':name,'duration':10,'frames':[0,240],'fps':24,'t_in':tin,'length':path['length'],
              'insideFraction':1-tin,'horizon':{'wallDistanceR':1.35,'pitchDegrees':8,'interpretation':'review luminance gradient','bottomLuminanceFactor':.94,'topScreenFraction':.8},'descentOrbitDegrees':layout['descentOrbitDegrees'],'coordinateSystem':'Y_UP','points':[[v.x,v.z,-v.y] for v in points],
              'reveal':{'outside':{'p':[0,.66],'t':[0,tin],'ease':'linear'},'covered':{'p':[.66,.68],'t':tin+.06},
                        'inside':{'p':[.68,.90],'u':[.10,.95],'ease':'easeOutQuart','localDomain':[-.63,1],'localToSegment':'(u + 0.63) / 1.63','leadGlobalT':.04,'clamp':[0,1]}},
              'wrap':{'tiltDegrees':12,'sweepDegrees':360,'pitchR':.35,'exit':'surface connector to front-right pin','status':'§14 one-turn helix'},
              'arrows':{'count':layout['arrowCount'],'spacing':layout['arrowSpacing'],'negativeU':'visible pre-roll per §13C','insideCamera':'baked tracking plus 4% dolly'},'zones':layout['zones']}
    tangents=[(points[min(1024,i+1)]-points[max(0,i-1)]).normalized() for i in range(1025)]
    normals=[];up=Vector((0,0,1))
    for i,tangent in enumerate(tangents):
        if i:up=tangents[i-1].rotation_difference(tangent)@up
        up=(up-tangent*up.dot(tangent)).normalized();normals.append(up.copy())
    metadata['tangents']=[[v.x,v.z,-v.y] for v in tangents];metadata['normals']=[[v.x,v.z,-v.y] for v in normals]
    (OUT/name).mkdir(exist_ok=True)
    (OUT/name/'journey-spline.json').write_text(json.dumps(metadata,separators=(',',':')))
    (OUT/name/'authoring-frames.json').write_text(json.dumps(snapshots,indent=2))
    scene['journeyMetadata']=str(OUT/name/'journey-spline.json')
    scene['reviewOnly']='ReviewThread, ReviewWhiteout, ReviewFloor, Key, Fill; excluded from export'
    scene.frame_set(0)
    print('AUTHORED',name,'action',action.name,'slots',len(action.slots),'insideFraction',1-tin,flush=True)
    return scene

if '--build' in sys.argv:
    for name,layout in LAYOUTS.items():build_scene(name,layout)
    bpy.data.scenes.remove(source_scene)
    bpy.ops.file.pack_all()
    bpy.ops.wm.save_as_mainfile(filepath=str(OUT/'red-thread-journey.blend'))
