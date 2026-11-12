// Explicit neutral stats isolate historical move/timing rules; real defaults have separate mode coverage.
import test from 'node:test';
import assert from 'node:assert/strict';
import {Duel,CAST,GROUND} from './helpers/neutral-combat.mjs';
import {heldItemAnchor,chooseCarryHand} from '../dist/item-presentation.mjs';
import {DESK} from '../dist/stage-expansion.mjs';
import {itemFighterPose,itemBodyShapes,itemProjectileTouches,PAPER_FLIGHT,segmentDistanceSq} from '../dist/item-collision.mjs';
import {fighterArtPose,drawFighterArt} from '../dist/art-render.mjs';
import {STAGE_ITEMS,ITEM_THROW} from '../dist/stage-rules.mjs';
import {readFileSync} from 'node:fs';

// The production scene samples the throw pose, not the core's old x+52/y-95 fallback.
const shownPose=itemFighterPose;
function fixture(kind='rubber_duck',{gap=120,role='player',face=1,type='wang',fps=60,defense='',sourceY=GROUND,targetY=GROUND}={}){
 const d=new Duel(type,'normal',()=>.5,type),f=d[role],o=d.other(f);
 f.x=face>0?220:740;o.x=f.x+face*gap;f.face=face;o.face=-face;
 f.y=f.supportY=sourceY;o.y=o.supportY=targetY;
 f.item={id:'contact-test',kind,carryHand:chooseCarryHand(shownPose(f))};
 d.itemPose=who=>shownPose(who,d.elapsed*1000);
 d.itemOrigin=(who,a)=>heldItemAnchor({...who,item:{kind:a.itemKind}},d.itemPose(who),a.carryHand);
 const input=defense==='guard'?{guard:true}:defense==='crouch'?{crouch:true}:{};
 if(defense==='crouch'){o.crouch=true;o.crouchBlend=1;o.lowProfile=true;}
 const frames=seconds=>{for(let i=0;i<Math.ceil(seconds*fps);i++){const dt=1/fps,n=Math.ceil(dt/(1/60));for(let j=0;j<n;j++)d.step(dt/n,role==='player'?{}:input,false,role==='player'?input:{});}};
 const throwItem=()=>assert.equal(d.request(f,'punch'),true);
 const hits=()=>d.events.filter(e=>['hit','block'].includes(e.type)&&e.from===f&&e.impact==='item_'+kind);
 return {d,f,o,frames,throwItem,hits};
}

for(const role of ['player','enemy'])for(const face of [-1,1])test(`released duck hits a nearby visible body while falling, ${role}/${face}`,()=>{
 const {o,frames,throwItem,hits}=fixture('rubber_duck',{role,face,gap:120});
 throwItem();frames(.35);assert.equal(o.hp,90);assert.equal(hits().length,1);frames(2);assert.equal(hits().length,1);
});

test('a paper physically overlapping a crouched body is not discarded by lowProfile',()=>{
 const d=new Duel(),f=d.enemy;f.crouch=true;f.crouchBlend=1;f.lowProfile=true;
 const p={kind:'paper',itemId:'probe',height:'high',x:f.x,y:f.y-125,radius:18,phase:'outbound'};
 assert.equal(d.projectileTouches(p,f,f.x-5,p.y),true);
});

test('paper visibly rises from its real hand release, then misses a genuinely lower croucher',()=>{
 const {d,f,o,frames,throwItem,hits}=fixture('paper',{gap:300,defense:'crouch'});
 throwItem();frames(.14);const p=d.projectiles[0];assert.ok(p);const startY=p.y;
 assert.ok(startY>f.y-220,'paper starts near the throwing wrist');
 frames(.22);assert.ok(p.y<startY-60,'the displayed projectile itself rises');
 frames(1.2);assert.equal(o.hp,100);assert.equal(hits().length,0);
});

test('falling duck physically touching an airborne torso can hit without a grounded exception',()=>{
 const d=new Duel(),f=d.enemy;f.y=300;f.supportY=GROUND;f.vy=-100;
 const p={kind:'rubber_duck',itemId:'probe',height:'low',x:f.x,y:f.y-110,radius:18,phase:'falling'};
 assert.equal(d.projectileTouches(p,f,f.x-10,p.y-10),true);
});

