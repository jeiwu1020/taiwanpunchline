import {prepareChallengeArenaImages} from './challenge-arena-backdrop.mjs?v=campaign-visuals-20261112-r2';
import {createDepthChallengeRenderer,depthRouteCameraFrame} from './challenge-depth-render.mjs?v=campaign-visuals-20261112-r2';
export {depthWorldPoint,depthBackdropLayout,depthRenderItems,depthMobLabelLayout,depthMobLabelLayouts,paintDepthRoute} from './challenge-depth-render.mjs?v=campaign-visuals-20261112-r2';
import {DESK} from './stage-expansion.mjs?v=campaign-visuals-20261112-r2';
import {drawChallengeMob,drawChallengeScene,drawChallengeBackdrop,drawChallengeStreetProp,drawChallengeSupply} from './challenge-art.mjs?v=campaign-visuals-20261112-r2';
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export function routeCameraFrame(width,height,route,options={}){
 const {overlay=false,portrait=width<height,fullStage=false,touch=true,landscapePreview=false,safe={},camera='classic',...mobileOptions}=options;
 if(route.depthMode)return depthRouteCameraFrame(width,height,route,{overlay,portrait,fullStage,touch,landscapePreview,safe,camera,...mobileOptions,presentationTouch:options.touch===true});
 const reserve=overlay?Math.min(76,height*.23):12,available=Math.max(100,height-reserve);
 const zoom=Math.min(1.4,width/650,available/410),visible=width/zoom;
 const x=clamp(route.player.x+visible*.15,visible/2,Math.max(visible/2,route.worldWidth-visible/2));
 return{x,y:450-(available-height/2)/zoom,zoom,width,height,mode:'route',hud:0};
}
export function createChallengeRenderer(scene,images){
 const depth=createDepthChallengeRenderer(scene,images);
 const texture=scene.textures.createCanvas('challenge-route-world',1,1),display=scene.add.image(0,0,'challenge-route-world').setOrigin(0).setDepth(-7).setVisible(false);
 const slots=[];const gfx=scene.add.graphics().setDepth(1);let visible=false,arenaImages=null,arenaStamp='',mode='';
 function mobSlot(i){if(slots[i]){if(slots[i].t.width!==512||slots[i].t.height!==384)slots[i].t.setSize(512,384);return slots[i];}const key='challenge-mob-'+i,t=scene.textures.createCanvas(key,512,384),im=scene.add.image(0,0,key).setOrigin(.5,350/384).setDepth(-.05),label=scene.add.text(0,0,'',{fontFamily:'system-ui',fontSize:'18px',fontStyle:'bold',color:'#fff3cd',stroke:'#17333b',strokeThickness:4}).setOrigin(.5).setDepth(3);return slots[i]={t,im,label};}
 function releaseArena(){if(!arenaImages)return;for(const key of ['challenge-arena-facade','challenge-arena-road']){const canvas=arenaImages[key];if(canvas){canvas.width=1;canvas.height=1;}scene.textures.remove?.(key);}arenaImages=null;arenaStamp='';}
 function hide(){depth.hide();visible=false;display.setVisible(false);gfx.clear();for(const s of slots){s.im.setVisible(false);s.label.setVisible(false);}}
 function draw(route,time,frame,options={}){
  arenaStamp='';
  releaseArena();
  if(route.depthMode){mode='depth';if(texture.width!==1)texture.setSize(1,1);for(const slot of slots)if(slot.t.width!==1)slot.t.setSize(1,1);hide();depth.draw(route,time,frame,options);visible=true;return;}
  if(mode==='depth')depth.releaseSurface();mode='legacy';if(texture.width!==1600||texture.height!==800)texture.setSize(1600,800);
  depth.hide();visible=true;const width=frame.width/frame.zoom,height=frame.height/frame.zoom,left=frame.x-width/2,top=frame.y-height/2;
  const ctx=texture.getContext();ctx.clearRect(0,0,1600,800);ctx.fillStyle='#f1d5a2';ctx.fillRect(0,0,1600,800);ctx.save();ctx.scale(1600/width,800/height);ctx.translate(-left,-top);
  drawChallengeScene(ctx,images,{width:route.worldWidth,height:800,camera:0,segment:route.sectionIndex,worldWidth:route.worldWidth,groundY:430});
  for(const p of route.platforms||[]){const x=p.x??p.left,y=p.y,w=p.width??((p.right??x+100)-x);drawChallengeStreetProp(ctx,images,'table',{x:x+w/2,y:430,width:w,height:430-y});}
  const supplyX=route.section.supplyX;if(!route.supplyUsed){drawChallengeSupply(ctx,images,{x:supplyX,y:430});ctx.save();ctx.font='bold 18px system-ui';ctx.textAlign='center';ctx.fillStyle='#17333b';ctx.fillText('熱心補給',supplyX,322);ctx.restore();}
  drawChallengeStreetProp(ctx,images,'sign',{x:route.gateX,y:430,width:105,height:128});ctx.font='900 22px system-ui';ctx.textAlign='center';ctx.lineWidth=5;ctx.strokeStyle='#17333b';ctx.fillStyle='#fff4d7';ctx.strokeText('前方開講 →',route.gateX,288);ctx.fillText('前方開講 →',route.gateX,288);ctx.restore();texture.refresh();display.setPosition(left,top).setDisplaySize(width,height).setVisible(true);
  gfx.clear();let n=0;for(const mob of route.enemies){if(mob.hp<=0&&mob.deadAge>.6)continue;const s=mobSlot(n++),c=s.t.getContext();c.clearRect(0,0,512,384);c.save();c.translate(256,350);if(mob.hp<=0){c.rotate(-.7*mob.face);c.globalAlpha=Math.max(0,1-mob.deadAge/.6);}drawChallengeMob(c,images,mob,time);c.restore();s.t.refresh();s.im.setPosition(mob.x,mob.y).setScale(mob.face,1).setVisible(true);s.label.setText(mob.warning>0?'要出手了！':mob.name).setPosition(mob.x,mob.y-296).setVisible(mob.hp>0);if(mob.hp>0){gfx.fillStyle(0x17333b,.8);gfx.fillRoundedRect(mob.x-33,mob.y-284,66,7,3);gfx.fillStyle(0xe7ac55,1);gfx.fillRoundedRect(mob.x-31,mob.y-282,62*mob.hp/mob.maxHp,3,1);}}
  for(let i=n;i<slots.length;i++){slots[i].im.setVisible(false);slots[i].label.setVisible(false);}
  for(const r of route.rallies){const alpha=r.age<.65?.4:1;const crowdKeys=['supporter-woman','supporter-man','supporter-young','supporter-elder','supporter-grandma'];ctx.save();ctx.scale(1600/width,800/height);ctx.translate(-left,-top);ctx.globalAlpha=alpha;for(let i=0;i<5;i++){const image=images[crowdKeys[i]],x=r.x-r.direction*i*47,y=430;if(image)ctx.drawImage(image,x-32,y-115,64,115);}ctx.restore();texture.refresh();gfx.lineStyle(7,0xffcf65,alpha*.6);gfx.lineBetween(r.x-r.direction*240,422,r.x+r.direction*60,422);}
 }
 function drawArena(section,time,frame){
  if(mode==='depth')depth.releaseSurface();mode='arena';if(texture.width!==1600||texture.height!==800)texture.setSize(1600,800);
  hide();const stamp=[section,frame.x,frame.y,frame.width,frame.height,frame.zoom].join(':');
  if(stamp===arenaStamp){display.setVisible(true);visible=true;return;}
  arenaImages??=prepareChallengeArenaImages(scene,images);arenaStamp=stamp;const width=frame.width/frame.zoom,height=frame.height/frame.zoom,left=frame.x-width/2,top=frame.y-height/2;
  const ctx=texture.getContext();ctx.clearRect(0,0,1600,800);ctx.save();ctx.scale(1600/width,800/height);ctx.translate(-left,-top);
  ctx.save();ctx.translate(left,0);drawChallengeBackdrop(ctx,arenaImages,{width,height,curbY:420,buildingHeight:560,camera:left+section*140,arena:true,top,bottom:top+height});ctx.restore();
  // The generated platform uses exactly the existing duel desk collision.
  const w=DESK.right-DESK.left;drawChallengeStreetProp(ctx,images,'table',{x:(DESK.left+DESK.right)/2,y:430,width:w,height:430-DESK.y});ctx.restore();texture.refresh();display.setPosition(left,top).setDisplaySize(width,height).setVisible(true);visible=true;
 }
 return{draw,drawArena,hide,invalidateSurface(){
  depth.invalidateSurface();
  // Reset all dynamic contexts, including hidden legacy mobs. Same-size
  // CanvasTexture.setSize cannot clear nested saves/clips left by a failed draw.
  for(const t of [texture,...slots.map(slot=>slot.t)]){const canvas=t.getCanvas();canvas.width=canvas.width;}
  arenaStamp='';releaseArena();for(const slot of slots)slot.label.updateText?.();
 },get visible(){return visible;}};
}
