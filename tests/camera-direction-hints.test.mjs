import test from 'node:test';
import assert from 'node:assert/strict';
import {JSDOM} from 'jsdom';
import {readFileSync} from 'node:fs';
import {fitChallengeCamera} from '../dist/challenge-camera.mjs';
let api={};try{api=await import('../dist/camera-direction-hints.mjs');}catch(e){if(e.code!=='ERR_MODULE_NOT_FOUND')throw e;}
const actor=(x,y=300,extra={})=>({x,y,hp:100,depth:0,vy:0,...extra});
const frame={width:844,height:390,x:422,y:195,zoom:1,playerFixedCamera:{version:1,anchor:{x:422,y:330},pose:{x:422,displayY:330},zoom:1}};
const geometry={width:844,height:390,origin:{left:0,top:0},safeRect:{left:0,top:0,right:844,bottom:390},occlusions:[]};
const world=enemy=>({player:actor(422,330),enemy,assists:[]});
const hints=(enemy,options={})=>{assert.equal(typeof api.offscreenOpponentHints,'function');return api.offscreenOpponentHints(frame,world(enemy),{geometry,...options});};
const overlaps=(a,b)=>a.left<b.right&&a.left+a.width>b.left&&a.top<b.bottom&&a.top+a.height>b.top;
for(const [x,y,arrow]of [[0,300,'←'],[844,300,'→'],[422,280,'↑'],[422,380,'↓'],[0,280,'↖'],[844,280,'↗'],[0,380,'↙'],[844,380,'↘']])test(`clipped proxy at ${x},${y} uses ${arrow}`,()=>{
 const result=hints(actor(x,y));assert.equal(result.length,1);assert.equal(result[0].arrow,arrow);assert.equal(result[0].label,'對手');assert.equal(result[0].count,1);
});
test('fully visible, dead and legacy-profile enemies produce no hint',()=>{
 for(const enemy of [actor(550),actor(844,300,{hp:0}),actor(844,300,{hp:-2}),null])assert.deepEqual(hints(enemy),[]);
 assert.deepEqual(api.offscreenOpponentHints({...frame,playerFixedCamera:undefined},world(actor(844)),{geometry}),[]);
});
// A current proxy at (550,310) is [420,10,680,338], even with vy=-300.
// Prediction would incorrectly move its top to -26; falling has the same risk below.
for(const route of [false,true])test(`${route?'street':'VS/Boss'} moving opponents clear on current bounds, not predicted motion`,()=>{
 const enemy=actor(550,280,{vy:-300}),w={...world(enemy),enemies:[enemy]},read=()=>api.offscreenOpponentHints(frame,w,{route,geometry});
 assert.deepEqual(read().map(h=>h.arrow),['↑'],'a currently clipped rising proxy still receives an arrow');
 enemy.y=310;assert.deepEqual(read(),[],'a fully visible rising proxy immediately clears');
 Object.assign(enemy,{y:380,vy:300});assert.deepEqual(read().map(h=>h.arrow),['↓'],'a currently clipped falling proxy still receives an arrow');
 enemy.y=350;assert.deepEqual(read(),[],'a fully visible falling proxy immediately clears');
});
test('the reusable badge clears as a moving opponent returns completely to view',()=>{
 const dom=new JSDOM('<main></main>'),d=dom.window.document,root=d.querySelector('main'),owner=api.mountCameraDirectionHints({document:d,root}),enemy=actor(550,280,{vy:-300}),w=world(enemy);
 try{owner.setGeometry(geometry);const nodes=[...root.querySelectorAll('.camera-direction-hint')];
  for(const [clipped,visible,vy,arrow]of [[280,310,-300,'↑'],[380,350,300,'↓']]){
   Object.assign(enemy,{y:clipped,vy});owner.update(frame,w);assert.equal(nodes.filter(n=>!n.hidden).length,1);assert.equal(nodes.find(n=>!n.hidden).textContent,arrow+' 對手');
   enemy.y=visible;owner.update(frame,w);assert.ok(nodes.every(n=>n.hidden),'motion alone cannot retain a badge after returning to view');
  }
  assert.deepEqual([...root.querySelectorAll('.camera-direction-hint')],nodes);
 }finally{owner.destroy();dom.window.close();}
});
test('street hints intersect spawned living hostiles with local camera subjects, excluding assists and forecasts',()=>{
 assert.equal(typeof api.offscreenOpponentHints,'function');
 const enemy=actor(844),helper=actor(0),w={...world(enemy),enemies:[enemy,actor(840,300,{hp:0}),actor(1800),actor(1600,300,{spec:{range:20}})],assists:[{actor:helper,phase:'attack'}],section:{spawns:[['mob',0,420]]},spawned:new Set()};
 const result=api.offscreenOpponentHints(frame,w,{route:true,geometry});assert.equal(result.length,1);assert.equal(result[0].label,'敵人');assert.equal(result[0].arrow,'→');assert.equal(result[0].count,1);
 w.enemies=[];w.enemy=null;assert.deepEqual(api.offscreenOpponentHints(frame,w,{route:true,geometry}),[]);
});
test('groups both sides, chooses the nearest clipped hostile per side and clears when they return',()=>{
 assert.equal(typeof api.offscreenOpponentHints,'function');
 const w={...world(null),enemies:[actor(0,280),actor(50,300),actor(840,380),actor(850,300)],assists:[]};
 const result=api.offscreenOpponentHints(frame,w,{route:true,geometry});assert.equal(result.length,2);assert.deepEqual(result.map(h=>[h.key,h.arrow,h.count]),[['left','←',2],['right','↘',2]]);
 assert.equal(api.offscreenOpponentHints(frame,w,{route:true,geometry,maxHints:1}).length,1);assert.deepEqual(api.offscreenOpponentHints(frame,w,{route:true,geometry,maxHints:0}),[]);
 w.enemies.forEach(e=>Object.assign(e,{x:550,y:300}));assert.deepEqual(api.offscreenOpponentHints(frame,w,{route:true,geometry}),[]);
});
test('normal measured geometry keeps full badges outside player, HUD, full controls and each other',()=>{
 assert.equal(typeof api.offscreenOpponentHints,'function');
 const occlusions=[{left:8,top:4,right:836,bottom:36},{left:8,top:40,right:836,bottom:88},{left:8,top:272,right:120,bottom:384,kind:'control'},{left:542,top:270,right:836,bottom:384,kind:'control'}],g={...geometry,occlusions};
 const result=api.offscreenOpponentHints(frame,{...world(null),enemies:[actor(0),actor(844)]},{route:true,geometry:g});assert.equal(result.length,2,'normal measured geometry must not silently lose direction feedback');
 const player={left:290,top:30,right:554,bottom:358};
 for(const h of result){assert.equal(h.width,88);assert.equal(h.height,24);assert.ok(h.left>=0&&h.top>=0&&h.left+h.width<=844&&h.top+h.height<=390);for(const r of [...occlusions,player])assert.equal(overlaps(h,r),false);}
 assert.equal(overlaps(result[0],{...result[1],right:result[1].left+88,bottom:result[1].top+24}),false);
});
test('a narrow safe slot uses a 24px arrow and fully blocked geometry hides instead of covering player',()=>{
 const g={...geometry,occlusions:[{left:30,top:0,right:844,bottom:390}]};
 const result=hints(actor(0),{geometry:g});assert.equal(result.length,1);assert.equal(result[0].width,24);assert.equal(result[0].height,24);assert.equal(result[0].label,'');assert.ok(result[0].left+24<=30);
 assert.deepEqual(hints(actor(0),{geometry:{...geometry,occlusions:[{left:0,top:0,right:844,bottom:390}]}}),[]);
});
test('player blocker uses saved pose projected through actual frame, not target or live player',()=>{
 for(const px of [40,804]){
  const z=.5,py=180,f={...frame,zoom:z,x:422+(422-px)/z,y:330+(195-py)/z,playerFixedCamera:{...frame.playerFixedCamera,anchor:{x:422,y:330},pose:{x:422,displayY:330}}},w=world(actor(px<422?-1000:2000));w.player.x=8000;w.player.y=-4000;
  const result=api.offscreenOpponentHints(f,w,{geometry});assert.equal(result.length,1);assert.equal(overlaps(result[0],{left:px-132*z,top:py-300*z,right:px+132*z,bottom:py+28*z}),false,'actual displayed saved pose must block hints even when anchor and live pose disagree');
 }
});
test('reusable DOM pool is passive, origin-aware, write-idempotent and reads no layout during update',()=>{
 assert.equal(typeof api.mountCameraDirectionHints,'function');const dom=new JSDOM('<main></main>'),d=dom.window.document,root=d.querySelector('main');
 const owner=api.mountCameraDirectionHints({document:d,root});owner.setGeometry({...geometry,origin:{left:17,top:23}});
 const nodes=[...root.querySelectorAll('.camera-direction-hint')];assert.equal(nodes.length,2);assert.equal(root.querySelectorAll('canvas,button,input,[tabindex],[aria-live]').length,0);
 for(const el of root.querySelectorAll('*')){assert.equal(el.style.pointerEvents,'none');assert.equal(el.getAttribute('aria-hidden'),'true');el.getBoundingClientRect=()=>{throw Error('per-frame layout read');};}
 const observer=new dom.window.MutationObserver(()=>{});observer.observe(root,{subtree:true,attributes:true,childList:true,characterData:true});const w=world(actor(844));owner.update(frame,w);
 const h=hints(w.enemy)[0],badge=nodes.find(n=>!n.hidden);assert.ok(badge);assert.equal(badge.style.left,h.left+17+'px');assert.equal(badge.style.top,h.top+23+'px');assert.equal(badge.textContent,'→ 對手');assert.equal(badge.style.boxSizing,'border-box');assert.equal(badge.style.borderWidth,'2px');assert.equal(badge.style.filter,'');assert.equal(badge.style.boxShadow,'');
 observer.takeRecords();for(let i=0;i<20;i++)owner.update(frame,w);assert.equal(observer.takeRecords().length,0);assert.deepEqual([...root.querySelectorAll('.camera-direction-hint')],nodes);
 w.enemy.x=550;owner.update(frame,w);assert.ok(nodes.every(n=>n.hidden));owner.update(frame,world(actor(844)),{active:false});assert.ok(nodes.every(n=>n.hidden));owner.update(frame,world(actor(844)));owner.clear();assert.ok(nodes.every(n=>n.hidden));observer.takeRecords();owner.clear();assert.equal(observer.takeRecords().length,0);
 owner.destroy();assert.equal(root.children.length,0);owner.update(frame,w);assert.equal(root.children.length,0);observer.disconnect();dom.window.close();
});
test('an empty spawned street collection cannot resurrect a stale enemy alias',()=>{
 assert.equal(typeof api.offscreenOpponentHints,'function');assert.deepEqual(api.offscreenOpponentHints(frame,{...world(actor(844)),enemies:[]},{route:true,geometry}),[]);
});

