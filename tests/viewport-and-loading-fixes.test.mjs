import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {JSDOM} from 'jsdom';
import {createViewportLifecycle,mountViewportProtection} from '../dist/viewport-lifecycle.mjs';
import {loadChapterImage} from '../dist/chapter-image-loader.mjs';
import {loadChapterAssetsInStages} from '../dist/preview/campaign/chapter-asset-loading.mjs';
import {mountChapterLoadingOverlay} from '../dist/chapter-unified-presentation.mjs';

const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');

function makeViewportHarness({timeStart=0,loading=false,width=390,height=844,offsetTop=0}={}){
 const dom=new JSDOM('<!doctype html><html><body><div id="shell"></div></body></html>',{url:'https://test.local/',pretendToBeVisual:true});
 const {window}=dom,{document}=window;
 let time=timeStart,rafId=0;
 const frames=new Map();
 window.performance.now=()=>time;
 window.requestAnimationFrame=fn=>{frames.set(++rafId,fn);return rafId;};
 window.cancelAnimationFrame=id=>frames.delete(id);
 Object.defineProperty(window,'innerWidth',{value:width,writable:true});
 Object.defineProperty(window,'innerHeight',{value:height,writable:true});
 window.visualViewport=Object.assign(new window.EventTarget(),{width,height,offsetTop,offsetLeft:0,scale:1});
 let overlay=null;
 if(loading){
  overlay=mountChapterLoadingOverlay({document,chapter:5});
 }
 const shell=document.querySelector('#shell');
 const read=()=>globalThis.parliamentViewportCore.readGameViewport(window,{touch:false,rotate:false});
 const apply=frame=>{
  Object.assign(shell.style,{left:frame.left+'px',top:frame.top+'px',width:frame.width+'px',height:frame.height+'px'});
 };
 let paintedToken=null;
 const lifecycle=createViewportLifecycle({
  window,
  document,
  requirePaint:true,
  settleMs:120,
  orientationMs:240,
  quietMs:60,
  timeoutMs:5000,
  read,
  apply,
  prepare:()=>({width,height,backingWidth:width,backingHeight:height,valid:true,contextLost:false}),
 });
 const step=(ms=16,paint=true)=>{
  time+=ms;
  const batch=[...frames.values()];
  frames.clear();
  for(const fn of batch)fn(time);
  if(paint&&lifecycle.token&&lifecycle.token!==paintedToken){
   paintedToken=lifecycle.token;
   lifecycle.acknowledgePaint(lifecycle.token,{width,height,backingWidth:width,backingHeight:height,valid:true,contextLost:false});
  }
 };
 const advance=(totalMs,paint=true)=>{
  const steps=Math.ceil(totalMs/16);
  for(let i=0;i<steps;i++)step(16,paint);
 };
 return {dom,window,document,lifecycle,overlay,step,advance,setTime:t=>{time=t;}};
}

test('mountViewportProtection stays hidden while chapter loading overlay is visible unless cameraBlocked',()=>{
 const dom=new JSDOM('<!doctype html><html><body></body></html>');
 const {document}=dom.window;
 const overlay=mountChapterLoadingOverlay({document,chapter:5});
 let rechecks=0;
 const protection=mountViewportProtection(document,()=>rechecks++);
 const notice=document.querySelector('[data-viewport-protection]');
 assert.ok(notice);
 assert.equal(notice.hidden,true);

 protection.update({ready:false,status:'blocked',reason:'surface-unpainted'});
 assert.equal(notice.hidden,true,'viewport notice must not cover active chapter loading overlay');

 protection.setDrawFailure({code:'STREET_CAMERA_BLOCKED'});
 protection.update({ready:false,status:'blocked',reason:'draw-failed'});
 assert.equal(notice.hidden,false,'explicit camera block still surfaces guidance');

 overlay.setReady();
 document.getElementById('chapter-loading-overlay').hidden=true;
 protection.update({ready:true,status:'ready',reason:''});
 assert.equal(notice.hidden,true);

 protection.update({ready:false,status:'blocked',reason:'layout-unstable'});
 assert.equal(notice.hidden,false,'when overlay is hidden, layout block renders notice');
 notice.querySelector('button').click();
 assert.equal(rechecks,1);
 protection.destroy();
 dom.window.close();
});

