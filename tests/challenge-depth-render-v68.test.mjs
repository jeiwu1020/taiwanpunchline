import test from 'node:test';
import assert from 'node:assert/strict';
import * as render from '../dist/challenge-render.mjs';
import {GROUND} from '../dist/core.mjs';

const route=(player={})=>({depthMode:true,player:{x:1100,y:GROUND,depth:0,...player},worldWidth:3600,section:{supplyX:1250},supplyUsed:false,platforms:[],enemies:[],assists:[],projectiles:[],obstacles:[],rallies:[],gateX:3460});
const screen=(frame,p)=>({x:(p.x-frame.x)*frame.zoom+frame.width/2,y:(p.y-frame.y)*frame.zoom+frame.height/2});

test('depth route camera uses projected foot coordinates and keeps jump heads in frame',()=>{
 for(const [width,height,overlay] of [[390,592,false],[844,354,true],[640,324,false],[960,540,false]]){
  const stand=render.routeCameraFrame(width,height,route(),{overlay});
  const jumping=render.routeCameraFrame(width,height,route({y:GROUND-180,depth:-90}),{overlay});
  assert.equal(stand.mode,'depth-route');
  assert.equal(jumping.zoom,stand.zoom,'jumping must pan, not shrink actors');
  assert.ok(screen(jumping,{x:1100,y:GROUND-180-90*.65-300}).y>=27);
  assert.equal(jumping.width,width);assert.equal(jumping.height,height);
 }
});

test('projection retains foot-plane depth independently of jump height',()=>{
 assert.equal(typeof render.depthWorldPoint,'function');
 assert.deepEqual(render.depthWorldPoint({x:300,y:GROUND-120,depth:80}),{x:300,y:GROUND-120+80*.65});
 assert.deepEqual(render.depthWorldPoint({x:300,y:GROUND-120,depth:80},{foot:true}),{x:300,y:GROUND+80*.65});
 assert.deepEqual(render.depthWorldPoint({x:300,y:GROUND-120,depth:80,supportY:314},{foot:true}),{x:300,y:314+80*.65});
});

test('the camera and ground apply exactly the same horizontal translation',()=>{
 assert.equal(typeof render.depthBackdropLayout,'function');
 for(const px of [140,1100,2200,3400]){
  const frame=render.routeCameraFrame(844,354,route({x:px}),{overlay:true});
  const bg=render.depthBackdropLayout(frame);
  const actor=screen(frame,{x:1370,y:GROUND});
  const groundX=(1370-bg.camera)*frame.zoom;
  assert.ok(Math.abs(groundX-actor.x)<1e-9,'a world landmark stays aligned with its actor');
  assert.equal(bg.originX,bg.camera);
  assert.ok(bg.top<=frame.y-frame.height/frame.zoom/2);
  assert.ok(bg.bottom>=frame.y+frame.height/frame.zoom/2);
 }
});

test('depth ordering includes props, actors, helpers, projectiles and rally on their foot planes',()=>{
 assert.equal(typeof render.depthRenderItems,'function');
 const r=route({depth:40,y:GROUND-180});
 r.platforms=[{x:700,y:314,width:280,depth:0}];
 r.enemies=[{id:'back',depth:-70,y:GROUND,hp:10},{id:'front',depth:90,y:GROUND,hp:10},{id:'gone',depth:0,hp:0,deadAge:1}];
 r.assists=[{actor:{depth:-30,y:GROUND,hp:100},phase:'attack'}];
 r.projectiles=[{x:500,y:240,depth:60}];r.obstacles=[{x:500,y:GROUND,depth:20}];r.rallies=[{x:500,depth:-10}];
 const items=render.depthRenderItems(r);
 for(let i=1;i<items.length;i++)assert.ok((items[i-1].sortDepth??items[i-1].depth)<=(items[i].sortDepth??items[i].depth));
 assert.deepEqual(new Set(items.map(v=>v.kind)),new Set(['actor','platform','supply','gate','projectile','obstacle','rally']));
 assert.ok(items.findIndex(v=>v.value===r.player)>items.findIndex(v=>v.value===r.enemies[0]),'jumping does not change ordering');
 assert.ok(!items.some(v=>v.value.id==='gone'));
 assert.equal(items.find(v=>v.kind==='platform').depth,0);
 assert.equal(items.find(v=>v.kind==='supply').depth,0);
 assert.equal(items.find(v=>v.episode).value,r.assists[0].actor);
});

