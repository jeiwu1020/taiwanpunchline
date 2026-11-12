import {mountChallengeDialogViewport} from './challenge-dialog-viewport.mjs?v=campaign-complete-20261112-r1';
import {openingFrame} from './challenge-opening-art.mjs?v=campaign-complete-20261112-r1';
// Explicit advances only. Story presentation owns no progress or save writes.
export function mountChallengeStory({document,paint,onAudio=()=>{},reducedMotion}={}){
 const root=document.createElement('dialog');root.className='challenge-story';root.setAttribute('aria-label','挑戰故事');
 root.innerHTML='<div class="story-panel"><canvas width="960" height="540" role="img" aria-label="漫畫分鏡"></canvas><div class="story-copy"><div class="story-heading"><small></small><h2></h2></div><p aria-live="polite"></p><div class="story-actions"><span></span><button type="button" data-story-next class="primary">繼續 →</button><button type="button" data-story-replay aria-label="重看開場漫畫">重看</button><button type="button" data-story-skip aria-label="略過開場漫畫並開始挑戰">略過</button><button type="button" data-story-return hidden>返回總覽</button></div></div></div>';
 document.querySelector('.app').append(root);
 const canvas=root.querySelector('canvas'),speaker=root.querySelector('small'),title=root.querySelector('h2'),copy=root.querySelector('p'),count=root.querySelector('.story-actions span'),button=root.querySelector('[data-story-next]'),replay=root.querySelector('[data-story-replay]'),skip=root.querySelector('[data-story-skip]'),back=root.querySelector('[data-story-return]');
 const win=document.defaultView,request=win?.requestAnimationFrame?.bind(win)||globalThis.requestAnimationFrame,cancel=win?.cancelAnimationFrame?.bind(win)||globalThis.cancelAnimationFrame;
 const preference=win?.matchMedia?.('(prefers-reduced-motion: reduce)');
 let beats=[],index=0,complete,character='wang',frame=0,start=null,disposed=false,finishing=false,completionEpoch=0,recovery=null,recoveryTokens=null;
 const reduced=()=>typeof reducedMotion==='function'?!!reducedMotion():reducedMotion??!!preference?.matches;
 const viewport=mountChallengeDialogViewport(root,{document,maxWidth:1280,savedRecoveryExit:()=>!disposed&&root.open&&!finishing?recovery?.savedReload:null,unreadyActionToken:e=>{const target=e.target?.closest?.('button');if(disposed||!root.open||finishing||recovery?.isCurrent?.()!==true||!target||target.disabled||target.hidden)return null;return target===button?recoveryTokens?.retry:target===back?recoveryTokens?.back:null;},anchor:()=>beats[0]?.shot?'top':'center',onFrame:({layout,width,maxHeight})=>{
  const cinematic=!!beats[0]?.shot;let cw=layout==='portrait'?720:960,ch=layout==='portrait'?680:540;
  if(cinematic){const f=openingFrame(width,maxHeight,layout),ratio=720/f.artWidth;cw=720;ch=Math.round(f.artHeight*ratio);
   root.style.setProperty('--story-frame-height',f.height+'px');root.style.setProperty('--story-copy-height',f.copyHeight+'px');root.style.setProperty('--story-copy-width',f.copyWidth+'px');
  }
  if(canvas.width!==cw)canvas.width=cw;if(canvas.height!==ch)canvas.height=ch;
 }});
 function draw(time){if(!root.open||disposed||!beats[index])return;if(start===null)start=time;const motion=reduced();canvas.dataset.reducedMotion=String(motion);
  paint?.(canvas,beats[index],character,time-start,{layout:root.dataset.layout,width:canvas.width,height:canvas.height,reducedMotion:motion});frame=request(draw);
 }
 function sync(){const beat=beats[index];if(!beat)return;start=null;speaker.textContent=beat.speaker;title.textContent=beat.title;copy.textContent=beat.copy;
  canvas.setAttribute('aria-label',beat.description||`${beat.title}。${beat.copy}`);count.textContent=`${index+1} / ${beats.length}`;button.textContent=index===beats.length-1?'出發 →':'下一格 →';
  root.dataset.cinematic=String(!!beats[0]?.shot);root.dataset.shot=beat.shot||'boss';replay.hidden=skip.hidden=!beats[0]?.shot;root.scrollTop=0;
 }
 function close(){completionEpoch++;finishing=false;recovery=null;recoveryTokens=null;delete root.dataset.displayRecovery;back.hidden=true;button.hidden=false;root.removeAttribute('aria-busy');for(const control of root.querySelectorAll('.story-actions button'))control.disabled=false;cancel?.(frame);frame=0;complete=null;start=null;if(root.open)root.close();viewport.sync();}
 function finish(){
  if(!root.open||finishing)return;const cb=complete,epoch=completionEpoch;complete=null;finishing=true;root.setAttribute('aria-busy','true');for(const control of root.querySelectorAll('.story-actions button'))control.disabled=true;
  let result;try{result=cb?.();}catch(error){if(epoch===completionEpoch)close();throw error;}
  const done=value=>{if(epoch!==completionEpoch||!root.open)return;
   // Only an explicit owned display-recovery contract retains this modal.
   // Bare false/cancelled results still close, and stale results cannot reopen it.
   if(value?.accepted===false&&value.reason==='scene-unavailable'&&value.isCurrent?.()!==false&&(typeof value.retryPresentation==='function'||typeof value.returnToOverview==='function')){
    recovery=value;recoveryTokens={retry:{},back:{}};complete=value.retryPresentation;finishing=false;root.removeAttribute('aria-busy');copy.textContent=value.message||'場景尚未顯示，請重試顯示或返回總覽。';button.textContent='重試顯示';
    for(const control of root.querySelectorAll('.story-actions button')){control.hidden=control!==button&&control!==back;control.disabled=false;}
    button.hidden=typeof value.retryPresentation!=='function';back.hidden=typeof value.returnToOverview!=='function';root.dataset.displayRecovery=button.hidden?'return':back.hidden?'retry':'both';(button.hidden?back:button).focus();viewport.sync();return;
   }close();
  };if(result?.then)Promise.resolve(result).then(done,()=>done(false));else done(result);
 }
 button.onclick=()=>{if(!root.open||finishing)return;onAudio();if(!recovery&&index+1<beats.length){index++;sync();return;}finish();};
 replay.onclick=()=>{if(!root.open||finishing)return;onAudio();index=0;sync();button.focus();};
 skip.onclick=()=>{if(!root.open||finishing)return;onAudio();finish();};
 back.onclick=()=>{if(!root.open||finishing||!recovery)return;const leave=recovery.returnToOverview;close();leave?.();};
 root.addEventListener('cancel',e=>e.preventDefault());
 function show(next,{characterId='wang',onComplete}={}){
  if(disposed)return false;close();beats=Array.isArray(next)?next:[];if(!beats.length)return false;
  index=0;character=characterId;complete=onComplete;sync();viewport.sync();root.showModal();button.focus();frame=request(draw);return true;
 }
 return{show,refreshRecovery(){if(recovery)viewport.sync();},get presentationEpoch(){return completionEpoch;},showRecovery(result,next,options={}){if(result?.accepted!==false||result.reason!=='scene-unavailable'||!show(next,options))return false;index=beats.length-1;sync();complete=()=>result;finish();return true;},close,destroy(){close();disposed=true;viewport.destroy();root.remove();}};
}
