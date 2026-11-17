import {isMobileLandscapePresentation} from './challenge-layout.mjs?v=chapter-presentation-20261117-r1';
import {controlledCombatCameraFrame} from './challenge-camera.mjs?v=chapter-presentation-20261117-r1';
// Shared display-space safe zone. This does not change combat/world geometry.
export function stageInsets(width,height,{touch=true,portrait=width<height}={}){
 const top=portrait&&touch?140:118;
 const bottom=touch?(portrait?198:66):48;
 // Wide controls occupy the corners; do not shrink every actor into the
 // tiny band above their tallest card. The central action uses the foreground.
 return {top:Math.min(top,height*.4),bottom:Math.min(bottom,height*.45)};
}
function preferredFullStageCameraFrame(camera,width,height,fighters,previous=null,delta=1000/60,options={}){
 if(options.paused&&previous?.width===width&&previous?.height===height)return previous;
 const portrait=options.portrait??width<height,mobileLandscape=options.touch===true&&options.nativeLandscape===true&&!portrait&&height<=500;
 let {top,bottom}=stageInsets(width,height,options);
 const tuned=mobileLandscape&&options.cameraMode==='classic',portraitStable=options.touch===true&&portrait&&options.cameraMode==='stable';
 if((tuned||portraitStable)&&Number.isFinite(options.hudBottom))top=Math.max(top,options.hudBottom+8);
 const baseHeight=Math.max(1,height-top-bottom);let laneZoom=Infinity,laneBounds=null;
 // Lane admission must use the same close reserve as the tuned camera,
 // otherwise entering the lane abruptly imposes a smaller zoom.
 if(tuned&&options.lowerLane){
  const lane=options.lowerLane;laneBounds=lane;const gap=Math.abs(fighters[0].x-fighters[1].x),baseZoom=(baseHeight-32)/590*1.6;
  const room=Math.max(0,(lane.right-lane.left)/2);
  const freeZoom=room*2/Math.max(1,gap+260);
  const gain=Math.max(0,Math.min(36,lane.bottom-(height-bottom),(freeZoom-baseZoom)*704));
  bottom-=gain;if(gain>0){laneZoom=freeZoom;laneBounds=lane;}
 }
 const viewHeight=Math.max(1,height-top-bottom);
 const view=camera(width,viewHeight,fighters,previous?.stageView,delta,{...options,portraitDynamic:options.touch===true&&portrait&&options.cameraMode!=='stable',portraitCloseStable:portraitStable,portraitStable:false,mobileLandscape,mobileLandscapeTuned:tuned,mobileLandscapeBaseHeight:baseHeight,mobileLandscapeLaneZoom:laneZoom,mobileLandscapeLane:laneBounds});
 const frame={...view,y:view.y+(bottom-top)/(2*view.zoom),width,height,stageView:view};
 if(mobileLandscape&&options.cameraMode!=='stable')return fitMobilePairSafety(frame,fighters,previous,delta,{top:Math.max(top+8,(options.hudBottom||0)+8),bottom:height-bottom-14,head:285});
 return frame;
}
// Stable and dynamic share one standing scale. Only the controlled fighter
// constrains framing; measured blockers replace the fallback safe band.
export function fullStageCameraFrame(camera,width,height,fighters,previous=null,delta=1000/60,options={}){
 const preferred=preferredFullStageCameraFrame(camera,width,height,fighters,previous,delta,options);
 const measured=Array.isArray(options.occlusions);
 const inset=stageInsets(width,height,options);
 const safety=measured?options:{...options,measuredCameraSafety:false,safeRect:{left:0,top:Math.max(inset.top,options.hudBottom||0),right:width,bottom:height-inset.bottom},occlusions:[]};
 return controlledCombatCameraFrame(width,height,fighters,previous,delta,{...safety,preferredCameraFrame:preferred});
}
// Crops contain only floorboards / ceiling material. Outside the original
// room, never repeat seating, walls, or an inverted second auditorium.
export const CHAMBER_MATERIAL_FRAMES=Object.freeze({'chamber-floor':[0,760,1672,181],'chamber-ceiling':[475,0,200,64]});
// The original chamber desk is baked into the room art. Reproject only its
// tabletop and front over that same image: support stays at source row 581,
// the surface straddles it, and the original bottom row 692 stays grounded.
export const CHAMBER_DESK_FRAMES=Object.freeze({'chamber-desk-top':[484,578,708,14],'chamber-desk-front':[484,592,708,100]});
export function chamberDeskLayers(chamber){
 const scale=chamber.width/1672,left=chamber.x-chamber.width/2,top=chamber.y-chamber.height*chamber.floorRatio;
 return [
  {frame:'chamber-desk-top',x:left+(484+354)*scale,y:top+581*scale,width:708*scale,height:14*scale},
  {frame:'chamber-desk-front',x:left+(484+354)*scale,y:top+640*scale,width:708*scale,height:104*scale}
 ];
}
export function chamberBackdropTiles(frame,chamber){
 const {x,y,width:w,height:h,floorRatio}=chamber,scale=w/1672;
 const left=x-w/2,top=y-floorRatio*h,bottom=top+h;
 const visible={left:frame.x-frame.width/(2*frame.zoom),right:frame.x+frame.width/(2*frame.zoom),top:frame.y-frame.height/(2*frame.zoom),bottom:frame.y+frame.height/(2*frame.zoom)};
 const tiles=[];
 const row=(rowTop,height,name,source,flipY)=>{
  if(rowTop+height<visible.top||rowTop>visible.bottom)return;
  const tw=source[2]*scale;
  for(let col=Math.floor((visible.left-left)/tw);col<=Math.floor((visible.right-left)/tw);col++)tiles.push({x:left+(col+.5)*tw,y:rowTop+height/2,width:tw,height,left:left+col*tw,right:left+(col+1)*tw,top:rowTop,bottom:rowTop+height,flipX:Math.abs(col)%2===1,flipY,frame:name,source});
 };
 row(top,h,'__BASE',[0,0,1672,941],false);
 const floor=CHAMBER_MATERIAL_FRAMES['chamber-floor'],fh=floor[3]*scale;
 for(let n=0;bottom+n*fh<=visible.bottom;n++)row(bottom+n*fh,fh,'chamber-floor',floor,n%2===0);
 const ceiling=CHAMBER_MATERIAL_FRAMES['chamber-ceiling'],ch=ceiling[3]*scale;
 for(let n=0;top-n*ch>=visible.top;n++)row(top-(n+1)*ch,ch,'chamber-ceiling',ceiling,n%2===0);
 return tiles;
}