test('viewport lifecycle tolerates small visualViewport offset jitter and pauses timeout during boot loading',t=>{
 const h=makeViewportHarness({loading:true,offsetTop:5});
 t.after(()=>{h.lifecycle.destroy();h.dom.window.close();});

 // Even past timeoutMs (5000ms), loading state prevents false surface-unpainted block.
 h.advance(6500,false);
 assert.notEqual(h.lifecycle.status,'blocked','should not block while chapter loading overlay is loading');

 // Also verify ±8px visualViewport offset stays valid rather than reporting visual-bounds.
 const sample=globalThis.parliamentViewportCore.readGameViewport(h.window,{touch:false,rotate:false});
 assert.equal(sample.valid,true);
 assert.equal(sample.reason,'');

 // Finish loading and start painting -> becomes ready cleanly.
 h.overlay.setReady();
 h.document.getElementById('chapter-loading-overlay').hidden=true;
 h.advance(800,true);
 assert.equal(h.lifecycle.ready,true);
 assert.equal(h.lifecycle.status,'ready');
});

test('viewport lifecycle auto-recovers once visualViewport bounds stabilize after blocking',async t=>{
 const h=makeViewportHarness({loading:false,offsetTop:95});
 t.after(()=>{h.lifecycle.destroy();h.dom.window.close();});

 h.advance(5500,true);
 assert.equal(h.lifecycle.status,'blocked');
 assert.equal(h.lifecycle.reason,'visual-bounds');

 // Stabilize viewport; wait for the 350ms recovery timer or checkActive to kick in.
 h.window.visualViewport.offsetTop=0;
 await new Promise(resolve=>setTimeout(resolve,420));
 h.advance(600,true);
 assert.equal(h.lifecycle.status,'ready');
 assert.equal(h.lifecycle.ready,true);
});

test('loadChapterAssetsInStages bounds concurrent image downloads to prevent request flooding',async()=>{
 const files={};
 for(let i=0;i<30;i++)files[`shared-${i}`]=`shared-${i}.webp`;
 files['chapter5-scene-0']='scene-0.png';
 files['chapter5-scene-1']='scene-1.png';

 let active=0,maxActive=0;
 const staged=await loadChapterAssetsInStages({
  files,
  concurrency:6,
  resolveScene:async()=>({sceneIndex:0}),
  loadImage:async(key,file)=>{
   active++;
   maxActive=Math.max(maxActive,active);
   await new Promise(resolve=>setTimeout(resolve,5));
   active--;
   return file;
  }
 });
 assert.ok(maxActive<=6&&maxActive>=2,`expected bounded concurrency <= 6, got ${maxActive}`);
 assert.equal(staged.images['shared-29'],'shared-29.webp');
 assert.equal(staged.images['chapter5-scene-0'],'scene-0.png');
 assert.equal(staged.images['chapter5-scene-1'],undefined);
 const bg=await staged.loadBackground();
 assert.equal(bg.images['chapter5-scene-1'],'scene-1.png');
});

