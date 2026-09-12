const params=new URLSearchParams(location.search), frame=document.querySelector('#app');
frame.width=params.get('w')||1440;frame.height=params.get('h')||900;frame.src='/?hero=thread';
let requested=0;
const status=document.querySelector('#status');
function seek(p){requested=p;const w=frame.contentWindow,h=w.document.querySelector('#hero');w.scrollTo({top:h.offsetTop+p*(h.offsetHeight-w.innerHeight),behavior:'instant'});requestAnimationFrame(()=>requestAnimationFrame(()=>status.textContent=`p=${h.dataset.progress}; ready=${h.dataset.ready}`));}
document.querySelectorAll('[data-p]').forEach(b=>b.onclick=()=>seek(Number(b.dataset.p)));
document.querySelector('#reverse').onclick=()=>{const w=frame.contentWindow;w.scrollTo({top:0,behavior:'instant'});seek(0)};
frame.onload=()=>{const timer=setInterval(()=>{const h=frame.contentDocument.querySelector('#hero');if(h?.dataset.ready==='true'){clearInterval(timer);seek(requested)}},100)};
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
 for(const p of [0,.3,.55,.78,1]){
  seek(p);await settled();
  const a=w.document.querySelector(p===1?'.thread-landing-actions a':'.thread-act-actions a');
  const rect=a.getBoundingClientRect();
  const before={p,visible:rect.top>=0&&rect.bottom<=w.innerHeight,href:a.getAttribute('href')};
  a.click();await new Promise(r=>setTimeout(r,1400));
  results.push({...before,hash:w.location.hash,portfolioTop:Math.round(w.document.querySelector('#portfolio').getBoundingClientRect().top)});
 }
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
