import {createProloguePlayer,prologueEntry} from './starter-prologue.mjs?v=chapter-presentation-20261117-r1';
import {fitWindowHeight,paintStarterComic} from './starter-comic-layout.mjs?v=chapter-presentation-20261117-r1';
import {mountChallengeDialogViewport} from './challenge-dialog-viewport.mjs?v=chapter-presentation-20261117-r1';
export const STARTER_ART_FILES=Object.freeze({
 'starter-wang':'starter-prologue/wang-complete-poses-b.png','starter-han':'starter-prologue/han-complete-poses-b.png',
 'starter-wangRoom':'starter-prologue/wang-bedroom-b.png','starter-hanRoom':'starter-prologue/han-bedroom-b.png',
 'starter-news':'starter-prologue/news-chamber-b.png',
});
// No new save schema or global seen flag. Existing empty slots have never entered
// a route; ChallengeSession's original beginRouteAttempt is the durable boundary.
// Every nonempty legacy record is ambiguous and must continue without a wake-up.
export function starterOpeningMode({profiles,characterId,replay=false,review=false}={}){
 if(!['wang','han'].includes(characterId))return 'legacy';
 if(review)return 'review';
 const state=profiles.get(),profile=profiles.getCurrentProfile(),challenge=profile.challenge;
 // Fresh campaign slots have an explicit comic receipt. Merely saving a party
 // must not consume it or rely on the old empty-profile heuristic.
 if(profile.campaign){const c=profile.campaign;return prologueEntry({chapterId:c.cursor.chapterId,checkpoint:c.cursor.stepId==='entry'?0:1,completed:c.chapterClears.includes('chapter-1'),openingState:c.story.opening,isReplay:replay});}
 const unstarted=challenge&&typeof challenge==='object'&&!Array.isArray(challenge)&&Object.keys(challenge).length===0&&state.storageIssue!=='unsupported';
 return prologueEntry({openingState:unstarted?'unseen':'legacy-unknown',checkpoint:challenge?.checkpoint??0,completed:challenge?.completed===true,isReplay:replay});
}
export function paintIntegratedStarter(canvas,images,scene,{width,height,dpr=1,time=0,reducedMotion=false}={}){
 const context=canvas.getContext('2d');context.setTransform(dpr,0,0,dpr,0,0);
 return paintStarterComic(context,{wang:images['starter-wang'],han:images['starter-han'],wangRoom:images['starter-wangRoom'],hanRoom:images['starter-hanRoom'],news:images['starter-news'],props:images['opening-props-v75'],street:images['challenge-street']},scene,width,height,{time,reducedMotion});
}
export function mountStarterOpening({document,paint,onAudio=()=>{},reducedMotion}={}){
 const win=document.defaultView,root=document.createElement('dialog');root.className='challenge-story starter-opening';root.setAttribute('aria-label','雙角色開場漫畫');
 root.innerHTML='<div class="starter-panel"><canvas role="img" aria-label="漫畫分鏡"></canvas><p class="starter-transcript" data-starter-transcript aria-live="polite"></p></div><div class="starter-controls"><span data-starter-count></span><button type="button" data-starter-previous aria-label="上一句">←</button><button type="button" data-starter-next class="primary">下一句 →</button><button type="button" data-starter-replay>重看</button><button type="button" data-starter-skip>略過</button></div>';
 document.querySelector('.app').append(root);
 const canvas=root.querySelector('canvas'),transcript=root.querySelector('[data-starter-transcript]'),next=root.querySelector('[data-starter-next]'),previous=root.querySelector('[data-starter-previous]'),skip=root.querySelector('[data-starter-skip]'),replay=root.querySelector('[data-starter-replay]'),count=root.querySelector('[data-starter-count]');
 const request=win?.requestAnimationFrame?.bind(win),cancel=win?.cancelAnimationFrame?.bind(win),preference=win?.matchMedia?.('(prefers-reduced-motion: reduce)');
 let player=null,callback=null,mode='new-run',frame=0,started=0,geometry={width:374,maxHeight:828},logicalWidth=366,logicalHeight=730,dpr=1,disposed=false,previousFocus=null,finishing=false,finishEpoch=0;
 const reduced=()=>typeof reducedMotion==='function'?!!reducedMotion():reducedMotion??!!preference?.matches;
 function stop(){if(frame)cancel?.(frame);frame=0;}
 function paintAt(time){if(!player||!root.open)return;paint?.(canvas,player.scene,{width:logicalWidth,height:logicalHeight,dpr,time:reduced()?2500:time,reducedMotion:!!reduced()});}
 function tick(now){frame=0;if(!root.open||player?.done||disposed)return;const elapsed=Math.max(0,now-started),flying=['window','wardrobe','chase','street'].includes(player.scene.art);paintAt(flying?elapsed:Math.min(elapsed,5000));if(flying||elapsed<5000)frame=request?.(tick)||0;}
 function draw(reset=false){
  stop();if(!player||!root.open||disposed)return;if(reset)started=win.performance.now();
  const scene=player.scene,visible=scene.visibleBubbleCount;root.dataset.scene=scene.id;root.dataset.character=scene.characterId;root.dataset.mode=mode;
  transcript.textContent=scene.description+' '+scene.bubbles.slice(0,visible).map(b=>b.speaker+'：'+b.text.replaceAll('\n','')).join(' ');canvas.setAttribute('aria-label',transcript.textContent);
  count.textContent=`${player.index+1} / ${player.count} 格`;previous.disabled=player.index===0&&visible===1;next.textContent=visible<scene.bubbles.length?'下一句 →':player.index===player.count-1?(mode==='review'?'看完了 →':'前往街口 →'):'下一格 →';skip.textContent=mode==='review'?'關閉':'略過';
  // Use the shared rotated viewport's logical width, never a screen-space rect.
  logicalWidth=Math.max(240,Math.round(geometry.width-14));logicalHeight=Math.max(logicalWidth<520?380:280,Math.min(1050,Math.round(geometry.maxHeight-80)));
  if(scene.art==='window'||scene.art==='wardrobe')logicalHeight=fitWindowHeight(logicalWidth,logicalHeight,scene.bubbles);
  const onePage=geometry.width>=900&&geometry.maxHeight>=500,availableHeight=Math.max(1,geometry.maxHeight-80),scale=onePage?Math.min(1,availableHeight/logicalHeight):1;
  root.dataset.onePage=String(onePage);
  dpr=Math.min(2,Math.max(1,win.devicePixelRatio||1));canvas.width=Math.round(logicalWidth*dpr);canvas.height=Math.round(logicalHeight*dpr);canvas.style.width=(logicalWidth*scale)+'px';canvas.style.height=(logicalHeight*scale)+'px';
  canvas.dataset.reducedMotion=String(!!reduced());paintAt(Math.max(0,win.performance.now()-started));if(!reduced())frame=request?.(tick)||0;
 }
 const viewport=mountChallengeDialogViewport(root,{document,maxWidth:1100,onFrame:f=>{geometry=f;draw(false);}});
 function close(){stop();finishEpoch++;finishing=false;root.removeAttribute('aria-busy');for(const button of [next,previous,skip,replay])button.disabled=false;callback=null;player?.close();if(root.open)root.close();previousFocus?.focus?.({preventScroll:true});}
 function finish(event){
  if(!root.open||finishing)return;const cb=callback;callback=null;
  if(mode!=='new-run'){close();cb?.(event);return;}
  finishing=true;stop();root.setAttribute('aria-busy','true');for(const button of [next,previous,skip,replay])button.disabled=true;
  const epoch=finishEpoch;let result;try{result=cb?.(event);}catch(error){close();throw error;}
  if(!result?.then){close();return;}
  // The destination callback resolves only when the committed scene is drawn.
  // Keep the final comic covering the previous arena until that signal.
  Promise.resolve(result).then(()=>{
   if(epoch!==finishEpoch||!root.open)return;
   close();
  },()=>{if(epoch===finishEpoch)close();});
 }
 function step(direction){if(!root.open||!player||player.done||finishing)return;onAudio();const before=player.index;player[direction]();if(root.open){if(before!==player.index)root.scrollTop=0;draw(before!==player.index);}}
 next.onclick=()=>step('next');previous.onclick=()=>step('previous');replay.onclick=()=>{if(!root.open||finishing)return;onAudio();player.replay();root.scrollTop=0;draw(true);next.focus();};skip.onclick=()=>{if(!root.open||finishing)return;onAudio();player.skip();};
 root.addEventListener('keydown',event=>{if(event.key==='ArrowRight'||event.key==='ArrowLeft'){event.preventDefault();event.stopPropagation();if(!event.repeat)step(event.key==='ArrowRight'?'next':'previous');}});
 root.addEventListener('cancel',event=>{event.preventDefault();if(mode==='review')player?.skip();});
 return{element:root,show({characterId='wang',mode:nextMode='new-run',context={},onComplete}={}){if(disposed)return false;close();mode=nextMode;previousFocus=document.activeElement;callback=onComplete;player=createProloguePlayer({characterId,mode,context,onComplete:finish});viewport.sync();root.showModal();root.scrollTop=0;draw(true);next.focus();return true;},close,destroy(){close();disposed=true;viewport.destroy();root.remove();}};
}
