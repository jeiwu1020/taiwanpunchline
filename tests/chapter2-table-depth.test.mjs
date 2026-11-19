import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {JSDOM} from 'jsdom';
import {createCanvas,Image} from '@napi-rs/canvas';
import {TABLE_SIDE_CLEARANCE} from '../dist/challenge-depth-engine.mjs';
import {createChapter2Route} from '../dist/preview/chapter2/chapter2-engine.mjs';
const dist=resolve('dist/preview/chapter2');
const advance=(g,input,n=90)=>{for(let i=0;i<n;i++)g.step(1/60,input);};
const clean=(type='wang',routeIndex=0)=>{const g=createChapter2Route({characterId:type,routeIndex,rng:()=>.5});g.section={...g.section,spawns:[]};g.enemies=[];return g;};

test('real chapter-two renderer keeps a rear-contact actor behind both tabletop and apron',async()=>{
 const dom=new JSDOM(await readFile(resolve(dist,'index.html'),'utf8'),{url:'http://table.test/',pretendToBeVisual:true});
 const originalGlobals=Object.fromEntries(['window','document','Image','innerWidth','innerHeight','devicePixelRatio','requestAnimationFrame'].map(key=>[key,globalThis[key]]));
 try{
 const {window}=dom,canvas=window.document.querySelector('canvas'),native=createCanvas(960,540),ctx=native.getContext('2d');
 let raf;const events=[],ellipses=[],ellipse=ctx.ellipse.bind(ctx),drawImage=ctx.drawImage.bind(ctx);ctx.ellipse=(...args)=>{ellipses.push(args);return ellipse(...args);};ctx.drawImage=(im,...args)=>{events.push({image:im.tag,args});return drawImage(im,...args);};
 for(const name of ['width','height'])Object.defineProperty(canvas,name,{get:()=>native[name],set:n=>native[name]=n,configurable:true});
 for(const [name,n] of [['clientWidth',960],['clientHeight',540]])Object.defineProperty(canvas,name,{get:()=>n,configurable:true});
 canvas.getContext=()=>ctx;window.document.querySelector('#stage').getBoundingClientRect=()=>({width:960,height:540});
 class LocalImage extends Image{set src(v){this.tag=v;super.src=resolve(dist,v);}get src(){return super.src;}}
 Object.assign(globalThis,{window,document:window.document,Image:LocalImage,innerWidth:960,innerHeight:540,devicePixelRatio:1,requestAnimationFrame:f=>(raf=f,1)});
 const script=(await readFile(resolve(dist,'chapter2-playable.mjs'),'utf8')).replace(/from '(\.\.?\/[^']+)'/g,(_,p)=>`from '${new URL(p,pathToFileURL(resolve(dist,'chapter2-playable.mjs'))).href}'`);
 const app=await import('data:text/javascript;base64,'+Buffer.from(script+'\nexport {chapter,draw,sync,images};').toString('base64'));
 const q=s=>window.document.querySelector(s);for(let i=0;i<200&&q('#start').disabled;i++)await new Promise(r=>setTimeout(r,10));assert.equal(q('#start').disabled,false);
 q('#start').click();let storyAdvances=0;while(app.chapter.view().mode==='story'&&storyAdvances<24){const state=app.chapter.view();assert.equal(app.chapter.nextStory(state.token),true);storyAdvances++;}
 assert.notEqual(app.chapter.view().mode,'story',`story did not advance after ${storyAdvances} clicks (frame ${app.chapter.view().frameIndex}/${app.chapter.view().frameCount})`);
 const g=app.chapter.world,t=g.platforms[0];g.section={...g.section,spawns:[]};g.enemies=[];g.platforms=[t];g.supplyUsed=true;
 Object.assign(g.player,{x:(t.left+t.right)/2,depth:t.depth-t.depthHalf-10,y:430,supportY:430});advance(g,{down:true},90);
 assert.equal(g.player.depth,-62,'unchanged physical collision stops at rear edge');
 events.length=0;app.draw(1000);await writeFile(join(tmpdir(),'rear-contact-current.png'),native.toBuffer('image/png'));
 const bodyLast=events.findLastIndex(e=>/wang-(parts|head)/.test(e.image)),tables=events.map((e,i)=>({...e,i})).filter(e=>e.image?.endsWith('street-props-v2.webp')&&e.args[0]===101);
 const isFront=e=>e.args[1]===130&&Math.abs(e.args[7]/e.args[6]-(430-t.y)*513/433/250)<1e-8;
 assert.ok(bodyLast>=0);assert.ok(tables.some(e=>!isFront(e)&&e.i>bodyLast),'tabletop must cover actor at rear collision boundary');
 assert.ok(tables.some(e=>isFront(e)&&e.i>bodyLast),'front apron must cover actor at rear collision boundary');
 const front=tables.find(e=>isFront(e));const y0=front.args[5]+front.args[7]*80/513,height=front.args[7]*433/513;
 // Compare with the projected ground point at depth -2, not table centre -32.
 const zoom=front.args[6]/250;assert.ok(Math.abs((y0+height)-(y0+88*zoom))<1e-8,'front face retains full table height down to the front ground plane');
 Object.assign(g.player,{y:t.y,supportY:t.y,depth:t.depth});ellipses.length=0;events.length=0;app.draw(1000);
 const shadow=ellipses.find(e=>Math.abs(e[2]-38*zoom)<1e-9),surface=events.find(e=>e.image?.endsWith('street-props-v2.webp')&&e.args[0]===101&&e.args[1]===130&&!isFront(e));
 assert.ok(Math.abs(shadow[1]-(surface.args[5]+(t.depthHalf*.65*zoom)))<1e-8,'tabletop occupant shadow must share its support plane');
 }finally{dom.window.close();for(const [key,value] of Object.entries(originalGlobals)){if(value===undefined)delete globalThis[key];else globalThis[key]=value;}}
});