test('an extended wrist is vulnerable but a distant prop-free gap is not',()=>{
 const d=new Duel('ma'),f=d.enemy;f.type='ma';f.attack={kind:'ma_gaze',age:.3};
 const pose=shownPose(f),w=pose.arm.wrist;d.itemPose=()=>pose;
 const p={kind:'paper',itemId:'probe',height:'high',x:f.x+f.face*(w.x+pose.bodyX),y:f.y+w.y+pose.bodyY,radius:18,phase:'outbound'};
 assert.equal(d.projectileTouches(p,f,p.x,p.y),true,'the raised wrist is part of the body');
 p.x=f.x-f.face*150;p.y=f.y-70;assert.equal(d.projectileTouches(p,f,p.x,p.y),false);
});

for(const type of Object.keys(CAST))for(const role of ['player','enemy'])for(const face of [-1,1])for(const fps of [30,60,120])test(`real current hand path is consistent: ${type}/${role}/${face}/${fps}fps`,()=>{
 for(const kind of ['paper','rubber_duck'])for(const gap of [88,120,300]){
  const {o,frames,throwItem,hits}=fixture(kind,{type,role,face,fps,gap});throwItem();frames(1.65);
  assert.equal(o.hp,100-STAGE_ITEMS[kind].damage,`${kind} at ${gap}`);assert.equal(hits().length,1);frames(.5);assert.equal(hits().length,1);
 }
 for(const kind of ['paper','rubber_duck']){
  const {o,frames,throwItem,hits}=fixture(kind,{type,role,face,fps,gap:120,defense:'guard'});throwItem();frames(1);
  assert.equal(o.hp,98);assert.equal(hits()[0].type,'block');assert.equal(hits().length,1);
 }
 const crouch=fixture('paper',{type,role,face,fps,gap:300,defense:'crouch'});crouch.throwItem();crouch.frames(1.5);assert.equal(crouch.o.hp,100);
 const close=fixture('paper',{type,role,face,fps,gap:88,defense:'crouch'});close.throwItem();close.frames(1.5);assert.equal(close.o.hp,92,'a visible close rising-paper contact is not immune');
});

test('only contact size and trajectory change; damage, speeds, life and throw timing are retained',()=>{
 for(const [kind,damage,speed,life,knock]of [['paper',8,460,1.6,14],['rubber_duck',10,360,1.8,18]]){
  const m=STAGE_ITEMS[kind];assert.deepEqual([m.damage,m.speed,m.life,m.knock],[damage,speed,life,knock]);assert.equal(m.radius,18);
 }
 assert.deepEqual(ITEM_THROW,{start:.12,duration:.40});
});

test('headless release matches the live throw pose without the obsolete fixed origin',()=>{
 const d=new Duel(),f=d.player;f.item={id:'real-origin',kind:'paper',carryHand:'farArm'};d.request(f,'punch');f.attack.age=.12;
 const expected=heldItemAnchor({...f,item:{kind:'paper'}},itemFighterPose(f,d.elapsed*1000),'farArm');
 d.launchItem(f,f.attack);assert.equal(d.projectiles[0].x,expected.x);assert.equal(d.projectiles[0].y,expected.y);assert.ok(expected.y<f.y-150);
});

test('fresh pose sampler exactly matches the renderer for crouch, jump, every move and both facings',()=>{
 const ctx=new Proxy({}, {get:(_,key)=>key==='globalAlpha'?1:()=>{}}),images=new Proxy({}, {get:()=>({width:1536,height:1024})});
 for(const type of Object.keys(CAST))for(const face of [-1,1])for(const kind of [null,'punch',...CAST[type].moves.map(m=>m.kind)])for(const age of [0,.11,.17,.35,.65,1])for(const y of [GROUND,300]){
  const f=new Duel(type).player;Object.assign(f,{face,y,crouchBlend:kind||y<GROUND?0:1,attack:kind?{kind,age}:null});
  const expected=drawFighterArt(ctx,images,f,250,{shadow:false});assert.deepEqual(fighterArtPose(f,250),expected);
 }
 const source=readFileSync(new URL('../dist/game.mjs',import.meta.url),'utf8');
 assert.match(source,/duel\.itemPose=f=>this\.currentItemPose\(f\)/);
 assert.match(source,/currentItemPose\(f\).*fighterArtPose\(renderF,this\.artTime,spit,impact\)/);
 assert.doesNotMatch(source,/duel\.itemOrigin=.*?lastArtPose/);
});

