import {supporterFormation} from '../../stage-expansion.mjs?v=rally-consistency-20261115-r1';
export function rallyCrowdFormation(world,frame,width,height,time,{route=false,reducedMotion=false}={}){
 const zoom=Math.max(.1,frame.zoom||1),cameraX=frame.left+width/(2*zoom),cameraY=430+(height/2-frame.base)/zoom;
 return supporterFormation(world,time,reducedMotion,{width,height,zoom,x:cameraX,y:cameraY,route,crowdBottom:Math.max(height*.45,frame.base-4)});
}
export function paintRallySupporters(ctx,images,members,project,zoom=1){
 for(const member of members){
  const image=images[member.asset]||images[member.side==='enemy'?'supporter-man':'supporter-woman'];if(!image)continue;
  const point=project(member),height=Math.max(18,(member.height??76)*zoom),width=height*image.width/image.height;
  ctx.save();ctx.globalAlpha*=member.alpha??1;ctx.translate(point.x,point.y);ctx.rotate(member.rotation??0);ctx.scale(member.direction<0?-1:1,1);ctx.drawImage(image,-width/2,-height,width,height);ctx.restore();
 }
}
