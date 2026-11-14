import {comicRoomGeometry,isComicDoorRoom} from './story-comic-room.mjs';
import {isParadeProp,paintParadeProp} from './story-comic-parade.mjs';
// Illustrated props reuse the original opening and street artwork. Characters
// are always intact pose images; this layer never draws or assembles bodies.
export const COMIC_PROP_FILES=Object.freeze({
 'comic-opening-props':'challenge/opening-props-v75.png',
 'comic-encounter-props':'challenge/encounter-props-v2.png',
 'comic-street-props':'challenge/street-props-v2.webp',
 'comic-locked-stand':'challenge/story-props-r3/locked-godmic-stand-r3.png',
 'comic-balloon-mic':'challenge/story-props-r3/balloons-godmic-connected-r3.png',
 'comic-battery-front':'challenge/story-props-r3/battery-front-physical-r3.png',
 'comic-battery-map':'challenge/story-props-r3/battery-map-physical-r3.png',
 'comic-door-closed':'challenge/story-props-r3/secret-stairs-closed-door-oblique.png',
 'comic-door-open':'challenge/story-props-r3/secret-stairs-open-door-oblique.png',
 'comic-hidden-stairs':'challenge/story-props-r3/ending-hidden-stone-stairs-r3.png',
 'comic-mural-hall':'challenge/story-props-r3/ending-east-corridor-mural-r3.png'
});
const MIC=[1186,543,192,444],DOOR=[1049,526,416,473],GATE=[1547,103,473,539],TRUCK=[0,250,1536,620];
const STAND=[270,34,390,1482],BALLOONS=[102,0,790,1510],BATTERY_FRONT=[195,35,900,1135],BATTERY_MAP=[160,35,870,1245];
const valid=(image,r)=>{const w=image?.naturalWidth??image?.width,h=image?.naturalHeight??image?.height;return w>0&&h>0&&(!r||r[0]+r[2]<=w&&r[1]+r[3]<=h);};
export function comicDoorGeometry(scene,layout){
 if(isComicDoorRoom(scene))return comicRoomGeometry(scene,layout);
 const r=layout.art,pushing=scene.focus==='door-push'||scene.prop==='battery-key';
 const height=Math.min(r.height*.94,r.width*(pushing?.54:.92)*DOOR[3]/DOOR[2]),width=height*DOOR[2]/DOOR[3],foot=r.y+r.height*.98;
 const center=r.x+r.width*(pushing?.71:.49);
 return {x:center-width/2,y:foot-height,width,height,foot};
}
export function comicPropReady(scene,images){
 if(!scene.prop)return true;
 if(scene.prop==='gate')return valid(images['comic-street-props'],GATE);
 if(['closed-door','battery-key','open-door'].includes(scene.prop))return valid(images[scene.backdrop])&&(scene.prop==='closed-door'||valid(images['comic-battery-front']));
 if(scene.prop==='truck-stand')return valid(images['comic-truck'],TRUCK)&&valid(images['comic-locked-stand']);
 if(scene.prop==='mic-stand')return valid(images['comic-locked-stand']);
 if(isParadeProp(scene))return valid(images['comic-balloon-mic'])&&valid(images[scene.backdrop])&&(scene.prop==='ribbon-mic'||valid(images['comic-locked-stand']));
 if(scene.prop==='flying-mic')return valid(images['comic-balloon-mic']);
 if(scene.prop==='mic')return scene.actors.some(a=>a.id===scene.micHolder&&a.action==='mic');
 if(['battery-front','battery-map'].includes(scene.prop))return valid(images['comic-'+scene.prop]);
 return ['battery-front','battery-map','mural','team-count','referee-bell'].includes(scene.prop);
}
const label=(c,text,x,y,size=24,color='#263c37')=>{c.font=`900 ${size}px "Noto Sans CJK TC","Microsoft JhengHei",system-ui`;c.textAlign='center';c.textBaseline='middle';c.fillStyle=color;c.fillText(text,x,y);};
function box(c,x,y,w,h,fill='#fff0cc'){c.fillStyle=fill;c.strokeStyle='#263c37';c.lineWidth=3;c.beginPath();c.roundRect(x,y,w,h,5);c.fill();c.stroke();}
function sprite(c,image,r,x,foot,height){const width=height*r[2]/r[3];c.drawImage(image,...r,x-width/2,foot-height,width,height);}
export function comicPropComposition(scene,layout){
 const actorArt={...layout.art};
 if(isComicDoorRoom(scene)){const roomCamera=comicRoomGeometry(scene,layout);return {actorArt,roomCamera};}
 if(isParadeProp(scene)&&layout.landscape){actorArt.width*=.58;return {actorArt};}
 if(!['battery-front','battery-map'].includes(scene.prop))return {actorArt};
 // Two dedicated object close-ups retain the reacting whole figures beside
 // the physical battery; the inscription is also read in the original dialogue.
 const inset={x:actorArt.x+actorArt.width*.56,y:actorArt.y,width:actorArt.width*.44,height:actorArt.height*.94};
 actorArt.width*=.53;
 return {actorArt,inset};
}
function batteryInsert(c,images,r,map){
 const crop=map?BATTERY_MAP:BATTERY_FRONT,scale=Math.min(r.width/crop[2],r.height/crop[3]),w=crop[2]*scale,h=crop[3]*scale;
 c.drawImage(images[map?'comic-battery-map':'comic-battery-front'],...crop,r.x+(r.width-w)/2,r.y+(r.height-h)/2,w,h);
}
export function paintComicProps(c,images,scene,layout,{layer,time=0,reducedMotion=false,background}={}){
 if(!scene.prop)return true;if(!comicPropReady(scene,images))return false;
 const r=layout.art,x=r.x+r.width*((scene.prop==='mic-stand'||scene.prop==='mic')&&scene.actors.length>2?.035:.49),foot=r.y+r.height*.98,u=reducedMotion?1:Math.max(0,Math.min(1,time/2400));
 c.save();try{
  if(layer==='back'){
 if(['closed-door','battery-key','open-door'].includes(scene.prop)&&isComicDoorRoom(scene)){
    if(scene.prop==='open-door'||scene.prop==='battery-key'&&(scene.revealAt===null||u>=scene.revealAt)){
     const key=comicRoomGeometry(scene,layout).key;c.drawImage(images['comic-battery-front'],key.x,key.y,key.width,key.height);
    }
   }else if(['closed-door','battery-key','open-door'].includes(scene.prop)){
    const door=comicDoorGeometry(scene,layout),h=door.height,w=door.width,y=door.y,scale=h/DOOR[3],left=door.x,im=images['comic-encounter-props'];
    c.drawImage(im,...DOOR,left,y,w,h);
    // Keep the carved arch fixed. Only the two illustrated door leaves swing;
    // the opening reveals the generated corridor, never an opaque tall bar.
    if(scene.prop==='open-door'){
     const inner={x:left+78*scale,y:y+144*scale,width:267*scale,height:317*scale},corridor=images['finale-corridor'];
     if(corridor)c.drawImage(corridor,corridor.width*.35,0,corridor.width*.3,corridor.height,inner.x,inner.y,inner.width,inner.height);
     const leaf=inner.width/2*(1-u*.88);c.drawImage(im,1127,670,133,317,inner.x,inner.y,leaf,inner.height);c.drawImage(im,1260,670,134,317,inner.x+inner.width-leaf,inner.y,leaf,inner.height);
    }
    if((scene.prop==='battery-key'&&(scene.revealAt===null||u>=scene.revealAt))||scene.prop==='open-door'){
     const bx=left+w*.873,by=y+h*.645,bw=Math.max(9,w*.06),bh=Math.max(12,h*.067);box(c,bx,by,bw,bh,'#d5ad55');
     c.fillStyle='#69512b';c.fillRect(bx+2,by-2,2,2);c.fillRect(bx+bw-4,by-2,2,2);
    }
   }else if(scene.prop==='gate')sprite(c,images['comic-street-props'],GATE,x,foot,r.height*.56);
   else if(scene.prop==='truck-stand'){
    // The source has large transparent margins. Contain the complete truck and
    // ramp at their painted aspect, rather than independently squeezing height.
    const im=images['comic-truck'],scale=Math.min(r.width*.94/TRUCK[2],r.height*.65/TRUCK[3]),w=TRUCK[2]*scale,h=TRUCK[3]*scale,left=x-w/2;
    c.drawImage(im,...TRUCK,left,foot-h,w,h);
    const mx=left+w*.26,deck=foot-h*.44;
    sprite(c,images['comic-locked-stand'],STAND,mx,deck,r.height*.46);
   }else if(scene.prop==='mic-stand'){
    const count=scene.actors.length,bubble=layout.bubbles[0],right=!(layout.landscape&&bubble?.x>layout.width/2),gap=count<2?.82:1-1/count;
    const mx=r.x+r.width*(right?gap:1-gap),standHeight=Math.min(r.height*.70,r.width*.66);
    sprite(c,images['comic-locked-stand'],STAND,mx,foot,standHeight);
   }else if(isParadeProp(scene))paintParadeProp(c,images,scene,layout,{time,reducedMotion,background});
   else if(scene.prop==='flying-mic'){
    const h=Math.min(r.height*.60,r.width*.50),w=h*BALLOONS[2]/BALLOONS[3],mx=r.x+r.width-w/2-4;
    sprite(c,images['comic-balloon-mic'],BALLOONS,mx,r.y+h+Math.sin(u*Math.PI)*4,h);
   } // The won microphone is already part of the winner's intact native pose.
  }else if(layer==='front'){
   if(scene.prop==='battery-front'||scene.prop==='battery-map'){const inset=comicPropComposition(scene,layout).inset;if(inset)batteryInsert(c,images,inset,scene.prop==='battery-map');}
   if(scene.prop==='mural'){box(c,x-r.width*.22,r.y+8,r.width*.44,38);label(c,'第三盞燈 →',x,r.y+27,Math.min(23,r.width*.06));}
   if(scene.prop==='team-count'||scene.prop==='referee-bell'){
    box(c,x-r.width*.22,r.y+5,r.width*.44,42);label(c,'3 對 4',x,r.y+27,28);
   }
  }
 }finally{c.restore();}return true;
}
