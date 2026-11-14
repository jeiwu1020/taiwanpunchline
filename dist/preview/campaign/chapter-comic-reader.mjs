import {createComicReadingPosition} from '../../story-comic-reading.mjs?v=full-comic-r1';
import {drawBubble} from '../../starter-comic-layout.mjs?v=full-comic-r1';
import {supportedComicSize} from '../../story-comic-layout.mjs';
// The existing game canvas keeps its viewport/first-paint contract. This reader
// owns only bubbles and reading controls; controllers remain checkpoint owners.
export function mountChapterComicReader({document,getChapter,onChange=()=>{},onAudio=()=>{},isBlocked=()=>false,paintFrame,onRetryArt}={}){
 const actions=document.querySelector('#story-panel .story-actions');if(!actions)return null;
 const panel=document.querySelector('#story-panel');panel.dataset.comicReader='true';panel.dataset.fullComic=String(typeof paintFrame==='function');panel.setAttribute('aria-labelledby','story-speaker');
 const title=panel.querySelector('#story-title');if(title)title.hidden=true;
 const next=actions.querySelector('[data-story-next],#story-next');
 const button=(id,text)=>{const node=document.createElement('button');node.id=id;node.type='button';node.className='chapter-secondary';node.textContent=text;actions.append(node);return node;};
 const previous=button('story-previous','←'),replay=button('story-replay','重看'),skipButton=button('story-skip','略過');
 const retryArt=paintFrame?button('story-art-retry','重試圖片'):null;
 previous.setAttribute('aria-label','上一句');actions.insertBefore(previous,next);
 replay.dataset.storyReplay='';skipButton.dataset.storySkip='';
 const artStatus=paintFrame?document.createElement('p'):null;
 if(artStatus){artStatus.dataset.storyArtStatus='';artStatus.className='story-recovery';artStatus.setAttribute('role','status');artStatus.hidden=true;actions.before(artStatus);}
 const reading=createComicReadingPosition(),count=panel.querySelector('#story-count'),transcript=panel.querySelector('#story-copy');
 const setText=(node,value)=>{if(node&&node.textContent!==value)node.textContent=value;};
 const navigateNext=()=>navigate(1);
 let busy=false,retrying=false,disposed=false,tail=Promise.resolve(),paintKey='',paintOwner=null,sceneStart=null,paintReady=!paintFrame,paintFailed=false;
 const readable=s=>!!s&&['story','intro'].includes(s.mode)&&Number.isInteger(s.frameCount)&&s.frameCount>0;
 const blocked=s=>!s||!!s.busy||!!s.blocked||!!s.saveIssue||isBlocked();
 const accepted=result=>result===true||result?.accepted===true;
 function syncPaintOwner(s,chapter){
  const key=`${s?.mode}:${s?.stepId}:${s?.frameIndex}:${s?.characterId}`;
  if(chapter!==paintOwner||key!==paintKey){paintOwner=chapter;paintKey=key;sceneStart=null;paintReady=!paintFrame;paintFailed=false;}
 }
 function sync(){
  if(disposed)return;
  const chapter=getChapter(),s=chapter?.view(),visible=readable(s),disabled=!visible||busy||blocked(s);
  if(paintFrame)document.body.dataset.storyComic=String(visible);
  syncPaintOwner(s,chapter);
  const l=reading.sync(s,chapter);
  panel.dataset.comicVoice=s?.storyFrame?.speaker==='旁白'?'narration':'dialogue';
  previous.hidden=replay.hidden=skipButton.hidden=!visible;
  previous.disabled=disabled||(l.previousAnchor===null&&(s.frameIndex<=0||typeof chapter?.previousStory!=='function'));
  replay.disabled=disabled||typeof chapter?.rewindStory!=='function';skipButton.disabled=disabled||typeof chapter?.nextStory!=='function';
  if(next){next.disabled=disabled||!paintReady;next.onclick=navigateNext;if(visible)setText(next,l.nextAnchor!==null?'下一句 →':s.frameIndex+1<s.frameCount?'下一格 →':s.mode==='intro'?'開打 →':'繼續 →');}
  if(artStatus){
   artStatus.hidden=!visible||paintReady;panel.dataset.comicArt=paintReady?'ready':paintFailed?'failed':'pending';
   if(!artStatus.hidden)setText(artStatus,paintFailed?'漫畫畫面尚未顯示完成。可以稍候，或略過這段。':'漫畫畫面準備中…');
  }
  if(retryArt){retryArt.hidden=!visible||paintReady||!paintFailed;retryArt.disabled=disabled||retrying||typeof onRetryArt!=='function';}
  if(visible)setText(count,`${s.frameIndex+1} / ${s.frameCount} · ${l.currentIndex+1} / ${l.fragments.length} 句`);
  if(transcript&&visible){if(transcript.getAttribute('aria-live')!=='polite')transcript.setAttribute('aria-live','polite');setText(transcript,l.bubbles.map(b=>b.text).join(''));}
 }
 function changed(){if(!disposed){onChange();sync();}}
 async function navigate(direction){
  if(disposed||busy)return false;const chapter=getChapter(),s=chapter?.view();
  syncPaintOwner(s,chapter);
  if(!readable(s)||blocked(s)||(direction>0&&!paintReady))return false;reading.sync(s,chapter);onAudio();
  if(reading.advance(direction)){changed();return true;}
  const action=direction<0?'previousStory':'nextStory';if(typeof chapter?.[action]!=='function')return false;
  if(direction<0)reading.landOnPrevious(s,chapter);
  busy=true;sync();
  const task=(async()=>{try{
   const result=await chapter[action](s.token);if(accepted(result))await chapter.flush?.();
   if(disposed||getChapter()!==chapter||!accepted(result)){reading.cancelLanding();return false;}
   changed();return !blocked(chapter.view());
  }catch{reading.cancelLanding();return false;}finally{busy=false;changed();}})();tail=task;return task;
 }
 async function read(action){
  if(disposed||busy)return false;
  const chapter=getChapter(),start=chapter?.view();
  if(!readable(start)||blocked(start)||typeof chapter?.[action]!=='function')return false;
  const limit=start.frameCount,mode=start.mode,stepId=start.stepId;
  const sameSegment=s=>!disposed&&getChapter()===chapter&&s?.mode===mode&&s.stepId===stepId;
  busy=true;sync();
  try{
   onAudio();
   if(action==='rewindStory'){
    const result=await chapter.rewindStory(start.token),current=!disposed&&getChapter()===chapter&&accepted(result);
    if(current){reading.reset();paintKey='';sceneStart=null;paintReady=!paintFrame;}changed();return current;
   }
   // Capture the original bound. A changed chapter/segment or a failed save is
   // a stop, never an invitation to continue into the next story or simulation.
   for(let i=0;i<limit;i++){
    const before=chapter.view();if(!sameSegment(before)||blocked(before))return false;
    const result=await chapter.nextStory(before.token);
    if(!accepted(result)){changed();return false;}
    await chapter.flush?.();
    changed();const after=chapter.view();
    if(disposed||getChapter()!==chapter||blocked(after))return false;
    if(!sameSegment(after))return true;
    if(after.frameIndex<=before.frameIndex)return false;
   }
   return false;
  }catch{return false;}
  finally{busy=false;sync();if(!disposed)onChange();}
 }
 const run=action=>{if(disposed||busy)return Promise.resolve(false);const task=read(action);tail=task;return task;};
 previous.onclick=()=>navigate(-1);replay.onclick=()=>run('rewindStory');skipButton.onclick=()=>run('nextStory');sync();
 if(retryArt)retryArt.onclick=()=>{
  if(disposed||busy||retrying||blocked(getChapter()?.view())||typeof onRetryArt!=='function')return;
  retrying=true;sync();tail=(async()=>{try{await onRetryArt();}catch{/* The next paint keeps a visible recovery. */}finally{retrying=false;sync();}})();
 };
 const overlayOpen=()=>[...document.querySelectorAll('dialog[open],[role="dialog"]')].some(node=>{
  if(node.tagName==='DIALOG')return node.open;
  if(node.closest('[hidden],[aria-hidden="true"]'))return false;
  for(let current=node;current;current=current.parentElement){const css=document.defaultView?.getComputedStyle?.(current);if(css?.display==='none'||css?.visibility==='hidden')return false;}
  return true;
 });
 const keyboard=event=>{
  if(disposed||!paintFrame||event.defaultPrevented||event.altKey||event.ctrlKey||event.metaKey||!['ArrowLeft','ArrowRight'].includes(event.key))return;
  if(event.target?.closest?.('dialog,[role="dialog"],select,input,textarea,[contenteditable],.game-select-menu'))return;
  const s=getChapter()?.view();if(!readable(s)||busy||blocked(s)||overlayOpen())return;
  event.preventDefault();if(!event.repeat)void navigate(event.key==='ArrowLeft'?-1:1);
 };
 document.addEventListener('keydown',keyboard);
 return {sync,next:()=>navigate(1),previous:()=>navigate(-1),rewind:()=>run('rewindStory'),skip:()=>run('nextStory'),whenIdle:()=>tail,
  resize(w,h){reading.resize(w,h);sync();return reading.view();},get layout(){return reading.view();},
  paint(ctx,images,width,height,time=0,options={}){
   const chapter=getChapter(),s=chapter?.view();if(disposed||!readable(s)||!paintFrame)return false;
   syncPaintOwner(s,chapter);
   try{
    if(!supportedComicSize(width,height))throw new RangeError('Unsupported comic size');
    reading.sync(s,chapter);const layout=reading.resize(width,height);
    if(sceneStart===null)sceneStart=time;
    // Reflow changes sentence splits. Refresh accessible copy and the footer
    // without notifying the host or invalidating the game canvas geometry.
    sync();paintReady=false;
    const result=paintFrame(ctx,images,s,layout,{...options,time:Math.max(0,time-sceneStart)});
    if(result===false){paintFailed=true;return false;}
    for(const b of layout.bubbles)drawBubble(ctx,b,layout.font);
    ctx.strokeStyle='#173239';ctx.lineWidth=3;ctx.strokeRect(8,8,width-16,height-16);
    paintReady=true;paintFailed=false;return result??true;
   }catch(error){paintReady=false;paintFailed=true;throw error;}finally{sync();}
  },get busy(){return busy;},destroy(){
  if(disposed)return;disposed=true;busy=false;if(next)next.onclick=null;
  document.removeEventListener('keydown',keyboard);previous.remove();replay.remove();skipButton.remove();retryArt?.remove();artStatus?.remove();delete panel.dataset.comicArt;delete panel.dataset.fullComic;if(paintFrame)delete document.body.dataset.storyComic;
 }};
}