test('full XY sweep catches a fast crossing but does not fill a diagonal path bounding box',()=>{
 const d=new Duel(),f=d.enemy;f.x=100;
 const p={kind:'paper',itemId:'sweep',height:'high',phase:'outbound',radius:18,x:600,y:420};
 assert.equal(d.projectileTouches(p,f,0,0),false,'diagonal segment passes above and away from this body');
 p.x=100;p.y=500;assert.equal(d.projectileTouches(p,f,100,0),true,'vertical segment crosses body even when both endpoints are clear');
 assert.equal(segmentDistanceSq({x:0,y:0},{x:20,y:0},{x:10,y:0},{x:30,y:0}),0);
 assert.equal(segmentDistanceSq({x:0,y:0},{x:0,y:0},{x:3,y:4},{x:3,y:4}),25);
});

test('separate limb shapes hit extended hands/feet but leave the air between limbs empty',()=>{
 const f=new Duel().enemy;f.face=1;const p=itemFighterPose(f);
 p.arm={shoulder:{x:-29,y:-142},elbow:{x:150,y:-142},wrist:{x:150,y:-220}};
 const shot=(x,y)=>({x:f.x+x,y:f.y+y,radius:18});
 for(const [x,y,want]of [[150,-220,true],[112,-70,false],[-130,-80,false]]){
  const q=shot(x,y);assert.equal(itemProjectileTouches(q,f,q,p),want,`${x},${y}`);
 }
 const kick={...f,attack:{kind:'punch',variant:'kick',age:.16}},pose=itemFighterPose(kick),foot=pose.legs.near.ankle,q=shot(foot.x+13,foot.y+4);
 assert.equal(itemProjectileTouches(q,kick,q,pose),true);
});

test('bow and shout-prop space is not vulnerable body',()=>{
 const f=new Duel('han').player;f.attack={kind:'arrow',age:.3};f.face=1;
 const p=itemFighterPose(f),q={x:f.x+160,y:f.y-215,radius:18};
 assert.equal(itemProjectileTouches(q,f,q,p),false);
});

test('low-profile flag cannot suppress overlapping roll or knee art, but the high paper lane clears both',()=>{
 for(const [type,kind,ages]of [['wang','rush',[.17,.25,.4,.49]],['han','han_knee',[.13,.3,.6,.9]]])for(const face of [-1,1])for(const age of ages){
  const f=new Duel(type).player;Object.assign(f,{face,attack:{kind,age},lowProfile:true});const pose=itemFighterPose(f),shapes=itemBodyShapes(f,pose);
  const body=shapes.find(s=>s.name==='head'),touch={x:(body.a.x+body.b.x)/2,y:(body.a.y+body.b.y)/2,radius:18};
  assert.equal(itemProjectileTouches(touch,f,touch,pose),true);
  const high={x:f.x+200,y:f.y-PAPER_FLIGHT.height,radius:18};assert.equal(itemProjectileTouches(high,f,{x:f.x-200,y:high.y},pose),false,`${kind}/${age}`);
 }
});

test('table-height duck descent hits a visible standing body; ground duck passes under the table fighter',()=>{
 const fromDesk=fixture('rubber_duck',{gap:180,sourceY:DESK.y});fromDesk.throwItem();fromDesk.frames(1.5);assert.equal(fromDesk.o.hp,90);assert.equal(fromDesk.hits().length,1);
 const onDesk=fixture('rubber_duck',{gap:300,targetY:DESK.y});onDesk.throwItem();onDesk.frames(1.5);assert.equal(onDesk.o.hp,100);
 const d=new Duel(),f=d.enemy;f.y=f.supportY=DESK.y;const p={kind:'rubber_duck',itemId:'desk',height:'low',phase:'falling',radius:18,x:f.x,y:f.y-110};
 assert.equal(d.projectileTouches(p,f,p.x-4,p.y-5),true,'falling contact at table height is real');
});

