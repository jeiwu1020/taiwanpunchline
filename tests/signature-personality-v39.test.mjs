import test from 'node:test';
import assert from 'node:assert/strict';
import {rosterMotion} from '../dist/art-roster-motion.mjs';
import {fighterPose} from '../dist/art-motion.mjs';
import {gazeGlyph,presentationFighter} from '../dist/move-readability.mjs';
import {drawMoveAccent} from '../dist/art-expression.mjs';
import {drawFighterArt,ART_FILES} from '../dist/art-render.mjs';
import {COMBAT} from '../dist/combat-rules.mjs';
const pose=(kind,age,extra={})=>fighterPose({type:kind.split('_')[0],y:430,face:1,move:0,attack:{kind,age},...extra},0);
const record=(kind,age,outcome='pending',outcomeAge=0)=>({kind,age,duration:COMBAT[kind].duration,outcome,outcomeAge});

test('Ma bows into handshake then examines his unanswered hand only after a real whiff',()=>{
 const bow=rosterMotion('ma_handshake',.18),miss=rosterMotion('ma_handshake',.43,{outcome:'whiff'}),hit=rosterMotion('ma_handshake',.43,{outcome:'hit'});
 assert.ok(bow.drop>=6&&bow.headAngle>.06);assert.ok(miss.wrist.y<hit.wrist.y-15);assert.notEqual(miss.headAngle,hit.headAngle);
});
test('human glyph waits beside the inspecting face before palm launch at the hit window',()=>{
 const inspect=gazeGlyph(.16),launch=gazeGlyph(.25),flight=gazeGlyph(.38);
 assert.ok(inspect&&inspect.x<90);assert.ok(launch.x<=90);assert.ok(flight.x>launch.x+50);assert.ok(flight.y<inspect.y-20);
});
test('cough visibly lifts both shoulders twice and keeps paper in the other hand',()=>{
 for(const age of [.24,.46]){const p=rosterMotion('ma_cough',age);assert.ok(p.shoulderLift>=3);assert.equal(p.prop,'briefing');assert.ok(p.farW.y<-120);}
 assert.ok(rosterMotion('ma_cough',.35).shoulderLift<rosterMotion('ma_cough',.24).shoulderLift);
});
test('three-step Su charge lands at each actual hit and visibly brakes after third step',()=>{
 for(const age of [.17,.37,.57])assert.ok(Math.abs(pose('su_rush',age).walking)>.7);
 const braking=pose('su_rush',.77);assert.equal(braking.walking,0);assert.ok(braking.bodyX<0);assert.ok(braking.legs.far.ankle.x>32);
});
test('Su dare counter followthrough differs from unanswered invitation without adding hits',()=>{
 const miss=rosterMotion('su_dare',.77,{outcome:'whiff'}),success=rosterMotion('su_dare',.48,{outcome:'counter',outcomeAge:.09});
 assert.ok(success.wrist.x>miss.wrist.x+15);assert.equal(success.hand,'fist');assert.equal(miss.hand,'beckon');
});
test('Huang commits to the pointing lean and pulls the queue strap only before creation',()=>{
 assert.ok(rosterMotion('huang_shout',.3).shift>=9);
 assert.equal(rosterMotion('huang_queue',.16).prop,'queue-pull');assert.notEqual(rosterMotion('huang_queue',.30).prop,'queue-pull');
});
test('Chen shrug lifts shoulders, and real calm retreat relaxes instead of inventing a counter',()=>{
 assert.ok(rosterMotion('chen_calm',.3).shoulderLift>=5);
 const calm=rosterMotion('chen_calm',.3,{outcome:'calm',outcomeAge:.08});assert.ok(calm.shift<-6);assert.equal(calm.hand,'open-right');
});
test('bags hang as weight below the hand and stance plants both soles',()=>{
 const bags=rosterMotion('ko_bags',.18);assert.ok(bags.drop>=5);assert.ok(bags.bagSway>0);
 const brace=pose('ko_resolve',.2);assert.ok(brace.legs.near.ankle.x<-30&&brace.legs.far.ankle.x>30);assert.equal(brace.legs.near.ankle.y,-8);assert.equal(brace.legs.far.ankle.y,-8);
});
test('authoritative visual performance can finish through hit reaction, with no state mutation',()=>{
 const f={type:'su',y:430,move:0,stun:.1,reaction:.2,attack:null,performance:record('su_shout',.53)},before=JSON.stringify(f),p=presentationFighter(f);
 assert.equal(p.attack?.kind,'su_shout');assert.equal(p.reaction,0);assert.equal(JSON.stringify(f),before);
 const expired={...f,performance:record('su_shout',.8)};assert.equal(presentationFighter(expired),expired);
 for(const e of [{move:1},{guard:true},{y:380},{attack:{kind:'punch',age:.1}}]){const busy={...f,...e};assert.equal(presentationFighter(busy),busy);}
});
test('presentation forwards true outcomes and never creates them for a live pending record',()=>{
 for(const outcome of ['pending','counter','whiff']){const f={type:'su',y:430,move:0,performance:record('su_dare',.6,outcome,.1)};assert.equal(presentationFighter(f).attack.presentationOutcome,outcome);}
});
test('all fifteen moves draw finite connected frames in either direction',()=>{
 const images=Object.fromEntries(Object.keys(ART_FILES).map(id=>[id,{id}]));
 for(const [kind,m] of Object.entries(COMBAT).filter(([k])=>/^(ma|su|huang|chen|ko)_/.test(k)))for(const face of [1,-1])for(const age of [0,.08,m.start??.2,m.duration*.65,m.duration-.01]){
  let depth=0;const ctx=new Proxy({globalAlpha:1,save(){depth++},restore(){depth--},drawImage(im,...v){assert.ok(im,kind);assert.ok(v.every(Number.isFinite),kind)}},{get:(o,k)=>o[k]??((...v)=>{for(const n of v)if(typeof n==='number')assert.ok(Number.isFinite(n),kind)})});
  const f={type:kind.split('_')[0],y:430,face,move:0,attack:{kind,age}};drawFighterArt(ctx,images,f);assert.equal(depth,0,kind);
 }
});
test('cough paper follows the far hand and no duplicate lectern is drawn',()=>{
 const images={'signature-props':{id:'props'}},draws=[],polygons=[];
 const ctx=new Proxy({globalAlpha:1,drawImage(...v){draws.push(v)},translate(...v){polygons.push(v)}},{get:(o,k)=>o[k]??(()=>{})});
 const p=pose('ma_cough',.24);drawMoveAccent(ctx,images,p,'back');
 assert.ok(polygons.some(([x,y])=>Math.abs(x-(p.farArm.wrist.x+12))<.001&&Math.abs(y-(p.farArm.wrist.y+25))<.001));
 assert.equal(draws.length,0,'old freestanding slides atlas must not duplicate hand-held paper');
});
test('queue pull has a red strap during windup, absent after actual barrier release',()=>{
 for(const [age,visible] of [[.16,true],[.29,false]]){
  const colors=[];const ctx=new Proxy({globalAlpha:1},{get:(o,k)=>o[k]??(()=>{}),set(o,k,v){o[k]=v;if(k==='strokeStyle')colors.push(v);return true}});
  drawMoveAccent(ctx,{},pose('huang_queue',age),'front');assert.equal(colors.includes('#b3473d'),visible);
 }
});
test('Ko bag hands stay at the skeletal wrists and do not rotate entire bags along the forearms',()=>{
 const images=Object.fromEntries(Object.keys(ART_FILES).map(id=>[id,{id}])),draws=[];
 const ctx=new Proxy({globalAlpha:1,drawImage(im,...v){if(im.id==='ko-bags')draws.push(v)}},{get:(o,k)=>o[k]??(()=>{})});
 drawFighterArt(ctx,images,{type:'ko',y:430,move:0,face:1,attack:{kind:'ko_bags',age:.2}});
 assert.equal(draws.length,2);assert.ok(draws.every(v=>v[1]>=414&&v[3]<=602),'bag art starts at bare wrist, no second foreign sleeve');
});
test('explicitly cleared live performance never falls back to a wall-clock move beat',()=>{
 const f={type:'su',y:430,move:0,attack:null,performance:null};assert.equal(presentationFighter(f,{kind:'su_shout',age:.6}),f);
});
test('shouting and planted resolve leave the speaking mouth unobscured',()=>{
 for(const [kind,age]of [['su_shout',.38],['ko_resolve',.22]]){const p=pose(kind,age);assert.ok(p.arm.wrist.y>-150,kind+' speaking face remains visible');}
});
test('Chen shrug spreads both palms away from the smile instead of covering it',()=>{
 const p=rosterMotion('chen_calm',.3);assert.ok(p.wrist.x<0);assert.ok(p.farW.x>60);assert.ok(p.wrist.y>-146);
});
test('simulation-owned no-hit release is no shorter than the V36 render-only tail',()=>{
 for(const kind of ['ma_gaze','su_shout','chen_calm','ko_name']){const m=COMBAT[kind],age=m.duration+.14,f={type:kind.split('_')[0],y:430,move:0,performance:{...record(kind,age),actionDuration:m.duration,duration:m.duration+.28}};
  const shown=presentationFighter(f);assert.equal(shown.attack.kind,kind);assert.ok(shown.attack.age<m.duration);assert.ok(shown.attack.age>m.duration-.25);
 }
});
