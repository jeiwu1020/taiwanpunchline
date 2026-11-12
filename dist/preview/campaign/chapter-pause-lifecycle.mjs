/** A backgrounding request survives every durable scene transition, not only restarts. */
export function mountChapterPauseLifecycle({document,window=document.defaultView,getChapter,isPending=()=>false,clearHold=()=>{},onChange=()=>{},onFrameReset=()=>{}}){
 let requested=false;
 function sync(){const chapter=getChapter(),state=chapter?.view();if(!state)return state;if(document.hidden)requested=true;if(requested&&['route','battle'].includes(state.mode)){if(state.paused)requested=false;else if(!state.busy&&chapter.setPaused(true,state.token))requested=false;}return chapter.view();}
 function request(){clearHold();if(getChapter()||isPending())requested=true;sync();onFrameReset();onChange();}
 function visibility(){if(document.hidden)request();else onFrameReset();}
 window.addEventListener('blur',request);document.addEventListener('visibilitychange',visibility);
 return{sync,get blocked(){return requested||!!document.hidden;},resume(){const chapter=getChapter(),state=chapter?.view();if(!state||document.hidden||state.busy||state.blocked)return false;const accepted=chapter.setPaused(false,state.token);if(accepted)requested=false;return accepted;},destroy(){window.removeEventListener('blur',request);document.removeEventListener('visibilitychange',visibility);}};
}
