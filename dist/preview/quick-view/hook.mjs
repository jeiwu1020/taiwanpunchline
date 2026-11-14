import {DEVELOPMENT_TOOLS} from '../../release-features.mjs';
const quickViewAllowed=host=>DEVELOPMENT_TOOLS&&host==='codex-complete-challenge-story-taiwanpunchline.playformosa.workers.dev';
export function requireQuickViewIsolation(window){
 if(!quickViewAllowed(window.location.hostname)||window.parent===window)return;
 let wrapper=false;
 try{wrapper=window.parent.location.origin===window.location.origin&&window.parent.location.pathname==='/preview/quick-view/';}catch{return;}
 if(wrapper&&(!window.__quickViewIsolated||window.localStorage!==window.__quickViewIsolated.local||window.sessionStorage!==window.__quickViewIsolated.tab))throw Error('Quick view storage isolation is required');
}
if(typeof window!=='undefined')requireQuickViewIsolation(window);
export function registerQuickView(window,advance){
 if(!quickViewAllowed(window.location.hostname)||window.parent===window)return false;
 const session=window.__quickViewIsolated;
 if(!session||session!==window.parent.__quickViewSession||session.frame.contentWindow!==window||window.localStorage!==session.local)return false;
 const run=async()=>{
  if(window.__quickViewIsolated!==session||session.frame.contentWindow!==window||window.localStorage!==session.local)return false;
  return advance();
 };
 session.setHandler(run,window.document);
 return true;
}
