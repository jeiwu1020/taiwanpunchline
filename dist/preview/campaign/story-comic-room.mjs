// The generated closed/open room is one painting. Do not overlay a second door.
const ROOM_WIDTH=1536,ROOM_HEIGHT=1024;
export const isComicDoorRoom=scene=>['comic-door-closed','comic-door-open'].includes(scene.backdrop);
export function comicRoomGeometry(scene,layout){
 // The room fills the comic frame, including the space behind its bubble.
 // Actor layout still respects layout.art; the room camera must not produce
 // an empty paper band above the actors in portrait orientation.
 const r={x:layout.pad,y:layout.pad,width:layout.width-layout.pad*2,height:layout.height-layout.pad*2},scale=Math.max(r.width/ROOM_WIDTH,r.height/ROOM_HEIGHT),sw=r.width/scale,sh=r.height/scale;
 // The right jamb carries the battery contacts. Keep it in portrait crops.
 const sx=Math.max(0,Math.min(ROOM_WIDTH-sw,1352-sw*.82)),sy=Math.max(0,Math.min(ROOM_HEIGHT-sh,562-sh*.18));
 const point=(x,y)=>({x:r.x+(x-sx)*scale,y:r.y+(y-sy)*scale});
 const tl=point(606,160),br=point(1270,824),floor=point(1180,920),contact=point(1352,562);
 return {source:[sx,sy,sw,sh],target:r,point,x:tl.x,y:tl.y,width:br.x-tl.x,height:br.y-tl.y,foot:floor.y,
  handX:Math.min(point(1230,700).x,r.x+r.width*.76),key:{x:contact.x-32*scale,y:contact.y-9*scale,width:64*scale,height:58.5*scale}};
}
export function paintComicRoom(ctx,image,scene,layout){
 const room=comicRoomGeometry(scene,layout),r=room.target;
 ctx.fillStyle='#fff3d3';ctx.fillRect(0,0,layout.width,layout.height);
 ctx.drawImage(image,...room.source,r.x,r.y,r.width,r.height);
 return room;
}
