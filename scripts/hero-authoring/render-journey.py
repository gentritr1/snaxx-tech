"""Render review-only cord/white-out and the two authored Journey scenes."""
import sys
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parent))
from journey_common import *
import argparse
parser=argparse.ArgumentParser()
parser.add_argument('--preview',action='store_true')
parser.add_argument('--start',type=int,default=0)
parser.add_argument('--end',type=int,default=240)
parser.add_argument('--aspect',help='Supplemental desktop contact sheet resolution, e.g. 1024x768')
parser.add_argument('--viewport',choices=['1440','390','both'],default='both')
args=parser.parse_args(sys.argv[sys.argv.index('--')+1:] if '--' in sys.argv else [])
bpy.ops.wm.open_mainfile(filepath=str(OUT/'red-thread-journey.blend'))
for name in (['1440','390'] if args.viewport=='both' else [args.viewport]):
    scene=bpy.data.scenes['Journey '+name];bpy.context.window.scene=scene
    if args.aspect:
        scene.render.resolution_x,scene.render.resolution_y=map(int,args.aspect.split('x'))
    scene.render.resolution_percentage=50 if args.preview else 100
    directory=OUT/name/('preview' if args.preview else 'raw');directory.mkdir(exist_ok=True)
    if args.aspect:
        directory=OUT/args.aspect/'raw';directory.mkdir(parents=True,exist_ok=True)
    camera=scene.camera;thread=bpy.data.objects[name+'/ReviewThread']
    # The camera-parented white plane supplies opacity to the review overlay
    # pass; it must composite above near-clipped meshes, as the DOM will.
    bpy.data.objects[name+'/ReviewWhiteout'].hide_render=True
    width=scene.render.resolution_x;focal=width*camera.data.lens/camera.data.sensor_width
    frames=[0,24,60,72,90,108,132,150,164,172,187,204,216,230,240] if args.preview else range(args.start,args.end+1)
    if args.aspect:frames=range(math.ceil(args.start/6)*6,min(239,args.end)+1,6)
    for frame in frames:
        scene.frame_set(frame)
        view=camera.matrix_world.inverted()
        for point in thread.data.splines[0].bezier_points:
            depth=-(view@point.co).z
            point.radius=max(.0001,(3 if name=='1440' else 2)*depth/focal/thread.data.bevel_depth)
        scene.render.filepath=str(directory/f'{frame:04d}.png')
        bpy.ops.render.render(write_still=True)
    print('RENDERED',name,len(frames),'frames',flush=True)
