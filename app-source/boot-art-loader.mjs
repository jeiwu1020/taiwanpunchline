// Native image requests avoid retaining a second XHR Blob for every decoded
// picture. Advancing this queue does not depend on Phaser's animation frames.
export function createBootArtLoader({entries,createImage=()=>new Image(),limit=4,timeoutMs=45000,retries=1,setTimer=setTimeout,clearTimer=clearTimeout,onChange=()=>{}}){
 const jobs=entries.map(entry=>({...entry,state:'pending',attempt:0,requests:0,cancel:null})),images={},optionalFailures=new Set();
 let started=false,disposed=false,active=0;
 function snapshot(){
  const unsettled=jobs.filter(job=>job.state==='pending'||job.state==='loading'),failed=jobs.filter(job=>job.state==='failed'&&!job.optional).map(job=>job.key);
  return {status:unsettled.length?'loading':failed.length?'failed':'ready',progress:(jobs.length-unsettled.length)/Math.max(1,jobs.length),remaining:unsettled.map(job=>job.key),retrying:unsettled.filter(job=>job.attempt>1).length,failed,images,optionalFailures};
 }
 function notify(){if(!disposed)onChange(snapshot());}
 function pump(){
  if(disposed)return;
  for(const job of jobs){if(active>=limit)break;if(job.state==='pending')load(job);}
  notify();
 }
 function load(job){
  active++;job.state='loading';job.attempt++;job.requests++;
  const image=createImage();let settled=false,timer;
  function cleanup(){clearTimer(timer);image.onload=null;image.onerror=null;job.cancel=null;}
  function finish(ok){
   if(settled||disposed)return;settled=true;cleanup();active--;
   if(ok&&image.naturalWidth>0&&image.naturalHeight>0){job.state='ready';images[job.key]=image;optionalFailures.delete(job.key);}
   else {image.removeAttribute?.('src');job.state=job.attempt<=retries?'pending':'failed';if(job.state==='failed'&&job.optional)optionalFailures.add(job.key);}
   pump();
  }
  job.cancel=()=>{settled=true;cleanup();image.removeAttribute?.('src');};
  image.onload=()=>finish(true);image.onerror=()=>finish(false);
  timer=setTimer(()=>finish(false),timeoutMs);
  // Safari can coalesce a new Image with a still-pending request for the same
  // URL. A retry must bypass that request, including after the retry button.
  image.src=job.requests===1?job.url:job.url+(job.url.includes('?')?'&':'?')+'boot-retry='+job.requests;
 }
 return {
  start(){if(!started&&!disposed){started=true;pump();}},
  retry(){if(disposed||!started||active)return false;for(const job of jobs)if(job.state==='failed'){job.state='pending';job.attempt=0;}pump();return true;},
  dispose(){disposed=true;for(const job of jobs)job.cancel?.();},
 };
}
