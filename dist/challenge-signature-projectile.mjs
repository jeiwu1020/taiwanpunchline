import {drawSignatureProp} from './art-expression.mjs?v=chapter-presentation-20261117-r1';
import {SIGNATURE_SIZE,nameTileOffset} from './move-readability.mjs?v=chapter-presentation-20261117-r1';
// Same asset, dimensions and words as VS. Call at the projectile's world origin.
export function drawChallengeSignatureProjectile(ctx,images,p,time){
 const direction=p.vx<0?-1:1;
 if(!['dream','word'].includes(p.kind))return false;
 ctx.save();ctx.textAlign='center';ctx.textBaseline='middle';
 if(p.kind==='dream'){
  ctx.save();ctx.scale(direction,1);drawSignatureProp(ctx,images,'dream',0,0,SIGNATURE_SIZE.dream.width,SIGNATURE_SIZE.dream.height,Math.sin(time*.008)*.06);ctx.restore();
  if(p.phase==='return'){ctx.font='900 15px system-ui';ctx.strokeStyle='#17353a';ctx.lineWidth=3;ctx.strokeText('↶ 回程',0,47);ctx.fillStyle='#d0f4d9';ctx.fillText('↶ 回程',0,47);}
 }else{
  const {width:w,height:h,size}=SIGNATURE_SIZE.word,x=nameTileOffset(p.age||0,.56,direction);
  ctx.fillStyle='#fff7e5';ctx.strokeStyle='#367e8a';ctx.lineWidth=4;ctx.beginPath();ctx.roundRect(x-w/2,-h/2,w,h,10);ctx.fill();ctx.stroke();ctx.font=`900 ${size}px system-ui`;ctx.fillStyle='#295e66';ctx.fillText('賴祥德',x,0);
 }
 ctx.restore();return true;
}
