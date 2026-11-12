import test from 'node:test';
import assert from 'node:assert/strict';
import {createChallengeRenderer} from '../dist/challenge-render.mjs';
import {drawChallengeBackdrop} from '../dist/challenge-art.mjs';
import {sceneFixture,artImages} from './helpers/street-render-scene.mjs';
import {readFile} from 'node:fs/promises';
import {EventEmitter} from 'node:events';
import {JSDOM} from 'jsdom';
import {createCanvas} from '@napi-rs/canvas';
import {mountGameViewport} from '../dist/game-viewport.mjs';
import {AsyncChallengeSession} from '../dist/preview/campaign/unified/first-chapter.mjs';
const sky={id:'warm-sun-free-sky',width:1536,height:1024};
const images={...artImages,'challenge-street-sky':sky};
function graphics(){const g=new Proxy({},{get:()=>()=>g});return g;}

// Extend only the test harness's existing closure-inspection API. The game
// source is unchanged, and the injected viewport below is the real adapter,
// never a ready=true substitute. Other harness users keep their original API.
async function gameHarnessWithViewport(){
 const helperURL=new URL('./helpers/game-harness.mjs',import.meta.url);let source=await readFile(helperURL,'utf8');
 const marker='setScene(value={}){scene=value;}';assert.equal(source.split(marker).length,2);
 source=source.replace(marker,marker+',setViewport(value){viewportUI=value;}').replaceAll('import.meta.url',JSON.stringify(helperURL.href));
 source=source.replace(/from (['"])(\.\.?\/[^'"]+)\1/g,(_all,_quote,path)=>'from '+JSON.stringify(new URL(path,helperURL).href));
 const {gameHarness}=await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));return gameHarness();
}

async function mountBossViewport(t,scene){
 const dom=new JSDOM(await readFile(new URL('../dist/index.html',import.meta.url),'utf8'),{url:'https://boss-surface.test/?previewOnly=1&touchPreview=1',pretendToBeVisual:true}),w=dom.window,d=w.document;
 let now=0,id=0;const frames=new Map();w.requestAnimationFrame=fn=>(frames.set(++id,fn),id);w.cancelAnimationFrame=id=>frames.delete(id);w.performance.now=()=>now;w.matchMedia=()=>({matches:true});
 Object.defineProperties(w,{innerWidth:{value:390},innerHeight:{value:844}});Object.defineProperty(w.navigator,'maxTouchPoints',{value:1});
 const stage=d.querySelector('#game');Object.defineProperties(stage,{clientWidth:{value:390},clientHeight:{value:844}});
 for(const selector of ['.app','#viewport-shell'])d.querySelector(selector).getBoundingClientRect=()=>({left:0,top:0,width:390,height:844});
 const names=['document','window','navigator','getComputedStyle','ResizeObserver'],old=Object.fromEntries(names.map(name=>[name,Object.getOwnPropertyDescriptor(globalThis,name)]));
 for(const [name,value]of Object.entries({document:d,window:w,navigator:w.navigator,getComputedStyle:()=>({paddingTop:'0',paddingRight:'0',paddingBottom:'0',paddingLeft:'0'}),ResizeObserver:class{observe(){}disconnect(){}}}))Object.defineProperty(globalThis,name,{configurable:true,writable:true,value});
 const canvas=createCanvas(390,844),context=canvas.getContext('2d');scene.game={canvas,events:new EventEmitter(),renderer:{width:390,height:844,gameContext:context,resize(width,height){this.width=width;this.height=height;}}};
 scene.scale.resize=function(width,height){this.width=width;this.height=height;};
 let viewport;
 t.after(()=>{viewport?.destroy();dom.window.close();for(const [name,descriptor]of Object.entries(old)){if(descriptor)Object.defineProperty(globalThis,name,descriptor);else delete globalThis[name];}});
 viewport=mountGameViewport({scene,clearHold(){},initialSettings:{rotate:false}});
 const advance=ms=>{for(let elapsed=0;elapsed<ms;elapsed+=16){now+=16;const batch=[...frames.values()];frames.clear();batch.forEach(fn=>fn(now));}};
 // A completed native destination fill provides the initial valid surface
 // lease. The following test frame must produce its own token and draw result.
 const initial=viewport.beginFrame(now);assert.ok(initial);context.fillStyle='#fff';context.fillRect(0,0,390,844);viewport.frameDrawn(initial);scene.game.events.emit('postrender');advance(1100);assert.equal(viewport.ready,true);
 return {viewport,document:d,advance,get now(){return now;}};
}


test('all boss scenes paint one continuous warm sky, not an empty upper gradient',()=>{
 for(const section of [0,1,2]){
  const h=sceneFixture();h.scene.add.graphics=graphics;const renderer=createChallengeRenderer(h.scene,images);
  renderer.drawArena(section,0,{x:480,y:100,width:390,height:844,zoom:.3});
  assert.equal(h.draws.filter(d=>d.image===sky).length,1);
  const display=h.images.find(i=>i.key==='challenge-route-world');assert.equal(display.visible,true);
 }
});

test('boss road continuation samples pavement at equal X/Y scale instead of stretching a 16px strip',()=>{
 const h=sceneFixture(),ctx=h.scene.textures.createCanvas('test',1600,800).getContext();
 drawChallengeBackdrop(ctx,images,{width:2200,height:3000,top:-1200,bottom:1800,curbY:420,buildingHeight:560,arena:true});
 const material=h.draws.filter(d=>d.image===images['challenge-arena']&&d.args.length===8&&d.args[2]<1536&&d.args[3]<1024);
 assert.ok(material.length>0,'native pavement material is painted beyond the original image');
 for(const {args:[sx,sy,sw,sh,x,y,w,h]}of material){assert.ok(sy>=700,'never repeat the curb, buildings, or sunset');assert.ok(Math.abs(w/sw-h/sh)<1e-8,'material grain must keep its world aspect');}
});

test('boss facade is prepared once and unchanged camera does not rebuild its canvas every animation frame',()=>{
 const h=sceneFixture();h.scene.add.graphics=graphics;const renderer=createChallengeRenderer(h.scene,images),frame={x:480,y:100,width:390,height:844,zoom:.3};
 renderer.drawArena(0,0,frame);const count=h.canvasCount,texture=h.textures.get('challenge-route-world'),refresh=texture.refreshes;
 renderer.drawArena(0,16,{...frame});assert.equal(h.canvasCount,count);assert.equal(texture.refreshes,refresh);
 renderer.drawArena(1,32,frame);assert.equal(texture.refreshes,refresh+1,'new boss section still paints its correct offset');
 renderer.hide();renderer.drawArena(1,48,frame);assert.equal(h.images.find(i=>i.key==='challenge-route-world').visible,true);
});

for(const checkpoint of [1,3,5])test(`actual boss ${checkpoint} update paints its arena, keeps chamber tiles hidden, and protects a failed frame`,async t=>{
 const h=await gameHarnessWithViewport();h.ui.setScene({artImages:{}});h.document.defaultView={innerWidth:390,innerHeight:844,requestAnimationFrame:()=>1,cancelAnimationFrame(){}};
 const run=await AsyncChallengeSession.create({progress:h.ui.profiles});while(run.checkpoint<checkpoint){run.phase.kind==='route'?await run.routeComplete({}):await run.bossWon({});}
 await h.ui.startChallenge({characterId:'wang',helperId:'han'});const story=h.$('.app').children.find(el=>el.className==='challenge-story');story.querySelector('[data-story-next]').onclick();story.querySelector('[data-story-next]').onclick();h.ui.duel.status='paused';
 assert.equal(h.ui.challenge.checkpoint,checkpoint);assert.equal(h.ui.challenge.phase.kind,'boss');
 const part=()=>({visible:true,setVisible(v){this.visible=v;return this;}}),stop=new Error('after background rendering');let chamberUpdates=0,stageDraws=0;const arenaCalls=[];
 const drawing=sceneFixture();drawing.scene.add.graphics=graphics;const realRenderer=createChallengeRenderer(drawing.scene,images);
 const scene=Object.assign(Object.create(h.ui.Arena.prototype),{dynamic:{},scale:{width:390,height:844},cameras:{main:{setViewport(){},setZoom(){},centerOn(){}}},time:{now:0},arenaBackdrop:part(),chamberDeskLayers:[part(),part()],backdropExtensions:[part(),part()],boundaryGraphics:part(),ambient:part(),rigs:[part(),part()],challengeRenderer:{drawArena(...args){arenaCalls.push(args);return realRenderer.drawArena(...args);},invalidateSurface(){realRenderer.invalidateSurface();}},updateBackdrop(){chamberUpdates++;this.backdropExtensions.forEach(p=>p.setVisible(true));},drawStageItems(){stageDraws++;throw stop;}});
 const surface=await mountBossViewport(t,scene),viewport=surface.viewport;h.ui.setViewport(viewport);
 const before=viewport.token,begin=viewport.beginFrame,drawn=viewport.frameDrawn,fail=viewport.failFrame;let captured,paintAcknowledgements=0,failed;
 viewport.beginFrame=time=>{captured=begin(time);return captured;};viewport.frameDrawn=token=>{paintAcknowledgements++;return drawn(token);};viewport.failFrame=error=>{failed=error;return fail(error);};
 assert.doesNotThrow(()=>h.ui.Arena.prototype.update.call(scene,surface.now,16));
 assert.equal(captured,before,'the attempted update uses the valid current surface token');assert.equal(stageDraws,1,'the intended failure point was actually reached');assert.equal(failed,stop,'the renderer guard catches the intended failure, not a fixture TypeError');
 assert.equal(arenaCalls.length,1);assert.equal(arenaCalls[0][0],h.ui.challenge.phase.section??2);assert.ok(drawing.draws.some(draw=>draw.image===sky),'real drawArena painted the boss sky');
 assert.equal(chamberUpdates,0);for(const tile of [scene.arenaBackdrop,...scene.chamberDeskLayers,...scene.backdropExtensions,scene.boundaryGraphics,scene.ambient])assert.equal(tile.visible,false);
 assert.equal(paintAcknowledgements,0,'a partial failed frame must not acknowledge paint');assert.equal(viewport.ready,false);assert.notEqual(viewport.token,before);
 scene.game.events.emit('postrender');surface.advance(2400);assert.equal(viewport.ready,false,'a bare postrender cannot accept the failed update');assert.equal(viewport.status,'blocked');assert.equal(surface.document.querySelector('[data-viewport-protection]').hidden,false);
});

test('moving boss cameras reuse prepared materials with bounded paint calls and canvas allocation',async()=>{
 const {fullStageCameraFrame}=await import('../dist/combat-presentation.mjs'),{cameraFrame}=await import('../dist/arena-presentation.mjs');
 for(const [width,height]of [[320,568],[390,844],[430,932],[844,390],[568,320],[1280,800]]){
  const h=sceneFixture();h.scene.add.graphics=graphics;const renderer=createChallengeRenderer(h.scene,images);let previous=null,maxDraws=0,allocated;
  for(let i=0;i<120;i++){
   const frame=fullStageCameraFrame(cameraFrame,width,height,[{x:68+i*3,y:430-377*Math.sin(Math.PI*i/119)},{x:892,y:430}],previous,16,{portrait:width<height,touch:width<1000});previous=frame;
   const count=h.draws.length;renderer.drawArena(2,i*16,frame);if(i)maxDraws=Math.max(maxDraws,h.draws.length-count);
   if(i===0)allocated=new Map(h.textures);assert.equal(h.canvasCount,4,'boss-only rendering allocates exactly four surfaces');for(const [key,texture]of allocated)assert.equal(h.textures.get(key),texture,'moving camera reuses '+key);
  }
  assert.ok(maxDraws<=48,`${width}x${height}: ${maxDraws} draws exceeds moving-frame budget`);
  assert.equal(h.textures.get('challenge-arena-facade').refreshes,1);assert.equal(h.textures.get('challenge-arena-road').refreshes,1);
  assert.deepEqual([...h.textures.keys()].sort(),['challenge-depth-world','challenge-route-world','challenge-arena-facade','challenge-arena-road'].sort());
  assert.equal(h.textures.get('challenge-depth-world').width,1);assert.equal(h.textures.get('challenge-depth-world').height,1);
  assert.equal(h.textures.get('challenge-route-world').width,1600);assert.equal(h.textures.get('challenge-route-world').height,800);
  assert.deepEqual(['challenge-arena-facade','challenge-arena-road'].map(key=>[h.textures.get(key).width,h.textures.get(key).height]),[[1536,1024],[848,832]],'boss materials retain their source-preserving preparation dimensions');
  assert.ok(![...h.textures.keys()].some(key=>key.startsWith('challenge-depth-backdrop')),'unused street strips remain unallocated in a boss-only scene');
  const refreshes=h.textures.get('challenge-route-world').refreshes;renderer.drawArena(2,2000,{...previous});assert.equal(h.textures.get('challenge-route-world').refreshes,refreshes,'identical section and camera reuse the painted output');assert.equal(h.canvasCount,4);
 }
});

test('one central arena retains its world geometry and side continuation never repeats the sun',()=>{
 const h=sceneFixture();h.scene.add.graphics=graphics;const renderer=createChallengeRenderer(h.scene,images);
 renderer.drawArena(2,0,{x:480,y:0,width:844,height:390,zoom:.18});
 const facade=h.textures.get('challenge-arena-facade').getCanvas(),draws=h.draws.filter(d=>d.image===facade&&d.args[2]>1),base=draws.filter(d=>d.args[2]===1536);
 assert.equal(base.length,1);const a=base[0].args;assert.equal(a[5],-140);assert.equal(a[6],1536*560/670);assert.equal(a[7],1024*560/670);
 assert.ok(draws.length>3);assert.ok(draws.filter(d=>d!==base[0]).every(d=>d.args[0]===0||d.args[0]===1280),'extension only samples outside the central sunset');
 const parts=h.draws.filter(d=>d.image===images['challenge-street-props']),[front,table]=parts;assert.ok(table&&front);assert.deepEqual(table.args.slice(0,4),[101,130,1244,513]);assert.ok(Math.abs(table.args[5]+table.args[7]*40/513-(430+(581-715)*1400/1672))<1e-8);assert.ok(Math.abs(front.args[5]+front.args[7]-430)<1e-8);
});

test('missing optional warm sky and legacy arena source still render real material without throwing',()=>{
 for(const mode of ['missing-sky','legacy']){
  const art={...images};delete art['challenge-street-sky'];if(mode==='legacy')delete art['challenge-arena'];
  const h=sceneFixture();h.scene.add.graphics=graphics;const renderer=createChallengeRenderer(h.scene,art);
  for(const x of [-1000,480,2500])renderer.drawArena(1,0,{x,y:0,width:844,height:390,zoom:.18});
  assert.equal(h.images.find(i=>i.key==='challenge-route-world').visible,true);assert.equal(h.textures.get('challenge-arena-facade').refreshes,1);
  const frame=mode==='legacy'?[2172,724]:[1536,1024];assert.equal(h.textures.get('challenge-arena-facade').width,frame[0]);assert.equal(h.textures.get('challenge-arena-facade').height,frame[1]);
 }
});
