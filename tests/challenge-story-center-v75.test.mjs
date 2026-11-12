import test from 'node:test';
import assert from 'node:assert/strict';
import {challengeDialogFrame,mountChallengeDialogViewport} from '../dist/challenge-dialog-viewport.mjs';
import {mountChallengeStory} from '../dist/challenge-story.mjs';
import {BOSS_DIALOGUES,challengeOpening} from '../dist/challenge-flow.mjs';
import {combatStyles} from './helpers/loaded-combat-styles.mjs';
test('center anchor uses the visible shell midpoint at every rotation and desktop offset',()=>{
 for(const [width,height,rotation,left,top]of [[390,844,0,0,0],[844,390,0,0,0],[844,390,90,0,0],[844,390,-90,0,0],[1416,708,0,54,0],[1100,760,0,100,40]]){
  const screenWidth=rotation?height:width,screenHeight=rotation?width:height;
  const f=challengeDialogFrame({width,height,rotation,left,top,screenWidth,screenHeight,anchor:'center'});
  assert.equal(f.left,left+screenWidth/2);assert.equal(f.top,top+screenHeight/2);assert.ok(f.maxHeight<=height-16);
 }
});
test('centered native modal transforms around its own center, independent of content height',()=>{
 for(const rotation of [0,90,-90]){
  const app={dataset:{rotation:String(rotation)},style:{width:'844px',height:'390px'}},shell={getBoundingClientRect:()=>({left:12,top:20,width:rotation?390:844,height:rotation?844:390})};
  const doc={defaultView:{addEventListener(){},removeEventListener(){}},querySelector:s=>s==='.app'?app:shell};
  const dialog={dataset:{},style:{setProperty(){}},ownerDocument:doc};let anchor='center';
  const binding=mountChallengeDialogViewport(dialog,{anchor:()=>anchor});
  for(const contentHeight of [240,338,374]){dialog.clientHeight=contentHeight;binding.sync();assert.equal(dialog.style.transformOrigin,'50% 50%');assert.equal(dialog.style.transform,`translate(-50%,-50%) rotate(${rotation}deg)`);assert.equal(dialog.style.top,(20+(rotation?844:390)/2)+'px');}
  anchor='top';binding.sync();assert.equal(dialog.style.transformOrigin,'50% 0');assert.equal(dialog.style.transform,`translate(-50%,0) rotate(${rotation}deg)`);binding.destroy();
 }
});
test('only non-cinematic face-offs center; opening, next and reopening preserve correct anchors',()=>{
 const f=combatStyles({width:844,height:390}),doc=f.document,win=doc.defaultView,app=doc.querySelector('.app');app.style.width='844px';app.style.height='390px';
 win.requestAnimationFrame=()=>1;win.cancelAnimationFrame=()=>{};win.HTMLDialogElement.prototype.showModal=function(){this.open=true;};win.HTMLDialogElement.prototype.close=function(){this.open=false;};
 const story=mountChallengeStory({document:doc}),root=doc.querySelector('.challenge-story');
 story.show(BOSS_DIALOGUES[0]);assert.equal(root.style.top,'195px');assert.equal(root.style.transform,'translate(-50%,-50%) rotate(0deg)');
 root.querySelector('[data-story-next]').click();assert.equal(root.style.top,'195px');
 story.show(challengeOpening('han'));assert.equal(root.style.top,'8px');assert.equal(root.style.transform,'translate(-50%,0) rotate(0deg)');
 story.show(BOSS_DIALOGUES[1]);assert.equal(root.style.top,'195px');story.destroy();f.close();
});
test('boss cards bound artwork while retaining action buttons across logical layouts',()=>{
 for(const [width,height,portrait]of [[390,844,true],[390,568,true],[844,390,false],[568,320,false],[1416,708,false]]){
  const f=combatStyles({width,height,portrait}),doc=f.document,app=doc.querySelector('.app');app.style.width=width+'px';app.style.height=height+'px';
  doc.defaultView.requestAnimationFrame=()=>1;doc.defaultView.cancelAnimationFrame=()=>{};doc.defaultView.HTMLDialogElement.prototype.showModal=function(){this.open=true;};doc.defaultView.HTMLDialogElement.prototype.close=function(){this.open=false;};
  const story=mountChallengeStory({document:doc});story.show(BOSS_DIALOGUES[1]);
  assert.equal(f.style('.challenge-story .story-copy').display,'flex');assert.equal(f.style('.challenge-story .story-copy')['min-height'],'0');
  assert.equal(f.style('.challenge-story .story-actions').flex,'0 0 auto');assert.equal(f.style('.challenge-story canvas')['object-fit'],'contain');
  assert.match(f.style('.challenge-story .story-panel').height,/--challenge-logical-height/);
  story.destroy();f.close();
 }
});
test('centered bounded cards stay inside shell for short phones and both sideways directions',()=>{
 for(const[width,height]of [[390,568],[390,844],[568,320],[844,390],[1416,708]])for(const rotation of [0,90,-90]){
  const sw=rotation?height:width,sh=rotation?width:height,f=challengeDialogFrame({width,height,rotation,screenWidth:sw,screenHeight:sh,maxWidth:1280,anchor:'center'});
  const cardHeight=Math.min(height-16,width>height?(height<=480?338:428):668);
  const halfWidth=(rotation?cardHeight:f.width)/2,halfHeight=(rotation?f.width:cardHeight)/2;
  assert.ok(f.left-halfWidth>=8-.001);assert.ok(f.left+halfWidth<=sw-8+.001);assert.ok(f.top-halfHeight>=8-.001);assert.ok(f.top+halfHeight<=sh-8+.001);
 }
});
