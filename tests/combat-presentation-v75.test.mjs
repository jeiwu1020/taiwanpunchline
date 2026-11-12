import test from 'node:test';
import assert from 'node:assert/strict';
import {existsSync,readFileSync} from 'node:fs';
import {JSDOM} from 'jsdom';
import {combatStyles} from './helpers/loaded-combat-styles.mjs';
import {cameraFrame,stableCameraFrame} from '../dist/arena-presentation.mjs';
import {CHAMBER} from '../dist/stage-expansion.mjs';
import {mountPageZoomGuard} from '../dist/page-zoom-gestures.mjs';
const url=new URL('../dist/combat-presentation.mjs',import.meta.url);
const presentation=existsSync(url)?await import(url):{};
const sizes=[{width:320,height:568,portrait:true},{width:390,height:844,portrait:true},{width:844,height:390},{width:568,height:320},{width:390,height:844,sideways:true},{width:1200,height:800,touch:false},{width:740,height:600,touch:false}];
test('full-stage canvas remains the same absolute layer through portrait pause and resume',()=>{
 for(const size of sizes){const h=combatStyles(size);for(const visible of [false,true,false]){
  h.document.querySelector('#pause-screen').classList.toggle('hidden',!visible);
  for(const selector of ['.cabinet','.stage-wrap','#game']){const s=h.style(selector);assert.equal(s.position,'absolute',`${JSON.stringify(size)} ${selector}`);assert.equal(s.top,'0');assert.equal(s.bottom,'0');}
  const deck=h.style('.control-deck');assert.equal(deck.position,'absolute');assert.equal(deck.background,'transparent');
  assert.equal(h.style('.dom-hud').position,'absolute');
 }h.close();}
});
test('timer has a measured-width-safe four-character budget and no viewport-sized percentage override',()=>{
 for(const size of sizes){const h=combatStyles(size);h.document.querySelector('.app').dataset.gameMode='challenge';
 const timer=h.style('#timer');assert.equal(timer['font-size'],'20px');assert.equal(timer['font-family'],'ui-monospace,monospace');
 const cols=h.style('.dom-hud')['grid-template-columns'];assert.match(cols,/60px/);
 // Four monospace glyphs, including 100%, fit even at a conservative .7em.
 assert.ok(4*20*.7+2<=60);h.close();}
});
test('pause preserves the scene with a light blur rather than an opaque replacement',()=>{
 const h=combatStyles({portrait:true,width:390,height:844});const s=h.style('#pause-screen');assert.equal(s.background,'#112a3226');assert.equal(s['backdrop-filter'],'blur(4px)');h.close();
});
test('stage camera keeps fighters between HUD and controls at jump apex and wide separation',()=>{
 assert.equal(typeof presentation.fullStageCameraFrame,'function');
 for(const size of sizes)for(const camera of [cameraFrame,stableCameraFrame]){
 const w=size.sideways?size.height:size.width,h=size.sideways?size.width:size.height,options={touch:size.touch!==false,portrait:!!size.portrait};
 const inset=presentation.stageInsets(w,h,options);
 for(const fighters of [[{x:68,y:430},{x:892,y:430}],[{x:260,y:160},{x:700,y:430}],[{x:100,y:160},{x:180,y:160}]]){
 const f=presentation.fullStageCameraFrame(camera,w,h,fighters,null,16,options);
 const sy=y=>(y-f.y)*f.zoom+h/2;
 assert.ok(sy(Math.min(...fighters.map(f=>f.y))-285)>=inset.top-1);
 assert.ok(sy(458)<=h-inset.bottom+1);
 const tiles=presentation.chamberBackdropTiles(f,CHAMBER);
 const left=f.x-w/(2*f.zoom),right=f.x+w/(2*f.zoom),top=f.y-h/(2*f.zoom),bottom=f.y+h/(2*f.zoom);
 assert.ok(Math.min(...tiles.map(t=>t.left))<=left);assert.ok(Math.max(...tiles.map(t=>t.right))>=right);
 assert.ok(Math.min(...tiles.map(t=>t.top))<=top);assert.ok(Math.max(...tiles.map(t=>t.bottom))>=bottom);
 assert.ok(tiles.every(t=>Math.abs(t.width-t.source[2]*CHAMBER.width/1672)<1e-6&&Math.abs(t.height-t.source[3]*CHAMBER.width/1672)<1e-6),'world landmarks never stretch with jumps');
 }}
});
test('page fallback cancels repeated pointer-game-control taps but retains native menu clicks',()=>{
 const dom=new JSDOM('<main><div class="control-deck"><button data-action="special1"><strong>招式</strong></button></div><button id="resume">繼續</button></main>'),doc=dom.window.document;
 const guard=mountPageZoomGuard({root:doc,ownsTarget:()=>true});
 function tap(target,time){const p={identifier:1,target,clientX:100,clientY:100};let last;for(const [type,touches,stamp]of [['touchstart',[p],time],['touchend',[],time+30]]){last=new dom.window.Event(type,{bubbles:true,cancelable:true});Object.defineProperties(last,{touches:{value:touches},changedTouches:{value:[p]},timeStamp:{value:stamp}});target.dispatchEvent(last);}return last.defaultPrevented;}
 assert.equal(tap(doc.querySelector('strong'),100),false);assert.equal(tap(doc.querySelector('strong'),220),true);
 assert.equal(tap(doc.querySelector('strong'),350),true);assert.equal(tap(doc.querySelector('#resume'),1000),false);assert.equal(tap(doc.querySelector('#resume'),1150),false);
 guard.destroy();dom.window.close();
});
test('depth route uses shared full-stage safe space while retaining legacy callers',async()=>{
 const {depthRouteCameraFrame}=await import('../dist/challenge-depth-render.mjs');
 for(const {width,height,portrait,touch=true} of sizes.filter(s=>!s.sideways))for(const y of [430,160]){
 const route={player:{x:1000,y,depth:0},worldWidth:3100};
 const frame=depthRouteCameraFrame(width,height,route,{portrait:!!portrait,touch,fullStage:true});
 const safe=presentation.stageInsets(width,height,{touch,portrait:!!portrait});
 const sy=v=>(v-frame.y)*frame.zoom+height/2;
 assert.ok(sy(y-300)>=safe.top-1,`${width}x${height}: actor head stays under HUD`);
 assert.ok(sy(495)<=height-safe.bottom+30,`${width}x${height}: walkable street clears controls`);
 }
});
test('pause freezes an in-flight camera ease until resume',()=>{
 const fighters=[{x:68,y:430},{x:892,y:430}],options={touch:true,portrait:true};
 const frame=presentation.fullStageCameraFrame(cameraFrame,390,844,fighters,null,16,options);
 const frozen=presentation.fullStageCameraFrame(cameraFrame,390,844,[{x:260,y:430},{x:700,y:430}],frame,100,{...options,paused:true});
 assert.deepEqual(frozen,frame);
 const resumed=presentation.fullStageCameraFrame(cameraFrame,390,844,[{x:260,y:430},{x:700,y:430}],frame,100,options);
 assert.notEqual(resumed.zoom,frame.zoom);
});
test('challenge arena paints the entire visible rectangle beyond former fixed backdrop bounds',async()=>{
 const {sceneFixture,artImages}=await import('./helpers/street-render-scene.mjs');
 const {createChallengeRenderer}=await import('../dist/challenge-render.mjs');
 const h=sceneFixture();h.scene.add.graphics=()=>{const g=new Proxy({},{get:()=>()=>g});return g;};
 const renderer=createChallengeRenderer(h.scene,artImages),ctx=h.textures.get('challenge-route-world').getContext(),rects=[];
 ctx.rect=(...args)=>rects.push(args);
 const frame={x:480,y:300,width:390,height:844,zoom:.25};renderer.drawArena(2,0,frame);
 assert.ok(rects.some(([x,y,w,height])=>x===0&&y===-1388&&w===1560&&height===3376),'clip must match actual visible world bounds');
});
test('chamber vertical extensions contain only material strips, never another auditorium',()=>{
 const frame={x:480,y:300,width:320,height:568,zoom:.22};
 const tiles=presentation.chamberBackdropTiles(frame,CHAMBER),top=CHAMBER.y-CHAMBER.floorRatio*CHAMBER.height,bottom=top+CHAMBER.height;
 assert.ok(tiles.some(t=>t.top>=bottom));assert.ok(tiles.some(t=>t.bottom<=top));
 for(const t of tiles){
  if(t.top>=bottom-1e-6){assert.equal(t.frame,'chamber-floor');assert.ok(t.source[1]>=760);assert.ok(t.source[1]+t.source[3]<=941);}
  else if(t.bottom<=top+1e-6){assert.equal(t.frame,'chamber-ceiling');assert.equal(t.source[1],0);assert.ok(t.source[3]<=64);}
  else{assert.equal(t.frame,'__BASE');assert.equal(t.height,CHAMBER.height);}
 }
});
test('main chamber explicitly uses BASE after Phaser named crops change firstFrame',async()=>{
 const {gameHarness}=await import('./helpers/game-harness.mjs'),h=await gameHarness();
 // Bundled Phaser Texture.add makes the first named crop firstFrame;
 // Texture.get(undefined) consequently resolves that crop, not __BASE.
 const frames=new Map([['__BASE',[0,0,1672,941]]]),texture={firstFrame:'__BASE',has:name=>frames.has(name),add(name,index,...crop){frames.set(name,crop);if(this.firstFrame==='__BASE')this.firstFrame=name;},get(name){return frames.get(name||this.firstFrame);}};
 const graphics=new Proxy({},{get:()=>()=>graphics}),images=[];
 const scene={textures:{get:()=>texture},add:{graphics:()=>graphics,text:()=>graphics,image(x,y,key,frame){const im=new Proxy({key,frame:frame||texture.firstFrame,crop:texture.get(frame)},{get:(o,k)=>o[k]??(()=>im)});images.push(im);return im;}}};
 h.ui.Arena.prototype.makeBackdrop.call(scene);
 assert.equal(texture.firstFrame,'chamber-floor','test includes the real default-frame hazard');
 assert.equal(scene.arenaBackdrop.frame,'__BASE');assert.deepEqual(scene.arenaBackdrop.crop,[0,0,1672,941]);
});
