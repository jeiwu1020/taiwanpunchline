import {paintOpeningComic} from './challenge-opening-art.mjs?v=campaign-visuals-20261112-r2';
export {openingFrame,openingPose,storyWakingLayout} from './challenge-opening-art.mjs?v=campaign-visuals-20261112-r2';
import {drawFighterArt} from './art-render.mjs?v=campaign-visuals-20261112-r2';
import {drawChallengeMob,drawChallengePajamas} from './challenge-art.mjs?v=campaign-visuals-20261112-r2';
export function storyComposition(width,height,phase=0){
 const portrait=height/width>.8;
 return {portrait,scale:height*(portrait?.63:.70)/280,foot:height*.94,leftX:width*.26,rightX:width*.76,soloX:width*(phase===2?.60:.52)};
}
function cover(ctx,image,x,y,w,h){if(!image)return;const z=Math.max(w/image.width,h/image.height),sw=w/z,sh=h/z;ctx.drawImage(image,(image.width-sw)/2,(image.height-sh)/2,sw,sh,x,y,w,h);}
/** Full contained comic panel; artwork scales with the canvas, never CSS-crops. */
export function paintChallengeStory(canvas,images,beat,character,time=0,options={}){
 if(beat?.shot)return paintOpeningComic(canvas.getContext('2d'),images,beat,character,canvas.width,canvas.height,time,{reducedMotion:options.reducedMotion??canvas.dataset?.reducedMotion==='true'});
 const ctx=canvas.getContext('2d'),w=canvas.width,h=canvas.height,f=storyComposition(w,h,beat.phase),duel=beat.phase>=3;
 ctx.clearRect(0,0,w,h);ctx.fillStyle='#fff0cd';ctx.fillRect(0,0,w,h);ctx.save();ctx.beginPath();ctx.rect(12,12,w-24,h-24);ctx.clip();
 cover(ctx,images[duel?'challenge-street':'challenge-bedroom'],12,12,w-24,h-24);
 // Two opposing panels communicate a face-off without introducing another scene.
 if(duel){ctx.strokeStyle='#17353a';ctx.lineWidth=9;ctx.beginPath();ctx.moveTo(w*.54,0);ctx.lineTo(w*.46,h);ctx.stroke();}
 const actor=(type,x,face=1,mobKind)=>{ctx.save();ctx.translate(x,f.foot);ctx.scale(f.scale*face,f.scale);const a={type,face:1,y:430,supportY:430,move:beat.phase===2?1:0,attack:null,performance:null,crouchBlend:0,mobKind};if(mobKind)drawChallengeMob(ctx,images,a,time);else if(beat.phase<2)drawChallengePajamas(ctx,images,type,time);else drawFighterArt(ctx,images,a,time,{shadow:false});ctx.restore();};
 if(duel){actor(character,f.leftX);actor(beat.phase===5?'huang':'wang',f.rightX,-1,beat.phase===3?'mini_mic':beat.phase===4?'mini_guard':undefined);}else actor(character,f.soloX);
 ctx.restore();ctx.strokeStyle='#17353a';ctx.lineWidth=8;ctx.strokeRect(12,12,w-24,h-24);
 // Comic corner stamp sits in the sky, never over a face.
 const label=duel?'正面開講':beat.phase===0?'一大早⋯':beat.phase===1?'神麥現身！':'出門！';
 ctx.save();ctx.translate(40,45);ctx.rotate(-.035);ctx.font='900 32px Microsoft JhengHei,system-ui';const sw=ctx.measureText(label).width+30;ctx.fillStyle='#efbf54';ctx.fillRect(-12,-25,sw,46);ctx.strokeStyle='#17353a';ctx.lineWidth=4;ctx.strokeRect(-12,-25,sw,46);ctx.fillStyle='#17353a';ctx.fillText(label,3,8);ctx.restore();
}
