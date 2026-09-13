"""Review-only real copy placeholders, reserve pass, films and contact sheets."""
import argparse
import json
import math
import subprocess
from pathlib import Path
from PIL import Image,ImageDraw,ImageFont
ROOT=Path(__file__).resolve().parents[2]
OUT=ROOT/'design/hero-world-within/journey-v3'
FONTS=Path('/tmp/red-thread-film-fonts')
BG='#FEFBF8';INK='#2A2D38';RED='#D73626';MUTED='#5F636F'
COPY={
 'word':('THE SNAXX STORY · ACT I · THE WORD','In the beginning was the Word.','FJALË is the daily Albanian word game. Five letters, five minutes, live on the web today.'),
 'world':('ACT II · THE WORLD','Then, a world to get lost in.','Geo Guesser World 3D! drops you anywhere on Earth. Guess where.'),
 'descent':('ACT II · DROPPING IN','Somewhere on Earth. The ground comes up fast.','The camera follows the thread down to the pin. Through the surface, the next act is already in flight.'),
 'arrow':('ACT III · THE ARROW','And something to aim for.','Arrows is a precision arcade game. Every launch gets attention until it feels just right.')}
TIMES={'word':(0,.04,.17,.20),'world':(.24,.28,.45,.48),'descent':(.49,.53,.60,.63),'arrow':(.71,.75,.88,.91)}
def phase(p,a,b):return max(0,min(1,(p-a)/(b-a)))
def prepare_fonts():
 from fontTools.ttLib import TTFont
 from fontTools.varLib.instancer import instantiateVariableFont
 FONTS.mkdir(exist_ok=True)
 for name in ['bricolage-grotesque-latin','geist-regular','geistmono-medium']:
  source=TTFont(ROOT/'public/fonts'/(name+'.woff2'))
  if 'fvar' in source:source=instantiateVariableFont(source,{'wght':600},inplace=True)
  source.flavor=None;source.save(FONTS/(name+'.ttf'))

def font(size,kind='headline'):
 name={'headline':'bricolage-grotesque-latin','body':'geist-regular','mono':'geistmono-medium'}[kind]
 return ImageFont.truetype(str(FONTS/(name+'.ttf')),round(size))
def lines(text,f,width):
 result=[];line=''
 for word in text.split():
  proposed=(line+' '+word).strip()
  if line and f.getlength(proposed)>width:result.append(line);line=word
  else:line=proposed
 if line:result.append(line)
 return result

def text_block(draw,text,x,y,width,size,kind='headline',center=False,color=INK,line_height=None):
 f=font(size,kind);rows=lines(text,f,width);step=line_height or size*(.98 if kind=='headline' else 1.5)
 for row in rows:
  draw.text((x+(width-f.getlength(row))/2 if center else x,y),row,font=f,fill=color,anchor='lt',stroke_width=0)
  y+=step
 return y

def copy_overlay(size,p,zones,reserve):
 w,h=size;phone=w<768
 image=Image.new('RGBA',size);draw=ImageDraw.Draw(image)
 for key,(a,b,c,d) in TIMES.items():
  opacity=min(phase(p,a,b),1-phase(p,c,d))
  if opacity<=0:continue
  panel=Image.new('RGBA',size);canvas=ImageDraw.Draw(panel)
  x1,y1,x2,y2=zones[key]
  if reserve:
   canvas.rectangle((x1,y1,x2,y2),fill=(70,140,165,13),outline=(70,140,165,110),width=1)
   canvas.text((x1+5,y2-16),key.upper()+' COPY RESERVE',font=font(9,'mono'),fill=(50,90,115,150))
  shift=16*(1-phase(p,a,b))-12*phase(p,c,d)
  eyebrow,title,paragraph=COPY[key]
  if key=='word':
   canvas.text((w/2,118 if phone else 128),eyebrow,font=font(9 if phone else 12,'mono'),fill=MUTED,anchor='mt')
   y=(342 if phone else 480)+shift
   y=text_block(canvas,title,24 if phone else 48,y,w-48 if phone else w-96,40 if phone else 64,center=True)
   if not phone:
    y=text_block(canvas,paragraph,(w-560)/2,y+22,560,18,'body',center=True)
   action_y=y+26
  else:
   x=x1;y=y1+shift
   canvas.text((x,y),eyebrow,font=font(10 if phone else 12,'mono'),fill=MUTED,anchor='lt')
   size={'world':48 if phone else 80,'descent':40,'arrow':44 if phone else 76}[key]
   width=(x2-x1) if phone or key=='descent' else min(x2-x1,590 if key=='world' else 520)
   y=text_block(canvas,title,x,y+(21 if phone else 36),width,size)
   if not phone:y=text_block(canvas,paragraph,x,y+20,min(width,480),16 if key=='descent' else 18,'body')
   action_y=y+(12 if phone else 24)
  if key!='descent':
   button_w=144 if phone else 174;button_h=40 if phone else 52
   x=(w-button_w)/2 if key=='word' else x1
   canvas.rounded_rectangle((x,action_y,x+button_w,action_y+button_h),radius=10,fill=RED)
   canvas.text((x+button_w/2,action_y+button_h/2),'See the apps →',font=font(14 if phone else 16,'body'),fill='white',anchor='mm')
   label='Play FJALË online ↗' if key=='word' else 'COMING TO GOOGLE PLAY'
   if phone:
    px=x+button_w+10 if key!='word' else w/2
    if key=='word':
     canvas.text((px,action_y+button_h+18),label,font=font(12,'body'),fill=INK,anchor='mt')
    else:
     # Compact pill is part of the owner-approved paragraph-free phone block.
     pill_width=x2-px
     canvas.rounded_rectangle((px,action_y+4,x2,action_y+button_h-4),radius=16,outline='#DCD6CF',fill=BG)
     canvas.text((px+pill_width/2,action_y+button_h/2),'GOOGLE PLAY · SOON',font=font(8,'mono'),fill=INK,anchor='mm')
   else:
    canvas.text((x+button_w+20,action_y+button_h/2),label,font=font(11,'mono'),fill=INK,anchor='lm')
  panel.putalpha(panel.getchannel('A').point(lambda value:round(value*opacity)))
  image=Image.alpha_composite(image,panel)
 # DOM rail preview, no corresponding exported mesh.
 draw=ImageDraw.Draw(image)
 if p<1:
  rx=w-(16 if phone else 28);top=h*.24;bottom=h*.76
  draw.line((rx,top,rx,bottom),fill='#DCD6CF',width=2)
  draw.line((rx,top,rx,top+(bottom-top)*p),fill=RED,width=2)
  for t in [0,.2,.45,.65,.9]:
   y=top+(bottom-top)*t;draw.ellipse((rx-3,y-3,rx+3,y+3),fill=RED if t<=p else '#DCD6CF')
 if p>=.92:
  y=h-84;x=24 if phone else 48
  draw.text((x,y),'Apps',font=font(40 if phone else 56),fill=INK,anchor='lt')
  draw.line((x,y+58,x+140*phase(p,.92,1),y+58),fill=RED,width=3)
 return image

