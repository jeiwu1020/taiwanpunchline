import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {JSDOM} from 'jsdom';
import {applyChallengeCameraLayout,measureChallengeOcclusions} from '../dist/challenge-layout.mjs';
import {fitChallengeCamera,playerFixedGeometryKey,canReuseCameraFrame} from '../dist/challenge-camera.mjs';
import {fullStageCameraFrame} from '../dist/combat-presentation.mjs';
import {fixedStableCameraFrame} from '../dist/arena-presentation.mjs';
import {depthRouteCameraFrame} from '../dist/challenge-depth-render.mjs';
import {createMobileCameraAdapter} from '../dist/preview/campaign/mobile-camera-adapter.mjs';
const pair=JSON.parse(readFileSync(new URL('./fixtures/mobile-stable-transient-geometry.json',import.meta.url)));
const box=(left,top,width,height)=>({left,top,right:left+width,bottom:top+height,width,height});
const opposite=(r,rotation,w,h)=>rotation===90?box(h-r.bottom,r.left,r.height,r.width):rotation===-90?box(r.top,w-r.right,r.height,r.width):r;
// Only layout is stubbed: jsdom does not render. Reads really change when text,
// transforms, viewport or permanent layout changes; measurement and all camera
// paths below are the real product APIs. No expected slots are mocked.
function fixture({width=568,height=320,rotation=0,touch=true,camera='stable'}={}){
 const dom=new JSDOM('<main class="app"><header></header><div class="challenge-save-slot"></div><div class="dom-hud"><div class="hud-side"><span class="hud-status"></span></div><div class="timer"></div><div class="hud-side enemy"><span class="hud-status"></span></div><span id="item-status" role="status"></span></div><canvas></canvas><section class="control-deck"><div id="touch-stick"></div><button id="guard"><small class="guard-hint"></small></button><button id="jump"></button><button id="rally"></button><button id="assist"></button><button id="attack"></button><div class="specials"><button></button><button></button><button></button></div></section></main>');
 const {document}=dom.window,root=document.querySelector('main'),canvas=document.querySelector('canvas'),hud=root.querySelector('.dom-hud'),item=root.querySelector('#item-status');
 const nodes=[root.querySelector('header'),root.querySelector('.challenge-save-slot'),...root.querySelectorAll('.dom-hud .hud-side,.dom-hud .timer,.dom-hud .hud-status,#item-status'),...root.querySelectorAll('.control-deck button,.control-deck #touch-stick,.control-deck .specials,.control-deck .guard-hint')];
 let raw=structuredClone(pair.before.options.occlusions),hudShift=0,shift=new Map();
 const frame={width,height,rotation,touch,camera,fullBleed:true};Object.assign(root.dataset,{touch:String(touch),layout:width>height?'landscape':'portrait'});
 root.getBoundingClientRect=canvas.getBoundingClientRect=()=>opposite(box(0,0,frame.width,frame.height),rotation,frame.width,frame.height);
 hud.getBoundingClientRect=()=>opposite(box(8,40+hudShift,frame.width-16,48),rotation,frame.width,frame.height);
 nodes.forEach((node,i)=>node.getBoundingClientRect=()=>{let r={...raw[i]};const dy=shift.get(node.closest('button'))||0;r.top+=dy;r.bottom+=dy;return opposite(r,rotation,frame.width,frame.height);});
 const computed=dom.window.getComputedStyle.bind(dom.window);
 dom.window.getComputedStyle=el=>{const style=computed(el),dy=shift.get(el)||0;return new Proxy(style,{get(target,key){return key==='transform'&&dy?`matrix(1, 0, 0, 1, 0, ${dy})`:Reflect.get(target,key);}});};
 const measure=()=>{applyChallengeCameraLayout(root,frame);return measureChallengeOcclusions({document,root,canvas,frame});};
 return {dom,document,root,item,frame,measure,nodes,setRaw(next){raw=structuredClone(next);},text(text,r){item.textContent=text;raw[7]={kind:'hud',...r};},press(id,dy=2){shift.set(root.querySelector(id),dy);},release(){shift.clear();},reflow(dy){hudShift=dy;for(let i=2;i<=7;i++){raw[i].top+=dy;raw[i].bottom+=dy;}},close(){dom.window.close();}};
}
function runner(kind,pairActors=pair.before.actors){
 const world={player:structuredClone(pairActors[0]),enemy:structuredClone(pairActors[1]),worldWidth:3600,section:{spawns:[]},spawned:new Set(),assists:[],status:'active'};world.enemies=[world.enemy];
 const adapter=createMobileCameraAdapter();let previous=null;
 return {world,reset(){previous=null;adapter.reset();},run(g,extra={}){const o={...g,touch:true,camera:'stable',cameraMode:'stable',fullStage:true,nativeLandscape:true,portrait:false,width:568,height:320,delta:1000/60,...extra};
 if(kind==='solver')previous=fitChallengeCamera({width:o.width,height:o.height,x:480,y:300,zoom:.3},[world.player,world.enemy],previous,o.delta,o);
 else if(kind==='fullStage')previous=fullStageCameraFrame(fixedStableCameraFrame,o.width,o.height,[world.player,world.enemy],previous,o.delta,o);
 else if(kind==='depthRoute')previous=depthRouteCameraFrame(o.width,o.height,world,{...o,previous});
 else previous=adapter.frame({zoom:.3,left:0,base:205},world,{...o,route:kind==='laterRoute'}).cameraFrame;
 return previous;}};
}
const overlap=(a,b)=>a.left<b.right-1e-6&&a.right>b.left+1e-6&&a.top<b.bottom-1e-6&&a.bottom>b.top+1e-6;
function safe(f,g){
 assert.equal(f.cameraSafetyFit,true);const s=f.playerFixedCamera,x=f.width/2+(s.pose.x-f.x)*f.zoom,y=f.height/2+(s.pose.displayY-f.y)*f.zoom,body={left:x-132*f.zoom,right:x+132*f.zoom,top:y-300*f.zoom,bottom:y+28*f.zoom};
 const geometry=g.fixedCameraGeometry||g,r=geometry.safeRect;
 assert.ok(body.left>=r.left-1e-6&&body.right<=r.right+1e-6&&body.top>=r.top-1e-6&&body.bottom<=r.bottom+1e-6);
 for(const o of geometry.occlusions){const pad={left:Math.max(r.left,o.left-6),top:Math.max(r.top,o.top-6),right:Math.min(r.right,o.right+6),bottom:Math.min(r.bottom,o.bottom+6)};assert.equal(overlap(o.kind==='control'?{...body,bottom:y-140*f.zoom}:body,pad),false,'full body avoids HUD and standing head/collar avoids controls');}
}
for(const kind of ['solver','fullStage','depthRoute','laterBattle','laterRoute'])test(`captured empty-item/held-item/restore pair retains fixed layout through ${kind}`,()=>{
 const dom=fixture(),r=runner(kind);try{const g=dom.measure(),before=r.run(g);dom.setRaw(pair.after.options.occlusions);dom.press('#jump',2); // captured after already contains jump displacement
 // Use after HUD and independently changed button rect, without double transform.
 const raw=structuredClone(pair.after.options.occlusions);raw[11]=pair.before.options.occlusions[11];dom.setRaw(raw);
 Object.assign(r.world.player,pair.after.actors[0]);const changed=dom.measure(),after=r.run(changed);
 assert.equal(after.zoom,before.zoom,'the real captured 0.625 → 0.525 shrink must disappear');
 assert.deepEqual(after.playerFixedCamera.anchor,before.playerFixedCamera.anchor);assert.equal(after.playerFixedCamera.geometryKey,before.playerFixedCamera.geometryKey);
 assert.ok(Math.abs(before.zoom-.525)<1e-8,'the text slot is reserved from the first empty frame, not the first non-empty frame');safe(before,g);safe(after,changed);
 dom.setRaw(pair.before.options.occlusions);dom.release();const restore=r.run(dom.measure());assert.equal(restore.zoom,before.zoom);assert.equal(restore.playerFixedCamera.geometryKey,before.playerFixedCamera.geometryKey);
 }finally{dom.close();}
});
for(const rotation of [0,90,-90])test(`DOM text and press cycles preserve slot geometry and nonzero follow lag at rotation ${rotation}`,()=>{
 const dom=fixture({rotation}),r=runner('fullStage');try{const g=dom.measure(),initial=r.run(g);r.world.player.x+=65;let previous=r.run(g);assert.notEqual(previous.x,initial.x+65,'fixture must have residual follow lag');
 const states=[['',box(279,91,10,2)],['道具',box(269,91,30,15)],['超長道具說明'.repeat(15),box(63,91,442,80)],['你持有紙團 · 按攻擊丟出',box(180,91,208,15)],['對手持有椅子',box(215,91,138,15)],['',box(279,91,10,2)]];
 for(let cycle=0;cycle<3;cycle++)for(const [text,rect]of states){dom.text(text,rect);for(const id of ['#guard','#jump','#rally','#assist','#attack','.specials button'])dom.press(id,cycle===1?.75:2);const changed=dom.measure();assert.notDeepEqual(changed.occlusions,g.occlusions,'dynamic raw boxes actually change');assert.deepEqual(changed.fixedCameraGeometry,g.fixedCameraGeometry);const f=r.run(changed);assert.equal(f.zoom,initial.zoom);assert.equal(f.playerFixedCamera.geometryKey,initial.playerFixedCamera.geometryKey);assert.ok(Math.abs(f.x-previous.x)*f.zoom<=8+1e-6);safe(f,changed);previous=f;dom.release();assert.deepEqual(dom.measure().fixedCameraGeometry,g.fixedCameraGeometry);}
 }finally{dom.close();}
});
test('same-size real layout, safe area and dimensions still invalidate fixed geometry; frozen pose and lag survive transients',()=>{
 const dom=fixture(),r=runner('solver');try{const first=r.run(dom.measure());r.world.player.x+=65;const lag=r.run(dom.measure());r.world.player.x+=300;dom.text('對手持有椅子',box(215,91,138,15));dom.press('#jump');const g=dom.measure();assert.equal(canReuseCameraFrame(lag,568,320,{...g,touch:true}),true);const frozen=r.run(g,{paused:true});assert.equal(frozen,lag);assert.deepEqual(frozen.playerFixedCamera.pose,lag.playerFixedCamera.pose);assert.notEqual(lag.x,first.x+65);
 dom.reflow(10);const reflow=dom.measure();assert.notEqual(playerFixedGeometryKey(568,320,reflow),lag.playerFixedCamera.geometryKey);const rebased=r.run(reflow,{paused:true});assert.deepEqual(rebased.playerFixedCamera.pose,lag.playerFixedCamera.pose);safe(rebased,reflow);
 dom.frame.safeLeft=20;const inset=dom.measure();assert.notEqual(playerFixedGeometryKey(568,320,inset),rebased.playerFixedCamera.geometryKey);safe(r.run(inset,{paused:true}),inset);
 dom.frame.width=844;const wide=dom.measure(),resized=r.run(wide,{width:844,paused:true});assert.equal(resized.width,844);assert.deepEqual(resized.playerFixedCamera.pose,lag.playerFixedCamera.pose);safe(resized,wide);
 }finally{dom.close();}
});
test('non-fixed profiles retain dynamic geometry and returning to stable creates a fresh slot state',()=>{
 for(const settings of [{camera:'classic'},{touch:false},{width:320,height:568},{width:844,height:501}]){const dom=fixture(settings);try{const g=dom.measure();assert.notEqual(dom.root.dataset.fixedCameraLayout,'true');const r=runner('fullStage'),options={width:dom.frame.width,height:dom.frame.height,touch:dom.frame.touch,camera:dom.frame.camera,cameraMode:dom.frame.camera};const before=r.run(g,options);assert.equal(before.playerFixedCamera,undefined);dom.text('long',box(10,91,548,100));const changed=dom.measure(),after=r.run(changed,options);assert.notDeepEqual(changed.occlusions,g.occlusions);assert.equal(after.playerFixedCamera,undefined);const baseline=runner('fullStage').run(changed,options),poisoned=runner('fullStage').run({...changed,fixedCameraGeometry:{safeRect:{left:0,top:0,right:1,bottom:1},occlusions:[]}},options);assert.deepEqual(poisoned,baseline,'non-fixed profiles must ignore the separate geometry');}finally{dom.close();}}
 const dom=fixture(),r=runner('fullStage');try{const g=dom.measure(),first=r.run(g),classic=r.run(g,{cameraMode:'classic',camera:'classic'});assert.equal(classic.playerFixedCamera,undefined);assert.equal(r.run(g).zoom,first.zoom);assert.equal(r.run(g,{measuredCameraSafety:false}).playerFixedCamera,undefined);}finally{dom.close();}
});

