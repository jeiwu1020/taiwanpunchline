import test from 'node:test';
import assert from 'node:assert/strict';
import {JSDOM} from 'jsdom';
import {mountChapterComicReader} from '../dist/preview/campaign/chapter-comic-reader.mjs';
import {createCampaignPlayable} from '../dist/preview/campaign/playable-bridge.mjs';
import {openChallengeContinuation} from '../dist/preview/campaign/fresh-router.mjs';
import {openChallengeProgress} from '../dist/preview/campaign/fresh/progress.mjs';
import {CHALLENGE_KEY} from '../dist/preview/campaign/fresh/schema.mjs';
import {createFinaleSession} from '../dist/preview/finale/finale-session.mjs';
import {createFinalePreview} from '../dist/preview/finale/finale-preview.mjs';
import {campaignStorage} from './helpers/campaign-complete-fixture.mjs';
import {mountChallengeStory} from '../dist/challenge-story.mjs';

const factories=new Map();
for(const n of [2,3,4,5])factories.set(n,(await import(`../dist/preview/chapter${n}/chapter${n===3?2:n}-controller.mjs`)).createPlayableChapter);
function mount(t,chapter,options={}){
 const dom=new JSDOM('<section id="story-panel"><div class="story-actions"><button id="story-next" data-story-next>下一句</button></div></section>');
 const document=dom.window.document;let audio=0,changes=0;
 const reader=mountChapterComicReader({document,getChapter:()=>chapter,onAudio:()=>audio++,onChange:()=>changes++,...options});
 t.after(()=>{reader.destroy();dom.window.close();});
 return {reader,document,get audio(){return audio;},get changes(){return changes;}};
}
async function savedChapter(n){
 const fixture=campaignStorage(n-1),write=fixture.storage.setItem;let writes=0;
 fixture.storage.setItem=(...args)=>{writes++;return write(...args);};
 const router=await openChallengeContinuation({...fixture,mode:'campaign',optIn:true});
 assert.equal(router.enabled,true);assert.equal(router.version,4);
 const result=await createCampaignPlayable({router,chapterId:`chapter-${n}`,createPlayableChapter:factories.get(n)});
 assert.equal(result.accepted,true);return {...fixture,chapter:result.chapter,router,get writes(){return writes;}};
}

for(const n of [2,3,4,5]){
 test(`chapter ${n} controller rewinds only the current story with a fresh token and no events`,()=>{
  const c=factories.get(n)(),first=c.view();assert.equal(c.nextStory(first.token),true);
  const later=c.view();assert.ok(later.frameIndex>0);assert.equal(c.rewindStory(first.token),false);
  assert.equal(c.rewindStory(later.token),true);assert.equal(c.view().frameIndex,0);assert.equal(c.view().stepId,first.stepId);
  assert.notEqual(c.view().token,later.token);assert.deepEqual(c.drainEvents(),[]);
  while(c.view().mode==='story')c.nextStory(c.view().token);
  const world=c.world;assert.equal(c.rewindStory(c.view().token),false);assert.equal(c.world,world);
 });
 test(`chapter ${n} real v4 bridge rewinds without a write and skips only to the next route`,async t=>{
  const f=await savedChapter(n),c=f.chapter,ui=mount(t,c);
  c.nextStory(c.view().token);const before=f.storage.getItem(CHALLENGE_KEY),writes=f.writes,token=c.view().token;
  assert.equal(await ui.reader.rewind(),true);assert.equal(c.view().frameIndex,0);
  assert.equal(f.writes,writes);assert.equal(f.storage.getItem(CHALLENGE_KEY),before);assert.equal(c.rewindStory(token),false);
  assert.deepEqual(c.drainEvents(),[]);await ui.reader.skip();await c.flush();ui.reader.sync();
  assert.equal(c.view().mode,'route');assert.equal(c.view().stepId,'route-a');assert.equal(c.world.elapsed,0);
  assert.equal(f.writes,writes+1);assert.equal(f.router.view().stepId,'route-a');
  assert.equal(ui.document.querySelector('#story-replay').hidden,true);assert.equal(ui.document.querySelector('#story-skip').hidden,true);
  assert.equal(await ui.reader.skip(),false);assert.equal(f.writes,writes+1);assert.equal(ui.audio,2);
 });
}