test('all three starters keep every chapter-two table solid on four sides and landable from both depth edges',()=>{
 for(const type of ['wang','han','huang'])for(let routeIndex=0;routeIndex<3;routeIndex++)for(let ti=0;ti<2;ti++){
  for(const side of ['back','front','left','right']){
   const g=clean(type,routeIndex),p=g.player,t=g.platforms[ti],near=t.depth+t.depthHalf,far=t.depth-t.depthHalf;g.platforms=[t];g.chapterEncounter={key:`2:${g.section.id}`,chapter:2,boss:false,kind:'rush',collision:{halfWidth:40,depthHalf:24,height:82},props:[],gates:[],hazards:[],parcels:[],effects:[],notes:[],time:0};
   Object.assign(p,{x:side==='left'?t.left-25:side==='right'?t.right+25:(t.left+t.right)/2,depth:side==='back'?far-10:side==='front'?near+10:t.depth,y:430,supportY:430});
   advance(g,{[side==='back'?'down':side==='front'?'up':side==='left'?'right':'left']:true});
   assert.equal(side==='left'||side==='right'?p.x:p.depth,side==='left'?t.left-TABLE_SIDE_CLEARANCE:side==='right'?t.right+TABLE_SIDE_CLEARANCE:side==='back'?far:near,type+'/'+routeIndex+'/'+ti+'/'+side);
  }
  for(const sign of [-1,1]){
   const g=clean(type,routeIndex),p=g.player,t=g.platforms[ti];Object.assign(p,{x:(t.left+t.right)/2,depth:t.depth+sign*(t.depthHalf+8)});g.press('jump');advance(g,sign<0?{down:true}:{up:true},16);advance(g,{},100);assert.equal(p.y,t.y);assert.equal(p.supportY,t.y);advance(g,sign<0?{down:true}:{up:true},50);assert.equal(p.y,430);
  }
 }
});

// A single whole-table depth cannot satisfy rear contact and standing on its rear half.
// The bands must be interleaved around actual feet depth, never around jump y.
test('table surface bands interleave at feet depth without changing actor order or non-depth duels',async()=>{
 const rules=await import('../dist/preview/chapter2/chapter2-render-rules.mjs');assert.equal(typeof rules.chapter2SceneLayers,'function');
 const t={left:940,right:1190,y:342,depth:-32,depthHalf:30};
 const back={x:1000,depth:-62,y:430},onTop={x:1065,depth:-40,y:342},front={x:1065,depth:-2,y:430};
 const list=rules.chapter2SceneLayers([t],[back,onTop,front],true),at=a=>list.findIndex(o=>o.a===a),top=list.map((o,i)=>({...o,i})).filter(o=>o.kind==='table-top'),apron=list.findIndex(o=>o.kind==='table-front');
 assert.deepEqual(top.map(o=>[o.from,o.to]),[[-62,-40],[-40,-2]]);
 assert.ok(top[0].i>at(back)&&top[0].i<at(onTop)&&top[1].i>at(onTop));assert.ok(apron>at(onTop)&&apron<at(front));
 const jump=rules.chapter2SceneLayers([t],[{...back,y:250},onTop,front],true);assert.deepEqual(jump.map(o=>[o.kind,o.depth]),list.map(o=>[o.kind,o.depth]),'vertical jump does not reorder foot planes');
 assert.deepEqual(rules.chapter2SceneLayers([t],[back,onTop,front],false).map(o=>o.kind),['table-solid','actor','actor','actor']);
});

test('front legs meet the near ground line and tabletop stays at the landing height',async()=>{
 const rules=await import('../dist/preview/chapter2/chapter2-render-rules.mjs');assert.equal(typeof rules.drawChapter2TableLayer,'function');
 const calls=[],img={},ctx={drawImage:(...a)=>calls.push(a),save(){},restore(){},beginPath(){},rect(){},clip(){}},t={left:940,right:1190,y:342,depth:-32,depthHalf:30},frame={left:400,base:430,zoom:.8};
 rules.drawChapter2TableLayer(ctx,{'challenge-street-props':img},{kind:'table-front',p:t,depth:-2},frame);
 assert.equal(calls.length,1);assert.deepEqual(calls[0].slice(1,5),[101,130,1244,513]);
 assert.ok(Math.abs(calls[0][6]+calls[0][8]*80/513-358.56)<1e-9);assert.ok(Math.abs(calls[0][8]*433/513-70.4)<1e-9);assert.ok(Math.abs(calls[0][6]+calls[0][8]-428.96)<1e-9);
 calls.length=0;rules.drawChapter2TableLayer(ctx,{'challenge-street-props':img},{kind:'table-top',p:t,from:-62,to:-2},frame);
 assert.deepEqual(calls[0].slice(1,5),[101,130,1244,513]);assert.ok(Math.abs(calls[0][6]-327.36)<1e-9);assert.ok(Math.abs(calls[0][8]*80/513-31.2)<1e-9);
});