test('mob labels retain a 16px screen floor and contrast independently of world zoom',()=>{
 assert.equal(typeof render.depthMobLabelLayout,'function');
 for(const zoom of [.35,.5,.8,1,1.4]){
  const f={x:100,y:GROUND,depth:70,name:'廣播阿伯',hp:10,maxHp:20};
  const label=render.depthMobLabelLayout(f,{zoom});
  assert.ok(label.fontSize*zoom>=16-1e-9);
  assert.ok(label.strokeWidth*zoom>=2);
  assert.equal(label.text,f.name);assert.equal(label.x,100);
  assert.equal(label.y,GROUND+70*.65-305);
  assert.ok(label.plate);assert.equal(label.hp,0.5);
 }
});

test('ordinary route camera remains unchanged',()=>{
 const r=route();delete r.depthMode;
 const f=render.routeCameraFrame(960,540,r);
 const zoom=Math.min(1.4,960/650,528/410);
 assert.equal(f.mode,'route');assert.equal(f.zoom,zoom);
 assert.equal(f.y,450-(528-540/2)/zoom);
});

import {ChallengeRoute} from '../dist/challenge-engine.mjs';
import {Duel} from '../dist/core.mjs';
import {ART_FILES} from '../dist/art-render.mjs';
import {CHALLENGE_ART_FILES} from '../dist/challenge-art.mjs';
const artImages=Object.fromEntries([...Object.keys({...ART_FILES,...CHALLENGE_ART_FILES}),'supporter-woman','supporter-man','supporter-young','supporter-elder','supporter-grandma','item-paper','item-duck'].map(id=>[id,{id,width:1536,height:1024}]));
function canvasRecorder(){
 const events=[],stack=[];let matrix=[1,0,0,1,0,0];
 const state={globalAlpha:1,font:'16px system-ui',strokeStyle:'',fillStyle:'',lineWidth:1};
 const multiply=b=>{const[a,c,d,e,x,y]=matrix;matrix=[a*b[0]+d*b[1],c*b[0]+e*b[1],a*b[2]+d*b[3],c*b[2]+e*b[3],a*b[4]+d*b[5]+x,c*b[4]+e*b[5]+y];assert.ok(matrix.every(Number.isFinite),'finite canvas transform');};
 const capture=(kind,args)=>{assert.ok(args.filter(v=>typeof v==='number').every(Number.isFinite),'finite '+kind+' geometry');events.push({kind,args,matrix:[...matrix],...state});};
 const methods={createLinearGradient(){return {addColorStop(offset,color){assert.ok(offset>=0&&offset<=1);assert.equal(typeof color,'string');}};},save(){stack.push({matrix:[...matrix],state:{...state}});},restore(){const s=stack.pop();assert.ok(s,'balanced restore');matrix=s.matrix;Object.assign(state,s.state);},translate(x,y){multiply([1,0,0,1,x,y]);},scale(x,y){multiply([x,0,0,y,0,0]);},rotate(r){multiply([Math.cos(r),Math.sin(r),-Math.sin(r),Math.cos(r),0,0]);},drawImage(image,...args){assert.ok(image,'loaded image required');capture('image',[image.id,...args]);},fillText(...args){capture('text',args);},strokeText(...args){capture('strokeText',args);},ellipse(...args){capture('ellipse',args);},fillRect(...args){capture('fillRect',args);},measureText(text){return {width:[...text].length*parseFloat(state.font.match(/[\d.]+(?=px)/)?.[0]??16)};}};
 const ctx=new Proxy(state,{get:(o,k)=>methods[k]??o[k]??(()=>{}),set:(o,k,v)=>(o[k]=v,true)});
 ctx.canvas={ownerDocument:{createElement(){return {id:'mic-raster',getContext:()=>canvasRecorder().ctx};}}};
 return {ctx,events,stack};
}
function sourceAt(event,x,y){
 const [,sx,sy,sw,sh,dx,dy,dw,dh]=event.args,[a,b,c,d,tx,ty]=event.matrix,det=a*d-b*c,localX=(d*(x-tx)-c*(y-ty))/det,localY=(-b*(x-tx)+a*(y-ty))/det,u=(localX-dx)/dw,v=(localY-dy)/dh;
 return u>=0&&u<=1&&v>=0&&v<=1?{x:sx+sw*u,y:sy+sh*v}:null;
}

