import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {EventEmitter} from 'node:events';
import {readFile} from 'node:fs/promises';
import {createCanvas,loadImage} from '@napi-rs/canvas';
import {JSDOM} from 'jsdom';
import {ART_FILES} from '../dist/art-render.mjs';
import {CHALLENGE_ART_FILES} from '../dist/challenge-art.mjs';
import {createDepthChallengeRenderer} from '../dist/challenge-depth-render.mjs';
import {createChallengeRenderer} from '../dist/challenge-render.mjs';
import {Duel} from '../dist/core.mjs';
import {mountGameViewport} from '../dist/game-viewport.mjs';

// Native pixels are required, not an optional mock fallback. These fixtures
// model the bundled Phaser CanvasTexture.setSize boundary: equal sizes do
// nothing; changed sizes update source/frame metadata and refresh the texture.
function nativeScene(t){
 const textures=new Map(),allocated=[];
 const document={createElement(){
  const canvas=createCanvas(1,1);canvas.ownerDocument=document;canvas.backingWrites=0;
  for(const key of ['width','height']){
   const descriptor=Object.getOwnPropertyDescriptor(Object.getPrototypeOf(canvas),key);
   Object.defineProperty(canvas,key,{get(){return descriptor.get.call(this);},set(value){this.backingWrites++;descriptor.set.call(this,value);}});
  }
  allocated.push(canvas);return canvas;
 }};
 function addCanvas(key,canvas){
  const powerOfTwo=(w,h)=>w>0&&h>0&&(w&(w-1))===0&&(h&(h-1))===0;
  const context=canvas.getContext('2d'),base={width:canvas.width,height:canvas.height,x:0,y:0},source={width:canvas.width,height:canvas.height,isPowerOf2:powerOfTwo(canvas.width,canvas.height)};
  const texture={width:canvas.width,height:canvas.height,_source:source,frames:{__BASE:base},refreshes:0,
   getCanvas:()=>canvas,getContext:()=>context,
   setSize(width,height=width){
    if(width===this.width&&height===this.height)return this;
    canvas.width=width;canvas.height=height;Object.assign(source,{width,height,isPowerOf2:powerOfTwo(width,height)});Object.assign(base,{width,height,x:0,y:0});
    this.width=width;this.height=height;return this.refresh();
   },refresh(){this.refreshes++;return this;}
  };
  textures.set(key,texture);return texture;
 }
 function display(){const d={};for(const name of ['setOrigin','setDepth','setVisible','setPosition','setDisplaySize','setTexture','setFlipX','setCrop','setScale','setText','updateText'])d[name]=()=>d;return d;}
 const graphics=new Proxy({},{get:()=>()=>graphics});
 const scene={sys:{game:{canvas:{ownerDocument:document}}},textures:{addCanvas,createCanvas(key,w,h){const c=document.createElement();c.width=w;c.height=h;return addCanvas(key,c);},remove:key=>textures.delete(key)},add:{image:display,text:display,graphics:()=>graphics}};
 t.after(()=>{for(const canvas of allocated){canvas.width=1;canvas.height=1;}});
 return {scene,textures};
}

const frame={width:390,height:500,x:480,y:250,zoom:.8};
const assetKeys=['wang-parts','wang-head','wang-shock','art-limbs','left-arms'];
const challengeKeys=['challenge-arena','challenge-street-deep','challenge-street-props','challenge-mobs'];
const imagesPromise=(async()=>{
 const images={};
 for(const key of [...assetKeys,...challengeKeys])images[key]=await loadImage(new URL('../dist/assets/'+(ART_FILES[key]||CHALLENGE_ART_FILES[key]),import.meta.url).pathname);
 return images;
})();
const depthImages=images=>Object.fromEntries(assetKeys.map(key=>[key,images[key]]));
function route(depthMode=false){
 const player=new Duel('wang','easy',()=>.2,'han').player;Object.assign(player,{x:480,y:430});
 return {depthMode,player,enemies:depthMode?[]:Array.from({length:5},(_,i)=>({...player,mobKind:['mic','flyer','guard','mic','guard'][i],name:'mob '+i,x:280+i*90,face:1,hp:100,maxHp:100})),platforms:[],rallies:[],section:{supplyX:100},sectionIndex:0,gateX:800,worldWidth:1600,supplyUsed:true};
}
function snapshot(canvas){return createHash('sha256').update(canvas.getContext('2d').getImageData(0,0,canvas.width,canvas.height).data).digest('hex');}
function assertContent(canvas){
 const pixels=canvas.getContext('2d').getImageData(0,0,canvas.width,canvas.height).data,colors=new Set();let painted=0;
 for(let i=0;i<pixels.length;i+=4)if(pixels[i+3]>=16){painted++;colors.add((pixels[i]<<16)|(pixels[i+1]<<8)|pixels[i+2]);}
 assert.ok(painted>1000,'the reference includes substantial original artwork');assert.ok(colors.size>100,'a blank/flat opaque sky is not a recovery reference');
}
function dimensions(texture){return [texture.width,texture.height,texture.getCanvas().width,texture.getCanvas().height,texture._source.width,texture._source.height,texture.frames.__BASE.width,texture.frames.__BASE.height];}
function poison(context){
 context.save();context.save();context.setTransform(1,0,0,1,0,0);context.beginPath();context.rect(0,0,1,1);context.clip();
 throw new Error('injected nested offscreen clip');
}
function failNextImage(context){
 const original=context.drawImage;
 context.drawImage=function(){this.drawImage=original;poison(this);};
}
function assertUnclipped(context){
 context.save();context.setTransform(1,0,0,1,0,0);context.fillStyle='#00ff00';context.fillRect(0,0,context.canvas.width,context.canvas.height);
 assert.deepEqual([...context.getImageData(context.canvas.width-2,context.canvas.height-2,1,1).data],[0,255,0,255],'the far corner must be paintable after nested save/clip failure');context.restore();
}