test('loadChapterImage retries transient network failures with cache-busting query and respects custom timeouts',async()=>{
 const attemptedUrls=[];
 class FlakyImage{
  constructor(){
   this.onload=null;
   this.onerror=null;
   this._src='';
  }
  set src(value){
   this._src=value;
   attemptedUrls.push(value);
   queueMicrotask(()=>{
    if(attemptedUrls.length<3)this.onerror?.(new Error('flaky'));
    else this.onload?.();
   });
  }
  get src(){return this._src;}
  removeAttribute(name){if(name==='src')this._src='';}
 }

 const img=await loadChapterImage('https://test.local/assets/ch5.png',{ImageType:FlakyImage,retries:2,timeoutMs:1000});
 assert.ok(img instanceof FlakyImage);
 assert.equal(attemptedUrls.length,3);
 assert.equal(attemptedUrls[0],'https://test.local/assets/ch5.png');
 assert.equal(attemptedUrls[1],'https://test.local/assets/ch5.png?asset-retry=2');
 assert.equal(attemptedUrls[2],'https://test.local/assets/ch5.png?asset-retry=3');

 class HungImage{
  set src(_){}
  removeAttribute(){}
 }
 await assert.rejects(
  loadChapterImage('https://test.local/assets/hung.png',{ImageType:HungImage,retries:1,timeoutMs:25}),
  err=>err.code==='timeout'&&/逾時/.test(err.message)
 );
});

