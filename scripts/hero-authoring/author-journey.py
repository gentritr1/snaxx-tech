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

# Two scenes share these mesh data-blocks; their transforms live in separate actions.
LAYOUTS = {
    '1440': {'width':1440,'height':900,'tileSize':112,'centres':[(300,288),(510,296),(720,300),(930,296),(1140,288)],
             'focal':1086.396103,'globeCentre':(.72,.52),'globeRadius':300,'arrowCount':70,'arrowSpacing':.009,
             'zones':{'word':[0,470,1440,700],'world':[48,150,640,620],'descent':[820,110,1360,330],'arrow':[48,150,640,620]}},
    '390': {'width':390,'height':844,'tileSize':58,'centres':[(63,208),(129,216),(195,222),(261,216),(327,208)],
            'focal':759.9342077,'globeCentre':(.78,.70),'globeRadius':250,'arrowCount':35,'arrowSpacing':.018,
            'zones':{'word':[24,330,366,720],'world':[24,118,366,330],'descent':[24,118,366,330],'arrow':[24,118,366,330]}}
}

INTERIOR_ROTATION = Quaternion((1,0,0),math.radians(8))
R = 3.0
G = Vector((18,0,0))
normal = Vector((-.08,-math.sqrt(math.tan(math.radians(12))**2-.08**2),1)).normalized()
u_axis = Vector((1,0,.08)).normalized()
v_axis = normal.cross(u_axis).normalized()
WRAP_SWEEP = math.radians(235.6)
seam_angle = math.pi-WRAP_SWEEP
PIN = G + R*(u_axis*math.cos(seam_angle)+v_axis*math.sin(seam_angle))
L_OUT = WRAP_SWEEP*(R+.055)*.66/.12


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
    edge_y=196 if w==390 else 288
    anchors=[(-20,edge_y),*layout['centres'],(w+20,edge_y)]
    pixel_path=catmull([(x-w/2,0,h/2-y) for x,y in anchors])
    _,pixel_length=resample(pixel_path)
    pixel_scale=(L_OUT*.06/.66)/pixel_length
    word=[p*pixel_scale+Vector((0,0,8)) for p in pixel_path]
    d_word=F*pixel_scale
    left=G-u_axis*(R+.055)
    d1=math.sqrt((F*R/layout['globeRadius'])**2+R**2)
    c1=G+Vector((-(layout['globeCentre'][0]-.5)*w/F*d1,-d1,(layout['globeCentre'][1]-.5)*h/F*d1))
    def screen(x,y):
        return c1+Vector(((x-w/2)*d1/F,d1,(h/2-y)*d1/F))
    shoulder=([screen(1000,-80),screen(960,90),screen(810,170),screen(735,350),left]
              if w==1440 else [screen(-150,930),screen(20,830),screen(30,720),left])
    target=L_OUT*.24/.66
    def approach_at(depth):
        bridge=word[-1].lerp(shoulder[0],.5)+Vector((0,depth,0))
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
    seam=G+(R+.055)*(u_axis*math.cos(seam_angle)+v_axis*math.sin(seam_angle))
    wrap=[G+(R+.055)*(u_axis*math.cos(a)+v_axis*math.sin(a))
          for a in (math.pi-WRAP_SWEEP*i/768 for i in range(769))]
    # The descent leaves the seam at 30 degrees on the right, loops outside the
    # globe's right limb, then approaches the surface along a curved flight path.
    def descent(depth):
        return (bezier(seam,seam+Vector((3,0,math.sqrt(3))),G+Vector((5,3,4)),G+Vector((4,1,3)),192)
                +bezier(G+Vector((4,1,3)),G+Vector((3,-depth,4)),PIN+Vector((-3,-depth,3)),PIN,256)+[PIN])
    target=L_OUT*.24/.66
    low,high=0,60
    for _ in range(50):
        depth=(low+high)/2
        if resample(descent(depth))[1]<target:low=depth
        else:high=depth
    descent_points=descent((low+high)/2)
    outside=word+approach[1:]+wrap[1:]+descent_points[1:]
    outside,outside_length=resample(outside,2049)
    # The inside lives beyond the covered cut, physically distant from the
    # exterior. Its bridge is not shown; the two stage collections swap under white.
    inside_local=[]
    for i in range(513):
        q=i/512
        if w==1440:
            x=lerp(0,1420,q)
            y=lerp(700,120,q)+300*math.sin(math.pi*q)
        else:
            x=lerp(0,410,q)
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
            'dWord':d_word,'tileScale':layout['tileSize']*pixel_scale,'wordCentres':[nearest(Vector((x-w/2,0,h/2-y))*pixel_scale+Vector((0,0,8))) for x,y in layout['centres']]}
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


if '--paths-only' in sys.argv:
    for name,layout in LAYOUTS.items():
        path=author_path(layout)
        print('PATH',name,json.dumps({k:v for k,v in path.items() if k not in ('points',)}))
    sys.exit(0)