test('stable slot CSS reserves one readable line without clipping any generated item message at 568px',async()=>{
 const {CAST}=await import('../dist/core.mjs'),{STAGE_ITEMS}=await import('../dist/stage-rules.mjs'),{gameHarness}=await import('./helpers/game-harness.mjs');
 const {createCanvas}=await import('@napi-rs/canvas'),ctx=createCanvas(1,1).getContext('2d');ctx.font='10px sans-serif';
 const h=await gameHarness();h.ui.startGame();const world=h.ui.duel,scene={itemSprites:[],itemGraphics:{clear(){},lineStyle(){},strokeEllipse(){},lineBetween(){}},paintItem(){}};
 const names=Object.keys(CAST),items=Object.keys(STAGE_ITEMS);let longest={width:0,text:''};
 for(const a of names)for(const b of names)for(const held of [null,...items])for(const enemyHeld of [null,...items])for(const status of ['falling','ground','none']){
  world.player.type=a;world.enemy.type=b;world.player.item=held?{kind:held}:null;world.enemy.item=enemyHeld?{kind:enemyHeld}:null;world.items=status==='none'?[]:[{state:status,kind:'paper',x:world.player.x+20,y:430}];
  // Invoke the real game producer; only drawing primitives are suppressed.
  h.ui.Arena.prototype.drawStageItems.call(scene,0);const copy=h.$('#item-status').textContent;
  const width=Math.max(ctx.measureText(copy).width,[...copy].length*10);if(width>longest.width)longest={width,text:copy};
 }
 for(const copy of ['上下左右走位 · 空白鍵／跳躍鍵 · 打小怪得經驗 · 向右前進','← → 移動轉向 · 跳上攤台 · ↓ 下台 · 打小怪得經驗 · 向右前進'])assert.ok([...copy].length*10<=431.6);
 // Conservative full-em bound avoids trusting a missing native CJK font.
 // The explicit one-line content budget is (568 - 16) * .8 - 10 = 431.6px.
 assert.ok(longest.width<=431.6,JSON.stringify(longest));console.log('ITEM_SLOT_TEXT_BUDGET',JSON.stringify(longest));
 const dom=fixture();try{const style=dom.document.createElement('style');style.textContent=readFileSync(new URL('../dist/challenge-layout.css',import.meta.url),'utf8');dom.document.head.append(style);dom.measure();const css=dom.dom.window.getComputedStyle(dom.item);assert.equal(css.height,'15px');assert.equal(css.whiteSpace,'nowrap');assert.equal(css.textOverflow,'ellipsis');assert.equal(css.overflow,'hidden');assert.equal(css.width,'80%');
 dom.frame.camera='classic';dom.measure();assert.notEqual(dom.dom.window.getComputedStyle(dom.item).height,'15px');
 }finally{dom.close();}
});

