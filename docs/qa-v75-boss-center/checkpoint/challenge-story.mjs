import {mountChallengeDialogViewport} from './challenge-dialog-viewport.mjs?v=71';
import {openingFrame} from './challenge-opening-art.mjs?v=75';
// Explicit advances only. Story presentation owns no progress or save writes.
export function mountChallengeStory({document,paint,onAudio=()=>{},reducedMotion}={}){
 const root=document.createElement('dialog');root.className='challenge-story';root.setAttribute('aria-label','挑戰故事');
 root.innerHTML='<div class="story-panel"><canvas width="960" height="540" role="img" aria-label="漫畫分鏡"></canvas><div class="story-copy"><div class="story-heading"><small></small><h2></h2></div><p aria-live="polite"></p><div class="story-actions"><span></span><button type="button" data-story-next class="primary">繼續 →</button><button type="button" data-story-replay aria-label="重看開場漫畫">重看</button><button type="button" data-story-skip aria-label="略過開場漫畫並開始挑戰">略過</button></div></div></div>';
 document.querySelector('.app').append(root);
 const canvas=root.querySelector('canvas'),speaker=root.querySelector('small'),title=root.querySelector('h2'),copy=root.querySelector('p'),count=root.querySelector('.story-actions span'),button=root.querySelector('[data-story-next]'),replay=root.querySelector('[data-story-replay]'),skip=root.querySelector('[data-story-skip]');
 const win=document.defaultView,request=win?.requestAnimationFrame?.bind(win)||globalThis.requestAnimationFrame,cancel=win?.cancelAnimationFrame?.bind(win)||globalThis.cancelAnimationFrame;
 const preference=win?.matchMedia?.('(prefers-reduced-motion: reduce)');
 let beats=[],index=0,complete,character='wang',frame=0,start=null,disposed=false;
 const reduced=()=>typeof reducedMotion==='function'?!!reducedMotion():reducedMotion??!!preference?.matches;
 const viewport=mountChallengeDialogViewport(root,{document,maxWidth:1280,onFrame:({layout,width,maxHeight})=>{
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
 function close(){cancel?.(frame);frame=0;complete=null;start=null;if(root.open)root.close();}
 function finish(){if(!root.open)return;const cb=complete;close();cb?.();}
 button.onclick=()=>{if(!root.open)return;onAudio();if(index+1<beats.length){index++;sync();return;}finish();};
 replay.onclick=()=>{if(!root.open)return;onAudio();index=0;sync();button.focus();};
 skip.onclick=()=>{if(!root.open)return;onAudio();finish();};
 root.addEventListener('cancel',e=>e.preventDefault());
 return{show(next,{characterId='wang',onComplete}={}){
  if(disposed)return false;close();beats=Array.isArray(next)?next:[];if(!beats.length)return false;
  index=0;character=characterId;complete=onComplete;sync();viewport.sync();root.showModal();button.focus();frame=request(draw);return true;
 },close,destroy(){close();disposed=true;viewport.destroy();root.remove();}};
}