test('native Phaser fixture preserves pixels and clip on same-size setSize, but resets on a true resize',t=>{
 const f=nativeScene(t),texture=f.scene.textures.createCanvas('fixture',16,16),ctx=texture.getContext();ctx.fillStyle='#ff0000';ctx.fillRect(0,0,16,16);
 assert.throws(()=>poison(ctx),/injected nested offscreen clip/);texture.setSize(16,16);ctx.fillStyle='#00ff00';ctx.fillRect(0,0,16,16);
 assert.deepEqual([...ctx.getImageData(14,14,1,1).data],[255,0,0,255]);assert.equal(texture.refreshes,0);
 texture.setSize(32,32);assert.deepEqual(dimensions(texture),[32,32,32,32,32,32,32,32]);assert.equal(texture._source.isPowerOf2,true);assert.equal(texture.refreshes,1);assertUnclipped(ctx);
});

for(const kind of ['depth-direct','depth-wrapper','arena','legacy',...Array.from({length:5},(_,i)=>'mob-'+i)])test(`${kind} public invalidation restores full native pixels after repeated same-size failed draws`,async t=>{
 const images=await imagesPromise,f=nativeScene(t),isDepth=kind.startsWith('depth'),r=kind==='depth-direct'?createDepthChallengeRenderer(f.scene,depthImages(images)):createChallengeRenderer(f.scene,isDepth?depthImages(images):images),world=route(isDepth);
 const draw=()=>kind==='arena'?r.drawArena(0,0,frame):r.draw(world,0,frame,{skipMic:true});
 for(let i=0;i<12;i++)draw();
 const key=isDepth?'challenge-depth-world':kind.startsWith('mob-')?'challenge-'+kind:'challenge-route-world',texture=f.textures.get(key),canvas=texture.getCanvas(),ctx=texture.getContext(),expectedSize=isDepth?[780,1000]:kind.startsWith('mob-')?[512,384]:[1600,800];
 assert.deepEqual(dimensions(texture),Array(4).fill(expectedSize).flat());assert.equal(texture._source.isPowerOf2,false);assertContent(canvas);
 const before=snapshot(canvas),writes=canvas.backingWrites,refreshes=texture.refreshes;
 for(let i=0;i<3;i++)draw();
 assert.equal(canvas.backingWrites,writes,'ordinary stable frames must not reallocate the backing');assert.equal(snapshot(canvas),before);
 if(kind==='arena')assert.equal(texture.refreshes,refreshes,'unchanged arena camera reuses its prepared texture');
 for(let attempt=0;attempt<2;attempt++){
  failNextImage(ctx);
  // Arena's normal stamp cache is retained; move the section to exercise a
  // real draw without calling its public invalidator before the fault.
  assert.throws(()=>kind==='arena'?r.drawArena(attempt+1,0,frame):draw(),/injected nested offscreen clip/);
  r.invalidateSurface();assert.deepEqual(dimensions(texture),Array(4).fill(expectedSize).flat());assert.equal(texture._source.isPowerOf2,false);
 }
 const refreshBefore=texture.refreshes;draw();
 assert.equal(snapshot(canvas),before,'the first successful draw restores the complete original-art surface, not just its alpha or transform');
 assert.ok(texture.refreshes>refreshBefore,'restored pixels are refreshed before they can be presented');assert.equal(ctx.imageSmoothingEnabled,true);
 assertUnclipped(ctx);
});

test('arena invalidation resets all five retained hidden legacy mob contexts before their next use',async t=>{
 const f=nativeScene(t),r=createChallengeRenderer(f.scene,await imagesPromise),world=route();r.draw(world,0,frame);
 const mobs=Array.from({length:5},(_,i)=>f.textures.get('challenge-mob-'+i)),before=mobs.map(v=>snapshot(v.getCanvas()));
 r.drawArena(0,0,frame);
 for(const texture of mobs)assert.throws(()=>poison(texture.getContext()),/injected nested offscreen clip/);
 r.invalidateSurface();r.drawArena(0,0,frame);
 for(const texture of mobs)assert.deepEqual(dimensions(texture),[512,384,512,384,512,384,512,384],'invalidation keeps the existing bounded inactive-mode allocation policy');
 r.draw(world,0,frame);
 for(let i=0;i<mobs.length;i++){assert.equal(snapshot(mobs[i].getCanvas()),before[i]);assertUnclipped(mobs[i].getContext());}
});