test('root overlay carries selected stable profile into measurement and refreshes a mode switch',async()=>{
 const {mountCombatOverlayLayout}=await import('../dist/combat-overlay-layout.mjs');const dom=fixture();let binding;
 try{const {document,root}=dom;Object.assign(root.dataset,{touch:'true',layout:'landscape',rotation:'0'});Object.defineProperties(root,{clientWidth:{value:568},clientHeight:{value:320}});const banner=document.createElement('div');banner.id='broadcast';root.append(banner);dom.dom.window.HTMLCanvasElement.prototype.getContext=()=>null;let mode='stable';binding=mountCombatOverlayLayout({document,getCameraMode:()=>mode});const stable=binding.cameraSafety;
 assert.ok(stable.fixedCameraGeometry,'root must supply touch/selected mode before reading HUD CSS');assert.equal(root.dataset.fixedCameraLayout,'true');const first=runner('fullStage').run(stable);dom.text('對手持有紙團',box(215,91,138,15));dom.press('#jump');binding.refresh();assert.equal(playerFixedGeometryKey(568,320,binding.cameraSafety),first.playerFixedCamera.geometryKey);
 mode='classic';void binding.cameraSafety;assert.equal(root.dataset.fixedCameraLayout,'false');mode='stable';void binding.cameraSafety;assert.equal(root.dataset.fixedCameraLayout,'true');
 }finally{binding?.destroy();dom.close();}
});