test('airborne visible overlap hits, while spatially clear jumps dodge either item',()=>{
 const d=new Duel(),f=d.enemy;f.y=200;f.supportY=GROUND;f.vy=-100;
 for(const kind of ['paper','rubber_duck']){
  const p={kind,itemId:'jump',height:kind==='paper'?'high':'low',phase:kind==='paper'?'outbound':'falling',radius:18,x:f.x,y:f.y-110};
  assert.equal(d.projectileTouches(p,f,p.x-8,p.y-8),true);
  p.y=395;assert.equal(d.projectileTouches(p,f,p.x-8,p.y),false);
 }
});

test('a duck that clears bodies still lands and continues along the ground',()=>{
 const {d,f,o,frames,throwItem}=fixture('rubber_duck',{gap:300,targetY:DESK.y});throwItem();frames(.2);const p=d.projectiles[0];assert.equal(p.phase,'falling');
 const x=p.x;frames(.6);assert.equal(p.phase,'ground');assert.equal(p.y,GROUND-35);assert.ok(p.x>x);assert.equal(o.hp,100);assert.ok(p.life>0);assert.equal(f.hp,100);
});

test('AI and player item contacts share the same damage and current-pose collision',()=>{
 for(const difficulty of ['easy','normal']){
  const d=new Duel('wang',difficulty,()=>.5,'wang');d.player.x=400;d.enemy.x=510;d.enemy.face=-1;d.enemy.item={id:'ai',kind:'rubber_duck'};d.aiWait=10;
  assert.equal(d.request(d.enemy,'punch'),true);for(let i=0;i<120;i++)d.step(1/120,{},true);
  assert.equal(d.player.hp,90);assert.equal(d.events.filter(e=>e.type==='hit'&&e.impact==='item_rubber_duck').length,1);
 }
});

test('falling duck interacts with the queue when visibly low enough, not while high above it',()=>{
 for(const y of [100,370]){
  const d=new Duel(),f=d.player,o=d.enemy;f.x=200;o.x=800;
  d.itemOrigin=()=>({x:400,y});d.launchItem(f,{itemKind:'rubber_duck',itemId:'queue',castId:1});
  const p=d.projectiles[0],q={owner:o,x:410,y:GROUND,life:1,dead:false};d.obstacles=[q];d.updateProjectiles(1/60);
  assert.equal(q.dead,y===370);assert.equal(p.dead,y===370);
 }
});

test('non-item high projectiles retain their existing collision path',()=>{
 const d=new Duel(),f=d.enemy;f.lowProfile=true;const p={kind:'coin',height:'high',x:f.x,y:178,radius:13,phase:'outbound'};
 assert.equal(d.projectileTouches(p,f,p.x-10),false);f.lowProfile=false;assert.equal(d.projectileTouches(p,f,p.x-10),true);
});

for(const role of ['player','enemy'])for(const face of [-1,1])test(`table and floor routes use real visible height: ${role}/${face}`,()=>{
 for(const kind of ['paper','rubber_duck'])for(const sourceY of [GROUND,DESK.y])for(const targetY of [GROUND,DESK.y])for(const gap of [88,300]){
  const q=fixture(kind,{role,face,sourceY,targetY,gap});q.throwItem();q.frames(1.8);
  const clears=kind==='paper'&&sourceY===DESK.y&&targetY===GROUND&&gap===300||kind==='rubber_duck'&&sourceY===GROUND&&targetY===DESK.y&&gap===300;
  assert.equal(q.o.hp,clears?100:100-STAGE_ITEMS[kind].damage,`${kind}/${sourceY}/${targetY}/${gap}`);
  assert.equal(q.hits().length,clears?0:1);
 }
});