const recorded=JSON.parse(readFileSync(new URL('./fixtures/shared-camera-measured-nov11.json',import.meta.url))).profiles;
const smallRecorded=JSON.parse(readFileSync(new URL('./fixtures/mobile-landscape-low-pose-geometry.json',import.meta.url))).profiles;
for(const scene of ['vs','street'])for(const orientation of ['native','rotated','native568'])test(`recorded ${orientation} ${scene} geometry has safe opponent feedback`,()=>{
 const width=orientation==='native568'?568:844,height=orientation==='native568'?320:390,g=orientation==='native568'?smallRecorded[orientation+'-'+scene]:recorded[orientation+'-'+scene].cameraSafety,player=actor(450,430),left=actor(250,-100),right=actor(650,-100),w={player,enemy:right,enemies:[left,right]},route=scene==='street';
 const f=fitChallengeCamera({width,height,x:450,y:300,zoom:.3},[player,right],null,16,{...g,touch:true,cameraMode:'stable'});assert.ok(f.playerFixedCamera);
 const result=api.offscreenOpponentHints(f,w,{route,geometry:{width,height,...g}});assert.equal(result.length,route?2:1,'recorded normal geometry cannot silently drop a clipped opponent');
 const {anchor:a}=f.playerFixedCamera,playerRect={left:a.x-132*f.zoom,right:a.x+132*f.zoom,top:a.y-300*f.zoom,bottom:a.y+28*f.zoom};
 for(const h of result){assert.ok(h.left>=g.safeRect.left&&h.top>=g.safeRect.top&&h.left+h.width<=g.safeRect.right&&h.top+h.height<=g.safeRect.bottom);for(const r of [playerRect,...g.occlusions])assert.equal(overlaps(h,r),false);}
 if(result.length===2)assert.equal(overlaps(result[0],{...result[1],right:result[1].left+result[1].width,bottom:result[1].top+result[1].height}),false);
});
