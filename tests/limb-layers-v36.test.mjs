import test from 'node:test';
import assert from 'node:assert/strict';
import * as roster from '../dist/art-roster.mjs';
import * as signature from '../dist/art-signature.mjs';
import {rosterMotion} from '../dist/art-roster-motion.mjs';
import {drawFighterArt,ART_FILES} from '../dist/art-render.mjs';
const images=Object.fromEntries(Object.keys(ART_FILES).map(id=>[id,{id,width:1280,height:1280}]));
function record(f){const calls=[];const ctx=new Proxy({globalAlpha:1,drawImage(im,...args){calls.push({id:im.id,args});}},{get:(o,k)=>o[k]??(()=>{})});drawFighterArt(ctx,images,{y:430,move:0,stun:0,reaction:0,...f},0,{shadow:false});return calls;}
test('replacement hands use per-costume skin-free sleeves, not wrist plus eight pixels',()=>{
 const limits={ma:[212,212],su:[527,535],huang:[875,876],chen:[276,276],ko:[810,811]};
 assert.ok(roster.ROSTER_SLEEVES,'explicit measured sleeve boundaries');
 for(const [type,ends] of Object.entries(limits))for(const [i,side] of ['near','far'].entries()){
  const s=roster.ROSTER_SLEEVES[type][side];assert.ok(s.crop[1]+s.crop[3]<=ends[i],type+' '+side+' must not include original skin');
 }
});
test('signature sprite definitions contain no second costume cuff and normalize palm sizes',()=>{
 assert.ok(signature.HAND_FRAMES);
 for(const key of ['open-right','open-left','beckon','point','back-left','cough']){
  const h=signature.HAND_FRAMES[key];assert.ok(h,key);assert.ok(h.width>=27&&h.width<=36,key+' apparent width');assert.equal(h.includesSleeve,false,key+' must be hand-only');
 }
});
test('debt left hand shows its dorsal side rather than an unrelated palm',()=>assert.equal(rosterMotion('huang_debt',.3).farHand,'back-left'));
test('cough hand reaches mouth with two distinct controlled wrist pulses and retires afterward',()=>{
 const p=rosterMotion('ma_cough',.24),q=rosterMotion('ma_cough',.46),pause=rosterMotion('ma_cough',.35),end=rosterMotion('ma_cough',.82);
 assert.equal(p.hand,'cough');assert.ok(p.wrist.y<-170);assert.ok(q.wrist.y<-170);assert.ok(pause.wrist.y>p.wrist.y);assert.ok(p.headAngle<.12);assert.equal(end.hand,'fist');
});
test('kneeling expression starts with the immediate spoken cue',()=>{assert.equal(signature.kneePresentation(.01).shout,true);assert.equal(signature.kneePresentation(.4).shout,true);});
test('counter glasses place rear arms before portrait and lenses after portrait',()=>{
 const c=record({type:'wang',attack:{kind:'counter',age:.25}}),h=c.findIndex(x=>x.id==='wang-head'),g=c.map((x,i)=>[x,i]).filter(([x])=>x.id==='art-props'&&x.args[0]===28);
 assert.equal(g.length,2);assert.ok(g[0][1]<h);assert.ok(g[1][1]>h);
});
test('Wang and Han far palms do not shrink with the full long sleeve sprite',()=>{
 for(const type of ['wang','han']){const c=record({type}),palms=c.filter(x=>x.id==='left-arms');assert.equal(palms.length,2,type+' separates sleeve from constant-size palm');assert.ok(palms.every(x=>x.args[3]<700));}
});
test('capture removes original near fist skin on both original characters',()=>{
 for(const [type,end] of [['wang',316],['han',326]]){const c=record({type,grabbedPose:.2}),s=c.find(x=>x.id===type+'-parts'&&x.args[0]===1118);assert.equal(s.args[3],end);}
});
test('signature hands keep the same apparent size when forearm length changes',()=>{
 for(const name of Object.keys(signature.HAND_FRAMES)){
  const scales=[];const ctx=new Proxy({scale(x,y){scales.push([x,y]);}},{get:(o,k)=>o[k]??(()=>{})});
  for(const length of [28,57,84])signature.drawSignatureHand(ctx,images,name,{elbow:{x:0,y:0},wrist:{x:0,y:-length}});
  assert.deepEqual(scales[0],scales[1],name);assert.deepEqual(scales[1],scales[2],name);
 }
});
test('raised gaze and calling hands leave the eyes visible at their full-size poses',()=>{
 for(const kind of ['ma_gaze','ko_name']){const p=rosterMotion(kind,.32);assert.ok(p.wrist.x>50,kind+' palm must sit outside the portrait eye region');}
});
