const params=new URLSearchParams(location.search), frame=document.querySelector('#app');
frame.width=params.get('w')||1440;frame.height=params.get('h')||900;frame.src='/?hero=thread';
let requested=0;
const status=document.querySelector('#status');
function seek(p){requested=p;const w=frame.contentWindow,h=w.document.querySelector('#hero');w.scrollTo({top:h.offsetTop+p*(h.offsetHeight-w.innerHeight),behavior:'instant'});const settle=setInterval(()=>{status.textContent=`p=${h.dataset.progress}; ready=${h.dataset.ready}`;if(Math.abs(Number(h.dataset.progress)-p)<.00001)clearInterval(settle)},100);setTimeout(()=>clearInterval(settle),4000)}
document.querySelectorAll('[data-p]').forEach(b=>b.onclick=()=>seek(Number(b.dataset.p)));
document.querySelector('#reverse').onclick=()=>{const w=frame.contentWindow;w.scrollTo({top:0,behavior:'instant'});seek(0)};
frame.onload=()=>{const timer=setInterval(()=>{const h=frame.contentDocument.querySelector('#hero');if(h?.dataset.ready==='true'){clearInterval(timer);document.querySelectorAll('button').forEach(b=>b.disabled=false);seek(requested)}},100)};
const idle=document.createElement('button');idle.textContent='Check idle';document.querySelector('#controls').append(idle);
idle.onclick=async()=>{
 const w=frame.contentWindow;w.scrollTo({top:w.document.documentElement.scrollHeight,behavior:'instant'});
 status.textContent='Settling at footer';await new Promise(r=>setTimeout(r,1200));
 const original=w.requestAnimationFrame.bind(w);let callbacks=0;
 w.requestAnimationFrame=fn=>original(t=>{callbacks++;fn(t)});
 status.textContent='Measuring offscreen for 5 seconds';await new Promise(r=>setTimeout(r,5000));
 w.requestAnimationFrame=original;status.textContent=`Offscreen 5000ms: ${callbacks} total iframe rAF callbacks (emulation)`;
};
const contextLoss=document.createElement('button');contextLoss.textContent='Lose context';document.querySelector('#controls').append(contextLoss);
contextLoss.onclick=()=>frame.contentDocument.querySelector('canvas')?.getContext('webgl2')?.getExtension('WEBGL_lose_context')?.loseContext();
const ctaTest=document.createElement('button');ctaTest.textContent='Check CTAs';document.querySelector('#controls').append(ctaTest);
ctaTest.onclick=async()=>{
 const w=frame.contentWindow, results=[];
 const settled=()=>new Promise(r=>w.requestAnimationFrame(()=>w.requestAnimationFrame(r)));
 for(const p of [0,.3,.55,.78]){
  seek(p);await new Promise(r=>setTimeout(r,2000));await settled();
  const a=w.document.querySelector('.thread-act-actions[aria-hidden="false"] a');
  const rect=a.getBoundingClientRect();
  const before={p,visible:rect.top>=0&&rect.bottom<=w.innerHeight,href:a.getAttribute('href')};
  a.click();await new Promise(r=>setTimeout(r,1400));
  results.push({...before,hash:w.location.hash,portfolioTop:Math.round(w.document.querySelector('#portfolio').getBoundingClientRect().top)});
 }
 await new Promise(r=>setTimeout(r,1000));
 status.textContent=JSON.stringify(results);
};
const routes=document.createElement('button');routes.textContent='Check routes';document.querySelector('#controls').append(routes);
routes.onclick=async()=>{
 const results=[];
 for(const url of ['/', '/privacy/arrows?hero=thread','/missing-red-thread-test?hero=thread']){
  await new Promise(r=>{frame.onload=r;frame.src=url});await new Promise(r=>setTimeout(r,1500));
  const w=frame.contentWindow,names=w.performance.getEntriesByType('resource').map(r=>r.name);
  results.push({url,canvases:w.document.querySelectorAll('canvas').length,sceneRequests:names.filter(n=>n.includes('ThreadCanvas')).length,displayFontRequests:names.filter(n=>n.includes('bricolage')).length});
 }
 status.textContent=JSON.stringify(results);
};
const trace=document.createElement('button');trace.textContent='Trace 3s';document.querySelector('#controls').append(trace);
trace.onclick=async()=>{
 const w=frame.contentWindow, h=w.document.querySelector('#hero');
 seek(0);status.textContent='Preparing trace';await new Promise(r=>setTimeout(r,1800));
 w.performance.clearMarks('hero:frame');w.performance.clearMarks('hero:scroll');h.dataset.trace='record';
 const start=w.performance.now(),distance=h.offsetHeight-w.innerHeight,top=h.offsetTop;
 await new Promise(resolve=>{
  function step(){const elapsed=w.performance.now()-start;w.scrollTo({top:top+Math.min(1,elapsed/3000)*distance,behavior:'instant'});if(elapsed<3000)requestAnimationFrame(step);else resolve()}
  requestAnimationFrame(step);
 });
 h.dataset.trace='';
 const frames=w.performance.getEntriesByName('hero:frame').filter(f=>f.startTime>=start&&f.startTime<=start+3000);
 const intervals=frames.slice(1).map((f,i)=>f.startTime-frames[i].startTime).sort((a,b)=>a-b);
 const result={method:'3s native programmatic scroll, emulation; not a physical wheel or device trace',samples:frames.length,expected:180,p95:intervals[Math.ceil(intervals.length*.95)-1],maxLag:Math.max(...frames.map(f=>Math.abs(f.detail.targetP-f.detail.p))),scrollEvents:w.performance.getEntriesByName('hero:scroll').length};
 status.textContent=JSON.stringify(result);
};
const themeAudit=document.createElement('button');themeAudit.textContent='Theme audit';document.querySelector('#controls').append(themeAudit);
themeAudit.onclick=()=>{
 const w=frame.contentWindow,d=w.document;
 const hex=['F4EBD7','EADDC0','F8F1E1','3C2B19','291B0D','75603F','8C714F','C8B58F','4D7094','BD9161','6D5844','C9A86A','131313'];
 const forbidden=hex.map(h=>`rgb(${[0,2,4].map(i=>parseInt(h.slice(i,i+2),16)).join(', ')})`);
 const hits=Array.from(d.querySelectorAll('*')).flatMap(e=>{const s=w.getComputedStyle(e);return ['color','backgroundColor','borderColor'].filter(k=>forbidden.includes(s[k])).map(k=>({tag:e.tagName,class:e.className,property:k,value:s[k]}))});
 status.textContent=JSON.stringify({sections:d.querySelectorAll('main > section').length,cards:d.querySelectorAll('.thread-app-card').length,almanacHits:hits.length,hits});
};
const freeze=document.createElement('button');freeze.textContent='Freeze idle';document.querySelector('#controls').append(freeze);
freeze.onclick=()=>{frame.contentDocument.querySelector('#hero').dataset.reviewStill='true';status.textContent='Idle phase disabled for deterministic pose comparisons'};
const wheel=document.createElement('button');wheel.textContent='Arm wheel';document.querySelector('#controls').append(wheel);
wheel.onclick=()=>{
 const w=frame.contentWindow,h=w.document.querySelector('#hero');
 status.textContent='Armed: scroll in the hero';
 w.addEventListener('scroll',()=>{
  w.performance.clearMarks('hero:frame');w.performance.clearMarks('hero:scroll');h.dataset.trace='record';const start=w.performance.now();
  setTimeout(()=>{
   h.dataset.trace='';
   const samples=w.performance.getEntriesByName('hero:frame').filter(f=>f.startTime>=start&&f.startTime<=start+3000);
   const times=samples.slice(1).map((f,i)=>f.startTime-samples[i].startTime).sort((a,b)=>a-b);
   document.querySelector('#raw-trace').textContent=JSON.stringify({frames:samples.map(f=>({startTime:f.startTime,...f.detail})),scrolls:w.performance.getEntriesByName('hero:scroll').map(f=>({startTime:f.startTime,...f.detail}))});
   status.textContent=JSON.stringify({method:'3s browser wheel input; UNVERIFIED on device',samples:samples.length,p95:times[Math.ceil(times.length*.95)-1],maxLag:Math.max(...samples.map(f=>Math.abs(f.detail.targetP-f.detail.p))),scrollEvents:w.performance.getEntriesByName('hero:scroll').length,from:samples[0]?.detail.p,to:samples.at(-1)?.detail.p});
  },3000);
 },{once:true,passive:true});
};
const recording=document.createElement('button');recording.textContent='Record 10s';document.querySelector('#controls').append(recording);
recording.onclick=async()=>{
 const w=frame.contentWindow,h=w.document.querySelector('#hero');
 seek(0);await new Promise(r=>setTimeout(r,2000));
 status.textContent='Recording: programmatic viewport emulation, UNVERIFIED on device';
 const start=performance.now(),distance=h.offsetHeight-w.innerHeight;
 function step(now){const elapsed=Math.min(10,(now-start)/1000);const p=elapsed<=5?elapsed/5:(10-elapsed)/5;w.scrollTo({top:h.offsetTop+p*distance,behavior:'instant'});if(elapsed<10)requestAnimationFrame(step);else status.textContent='10s viewport emulation complete; real-phone recording still required'}
 requestAnimationFrame(step);
};

// Review actions become available only after the lazy scene has mounted.
document.querySelectorAll('button').forEach(b=>b.disabled=true);

const traceDetails=document.createElement('details');traceDetails.innerHTML='<summary>Raw performance marks</summary><pre id="raw-trace"></pre>';document.body.append(traceDetails);
const rendererInfo=document.createElement('button');rendererInfo.textContent='Renderer info';document.querySelector('#controls').append(rendererInfo);
rendererInfo.onclick=()=>{const w=frame.contentWindow,c=w.document.querySelector('canvas'),gl=c?.getContext('webgl2'),ext=gl?.getExtension('WEBGL_debug_renderer_info');status.textContent=JSON.stringify({dpr:w.devicePixelRatio,canvasWidth:c?.width,canvasHeight:c?.height,renderer:ext?gl.getParameter(ext.UNMASKED_RENDERER_WEBGL):null,vendor:ext?gl.getParameter(ext.UNMASKED_VENDOR_WEBGL):null})};
