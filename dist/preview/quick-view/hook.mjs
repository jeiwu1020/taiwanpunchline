const quickViewAllowed=host=>host==='codex-complete-challenge-story-taiwanpunchline.playformosa.workers.dev';
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
 session.setHandler(run);
 // Keep the control in the game frame: moving focus to the wrapper pauses gameplay.
 const toolbar=window.document?.querySelector('.toolbar');
 if(toolbar){
  const button=window.document.createElement('button');button.type='button';button.id='quick-view-advance';button.textContent='快速過關';button.title='僅快速看關：跳過目前路段或戰鬥回合，不跳過漫畫';button.style.cssText='background:#f9da8b;color:#16262b;min-height:40px';
  let busy=false;button.onclick=async()=>{if(busy)return;busy=true;button.disabled=true;try{const ok=await run();session.report(ok?'已跳過目前路段／回合。請按遊戲內的繼續，漫畫不會略過。':'目前不能跳過。請先開始、關閉選單或繼續漫畫。');}catch{session.report('此段未能跳過，可正常遊玩或重新進入。原存檔不受影響。');}finally{busy=false;button.disabled=false;}};
  toolbar.prepend(button);
 }
 return true;
}