test('chapter5 route gate uses drawChapter5Prop and chapters 2-5 defer comic load until staged assets complete',()=>{
 const ch5=readFileSync(resolve(root,'dist/preview/chapter5/chapter5-playable.mjs'),'utf8');
 assert.equal(/drawChallenge5Prop/.test(ch5),false,'chapter5 must not call undefined drawChallenge5Prop');
 assert.match(ch5,/drawChapter5Prop\(ctx,images,'sign'/,'chapter5 route-gate must draw with drawChapter5Prop');

 for(const rel of [
  'dist/preview/chapter2/chapter2-playable.mjs',
  'dist/preview/chapter3/chapter2-playable.mjs',
  'dist/preview/chapter4/chapter4-playable.mjs',
  'dist/preview/chapter5/chapter5-playable.mjs'
 ]){
  const src=readFileSync(resolve(root,rel),'utf8');
  const stageIdx=src.indexOf('loadChapterAssetsInStages(');
  const thenIdx=src.indexOf('.then(async staged=>');
  const comicIdx=src.indexOf('comic.load(images).then(');
  assert.ok(stageIdx>-1&&thenIdx>stageIdx&&comicIdx>thenIdx,`${rel} must run comic.load after staged assets resolve`);
  assert.match(src,/ui\?\.resize\?\.\(\);resizeCanvas\(\);pendingReveal=true;/,`${rel} must reset viewport settle window when starting tick`);
 }

 const uiSrc=readFileSync(resolve(root,'dist/preview/campaign/chapter-ui.mjs'),'utf8');
 assert.match(uiSrc,/maxWidth:touch\|\|rotation\?'none':'1440px'/);
 assert.match(uiSrc,/nextSize===lastObservedSize/);

 const cssSrc=readFileSync(resolve(root,'dist/preview/campaign/chapter-shell.css'),'utf8');
 assert.match(cssSrc,/#trial-app\[data-touch="true"\],#trial-app\[data-sideways="true"\]\{max-width:none;margin:0\}/);
});

test('loadArtImages and createComicImageLoader bound concurrent downloads to at most 6',async()=>{
 const {loadArtImages,ART_FILES}=await import('../dist/art-render.mjs');
 const {createComicImageLoader}=await import('../dist/preview/campaign/story-comic-assets.mjs');

 let activeArt=0,maxActiveArt=0;
 class BoundedArtImage{
  constructor(){this.onload=null;this.onerror=null;this.width=128;this.height=128;this.naturalWidth=128;this.naturalHeight=128;this._src='';}
  set src(v){
   this._src=v;activeArt++;maxActiveArt=Math.max(maxActiveArt,activeArt);
   setTimeout(()=>{activeArt--;this.onload?.();},6);
  }
  get src(){return this._src;}
  removeAttribute(){this._src='';}
 }
 const progressEvents=[];
 const artImages=await loadArtImages('assets/',{
  concurrency:6,
  timeoutMs:2000,
  retries:0,
  ImageType:BoundedArtImage,
  onProgress:e=>progressEvents.push(e)
 });
 const totalArt=Object.keys(ART_FILES).length;
 assert.ok(maxActiveArt>=2&&maxActiveArt<=6,`expected art concurrency <= 6, got ${maxActiveArt}`);
 assert.equal(Object.keys(artImages).length,totalArt);
 assert.equal(progressEvents.length,totalArt);
 assert.equal(progressEvents.at(-1).loaded,totalArt);

 const fakeComicFiles=Object.fromEntries(Array.from({length:16},(_,i)=>[`panel-${i}`,`comic/${i}.png`]));
 let activeComic=0,maxActiveComic=0,failOnce=true;
 class BoundedComicImage{
  constructor(){this.onload=null;this.onerror=null;this.naturalWidth=64;this.naturalHeight=64;this._src='';}
  set src(v){
   this._src=v;activeComic++;maxActiveComic=Math.max(maxActiveComic,activeComic);
   setTimeout(()=>{
    activeComic--;
    if(failOnce&&v.endsWith('comic/0.png')){failOnce=false;this.onerror?.(new Error('transient'));return;}
    this.onload?.();
   },6);
  }
  get src(){return this._src;}
 }
 const comicLoader=createComicImageLoader({
  ImageClass:BoundedComicImage,
  files:fakeComicFiles,
  baseURL:'https://test.local/assets/',
  timeoutMs:2000,
  concurrency:6
 });
 const comicBag={};
 const firstPass=await comicLoader(comicBag);
 assert.equal(firstPass.ready,false);
 assert.ok(maxActiveComic>=2&&maxActiveComic<=6,`expected comic concurrency <= 6, got ${maxActiveComic}`);
 const retryPass=await comicLoader(comicBag,{retry:true});
 assert.equal(retryPass.ready,true);
 assert.equal(Object.keys(comicBag).length,16);
});

test('3v4 brawl pause preparationSnapshot opens read-only ability dialog and finale uses loading overlay & updated rules',async t=>{
 const {createFinaleBrawlSession}=await import('../dist/preview/finale/finale-brawl.mjs');
 const {mountChallengePreparation}=await import('../dist/challenge-preparation.mjs');
 const {CAST}=await import('../dist/core.mjs');
 const dom=new JSDOM('<!doctype html><html><head></head><body></body></html>',{url:'https://test.local/sub/preview/finale/?brawl=1'});
 t.after(()=>dom.window.close());
 const {window}=dom,{document}=window;
 const brawlSession=createFinaleBrawlSession({difficulty:'hard',rank5Perks:true,team:['wang','han','huang']});
 await brawlSession.start(['wang','han','huang']);
 brawlSession.setPaused(true);
 const snap=brawlSession.preparationSnapshot();
 assert.equal(snap.unlockedCharacters.length,7);
 assert.equal(snap.allowance,5);
 assert.equal(snap.testMode,true);
 assert.ok(snap.characters.wang&&snap.characters.ko);

 const resolvedCast=Object.fromEntries(Object.entries(CAST).map(([id,cast])=>[id,{...cast,portrait:`https://test.local/sub/${cast.portrait}`}]));
 const prep=mountChallengePreparation({document,window,characters:resolvedCast,controller:brawlSession,getEncounter:()=>brawlSession.view()});
 assert.equal(prep.open({readOnly:true,intent:'boundary'}),true,'brawl preparation dialog must open in read-only mode');
 assert.equal(prep.isOpen,true);
 assert.ok(document.querySelector('#challengePreparationOverlay img')?.getAttribute('src')?.startsWith('https://test.local/sub/assets/'));

 const finaleSrc=readFileSync(resolve(root,'dist/preview/finale/finale-playable.mjs'),'utf8');
 assert.match(finaleSrc,/mountChapterLoadingOverlay/);
 assert.match(finaleSrc,/loadChapterImage/);
 assert.match(finaleSrc,/abilityCast/);
 const finaleHtml=readFileSync(resolve(root,'dist/preview/finale/index.html'),'utf8');
 assert.equal(finaleHtml.includes('地上的圈線區分隊伍'),false);
 assert.match(finaleHtml,/主角腳底淡金光圈與頭頂/);
});

test('challenge-overview and qa-viewport avoid root-absolute paths for subpath deployments',()=>{
 const overviewHtml=readFileSync(resolve(root,'dist/challenge-overview/index.html'),'utf8');
 assert.equal(/<base\s+href=["']\/["']/i.test(overviewHtml),false,'must not hardcode <base href="/">');
 assert.equal(/(href|src)=["']\//.test(overviewHtml),false,'overview html must not use root-absolute asset paths');

 const overviewJs=readFileSync(resolve(root,'dist/challenge-overview.mjs'),'utf8');
 assert.equal(overviewJs.includes("fetch('/index.html'"),false,'must not fetch root-absolute /index.html');
 assert.equal(overviewJs.includes("location.assign('/')"),false,'must not navigate to root-absolute /');

 const qaHtml=readFileSync(resolve(root,'dist/qa-viewport.html'),'utf8');
 assert.equal(/src=["']\/\??/.test(qaHtml),false,'qa-viewport iframes must use relative paths');
});

test('chapters 2-5 wire in-place onRetry with cachedImages reuse so handoff is preserved on retry',async t=>{
 const cachedImages={};
 let sceneAttempts=0,sharedDownloads=0;
 await assert.rejects(loadChapterAssetsInStages({
  files:{shared:'shared.webp','chapter5-scene-0':'scene0.png'},
  cachedImages,
  resolveScene:async()=>({sceneIndex:0}),
  loadImage:async(key,file)=>{
   if(key==='shared'){sharedDownloads++;return `img:${file}`;}
   sceneAttempts++;
   throw new Error('transient scene failure');
  }
 }),/transient scene failure/);
 assert.equal(sharedDownloads,1);
 assert.equal(cachedImages.shared,'img:shared.webp');

 const retryResult=await loadChapterAssetsInStages({
  files:{shared:'shared.webp','chapter5-scene-0':'scene0.png'},
  cachedImages,
  resolveScene:async()=>({sceneIndex:0}),
  loadImage:async(key,file)=>{
   if(key==='shared'){sharedDownloads++;return `img:${file}`;}
   sceneAttempts++;
   return `img:${file}`;
  }
 });
 assert.equal(sharedDownloads,1,'retry must reuse cached shared assets without re-downloading');
 assert.equal(sceneAttempts,2);
 assert.equal(retryResult.images['chapter5-scene-0'],'img:scene0.png');

 const dom=new JSDOM('<!doctype html><html><body></body></html>');
 t.after(()=>dom.window.close());
 let retried=0;
 const overlay=mountChapterLoadingOverlay({document:dom.window.document,chapter:5,onRetry:()=>{retried++;}});
 const retryBtn=dom.window.document.querySelector('.chapter-loading-retry');
 assert.equal(retryBtn.textContent,'重試載入');
 retryBtn.click();
 assert.equal(retried,1);

 for(const rel of [
  'dist/preview/chapter2/chapter2-playable.mjs',
  'dist/preview/chapter3/chapter2-playable.mjs',
  'dist/preview/chapter4/chapter4-playable.mjs',
  'dist/preview/chapter5/chapter5-playable.mjs'
 ]){
  const src=readFileSync(resolve(root,rel),'utf8');
  assert.match(src,/onRetry:\(\)=>\{void loadAssets\(\);\}/,`${rel} must wire in-place onRetry`);
  assert.match(src,/cachedImages:images/,`${rel} must pass cachedImages to loadChapterAssetsInStages`);
  assert.match(src,/if\(!tickStarted\)\{tickStarted=true;requestAnimationFrame\(tick\);\}/,`${rel} must guard duplicate animation loop`);
 }
});


