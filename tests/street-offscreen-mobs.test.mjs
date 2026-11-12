import test from 'node:test';
import assert from 'node:assert/strict';
import {paintDepthRoute} from '../dist/challenge-depth-render.mjs';
import {ChallengeRoute} from '../dist/challenge-engine.mjs';
import {sceneFixture,artImages} from './helpers/street-render-scene.mjs';

function fixture(){
 const r=new ChallengeRoute('wang','easy',()=>.2);r.depthMode=true;r.spawn();
 r.player.x=500;r.enemies.forEach((f,i)=>{f.x=500+i*20;});
 const f=sceneFixture(),ctx=f.scene.textures.createCanvas('test',844,390).getContext();
 const frame={x:500,y:300,zoom:1,width:844,height:390};
 return {r,f,ctx,frame};
}
test('fully offscreen mobs do not paint bodies/shadows or invoke pose callbacks; gameplay state is unchanged',()=>{
 const {r,f,ctx,frame}=fixture();r.enemies.forEach((m,i)=>m.x=5000+i*100);
 const snapshot=JSON.stringify(r),poses=[];
 paintDepthRoute(ctx,artImages,r,100,frame,{skipBackdrop:true,skipMic:true,onPose:f=>poses.push(f)});
 assert.deepEqual(poses,[r.player]);
 assert.equal(JSON.stringify(r),snapshot);
 assert.equal(f.draws.filter(d=>d.image.id==='challenge-mobs').length,0);
});
test('actors at both viewport edges and their extended poses remain drawn',()=>{
 const {r,ctx,frame}=fixture();
 r.enemies=[{...r.enemies[0],id:"left"},{...r.enemies[0],id:"right"}];r.enemies[0].x=frame.x-frame.width/2-150;r.enemies[1].x=frame.x+frame.width/2+150;
 const poses=[];paintDepthRoute(ctx,artImages,r,100,frame,{skipBackdrop:true,skipMic:true,onPose:f=>poses.push(f)});
 assert.deepEqual(new Set(poses),new Set([r.player,...r.enemies]));
});
