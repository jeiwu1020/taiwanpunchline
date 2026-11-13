import test from 'node:test';
import assert from 'node:assert/strict';
import {ChallengeDepthRoute,TABLE_SIDE_CLEARANCE} from '../dist/challenge-depth-engine.mjs';
import * as art from '../dist/challenge-art.mjs';
const scene=()=>{const g=new ChallengeDepthRoute('wang','easy',()=>.5);g.section={...g.section,spawns:[]};g.enemies=[];return g;};
const advance=(g,input,n=90)=>{for(let i=0;i<n;i++)g.step(1/60,input);};
test('table blocks ground walking from both depth directions',()=>{
 for(const sign of [-1,1]){const g=scene(),t=g.platforms[0],p=g.player;p.x=(t.left+t.right)/2;p.depth=sign*70;advance(g,sign<0?{down:true}:{up:true});assert.ok(sign*p.depth>=36);assert.equal(p.y,430);}
});
test('table blocks side and diagonal entry but leaves outside lane open',()=>{
 for(const depth of [0,85]){const g=scene(),t=g.platforms[0],p=g.player;p.x=t.left-40;p.depth=depth;advance(g,{right:true},90);assert.equal(p.x>t.right,depth===85);}
 const g=scene(),t=g.platforms[0],p=g.player;p.x=t.left-10;p.depth=-40;advance(g,{right:true,down:true},15);assert.ok(p.x<=t.left||p.depth<=-36);
});
test('swept table motion cannot tunnel at large displacement and permits height clearance',()=>{
 const g=scene(),t=g.platforms[0],p=g.player;p.depth=0;p.x=t.right+200;
 assert.equal(typeof g.resolveTableMotion,'function');
 g.resolveTableMotion(p,{x:t.left-200,depth:0});assert.equal(p.x,t.left-TABLE_SIDE_CLEARANCE);
 p.x=t.right+200;p.y=t.y;g.resolveTableMotion(p,{x:t.left-200,depth:0});assert.equal(p.x,t.right+200);
});
test('table top remains landable and supports walking off its depth edge',()=>{
 const g=scene(),t=g.platforms[0],p=g.player;p.x=(t.left+t.right)/2;p.depth=0;p.y=t.y-40;p.vy=100;advance(g,{},30);assert.equal(p.supportY,t.y);advance(g,{down:true},60);assert.ok(p.depth>36);assert.equal(p.y,430);
});
test('adjacent higher table blocks feet below its top without trapping walk-off',()=>{
 const g=scene(),p=g.player;g.platforms=[{left:500,right:650,y:370,depth:0,depthHalf:36},{left:650,right:900,y:325,depth:0,depthHalf:36}];Object.assign(p,{x:620,y:370,supportY:370,depth:0});advance(g,{right:true},30);assert.equal(p.x,650-TABLE_SIDE_CLEARANCE);advance(g,{up:true},60);assert.ok(p.depth<-36);
});
test('enemy depth approach also respects the solid table',()=>{
 const g=new ChallengeDepthRoute('wang','easy',()=>.5);g.spawn();const e=g.enemies[0],t=g.platforms[0];g.section={...g.section,spawns:[]};g.enemies=[e];Object.assign(e,{x:(t.left+t.right)/2,depth:-70,aiWait:.1,spec:{...e.spec,speed:0}});Object.assign(g.player,{x:e.x,depth:90});advance(g,{},90);assert.ok(e.depth<=-36);
});
test('depth table exposes a full projected landing surface rather than a compressed sliver',()=>{
 const calls=[],ctx={drawImage:(...a)=>calls.push(a),save(){},restore(){},beginPath(){},rect(){},clip(){}};const img={};
 art.drawChallengeStreetProp(ctx,{'challenge-street-props':img},'table',{x:1155,y:430,width:230,height:88,depthHalf:36,depthScale:.65});
 assert.equal(calls.length,2,'separate front/legs and tabletop');const top=calls.at(-1);assert.equal(top[6],342-23.4);assert.ok(Math.abs(top[8]*80/513-46.8)<1e-9);assert.equal(top[7],230);
});
test('generated supply cutout is registered and bottom-centred without changing pickup',()=>{
 assert.equal(art.CHALLENGE_ART_FILES['challenge-supply'],'challenge/supply-stand-v75.webp');
 assert.equal(typeof art.drawChallengeSupply,'function');const calls=[],img={width:1254,height:1254};
 art.drawChallengeSupply({drawImage:(...a)=>calls.push(a)},{'challenge-supply':img},{x:100,y:430});assert.equal(calls.length,1);assert.equal(calls[0][1],55);assert.equal(calls[0][2],340);assert.equal(calls[0][3],90);assert.equal(calls[0][4],90);
 const g=scene();g.player.x=g.section.supplyX;g.player.hp=40;advance(g,{},3);assert.equal(g.player.hp,58);assert.equal(g.supplyUsed,true);
});
test('a ground-level jump crosses the solid edge and lands on the table',()=>{
 for(const sign of [-1,1]){const g=scene(),p=g.player,t=g.platforms[0];Object.assign(p,{x:(t.left+t.right)/2,depth:70*sign});assert.equal(g.press('jump'),true);advance(g,sign<0?{down:true}:{up:true},24);advance(g,{},75);assert.ok(Math.abs(p.depth)<36);assert.equal(p.supportY,t.y);assert.equal(p.y,t.y);}
});
test('both side edges and enemy horizontal approach are solid',()=>{
 const g=scene(),p=g.player,t=g.platforms[0];p.x=t.right+40;p.depth=0;advance(g,{left:true},60);assert.equal(p.x,t.right+TABLE_SIDE_CLEARANCE);
 const h=new ChallengeDepthRoute('wang','easy',()=>.5);h.spawn();const e=h.enemies[0],table=h.platforms[0];h.enemies=[e];h.section={...h.section,spawns:[]};Object.assign(e,{x:table.left-20,depth:0,aiWait:999});Object.assign(h.player,{x:table.right+100,depth:0});advance(h,{},90);assert.equal(e.x,table.left-TABLE_SIDE_CLEARANCE);
});
test('rear-half table occupants render after their entire landing surface',async()=>{
 const {depthRenderItems}=await import('../dist/challenge-depth-render.mjs');const g=scene(),t=g.platforms[0];Object.assign(g.player,{x:(t.left+t.right)/2,depth:-25,y:t.y,supportY:t.y});const list=depthRenderItems(g);assert.ok(list.findIndex(i=>i.kind==='platform'&&i.value===t)<list.findIndex(i=>i.value===g.player));
});
test('knockback cannot push a stunned enemy through either table side',()=>{
 for(const sign of [-1,1]){const g=new ChallengeDepthRoute('wang','easy',()=>.5);g.spawn();const e=g.enemies[0],t=g.platforms[0];g.enemies=[e];g.section={...g.section,spawns:[]};Object.assign(e,{x:sign<0?t.left-5:t.right+5,depth:0,y:430,supportY:430});Object.assign(g.player,{x:e.x+sign*70,depth:0,face:-sign});g.hit(g.player,e,1,25,{noDefense:true});assert.ok(sign<0?e.x<=t.left:e.x>=t.right,'forced displacement is clipped immediately');g.step(1/60);g.step(.1);assert.ok(sign<0?e.x<=t.left:e.x>=t.right,'stun must not bypass solidity');}
});
test('restored below-top penetration exits to nearest boundary without moving tabletop occupants',()=>{
 const g=scene(),p=g.player,t=g.platforms[0];Object.assign(p,{x:t.left+5,depth:0,y:430,supportY:430});g.step(1/60);assert.equal(p.x,t.left-TABLE_SIDE_CLEARANCE);assert.equal(p.y,430);
 Object.assign(p,{x:(t.left+t.right)/2,depth:30,y:430,supportY:430});g.step(1/60);assert.equal(p.depth,36);
 Object.assign(p,{x:(t.left+t.right)/2,depth:0,y:t.y,supportY:t.y});g.step(1/60);assert.equal(p.x,(t.left+t.right)/2);assert.equal(p.depth,0);assert.equal(p.y,t.y);
});
test('large forced displacement is swept for the player and restored stunned enemies recover',()=>{
 const g=new ChallengeDepthRoute('wang','easy',()=>.5);g.spawn();const e=g.enemies[0],t=g.platforms[0];g.enemies=[e];g.section={...g.section,spawns:[]};Object.assign(g.player,{x:t.left-5,depth:0,y:430,supportY:430});Object.assign(e,{x:t.left-75,depth:0});g.hit(e,g.player,1,600,{noDefense:true});assert.equal(g.player.x,t.left-TABLE_SIDE_CLEARANCE);
 Object.assign(e,{x:t.right-3,depth:0,y:430,supportY:430,stun:1});g.step(1/60);assert.equal(e.x,t.right+TABLE_SIDE_CLEARANCE);assert.equal(e.y,430);
});

