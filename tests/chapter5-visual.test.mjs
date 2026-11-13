import test from 'node:test';
import assert from 'node:assert/strict';
import {existsSync,readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {createCanvas,loadImage} from '@napi-rs/canvas';
import {chapter5AssetURL} from '../dist/preview/chapter5/chapter5-assets.mjs';
const sceneURL=new URL('../dist/preview/chapter5/chapter5-scene.mjs',import.meta.url);
async function scene(){assert.ok(existsSync(sceneURL),'fifth chapter has actual distinct street presentation');return import(sceneURL);}
test('chapter-five backgrounds, props and fictional staff are owned by chapter five, not chapter-four aliases',async()=>{
 const {CHAPTER5_ART}=await scene();const files=Object.values(CHAPTER5_ART.files);assert.equal(files.length,5);
 for(const file of files){const p=fileURLToPath(chapter5AssetURL(file));assert.ok(p.includes('/chapter5/assets/chapter5/'));assert.ok(existsSync(p));}
 const code=readFileSync(new URL('../dist/preview/chapter5/chapter5-playable.mjs',import.meta.url),'utf8');assert.doesNotMatch(code,/CHAPTER4_NEW_ART|CHAPTER5 as CHAPTER4|chapter4-scene-/);
});
test('one panorama covers the whole chapter street without repeating another chapter or moving its curb',async()=>{
 const {panoramaFrame,CHAPTER5_ART}=await scene();for(let i=0;i<3;i++)for(const zoom of [.42,.8,1.4])for(const left of [-300,0,1000,2600]){
  const f={left,base:520,zoom},im={width:2172,height:724},p=panoramaFrame(im,f,CHAPTER5_ART.curbs[i],2800);
  assert.ok(p.width>=2800*zoom);assert.ok(Math.abs(p.y+CHAPTER5_ART.curbs[i]*p.scale-(f.base-80*zoom))<1e-8);assert.equal(p.x,-left*zoom);
 }
});
test('each route has visible paper-plane return props from the entrance, and keeps them out of walkable depth',async()=>{
 const {chapter5Decorations,PROP_CROPS}=await scene();for(let route=0;route<3;route++){
  const all=chapter5Decorations(route);assert.ok(all.some(p=>p.x<650));assert.ok(all.some(p=>p.x>1800));assert.ok(all.every(p=>p.depth<=-155&&PROP_CROPS[p.kind]));assert.ok(new Set(all.map(p=>p.kind)).size>=3);
 }
});
test('real panorama pixels remain opaque through source edges, jumping overscan and deep foreground at four layouts',async()=>{
 const {drawChapter5Backdrop,CHAPTER5_ART}=await scene();for(let i=0;i<3;i++){
  const image=await loadImage(fileURLToPath(chapter5AssetURL(CHAPTER5_ART.files['chapter5-scene-'+i])));
  for(const [w,h]of [[1280,800],[390,844],[844,390],[568,320]])for(const left of [-400,0,2300]){
   const c=createCanvas(w,h),ctx=c.getContext('2d'),f={left,base:h*.5,zoom:.55};drawChapter5Backdrop(ctx,image,f,w,h,{scene:i,worldWidth:2800});const px=ctx.getImageData(0,0,w,h).data;let opaque=true;for(let n=3;n<px.length;n+=4)if(px[n]!==255){opaque=false;break;}assert.equal(opaque,true,`${i}:${w}x${h}:${left}:opaque`);
  }
 }
});
test('low-zoom road texture keeps its world landmarks and mirrors into both viewport edges',async()=>{
 const {drawChapter5Backdrop}=await scene(),image=createCanvas(2172,724),paint=image.getContext('2d');
 paint.fillStyle='#ff0000';paint.fillRect(0,0,543,724);paint.fillStyle='#00ff00';paint.fillRect(543,0,1086,724);paint.fillStyle='#0000ff';paint.fillRect(1629,0,543,724);
 // The 2500-unit road is 875/1050 pixels wide, anchored to the camera's world
 // left. Edge samples distinguish mirrored overscan from a viewport stretch.
 for(const [zoom,left,samples]of [[.35,-87,[[80,0],[300,1],[750,2],[1000,2],[1160,1]]],[.42,-87,[[80,0],[400,1],[850,2],[1160,2]]],[.35,300,[[20,0],[300,1],[650,2],[900,2],[1100,1]]]]){
  const c=createCanvas(1180,757),ctx=c.getContext('2d');drawChapter5Backdrop(ctx,image,{left,base:520,zoom},1180,757,{scene:0,worldWidth:2500});
  const pixels=ctx.getImageData(0,740,1180,1).data,colors=[[255,0,0,255],[0,255,0,255],[0,0,255,255]];
  for(const [x,color]of samples)assert.deepEqual([...pixels.slice(x*4,x*4+4)],colors[color],`${zoom}/${left}: road landmark at ${x}`);
  for(let x=0;x<1180;x++){const rgb=pixels.slice(x*4,x*4+3);assert.ok(Math.max(...rgb)>128&&Math.min(...rgb)<96,`${zoom}/${left}: road texture covers ${x}`);assert.equal(pixels[x*4+3],255);}
 }
});
test('low-zoom native road strips preserve aspect ratio and world anchors at every route edge',async()=>{
 const {drawChapter5Backdrop,CHAPTER5_ART}=await scene();
 for(let sceneIndex=0;sceneIndex<3;sceneIndex++){
  const image=await loadImage(fileURLToPath(chapter5AssetURL(CHAPTER5_ART.files['chapter5-scene-'+sceneIndex])));
  for(const zoom of [.35,.42])for(const left of [-300,0,1000,2400]){
   const c=createCanvas(1180,757),ctx=c.getContext('2d'),calls=[],draw=ctx.drawImage.bind(ctx);ctx.drawImage=(im,...args)=>{if(im===image&&args.length===8)calls.push({args,m:ctx.getTransform()});return draw(im,...args);};
   drawChapter5Backdrop(ctx,image,{left,base:520,zoom},1180,757,{scene:sceneIndex,worldWidth:2500});assert.ok(calls.length>0);
   for(const {args:a,m}of calls){
    assert.ok(Math.abs(Math.abs(m.a)*a[6]/a[2]-Math.abs(m.d)*a[7]/a[3])<1e-7,'source pixels keep the same horizontal and vertical scale');
    const edge=Math.min(m.a*a[4]+m.e,m.a*(a[4]+a[6])+m.e)/zoom+left;
    assert.ok(Math.abs(edge/2500-Math.round(edge/2500))<1e-6,'road edges remain at fixed mirrored world boundaries');
   }
  }
 }
});
test('normal landing and jump views keep the facade projection without drawing road extensions',async()=>{
 const {drawChapter5Backdrop,CHAPTER5_ART}=await scene(),image=await loadImage(fileURLToPath(chapter5AssetURL(CHAPTER5_ART.files['chapter5-scene-0'])));
 for(const [frame,temple,sign]of [[{left:-87,base:642,zoom:1.1238095238095238},295.6798737174428,977.3645181092696],[{left:-123.52934333697516,base:677.771628576279,zoom:1.0041444256990184},300.8761278710132,909.9738630728809]]){
  const c=createCanvas(1180,757),ctx=c.getContext('2d'),draw=ctx.drawImage.bind(ctx);let extensions=0;ctx.drawImage=(im,...args)=>{if(im===image&&args.length===8)extensions++;return draw(im,...args);};
  const p=drawChapter5Backdrop(ctx,image,frame,1180,757,{scene:0,worldWidth:2500});assert.equal(extensions,0);assert.ok(Math.abs(p.x+153*p.scale-temple)<1e-7);assert.ok(Math.abs(p.x+680*p.scale-sign)<1e-7);
 }
});
test('new inventory and sound-check staff paint their own atlas through the unchanged shared limb rig',async()=>{
 const {drawChapter5Miniboss,CHAPTER5_MINI_CROPS}=await import('../dist/preview/chapter5/chapter5-mob-art.mjs');
 const {Duel}=await import('../dist/core.mjs');const {drawChapter4Miniboss,MINI_CROPS}=await import('../dist/preview/chapter4/chapter4-mob-art.mjs');
 const atlas=await loadImage(fileURLToPath(chapter5AssetURL('chapter5/miniboss-atlas-v2.png'))),limbs=await loadImage(fileURLToPath(chapter5AssetURL('challenge/mob-atlas-v1.webp')));
 for(const mobKind of ['mini_schedule','mini_marshal']){
  const canvas=createCanvas(400,500),ctx=canvas.getContext('2d'),calls=[],draw=ctx.drawImage.bind(ctx);ctx.translate(200,450);ctx.drawImage=(im,...a)=>{calls.push(im);return draw(im,...a);};const f=new Duel('wang').player;f.mobKind=mobKind;
  assert.ok(drawChapter5Miniboss(ctx,{'chapter5-miniboss-atlas':atlas,'challenge-mobs':limbs},f,1000));assert.ok(calls.includes(atlas));assert.ok(calls.includes(limbs));
  assert.ok(drawChapter4Miniboss(ctx,{'chapter4-miniboss-atlas':atlas,'challenge-mobs':limbs},f,1000,{crops:CHAPTER5_MINI_CROPS}));
 }
 assert.notDeepEqual(CHAPTER5_MINI_CROPS,MINI_CROPS);
});
test('inventory clipboard and test meter do not cover the fictional staff faces at rest',async()=>{
 const {drawChapter5Miniboss,CHAPTER5_MINI_CROPS}=await import('../dist/preview/chapter5/chapter5-mob-art.mjs');const {Duel}=await import('../dist/core.mjs');
 const atlas=await loadImage(fileURLToPath(chapter5AssetURL('chapter5/miniboss-atlas-v2.png'))),limbs=await loadImage(fileURLToPath(chapter5AssetURL('challenge/mob-atlas-v1.webp')));
 for(const [i,mobKind]of ['mini_schedule','mini_marshal'].entries()){
  const c=createCanvas(400,500),ctx=c.getContext('2d'),rects={},draw=ctx.drawImage.bind(ctx);ctx.translate(200,450);ctx.drawImage=(im,...a)=>{if(im===atlas)for(const key of ['head','prop','body'])if(a.slice(0,4).every((v,k)=>v===CHAPTER5_MINI_CROPS[i][key][k])){const m=ctx.getTransform(),points=[[a[4],a[5]],[a[4]+a[6],a[5]],[a[4],a[5]+a[7]],[a[4]+a[6],a[5]+a[7]]].map(([x,y])=>({x:m.a*x+m.c*y+m.e,y:m.b*x+m.d*y+m.f}));rects[key]={left:Math.min(...points.map(p=>p.x)),right:Math.max(...points.map(p=>p.x)),top:Math.min(...points.map(p=>p.y)),bottom:Math.max(...points.map(p=>p.y))};}return draw(im,...a);};
  const f=new Duel('wang').player;f.mobKind=mobKind;drawChapter5Miniboss(ctx,{'chapter5-miniboss-atlas':atlas,'challenge-mobs':limbs},f,0);const h=rects.head,p=rects.prop;assert.ok(h.bottom>=rects.body.top+2,mobKind+' jaw meets its collar without an empty neck gap');const intersection=Math.max(0,Math.min(h.right,p.right)-Math.max(h.left,p.left))*Math.max(0,Math.min(h.bottom,p.bottom)-Math.max(h.top,p.top));assert.ok(intersection/((h.right-h.left)*(h.bottom-h.top))<.08,mobKind+' holds the object below and beside its face');
 }
});
