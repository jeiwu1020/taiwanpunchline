// Local QA only. Fault injection occurs at the real Storage/Lock boundary.
const namespace='formalQA-nov11:';
const mapped=k=>/^(taiwanpunchline-|parliament-)/.test(String(k))?namespace+k:k;
let failure=false,release=null;const original=Storage.prototype.setItem,read=Storage.prototype.getItem,remove=Storage.prototype.removeItem;
Storage.prototype.getItem=function(k){return read.call(this,mapped(k));};
Storage.prototype.removeItem=function(k){return remove.call(this,mapped(k));};
Storage.prototype.setItem=function(k,v){if(failure&&k.startsWith('taiwanpunchline-progress'))throw new DOMException('QA synthetic storage quota failure','QuotaExceededError');return original.call(this,mapped(k),v);};
window.addEventListener('message',async e=>{if(e.origin!==location.origin||e.source!==parent||!e.data?.formalQA)return;
 const a=e.data.action;if(a==='fail-on')failure=true;if(a==='fail-off')failure=false;
 if(a==='busy-on'&&!release){navigator.locks.request('taiwanpunchline-progress-v3:root-write',{mode:'exclusive'},()=>new Promise(r=>{release=r;parent.postMessage({formalQA:true,lock:'held'},location.origin);}));}
 if(a==='busy-off'){release?.();release=null;}
 if(a==='stale'){const {openUnifiedProgress}=await import('/preview/campaign/unified/progress.mjs');const p=await openUnifiedProgress({storage:localStorage,locks:navigator.locks});await p.allocate('wang','move');parent.postMessage({formalQA:true,staleRevision:p.get().revision},location.origin);}
});