test('paint path uses original character/prop art and labels every live mob at screen legibility',()=>{
 const r=new ChallengeRoute('wang','easy',()=>.2);r.depthMode=true;r.player.x=1100;r.player.depth=40;r.player.y=GROUND-100;r.spawn();
 r.enemies.forEach((f,i)=>{f.depth=-60+i*55;});
 const helper=new Duel('han').player;helper.depth=80;helper.x=1050;
 r.assists=[{actor:helper,helper:'han',owner:r.player,phase:'attack',age:1,warning:.8,exitDuration:.28}];
 r.rallies=[{x:1000,age:1,direction:1,depth:-10}];r.obstacles=[{x:1300,y:GROUND,life:1,depth:0}];
 r.projectiles=['coin','dream','arrow','word','paper','rubber_duck'].map((kind,i)=>({kind,x:950+i*80,y:260,depth:i*10,vx:300,vy:0,age:.3,targetX:1350,lob:kind==='arrow'||kind==='word',life:1}));
 const frame=render.routeCameraFrame(844,354,r,{overlay:true}),{ctx,events,stack}=canvasRecorder(),poses=[];
 render.paintDepthRoute(ctx,artImages,r,400,frame,{fighterView:f=>({renderF:f,spit:0}),onPose:(f,p)=>poses.push([f,p])});
 assert.equal(stack.length,0);assert.equal(poses.length,2+r.enemies.length);
 for(const id of ['wang-parts','han-parts','challenge-mobs','challenge-street-props','signature-props','item-paper','item-duck','art-props','supporter-grandma'])assert.ok(events.some(e=>e.kind==='image'&&e.args[0]===id),id+' is visible');
 for(const f of r.enemies){const text=events.find(e=>e.kind==='text'&&e.args[0]===f.name);assert.ok(text);assert.ok(parseFloat(text.font.match(/[\d.]+(?=px)/)[0])*frame.zoom>=16-1e-9);}
 const shadow=events.find(e=>e.kind==='ellipse'&&e.args[0]===r.player.x&&e.args[2]<=44);
 assert.equal(shadow.args[1],GROUND+r.player.depth*.65+1,'jump shadow remains on foot plane');
});

test('painted pavement is invariant in world space across camera movement and jump pan',()=>{
 const r=route({x:1100});r.player.hp=0;r.player.deadAge=1;
 // No fighters needed: isolate the real generated backdrop mapping.
 r.player=null;
 const frames=[render.routeCameraFrame(844,354,route({x:1100})),render.routeCameraFrame(844,354,route({x:1150,y:GROUND-180,depth:-90}))];
 for(const layered of [false,true]){
  const images={...artImages};if(!layered){delete images['challenge-street-facade'];delete images['challenge-street-sky'];}
  const source=layered?'challenge-street-facade':'challenge-street-deep';
  const samples=frames.map(frame=>{const {ctx,events}=canvasRecorder();render.paintDepthRoute(ctx,images,r,0,frame);return events.filter(e=>e.kind==='image'&&e.args[0]===source).map(e=>sourceAt(e,1250,430)).find(Boolean);});
  assert.ok(samples.every(Boolean),source);assert.ok(Math.abs(samples[0].x-samples[1].x)<1e-9,source);assert.ok(Math.abs(samples[0].y-samples[1].y)<1e-9,source);
 }
});