test('an early jump meets the high paper with a visible foot rather than gaining blanket evasion',()=>{
 const {d,o,frames,throwItem}=fixture('paper',{gap:300});d.request(o,'jump');const contact=[];const original=d.projectileTouches;
 d.projectileTouches=function(p,f,oldX,oldY){
  const hit=original.call(this,p,f,oldX,oldY);if(hit&&p.itemId){const previous={x:oldX,y:oldY};contact.push(...itemBodyShapes(f,this.itemPose(f)).filter(s=>segmentDistanceSq(previous,p,s.a,s.b)<=(p.radius+s.r)**2).map(s=>s.name));}return hit;
 };
 throwItem();frames(1.2);assert.equal(o.hp,92);assert.ok(contact.some(name=>name.endsWith('-foot')));
});

test('body capsules stay finite and mirror exactly through the roster and all visible phases',()=>{
 for(const type of Object.keys(CAST))for(const kind of [null,'punch',...CAST[type].moves.map(m=>m.kind)])for(const age of [0,.12,.17,.35,.50,.65,.99]){
  const f=new Duel(type).player;f.x=400;f.attack=kind?{kind,age}:null;const pose=itemFighterPose(f,500);
  const right=itemBodyShapes({...f,face:1},pose),left=itemBodyShapes({...f,face:-1},pose);assert.equal(right.length,left.length);
  for(let i=0;i<right.length;i++){assert.equal(right[i].name,left[i].name);for(const end of ['a','b']){const a=right[i][end],b=left[i][end];assert.ok(Number.isFinite(a.x)&&Number.isFinite(a.y));assert.ok(Math.abs((a.x-f.x)+(b.x-f.x))<1e-8);assert.equal(a.y,b.y);}assert.ok(right[i].r>0&&right[i].r<=58);}
 }
});

test('folded knees do not create an invisible side hit outside the opaque lotus cutout',()=>{
 for(const face of [-1,1]){
  const f=new Duel('han').player;f.face=face;f.attack={kind:'han_knee',age:.15};const pose=itemFighterPose(f);
  const outside={x:f.x-face*66,y:f.y-28,radius:18};
  assert.equal(itemProjectileTouches(outside,f,outside,pose),false,'measured nearest opaque leg is over36px away');
  const knee={x:f.x-face*14,y:f.y-10,radius:18};assert.equal(itemProjectileTouches(knee,f,knee,pose),true);
 }
});

test('lotus cutout keeps its visible protruding elbow vulnerable',()=>{
 for(const face of [-1,1]){
  const f=new Duel('han').player;f.face=face;f.attack={kind:'han_knee',age:.15};
  const q={x:f.x-face*46,y:f.y-68,radius:18};assert.equal(itemProjectileTouches(q,f,q,itemFighterPose(f)),true,'nearest opaque sleeve is only7.1px away');
 }
});

test('roll cutout follows its separate shoe and side silhouette rather than one round envelope',()=>{
 for(const face of [-1,1]){
  const f=new Duel().player;f.face=face;f.attack={kind:'rush',age:.17};const pose=itemFighterPose(f),a=pose.rollAngle;
  const q=(x,y)=>({x:f.x+face*(x*Math.cos(a)-(y+115)*Math.sin(a)),y:f.y-115+x*Math.sin(a)+(y+115)*Math.cos(a),radius:18});
  const outside=q(74,-42);assert.equal(itemProjectileTouches(outside,f,outside,pose),false,'nearest opaque roll pixel is30.25px away');
  const shoe=q(48,-10);assert.equal(itemProjectileTouches(shoe,f,shoe,pose),true,'nearest opaque shoe is only7.01px away');
 }
});

test('Han shout portrait does not inherit an over-wide generic head hitbox',()=>{
 for(const face of [-1,1]){
  const f=new Duel('han').player;f.face=face;f.attack={kind:'han_knee',age:.15};const q={x:f.x+face*62,y:f.y-198,radius:18};
  assert.equal(itemProjectileTouches(q,f,q,itemFighterPose(f)),false,'nearest opaque portrait pixel is34.71px away');
 }
});