def build_scene(name,layout):
    scene=bpy.data.scenes.new('Journey '+name)
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
    camera_data.lens=layout['focal']*36/layout['width'];camera_data.clip_start=.02;camera_data.clip_end=1000
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
    floor_data.from_pydata([(-100,-100,.55),(-100,100,.55),(7,-100,.55),(7,100,.55),(13,-100,-3),(13,100,-3),(100,-100,-3),(100,100,-3)],[],[(0,2,3,1),(2,4,5,3),(4,6,7,5)])
    floor=bpy.data.objects.new(prefix+'ReviewFloor',floor_data);scene.collection.objects.link(floor);floor.data.materials.append(bpy.data.materials['Porcelain']);floor['reviewOnly']=True
    w,h,F=layout['width'],layout['height'],layout['focal']
    d1=math.sqrt((F*R/layout['globeRadius'])**2+R**2)
    c0=Vector((0,-path['dWord'],8))
    c1=G+Vector((-(layout['globeCentre'][0]-.5)*w/F*d1,-d1,(layout['globeCentre'][1]-.5)*h/F*d1))
    inner_base=Vector(path['insideCamera'])
    reference_t=tin+inside_u(.78)*(1-tin)
    reference_point=point_at(points,reference_t)
    # Camera offset accounts for the kit origin being behind its projected centre.
    plane_target=(.8*w-11,.26*h+10) if w==1440 else (304.5,412)
    local_reference=INTERIOR_ROTATION.inverted()@(reference_point-PIN)
    local_camera=INTERIOR_ROTATION.inverted()@(inner_base-PIN)
    depth=local_reference.y-local_camera.y
    local_camera.x=local_reference.x-(plane_target[0]-w/2)*depth/F
    local_camera.z=local_reference.z+(plane_target[1]-h/2)*depth/F
    inner_base=PIN+INTERIOR_ROTATION@local_camera
    inner_radius=70
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
            objects[key].rotation_quaternion=Quaternion((0,0,1),lerp(-.6,0,q)+.1*phase(p,.30,.42))
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
            d=lerp(3.2*R,1.05*R,cubic(phase(p,.45,.63)))
            if p>.63:d=lerp(1.05*R,.98*R,phase(p,.63,.66))
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
            position=inner_base+INTERIOR_ROTATION@Vector((0,dolly,0))
            camera_pose(camera,position,position+INTERIOR_ROTATION@Vector((0,1,0)))
            if p>.90:camera.rotation_quaternion @= Quaternion((1,0,0),math.radians(-12)*quart(phase(p,.90,.96)))
            plane_t=tin+inside_u(p)*(1-tin)
            if p>.90:plane_t=lerp(plane_t,1,quart(phase(p,.90,.96)))
            plane.location=point_at(points,plane_t);plane.rotation_quaternion=frame_at(points,plane_t)
            plane.rotation_quaternion @= Quaternion((1,0,0),math.radians(15))
        bpy.context.view_layer.update()
        if p>=.42:
            tangent=(point_at(points,min(1,plane_t+.001))-point_at(points,max(0,plane_t-.001))).normalized()
            facing=(camera.location-plane.location).normalized()
            facing=(facing-tangent*tangent.dot(facing)).normalized()
            from mathutils import Matrix
            plane.rotation_quaternion=Matrix((tangent,facing.cross(tangent).normalized(),facing)).transposed().to_quaternion()
            plane.rotation_quaternion @= Quaternion((1,0,0),math.radians(lerp(12,18,phase(p,.50,.63))))
            length=lerp(220,360,cubic(phase(p,.50,.63))) if p<.67 else (300 if w==1440 else 115)
            if p<.45:length*=lerp(.7,1,phase(p,.42,.45))
            size_object(plane,camera,length,layout)
        spacing=lerp(initial_gap,end_gap,q)
        end=path['limb']+quart(phase(p,.30,.42))*(4*end_gap+3)/path['length']
        anchor=lerp(path['wordCentres'][-1],end,q)
        if .20<p<.30:anchor=min(anchor,draw_t(p,tin)-.001)
        for i,key in enumerate(['Tile_F','Tile_J','Tile_A','Tile_L','Tile_E']):
            tile=objects[key]
            t=path['wordCentres'][i] if p<=.20 else anchor-(4-i)*spacing/path['length']
            tile.location=point_at(points,t)
            tile.rotation_quaternion=camera.rotation_quaternion @ Quaternion((1,0,0),-math.pi/2)
            tile_scale=lerp(path['tileScale'],layout['tileSize']*.45*d1/F,q)
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
            factor=tin+clamp(u)*(1-tin)
            arrow.location=(0,0,0);arrow.rotation_quaternion=Quaternion();arrow.scale=(1,1,1)
            arrow.constraints[0].offset_factor=factor
            bpy.context.view_layer.update()
            matrix=arrow.evaluated_get(bpy.context.evaluated_depsgraph_get()).matrix_world.copy()
            location,rotation,_=matrix.decompose()
            location+=rotation@Vector((0,math.sin(i*2.4)*.08,0))
            scale=(.35+.65*(1-i/layout['arrowCount'])) if .67<=p and 0<=u<=1 else 0
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
    metadata={'version':3,'viewport':name,'duration':10,'frames':[0,240],'fps':24,'t_in':tin,'length':path['length'],
              'insideFraction':1-tin,'horizon':{'wallDistanceR':1.35,'pitchDegrees':8,'interpretation':'latitude light band','topScreenFraction':.8},'coordinateSystem':'Y_UP','points':[[v.x,v.z,-v.y] for v in points],
              'reveal':{'outside':{'p':[0,.66],'t':[0,tin],'ease':'linear'},'covered':{'p':[.66,.68],'t':tin+.06},
                        'inside':{'p':[.68,.90],'u':[.10,.95],'ease':'easeOutQuart','leadGlobalT':.04,'clamp':[0,1]}},
              'wrap':{'tiltDegrees':12,'sweepDegrees':235.6,'fullTurnDeltaDegrees':-124.4,'status':'film proposal'},
              'arrows':{'count':layout['arrowCount'],'spacing':layout['arrowSpacing'],'negativeU':'scale0'},'zones':layout['zones']}
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
