// Reading controls only. Checkpoints still advance through the chapter's own API.
export function mountChapterComicReader({document,getChapter,onChange=()=>{},onAudio=()=>{},isBlocked=()=>false}={}){
 const actions=document.querySelector('#story-panel .story-actions');if(!actions)return null;
 const panel=document.querySelector('#story-panel');panel.dataset.comicReader='true';panel.setAttribute('aria-labelledby','story-speaker');
 const title=panel.querySelector('#story-title');if(title)title.hidden=true;
 const next=actions.querySelector('[data-story-next],#story-next');
 const button=(id,text)=>{const node=document.createElement('button');node.id=id;node.type='button';node.className='chapter-secondary';node.textContent=text;actions.append(node);return node;};
 const replay=button('story-replay','重看此段'),skipButton=button('story-skip','略過此段');
 replay.dataset.storyReplay='';skipButton.dataset.storySkip='';
 let busy=false,disposed=false,nextLocked=false,nextWasDisabled=false;
 const readable=s=>!!s&&['story','intro'].includes(s.mode)&&Number.isInteger(s.frameCount)&&s.frameCount>0;
 const blocked=s=>!s||!!s.busy||!!s.blocked||!!s.saveIssue||isBlocked();
 const accepted=result=>result===true||result?.accepted===true;
 function sync(){
  if(disposed)return;
  const chapter=getChapter(),s=chapter?.view(),visible=readable(s),disabled=!visible||busy||blocked(s);
  panel.dataset.comicVoice=s?.storyFrame?.speaker==='旁白'?'narration':'dialogue';
  replay.hidden=skipButton.hidden=!visible;
  replay.disabled=disabled||typeof chapter?.rewindStory!=='function';skipButton.disabled=disabled||typeof chapter?.nextStory!=='function';
  // Do not replace the host's ordinary next-line handler or its idle policy.
  if(next&&busy){if(!nextLocked){nextWasDisabled=next.disabled;nextLocked=true;}next.disabled=true;}
  else if(next&&nextLocked){next.disabled=nextWasDisabled||blocked(s);nextLocked=false;}
  else if(next&&visible)next.disabled=disabled;
 }
 function changed(){if(!disposed){onChange();sync();}}
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
    const result=await chapter.rewindStory(start.token);changed();return !disposed&&getChapter()===chapter&&accepted(result);
   }
   // Capture the original bound. A changed chapter/segment or a failed save is
   // a stop, never an invitation to continue into the next story or simulation.
   for(let i=0;i<limit;i++){
    const before=chapter.view();if(!sameSegment(before)||blocked(before))return false;
    const result=await chapter.nextStory(before.token);
    if(!accepted(result)){changed();return false;}
    changed();const after=chapter.view();
    if(disposed||getChapter()!==chapter||blocked(after))return false;
    if(!sameSegment(after))return true;
    if(after.frameIndex<=before.frameIndex)return false;
   }
   return false;
  }catch{return false;}
  finally{busy=false;sync();if(!disposed)onChange();}
 }
 replay.onclick=()=>read('rewindStory');skipButton.onclick=()=>read('nextStory');sync();
 return {sync,rewind:()=>read('rewindStory'),skip:()=>read('nextStory'),get busy(){return busy;},destroy(){
  if(disposed)return;disposed=true;busy=false;if(next&&nextLocked)next.disabled=nextWasDisabled;
  replay.remove();skipButton.remove();
 }};
}
