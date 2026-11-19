import {resolveDialogueFrame} from './character-dialogue.mjs?v=chapter-presentation-20261117-r1';
import {mountChallengeDialogViewport} from './challenge-dialog-viewport.mjs?v=chapter-presentation-20261117-r1';
import {openingFrame} from './challenge-opening-art.mjs?v=chapter-presentation-20261117-r1';
import {createComicReadingPosition} from './story-comic-reading.mjs?v=chapter-presentation-20261117-r1';
import {drawBubble} from './starter-comic-layout.mjs?v=chapter-presentation-20261117-r1';
// Explicit advances only. Story presentation owns no progress or save writes.
export function mountChallengeStory({document,paint,paintComic,onRetryArt,isArtLoading=()=>false,onAudio=()=>{},reducedMotion}={}){
 const root=document.createElement('dialog');root.className='challenge-story';root.dataset.comicReader='true';root.setAttribute('aria-label','挑戰故事');
 root.innerHTML='<div class="story-panel"><canvas width="960" height="540" role="img" aria-label="漫畫分鏡"></canvas><div class="story-copy"><div class="story-heading"><small></small><h2 hidden></h2></div><p data-story-transcript aria-live="polite"></p><div class="story-recovery" role="status" hidden></div><div class="story-actions"><span></span><button type="button" data-story-previous aria-label="上一句" hidden>←</button><button type="button" data-story-next class="primary">下一格 →</button><button type="button" data-story-replay aria-label="重看此段漫畫">重看此段</button><button type="button" data-story-skip aria-label="略過此段漫畫">略過此段</button><button type="button" data-story-return hidden>返回總覽</button></div></div></div>';
 document.querySelector('.app').append(root);
 const canvas=root.querySelector('canvas'),speaker=root.querySelector('small'),title=root.querySelector('h2'),copy=root.querySelector('p'),count=root.querySelector('.story-actions span'),button=root.querySelector('[data-story-next]'),replay=root.querySelector('[data-story-replay]'),skip=root.querySelector('[data-story-skip]'),back=root.querySelector('[data-story-return]');
 const previous=root.querySelector('[data-story-previous]'),feedback=root.querySelector('.story-recovery'),reading=createComicReadingPosition();
 const win=document.defaultView,request=win?.requestAnimationFrame?.bind(win)||globalThis.requestAnimationFrame,cancel=win?.cancelAnimationFrame?.bind(win)||globalThis.cancelAnimationFrame;
 const preference=win?.matchMedia?.('(prefers-reduced-motion: reduce)');
 let beats=[],index=0,complete,character='wang',frame=0,start=null,disposed=false,finishing=false,retrying=false,completionEpoch=0,recovery=null,recoveryTokens=null,owner={},artIssue=null,paintReady=false;
 const reduced=()=>typeof reducedMotion==='function'?!!reducedMotion():reducedMotion??!!preference?.matches;
 // Only a prepared whole-scene painter opts into the new surface. The existing
 // four-panel opening remains untouched, including its original shot geometry.
 const fullComic=()=>typeof paintComic==='function'&&!beats[0]?.shot;
 const readingState=()=>({mode:'story',stepId:beats.some(b=>b.voiceKey?.startsWith('c1.handoff'))?'handoff-comic':beats[0]?.phase===3?'miniboss-a':beats[0]?.phase===4?'miniboss-b':'boss-comic',frameIndex:index,frameCount:beats.length,characterId:character,storyFrame:beats[index]});
 const viewport=mountChallengeDialogViewport(root,{document,maxWidth:1280,savedRecoveryExit:()=>!disposed&&root.open&&!finishing?recovery?.savedReload:null,unreadyActionToken:e=>{const target=e.target?.closest?.('button');if(disposed||!root.open||finishing||recovery?.isCurrent?.()!==true||!target||target.disabled||target.hidden)return null;return target===button?recoveryTokens?.retry:target===back?recoveryTokens?.back:null;},anchor:()=>fullComic()||beats[0]?.shot?'top':'center',onFrame:({layout,width,maxHeight})=>{
  const cinematic=!!beats[0]?.shot;let cw=layout==='portrait'?720:960,ch=layout==='portrait'?680:540;
  if(fullComic()){
   cw=Math.max(240,Math.round(width-16));const footer=cw<520?112:76;ch=Math.max(layout==='landscape'?180:260,Math.round(maxHeight-footer-16));root.dataset.comicNarrow=String(cw<520);
   root.style.setProperty('--story-frame-height',(ch+footer)+'px');root.style.setProperty('--story-art-height',ch+'px');root.style.setProperty('--story-copy-height',footer+'px');root.style.setProperty('--story-copy-width','100%');reading.resize(cw,ch);
  }else if(cinematic){const f=openingFrame(width,maxHeight,layout);if(layout==='portrait'){f.copyHeight=Math.min(320,Math.max(280,f.height*.4));f.artHeight=Math.max(1,f.height-f.copyHeight);}const ratio=720/f.artWidth;cw=720;ch=Math.round(f.artHeight*ratio);
   root.style.setProperty('--story-frame-height',f.height+'px');root.style.setProperty('--story-copy-height',f.copyHeight+'px');root.style.setProperty('--story-copy-width',f.copyWidth+'px');
  }
  // Assigning canvas.width/height erases its pixels. During a durable handoff
  // or owned recovery keep the last painted cover; CSS can contain it after
  // rotation without starting another animation or completion callback.
  if(!finishing&&!recovery){if(canvas.width!==cw){canvas.width=cw;paintReady=false;}if(canvas.height!==ch){canvas.height=ch;paintReady=false;}}
  if(fullComic()&&beats[index]&&!finishing&&!recovery){sync();queuePaint(false);}
 }});
 function queuePaint(reset=true){cancel?.(frame);frame=0;if(reset){start=null;paintReady=false;}if(root.open&&!disposed&&!finishing&&!recovery){if(fullComic())sync();frame=request(draw);}}
 function draw(time){frame=0;if(!root.open||disposed||finishing||!beats[index]||recovery)return;if(start===null)start=time;const motion=reduced(),elapsed=Math.max(0,time-start);canvas.dataset.reducedMotion=String(motion);
  try{
   if(fullComic()){
    const state=readingState();reading.sync(state,owner);const layout=reading.resize(canvas.width,canvas.height),options={layout:root.dataset.layout,width:canvas.width,height:canvas.height,reducedMotion:motion,comicLayout:layout,comicState:state};
    if(paintComic(canvas,beats[index],character,motion?2400:Math.min(2400,elapsed),options)===false){
     if(isArtLoading()){paintReady=false;artIssue=null;feedback.textContent='漫畫圖片載入中…';feedback.hidden=false;sync();return;}
     throw new Error('Comic assets are not ready');
    }
    const ctx=canvas.getContext('2d');for(const bubble of layout.bubbles)drawBubble(ctx,bubble,layout.font);ctx.strokeStyle='#173239';ctx.lineWidth=3;ctx.strokeRect(8,8,canvas.width-16,canvas.height-16);
    paintReady=true;artIssue=null;feedback.hidden=true;sync();
    if(!motion&&elapsed<2400)frame=request(draw);
   }else{paint?.(canvas,beats[index],character,elapsed,{layout:root.dataset.layout,width:canvas.width,height:canvas.height,reducedMotion:motion});frame=request(draw);}
  }catch(error){if(!fullComic())throw error;paintReady=false;artIssue=error;feedback.textContent='漫畫畫面尚未準備好。可重試顯示，或略過本段漫畫。';feedback.hidden=false;sync();}
 }
 function sync(){const beat=beats[index];if(!beat)return;const full=fullComic(),layout=reading.sync(readingState(),owner);speaker.textContent=beat.speaker;title.textContent=beat.title;
  copy.textContent=full?layout.bubbles.map(b=>`${b.speaker}：${b.text}`).join(' '):beat.copy;
  canvas.setAttribute('aria-label',full?copy.textContent:beat.description||`${beat.speaker}：${beat.copy}`);
  count.textContent=full?`${index+1} / ${beats.length} · ${layout.currentIndex+1} / ${layout.fragments.length} 句`:`${index+1} / ${beats.length}`;
  button.textContent=artIssue?'重試顯示':full&&layout.nextAnchor!==null?'下一句 →':index===beats.length-1?'出發 →':'下一格 →';
  button.disabled=finishing||retrying||full&&!paintReady&&!artIssue;
  previous.hidden=!full;previous.disabled=finishing||full&&!paintReady||!!artIssue||index===0&&layout.previousAnchor===null;
  replay.textContent=full?'重看':'重看此段';skip.textContent=full?'略過':'略過此段';
  root.dataset.fullComic=String(full);root.dataset.cinematic=String(!!beats[0]?.shot);root.dataset.shot=beat.shot||'boss';root.dataset.comicVoice=beat.speaker==='旁白'?'narration':'dialogue';replay.hidden=skip.hidden=false;
 }
 function close(){completionEpoch++;finishing=false;retrying=false;recovery=null;recoveryTokens=null;artIssue=null;paintReady=false;feedback.hidden=true;delete root.dataset.displayRecovery;back.hidden=true;button.hidden=false;root.removeAttribute('aria-busy');for(const control of root.querySelectorAll('.story-actions button'))control.disabled=false;cancel?.(frame);frame=0;complete=null;start=null;if(root.open)root.close();viewport.sync();}
 function finish(){
  if(!root.open||finishing)return;const cb=complete,epoch=completionEpoch;complete=null;finishing=true;cancel?.(frame);frame=0;root.setAttribute('aria-busy','true');for(const control of root.querySelectorAll('.story-actions button'))control.disabled=true;
  let result;try{result=cb?.();}catch(error){if(epoch===completionEpoch)close();throw error;}
  const done=value=>{if(epoch!==completionEpoch||!root.open)return;
   // Only an explicit owned display-recovery contract retains this modal.
   // Bare false/cancelled results still close, and stale results cannot reopen it.
   if(value?.accepted===false&&value.reason==='scene-unavailable'&&value.isCurrent?.()!==false&&(typeof value.retryPresentation==='function'||typeof value.returnToOverview==='function')){
    recovery=value;recoveryTokens={retry:{},back:{}};complete=value.retryPresentation;finishing=false;root.removeAttribute('aria-busy');copy.textContent=value.message||'場景尚未顯示，請重試顯示或返回總覽。';feedback.textContent=copy.textContent;feedback.hidden=!fullComic();button.textContent='重試顯示';
    for(const control of root.querySelectorAll('.story-actions button')){control.hidden=control!==button&&control!==back;control.disabled=false;}
    button.hidden=typeof value.retryPresentation!=='function';back.hidden=typeof value.returnToOverview!=='function';root.dataset.displayRecovery=button.hidden?'return':back.hidden?'retry':'both';(button.hidden?back:button).focus();viewport.sync();return;
   }close();
  };if(result?.then)Promise.resolve(result).then(done,()=>done(false));else done(result);
 }
 button.onclick=()=>{if(!root.open||finishing||retrying)return;onAudio();if(artIssue&&!recovery){
  if(typeof onRetryArt!=='function'){queuePaint(false);return;}
  const currentOwner=owner,epoch=completionEpoch;retrying=true;sync();Promise.resolve().then(onRetryArt).catch(()=>{}).finally(()=>{if(owner!==currentOwner||epoch!==completionEpoch)return;retrying=false;if(!disposed&&root.open&&!finishing&&!recovery)queuePaint(false);});return;
 }if(!recovery&&fullComic()&&!paintReady){queuePaint(false);return;}if(!recovery&&fullComic()&&reading.advance(1)){sync();queuePaint(false);return;}if(!recovery&&index+1<beats.length){index++;sync();root.scrollTop=0;queuePaint(true);return;}finish();};
 previous.onclick=()=>{if(!root.open||finishing||recovery||artIssue||!paintReady||!fullComic())return;onAudio();if(reading.advance(-1)){sync();queuePaint(false);return;}if(index>0){reading.landOnPrevious(readingState(),owner);index--;sync();root.scrollTop=0;queuePaint(true);}};
 replay.onclick=()=>{if(!root.open||finishing||recovery)return;onAudio();index=0;reading.reset();sync();root.scrollTop=0;queuePaint(true);button.focus();};
 skip.onclick=()=>{if(!root.open||finishing||recovery)return;onAudio();finish();};
 back.onclick=()=>{if(!root.open||finishing||!recovery)return;const leave=recovery.returnToOverview;close();leave?.();};
 root.addEventListener('keydown',event=>{if(!fullComic()||recovery||finishing||!['ArrowLeft','ArrowRight'].includes(event.key))return;event.preventDefault();event.stopPropagation();if(!event.repeat)(event.key==='ArrowLeft'?previous:button).click();});
 root.addEventListener('cancel',e=>e.preventDefault());
 function show(next,{characterId='wang',onComplete}={}){
  if(disposed)return false;close();beats=Array.isArray(next)?next.map(beat=>resolveDialogueFrame(beat,characterId)):[];if(!beats.length)return false;
  index=0;character=characterId;owner={};reading.reset();complete=onComplete;sync();viewport.sync();root.showModal();root.scrollTop=0;button.focus();queuePaint(true);return true;
 }
 return{show,refreshArt(){if(root.open&&fullComic()&&!finishing&&!recovery&&!disposed)queuePaint(false);},refreshRecovery(){if(recovery)viewport.sync();},get presentationEpoch(){return completionEpoch;},showRecovery(result,next,options={}){if(result?.accepted!==false||result.reason!=='scene-unavailable'||!show(next,options))return false;index=beats.length-1;sync();complete=()=>result;finish();return true;},close,destroy(){close();disposed=true;viewport.destroy();root.remove();}};
}