test('a fighter standing on a table paints its support shadow on top of the generated table',()=>{
 const r=new ChallengeRoute('wang');r.depthMode=true;r.platforms=[{left:800,right:1080,y:314,depth:0}];r.player.x=950;r.player.y=314;r.player.supportY=314;r.player.depth=0;r.enemies=[];r.supplyUsed=true;
 const frame=render.routeCameraFrame(960,540,r),{ctx,events}=canvasRecorder();render.paintDepthRoute(ctx,artImages,r,0,frame);
 const table=events.findIndex(e=>e.kind==='image'&&e.args[0]==='challenge-street-props'&&e.args[1]===101);
 const shadow=events.findIndex(e=>e.kind==='ellipse'&&e.args[0]===950&&e.args[1]===315);
 assert.ok(table>=0&&shadow>table,'the tabletop must not paint over its actor shadow');
});

const boxesOverlap=(a,b)=>a.left<b.right&&a.right>b.left&&a.top<b.bottom&&a.bottom>b.top;
test('clustered mob names and health bars stagger without overlap and stay inside the viewport',()=>{
 assert.equal(typeof render.depthMobLabelLayouts,'function');
 for(const [width,height,zoom] of [[390,330,.55],[844,280,.56]]){
  const frame={x:800,y:270,width,height,zoom};
  const mobs=['宣傳尖兵','文宣投手','護欄壯漢','廣播阿伯'].map((name,i)=>({id:'mob-'+i,name,x:790+i*12,y:GROUND,depth:i%2?8:0,hp:30,maxHp:60}));
  const labels=render.depthMobLabelLayouts(mobs,frame);
  assert.equal(labels.length,mobs.length);
  for(const l of labels){
   const tl=screen(frame,{x:l.box.left,y:l.box.top}),br=screen(frame,{x:l.box.right,y:l.box.bottom});
   assert.ok(tl.x>=5&&tl.y>=5);assert.ok(br.x<=width-5&&br.y<=height-5);
   assert.ok(Math.abs(l.x-l.actor.x)*zoom<=1,'a centred group keeps labels horizontally anchored to its heads');
   assert.ok(l.fontSize*zoom>=16-1e-9);
  }
  for(let i=0;i<labels.length;i++)for(let j=i+1;j<labels.length;j++)assert.ok(!boxesOverlap(labels[i].box,labels[j].box),'name and health blocks cannot overlap');
 }
});

test('label stagger is stable across mob array order and tiny movement with shared slot memory',()=>{
 assert.equal(typeof render.depthMobLabelLayouts,'function');
 const frame={x:800,y:270,width:390,height:330,zoom:.55},slots=new Map();
 const mobs=[0,1,2].map(i=>({id:'mob-'+i,name:'宣傳尖兵',x:790+i*15,y:GROUND,depth:0,hp:30,maxHp:60}));
 const first=render.depthMobLabelLayouts(mobs,frame,{slots}),offsets=new Map(first.map(l=>[l.actor.id,l.row]));
 mobs.forEach(f=>f.x+=.5);
 const second=render.depthMobLabelLayouts([...mobs].reverse(),frame,{slots});
 for(const l of second)assert.equal(l.row,offsets.get(l.actor.id));
});

test('labels near viewport corners are clamped as a complete name and health block',()=>{
 assert.equal(typeof render.depthMobLabelLayouts,'function');
 const frame={x:500,y:270,width:390,height:330,zoom:.55},left=frame.x-frame.width/(2*frame.zoom),right=frame.x+frame.width/(2*frame.zoom);
 const mobs=[{id:'left',name:'文宣投手',x:left+3,y:GROUND-160,depth:-90,hp:30,maxHp:60},{id:'right',name:'護欄壯漢',x:right-3,y:GROUND,depth:100,hp:30,maxHp:60}];
 const labels=render.depthMobLabelLayouts(mobs,frame);
 for(const l of labels){const a=screen(frame,{x:l.box.left,y:l.box.top}),b=screen(frame,{x:l.box.right,y:l.box.bottom});assert.ok(a.x>=5&&a.y>=5);assert.ok(b.x<=385&&b.y<=325);}
});
