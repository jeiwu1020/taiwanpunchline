import rawTest from 'node:test';
import assert from 'node:assert/strict';
import {createCanvas} from '@napi-rs/canvas';
import {RUNTIME_VERSION} from '../build/runtime-version.mjs';
const {streetStaticCacheDiagnostics}=await import(`../dist/preview/campaign/street-static-cache.mjs?v=${RUNTIME_VERSION}`);
// Mechanism coverage deliberately selects each policy, independent of the
// synthetic raster dimensions; actual entry profile routing has its own suite.
for(const policy of ['retained','finite']){
 const test=(name,run)=>rawTest(policy+': '+name,run),presentation={width:844,height:390,touch:policy==='finite'};
for(const chapter of [2,3,4])for(const [w,h,z] of [[390,844,.7],[844,390,.8],[1280,720,1.2]])test(`chapter ${chapter} ${w}x${h} reuses static original-resolution layer across camera motion`,async()=>{
 const {drawStreetBackdrop}=await import(`../dist/preview/chapter${chapter}/street-backdrop.mjs`),canvas=createCanvas(w*2,h*2),ctx=canvas.getContext('2d'),image=createCanvas(1536,1024),extension=createCanvas(1536,2304);extension.getContext('2d').fillRect(0,0,1536,2304);image.getContext('2d').fillRect(0,0,1536,1024);let creates=0,paints=0;const owner={createElement(){creates++;const c=createCanvas(1,1);c.ownerDocument=owner;const b=c.getContext('2d'),draw=b.drawImage.bind(b);b.drawImage=(im,...args)=>{if(im===image)paints++;return draw(im,...args);};return c;}};canvas.ownerDocument=owner;ctx.setTransform(2,0,0,2,0,0);
 // Record cache-source work without rasterizing hundreds of redundant output
 // composites. The separate landmark test below uses the real destination.
 ctx.drawImage=()=>{};
 let first;for(let i=0;i<121;i++){drawStreetBackdrop(ctx,image,{presentation,zoom:z,left:i*2,base:Math.max(h*.76,700*z)+Math.sin(i/30)*8,backdropZoom:z},w,h,700,extension);assert.equal(streetStaticCacheDiagnostics(ctx).policy,policy);first??=paints;}assert.ok(first>0,'static original image is prepared at full density');assert.equal(paints,first,'moving camera only composites prepared layer');assert.ok(creates<=12,'static content plus source transition and paper are bounded per destination canvas');
});
test('prepared facade preserves source pixels and world landmarks at native source density',async()=>{
 const {drawStreetBackdrop}=await import('../dist/preview/chapter2/street-backdrop.mjs'),image=createCanvas(1536,1024),brush=image.getContext('2d');brush.fillStyle='#edcd91';brush.fillRect(0,0,1536,1024);brush.fillStyle='#132f37';for(let x=0;x<1536;x+=64)brush.fillRect(x,0,13,1024);for(let y=0;y<1024;y+=64)brush.fillRect(0,y,1536,9);
 const w=390,h=844,dpr=2,f={presentation,zoom:390/550,left:350.25,base:640,backdropZoom:390/550},unit=489*f.zoom/700,tile=1536*unit,y=f.base-569*f.zoom,phase=-((f.left*f.zoom)%tile);const actual=createCanvas(w*dpr,h*dpr),expected=createCanvas(w*dpr,h*dpr);
 for(const c of [actual,expected])c.getContext('2d').setTransform(dpr,0,0,dpr,0,0);drawStreetBackdrop(actual.getContext('2d'),image,f,w,h,700);const ref=expected.getContext('2d');for(let n=phase-tile;n<w;n+=tile)ref.drawImage(image,n,y,tile,1024*unit);
 // The original facade interior is independent of fallback sky and road fill.
 const a=actual.getContext('2d').getImageData(0,Math.ceil((y+20)*dpr),w*dpr,400).data,b=ref.getImageData(0,Math.ceil((y+20)*dpr),w*dpr,400).data;let worst=0;for(let i=0;i<a.length;i++)worst=Math.max(worst,Math.abs(a[i]-b[i]));assert.ok(worst<=2,`source landmarks remain pixel aligned, worst channel delta ${worst}`);
});
test('unexposed sky uses the already-decoded native PNG rather than copying a larger canvas',async()=>{
 const {drawStreetBackdrop}=await import('../dist/preview/chapter2/street-backdrop.mjs'),canvas=createCanvas(1688,780),ctx=canvas.getContext('2d'),image=createCanvas(1536,1024),extension=createCanvas(1536,2304);let offscreen=0;canvas.ownerDocument={createElement(){offscreen++;return createCanvas(1,1);}};ctx.setTransform(2,0,0,2,0,0);drawStreetBackdrop(ctx,image,{presentation,zoom:.8,left:300,base:296.4},844,390,695,extension);assert.equal(offscreen,0,'no extra rasterization when all registered sky/edge compositing is offscreen');
});

}
