import assert from 'node:assert/strict';
export const backdropTiles=f=>f.images.filter(i=>i.key.startsWith('challenge-depth-backdrop')&&i.visible);
export const builds=f=>[...f.textures.entries()].filter(([k])=>k.startsWith('challenge-depth-backdrop')).reduce((n,[,t])=>n+(t.refreshes||0),0);
export const pixels=f=>[...f.textures.values()].reduce((n,t)=>n+t.width*t.height,0);
export function coverage(f,bg,sx=0,sy=sx){
 const tiles=backdropTiles(f);assert.ok(tiles.length,'cached visible world strips exist');
 const rows=new Map();
 for(const t of tiles){const tex=f.textures.get(t.key),dx=tex.width/t.width,dy=tex.height/t.height;assert.ok(dx+1e-8>=sx&&dy+1e-8>=sy,'unchanged current display density');assert.equal(t.depth,-8);const top=t.y+2/dy,bottom=top+(tex.height-4)/dy;const list=rows.get(top)||[];list.push([t.x,t.x+t.width]);rows.set(top,list);assert.ok(tex.height<=8192&&tex.width<=8192);assert.ok(Math.abs(top/256-Math.round(top/256))<1e-8,'row anchored in world coordinates');}
 let bottom=bg.top;for(const [top,spans] of [...rows].sort((a,b)=>a[0]-b[0])){if(top>bottom+1e-7)assert.fail('uncovered vertical stripe');bottom=Math.max(bottom,top+256);let right=bg.camera;for(const [a,b] of spans.sort((a,b)=>a[0]-b[0])){if(a>right+1e-7)assert.fail('uncovered horizontal stripe');right=Math.max(right,b);}assert.ok(right>=bg.camera+bg.width-1e-7);}
 assert.ok(bottom>=bg.bottom-1e-7,'top/bottom view fully covered by tile union');assert.ok(pixels(f)<=32*1024*1024,'all texture pixels bounded');
}
// Geometry/raster tests settle the production bounded filling queue before
// comparing final tiles. Separate tests exercise each individual frame.
export function settleBackdrop(renderer,...args){let result=false;for(let i=0;i<64;i++){result=renderer.draw(...args);if(renderer.diagnostics?.reason==='budget'||(result&&renderer.diagnostics?.pending===0))break;}return result;}
