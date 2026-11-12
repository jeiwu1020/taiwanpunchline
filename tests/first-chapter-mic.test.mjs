import test from 'node:test';
import assert from 'node:assert/strict';
import * as main from '../dist/challenge-depth-render.mjs';
import {GROUND} from '../dist/core.mjs';
import {readFileSync} from 'node:fs';
test('main route reserves a fixed screen-space microphone independently of jumping camera',()=>{
 assert.equal(typeof main.mainRouteMicPlan,'function');
 for(const [width,height] of [[360,640],[390,844],[768,1024],[844,390],[932,430],[1280,720],[1920,1080]]){
  const plan=main.mainRouteMicPlan({width,height});
  assert.equal(plan.visible,true);assert.equal(plan.size,44);
  assert.ok(plan.travelBounds.left>=width-72);assert.ok(plan.travelBounds.top>=6);
  for(const y of [-1000,100,250,430])for(const depth of [-90,0,100]){
   const frame=main.depthRouteCameraFrame(width,height,{worldWidth:3600,player:{x:3000,y,depth}},{fullStage:true});
   const top=(y+depth*.65-300-frame.y)*frame.zoom+height/2;
   assert.ok(plan.travelBounds.bottom<top);
   assert.deepEqual(main.mainRouteMicPlan(frame),plan);
  }
 }
});
test('tiny geometry is reported instead of shrinking or tracking the actor',()=>{
 assert.equal(typeof main.mainRouteMicPlan,'function');
 const plan=main.mainRouteMicPlan({width:70,height:60});
 assert.equal(plan.visible,false);assert.equal(plan.size,44);assert.equal(plan.reason,'NO_SAFE_SKY_SPACE');
});
test('main route microphone is an overlay without a reserved HUD or toolbar column',()=>{
 const css=readFileSync(new URL('../dist/combat-presentation-v75.css',import.meta.url),'utf8');
 assert.doesNotMatch(css,/right:72px/);
 assert.match(css,/route-mic-overlay[^}]+position:absolute;z-index:4;pointer-events:none/);
});

test('loaded styles keep the full-width HUD and toolbar in routes and duels',async()=>{
 const {combatStyles}=await import('./helpers/loaded-combat-styles.mjs');
 for(const portrait of [false,true])for(const depth of [false,true]){
  const f=combatStyles({portrait,depth,width:portrait?390:844,height:portrait?844:390});
  try{for(const selector of ['.app > header','.dom-hud'])assert.notEqual(f.style(selector).right,'72px');}finally{f.close();}
 }
});
