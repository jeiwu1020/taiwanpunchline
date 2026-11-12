import {paintDepthRoute as baseline} from './helpers/baseline-depth-69.mjs';
import {paintDepthRoute as candidate} from '../dist/challenge-depth-render.mjs';
import {ChallengeRoute} from '../dist/challenge-engine.mjs';
import {sceneFixture,artImages} from './helpers/street-render-scene.mjs';
const results=[];
for(const [name,paint] of [['baseline69',baseline],['candidate',candidate]])for(const offscreen of [false,true]){
 const route=new ChallengeRoute('wang','easy',()=>.2);route.depthMode=true;route.spawn();route.player.x=500;
 route.enemies=Array.from({length:7},(_,i)=>({...route.enemies[0],id:'mob-'+i,x:offscreen?5000+i*100:500+i*20}));
 const {scene,draws}=sceneFixture(),ctx=scene.textures.createCanvas('fg',844,390).getContext();let poses=0;
 paint(ctx,artImages,route,100,{x:500,y:300,zoom:1,width:844,height:390},{skipBackdrop:true,skipMic:true,onPose:()=>poses++});
 results.push({name,offscreen,mobs:7,drawImage:draws.length,poseCallbacks:poses});
}
console.log(JSON.stringify({scope:'Production foreground paint call counts with recording Canvas; not FPS',results},null,2));
