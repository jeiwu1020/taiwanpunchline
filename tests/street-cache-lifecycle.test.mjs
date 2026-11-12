import rawTest from 'node:test';
import assert from 'node:assert/strict';
import {createCanvas} from '@napi-rs/canvas';
import {paintCachedStreetLayer,streetStaticCacheDiagnostics} from '../dist/preview/campaign/street-static-cache.mjs';

function fixture(policy){
 const canvas=createCanvas(1688,780),ctx=canvas.getContext('2d'),allocated=[];
 canvas.ownerDocument={createElement(){const c=createCanvas(1,1);allocated.push(c);return c;}};
 ctx.setTransform(2,0,0,2,0,0);ctx.drawImage=()=>{};
 const options={image:createCanvas(1536,1024),width:844,height:390,curb:700,frame:{presentation:{width:844,height:390,touch:policy==='finite'},zoom:.8,backdropZoom:.8,left:0,base:500,backdropScene:{}}};
 let paints=0;
 return {ctx,options,allocated,paint:()=>{assert.equal(streetStaticCacheDiagnostics(ctx).policy,policy);paints++;},get paints(){return paints;}};
}
for(const policy of ['retained','finite']){
 const test=(name,run)=>rawTest(policy+': '+name,run);
test('one bounded street layer survives repeated native PNG bypass and reappearance',()=>{
 const f=fixture(policy);
 assert.equal(paintCachedStreetLayer(f.ctx,f.options,f.paint),true);
 const retained=f.allocated[0],dimensions=[retained.width,retained.height],count=f.allocated.length,paints=f.paints;
 for(let cycle=0;cycle<30;cycle++){
  assert.equal(paintCachedStreetLayer(f.ctx,{...f.options,frame:{...f.options.frame,base:290}},f.paint),false);
  assert.deepEqual([retained.width,retained.height],dimensions,'hidden layer stays allocated for the same scene');
  assert.equal(paintCachedStreetLayer(f.ctx,f.options,f.paint),true);
 }
 assert.equal(f.allocated.length,count);assert.equal(f.paints,paints,'returning sky reuses already-covered static content');
 assert.ok(retained.width*retained.height<=16*1024*1024);
});
for(const change of ['scene identity','width','height','DPR','source','extension','edge','curb','scene index'])test(`hidden street cache releases on ${change} change`,()=>{
 const f=fixture(policy);paintCachedStreetLayer(f.ctx,f.options,f.paint);
 const old=f.allocated[0],count=f.allocated.length,paints=f.paints,next={...f.options,frame:{...f.options.frame,base:290}};
 if(change==='scene identity')next.frame.backdropScene={};
 if(change==='width')next.width++;
 if(change==='height')next.height++;
 if(change==='DPR')f.ctx.setTransform(3,0,0,3,0,0);
 if(change==='source')next.image=createCanvas(1536,1024);
 if(change==='extension')next.extension=createCanvas(1536,2304);
 if(change==='edge')next.edge=createCanvas(1536,128);
 if(change==='curb')next.curb=695;
 if(change==='scene index')next.scene=1;
 assert.equal(paintCachedStreetLayer(f.ctx,next,f.paint),false);
 assert.deepEqual([old.width,old.height],[1,1],'stale retained backing store is released even while bypassing');
 assert.equal(f.allocated.length,count,'bypass does not allocate a replacement');
 assert.equal(paintCachedStreetLayer(f.ctx,{...next,frame:{...next.frame,base:500}},f.paint),true);
 assert.ok(f.allocated.length>count);assert.ok(f.paints>paints);
});
test('street layer falls back and releases when required native density exceeds its memory bound',()=>{
 const f=fixture(policy);paintCachedStreetLayer(f.ctx,f.options,f.paint);const old=f.allocated[0],count=f.allocated.length;
 const huge={...f.options,frame:{...f.options.frame,zoom:100,base:55000}};
 assert.equal(paintCachedStreetLayer(f.ctx,huge,f.paint),false);
 assert.deepEqual([old.width,old.height],[1,1]);assert.equal(f.allocated.length,count);
});

}
