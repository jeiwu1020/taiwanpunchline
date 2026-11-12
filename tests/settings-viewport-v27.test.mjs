import test from'node:test';import assert from'node:assert/strict';import{mountGameViewport}from'../dist/game-viewport.mjs';
function setup(){const old={};for(const k of['document','window','navigator','getComputedStyle','ResizeObserver','requestAnimationFrame'])old[k]=Object.getOwnPropertyDescriptor(globalThis,k);const nodes=new Map(),$=s=>{if(!nodes.has(s))nodes.set(s,{style:{},dataset:{},clientWidth:500,clientHeight:260,setAttribute(k,v){this[k]=v;}});return nodes.get(s);};const changes=[];Object.defineProperty(globalThis,'document',{configurable:true,value:{querySelector:$}});Object.defineProperty(globalThis,'navigator',{configurable:true,value:{maxTouchPoints:1}});globalThis.window={innerWidth:320,innerHeight:568,location:{search:''},matchMedia:()=>({matches:true}),addEventListener(){}};globalThis.getComputedStyle=()=>({paddingTop:'0',paddingRight:'0',paddingBottom:'0',paddingLeft:'0'});globalThis.ResizeObserver=class{observe(){}};globalThis.requestAnimationFrame=()=>1;const scene={scale:{width:500,height:260,resize(){}},cameraView:{}};return{$,changes,scene,cleanup(){for(const[k,d]of Object.entries(old)){if(d)Object.defineProperty(globalThis,k,d);else delete globalThis[k];}}};}
test('saved viewport preferences initialize camera and rotation and buttons notify changes',()=>{const h=setup();try{const ui=mountGameViewport({scene:h.scene,clearHold(){},initialSettings:{rotate:false,camera:'stable'},onChange:p=>h.changes.push(p)});assert.equal(ui.rotation,0);assert.equal(ui.camera,'stable');h.$('#rotate-mode').onclick();assert.equal(ui.rotation,90);assert.equal(h.changes.at(-1).rotate,true);h.$('#camera-mode').onclick();assert.equal(ui.camera,'classic');assert.equal(h.changes.at(-1).camera,'classic');}finally{h.cleanup();}});
test('reset applies viewport preferences without notification loops and keeps rotated dialog geometry',()=>{const h=setup();try{const ui=mountGameViewport({scene:h.scene,clearHold(){},initialSettings:{rotate:false,camera:'stable'},onChange:p=>h.changes.push(p)});assert.equal(typeof ui.setPreferences,'function');ui.setPreferences({rotate:true,camera:'classic'});assert.equal(ui.rotation,90);assert.equal(ui.camera,'classic');assert.equal(h.changes.length,0);assert.match(h.$('#help-dialog').style.transform,/rotate\(90deg\)/);}finally{h.cleanup();}});
test('camera labels explain both persisted modes and dialog uses logical layout for the full-screen gallery',()=>{const h=setup();try{
 const ui=mountGameViewport({scene:h.scene,clearHold(){},initialSettings:{rotate:true,camera:'classic'}});
 assert.equal(h.$('#camera-mode').textContent,'鏡頭：動態跟隨');assert.equal(h.$('#help-dialog').dataset.layout,'landscape');assert.equal(h.$('#help-dialog').dataset.rotation,'90');
 assert.equal(h.$('#help-dialog').style.width,'552px');assert.equal(h.$('#help-dialog').style.maxHeight,'304px');
 ui.setPreferences({rotate:false,camera:'stable'});assert.equal(h.$('#camera-mode').textContent,'鏡頭：穩定視野');assert.equal(h.$('#help-dialog').dataset.layout,'portrait');assert.equal(h.$('#help-dialog').dataset.rotation,'0');
}finally{h.cleanup();}});
test('scene mounting releases the early viewport listeners before owning layout changes',()=>{const h=setup();try{
 let stopped=0;window.parliamentViewportBoot={stop(){stopped++;}};
 mountGameViewport({scene:h.scene,clearHold(){}});assert.equal(stopped,1);
}finally{h.cleanup();}});
test('short landscape galleries and all challenge shells share the 500px compact cutoff',()=>{const h=setup();try{window.innerWidth=844;window.innerHeight=390;mountGameViewport({scene:h.scene,clearHold(){}});assert.equal(h.$('#help-dialog').dataset.compact,'true');assert.equal(h.$('.app').dataset.compact,'true');}finally{h.cleanup();}});

for(const sceneKind of ['vs','boss','street','finish'])test(`root ${sceneKind}: real camera button and setPreferences preserve a frozen frame with lag until resume`,async()=>{
 const {fitChallengeCamera}=await import('../dist/challenge-camera.mjs');const h=setup();let ui;
 try{const state={status:sceneKind==='finish'?'over':'paused',finish:sceneKind==='finish'},player={x:450,y:430},options={touch:true,cameraMode:'stable',occlusions:[]},preferred={width:500,height:260,x:480,y:300,zoom:.3};
 h.$('.app').dataset.gameMode=sceneKind==='vs'?'battle':'challenge';h.$('.app').dataset.depthRoute=String(sceneKind==='street');
 ui=mountGameViewport({scene:h.scene,clearHold(){},initialSettings:{rotate:false,camera:'stable'},isCameraFrozen:()=>state.status==='paused'||state.finish});
 const first=fitChallengeCamera(preferred,[player],null,16.7,options);player.x+=50;const frozen=fitChallengeCamera(preferred,[player],first,16.7,options);h.scene.cameraView=frozen;
 assert.notEqual(frozen.x,first.x+50,'this is a real nonzero follow residual, not just a marker');
 h.$('#camera-mode').onclick();assert.equal(ui.camera,'classic');assert.equal(h.scene.cameraView,frozen,'paused selected mode must not discard its displayed owner');
 ui.setPreferences({rotate:false,camera:'stable'});assert.equal(ui.camera,'stable');assert.equal(h.scene.cameraView,frozen,'pure-camera preference application must keep frozen pose/lag');
 ui.setPreferences({rotate:false,camera:'classic'});assert.equal(h.scene.cameraView,frozen);
 state.status='active';state.finish=false;const resumed=fitChallengeCamera(preferred,[player],h.scene.cameraView,16.7,{...options,cameraMode:ui.camera});assert.equal(resumed.playerFixedCamera,undefined,'normal active mode processing applies the selected classic camera on resume');
 h.scene.cameraView=frozen;h.$('#camera-mode').onclick();assert.equal(h.scene.cameraView,null,'active camera button still resets history');h.scene.cameraView=frozen;ui.setPreferences({rotate:false,camera:'classic'});assert.equal(h.scene.cameraView,null,'active preferences still reset history');
 state.status='paused';h.scene.cameraView=frozen;ui.setPreferences({rotate:true,camera:'stable'});assert.equal(h.scene.cameraView,null,'a genuine rotation preference retains its original reset lifecycle');assert.equal(ui.rotation,90);
 h.scene.cameraView={...frozen,playerFixedCamera:undefined};h.$('#camera-mode').onclick();assert.equal(h.scene.cameraView,null,'legacy paused snapshots retain their previous reset behavior');
 }finally{h.cleanup();}
});
