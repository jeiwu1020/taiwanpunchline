import {drawChallengeTabletopBand,drawChallengeTableFront} from './challenge-art.mjs?v=chapter-presentation-20261117-r1';
import {GROUND} from './core.mjs?v=chapter-presentation-20261117-r1';
import {presentationFighter} from './move-readability.mjs?v=chapter-presentation-20261117-r1';
export const chapter2RenderActor=f=>presentationFighter(f);
export const chapter2WorldPoint=(x,y,depth,{left,base,zoom})=>({x:(x-left)*zoom,y:base+(y-GROUND+(depth??0)*.65)*zoom});
export function chapter2TableFrame(p,frame,depthMode){
 const point=chapter2WorldPoint((p.left+p.right)/2,GROUND,p.depth,frame);
 return {...point,width:(p.right-p.left)*frame.zoom,height:(GROUND-p.y)*frame.zoom,depthHalf:depthMode?(p.depthHalf??30)*frame.zoom:null};
}
export function chapter2ObstacleFrame(q,frame){return {...chapter2WorldPoint(q.x,q.y??GROUND,q.depth,frame),width:50*frame.zoom,height:80*frame.zoom};}

/** A horizontal tabletop spans depth, so split only where an actor's feet
 * cross it. Foreground bands then cover rear actors without ever clipping an
 * actor sprite or moving a jumping actor out of its original depth lane. */
export function chapter2SceneLayers(platforms,actors,depthMode,encounter=null,routeState=null,callouts=[]){
 const layers=[];
 for(const p of platforms){
  const half=p.depthHalf??30,back=(p.depth??0)-half,front=(p.depth??0)+half;
  if(!depthMode){layers.push({kind:'table-solid',p,depth:back});continue;}
  const lanes=[...actors.map(a=>a.depth??0),...(encounter?.props??[]).map(p=>p.depth??0),...(encounter?.gates??[]).map(g=>g.depth??0),...(routeState&&!routeState.supplyUsed&&Number.isFinite(routeState.section?.supplyX)?[routeState.section.supplyDepth??0]:[]),...(Number.isFinite(routeState?.gateX)?[0]:[])];
  const cuts=[back,...new Set(lanes.filter(d=>d>back&&d<front)),front].sort((a,b)=>a-b);
  for(let i=1;i<cuts.length;i++)layers.push({kind:'table-top',p,from:cuts[i-1],to:cuts[i],depth:(cuts[i-1]+cuts[i])/2});
  layers.push({kind:'table-front',p,depth:front});
 }
 if(depthMode){
  for(const gate of encounter?.gates??[])layers.push({kind:'encounter-gate',value:gate,depth:gate.depth??0});
  for(const prop of encounter?.props??[])layers.push({kind:'encounter-prop',value:prop,depth:prop.depth??0});
  if(routeState&&!routeState.supplyUsed&&Number.isFinite(routeState.section?.supplyX))layers.push({kind:'route-supply',value:{x:routeState.section.supplyX},depth:routeState.section.supplyDepth??0});
  if(Number.isFinite(routeState?.gateX))layers.push({kind:'route-gate',value:{x:routeState.gateX},depth:0});
 }else if(encounter?.boss){
  // Put the boss interaction on the table's front edge, after the tabletop
  // and before either fighter, so it stays visible without covering combat.
  for(const prop of encounter.props??[])layers.push({kind:'encounter-prop',value:prop,depth:-.001});
 }
 for(const callout of callouts)layers.push({kind:'callout',value:callout,depth:(callout.actor.depth??0)-.001});
 for(const a of actors)layers.push({kind:'actor',a,depth:a.depth??0});
 return layers.sort((a,b)=>a.depth-b.depth);
}
/** Reuse the original table texture with the same landing footprint. The
 * apron and front legs occupy the near plane all the way down to the ground. */
export function drawChapter2TableLayer(ctx,images,layer,frame){
 const image=images['challenge-street-props'];if(!image)return false;
 const {p}=layer,width=(p.right-p.left)*frame.zoom,x=(p.left-frame.left)*frame.zoom;
 if(layer.kind==='table-top'){
  const half=p.depthHalf??30,back=(p.depth??0)-half,span=half*2;
  const point=chapter2WorldPoint(p.left,p.y,back,frame);
  drawChallengeTabletopBand(ctx,image,{x,y:point.y,width,height:span*.65*frame.zoom,from:(layer.from-back)/span,to:(layer.to-back)/span});
 }else if(layer.kind==='table-front'){
  const point=chapter2WorldPoint(p.left,p.y,layer.depth,frame);
  drawChallengeTableFront(ctx,image,{x,y:point.y,width,height:(GROUND-p.y)*frame.zoom});
 }
 return true;
}