test('miniboss skip enters its battle once despite an unchanged stepId',async t=>{
 const chapter=factories.get(5)({initialStepId:'miniboss-a'}),ui=mount(t,chapter);const before=chapter.view();
 assert.equal(await ui.reader.skip(),true);assert.equal(chapter.view().stepId,before.stepId);assert.equal(chapter.view().mode,'battle');
 const world=chapter.world,hp=world.player.hp;assert.equal(await ui.reader.skip(),false);assert.equal(chapter.world,world);assert.equal(world.player.hp,hp);
});

test('failed real v4 story save freezes both reading actions until durable retry',async t=>{
 const f=await savedChapter(2),c=f.chapter,ui=mount(t,c),before=f.storage.getItem(CHALLENGE_KEY),write=f.storage.setItem;
 let release;const gate=new Promise(resolve=>{release=resolve;}),dispatch=f.router.dispatch;
 f.router.dispatch=async(...args)=>{await gate;return dispatch(...args);};
 f.storage.setItem=()=>{throw Error('quota');};
 assert.equal(await ui.reader.skip(),false);assert.equal(c.view().busy,true);assert.equal(c.view().mode,'story');
 const token=c.view().token;assert.equal(c.rewindStory(token),false);assert.equal(await ui.reader.rewind(),false);
 release();await c.flush();ui.reader.sync();assert.ok(c.view().saveIssue);assert.equal(c.view().frameIndex,c.view().frameCount-1);
 assert.equal(ui.document.querySelector('#story-replay').disabled,true);assert.equal(ui.document.querySelector('#story-skip').disabled,true);
 assert.equal(await ui.reader.skip(),false);assert.equal(c.rewindStory(c.view().token),false);assert.equal(c.view().token,token);
 assert.equal(f.storage.getItem(CHALLENGE_KEY),before);
 f.storage.setItem=write;assert.equal((await c.retrySave()).persisted,true);assert.equal(c.view().mode,'route');
 assert.equal(await ui.reader.skip(),false);assert.equal(c.world.elapsed,0);
});

test('finale opening can rewind and skip to a frozen battle but never play it',async t=>{
 const {chapter}=await createFinalePreview();await chapter.start(['chen','ko','ma'],{opening:true});
 const first=chapter.view().token;await chapter.nextStory();const ui=mount(t,chapter),world=chapter.world;
 assert.equal(chapter.rewindStory(first).accepted,false);assert.equal(await ui.reader.rewind(),true);
 assert.equal(chapter.view().frameIndex,0);assert.equal(chapter.view().mode,'intro');assert.equal(chapter.world,world);
 assert.equal(await ui.reader.skip(),true);assert.equal(chapter.view().mode,'battle');assert.equal(world.remaining,150);
 assert.equal(chapter.rewindStory(chapter.view().token).accepted,false);assert.equal(await ui.reader.skip(),false);
});

test('real saved ending rewind and completed-ending review do not write or replay rewards',async t=>{
 const f=campaignStorage(),write=f.storage.setItem;let writes=0;
 f.storage.setItem=(...args)=>{writes++;return write(...args);};
 const progress=await openChallengeProgress(f),{chapter}=await createFinaleSession({progress});
 await chapter.start(['wang','han','chen']);for(const actor of chapter.world.actors)if(actor.team===1)actor.hp=0;
 chapter.step(1/60);await chapter.flush();await chapter.continueResult();await chapter.nextStory();
 const ui=mount(t,chapter),before=f.storage.getItem(CHALLENGE_KEY),count=writes,xp=progress.readProfile().campaign.xp;
 assert.equal(await ui.reader.rewind(),true);assert.equal(chapter.view().frameIndex,0);assert.equal(writes,count);assert.equal(f.storage.getItem(CHALLENGE_KEY),before);
 assert.equal(await ui.reader.skip(),true);assert.equal(chapter.view().mode,'complete');assert.equal(writes,count+1);
 assert.equal(chapter.reviewEnding(),true);await chapter.nextStory();const reviewSave=f.storage.getItem(CHALLENGE_KEY),reviewWrites=writes;
 assert.equal(await ui.reader.rewind(),true);assert.equal(chapter.view().review,true);assert.equal(chapter.view().frameIndex,0);
 assert.equal(await ui.reader.skip(),true);assert.equal(chapter.view().mode,'complete');assert.equal(writes,reviewWrites);
 assert.equal(f.storage.getItem(CHALLENGE_KEY),reviewSave);assert.equal(progress.readProfile().campaign.xp,xp);
});

