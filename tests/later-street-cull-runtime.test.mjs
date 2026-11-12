import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {streetActorNeedsPaint} from '../dist/street-actor-visibility.mjs';
// Execute each production draw function with its real depth-order rules and
// recording browser/art boundaries. No DOM, texture decoding or iPhone claim.
for(const n of [2,3,4])test(`chapter ${n} runtime cull preserves rear-table layers, projectiles, helpers and VS`,async()=>{
 const prefix=n===4?'chapter4':'chapter2',folder=`../dist/preview/chapter${n}/`;
 const source=readFileSync(new URL(folder+prefix+'-playable.mjs',import.meta.url),'utf8');
 const drawSource=source.slice(source.indexOf('function draw(time,'),source.indexOf('function hudText('));
 const rules=await import(new URL(folder+prefix+'-render-rules.mjs',import.meta.url));
 const events=[],player={id:'player',x:250,y:430,depth:0,hp:100},rear={id:'rear',mobKind:'runner',x:450,y:430,depth:-62,hp:20},far={id:'far',mobKind:'runner',x:5000,y:430,depth:0,hp:20};
 const g={depthMode:true,worldWidth:6000,player,enemies:[rear,far],enemy:far,platforms:[{left:400,right:650,y:342,depth:-32,depthHalf:30}],section:{},supplyUsed:true,gateX:5900,assists:[{actor:{id:'helper',x:5000,y:430,depth:0,mobKind:'runner'},phase:'attack'}],projectiles:[{kind:'paper',x:300,y:300,depth:0,owner:far}],obstacles:[],rallies:[],status:'active'};
 const state={mode:'route'},ctx=new Proxy({measureText:()=>({width:20}),fillRect(...args){events.push({kind:'rect',args});},drawImage(...args){events.push({kind:'table',args});}}, {get:(o,k)=>o[k]??(()=>{})});
 const env={usesHighFlyingMic:()=>false,canvas:{clientWidth:844,clientHeight:390},ctx,chapter:{world:g},v:()=>state,document:{body:{dataset:{}}},ui:{viewport:{width:844,height:390},cameraOptions:{},clearCameraHints(){},renderCameraHints(){}},flyingMic:{reset(){},paint(){}},micReport:null,GROUND:430,DESK:{left:400,right:650,y:342},streetTrialFrame:()=>({left:0,base:430,zoom:1}),mobileCamera:{frame:()=>({left:0,base:430,zoom:1})},routeIndex:()=>0,paintBackdrop(){},images:{'challenge-street-props':{}},streetActorNeedsPaint,actor(a){events.push({kind:'actor',id:a.id});},label(){},drawChallengeSupply(){},drawChallengeStreetProp(ctx,images,kind){events.push({kind});},drawProp(){},containSprite:()=>({width:10,height:10}),caption:'',performance:{now:()=>0}};
 env[n===4?'CHAPTER4_NEW_ART':'CHAPTER2_NEW_ART']={curbs:[700]};
 env[prefix+'SceneLayers']=rules[prefix+'SceneLayers'];env[prefix+'TableFrame']=rules[prefix+'TableFrame'];env[prefix+'ObstacleFrame']=rules[prefix+'ObstacleFrame'];env['draw'+(n===4?'Chapter4':'Chapter2')+'TableLayer']=(ctx,images,item,f)=>{events.push({kind:item.kind});return rules['draw'+(n===4?'Chapter4':'Chapter2')+'TableLayer'](ctx,images,item,f);};
 const draw=vm.runInNewContext('('+drawSource+')',env);draw(100);
 assert.deepEqual(events.filter(e=>e.kind==='actor').map(e=>e.id).sort(),['helper','player','rear']);
 const rearAt=events.findIndex(e=>e.id==='rear');assert.ok(events.findIndex(e=>e.kind==='table-top')>rearAt);assert.ok(events.findIndex(e=>e.kind==='table-front')>rearAt);
 assert.ok(events.some(e=>e.kind==='rect'&&e.args[2]===32&&e.args[3]===22),'projectile from a culled owner still paints');
 assert.equal(g.enemies.length,2);assert.equal(g.enemies[1],far);assert.equal(far.hp,20,'render-only cull does not mutate the actor');
 g.depthMode=false;state.mode='battle';events.length=0;draw(116);
 assert.ok(events.some(e=>e.kind==='actor'&&e.id==='far'),'VS mob boss bypasses street culling');
});
