import test from 'node:test';
import assert from 'node:assert/strict';
import * as art from '../dist/challenge-story-art.mjs';
test('waking rotates a reclining torso upright while arm and blanket move independently',()=>{
 assert.equal(typeof art.openingPose,'function');
 const sleep=art.openingPose('wake',0),sit=art.openingPose('wake',1000),reach=art.openingPose('wake',1900),settled=art.openingPose('wake',4000);
 assert.ok(sleep.torsoAngle<-.8);assert.ok(Math.abs(sit.torsoAngle)<Math.abs(sleep.torsoAngle));assert.ok(Math.abs(settled.torsoAngle)<.15);
 assert.ok(reach.reach>sleep.reach+.6);assert.ok(sit.blanketLift>sleep.blanketLift+.3);assert.notEqual(reach.hand.x,sleep.hand.x);
});
test('reduced motion uses a fixed finished illustration in all four shots',()=>{
 assert.equal(typeof art.openingPose,'function');
 for(const shot of ['bulletin','wake','wardrobe','chase'])assert.deepEqual(art.openingPose(shot,0,true),art.openingPose(shot,1800,true));
});
test('opening layout gives portrait art most of the panel and keeps landscape controls alongside',()=>{
 assert.equal(typeof art.openingFrame,'function');
 for(const [width,height] of [[374,828],[414,880],[344,640]]){
  const f=art.openingFrame(width,height,'portrait');assert.ok(f.artHeight/height>=.75&&f.artHeight/height<=.85);assert.ok(f.copyHeight>=140);assert.equal(f.artWidth,width-8);assert.ok(f.artHeight+f.copyHeight<=height-8);
 }
 const wide=art.openingFrame(828,374,'landscape');assert.ok(wide.artWidth/wide.artHeight>1.4);assert.ok(wide.copyWidth>=220);assert.ok(wide.artWidth+wide.copyWidth<=820);
});

test('waking keeps the reclining head, seated head, feet and lifted blanket inside every frame',()=>{
 assert.equal(typeof art.storyWakingLayout,'function');
 for(const [w,h] of [[720,1296],[1000,620],[720,432],[600,900]]){
  const f=art.storyWakingLayout(w,h);assert.ok(f.hipX-250*f.scale>=12,'reclining head');assert.ok(f.hipY-258*f.scale>=12,'seated head');assert.ok(f.hipY+128*f.scale<=h-12,'feet');assert.ok(f.hipX+157*f.scale<=w-9,'thrown blanket');
 }
});
