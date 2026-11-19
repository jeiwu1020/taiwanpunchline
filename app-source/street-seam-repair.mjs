// Each boundary receives one asymmetric illustration. The original houses,
// curb, road and world tile scale stay unchanged; only the old mirrored tree
// or climbing vine is replaced. Both sides of a seam share the same sample.
const keys=['challenge-street-left-repair','challenge-street-right-repair'];
const masks=new WeakMap();
export function invalidateStreetSeamRepairs(images){for(const key of keys){const image=images[key],canvas=image&&masks.get(image);if(canvas){canvas.width=1;canvas.height=1;masks.delete(image);}}}
export function hasStreetSeamRepairs(images){return keys.every(k=>images[k]?.width>0&&images[k]?.height>0);}
function patchSurface(ctx,image){
 if(masks.has(image))return masks.get(image);
 const c=ctx.canvas?.ownerDocument?.createElement('canvas')||(typeof OffscreenCanvas==='function'?new OffscreenCanvas(536,715):null);
 if(!c)return null;
 c.width=536;c.height=715;const p=c.getContext('2d');p.drawImage(image,500,0,536,715,0,0,536,715);
 p.globalCompositeOperation='destination-in';const mask=p.createLinearGradient(0,0,536,0);mask.addColorStop(0,'transparent');mask.addColorStop(100/536,'black');mask.addColorStop(436/536,'black');mask.addColorStop(1,'transparent');p.fillStyle=mask;p.fillRect(0,0,536,715);masks.set(image,c);return c;
}
export function drawStreetSeamRepairs(ctx,images,{width,camera,tileWidth,scale,y}){
 if(!hasStreetSeamRepairs(images))return;
 const half=268*scale;
 for(let i=Math.ceil((camera-half)/tileWidth);i*tileWidth-camera<width+half;i++){
  const x=i*tileWidth-camera-268*scale,image=images[keys[Math.abs(i)%2]],patch=patchSurface(ctx,image);
  if(patch)ctx.drawImage(patch,x,y,536*scale,715*scale);
  else{
   // Minimal canvas implementations may not expose a surface factory.
   ctx.save();const alpha=ctx.globalAlpha;
   for(let col=0;col<536;col++){ctx.globalAlpha=alpha*Math.min(1,(col+.5)/100,(535.5-col)/100);ctx.drawImage(image,500+col,0,1,715,x+col*scale,y,scale,715*scale);}
   ctx.restore();
  }
 }
}
