import {drawChallengeTabletopBand,drawChallengeTableFront} from './challenge-art.mjs?v=workers-background-only-20261113-r1';
import {GROUND} from './core.mjs?v=workers-background-only-20261113-r1';
import {presentationFighter} from './move-readability.mjs?v=workers-background-only-20261113-r1';
export const chapter4RenderActor=f=>presentationFighter(f);
export const chapter4WorldPoint=(x,y,depth,{left,base,zoom})=>({x:(x-left)*zoom,y:base+(y-GROUND+(depth??0)*.65)*zoom});
export function chapter4TableFrame(p,frame,depthMode){
 const point=chapter4WorldPoint((p.left+p.right)/2,GROUND,p.depth,frame);
 return {...point,width:(p.right-p.left)*frame.zoom,height:(GROUND-p.y)*frame.zoom,depthHalf:depthMode?(p.depthHalf??30)*frame.zoom:null};
}
export function chapter4ObstacleFrame(q,frame){return {...chapter4WorldPoint(q.x,q.y??GROUND,q.depth,frame),width:50*frame.zoom,height:80*frame.zoom};}

/** A horizontal tabletop spans depth, so split only where an actor's feet
 * cross it. Foreground bands then cover rear actors without ever clipping an
 * actor sprite or moving a jumping actor out of its original depth lane. */
export function chapter4SceneLayers(platforms,actors,depthMode){
 const layers=[];
 for(const p of platforms){
  const half=p.depthHalf??30,back=(p.depth??0)-half,front=(p.depth??0)+half;
  if(!depthMode){layers.push({kind:'table-solid',p,depth:back});continue;}
  const cuts=[back,...new Set(actors.map(a=>a.depth??0).filter(d=>d>back&&d<front)),front].sort((a,b)=>a-b);
  for(let i=1;i<cuts.length;i++)layers.push({kind:'table-top',p,from:cuts[i-1],to:cuts[i],depth:(cuts[i-1]+cuts[i])/2});
  layers.push({kind:'table-front',p,depth:front});
 }
 for(const a of actors)layers.push({kind:'actor',a,depth:a.depth??0});
 return layers.sort((a,b)=>a.depth-b.depth);
}
/** Reuse the original table texture with the same landing footprint. The
 * apron and front legs occupy the near plane all the way down to the ground. */
export function drawChapter4TableLayer(ctx,images,layer,frame){
 const image=images['challenge-street-props'];if(!image)return false;
 const {p}=layer,width=(p.right-p.left)*frame.zoom,x=(p.left-frame.left)*frame.zoom;
 if(layer.kind==='table-top'){
  const half=p.depthHalf??30,back=(p.depth??0)-half,span=half*2;
  const point=chapter4WorldPoint(p.left,p.y,back,frame);
  drawChallengeTabletopBand(ctx,image,{x,y:point.y,width,height:span*.65*frame.zoom,from:(layer.from-back)/span,to:(layer.to-back)/span});
 }else if(layer.kind==='table-front'){
  const point=chapter4WorldPoint(p.left,p.y,layer.depth,frame);
  drawChallengeTableFront(ctx,image,{x,y:point.y,width,height:(GROUND-p.y)*frame.zoom});
 }
 return true;
}