def compose(name,preview):
 metadata=json.loads((OUT/name/'journey-spline.json').read_text());zones=metadata['zones']
 w,h=(1440,900) if name=='1440' else (390,844)
 directory=OUT/name/('preview' if preview else 'raw');dest=OUT/name/('composed-preview' if preview else 'composed');dest.mkdir(exist_ok=True)
 count=0
 for source in sorted(directory.glob('*.png')):
  frame=int(source.stem);p=frame/240
  art=Image.open(source).convert('RGBA').resize((w,h),Image.Resampling.LANCZOS)
  if p>.96:art.putalpha(round(255*(1-phase(p,.96,1))))
  base=Image.new('RGBA',(w,h),BG);base=Image.alpha_composite(base,art)
  white=min(phase(p,.63,.66),1-phase(p,.68,.71))
  if white>0:base=Image.alpha_composite(base,Image.new('RGBA',(w,h),(255,255,255,round(255*white))))
  base=Image.alpha_composite(base,copy_overlay((w,h),p,zones,True))
  base.convert('RGB').save(dest/source.name);count+=1
 if not preview:
  movie=OUT/f'journey-{name}.mp4'
  subprocess.run(['ffmpeg','-y','-framerate','24','-start_number','0','-i',str(dest/'%04d.png'),'-frames:v','240','-c:v','libx264','-crf','18','-preset','medium','-pix_fmt','yuv420p','-movflags','+faststart',str(movie)],check=True)
  tw,th=(360,225) if name=='1440' else (195,422)
  sheet=Image.new('RGB',(tw*8,(th+24)*5),BG);draw=ImageDraw.Draw(sheet)
  for i,frame in enumerate(range(0,240,6)):
   x=(i%8)*tw;y=(i//8)*(th+24)
   still=Image.open(dest/f'{frame:04d}.png');still.thumbnail((tw,th),Image.Resampling.LANCZOS);sheet.paste(still,(x,y))
   draw.text((x+8,y+th+4),f'p = {frame/240:.3f}',font=font(12,'mono'),fill=INK)
  sheet.save(OUT/f'contact-sheet-film-{name}.png')
 print(json.dumps({'viewport':name,'framesComposed':count,'preview':preview}))
if __name__=='__main__':
 parser=argparse.ArgumentParser();parser.add_argument('--preview',action='store_true');args=parser.parse_args()
 prepare_fonts()
 for name in ['1440','390']:compose(name,args.preview)

# Supplemental art framing sheets use the same desktop camera and action.
# Copy is shown in the primary 1440×900 film; these isolate sensor-fit framing.
def compose_framing():
 for aspect in ['1024x768','1920x1080']:
  directory=OUT/aspect/'raw'
  if not directory.exists():continue
  w,h=map(int,aspect.split('x'));tw=360;th=round(h*tw/w)
  sheet=Image.new('RGB',(tw*8,(th+24)*5+36),BG);draw=ImageDraw.Draw(sheet)
  draw.text((10,10),aspect+' · SAME JOURNEY CAMERA · ART FRAMING',font=font(13,'mono'),fill=INK)
  for i,frame in enumerate(range(0,240,6)):
   x=(i%8)*tw;y=36+(i//8)*(th+24)
   still=Image.open(directory/f'{frame:04d}.png');still.thumbnail((tw,th),Image.Resampling.LANCZOS);sheet.paste(still,(x,y))
   draw.text((x+8,y+th+4),f'p = {frame/240:.3f}',font=font(12,'mono'),fill=INK)
  sheet.save(OUT/f'contact-sheet-framing-{aspect}.png')

if __name__=='__main__' and not args.preview:compose_framing()
