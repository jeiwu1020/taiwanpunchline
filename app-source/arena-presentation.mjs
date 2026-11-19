export const ARENA_ASSET='assets/arena-chamber-v19.webp';
function fightViewport(width,height,classic=false){
 const w=Math.max(1,width),h=Math.max(1,height);
 // Keep normal edge padding, but never let it consume a tiny canvas. These
 // same bounds size both cameras and the fixed world backdrop.
 return{w,h,side:Math.min(classic?10:18,w/4),top:Math.min(classic?12:8,h/4),bottom:Math.min(classic?10:14,h/4),ease:Math.min(classic?10:6,h/8)};
}
// Keep a stable view until an actor actually reaches its safe edge. In V19,
// following the midpoint every frame moved an idle player when only the AI moved.
export function stableCameraFrame(width,height,fighters,previous=null){
 // HUD is a separate layout row. This viewport is entirely fighting space.
 const [a,b]=fighters,{w,h,side,top:topInset,bottom:bottomInset,ease}=fightViewport(width,height),hud=0;
 const sameViewport=previous?.width===w&&previous?.height===h;
 const top=Math.min(a.y,b.y)-285,bottom=458,gap=Math.abs(a.x-b.x);
 const fit=Math.min(1.12,(w-side*2)/Math.max(700,gap+260),(h-topInset-bottomInset-ease)/(bottom-top));
 // Restore the V18-style bidirectional easing. A hard fit limit keeps heads
 // visible while rising; after landing the zoom eases back instead of sticking.
 const eased=sameViewport?previous.zoom+(fit-previous.zoom)*.12:fit;
 const safeFit=Math.min(1.12,(w-side*2)/(gap+260),(h-topInset-bottomInset)/(bottom-top));
 const zoom=Math.min(safeFit,eased);
 const half=(w-side*2)/(2*zoom),lo=Math.max(a.x,b.x)+130-half,hi=Math.min(a.x,b.x)-130+half;
 const clamp=(n,min,max)=>Math.max(min,Math.min(max,n));
 const x=clamp(sameViewport?previous.x:(a.x+b.x)/2,lo,hi);
 const lowY=bottom-(h/2-bottomInset)/zoom;
 const y=lowY; // Keep the ground line stable; jumps only require zooming out.
 return{x,y,zoom,hud,width:w,height:h};
}
/** Fixed close framing: never change scale in response to a jump or separation.
 * Pan to retain the controlled fighter. When the whole duel cannot fit at this
 * scale, the player takes priority instead of silently zooming out. */
