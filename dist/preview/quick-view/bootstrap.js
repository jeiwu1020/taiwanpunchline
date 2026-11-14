// Must run before every game script. Ordinary pages and production are inert.
(()=>{
 const host='codex-complete-challenge-story-taiwanpunchline.playformosa.workers.dev';
 if(location.hostname!==host||window.parent===window)return;
 let session;
 try{
  if(parent.location.origin!==location.origin||parent.location.pathname!=='/preview/quick-view/')return;
  session=parent.__quickViewSession;
  if(!session||session.frame.contentWindow!==window)return;
  for(const key of ['localStorage','sessionStorage']){
   const descriptor=Object.getOwnPropertyDescriptor(window,key);
   if(descriptor&&!descriptor.configurable)throw Error('Storage isolation unavailable');
  }
  Object.defineProperty(window,'localStorage',{value:session.local,configurable:false});
  Object.defineProperty(window,'sessionStorage',{value:session.tab,configurable:false});
  Object.defineProperty(window,'__quickViewIsolated',{value:session,configurable:false});
  session.clearHandler();
 }catch(error){
  // The stopped document may never paint. Show recovery in its surviving parent.
  try{session?.fail?.(window);}catch{}
  // Stop document parsing; never continue a preview with access to the real save.
  window.stop();document.open();document.write('<!doctype html><meta charset="utf-8"><p>無法安全隔離存檔，快速看關已停止。請關閉此頁，原存檔未變更。</p>');document.close();
  throw error;
 }
})();