for(const kind of ['solver','fullStage','depthRoute','laterBattle','laterRoute'])test(`${kind} freezes transient text/press with lag, then uses real reflow and new-world reset`,()=>{
 const dom=fixture(),r=runner(kind);try{const first=r.run(dom.measure());r.world.player.x+=65;const lag=r.run(dom.measure());assert.notEqual(lag.x,first.x+65);r.world.player.x+=500;dom.text('held',box(215,91,138,15));dom.press('#jump');const frozen=r.run(dom.measure(),{paused:true,camera:'classic',cameraMode:'classic'});assert.deepEqual(frozen.playerFixedCamera,lag.playerFixedCamera);assert.equal(frozen.x,lag.x);
 dom.reflow(10);const g=dom.measure(),rebased=r.run(g,{paused:true});assert.notEqual(rebased.playerFixedCamera.geometryKey,lag.playerFixedCamera.geometryKey);assert.deepEqual(rebased.playerFixedCamera.pose,lag.playerFixedCamera.pose);safe(rebased,g);
 r.reset();const fresh=r.run(g);assert.equal(fresh.playerFixedCamera.pose.x,r.world.player.x);safe(fresh,g);
 }finally{dom.close();}
});
test('real root finish retains measured structural slots and frozen lag through HUD updates',async()=>{
 const {gameHarness}=await import('./helpers/game-harness.mjs'),h=await gameHarness(),dom=fixture(),stop=new Error('camera selected'),part=()=>({setVisible(){}}),viewport={frame:{width:568,height:320,touch:true},camera:'stable',nativeLandscape:true};
 const scene={artTime:6000,textPool:[],scale:{width:568,height:320},time:{now:0},cameras:{main:{setViewport(){},setZoom(){},centerOn(){}}},combatOverlay:{cameraSafety:dom.measure(),draw(){throw stop;}},arenaBackdrop:part(),backdropExtensions:[],boundaryGraphics:part(),ambient:part()};
 try{h.ui.setScene(scene);h.ui.setViewport(viewport);h.ui.startGame();while(h.timers.size){const [id,fn]=h.timers.entries().next().value;h.timers.delete(id);fn();}h.ui.duel.status='paused';const draw=delta=>{assert.throws(()=>h.ui.Arena.prototype.updateFrame.call(scene,0,delta),e=>e===stop);return scene.cameraView;};
 draw(0);h.ui.duel.status='active';h.ui.duel.player.x+=65;draw(0);h.ui.duel.status='over';h.ui.duel.winner='player';h.ui.beginMatchFinish();const finish=h.ui.matchFinish,first=finish.camera;
 dom.text('你持有紙團',box(215,91,138,15));dom.press('#jump');scene.combatOverlay.cameraSafety=dom.measure();viewport.camera='classic';h.ui.duel.player.x+=500;
 assert.equal(draw(50),first);assert.equal(finish.elapsed,50);assert.equal(h.timers.size,0);dom.reflow(10);scene.combatOverlay.cameraSafety=dom.measure();const moved=draw(50);assert.notEqual(moved.playerFixedCamera.geometryKey,first.playerFixedCamera.geometryKey);assert.deepEqual(moved.playerFixedCamera.pose,first.playerFixedCamera.pose);assert.equal(h.ui.matchFinish,finish);assert.equal(finish.elapsed,100);safe(moved,scene.combatOverlay.cameraSafety);
 }finally{dom.close();}
});
test('original renderer alpha stays on screen/outside HUD and partly outside controls with the reserved 568 slot',async()=>{
 const {loadLowPoseArt,lowPoseSamples,rasterLowPose,alphaCoverage}=await import('./helpers/camera-low-pose-raster.mjs'),images=await loadLowPoseArt(),dom=fixture();let cases=0;
 try{const g=dom.measure(),structural=g.fixedCameraGeometry,controls=structural.occlusions.filter(r=>r.kind==='control'),hud=structural.occlusions.filter(r=>r.kind!=='control');
 for(const sample of lowPoseSamples())for(const face of [-1,1]){const actor={...sample.actor,face},raster=rasterLowPose(images,actor);for(const offset of [-80,0,80]){const r=runner('fullStage',[actor,{x:940,y:430,hp:100}]);const first=r.run(g);r.world.player.x+=offset;const f=r.run(g,{delta:0}),shown={...actor,x:r.world.player.x};assert.equal(f.zoom,first.zoom);assert.equal(alphaCoverage(raster,f,shown,[structural.safeRect]).outside,0);assert.equal(alphaCoverage(raster,f,shown,hud).covered,0);assert.ok(alphaCoverage(raster,f,shown,controls).outside>0);cases++;}}
 assert.equal(cases,234);console.log('R4_RESERVED_SLOT_ALPHA',JSON.stringify({cases,wholeControl:0,offscreen:0,hudOverlap:0}));
 }finally{dom.close();}
});

