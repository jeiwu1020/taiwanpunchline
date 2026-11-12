import {drawAttachedProp} from './challenge-joints.mjs?v=post69-street-seam-cull-20261112-r1';
import {drawStreetSeamRepairs} from './street-seam-repair.mjs?v=post69-street-seam-cull-20261112-r1';
import {drawChallengeArenaBackdrop} from './challenge-arena-backdrop.mjs?v=post69-street-seam-cull-20261112-r1';
import {fighterPose,clamp} from './art-motion.mjs?v=post69-street-seam-cull-20261112-r1';

// New generated, fictional campaign characters. No politician portraits are reused.
export const ART_FILES={
 'challenge-arena-layer':'challenge/arena-foreground-r1.png',
 'challenge-arena-sky':'challenge/arena-sky-r1.png',
 'challenge-street-left-repair':'challenge/street-left-repair-v77.png',
 'challenge-street-right-repair':'challenge/street-right-repair-v77.png',
 'challenge-street-facade':'challenge/street-facade-v75.webp',
 'challenge-street-sky':'challenge/street-sky-v75.webp',
 'challenge-supply':'challenge/supply-stand-v75.webp',
 'challenge-mobs':'challenge/mob-atlas-v1.webp',
 'challenge-street':'challenge/street-v1.webp',
 'challenge-street-deep':'challenge/street-deep-v2.webp',
 'challenge-arena':'challenge/arena-v2.webp',
 'challenge-street-props':'challenge/street-props-v2.webp',
 'challenge-captains':'challenge/captain-atlas-v2.webp',
 'challenge-bedroom':'challenge/bedroom-v1.webp',
 'challenge-pajamas':'challenge/pajamas-v1.webp'
};
export const CHALLENGE_ART_FILES=ART_FILES;
export const CHALLENGE_GROUND_Y=430;
const rows=[
 {head:[8,0,311,274],body:[338,0,255,274],upper:[637,0,183,274],fore:[898,0,172,274],thigh:[1120,0,220,274],shin:[1393,0,216,274],prop:[1630,0,284,274]},
 {head:[0,278,325,264],body:[337,278,262,264],upper:[632,278,194,264],fore:[894,278,179,264],thigh:[1115,278,225,264],shin:[1393,278,216,264],prop:[1624,278,290,264]},
 {head:[8,550,310,272],body:[332,550,269,272],upper:[628,550,202,272],fore:[893,550,183,272],thigh:[1111,550,229,272],shin:[1388,550,222,272],prop:[1622,550,292,272]}
];
const captainRows=[
 {head:[19,6,428,488],body:[552,22,405,458],prop:[1049,15,466,479]},
 {head:[37,525,420,485],body:[549,531,397,480],prop:[1073,525,428,495]}
];
const neckSkin=[[145,164,42,65],[120,444,46,64],[85,742,35,55]];
// The guard atlas includes a rear neck stump below the ear, separate from the
// central throat used by the body rig. Follow the original ear/jaw ink instead
// of leaving that second neck floating behind the collar. Atlas coordinates
// keep this mask attached to the head during bobbing, reactions and mirroring.
const guardHeadOutline=[[8,550],[318,550],[318,822],[85,822],[85,804],[72,794],[65,784],[62,773],[62,754],[53,753],[44,749],[36,743],[30,735],[8,730]];
export const CHALLENGE_SCENE_FRAMES=Object.freeze({street:{width:1536,height:1024,curb:715},arena:{width:1536,height:1024,curb:670}});
export const CHALLENGE_PROP_FRAMES=Object.freeze({table:[101,130,1244,513],sign:[1547,103,473,539]});
// Canvas raster boundaries are shared by both table planes and all depth
// bands, including a DPR-scaled or quarter-turned canvas.
function tableRasterFrame(ctx,x){
 const matrix=ctx.getTransform?.(),vertical=Math.abs(matrix?.d??1)>=Math.abs(matrix?.c??0);
 const scale=vertical?(matrix?.d??1):(matrix?.c??1),offset=vertical?((matrix?.b??0)*x+(matrix?.f??0)):((matrix?.a??0)*x+(matrix?.e??0));
 return {snap:value=>(Math.round(value*scale+offset)-offset)/scale,padding:2/Math.max(Math.abs(scale),.001)};
}
/** Paint every depth band with the identical full-table texture mapping.
 * Only the table is clipped. Internal cuts and the top/front joint share
 * device-pixel boundaries, while the exact landing plane stays unchanged. */
