import {backgroundCachePolicy} from './background-cache-policy.mjs?v=post69-street-seam-cull-20261112-r1';
import {hasStreetSeamRepairs,invalidateStreetSeamRepairs} from './street-seam-repair.mjs?v=post69-street-seam-cull-20261112-r1';
import {drawChallengeBackdrop,drawChallengeSky,hasLayeredStreet,CHALLENGE_SCENE_FRAMES} from './challenge-art.mjs?v=post69-street-seam-cull-20261112-r1';

// Canonical repeating world columns, split into finite 256-world-unit rows.
// Density tiers are rounded UP from the present projection, never from the
// far coverage multiplied by a hypothetical maximum near-camera zoom.
const ROW=256,BLEED=2,MAX_PIXELS=32*1024*1024;
const tier=n=>2**(Math.ceil(Math.log2(n)*2-1e-10)/2);
export function createDepthBackdropRenderer(scene,images){
 const key='challenge-depth-backdrop',pool=[],displays=[],joined=[];
 let joinPlan=null;
 let policy='retained',policySwitches=0,coverage=null;
 let signature='',sources=[],skyTexture=null,skyDisplay=null,skySource=null,legacyTop=null,pendingBands=[];
 const stats={builds:0,releases:0,fallbacks:0,pendingFallbacks:0,pixels:0,lastBuildPixels:0,pending:0,reason:'empty',joinCopies:0,joinResets:0,joinedPixels:0};
 function resetJoin(){for(const slot of joined){slot.texture.setSize(1,1);slot.done.clear();}joinPlan=null;stats.joinedPixels=0;stats.joinResets++;for(const tile of displays)tile.setVisible(false);}
 function hide(){for(const tile of displays)tile.setVisible(false);skyDisplay?.setVisible(false);}
 function release(slot){if(slot.id!==null||slot.texture.width!==1||slot.texture.height!==1){slot.texture.setSize(1,1);slot.id=null;stats.releases++;}}
 function reset(reason='reset'){hide();resetJoin();for(const tile of displays)tile.setCrop?.();coverage=null;for(const slot of pool)release(slot);skyTexture?.setSize(1,1);signature='';sources=[];skySource=null;legacyTop=null;pendingBands=[];stats.pixels=0;stats.pending=0;stats.lastBuildPixels=0;stats.reason=reason;}
 function invalidateSurface(){reset('surface');invalidateStreetSeamRepairs(images);}
 function fallback(){reset('budget');stats.fallbacks++;return false;}
 function availableSlot(){
  let slot=pool.find(s=>s.id===null);
  if(!slot){const textureKey=pool.length?key+'-'+pool.length:key;slot={id:null,key:textureKey,texture:scene.textures.createCanvas(textureKey,1,1)};pool.push(slot);}
  return slot;
 }
 // #66 allocation policy: highest reserved density and accumulated coverage,
 // rebuilt as whole parity tiles. Its 32 Mi-pixel guard is ONLY static tiles
 // plus sky, not the finite policy's total managed-surface envelope.
 function drawRetained(bg,scaleX,scaleY,retained){
  const layered=hasLayeredStreet(images),repaired=layered&&hasStreetSeamRepairs(images);
  const skyWidth=Math.max(1,Math.round(bg.width*scaleX)),skyHeight=Math.max(1,Math.round(bg.height*scaleY));
  if(layered&&(skyWidth>8192||skyHeight>8192||skyWidth*skyHeight>MAX_PIXELS))return fallback();
  if(retained){scaleX=retained.scaleX;scaleY=retained.scaleY;}
  if(![scaleX,scaleY].every(Number.isFinite)||Math.min(scaleX,scaleY)<=0)return fallback();
  const image=layered?images['challenge-street-facade']:images['challenge-street-deep']||images['challenge-street'];
  const frame=layered||images['challenge-street-deep']?CHALLENGE_SCENE_FRAMES.street:{width:2172,height:724,curb:539};
  const sourceList=[image,images['challenge-street-sky'],images['challenge-street-left-repair'],images['challenge-street-right-repair']];
  const tileWidth=frame.width*Math.max(.02,bg.buildingHeight/frame.curb),pw=Math.max(1,Math.ceil(tileWidth*scaleX)),paddedWidth=pw+2*BLEED,bleedWorld=BLEED*tileWidth/pw;
  const next=[retained?.width??bg.width,retained?.height??bg.height,scaleX,scaleY,bg.curbY,bg.buildingHeight,frame.width,frame.height,frame.curb,repaired].join(':');
  const changed=next!==signature||sourceList.some((v,i)=>v!==sources[i]);
  if(changed){reset(signature?'projection/source':'initial');signature=next;sources=sourceList;}
  let builtPixels=0;
  if(!coverage||bg.top<coverage.top||bg.bottom>coverage.bottom){
   const topBound=Math.min(coverage?.top??Infinity,retained?Math.min(bg.top-256,retained.top):bg.top-512),bottomBound=Math.max(coverage?.bottom??-Infinity,retained?Math.max(bg.bottom+256,retained.bottom):bg.bottom+512);
   const topPixel=Math.floor(topBound*scaleY),bottomPixel=Math.ceil(bottomBound*scaleY),ph=Math.max(1,bottomPixel-topPixel),height=ph/scaleY,top=topPixel/scaleY;
   if(![top,ph].every(Number.isFinite)||paddedWidth*ph*(repaired?2:1)+(layered?skyWidth*skyHeight:0)>MAX_PIXELS||paddedWidth>8192||ph>8192||bg.width/tileWidth>32)return fallback();
   // Release all old backing stores before rebuilding either large parity.
   for(const slot of pool)release(slot);
   for(let parity=0;parity<(repaired?2:1);parity++){
    const slot=availableSlot(),target=slot.texture;slot.id='retained:'+parity;
    target.setSize(paddedWidth,ph);const ctx=target.getContext();ctx.clearRect(0,0,paddedWidth,ph);
    if(!layered){ctx.fillStyle='#efd8af';ctx.fillRect(0,0,paddedWidth,ph);}ctx.save();ctx.translate(BLEED,0);ctx.scale(pw/tileWidth,scaleY);ctx.translate(0,-top);
    drawChallengeBackdrop(ctx,images,{...bg,top,bottom:top+height,height,width:tileWidth,camera:parity*tileWidth,facadeOnly:layered});ctx.restore();
    const canvas=target.getCanvas();ctx.drawImage(canvas,BLEED,0,1,ph,0,0,BLEED,ph);ctx.drawImage(canvas,BLEED+pw-1,0,1,ph,BLEED+pw,0,BLEED,ph);target.refresh();stats.builds++;builtPixels+=paddedWidth*ph;
   }
   coverage={top,bottom:top+height,height};
  }
  if(layered){
   if(!skyTexture){skyTexture=scene.textures.createCanvas('challenge-depth-sky',1,1);skyDisplay=scene.add.image(0,0,'challenge-depth-sky').setOrigin(0).setDepth(-9);}
   const sky=images['challenge-street-sky'];if(skyTexture.width!==skyWidth||skyTexture.height!==skyHeight||skySource!==sky){skyTexture.setSize(skyWidth,skyHeight);const ctx=skyTexture.getContext();ctx.clearRect(0,0,skyWidth,skyHeight);drawChallengeSky(ctx,sky,{width:skyWidth,top:0,bottom:skyHeight});skyTexture.refresh();skySource=sky;builtPixels+=skyWidth*skyHeight;}
   skyDisplay.setPosition(bg.camera,bg.top).setDisplaySize(bg.width,bg.height).setVisible(true);
  }
  let used=0;
  for(let index=Math.floor(bg.camera/tileWidth);index*tileWidth<bg.camera+bg.width;index++){
   const slot=pool.find(s=>s.id==='retained:'+(repaired?Math.abs(index)%2:0));let tile=displays[used++];
   if(!tile){tile=scene.add.image(0,0,slot.key).setOrigin(0).setDepth(-8);displays.push(tile);}
   tile.setTexture(slot.key);tile.setCrop?.();tile.setPosition(index*tileWidth-bleedWorld,coverage.top).setDisplaySize(tileWidth+bleedWorld*2,coverage.height).setFlipX(!repaired&&index%2!==0).setVisible(true);
  }
  for(let i=used;i<displays.length;i++)displays[i].setVisible(false);
  stats.lastBuildPixels=builtPixels;stats.pixels=pool.reduce((n,s)=>n+s.texture.width*s.texture.height,0)+(skyTexture?.width||0)*(skyTexture?.height||0);stats.reason=builtPixels?'fill':'reuse';return true;
 }
 function draw(bg,scaleX,scaleY,retained=null,presentation){
  const next=backgroundCachePolicy(presentation);
  if(next!==policy){reset('policy');policy=next;policySwitches++;}
  stats.lastBuildPixels=0;stats.pending=0;pendingBands=[];
  if(![bg.width,bg.height,bg.top,bg.bottom,scaleX,scaleY].every(Number.isFinite)||Math.min(bg.width,bg.height,scaleX,scaleY)<=0)return fallback();
  return policy==='finite'?drawFinite(bg,scaleX,scaleY,retained):drawRetained(bg,scaleX,scaleY,retained);
 }
 function drawFinite(bg,scaleX,scaleY,retained=null){
  if(![bg.width,bg.height,bg.top,bg.bottom,scaleX,scaleY].every(Number.isFinite)||Math.min(bg.width,bg.height,scaleX,scaleY)<=0)return fallback();
  const layered=hasLayeredStreet(images),repaired=layered&&hasStreetSeamRepairs(images),image=layered?images['challenge-street-facade']:images['challenge-street-deep']||images['challenge-street'];
  const frame=layered||images['challenge-street-deep']?CHALLENGE_SCENE_FRAMES.street:{width:2172,height:724,curb:539};
  const densityX=tier(scaleX),densityY=tier(scaleY);
  const tileWidth=frame.width*Math.max(.02,bg.buildingHeight/frame.curb),pw=Math.ceil(tileWidth*densityX),sx=pw/tileWidth,ph=Math.ceil(ROW*densityY),sy=ph/ROW;
  const skyWidth=Math.max(1,Math.round(bg.width*scaleX)),skyHeight=Math.max(1,Math.round(bg.height*scaleY));
  const sourceList=[image,images['challenge-street-sky'],images['challenge-street-left-repair'],images['challenge-street-right-repair']];
  const next=[retained?.width??skyWidth,retained?.height??skyHeight,bg.curbY,bg.buildingHeight,repaired,layered].join(':');
  if(next!==signature||sourceList.some((v,i)=>v!==sources[i])){reset(signature?'projection/source':'initial');signature=next;sources=sourceList;}
  if(!layered&&(legacyTop===null||bg.top<legacyTop)){const top=bg.top-512;if(legacyTop!==null){reset('legacy sky extent');signature=next;sources=sourceList;}legacyTop=top;}
  // One row on either side is bounded prefetch and hysteresis for oscillation.
  const first=Math.floor(bg.top/ROW),last=Math.ceil(bg.bottom/ROW)-1,parities=repaired?2:1;
  // Experimental presentation: retain the bounded source rows, but compose
  // them on integer cache pixels before any world projection. The margin
  // avoids rebuilding on every camera-Y update. These surfaces share the
  // existing finite memory budget; desktop retained columns are unchanged.
  if(layered&&(!joinPlan||joinPlan.pw!==pw||joinPlan.ph!==ph||bg.top<joinPlan.top||bg.bottom>joinPlan.bottom)){
   resetJoin();const topPixel=Math.floor((bg.top-128)*sy),bottomPixel=Math.ceil((bg.bottom+128)*sy);
   joinPlan={pw,ph,sx,sy,topPixel,bottomPixel,top:topPixel/sy,bottom:bottomPixel/sy,width:pw+2*BLEED,height:bottomPixel-topPixel,first:Math.floor(topPixel/ph),last:Math.ceil(bottomPixel/ph)-1};
  }
  const joinPixels=layered?joinPlan.width*joinPlan.height*parities:0;
  const copied=id=>{if(!layered)return false;const [row,p]=id.split(':').map(Number);return joined[p]?.done.has(row)===true;};
  const screenPixels=skyWidth*skyHeight,reserved=screenPixels*(layered?2:1)+(repaired?2*536*715:0)+joinPixels,tilePixels=(pw+2*BLEED)*(ph+2*BLEED);
  const budget=Math.min(MAX_PIXELS,Math.max(24*1024*1024,screenPixels*8)),required=new Set();
  for(let row=layered?joinPlan.first:first;row<=(layered?joinPlan.last:last);row++)for(let p=0;p<parities;p++)required.add(row+':'+p);
  if(tilePixels>4*1024*1024||required.size>64||reserved+required.size*tilePixels>budget||pw+2*BLEED>8192||ph+2*BLEED>8192||skyWidth>8192||skyHeight>8192||(layered&&joinPlan.height>8192)||bg.width/tileWidth>32)return fallback();
  // A near-view row can remain sharp when the camera pulls back, but newly
  // exposed far rows use only their own adequate density. Never replicate the
  // maximum near density over the far viewport's entire world height.
  for(const slot of pool)if(slot.id!==null&&(slot.sx+1e-10<scaleX||slot.sy+1e-10<scaleY))release(slot);
  const cost=id=>{if(copied(id))return 0;const slot=pool.find(s=>s.id===id);return slot?slot.texture.width*slot.texture.height:tilePixels;};
  let usedPixels=reserved+[...required].reduce((n,id)=>n+cost(id),0);
  // Retained high-density rows are downgraded only when the combined envelope
  // needs space, always to a tier >= current display density.
  const oversized=pool.filter(s=>required.has(s.id)&&cost(s.id)>tilePixels).sort((a,b)=>cost(b.id)-cost(a.id));
  for(const slot of oversized){if(usedPixels<=budget)break;usedPixels-=cost(slot.id)-tilePixels;release(slot);}
  const extras=[];for(const row of [first-1,last+1])for(let p=0;p<parities;p++)extras.push(row+':'+p);
  extras.sort((a,b)=>Number(pool.some(s=>s.id===b))-Number(pool.some(s=>s.id===a)));
  for(const id of extras)if(!required.has(id)&&required.size<64&&usedPixels+cost(id)<=budget){required.add(id);usedPixels+=cost(id);}
  // Reclaim outside the finite prefetch ring before allocating replacements.
  for(const slot of pool)if(slot.id!==null&&!required.has(slot.id))release(slot);
  let builtPixels=0;
  for(const id of required){
   if(copied(id)||pool.some(s=>s.id===id))continue;
   if(builtPixels>0&&builtPixels+tilePixels>1.5*1024*1024)break;
   const slot=availableSlot();
   const [row,parity]=id.split(':').map(Number),top=row*ROW,target=slot.texture;target.setSize(pw+2*BLEED,ph+2*BLEED);
   const ctx=target.getContext();ctx.clearRect(0,0,target.width,target.height);if(!layered){ctx.fillStyle='#efd8af';ctx.fillRect(0,0,target.width,target.height);}ctx.save();ctx.translate(BLEED,BLEED);ctx.scale(sx,sy);ctx.translate(0,-top);
   drawChallengeBackdrop(ctx,images,{...bg,width:tileWidth,camera:parity*tileWidth,top:layered?top-BLEED/sy:legacyTop,bottom:top+ROW+BLEED/sy,height:ROW+2*BLEED/sy,facadeOnly:layered});ctx.restore();
   // Preserve historical X seam bleed. Y contains actual neighbour pixels;
   // crops below expose each core once, preventing alpha double composition.
   const canvas=target.getCanvas();ctx.drawImage(canvas,BLEED,0,1,target.height,0,0,BLEED,target.height);ctx.drawImage(canvas,BLEED+pw-1,0,1,target.height,BLEED+pw,0,BLEED,target.height);target.refresh();slot.id=id;slot.row=row;slot.parity=parity;slot.sx=sx;slot.sy=sy;stats.builds++;builtPixels+=tilePixels;
  }
  let joinPending=0;
  if(layered){
   for(let p=0;p<parities;p++){
    let target=joined[p];if(!target){const textureKey=key+'-joined-'+p;target={key:textureKey,texture:scene.textures.createCanvas(textureKey,1,1),done:new Set()};joined.push(target);}
    for(let row=joinPlan.first;row<=joinPlan.last;row++){
     if(target.done.has(row))continue;
     const slot=pool.find(s=>s.id===row+':'+p),start=Math.max(joinPlan.topPixel,row*ph),end=Math.min(joinPlan.bottomPixel,(row+1)*ph),copyPixels=joinPlan.width*(end-start);
     if(!slot||(builtPixels>0&&builtPixels+copyPixels>1.5*1024*1024)){joinPending++;continue;}
     if(target.texture.width!==joinPlan.width||target.texture.height!==joinPlan.height){target.texture.setSize(joinPlan.width,joinPlan.height);target.texture.getContext().clearRect(0,0,joinPlan.width,joinPlan.height);}
     const ctx=target.texture.getContext(),dy=start-joinPlan.topPixel,dh=end-start;
     ctx.save();ctx.beginPath();ctx.rect(0,dy,joinPlan.width,dh);ctx.clip();
     ctx.drawImage(slot.texture.getCanvas(),0,0,slot.texture.width,slot.texture.height,BLEED-BLEED*sx/slot.sx,row*ph-joinPlan.topPixel-BLEED*sy/slot.sy,slot.texture.width*sx/slot.sx,slot.texture.height*sy/slot.sy);ctx.restore();
     const canvas=target.texture.getCanvas();ctx.drawImage(canvas,BLEED,dy,1,dh,0,dy,BLEED,dh);ctx.drawImage(canvas,BLEED+pw-1,dy,1,dh,BLEED+pw,dy,BLEED,dh);
     target.texture.refresh();target.done.add(row);stats.joinCopies++;builtPixels+=copyPixels;
     // The continuous surface now owns these pixels. Keeping the source row
     // as well doubles backing stores without helping movement inside it.
     // A new coverage plan may rebuild rows; the fixed margin bounds that work.
     release(slot);
    }
   }
   stats.joinedPixels=joined.reduce((n,s)=>n+s.texture.width*s.texture.height,0);
  }
  stats.lastBuildPixels=builtPixels;stats.pending=[...required].filter(id=>!copied(id)&&!pool.some(s=>s.id===id)).length+joinPending;
  pendingBands=[];for(let row=first;row<=last;row++)if(Array.from({length:parities},(_,p)=>row+':'+p).some(id=>!copied(id)&&!pool.some(s=>s.id===id)))pendingBands.push({row,top:Math.max(bg.top,row*ROW),bottom:Math.min(bg.bottom,(row+1)*ROW)});
  const ready=pendingBands.length===0&&joinPending===0;stats.pixels=reserved+pool.reduce((n,s)=>n+s.texture.width*s.texture.height,0);
  if(!ready){stats.pendingFallbacks++;if(!layered){hide();stats.reason='preparing';return false;}}
  stats.reason=ready?(builtPixels?'fill':'reuse'):'partial';
  if(layered){
   if(!skyTexture){skyTexture=scene.textures.createCanvas('challenge-depth-sky',1,1);skyDisplay=scene.add.image(0,0,'challenge-depth-sky').setOrigin(0).setDepth(-9);}
   const sky=images['challenge-street-sky'];if(skyTexture.width!==skyWidth||skyTexture.height!==skyHeight||skySource!==sky){skyTexture.setSize(skyWidth,skyHeight);const ctx=skyTexture.getContext();ctx.clearRect(0,0,skyWidth,skyHeight);drawChallengeSky(ctx,sky,{width:skyWidth,top:0,bottom:skyHeight});skyTexture.refresh();skySource=sky;stats.lastBuildPixels+=skyWidth*skyHeight;}
   skyDisplay.setPosition(bg.camera,bg.top).setDisplaySize(bg.width,bg.height).setVisible(true);
  }
  // Partial rows share one continuous dynamic facade. Separate band clips or
  // cached/pending joins can expose the sky at fractional projected edges.
  if(!ready){for(const display of displays)display.setVisible(false);return false;}
  let used=0;
  if(layered){
   for(let index=Math.floor(bg.camera/tileWidth);index*tileWidth<bg.camera+bg.width;index++){
    const slot=joined[repaired?Math.abs(index)%2:0];let display=displays[used++];
    if(!display){display=scene.add.image(0,0,slot.key).setOrigin(0).setDepth(-8);displays.push(display);}
    display.setTexture(slot.key);display.setCrop?.();display.setPosition(index*tileWidth-BLEED/sx,joinPlan.top).setDisplaySize(joinPlan.width/sx,joinPlan.height/sy).setFlipX(!repaired&&index%2!==0).setVisible(true);
   }
   for(let i=used;i<displays.length;i++)displays[i].setVisible(false);
   return true;
  }
  for(let index=Math.floor(bg.camera/tileWidth);index*tileWidth<bg.camera+bg.width;index++)for(let row=first;row<=last;row++){
   if(pendingBands.some(b=>b.row===row))continue;
   const slot=pool.find(s=>s.id===row+':'+(repaired?Math.abs(index)%2:0));let display=displays[used++];
   if(!display){display=scene.add.image(0,0,slot.key).setOrigin(0).setDepth(-8);displays.push(display);}
   const tw=slot.texture.width,th=slot.texture.height;display.setTexture(slot.key);display.setCrop?.(0,BLEED,tw,th-2*BLEED);
   display.setPosition(index*tileWidth-BLEED/slot.sx,row*ROW-BLEED/slot.sy).setDisplaySize(tw/slot.sx,th/slot.sy).setFlipX(!repaired&&index%2!==0).setVisible(true);
  }
  for(let i=used;i<displays.length;i++)displays[i].setVisible(false);
  stats.pixels=reserved+pool.reduce((n,s)=>n+s.texture.width*s.texture.height,0);return ready;
 }
 function paintPending(ctx,bg){
  if(stats.reason!=='partial')return false;
  ctx.save();ctx.translate(bg.camera,0);drawChallengeBackdrop(ctx,images,{...bg,facadeOnly:true});ctx.restore();return true;
 }
 return {draw,paintPending,hide,reset,invalidateSurface,get diagnostics(){return {...stats,policy,policySwitches,budgetScope:policy==='finite'?'managed-surfaces':'static-tiles-and-sky',pendingBands:pendingBands.map(b=>({...b})),tiles:pool.filter(s=>s.id!==null).length,joinPlan:joinPlan?{...joinPlan}:null};}};
}