test('one root refresh places the microphone from the newly selected HUD slot, without a second refresh',async()=>{
 const {mountCombatOverlayLayout}=await import('../dist/combat-overlay-layout.mjs'),dom=fixture({camera:'classic'});let binding;
 try{const {document,root,item}=dom;Object.assign(root.dataset,{touch:'true',layout:'landscape',rotation:'0'});Object.defineProperties(root,{clientWidth:{value:568},clientHeight:{value:320}});const banner=document.createElement('div');banner.id='broadcast';root.append(banner);dom.dom.window.HTMLCanvasElement.prototype.getContext=()=>null;
 // Simulate the real layout response to the CSS flag, not a cached text rect.
 item.getBoundingClientRect=()=>root.dataset.fixedCameraLayout==='true'?box(63.2,91,441.6,15):box(279,91,10,2);
 let mode='classic';binding=mountCombatOverlayLayout({document,getCameraMode:()=>mode});const mic=root.querySelector('.route-mic-overlay');assert.equal(mic.style.top,'101px');
 mode='stable';const stable=binding.cameraSafety;assert.equal(stable.fixedCameraGeometry.occlusions.find(r=>r.top===91).bottom,106);assert.equal(mic.style.top,'114px','first refresh must use the new 106px HUD bottom, not the old 93px bottom');
 mode='classic';void binding.cameraSafety;assert.equal(mic.style.top,'101px','legacy HUD placement also updates in the same refresh');
 }finally{binding?.destroy();dom.close();}
});
test('read-only geometry inspection cannot turn off an already prepared stable HUD layout',()=>{
 const dom=fixture();try{dom.measure();assert.equal(dom.root.dataset.fixedCameraLayout,'true');const {camera,...frame}=dom.frame;measureChallengeOcclusions({document:dom.document,root:dom.root,canvas:dom.root.querySelector('canvas'),frame});assert.equal(dom.root.dataset.fixedCameraLayout,'true','measurement must not silently select classic on a read-only call');}finally{dom.close();}
});

