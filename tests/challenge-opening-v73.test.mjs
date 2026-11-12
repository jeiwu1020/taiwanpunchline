import test from 'node:test';
import assert from 'node:assert/strict';
import {JSDOM} from 'jsdom';
import {combatStyles} from './helpers/loaded-combat-styles.mjs';
import {challengeOpening} from '../dist/challenge-flow.mjs';
import {mountChallengeStory} from '../dist/challenge-story.mjs';

function fixture({width=390,height=844,reduced=false}={}){
 const {window}=new JSDOM('<div id="viewport-shell"><main class="app"></main></div>',{pretendToBeVisual:true,url:'https://story.test/'});
 const {document}=window,app=document.querySelector('.app');app.style.width=width+'px';app.style.height=height+'px';
 window.matchMedia=()=>({matches:reduced,addEventListener(){},removeEventListener(){}});
 window.HTMLDialogElement.prototype.showModal=function(){this.open=true;};window.HTMLDialogElement.prototype.close=function(){this.open=false;};
 const pending=new Map();let id=0;const request=fn=>{pending.set(++id,fn);return id;},cancel=id=>pending.delete(id);
 window.requestAnimationFrame=globalThis.requestAnimationFrame=request;window.cancelAnimationFrame=globalThis.cancelAnimationFrame=cancel;
 const frames=[];let completions=0;const story=mountChallengeStory({document,paint:(...args)=>frames.push(args)});
 const show=()=>story.show(challengeOpening('han'),{characterId:'han',onComplete:()=>completions++});
 const tick=time=>{const callbacks=[...pending.values()];pending.clear();callbacks.forEach(fn=>fn(time));};
 return{window,document,story,show,tick,frames,pending,get completions(){return completions;},get root(){return document.querySelector('.challenge-story');}};
}
test('opening advances through news, waking, wardrobe and chase for each playable portrait',()=>{
 for(const character of ['wang','han','ma','su','huang','chen','ko']){
  const beats=challengeOpening(character);assert.equal(beats.length,4);assert.deepEqual(beats.map(x=>x.shot),['bulletin','wake','wardrobe','chase']);
  assert.ok(beats.every(x=>x.copy&&x.title&&x.speaker));assert.ok(beats.every(x=>x.phase<3),'opening must not enter boss face-off rendering');
 }
});
test('each panel and replay restart the animation without completing or writing progress',()=>{
 const f=fixture();f.show();f.tick(100);f.tick(1000);assert.equal(f.frames.at(-1)[3],900);
 f.root.querySelector('[data-story-next]').click();f.tick(1100);assert.equal(f.frames.at(-1)[3],0);assert.equal(f.frames.at(-1)[1].shot,'wake');
 f.root.querySelector('[data-story-replay]').click();f.tick(1500);assert.equal(f.frames.at(-1)[3],0);assert.equal(f.frames.at(-1)[1].shot,'bulletin');assert.equal(f.completions,0);f.story.destroy();
});
test('skip finishes once and stale controls cannot finish a closed story again',()=>{
 const f=fixture();f.show();const skip=f.root.querySelector('[data-story-skip]');assert.ok(skip);skip.click();skip.click();assert.equal(f.completions,1);assert.equal(f.root.open,false);assert.equal(f.pending.size,0);f.story.destroy();
});
test('closing abandons completion, then reopening owns a single frame loop',()=>{
 const f=fixture();f.show();f.story.close();assert.equal(f.completions,0);assert.equal(f.pending.size,0);f.show();f.show();assert.equal(f.pending.size,1);f.tick(2000);assert.equal(f.frames.length,1);f.story.destroy();
});
test('reduced motion is forwarded from the existing OS preference and canvas description tracks shot',()=>{
 const f=fixture({reduced:true});f.show();f.tick(100);assert.equal(f.frames.at(-1)[4].reducedMotion,true);assert.equal(f.frames.at(-1)[0].dataset.reducedMotion,'true');assert.match(f.root.querySelector('canvas').getAttribute('aria-label'),/神麥|快報/);f.story.destroy();
});

test('replay, every next and skip leave existing browser save slots byte-for-byte unchanged',()=>{
 const f=fixture(),storage=f.window.localStorage;storage.setItem('profile-1','saved one');storage.setItem('profile-2','saved two');storage.setItem('profile-3','saved three');
 const before=Object.entries(storage);f.show();f.root.querySelector('[data-story-next]').click();f.root.querySelector('[data-story-replay]').click();
 for(let i=0;i<4;i++)f.root.querySelector('[data-story-next]').click();assert.equal(f.completions,1);f.show();f.root.querySelector('[data-story-skip]').click();assert.deepEqual(Object.entries(storage),before);f.story.destroy();
});

test('short landscape cinematic frame wins the loaded CSS cascade and footer labels stay on one line',()=>{
 const f=combatStyles({width:844,height:390}),app=f.document.querySelector('.app');app.style.width='844px';app.style.height='390px';
 f.document.defaultView.HTMLDialogElement.prototype.showModal=function(){this.open=true;};f.document.defaultView.HTMLDialogElement.prototype.close=function(){this.open=false;};
 const story=mountChallengeStory({document:f.document});story.show(challengeOpening('wang'));
 assert.equal(f.style('.challenge-story .story-panel').height,'var(--story-frame-height)');
 assert.equal(f.style('[data-story-replay]')['white-space'],'nowrap');assert.equal(f.style('[data-story-skip]')['white-space'],'nowrap');story.destroy();f.close();
});
