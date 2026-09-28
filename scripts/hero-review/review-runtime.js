// Local review harness only. All samples and screenshots come from the real page.
const params = new URLSearchParams(location.search);
const frame = document.querySelector('#app'), status = document.querySelector('#status');
frame.width = params.get('w') || '1440';frame.height = params.get('h') || '900';
frame.src = params.get('route') || '/?hero=thread';
const output = (data) => {document.querySelector('#evidence').textContent = JSON.stringify(data, null, 2);};
const app = () => frame.contentWindow;
const hero = () => frame.contentDocument.querySelector('#hero');
let requested = 0;
function seek(p) {
  requested = p;status.dataset.settled = "false";
  const h = hero(), w = app();
  w.scrollTo({top:h.offsetTop + p * (h.offsetHeight - w.innerHeight), behavior:'instant'});
}
document.querySelector('#seek').onclick = () => seek(Number(document.querySelector('#progress').value));
setInterval(() => {
  const h = hero();if (!h) return;
  const p = Number(h.dataset.progress);
  status.textContent = `target=${requested.toFixed(5)} p=${p.toFixed(5)} ready=${h.dataset.ready} failed=${h.dataset.failed}`;
  status.dataset.settled = String(Math.abs(p - requested) < .00015 && h.dataset.ready === 'true');
}, 100);
document.querySelector('#audit').onclick = () => {
  const w = app(), d = w.document, h = hero(), c = d.querySelector('canvas');
  const g = c?.getContext('webgl2'), ext = g?.getExtension('WEBGL_debug_renderer_info');
  h?.dispatchEvent(new Event('hero:measure'));
  const geometry = h?.dataset.geometryAudit ? JSON.parse(h.dataset.geometryAudit) : null;
  const blocks = [...d.querySelectorAll('.thread-copy')].map(e => {
    const r=e.getBoundingClientRect();return {act:e.dataset.visibleIn,opacity:w.getComputedStyle(e).opacity,inert:e.inert,rect:{x:r.x,y:r.y,width:r.width,height:r.height}};
  });
  output({method:'Browser viewport emulation; UNVERIFIED on device',geometry,scrollY:w.scrollY,heroRect:h?.getBoundingClientRect().toJSON(),visibility:d.visibilityState,viewport:[w.innerWidth,w.innerHeight],dpr:w.devicePixelRatio,hero:h?Object.fromEntries(Object.entries(h.dataset).filter(([key])=>key!=='geometryAudit')):null,canvas:c?[c.width,c.height]:null,renderer:ext?g.getParameter(ext.UNMASKED_RENDERER_WEBGL):null,blocks,resources:w.performance.getEntriesByType('resource').map(e=>({name:e.name,bytes:e.transferSize}))});
};
document.querySelector('#trace').onclick = async () => {
  document.querySelector('#evidence').dataset.complete = 'false';
  const w = app(), h = hero();seek(0);status.textContent = 'Preparing';
  await new Promise(resolve => {function settled(){if(Number(h.dataset.progress)<.00015)resolve();else requestAnimationFrame(settled);}requestAnimationFrame(settled);});
  w.performance.clearMarks('hero:frame');w.performance.clearMarks('hero:scroll');h.dataset.trace='record';
  const start=w.performance.now(), distance=h.offsetHeight-w.innerHeight;
  await new Promise(resolve=> {
    function step() {const elapsed=w.performance.now()-start;w.scrollTo({top:h.offsetTop+Math.min(1,elapsed/3000)*distance,behavior:'instant'});if(elapsed<3000)requestAnimationFrame(step);else resolve();}
    requestAnimationFrame(step);
  });
  h.dataset.trace='';requested=1;
  const frames=w.performance.getEntriesByName('hero:frame').filter(f=>f.startTime>=start&&f.startTime<=start+3000).map(f=>({time:f.startTime,...f.detail}));
  const intervals=frames.slice(1).map((f,i)=>f.time-frames[i].time).sort((a,b)=>a-b);
  output({method:'3s native programmatic scroll in browser viewport emulation; UNVERIFIED on device',viewport:[w.innerWidth,w.innerHeight],samples:frames.length,p95FrameTime:intervals[Math.ceil(intervals.length*.95)-1],maxDeltaP:Math.max(...frames.slice(1).map((f,i)=>Math.abs(f.p-frames[i].p))),maxLag:Math.max(...frames.map(f=>Math.abs(f.targetP-f.p))),frames});
  document.querySelector('#evidence').dataset.complete = 'true';
};
document.querySelector('#unpin').onclick=async()=> {
 const w=app(),h=hero();w.scrollTo({top:h.offsetTop+h.offsetHeight-w.innerHeight+40,behavior:'instant'});requested=1;
 await new Promise(r=>w.requestAnimationFrame(()=>w.requestAnimationFrame(r)));
 output({method:'Native un-pin +40px, second refresh; UNVERIFIED on device',hero:{...h.dataset},stageVisibility:w.getComputedStyle(h.querySelector('.thread-stage')).visibility,visibleCopy:[...h.querySelectorAll('.thread-copy')].filter(e=>Number(w.getComputedStyle(e).opacity)>.02).length});
};
const armWheel=document.createElement('button');armWheel.textContent='Arm wheel';document.querySelector('#controls').append(armWheel);
armWheel.onclick=()=> {
 const w=app(),h=hero();document.querySelector('#evidence').dataset.complete='false';
 w.addEventListener('scroll',()=> {
  w.performance.clearMarks('hero:frame');h.dataset.trace='record';const start=w.performance.now();
  setTimeout(()=> {
   h.dataset.trace='';
   const frames=w.performance.getEntriesByName('hero:frame').filter(f=>f.startTime>=start&&f.startTime<=start+3000).map(f=>({time:f.startTime,...f.detail}));
   const intervals=frames.slice(1).map((f,i)=>f.time-frames[i].time).sort((a,b)=>a-b);
   output({method:'3s CUA native browser wheel input; UNVERIFIED on device',viewport:[w.innerWidth,w.innerHeight],samples:frames.length,p95FrameTime:intervals[Math.ceil(intervals.length*.95)-1],maxDeltaP:Math.max(...frames.slice(1).map((f,i)=>Math.abs(f.p-frames[i].p))),maxLag:Math.max(...frames.map(f=>Math.abs(f.targetP-f.p))),frames});document.querySelector('#evidence').dataset.complete='true';
  },3000);
 },{once:true,passive:true});
};
