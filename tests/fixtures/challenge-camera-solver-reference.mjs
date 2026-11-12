// Frozen #66 fixed-scale exhaustive solver: independent numerical reference.
const clamp=(v,lo,hi)=>Math.max(lo,Math.min(hi,v));
export function placeAtScale(boxes,zoom,rect,occlusions,wanted,limits=null){
 let minX=-Infinity,maxX=Infinity,minY=-Infinity,maxY=Infinity;
 for(const b of boxes){minX=Math.max(minX,rect.left-b.left*zoom);maxX=Math.min(maxX,rect.right-b.right*zoom);minY=Math.max(minY,rect.top-b.top*zoom);maxY=Math.min(maxY,rect.bottom-b.bottom*zoom);}
 if(limits){minX=Math.max(minX,limits.left);maxX=Math.min(maxX,limits.right);minY=Math.max(minY,limits.top);maxY=Math.min(maxY,limits.bottom);}
 if(minX>maxX||minY>maxY)return null;
 const forbidden=[];for(const b of boxes)for(const o of occlusions)forbidden.push({left:o.left-b.right*zoom,right:o.right-b.left*zoom,top:o.top-b.bottom*zoom,bottom:o.bottom-b.top*zoom});
 const x0=clamp(wanted.x,minX,maxX),y0=clamp(wanted.y,minY,maxY);
 const legal=(x,y)=>!forbidden.some(r=>x>r.left+1e-7&&x<r.right-1e-7&&y>r.top+1e-7&&y<r.bottom-1e-7);
 if(legal(x0,y0))return {x:x0,y:y0};
 const xs=[x0,minX,maxX];for(const r of forbidden)for(const x of [r.left,r.right])if(x>=minX&&x<=maxX)xs.push(x);
 let best=null,bestCost=Infinity;
 for(const x of xs){
  const cuts=forbidden.filter(r=>x>r.left+1e-7&&x<r.right-1e-7),ys=[y0,minY,maxY];
  for(const r of cuts)for(const y of [r.top,r.bottom])if(y>=minY&&y<=maxY)ys.push(y);
  for(const y of ys){const cost=(x-wanted.x)**2+(y-wanted.y)**2;if(cost>=bestCost||cuts.some(r=>y>r.top+1e-7&&y<r.bottom-1e-7))continue;bestCost=cost;best={x,y};}
 }
 return best;
}
