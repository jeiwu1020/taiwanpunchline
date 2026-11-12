import {RUNTIME_VERSION} from '../build/runtime-version.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import {streetTrialFrame,containSprite,trialCaption} from '../dist/street-trial-view.mjs';
import {GROUND} from '../dist/core.mjs';
test('jump view keeps head visible and covers background without shrinking characters',()=>{
 for(const [width,height,portrait] of [[390,592,true],[844,354,false],[640,324,false]]){
  const stand=streetTrialFrame({width,height,portrait,player:{x:500,y:GROUND,depth:0},worldWidth:2300});
  const jump=streetTrialFrame({width,height,portrait,player:{x:500,y:GROUND-180,depth:-90},worldWidth:2300});
  assert.equal(jump.zoom,stand.zoom);
  assert.ok(jump.base+(-180-90*.65-300)*jump.zoom>=54);
  assert.equal(jump.backgroundTop,0);
  assert.ok(jump.backgroundHeight>=height);
 }
});
test('crowd sprite preserves source ratio while respecting target height',()=>{
 for(const [w,h] of [[1312,1199],[1100,1500],[1500,1000]]){
  const box=containSprite(w,h,105);
  assert.equal(box.height,105);assert.ok(Math.abs(box.width/box.height-w/h)<1e-10);
 }
});
test('trial shout uses original character style and move-specific comic treatment',()=>{
 const v=trialCaption({name:'從從容容',kind:'counter',actor:'wang',helper:false},{width:390,height:550});
 assert.equal(v.style.treatment,'seal');assert.equal(v.style.label,'恰吉王');assert.ok(v.size>=30);
 const helper=trialCaption({name:'高雄發大財',kind:'coin',actor:'han',helper:true},{width:844,height:354});
 assert.equal(helper.style.treatment,'flight');assert.ok(helper.screenX>422);assert.match(helper.tag,/助拳/);
});
test('compact landscape shouts stay below HUD and above controls',()=>{
 for(const name of ['連滾帶爬','高雄發大財','一支穿雲箭','我把你當人看']){
  const p=trialCaption({name,kind:'rush',actor:'wang'},{width:568,height:284});
  assert.ok(p.tagY>=55);assert.ok(p.y-p.height*.55>=70);
  assert.ok(p.y+p.height*.55<=150);assert.ok(p.width<568*.45);
 }
});
test('published entries invalidate changed challenge and trial assets',async()=>{
 const {readFile}=await import('node:fs/promises');
 const original=await readFile(new URL('../dist/index.html',import.meta.url),'utf8');
 const trial=await readFile(new URL('../dist/street-trial.html',import.meta.url),'utf8');
 assert.ok(original.includes(`href="challenge.css?v=${RUNTIME_VERSION}"`));assert.ok(original.includes(`src="game.mjs?v=${RUNTIME_VERSION}"`));
 assert.ok(trial.includes(`href="street-trial.css?v=${RUNTIME_VERSION}"`));assert.ok(trial.includes(`src="street-trial.mjs?v=${RUNTIME_VERSION}"`));
});