async function mountNativeViewport(t,scene){
 const dom=new JSDOM(await readFile(new URL('../dist/index.html',import.meta.url),'utf8'),{url:'https://offscreen-recovery.test/?previewOnly=1&touchPreview=1',pretendToBeVisual:true}),w=dom.window,d=w.document;
 let now=0,id=0;const frames=new Map();w.requestAnimationFrame=fn=>(frames.set(++id,fn),id);w.cancelAnimationFrame=id=>frames.delete(id);w.performance.now=()=>now;w.matchMedia=()=>({matches:true});
 Object.defineProperties(w,{innerWidth:{value:390},innerHeight:{value:500}});Object.defineProperty(w.navigator,'maxTouchPoints',{value:1});
 Object.defineProperties(d.querySelector('#game'),{clientWidth:{value:390},clientHeight:{value:500}});
 for(const selector of ['.app','#viewport-shell'])d.querySelector(selector).getBoundingClientRect=()=>({left:0,top:0,width:390,height:500});
 const values={document:d,window:w,navigator:w.navigator,getComputedStyle:()=>({paddingTop:'0',paddingRight:'0',paddingBottom:'0',paddingLeft:'0'}),ResizeObserver:class{observe(){}disconnect(){}}},old=Object.fromEntries(Object.keys(values).map(name=>[name,Object.getOwnPropertyDescriptor(globalThis,name)]));
 for(const [name,value]of Object.entries(values))Object.defineProperty(globalThis,name,{configurable:true,writable:true,value});
 const canvas=createCanvas(390,500),context=canvas.getContext('2d');scene.scale={width:390,height:500,resize(w,h){this.width=w;this.height=h;}};
 scene.game={canvas,events:new EventEmitter(),renderer:{width:390,height:500,gameContext:context,resize(w,h){this.width=w;this.height=h;}}};
 const viewport=mountGameViewport({scene,clearHold(){},initialSettings:{rotate:false}});
 t.after(()=>{viewport.destroy();dom.window.close();for(const [name,descriptor]of Object.entries(old)){if(descriptor)Object.defineProperty(globalThis,name,descriptor);else delete globalThis[name];}});
 return {viewport,canvas,context,get now(){return now;},advance(ms){for(let elapsed=0;elapsed<ms;elapsed+=16){now+=16;const batch=[...frames.values()];frames.clear();batch.forEach(fn=>fn(now));}}};
}

for(const policy of ['retained','finite'])test(`${policy}: real main viewport cannot accept repeated offscreen failures and only readies after recovered pixels plus matching postrender`,async t=>{
 const frame={width:390,height:500,x:480,y:250,zoom:.8,presentation:{width:844,height:390,touch:policy==='finite'}};
 const f=nativeScene(t),r=createChallengeRenderer(f.scene,depthImages(await imagesPromise)),world=route(true);f.scene.challengeRenderer=r;
 const h=await mountNativeViewport(t,f.scene),v=h.viewport;
 const draw=()=>{r.draw(world,0,frame,{skipMic:true});h.context.clearRect(0,0,390,500);h.context.drawImage(f.textures.get('challenge-depth-world').getCanvas(),0,0,390,500);};
 const token=v.beginFrame(h.now);assert.ok(token);draw();const baseline=snapshot(h.canvas);assertContent(h.canvas);v.frameDrawn(token);f.scene.game.events.emit('postrender');h.advance(1100);assert.equal(v.ready,true,JSON.stringify({status:v.status,reason:v.reason,frame:v.frame}));
 const ctx=f.textures.get('challenge-depth-world').getContext();
 for(let attempt=0;attempt<3;attempt++){
  const failedToken=v.beginFrame(h.now);assert.ok(failedToken);failNextImage(ctx);
  assert.throws(draw,/injected nested offscreen clip/);v.failFrame();assert.equal(v.ready,false);assert.notEqual(v.token,failedToken);
  f.scene.game.events.emit('postrender');h.advance(32);assert.equal(v.ready,false,'bare postrender cannot acknowledge a failed offscreen draw');
 }
 h.advance(2400);assert.equal(v.status,'blocked');assert.equal(v.ready,false);
 const recoveredToken=v.beginFrame(h.now);assert.ok(recoveredToken);draw();
 assert.equal(snapshot(h.canvas),baseline,'complete actor pixels have recovered before any success acknowledgement');assert.equal(v.ready,false);
 v.frameDrawn(recoveredToken);assert.equal(v.ready,false,'a completed update still awaits the matching Phaser postrender');f.scene.game.events.emit('postrender');h.advance(1100);assert.equal(v.ready,true);
});