export function drawChallengeTabletopBand(ctx,image,{x,y,width,height,from=0,to=1}){
 if(!(height>0&&to>from))return;
 const {snap,padding}=tableRasterFrame(ctx,x),start=from<=0?y-padding:snap(y+height*from),end=snap(y+height*to);
 if(end<=start)return;
 ctx.save();ctx.beginPath();ctx.rect(x-width-1,start,width*3+2,end-start);ctx.clip();
 // Sample the whole crop, then clip. Its extra apron pixels supply the half
 // pixel beyond the projected edge without a cropped-image antialias seam.
 ctx.drawImage(image,101,130,1244,513,x,y,width,height*513/80);ctx.restore();
}
export function drawChallengeTableFront(ctx,image,{x,y,width,height}){
 if(!(height>0))return;
 const {snap,padding}=tableRasterFrame(ctx,x),start=snap(y),end=y+height+padding;
 ctx.save();ctx.beginPath();ctx.rect(x-width-1,start,width*3+2,end-start);ctx.clip();
 ctx.drawImage(image,101,130,1244,513,x,y-height*80/433,width,height*513/433);ctx.restore();
}
const aliases={placard:'mic',leaflet:'flyer',barricade:'guard'};
export function challengeMobKind(mob){const k=mob.mobKind||mob.template||mob.kind||'mic';return aliases[k]||k;}
const crop=(ctx,img,r,x,y,w,h)=>ctx.drawImage(img,...r,x,y,w,h);
function bone(ctx,img,r,a,b,w,cap=5){ctx.save();ctx.translate(a.x,a.y);ctx.rotate(Math.atan2(b.y-a.y,b.x-a.x)-Math.PI/2);crop(ctx,img,r,-w/2,-cap,w,Math.hypot(b.x-a.x,b.y-a.y)+cap*2);ctx.restore();}
function forearm(ctx,img,r,a,prop,row){
 const wristFraction=row===0?.66:row===1?.64:.59;
 const length=Math.hypot(a.wrist.x-a.elbow.x,a.wrist.y-a.elbow.y),h=length/wristFraction,w=30;
 ctx.save();ctx.translate(a.elbow.x,a.elbow.y);ctx.rotate(Math.atan2(a.wrist.y-a.elbow.y,a.wrist.x-a.elbow.x)-Math.PI/2);
 if(prop){crop(ctx,img,[r[0],r[1],r[2],r[3]*wristFraction],-w/2,-4,w,length+4);}
 else crop(ctx,img,r,-w/2,-4,w,h+4);
 ctx.restore();
}
/** Local foot origin, like drawFighterArt. Caller owns world translation/facing. */
export function drawChallengeMob(ctx,images,mob,time=0,{shadow=true}={}){
 const img=images['challenge-mobs'];if(!img)return null;
 const kind=challengeMobKind(mob),row=kind==='flyer'?1:kind==='guard'||kind==='mini_guard'?2:0,c=rows[row];
 const captain=kind.startsWith('mini_')&&images['challenge-captains']?captainRows[kind==='mini_guard'?1:0]:null,portrait= captain?images['challenge-captains']:img,parts=captain||c;
 const p=fighterPose({...mob,type:'wang',supportY:mob.supportY??430},time);
 ctx.save();
 if(shadow){ctx.fillStyle='#33241538';ctx.beginPath();ctx.ellipse(0,2,37,7,0,0,Math.PI*2);ctx.fill();}
 if(kind.startsWith('mini_'))ctx.scale(1.1,1.06);
 const leg=l=>{bone(ctx,img,c.thigh,l.hip,l.knee,29);bone(ctx,img,[c.shin[0],c.shin[1],c.shin[2],c.shin[3]*.72],l.knee,l.ankle,25,3);crop(ctx,img,[c.shin[0],c.shin[1]+c.shin[3]*.69,c.shin[2],c.shin[3]*.31],l.ankle.x-13,l.ankle.y-5,39,16);};
 leg(p.legs.far);leg(p.legs.near);
 ctx.translate(p.bodyX,p.bodyY);
 bone(ctx,img,c.upper,p.farArm.shoulder,p.farArm.elbow,26);forearm(ctx,img,c.fore,p.farArm,false,row);
 crop(ctx,portrait,parts.body,-45,-171,90,112);
 // Original heads end at the chin. The guard's broad jaw needs a little
 // clearance above the collar and a tapered throat sampled from its cheek,
 // not the mouth edge. Captain heads already include their own neck.
 const guardNeck=!captain&&row===2,broadCaptain=Boolean(captain&&kind==='mini_guard');

 if(guardNeck){
  ctx.save();ctx.beginPath();ctx.moveTo(-9,-179);ctx.lineTo(13,-179);ctx.lineTo(14,-162);ctx.lineTo(16,-154);ctx.lineTo(14,-141);ctx.lineTo(7,-149);ctx.lineTo(-2,-156);ctx.lineTo(-9,-164);ctx.closePath();ctx.clip();
  crop(ctx,img,neckSkin[row],-9,-179,25,38);ctx.restore();
 }else if(!captain)crop(ctx,img,neckSkin[row],-10,-180,27,34);
 // Seat this captain's original broad neck inside its existing collar.
 ctx.save();ctx.translate(broadCaptain?5:1,(guardNeck?-162:broadCaptain?-145:-156)+p.bob);
 // Rotate the broad portrait around its rear neck insertion, so recoil cannot lift a gap.
 if(broadCaptain)ctx.translate(-35,-10);
 ctx.rotate(p.headAngle);
 if(broadCaptain)ctx.translate(35,10);
 if(guardNeck){
  ctx.beginPath();guardHeadOutline.forEach(([x,y],i)=>ctx[i?'lineTo':'moveTo'](-55+(x-c.head[0])*111/c.head[2],-107+(y-c.head[1])*111/c.head[3]));ctx.closePath();ctx.clip();
 }

 crop(ctx,portrait,parts.head,captain?-53:-55,captain?-119:-107,captain?108:111,captain?123:111);ctx.restore();
 // Seat the neck behind its own front collar, without moving the arm skeleton
 // or painting a flat-colored patch over the generated engraving.
 ctx.save();ctx.beginPath();
 if(guardNeck){
  // Follow this vest's two actual collar leaves. The generic diagonal mask
  // cut across its right-shifted V and left a straight skin-colored patch.
  ctx.moveTo(-7,-157);ctx.lineTo(8,-147);ctx.lineTo(-5,-139);ctx.lineTo(-13,-155);ctx.closePath();
  ctx.moveTo(15,-155);ctx.lineTo(27,-139);ctx.lineTo(19,-144);ctx.lineTo(14,-139);ctx.closePath();
 }else if(broadCaptain){
  // Repaint only the actual shoulder/front collar, leaving its neck opening clear.
  ctx.rect(-55,-146,110,100);
  ctx.moveTo(-55,-190);ctx.lineTo(-10,-190);ctx.lineTo(-10,-169);ctx.lineTo(-8,-165);ctx.lineTo(3,-157);ctx.lineTo(8,-152);ctx.lineTo(11,-143);ctx.lineTo(-55,-130);ctx.closePath();
  ctx.moveTo(16,-162);ctx.lineTo(18,-163);ctx.lineTo(30,-144);ctx.lineTo(20,-153);ctx.lineTo(11,-142);ctx.lineTo(16,-156);ctx.closePath();
 }else{ctx.moveTo(-18,-161);ctx.lineTo(-3,-153);ctx.lineTo(13,-157);ctx.lineTo(30,-147);ctx.lineTo(17,-133);ctx.lineTo(-10,-143);ctx.closePath();}
 ctx.clip();crop(ctx,portrait,parts.body,-45,-171,90,112);ctx.restore();
 bone(ctx,img,c.upper,p.arm.shoulder,p.arm.elbow,30);forearm(ctx,img,c.fore,p.arm,true,row);
 // The atlas prop already contains its hand and cuff. Measure its inlet.
 const held=captain?{rect:parts.prop,width:kind==='mini_guard'?88:82,height:kind==='mini_guard'?102:85,anchor:kind==='mini_guard'?[.05,.88,-.25]:[.05,.86,-.5]}:
  row===0?{rect:c.prop,width:70,height:68,anchor:[.13,.88,-.65]}:
  row===1?{rect:c.prop,width:73,height:66,anchor:[.12,.89,-.7]}:
  {rect:c.prop,width:86,height:98,anchor:[.12,.90,-.35]};
 drawAttachedProp(ctx,portrait,held.rect,p.arm,held);
 ctx.restore();return p;
}
/** Continue the original street with grain-sized asphalt, not a stretched edge.
 * The source band is below the manhole and above the painted bottom line.
 * Overlap and stagger the samples in world space; neither a taller viewport
 * nor a retained-cache margin changes an existing pixel's source coordinates.
 * This is painted only when the retained backdrop is built, never per frame. */
