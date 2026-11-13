import test from 'node:test';
import assert from 'node:assert/strict';
import {writeFile,mkdir} from 'node:fs/promises';
import {resolve} from 'node:path';
import {createCanvas,loadImage} from '@napi-rs/canvas';
import {ChallengeDepthRoute,TABLE_SIDE_CLEARANCE} from '../dist/challenge-depth-engine.mjs';
import {depthRenderItems,paintDepthRoute,depthRouteCameraFrame} from '../dist/challenge-depth-render.mjs';
import {ART_FILES} from '../dist/art-render.mjs';
import {CHALLENGE_ART_FILES} from '../dist/challenge-art.mjs';
import {Duel,GROUND} from '../dist/core.mjs';
import {DESK} from '../dist/stage-expansion.mjs';
import {StreetTrial} from '../dist/street-trial-engine.mjs';
const clean=(section=0,type='wang')=>{const g=new ChallengeDepthRoute(type,'easy',()=>.5,{section});g.section={...g.section,spawns:[]};g.enemies=[];g.supplyUsed=true;return g;};
const step=(g,input,n)=>{for(let i=0;i<n;i++)g.step(1/60,input);};

test('all three main-street renderers keep rear contact behind tabletop and front apron',()=>{
 for(let section=0;section<3;section++)for(const t of clean(section).platforms){
  const g=clean(section);g.platforms=[t];Object.assign(g.player,{x:(t.left+t.right)/2,depth:t.depth-t.depthHalf,y:GROUND});
  const list=depthRenderItems(g),actor=list.findIndex(i=>i.value===g.player),tables=list.map((v,i)=>({...v,i})).filter(i=>i.kind==='platform');
  assert.ok(tables.some(i=>i.part==='top'&&i.i>actor),'rear contact stays behind tabletop');
  assert.ok(tables.some(i=>i.part==='front'&&i.i>actor),'rear contact stays behind apron');
 }
});
test('main-street true Canvas pixels preserve rear occlusion without cutting a fighter sprite',async()=>{
 const files={...ART_FILES,...CHALLENGE_ART_FILES},images=Object.fromEntries(await Promise.all(Object.entries(files).map(async([id,file])=>{const im=await loadImage(resolve('dist/assets',file));im.tag=id;return[id,im];})));
 const g=clean(),t=g.platforms[0];g.platforms=[t];Object.assign(g.player,{x:(t.left+t.right)/2,depth:-36});
 const canvas=createCanvas(960,540),ctx=canvas.getContext('2d'),events=[],draw=ctx.drawImage.bind(ctx);ctx.drawImage=(im,...args)=>{events.push({id:im.tag,args});return draw(im,...args);};
 const frame=depthRouteCameraFrame(960,540,g),left=frame.x-frame.width/(2*frame.zoom),top=frame.y-frame.height/(2*frame.zoom);ctx.scale(frame.zoom,frame.zoom);ctx.translate(-left,-top);paintDepthRoute(ctx,images,g,1000,frame);
 await mkdir(resolve('../evidence'),{recursive:true});await writeFile(resolve('../evidence/main-rear-current.png'),canvas.toBuffer('image/png'));
 const body=events.findLastIndex(e=>e.id==='wang-parts'),tables=events.map((e,i)=>({...e,i})).filter(e=>e.id==='challenge-street-props'&&e.args[0]===101);
 const isFront=e=>e.args[1]===130&&Math.abs(e.args[7]-(430-t.y)*513/433)<1e-8;
 assert.ok(body>=0);assert.ok(tables.some(e=>!isFront(e)&&e.i>body),'real painted tabletop must cover rear actor');assert.ok(tables.some(e=>isFront(e)&&e.i>body),'real apron must cover rear actor');
 const front=tables.find(e=>isFront(e));assert.ok(Math.abs(front.args[5]+front.args[7]-453.4)<1e-9,'front feet meet the near depth plane');
 // Actual defeated mob art rotates; the rotated complete sprite must still
 // use its original foot lane on either side of the table.
 const seeded=new ChallengeDepthRoute('wang','easy',()=>.5);seeded.player.x=1155;seeded.spawn();const corpse=seeded.enemies[0];assert.ok(corpse);Object.assign(g.player,{x:800,depth:90});
 for(const depth of [-36,36]){Object.assign(corpse,{x:1155,depth,y:430,hp:0,deadAge:.2});g.enemies=[corpse];events.length=0;paintDepthRoute(ctx,images,g,1000,frame);const body=events.findLastIndex(e=>e.id==='challenge-mobs'),face=events.findLastIndex(e=>e.id==='challenge-street-props'&&isFront(e));assert.ok(body>=0);assert.equal(body>face,depth===36,'corpse keeps depth under its real rotation');}
 g.enemies=[];const helper=new Duel('han').player;g.assists=[{actor:helper,helper:'han',owner:g.player,phase:'attack',age:1,warning:.8,exitDuration:.28}];
 for(const depth of [-36,36]){Object.assign(helper,{x:1155,depth,y:430});events.length=0;paintDepthRoute(ctx,images,g,1000,frame);const body=events.findLastIndex(e=>e.id==='han-parts'),face=events.findLastIndex(e=>e.id==='challenge-street-props'&&isFront(e));assert.ok(body>=0);assert.equal(body>face,depth===36,'active helper obeys the same table ordering');}

});
test('main top bands retain standing, jumping, fallen and assisting actors in their foot lane',()=>{
 const g=clean(),t=g.platforms[0];g.platforms=[t];Object.assign(g.player,{x:1155,depth:-20,y:t.y,supportY:t.y});g.spawn();
 const rear=new Duel('han').player;Object.assign(rear,{id:'rear',x:1155,depth:-36,y:430,hp:0,deadAge:.2});g.enemies=[rear];
 const help=new Duel('huang').player;Object.assign(help,{x:1155,depth:-10,y:t.y-50,supportY:t.y});g.assists=[{actor:help,helper:'huang',owner:g.player,phase:'attack',age:1,warning:.8,exitDuration:.28}];
 const list=depthRenderItems(g),at=f=>list.findIndex(i=>i.value===f),tops=list.filter(i=>i.kind==='platform'&&i.part==='top');
 assert.ok(tops.length>=3);assert.ok(list.findIndex(i=>i.kind==='platform')>at(rear));
 assert.ok(tops.some(i=>i.to===-20)&&tops.some(i=>i.from===-20));assert.ok(tops.some(i=>i.to===-10)&&tops.some(i=>i.from===-10));assert.ok(at(g.player)<at(help));
 const old=list.map(i=>[i.kind,i.part,i.sortDepth??i.depth]);help.y-=120;assert.deepEqual(depthRenderItems(g).map(i=>[i.kind,i.part,i.sortDepth??i.depth]),old);
});
test('all main tables keep existing four-sided solidity, jump landing and walk-off for all seven fighters',()=>{
 for(const type of ['wang','han','ma','su','huang','chen','ko'])for(let section=0;section<3;section++)for(let ti=0;ti<2;ti++)for(const side of ['rear','front','left','right','jump']){
  const g=clean(section,type),p=g.player,t=g.platforms[ti];g.platforms=[t];const mid=(t.left+t.right)/2;
  Object.assign(p,{x:side==='left'?t.left-30:side==='right'?t.right+30:mid,depth:side==='rear'||side==='jump'?-60:side==='front'?60:0});
  if(side==='jump'){g.press('jump');step(g,{down:true},16);step(g,{},100);assert.equal(p.supportY,t.y);step(g,{down:true},60);assert.equal(p.y,430);continue;}
  step(g,{[side==='rear'?'down':side==='front'?'up':side==='left'?'right':'left']:true},90);
  assert.equal(side==='rear'||side==='front'?p.depth:p.x,side==='rear'?-36:side==='front'?36:side==='left'?t.left-TABLE_SIDE_CLEARANCE:t.right+TABLE_SIDE_CLEARANCE);
 }
});
test('horizontal duels retain their intentional front lane, one-way desk and downward drop',()=>{
 for(const type of ['wang','han','ma','su','huang','chen','ko']){
  const d=new Duel(type,'easy',()=>.5);d.enemy.x=880;Object.assign(d.player,{x:(DESK.left+DESK.right)/2,y:430,supportY:430});
  for(let n=0;n<10;n++)d.step(1/60,{right:true},false,{});assert.equal(d.player.y,430);assert.equal(d.player.depth,undefined,'no rear walking lane in a horizontal duel');
  d.press('jump');for(let n=0;n<100;n++)d.step(1/60,{},false,{});assert.equal(d.player.supportY,DESK.y);
  for(let n=0;n<60;n++)d.step(1/60,{crouch:true},false,{});assert.equal(d.player.y,430);assert.equal(d.player.supportY,430);
 }
 const trial=new StreetTrial();assert.deepEqual(trial.platforms,[],'standalone movement trial has no physical or visible tables');
});

