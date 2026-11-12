import test from 'node:test';
import assert from 'node:assert/strict';
import * as art from '../dist/challenge-opening-art.mjs';
test('opening uses separately articulated constant-length arm bones and moving blanket',()=>{
 assert.equal(typeof art.openingPajamaRig,'function');
 const states=[0,600,1200,1900,2800,4000].map(t=>art.openingPajamaRig(art.openingPose('wake',t)));
 for(const rig of states)for(const arm of [rig.nearArm,rig.farArm]){
  assert.ok(Math.abs(Math.hypot(arm.elbow.x-arm.shoulder.x,arm.elbow.y-arm.shoulder.y)-57)<.001);
  assert.ok(Math.abs(Math.hypot(arm.wrist.x-arm.elbow.x,arm.wrist.y-arm.elbow.y)-57)<.001);
 }
 assert.notDeepEqual(states[0].nearArm.wrist,states[3].nearArm.wrist);
 assert.notDeepEqual(states[0].blanket,states[2].blanket);
});
test('production opening consumes raster rig and props instead of storyboard scenes',()=>{
 const calls=[];const context=new Proxy({drawImage(...a){calls.push(a);},measureText(){return{width:100};}},{get:(o,k)=>k in o?o[k]:(()=>{})});
 const pajamas={},props={},head={},bedroom={},oldSheet={};
 const result=art.paintOpeningComic(context,{'opening-pajamas-v75':pajamas,'opening-props-v75':props,'han-head':head,'challenge-bedroom':bedroom,'opening-han':oldSheet},{shot:'wake'},'han',844,390,1200);
 assert.equal(result.mode,'articulated');assert.equal(result.scenes,1);
 assert.ok(calls.some(([img])=>img===pajamas));assert.ok(calls.some(([img])=>img===props));assert.ok(calls.some(([img])=>img===head));
 assert.ok(!calls.some(([img])=>img===oldSheet),'never draw storyboard panels when the animated assets are ready');
});
test('articulated reduced-motion presentation is fixed for every story beat',()=>{
 const context=new Proxy({measureText(){return{width:100};}},{get:(o,k)=>k in o?o[k]:(()=>{})});
 const images={'opening-pajamas-v75':{},'opening-props-v75':{},'han-head':{},'challenge-bedroom':{},'challenge-street':{}};
 for(const shot of ['bulletin','wake','wardrobe','chase']){
  assert.deepEqual(art.paintOpeningComic(context,images,{shot},'han',390,700,0,{reducedMotion:true}),art.paintOpeningComic(context,images,{shot},'han',390,700,9999,{reducedMotion:true}));
 }
});
test('waking and changing use the empty room rather than duplicate baked beds',()=>{
 const calls=[],ctx=new Proxy({drawImage(...a){calls.push(a);},measureText(){return{width:100};}},{get:(o,k)=>k in o?o[k]:(()=>{})});
 const empty={},old={};const images={'opening-pajamas-v75':{},'opening-props-v75':{},'opening-bedroom-v75':empty,'han-head':{},'challenge-bedroom':old};
 for(const shot of ['wake','wardrobe']){calls.length=0;art.paintOpeningComic(ctx,images,{shot},'han',844,390,1800);assert.ok(calls.some(([img])=>img===empty));assert.ok(!calls.some(([img])=>img===old));}
});