function drawStreetAsphalt(ctx,img,x,edge,width,bottom,scale){
 const sx=320,sy=944,sw=1096,sh=44,overlap=16,stepY=sh-overlap,stepX=sw-overlap;
 const alpha=Number.isFinite(ctx.globalAlpha)?ctx.globalAlpha:1;
 ctx.save();ctx.beginPath();ctx.rect(x,edge,width,bottom-edge);ctx.clip();
 for(let row=0,dy=edge-overlap*scale;dy<bottom;row++,dy=edge+(row*stepY-overlap)*scale){
  // A prime stride avoids aligned repeats without randomness or mirror folds.
  const phase=(row*337)%stepX;
  for(let col=-1,dx=x-(phase+stepX)*scale;dx<x+width;col++,dx=x+(col*stepX-phase)*scale){
   // Feather source-sized strips. All samples retain equal X/Y scale.
   for(let iy=0;iy<=4;iy++){
    const oy=iy<4?iy*4:overlap,h=iy<4?4:sh-overlap,ay=row===0||iy===4?1:(iy+.5)/4;
    for(let ix=0;ix<=4;ix++){
     const ox=ix<4?ix*4:overlap,w=ix<4?4:sw-overlap,ax=col===-1||ix===4?1:(ix+.5)/4;
     ctx.globalAlpha=alpha*ax*ay;
     crop(ctx,img,[sx+ox,sy+oy,w,h],dx+ox*scale,dy+oy*scale,w*scale,h*scale);
    }
   }
  }
 }
 // Match the darker foreground edge using a constant tint, not a gradient
 // tied to cache height. Grain contrast and scale stay stable while panning.
 ctx.globalAlpha=alpha;ctx.fillStyle='rgba(52,43,42,.18)';ctx.fillRect(x,edge,width,bottom-edge);ctx.restore();
}
/** Sky is one continuous viewport layer, never part of a repeated world tile. */
export function hasLayeredStreet(images){return ['challenge-street-facade','challenge-street-sky'].every(key=>images[key]?.width>0&&images[key]?.height>0);}
export function drawChallengeSky(ctx,image,{width,top=0,bottom}){
 const height=bottom-top;if(!image||width<=0||height<=0)return false;
 const sourceWidth=image.naturalWidth||image.width,sourceHeight=image.naturalHeight||image.height;
 const scale=Math.max(width/sourceWidth,height/sourceHeight),sw=width/scale,sh=height/scale;
 crop(ctx,image,[(sourceWidth-sw)/2,(sourceHeight-sh)/2,sw,sh],0,top,width,height);return true;
}
/** Generated upper/road extensions cover the whole destination, including jump
 * panning. buildingHeight is curb-to-image-top (sky included), in destination
 * pixels. camera is already destination-space parallax; top/bottom are bounds. */