// Safety-only guard for stable landscape. Ordinary composition remains exact.
export function fitMobilePairSafety(legacy,actors,previous,delta=1000/60,{top=0,bottom=legacy.height,side=18,head=300}={}){
 const {width,height}=legacy,clamp=(n,l,h)=>Math.max(l,Math.min(h,n));
 const left=Math.min(...actors.map(a=>a.x))-130,right=Math.max(...actors.map(a=>a.x))+130;
 const high=Math.min(...actors.map(a=>a.y+(a.depth||0)*.65-head)),low=Math.max(...actors.map(a=>a.y+(a.depth||0)*.65+28));
 const predict=Math.min(...actors.map(a=>a.y+(a.depth||0)*.65+Math.min(0,a.vy||0)*.12-head));
 const inside=width/2+(left-legacy.x)*legacy.zoom>=side&&width/2+(right-legacy.x)*legacy.zoom<=width-side&&height/2+(predict-legacy.y)*legacy.zoom>=top&&height/2+(low-legacy.y)*legacy.zoom<=bottom;
 const same=previous?.width===width&&previous?.height===height;
 if(inside&&!previous?.mobileSafety)return legacy;
 const fit=Math.min(legacy.zoom,(width-2*side)/(right-left),(bottom-top)/(low-high));
 const wanted=Math.min(fit,(bottom-top)/(low-predict));
 const ease=1-Math.pow(.92,Math.max(0,Math.min(100,delta))/(1000/60));
 const zoom=Math.min(fit,same?previous.zoom+(wanted-previous.zoom)*ease:wanted);
 const x=clamp(same?previous.x+(legacy.x-previous.x)*ease:legacy.x,right-(width/2-side)/zoom,left+(width/2-side)/zoom);
 const y=clamp(same?previous.y+(legacy.y-previous.y)*ease:legacy.y,low-(bottom-height/2)/zoom,high+(height/2-top)/zoom);
 if(inside&&Math.abs(zoom-legacy.zoom)<1e-5&&Math.abs(x-legacy.x)<.01&&Math.abs(y-legacy.y)<.01)return legacy;
 return {...legacy,x,y,zoom,mobileSafety:true,...('base' in legacy?{base:height/2+(430-y)*zoom,jumpPan:0,backdropTop:Math.min(legacy.backdropTop,y-height/zoom/2),backdropBottom:Math.max(legacy.backdropBottom,y+height/zoom/2)}:{})};
}
