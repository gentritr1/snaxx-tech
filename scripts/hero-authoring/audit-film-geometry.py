"""Conservative geometric checks, separate from the visible-silhouette gate."""
import json
import sys
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parent))
from journey_common import *
import numpy as np

bpy.ops.wm.open_mainfile(filepath=str(OUT/'red-thread-journey.blend'))
report={'radiusWorldUnits':3,'minimumDistanceWorldUnits':18,'method':'Projected mesh vertices, before occlusion. Near-camera candidates are not a visible-silhouette pass. Review-only compositing geometry excluded.','viewports':{}}
for name in ['1440','390']:
    scene=bpy.data.scenes['Journey '+name];bpy.context.window.scene=scene
    camera=scene.camera;w=scene.render.resolution_x;h=scene.render.resolution_y
    rows=[]
    vertices={obj.name:np.array([list(v.co) for v in obj.data.vertices]) for obj in scene.objects if obj.type=='MESH' and not obj.get('reviewOnly')}
    for frame in range(241):
        scene.frame_set(frame);p=frame/240
        if p>=1:continue
        F=w*camera.data.lens/camera.data.sensor_width
        inverse=np.array(camera.matrix_world.inverted())
        nearest=None;arrow_count=0
        for obj_name,local in vertices.items():
            obj=bpy.data.objects[obj_name]
            if max(obj.scale)<1e-5:continue
            matrix=inverse@np.array(obj.matrix_world)
            points=local@matrix[:3,:3].T+matrix[:3,3]
            depth=-points[:,2]
            good=depth>0
            x=w/2+F*points[:,0]/np.maximum(depth,1e-9)
            y=h/2-F*points[:,1]/np.maximum(depth,1e-9)
            visible=good&(x>=0)&(x<=w)&(y>=0)&(y<=h)
            if not visible.any():continue
            if '/Arrow_' in obj_name:arrow_count+=1
            distance=float(np.linalg.norm(points[visible],axis=1).min())
            if nearest is None or distance<nearest['distance']:
                nearest={'object':obj_name,'distance':distance,'distanceR':distance/3}
        thread=bpy.data.objects[name+'/ReviewThread']
        start=math.floor(thread.data.bevel_factor_start*1024)
        end=math.ceil(thread.data.bevel_factor_end*1024)
        for point in thread.data.splines[0].bezier_points[max(0,start):min(1025,end+1)]:
            position=camera.matrix_world.inverted()@point.co
            depth=-position.z
            if depth<=0:continue
            x=w/2+F*position.x/depth;y=h/2-F*position.y/depth
            if not(0<=x<=w and 0<=y<=h):continue
            radius=(3 if name=='1440' else 2)*depth/F
            distance=position.length-radius
            if nearest is None or distance<nearest['distance']:
                nearest={'object':name+'/Thread','distance':distance,'distanceR':distance/3}
        covered=.64<=p<=.68
        rows.append({'frame':frame,'p':p,'coveredByWhiteout':covered,'arrowsWithVerticesInFrame':arrow_count,'nearestCandidate':nearest})
    report['viewports'][name]={'frames':rows,'insideMinimumArrowCount':min(row['arrowsWithVerticesInFrame'] for row in rows if .71<=row['p']<=.90),'nearCandidates':[row for row in rows if not row['coveredByWhiteout'] and row['nearestCandidate'] and row['nearestCandidate']['distance']<18]}
(OUT/'geometry-audit.json').write_text(json.dumps(report,indent=2))
for name,data in report['viewports'].items():print('GEOMETRY AUDIT',name,'inside minimum arrows',data['insideMinimumArrowCount'],'near candidates',len(data['nearCandidates']))