export function drawChallengeBackdrop(ctx,images,{width=960,height=540,curbY=370,buildingHeight=489,camera=0,arena=false,top=0,bottom=height,facadeOnly=false}={}){
 if(arena)return drawChallengeArenaBackdrop(ctx,images,{width,height,curbY,buildingHeight,camera,top,bottom});
 const layered=!arena&&hasLayeredStreet(images);
 const key=arena?'challenge-arena':layered?'challenge-street-facade':'challenge-street-deep',img=images[key]||images['challenge-street'];if(!img)return false;
 const frame=images[key]?CHALLENGE_SCENE_FRAMES[arena?'arena':'street']:{width:2172,height:724,curb:539};
 const scale=Math.max(.02,buildingHeight/frame.curb),tileW=frame.width*scale,tileH=frame.height*scale,y=curbY-buildingHeight;
 ctx.save();ctx.beginPath();ctx.rect(0,top,width,bottom-top);ctx.clip();
 if(layered&&!facadeOnly)drawChallengeSky(ctx,images['challenge-street-sky'],{width,top,bottom});
 for(let index=Math.floor(camera/tileW),x=index*tileW-camera;x<width;index++,x=index*tileW-camera){
  // Use the absolute world tile index, not the viewport slot. Adjacent copies
  // meet at the same source edge, without flipping when the camera wraps.
  ctx.save();if(index%2!==0){ctx.translate(2*x+tileW,0);ctx.scale(-1,1);}
  // A one-pixel image edge becomes vertical coloured columns when a tall
  // viewport reveals more sky. Continue atmospheric colour instead of
  // stretching that scanline or repeating the sun/cloud band.
  if(!layered&&y>top){
   const sky=ctx.createLinearGradient?.(0,top,0,y);
   if(sky){sky.addColorStop(0,arena?"#667986":"#8a739b");sky.addColorStop(1,arena?"#d7c7ac":"#c8a8c0");}
   ctx.fillStyle=sky||(arena?"#aab1ad":"#b69abb");ctx.fillRect(x,top,tileW,y-top+1);
  }
  const edge=y+tileH;if(edge<bottom){
   if(!arena&&(layered||images['challenge-street-deep']))drawStreetAsphalt(ctx,img,x,edge,tileW,bottom,scale);
   else{
    // Legacy street/arena fallback keeps its existing presentation.
    ctx.save();ctx.translate(0,edge-1+bottom);ctx.scale(1,-1);
    crop(ctx,img,[0,frame.height-16,frame.width,16],x,edge-1,tileW,bottom-edge+1);ctx.restore();
   }
  }
  crop(ctx,img,[0,0,frame.width,frame.height],x,y,tileW,tileH);
  ctx.restore();
 }
 if(layered)drawStreetSeamRepairs(ctx,images,{width,camera,tileWidth:tileW,scale,y});
 ctx.restore();return true;
}
/** Bottom-centred props. Explicit width/height let the visible top match the
 * existing collision plane without changing gameplay or actor scale. */