test('failed finale ending save blocks rewind and skip without changing the review state',async t=>{
 const f=campaignStorage(),progress=await openChallengeProgress(f),{chapter}=await createFinaleSession({progress});
 await chapter.start(['wang','han','chen']);for(const a of chapter.world.actors)if(a.team===1)a.hp=0;
 chapter.step(1/60);await chapter.flush();await chapter.continueResult();const ui=mount(t,chapter),before=f.storage.getItem(CHALLENGE_KEY);
 const write=f.storage.setItem;f.storage.setItem=()=>{throw Error('quota');};
 assert.equal(await ui.reader.skip(),false);assert.equal(chapter.view().mode,'story');assert.ok(chapter.view().saveIssue);
 const token=chapter.view().token;assert.equal(chapter.rewindStory(token).accepted,false);assert.equal(await ui.reader.rewind(),false);
 assert.equal(chapter.view().review,false);assert.equal(f.storage.getItem(CHALLENGE_KEY),before);
 f.storage.setItem=write;assert.equal((await chapter.retrySave()).persisted,true);assert.equal(chapter.view().mode,'complete');
});

test('reader stops at a different story step, explicit rejection, or any blocked state',async t=>{
 for(const stop of ['step','rejected','busy','saveIssue','blocked']){
  let state={mode:'story',stepId:'entry',frameIndex:0,frameCount:4,token:'0'},calls=0;
  const chapter={view:()=>({...state}),rewindStory:()=>true,nextStory(){calls++;state.frameIndex++;state.token=String(calls);
   if(stop==='step')state.stepId='next-story';else if(stop==='rejected')return {accepted:false};else state[stop]=true;
   return {accepted:true};
  }};
  const ui=mount(t,chapter);await ui.reader.skip();assert.equal(calls,1,stop);
 }
});

test('skip is bounded by the original frame count and rejects an inert accepted step',async t=>{
 for(const inert of [false,true]){
  let calls=0,state={mode:'story',stepId:'entry',frameIndex:0,frameCount:2,token:'0'};
  const c={view:()=>({...state}),nextStory(){calls++;if(!inert){state.frameIndex++;state.frameCount=99;}return true;}};
  const ui=mount(t,c);assert.equal(await ui.reader.skip(),false);assert.equal(calls,inert?1:2);
 }
});

test('an async skip owns its controls and stops when the chapter owner changes',async t=>{
 let release,calls=0;const pending=new Promise(resolve=>{release=resolve;});
 const state={mode:'story',stepId:'entry',frameIndex:0,frameCount:3,token:'0'};
 const chapter={view:()=>({...state}),rewindStory:()=>true,nextStory(){calls++;return pending;}};
 let current=chapter;const ui=mount(t,chapter,{getChapter:()=>current}),next=ui.document.querySelector('#story-next');
 const skipping=ui.reader.skip();assert.equal(ui.reader.busy,true);assert.equal(next.disabled,true);
 assert.equal(await ui.reader.skip(),false);assert.equal(await ui.reader.rewind(),false);
 current={view:()=>({...state}),nextStory(){throw Error('must not touch replacement');}};release({accepted:true});
 assert.equal(await skipping,false);assert.equal(calls,1);assert.equal(ui.reader.busy,false);assert.equal(next.disabled,false);
});

test('host preparation blocks every reader action without changing the chapter',async t=>{
 const chapter=factories.get(2)();let blocked=true;
 const ui=mount(t,chapter,{isBlocked:()=>blocked}),token=chapter.view().token;
 for(const id of ['story-next','story-replay','story-skip'])assert.equal(ui.document.getElementById(id).disabled,true,id);
 assert.equal(await ui.reader.skip(),false);assert.equal(await ui.reader.rewind(),false);assert.equal(chapter.view().token,token);
 blocked=false;ui.reader.sync();for(const id of ['story-next','story-replay','story-skip'])assert.equal(ui.document.getElementById(id).disabled,false,id);
 assert.equal(await ui.reader.skip(),true);assert.equal(chapter.view().mode,'route');
});

function rootStory(t,{width=390,height=844}={}){
 const dom=new JSDOM('<main class="app"></main>',{pretendToBeVisual:true}),w=dom.window,d=w.document;
 d.querySelector('.app').style.cssText=`width:${width}px;height:${height}px`;
 w.HTMLDialogElement.prototype.showModal=function(){this.open=true;};w.HTMLDialogElement.prototype.close=function(){this.open=false;};
 w.matchMedia=()=>({matches:true});w.requestAnimationFrame=()=>1;w.cancelAnimationFrame=()=>{};
 const modal=mountChallengeStory({document:d,paint:()=>{}}),root=d.querySelector('dialog');
 t.after(()=>{modal.destroy();dom.window.close();});return {modal,root};
}
const plainFrames=[{speaker:'旁白',title:'不再露出的逐句標題',copy:'一行旁白。'},{speaker:'韓國魚',title:'另一個標題',copy:'先讓我講完。'}];