test('every generated duel table centres its tabletop on the unchanged platform support line',async()=>{
 for(const module of ['../dist/challenge-art.mjs','../dist/preview/chapter2/challenge-art.mjs']){
  const {drawChallengeStreetProp}=await import(module);
  for(const height of [60,88,116])for(const scale of [.4,1,1.5]){
   const calls=[],image={},ctx={drawImage:(...a)=>calls.push(a),save(){},restore(){},beginPath(){},rect(){},clip(){}},bottom=430*scale,contact=(430-height)*scale;
   drawChallengeStreetProp(ctx,{'challenge-street-props':image},'table',{x:400*scale,y:bottom,width:280*scale,height:height*scale});
   const [front,top]=calls;
   assert.ok(top&&front,'horizontal desk has a separate centred surface and front');
   assert.ok(Math.abs(top[6]+top[8]*40/513-contact)<1e-8);assert.ok(Math.abs(front[6]+front[8]-bottom)<1e-8);
  }
 }
});
test('embedded chamber tabletop is centred at DESK.y while its original base and physics stay fixed',async()=>{
 const p=await import('../dist/combat-presentation.mjs'),{CHAMBER}=await import('../dist/stage-expansion.mjs');
 assert.equal(typeof p.chamberDeskLayers,'function');const layers=p.chamberDeskLayers(CHAMBER),surface=layers.find(l=>l.frame==='chamber-desk-top'),front=layers.find(l=>l.frame==='chamber-desk-front');
 assert.ok(Math.abs(surface.y-DESK.y)<1e-9);assert.ok(Math.abs(surface.y+surface.height/2-(front.y-front.height/2))<1e-9);
 assert.ok(Math.abs(front.y+front.height/2-(CHAMBER.y+(692-715)*CHAMBER.width/1672))<1e-9);
 assert.equal(DESK.y,430+(581-715)*1400/1672,'visual calibration must not move the physics plane');
});

