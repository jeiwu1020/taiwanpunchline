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
