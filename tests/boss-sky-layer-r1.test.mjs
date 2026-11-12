import test from 'node:test';
import assert from 'node:assert/strict';
import {createCanvas,loadImage} from '@napi-rs/canvas';
import {prepareChallengeArenaImages,drawChallengeArenaBackdrop} from '../dist/challenge-arena-backdrop.mjs';
import {CHALLENGE_ART_FILES} from '../dist/challenge-art.mjs';
const base=new URL('../dist/assets/challenge/',import.meta.url);
const arena=await loadImage(new URL('arena-v2.webp',base)),layer=await loadImage(new URL('arena-foreground-r1.png',base)),sky=await loadImage(new URL('arena-sky-r1.png',base));
function fixture(){const textures=new Map();return {textures:{createCanvas(key,w,h){const c=createCanvas(w,h),t={width:w,height:h,getCanvas:()=>c,getContext:()=>c.getContext('2d'),refresh(){}};textures.set(key,t);return t;}},map:textures};}
const images={'challenge-arena':arena,'challenge-arena-layer':layer,'challenge-arena-sky':sky};
test('boss layers are loaded by the actual challenge asset registry',()=>{assert.equal(CHALLENGE_ART_FILES['challenge-arena-layer'],'challenge/arena-foreground-r1.png');assert.equal(CHALLENGE_ART_FILES['challenge-arena-sky'],'challenge/arena-sky-r1.png');});
test('prepared foreground has complete transparent treetops above original crop, not a horizontal fade',()=>{const s=fixture(),p=prepareChallengeArenaImages(s,images),im=p['challenge-arena-facade'];assert.equal(im.width,1536);assert.equal(im.height,1568);const ctx=im.getContext('2d');let leaf=0,empty=0;const d=ctx.getImageData(0,300,1536,1).data;for(let i=3;i<d.length;i+=4){if(d[i]>220)leaf++;if(d[i]<10)empty++;}assert.ok(leaf>100&&empty>300,'overscan row must contain separate opaque canopy and transparent sky');assert.ok(ctx.getImageData(700,200,1,1).data[3]<10,'central upper sky is transparent');});
test('original architecture below source y=320 and all curb pixels remain exact',()=>{const s=fixture(),p=prepareChallengeArenaImages(s,images),ctx=p['challenge-arena-facade'].getContext('2d'),ref=createCanvas(1536,1024).getContext('2d');ref.drawImage(arena,0,0);assert.ok(Buffer.from(ctx.getImageData(0,864,1536,640).data).equals(Buffer.from(ref.getImageData(0,320,1536,640).data)),'architecture and curb bytes must match source');});
test('layered boss sky does not depend on the unrelated street sky',()=>{const a=createCanvas(900,1300),b=createCanvas(900,1300),fake=createCanvas(40,40),f=fake.getContext('2d');f.fillStyle='#00ff00';f.fillRect(0,0,40,40);for(const [c,extra]of [[a,{}],[b,{'challenge-street-sky':fake}]]){const p=prepareChallengeArenaImages(fixture(),{...images,...extra});c.getContext('2d').translate(0,900);drawChallengeArenaBackdrop(c.getContext('2d'),p,{width:900,height:1300,top:-900,bottom:400,curbY:420,buildingHeight:560,camera:0});}assert.ok(a.toBuffer('image/png').equals(b.toBuffer('image/png')),'unrelated street sky must have no influence');});
test('missing either new optional layer retains the existing fallback preparation',()=>{for(const missing of ['challenge-arena-layer','challenge-arena-sky']){const im={...images};delete im[missing];const p=prepareChallengeArenaImages(fixture(),im);assert.equal(p['challenge-arena-facade'].height,1024);}});
test('new optional boss load failures do not block gameplay and are excluded before render setup',async()=>{
 const {gameHarness}=await import('./helpers/game-harness.mjs'),{createBootArtLoader:realLoader}=await import('../dist/boot-art-loader.mjs');const requests=[];const h=await gameHarness({bootArtLoader:options=>realLoader({...options,createImage:()=>{const im={naturalWidth:1,naturalHeight:1,removeAttribute(){}};Object.defineProperty(im,'src',{set(url){requests.push([url,im]);}});return im;},setTimer:()=>0,clearTimer(){}})});
 const s={events:{once(){}},textures:{addImage(){}},load:{addFile(file){this.gate=file;},nextFile(){}}};h.ui.Arena.prototype.preload.call(s);s.load.gate.load();
 for(let i=0;i<requests.length;i++){const [url,image]=requests[i];if(/arena-(foreground|sky)-r1/.test(url))image.onerror();else image.onload();}
 assert.equal(s.assetFailure,false);assert.equal(s.optionalArtFailures.size,2);
 const fake=new Proxy({},{get:()=>()=>fake}),stop=Error('render setup');const seen=[];
 Object.assign(s,{makeBackdrop(){},add:{rectangle:()=>fake,graphics:()=>fake,container:()=>fake,image:()=>fake},textures:{exists:k=>!k.startsWith('challenge-arena-'),get(k){seen.push(k);return {getSourceImage:()=>({width:32,height:32})};},createCanvas(){throw stop;}}});
 assert.throws(()=>h.ui.Arena.prototype.create.call(s),e=>e===stop);for(const key of ['challenge-arena-layer','challenge-arena-sky']){assert.equal(s.artImages[key],undefined);assert.equal(seen.includes(key),false);}
});
test('matched layers keep bounded per-frame paints and no extra per-frame canvas allocations',async()=>{
 const {sceneFixture,artImages}=await import('./helpers/street-render-scene.mjs'),{createChallengeRenderer}=await import('../dist/challenge-render.mjs');const h=sceneFixture(),gfx=new Proxy({},{get:()=>()=>gfx});h.scene.add.graphics=()=>gfx;
 const renderer=createChallengeRenderer(h.scene,{...artImages,'challenge-arena-layer':{width:1254,height:1254},'challenge-arena-sky':{width:1536,height:1024}});
 renderer.drawArena(0,0,{x:480,y:100,width:390,height:844,zoom:.3});const count=h.canvasCount;
 for(let n=1;n<=120;n++){const before=h.draws.length;renderer.drawArena(n%3,n*16,{x:480+n,y:100-n,width:390,height:844,zoom:.3});assert.ok(h.draws.length-before<48);assert.equal(h.canvasCount,count);}
 assert.equal(h.textures.get('challenge-arena-facade').refreshes,1);assert.equal(h.textures.get('challenge-arena-road').refreshes,1);
});