test('ordinary root chapter passages expose replay and skip with hidden titles and narrator identity',t=>{
 const {modal,root}=rootStory(t);let finishes=0;modal.show(plainFrames,{onComplete:()=>finishes++});
 assert.equal(root.dataset.comicVoice,'narration');assert.equal(root.querySelector('h2').hidden,true);
 for(const selector of ['[data-story-replay]','[data-story-skip]'])assert.equal(root.querySelector(selector).hidden,false);
 root.querySelector('[data-story-next]').click();assert.equal(root.querySelector('small').textContent,'韓國魚');assert.equal(root.dataset.comicVoice,'dialogue');
 root.querySelector('[data-story-replay]').click();assert.equal(root.querySelector('p').textContent,'一行旁白。');assert.equal(finishes,0);
 root.querySelector('[data-story-skip]').click();assert.equal(finishes,1);assert.equal(root.open,false);
});

test('root comic controls cannot duplicate an in-flight finish or bypass display recovery',async t=>{
 const {modal,root}=rootStory(t);let finish=0,retry=0,release;const pending=new Promise(resolve=>{release=resolve;});
 modal.show(plainFrames,{onComplete:()=>{finish++;return pending;}});
 const replay=root.querySelector('[data-story-replay]'),skip=root.querySelector('[data-story-skip]');
 skip.click();skip.onclick();replay.onclick();assert.equal(finish,1);assert.equal(root.querySelector('p').textContent,'一行旁白。');
 for(const button of root.querySelectorAll('.story-actions button'))assert.equal(button.disabled,true);
 release({accepted:false,reason:'scene-unavailable',message:'請重試顯示',isCurrent:()=>true,retryPresentation:()=>{retry++;return true;}});await pending;await Promise.resolve();
 assert.equal(root.open,true);assert.equal(skip.hidden,true);assert.equal(replay.hidden,true);
 skip.onclick();replay.onclick();assert.equal(root.querySelector('p').textContent,'請重試顯示');assert.equal(finish,1);assert.equal(retry,0);
 root.querySelector('[data-story-next]').click();assert.equal(retry,1);assert.equal(root.open,false);
});

test('root portrait cinematic geometry reserves two touch rows and a readable text region',t=>{
 for(const [width,height] of [[320,480],[390,844],[430,932]]){
  const {modal,root}=rootStory(t,{width,height});modal.show(plainFrames.map(f=>({...f,shot:'wake'})));
  // show() changes the cinematic flag after the initial viewport construction.
  root.ownerDocument.defaultView.dispatchEvent(new root.ownerDocument.defaultView.Event('resize'));
  const frame=parseFloat(root.style.getPropertyValue('--story-frame-height')),copy=parseFloat(root.style.getPropertyValue('--story-copy-height'));
  assert.ok(copy>=280&&copy<=320);assert.ok(frame>copy);assert.ok(root.querySelector('canvas').height>0);
 }
});

test('a rotated root comic scrolls its overflowing bubble and suppresses a drag click',t=>{
 const {modal,root}=rootStory(t,{width:568,height:320});let finishes=0;
 modal.show(plainFrames,{onComplete:()=>finishes++});const d=root.ownerDocument,w=d.defaultView,p=root.querySelector('p');
 d.querySelector('.app').dataset.rotation='90';w.dispatchEvent(new w.Event('resize'));
 Object.defineProperties(p,{scrollHeight:{value:350},clientHeight:{value:70}});
 const pointer=(type,x)=>{const event=new w.Event(type,{bubbles:true,cancelable:true});Object.assign(event,{pointerId:7,pointerType:'touch',isPrimary:true,button:0,clientX:x,clientY:0});p.dispatchEvent(event);return event;};
 pointer('pointerdown',0);assert.equal(pointer('pointermove',100).defaultPrevented,true);pointer('pointerup',100);
 assert.equal(p.scrollTop,100);assert.equal(root.scrollTop,0);
 root.querySelector('[data-story-skip]').dispatchEvent(new w.MouseEvent('click',{bubbles:true,cancelable:true,detail:1}));assert.equal(finishes,0);
 root.querySelector('[data-story-skip]').click();assert.equal(finishes,1);
});
