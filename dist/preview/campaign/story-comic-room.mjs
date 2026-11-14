// The generated closed/open room is one painting. Do not overlay a second door.
const ROOM_WIDTH=1536,ROOM_HEIGHT=1024;
export const isComicDoorRoom=scene=>['comic-door-closed','comic-door-open'].includes(scene.backdrop);
// Fractions measured on the intact approved push crops, not movable limbs.
export const DOOR_PUSH_CONTACTS=Object.freeze({
 su:{palm:[.904,.29],secondPalm:[.926,.475],sole:.943},
 ma:{palm:[.945,.36],secondPalm:[.955,.47],sole:.974}
});
export function comicRoomGeometry(scene,layout){
 if(layout.roomCamera)return layout.roomCamera;
 // Fill the frame with the same oblique painting. Portrait push shots favor
 // the near leaf and the whole pusher; only key shots need the right socket.
 // The frame camera is independent of the live sentence and actor safe area.
 const r={x:layout.pad,y:layout.pad,width:layout.width-layout.pad*2,height:layout.height-layout.pad*2};
 const scale=Math.max(r.width/ROOM_WIDTH,r.height/ROOM_HEIGHT),sw=r.width/scale,sh=r.height/scale;
 const focus=layout.landscape?1410-sw*.91:scene.focus==='door-push'?1010-sw*.85:scene.prop==='battery-key'?1410-sw*.82:1070-sw*.5;
 const sx=Math.max(0,Math.min(ROOM_WIDTH-sw,focus)),sy=layout.landscape?Math.max(0,Math.min(ROOM_HEIGHT-sh,930-sh)):0;
 const point=(x,y)=>({x:r.x+(x-sx)*scale,y:r.y+(y-sy)*scale});
 const tl=point(830,170),br=point(1350,825),floor=point(950,840),contact=point(1410,550);
 return {source:[sx,sy,sw,sh],target:r,point,x:tl.x,y:tl.y,width:br.x-tl.x,height:br.y-tl.y,foot:floor.y,
  handX:point(1010,650).x,key:{x:contact.x-32*scale,y:contact.y-9*scale,width:64*scale,height:58.5*scale}};
}
export function paintComicRoom(ctx,image,scene,layout){
 const room=comicRoomGeometry(scene,layout),r=room.target;
 ctx.fillStyle='#fff3d3';ctx.fillRect(0,0,layout.width,layout.height);
 ctx.drawImage(image,...room.source,r.x,r.y,r.width,r.height);
 return room;
}