// Portrait keeps the pair together. Reserve the legal desk-jump envelope once,
// so jump height never drives zoom; horizontal separation still may require it.
export function portraitStableCameraFrame(width,height,fighters,previous=null,delta=1000/60){
 const [a,b]=fighters,{w,h,side,top,bottom}=fightViewport(width,height);
 const gap=Math.abs(a.x-b.x),envelope=610;
 const target=Math.min(1.25,(w-side*2)/Math.max(480,gap+300),(h-top-bottom)/envelope);
 const same=previous?.width===w&&previous?.height===h&&previous?.mode==='stable-pair';
 const ease=1-Math.pow(.92,Math.max(0,Math.min(100,delta))/(1000/60));
 const restTop=Math.min(a.supportY??430,b.supportY??430)-300,restBottom=Math.max(a.supportY??430,b.supportY??430)+28;
 const fit=Math.min((w-side*2)/Math.max(480,gap+260),(h-top-bottom)/(restBottom-restTop));
 const zoom=Math.min(fit,same?previous.zoom+(target-previous.zoom)*ease:target);
 const half=(w-side*2)/(2*zoom),lo=Math.max(a.x,b.x)+130-half,hi=Math.min(a.x,b.x)-130+half;
 const clamp=(v,min,max)=>Math.max(min,Math.min(max,v)),mid=(a.x+b.x)/2;
 const x=clamp(same?previous.x+(mid-previous.x)*ease:mid,lo,hi);
 const low=restBottom-(h/2-bottom)/zoom,high=restTop+(h/2-top)/zoom;
 const targetY=clamp(458-(h/2-bottom)/zoom,low,high);
 const y=same?clamp(previous.y+(targetY-previous.y)*ease,low,high):targetY;
 return {x,y,zoom,hud:0,width:w,height:h,mode:'stable-pair'};
}
export function fixedStableCameraFrame(width,height,fighters,previous=null,delta=1000/60,options={}){
 if(options.portraitStable)return portraitStableCameraFrame(width,height,fighters,previous,delta);
 const [player,enemy]=fighters,{w,h,side,top,bottom}=fightViewport(width,height);
 const same=previous?.width===w&&previous?.height===h&&previous?.mode==='stable-fixed';
 const gap=Math.abs(player.x-enemy.x);
 const openingSpan=Math.max(520,gap+280);
 const zoom=same?previous.zoom:options.portraitCloseStable?Math.min(1.25,(w-side*2)/openingSpan,(h-top-bottom)/520):options.mobileLandscape?Math.min(1.25,(w-side*2)/Math.max(560,gap+280),(h-top-bottom)/340):Math.min(1.25,(w-side*2)/700*1.12,(h-top-bottom)/313);
 const clamp=(v,lo,hi)=>Math.max(lo,Math.min(hi,v));
 const half=(w-side*2)/(2*zoom),left=Math.min(player.x,enemy.x)-130,right=Math.max(player.x,enemy.x)+130;
 const x=right-left<=half*2?clamp(same?previous.x:(player.x+enemy.x)/2,right-half,left+half):clamp(same?previous.x:player.x,player.x+130-half,player.x-130+half);
 const allTop=Math.min(player.supportY??430,enemy.supportY??430)-285,allBottom=Math.max(player.supportY??430,enemy.supportY??430)+28;
 const wholeFits=(allBottom-allTop)*zoom<=h-top-bottom;
 const fitTop=wholeFits?allTop:(player.supportY??430)-285,fitBottom=wholeFits?allBottom:(player.supportY??430)+28;
 const low=fitBottom-(h/2-bottom)/zoom,high=fitTop+(h/2-top)/zoom;
 const targetY=clamp(458-(h/2-bottom)/zoom,low,high);
 const easeY=1-Math.exp(-Math.max(0,Math.min(100,delta))/120);
 const y=same&&!options.paused?clamp(previous.y+(targetY-previous.y)*easeY,low,high):targetY;
 return {x,y,zoom,hud:0,width:w,height:h,mode:'stable-fixed'};
}
// Original midpoint/proximity behavior fitted to the fight-only canvas.
// Use grounded resting height to prevent jump-triggered zoom pumping while
// keeping horizontal panning responsive and smooth.
export function cameraFrame(width,height,fighters,previous=null,delta=1000/60,options={}){
 const [a,b]=fighters,{w,h,side,top:topInset,bottom:bottomInset,ease:easeInset}=fightViewport(width,height,true),hud=0;
 const top=Math.min(a.supportY??430,b.supportY??430)-300,bottom=458,gap=Math.abs(a.x-b.x);
 const baseHeight=options.mobileLandscapeBaseHeight??h;
 const closeCap=(options.mobileLandscapeTuned||options.mobileLandscape)?Math.min(1.25,(h-topInset-bottomInset-easeInset)/340):1.45;
 const horizFit=(options.portraitDynamic||options.portraitStable)?(w-side*2)/Math.max(480,gap+280):(w-side*2)/Math.max(520,gap+280);
 const vertEnvelope=options.portraitDynamic?540:(bottom-top);
 const target=Math.min(1.45,closeCap,horizFit,(h-topInset-bottomInset-easeInset)/vertEnvelope);
 const same=previous?.width===w&&(previous?.height===h||options.mobileLandscapeTuned&&previous?.mobileLandscapeBaseHeight===baseHeight)&&previous?.mode==='classic';
 const ease=1-Math.pow(options.mobileLandscapeTuned?.94:.91,Math.max(0,Math.min(100,delta))/(1000/60));
 const wanted=target;
 const eased=same?previous.zoom+(wanted-previous.zoom)*ease:wanted;
 const fit=Math.min(1.45,horizFit,(h-topInset-bottomInset)/(bottom-top));
 const zoom=Math.min(fit,eased,options.mobileLandscapeTuned?(options.mobileLandscapeLaneZoom??Infinity):Infinity);
 const low=bottom-(h/2-bottomInset)/zoom;
 // Keep the floor fixed instead of bobbing vertically or zooming on jumps.
 const y=low;
 const lane=options.mobileLandscapeTuned&&options.mobileLandscapeLane,halfBody=(gap+260)*zoom/2;
 const desiredCenter=lane?(halfBody*2<=lane.right-lane.left?Math.max(lane.left+halfBody,Math.min(lane.right-halfBody,w/2)):(lane.left+lane.right)/2):w/2;
 const screenCenter=Math.max(side+halfBody,Math.min(w-side-halfBody,desiredCenter));
 const wantedX=(a.x+b.x)/2+(w/2-screenCenter)/zoom;
 const halfWidth=(w-side*2)/(2*zoom),leftBound=Math.max(a.x,b.x)+130-halfWidth,rightBound=Math.min(a.x,b.x)-130+halfWidth;
 const useLane=lane&&Number.isFinite(options.mobileLandscapeLaneZoom);
 const minX=useLane?Math.max(a.x,b.x)+130-(lane.right-w/2)/zoom:leftBound;
 const maxX=useLane?Math.min(a.x,b.x)-130+(w/2-lane.left)/zoom:rightBound;
 const x=same?Math.max(minX,Math.min(maxX,previous.x+(wantedX-previous.x)*ease)):Math.max(minX,Math.min(maxX,wantedX));
 return {x,y,zoom,hud,width:w,height:h,mode:'classic',...(options.mobileLandscapeTuned?{mobileLandscapeBaseHeight:baseHeight}:{})};
}
export function backgroundFrame(width,height,c){
 // Fixed world geometry for a viewport. Size once for the widest legal view,
 // including a 270-unit jump, rather than rescaling stage landmarks per frame.
 const aspect=1672/941,classic=c?.mode==='classic';
 const {w,h,side,top:topInset,bottom:bottomInset,ease}=fightViewport(width,height,classic);
 // The smallest target at the unchanged world limits (68..892) and a full
 // 270-unit jump bounds every eased frame. Geometry never follows the actors.
 const minZoom=Math.min(classic?1.45:1.12,(w-side*2)/(classic?1094:1084),(h-topInset-bottomInset-ease)/583);
 // One world unit of bleed prevents subpixel seams at the derived limits.
 const worldTop=458-(h-bottomInset)/minZoom-1;
 // The original midpoint camera may leave more foreground at very wide gaps.
 // Cover that fixed bound without resizing the backdrop as fighters move.
 const worldBottom=Math.max(458+bottomInset/minZoom,classic?300+h/2/minZoom:0)+1;
 const fixedHeight=Math.max((430-worldTop)/.76,(worldBottom-430)/.24,(w/minZoom+824+80)/aspect);
 return{x:480,y:430,width:fixedHeight*aspect,height:fixedHeight,top:430-fixedHeight*.76,bottom:430+fixedHeight*.24,floor:430};
}
export function ambientPaper(milliseconds,reduced=false){const t=reduced?0:milliseconds/1000;return Array.from({length:8},(_,i)=>({x:40+i*126+Math.sin(t*.5+i)*14,y:25+((i*43+t*(7+i%3))%280),angle:Math.sin(t+i)*.4,alpha:.12+i%3*.035}));}
export function drawComicItem(g,kind,x,y,size=1,rotation=0){
 const duck=kind==='rubber_duck';g.save();g.translateCanvas(x,y);g.rotateCanvas(rotation);g.scaleCanvas(size,size);
 g.lineStyle(2,0x243a3d,1);
 if(duck){g.fillStyle(0xf5cf48);g.fillEllipse(0,0,31,21);g.strokeEllipse(0,0,31,21);g.fillCircle(8,-10,10);g.strokeCircle(8,-10,10);g.fillStyle(0xe77c38);g.fillTriangle(15,-13,27,-9,16,-6);g.fillStyle(0x17343b);g.fillCircle(11,-13,1.5);g.lineStyle(1.5,0xc18c24,1);g.lineBetween(-7,-1,3,4);}
 else{g.fillStyle(0xfff8df);g.fillCircle(0,0,13);g.strokeCircle(0,0,13);g.lineStyle(1.3,0xaba18a,1);g.beginPath();g.moveTo(-9,-3);g.lineTo(1,-7);g.lineTo(-2,2);g.lineTo(9,6);g.strokePath();g.lineBetween(-2,2,-7,9);}
 g.restore();
}