test('real DOM root camera clicks retain the frozen owner and its overlay slot together for VS, Boss, street and finish',async()=>{
 const {mountGameViewport}=await import('../dist/game-viewport.mjs'),{mountCombatOverlayLayout}=await import('../dist/combat-overlay-layout.mjs');
 for(const sceneKind of ['vs','boss','street','finish']){
  const dom=fixture(),{document,root}=dom,w=dom.dom.window,globalNames=['document','window','navigator','getComputedStyle','ResizeObserver','MutationObserver','requestAnimationFrame','cancelAnimationFrame'],old=Object.fromEntries(globalNames.map(k=>[k,Object.getOwnPropertyDescriptor(globalThis,k)]));let viewport,overlay;
  try{const wrapper=document.createElement('div');wrapper.id='viewport-shell';root.before(wrapper);wrapper.append(root);const stage=root.querySelector('canvas');stage.id='game';for(const el of [root,stage])Object.defineProperties(el,{clientWidth:{value:568},clientHeight:{value:320}});
   for(const id of ['rotate-mode','camera-mode']){const button=document.createElement('button');button.id=id;root.querySelector('header').append(button);}const safeProbe=document.createElement('div');safeProbe.id='safe-insets';safeProbe.style.padding='0px';document.body.append(safeProbe);const dialog=document.createElement('dialog');dialog.id='help-dialog';document.body.append(dialog);const banner=document.createElement('div');banner.id='broadcast';root.append(banner);
   Object.defineProperties(w,{innerWidth:{value:568},innerHeight:{value:320}});w.matchMedia=()=>({matches:true});w.HTMLCanvasElement.prototype.getContext=()=>null;w.requestAnimationFrame=()=>1;w.cancelAnimationFrame=()=>{};const ResizeObserver=class{observe(){}disconnect(){}};
   for(const [key,value]of Object.entries({document,window:w,navigator:w.navigator,getComputedStyle:w.getComputedStyle.bind(w),ResizeObserver,MutationObserver:w.MutationObserver,requestAnimationFrame:w.requestAnimationFrame,cancelAnimationFrame:w.cancelAnimationFrame}))Object.defineProperty(globalThis,key,{configurable:true,writable:true,value});
   const state={status:'paused',finish:null},scene={game:{canvas:stage,renderer:{width:568,height:320,gameContext:{isContextLost:()=>false,setTransform(){}}}},scale:{width:568,height:320,resize(width,height){this.width=width;this.height=height;}},cameraView:null};stage.width=568;stage.height=320;
   Object.assign(root.dataset,{gameMode:sceneKind==='vs'?'battle':'challenge',depthRoute:String(sceneKind==='street')});
   viewport=mountGameViewport({scene,clearHold(){},initialSettings:{rotate:false,camera:'stable'},isCameraFrozen:()=>state.status==='paused'||!!state.finish});
   overlay=mountCombatOverlayLayout({document,getCameraMode:()=>state.finish?.camera?.challengeCameraMode??(state.status==='paused'?scene.cameraView?.challengeCameraMode:null)??viewport.camera});
   const r=runner(sceneKind==='street'?'depthRoute':'fullStage'),g=overlay.cameraSafety,first=r.run(g);r.world.player.x+=65;const frozen=r.run(g);scene.cameraView=frozen;assert.notEqual(frozen.x,first.x+65);if(sceneKind==='finish'){state.status='over';state.finish={camera:frozen};}
   root.querySelector('#camera-mode').click();assert.equal(viewport.camera,'classic');assert.equal(scene.cameraView,frozen);void overlay.cameraSafety;assert.equal(root.dataset.fixedCameraLayout,'true',sceneKind+' keeps its displayed slot while frozen');
   viewport.setPreferences({rotate:false,camera:'stable'});viewport.setPreferences({rotate:false,camera:'classic'});assert.equal(scene.cameraView,frozen);void overlay.cameraSafety;assert.equal(root.dataset.fixedCameraLayout,'true');
   state.status='active';state.finish=null;const nextGeometry=overlay.cameraSafety;assert.equal(root.dataset.fixedCameraLayout,'false','resume applies the selection');const next=r.run(nextGeometry,{camera:viewport.camera,cameraMode:viewport.camera});assert.equal(next.playerFixedCamera,undefined);
  }finally{overlay?.destroy();viewport?.destroy();for(const [key,descriptor]of Object.entries(old)){if(descriptor)Object.defineProperty(globalThis,key,descriptor);else delete globalThis[key];}dom.close();}
 }
});
