import {drawSignatureProp} from '../../art-expression.mjs?v=chapter-presentation-20261117-r1';
import {RALLY} from '../../stage-expansion.mjs?v=chapter-presentation-20261117-r1';
import {drawWorldObstacleExtra} from '../campaign/world-combat-fx.mjs?v=chapter-presentation-20261117-r1';
export const FINALE_SUPPORTERS=Object.freeze({
 'supporter-woman':'supporter-woman-v46.png','supporter-man':'supporter-man-v46.png','supporter-young':'supporter-young-v48.png','supporter-elder':'supporter-elder-v48.png','supporter-grandma':'supporter-grandma-v48.png'
});
export function drawFinaleEffects(ctx,images,g,point,zoom,time){
 for(const q of g.obstacles){if(q.dead)continue;const p=point(q.x,430,q.depth),z=zoom*p.scale;ctx.save();ctx.translate(p.x,p.y);ctx.scale(z,z);
  ctx.fillStyle=q.perk?'#ffd9593a':q.owner.team===0?'#32857033':'#bd594033';ctx.beginPath();ctx.ellipse(0,0,q.perk?50:45,q.perk?14:12,0,0,7);ctx.fill();drawSignatureProp(ctx,images,'queue',0,-37,92,74,0,Math.min(1,q.life*3));
  if(!q.perk){ctx.font='900 13px system-ui';ctx.textAlign='center';ctx.fillStyle='#fff0cb';ctx.strokeStyle='#253c38';ctx.lineWidth=3;const label=q.owner.team===0?'友方排隊線':'對手排隊線';ctx.strokeText(label,0,-81);ctx.fillText(label,0,-81);}ctx.restore();
  drawWorldObstacleExtra(ctx,q,point,zoom,time);
 }
 for(const r of g.rallies){const warning=r.age<RALLY.warning,color=r.owner.team===0?'#408b70':'#b6523e';
  for(const [i,key]of Object.keys(FINALE_SUPPORTERS).entries()){const im=images[key];if(!im)continue;const p=point(r.x+[0,-1,1,0,-1][i]*26-(i>=3?r.direction*8:0),430,r.depth+(i>=3?10:-8)),z=zoom*p.scale,h=104*z,w=h*im.width/im.height;
   ctx.save();ctx.globalAlpha=warning?.4:Math.min(1,(RALLY.duration-r.age)*5);ctx.fillStyle=color+'55';ctx.beginPath();ctx.ellipse(p.x,p.y,26*z,7*z,0,0,7);ctx.fill();ctx.translate(p.x,p.y-(warning?0:Math.abs(Math.sin(time*.02+i))*3*z));ctx.scale(r.direction,1);ctx.drawImage(im,-w/2,-h,w,h);ctx.restore();
  }
  const p=point(r.x,430,r.depth);ctx.save();ctx.fillStyle=color;ctx.strokeStyle='#fff1ca';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(p.x+r.direction*34*zoom,p.y);ctx.lineTo(p.x+r.direction*12*zoom,p.y-11*zoom);ctx.lineTo(p.x+r.direction*12*zoom,p.y+11*zoom);ctx.closePath();ctx.fill();ctx.stroke();
  if(warning){ctx.font='900 14px system-ui';ctx.textAlign='center';ctx.fillStyle='#fff1ca';ctx.strokeStyle='#263d39';ctx.lineWidth=3;const copy=r.owner.team===0?'友軍集合！':'對手要揪團了！';ctx.strokeText(copy,p.x,p.y-118*zoom);ctx.fillText(copy,p.x,p.y-118*zoom);}ctx.restore();
 }
}
