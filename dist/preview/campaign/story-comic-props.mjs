// Illustrated props reuse the original opening and street artwork. Characters
// are always intact pose images; this layer never draws or assembles bodies.
export const COMIC_PROP_FILES=Object.freeze({
 'comic-opening-props':'challenge/opening-props-v75.png',
 'comic-encounter-props':'challenge/encounter-props-v2.png',
 'comic-street-props':'challenge/street-props-v2.webp'
});
const MIC=[1186,543,192,444],DOOR=[1049,526,416,473],GATE=[1547,103,473,539],TRUCK=[0,250,1536,620];
const valid=(image,r)=>{const w=image?.naturalWidth??image?.width,h=image?.naturalHeight??image?.height;return w>0&&h>0&&(!r||r[0]+r[2]<=w&&r[1]+r[3]<=h);};
export function comicDoorGeometry(scene,layout){
 const r=layout.art,pushing=scene.focus==='door-push';
 const height=Math.min(r.height*.94,r.width*(pushing?.54:.92)*DOOR[3]/DOOR[2]),width=height*DOOR[2]/DOOR[3],foot=r.y+r.height*.98;
 const center=r.x+r.width*(pushing?.71:.49);
 return {x:center-width/2,y:foot-height,width,height,foot};
}
export function comicPropReady(scene,images){
 if(!scene.prop)return true;
 if(scene.prop==='gate')return valid(images['comic-street-props'],GATE);
 if(['closed-door','battery-key','open-door'].includes(scene.prop))return valid(images['comic-encounter-props'],DOOR);
 if(scene.prop==='truck-stand')return valid(images['comic-truck'],TRUCK)&&valid(images['comic-opening-props'],MIC);
 if(['mic','flying-mic','ribbon-mic','mic-stand'].includes(scene.prop))return valid(images['comic-opening-props'],MIC);
 return ['battery-front','battery-map','mural','team-count','referee-bell'].includes(scene.prop);
}
const label=(c,text,x,y,size=24,color='#263c37')=>{c.font=`900 ${size}px "Noto Sans CJK TC","Microsoft JhengHei",system-ui`;c.textAlign='center';c.textBaseline='middle';c.fillStyle=color;c.fillText(text,x,y);};
function box(c,x,y,w,h,fill='#fff0cc'){c.fillStyle=fill;c.strokeStyle='#263c37';c.lineWidth=3;c.beginPath();c.roundRect(x,y,w,h,5);c.fill();c.stroke();}
function sprite(c,image,r,x,foot,height){const width=height*r[2]/r[3];c.drawImage(image,...r,x-width/2,foot-height,width,height);}
export function comicPropComposition(scene,layout){
 const actorArt={...layout.art};if(!['battery-front','battery-map'].includes(scene.prop))return {actorArt};
 // On a short phone frame the exact label and route remain in the original
 // progressive dialogue. A second large caption must not shrink actors to dots.
 if(layout.height<240)return {actorArt,inset:null};
 const left=layout.bubbles.at(-1),below=left?left.y+left.height+14:14,available=layout.height-14-below;
 const leftInset=layout.landscape&&available>=106,width=Math.min(286,leftInset?left.width:actorArt.width-8),height=106;
 const inset={x:leftInset?14:actorArt.x+(actorArt.width-width)/2,y:leftInset?below:actorArt.y,width,height};
 if(!leftInset){actorArt.y+=height+6;actorArt.height-=height+6;}
 return {actorArt,inset};
}
function batteryInsert(c,r,map){
 const {x,y,width,height}=r;box(c,x,y,width,height,'#d5ad55');box(c,x+5,y+5,width-10,height-10);
 c.save();c.translate(x+width/2,y+height/2);
 if(!map){label(c,'議會無限城製造',0,-25,24);c.strokeStyle='#b34d39';c.lineWidth=3;c.strokeRect(-width*.38,1,width*.76,38);label(c,'過保失效',0,21,26,'#b34d39');}
 else{label(c,'議會內密道',0,-31,22);c.strokeStyle='#b34d39';c.lineWidth=2;c.setLineDash([4,3]);c.beginPath();c.moveTo(-width*.34,-3);c.lineTo(width*.34,-3);c.lineTo(-width*.34,34);c.lineTo(width*.34,34);c.stroke();c.setLineDash([]);for(const [text,x,y]of [['東廊',-width*.32,-3],['第三盞燈',width*.26,-3],['壁畫',-width*.32,34],['階梯 → 無限城',width*.18,34]])label(c,text,x,y,17);}
 c.restore();
}
export function paintComicProps(c,images,scene,layout,{layer,time=0,reducedMotion=false}={}){
 if(!scene.prop)return true;if(!comicPropReady(scene,images))return false;
 const r=layout.art,x=r.x+r.width*.49,foot=r.y+r.height*.98,u=reducedMotion?1:Math.max(0,Math.min(1,time/2400));
 c.save();try{
  if(layer===(['flying-mic','ribbon-mic','mic-stand'].includes(scene.prop)?'front':'back')){
   if(['closed-door','battery-key','open-door'].includes(scene.prop)){
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
    const mx=left+w*.26,deck=foot-h*.44,my=deck-r.height*.18;
    c.strokeStyle='#463c37';c.lineWidth=3;c.beginPath();c.moveTo(mx,my);c.lineTo(mx,deck);c.moveTo(mx-9,deck);c.lineTo(mx+9,deck);c.stroke();
    sprite(c,images['comic-opening-props'],MIC,mx,my,r.height*.16);
   }else if(['mic','mic-stand','flying-mic','ribbon-mic'].includes(scene.prop)&&!(scene.prop==='mic'&&scene.actors.some(a=>a.id==='su'&&a.pose===2||a.id==='wang'&&[0,1].includes(a.pose)))){
    const fly=['flying-mic','ribbon-mic'].includes(scene.prop),mx=fly?r.x+r.width*(scene.prop==='flying-mic'?.17:.45)+(u-.5)*r.width*.05:x,my=fly?r.y+r.height*.24:foot-r.height*.27;
    if(scene.prop==='mic-stand'||scene.prop==='mic'){c.strokeStyle='#463c37';c.lineWidth=4;c.beginPath();c.moveTo(mx,my);c.lineTo(mx,foot);c.moveTo(mx-14,foot);c.lineTo(mx+14,foot);c.stroke();}
    if(scene.prop==='ribbon-mic'){c.strokeStyle='#b44c36';c.lineWidth=4;c.beginPath();c.moveTo(r.x+r.width*.85,r.y);c.quadraticCurveTo(mx-24,my-45,mx,my-20);c.stroke();}
    sprite(c,images['comic-opening-props'],MIC,mx,my,r.height*(fly?.18:.24));
   }
  }else if(layer==='front'){
   if(scene.prop==='battery-front'||scene.prop==='battery-map'){const inset=comicPropComposition(scene,layout).inset;if(inset)batteryInsert(c,inset,scene.prop==='battery-map');}
   if(scene.prop==='mural'){box(c,x-r.width*.22,r.y+8,r.width*.44,38);label(c,'第三盞燈 →',x,r.y+27,Math.min(23,r.width*.06));}
   if(scene.prop==='team-count'||scene.prop==='referee-bell'){
    box(c,x-r.width*.22,r.y+5,r.width*.44,42);label(c,'3 對 4',x,r.y+27,28);
   }
  }
 }finally{c.restore();}return true;
}
