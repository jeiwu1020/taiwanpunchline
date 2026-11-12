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
// Layered finite output now projects continuous columns. Keep the historical
// 256-unit source-row contract above for legacy artwork; verify the same world
// registration, density, visible union and bounds at the new output boundary.
export function continuousCoverage(f,bg,sx,sy=sx,{repaired=true}={}){
 const near=(a,b,message)=>assert.ok(Math.abs(a-b)<1e-7,message),tiles=backdropTiles(f);
 const worldWidth=1536*bg.buildingHeight/715,parities=repaired?2:1;
 const active=[...f.textures].filter(([key,t])=>key.includes('-joined-')&&t.width>1);
 assert.equal(active.length,parities,'all required continuous parity backings exist');assert.ok(tiles.length,'visible cached columns exist');
 let right=bg.camera;
 for(const t of [...tiles].sort((a,b)=>a.x-b.x)){
  const tex=f.textures.get(t.key),dx=tex.width/t.width,dy=tex.height/t.height,bleed=2/dx,index=Math.round((t.x+bleed)/worldWidth);
  assert.ok(dx+1e-8>=sx&&dy+1e-8>=sy,'unchanged current background display density');
  near(t.x+bleed,index*worldWidth,'absolute world X anchor');near(t.width,worldWidth+2*bleed,'source bleed does not move the world interior');
  near(t.y*dy,Math.round(t.y*dy),'continuous top aligns to a source pixel');near((t.y+t.height)*dy,Math.round((t.y+t.height)*dy),'continuous bottom aligns to a source pixel');
  assert.ok(t.y<=bg.top+1e-7&&t.y+t.height>=bg.bottom-1e-7,'one uninterrupted vertical projection covers the view');
  assert.equal(t.depth,-8);assert.equal(t.flipX,!repaired&&index%2!==0,'repaired parity is never mirrored');
  assert.equal(t.key,active[repaired?Math.abs(index)%2:0][0],'source parity follows the absolute world index');
  const left=t.x+bleed;assert.ok(left<=right+1e-7,'no uncovered horizontal stripe');right=Math.max(right,left+worldWidth);
 }
 assert.ok(right>=bg.camera+bg.width-1e-7,'complete horizontal view coverage');
 for(const [key,t] of f.textures){assert.ok(t.width<=8192&&t.height<=8192,'native side limit');if(key.startsWith('challenge-depth-backdrop')&&!key.includes('-joined-'))assert.ok(t.width*t.height<=4*1024*1024,'source row allocation cap is unchanged');}
 const sky=f.textures.get('challenge-depth-sky');assert.equal(sky.width,Math.round(bg.width*sx));assert.equal(sky.height,Math.round(bg.height*sy));
 const budget=Math.min(32*1024*1024,Math.max(24*1024*1024,sky.width*sky.height*8));
 assert.ok(pixels(f)+(repaired?2*536*715:0)<=budget,'all allocated textures and repair masks fit the original envelope');
}
// Geometry/raster tests settle the production bounded filling queue before
// comparing final tiles. Separate tests exercise each individual frame.
export function settleBackdrop(renderer,...args){let result=false;for(let i=0;i<64;i++){result=renderer.draw(...args);if(renderer.diagnostics?.reason==='budget'||(result&&renderer.diagnostics?.pending===0))break;}return result;}