export function drawChallengeStreetProp(ctx,images,kind,{x=0,y=430,width=kind==='table'?280:82,height=kind==='table'?116:94,depthHalf=null,depthScale=.65}={}){
 const img=images['challenge-street-props'],frame=CHALLENGE_PROP_FRAMES[kind];if(!img||!frame)return false;
 if(kind==='table'){
  // In a horizontal duel the sole playable lane crosses the middle of the
  // tabletop, not its back edge. Depth routes retain their full footprint.
  const top=y-height,half=Number.isFinite(depthHalf)?depthHalf*depthScale:height*40/513;
  // Keep the generated grain and contour; give the top the same projected
  // depth as its landing footprint instead of shrinking it with the legs.
  drawChallengeTableFront(ctx,img,{x:x-width/2,y:top+half,width,height:Math.max(1,height-half)});
  drawChallengeTabletopBand(ctx,img,{x:x-width/2,y:top-half,width,height:half*2});
 }else crop(ctx,img,frame,x-width/2,y-height,width,height);
 return true;
}
/** Screen-space background. Ground actors stand at y=430 by default. */
export function drawChallengeScene(ctx,images,{width=960,height=540,camera=0,segment=0,worldWidth=3600,groundY=430}={}){
 // Keep a door near an adult's height even in a 3600px world. The previous
 // cover scaling enlarged the same small storefront across the entire route.
 return drawChallengeBackdrop(ctx,images,{width,height,curbY:groundY-30,buildingHeight:489,camera:(Number(camera)||Number(segment)*900)*.25,top:-600,bottom:Math.max(height,groundY+1000)});
}
/** A generated sleepwear cutout fitted to the selected existing portrait. */
export function drawChallengePajamas(ctx,images,type='wang',time=0){
 const body=images['challenge-pajamas'],head=images[type+'-head'];if(!body||!head)return false;
 const bob=Math.sin(time*.0025)*1.3;
 ctx.save();ctx.translate(0,bob);
 crop(ctx,body,[49,21,1072,1341],-67,-183,143,183);
 // Neck opening in the generated body is centred slightly right of the belly.
 ctx.drawImage(head,-48,-280,112,114);ctx.restore();return true;
}
export function drawChallengeOpening(ctx,images,{width=960,height=540,type='wang',phase=0,time=0,drawPlayer=true}={}){
 const bg=images['challenge-bedroom'];if(bg)ctx.drawImage(bg,0,0,width,height);
 if(drawPlayer){ctx.save();ctx.translate(width*(.48+clamp(typeof phase==='number'?phase:0)*.21),height*.88);drawChallengePajamas(ctx,images,type,time);ctx.restore();}
 return !!bg;
}

/** Generated supply art shares one bottom-centre anchor in both route renderers. */
export function drawChallengeSupply(ctx,images,{x=0,y=430,width=90}={}){
 const img=images['challenge-supply'];if(!img)return false;
 const height=width*(img.height||1254)/(img.width||1254);
 ctx.drawImage(img,x-width/2,y-height,width,height);return true;
}
