const STATIONS=Object.freeze({
 2:{kind:'public-address',crop:[17,16,681,700],label:'先聽清楚'},
 3:{kind:'verification',crop:[737,27,693,687],label:'先核對資料'},
 4:{kind:'hydration',crop:[1477,58,683,640],label:'喝水慢慢排'}
});
export function streetMotifPlan(chapter,route=0,worldWidth=2500){
 const station=STATIONS[chapter];if(!station)return [];
 return [310,Math.min(worldWidth-330,1250+route*150)].map(x=>({...station,x,depth:-195,width:190,height:175}));
}
/** Extra generated sidewalk props; accepted backdrops and all collisions stay
 * shared. In chapter two this is anonymous public-address equipment only. */
export function drawChapterStreetMotifs(ctx,image,frame,{chapter,route=0,worldWidth=2500,width=ctx.canvas.width}={}){
 if(!image)return;
 for(const p of streetMotifPlan(chapter,route,worldWidth)){
  const x=(p.x-frame.left)*frame.zoom,y=frame.base+p.depth*.65*frame.zoom,k=Math.min(p.width/p.crop[2],p.height/p.crop[3])*frame.zoom,w=p.crop[2]*k,h=p.crop[3]*k;
  if(x+w/2<0||x-w/2>width)continue;ctx.drawImage(image,...p.crop,x-w/2,y-h,w,h);
  ctx.save();ctx.fillStyle='#173f38';ctx.textAlign='center';ctx.textBaseline='middle';ctx.font=`900 ${Math.max(9,13*frame.zoom)}px Microsoft JhengHei,system-ui`;
  ctx.fillText(p.label,x+(chapter===4?w*.2:0),y-h*(chapter===4?.86:.4),w*.7);ctx.restore();
 }
}
