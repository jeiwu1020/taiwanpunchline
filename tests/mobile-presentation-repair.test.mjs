import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {cameraFrame} from '../dist/arena-presentation.mjs';
import {fullStageCameraFrame} from '../dist/combat-presentation.mjs';
import {depthRouteCameraFrame} from '../dist/challenge-depth-render.mjs';
import {createMobileCameraAdapter} from '../dist/preview/campaign/mobile-camera-adapter.mjs';
const actors=()=>[{x:436,y:430,hp:100},{x:524,y:430,hp:100}];
const measured=JSON.parse(readFileSync(new URL('./fixtures/challenge-camera-native-landscape.json',import.meta.url),'utf8'));
const opts={touch:true,portrait:false,nativeLandscape:true,cameraMode:'classic',...measured};
function clearMeasuredUI(frame,subjects){
 for(const actor of subjects){const b={left:422+(actor.x-(frame.controlOverlay==='soft'?132:130)-frame.x)*frame.zoom,right:422+(actor.x+(frame.controlOverlay==='soft'?132:130)-frame.x)*frame.zoom,top:195+(actor.y+(actor.depth||0)*.65-300-frame.y)*frame.zoom,bottom:195+(actor.y+(actor.depth||0)*.65+28-frame.y)*frame.zoom};
  assert.ok(b.left>=-1e-6&&b.right<=844+1e-6&&b.top>=-1e-6&&b.bottom<=390+1e-6,'complete body proxy remains in canvas');
  for(const r of measured.occlusions){const bottom=frame.controlOverlay==='soft'&&r.kind==='control'?b.bottom-168*frame.zoom:b.bottom;assert.ok(b.right<=r.left-6+1e-6||b.left>=r.right+6-1e-6||bottom<=r.top-6+1e-6||b.top>=r.bottom+6-1e-6,`standing head/collar proxy clears controls and full body proxy clears measured ${r.kind}`);}
 }
}
test('landscape close dynamic uses at least 160 alpha pixels per standing Wang body',()=>{
 const f=fullStageCameraFrame(cameraFrame,844,390,actors(),null,16.7,opts);
 assert.ok(f.zoom*276>=160,`standing body ${f.zoom*276}px`);
});
test('landscape jump does not chase the vertical midpoint while the body envelope fits',()=>{
 // The closer profile uses the old fixture's spare vertical space. This
 // controlled HUD leaves actual room for a short ascent at unchanged scale.
 const safeAscent={...opts,occlusions:measured.occlusions.map(r=>r.kind==='control'?r:{...r,bottom:Math.min(r.bottom,50)}).filter(r=>r.bottom>r.top)};
 const fs=actors();let f=fullStageCameraFrame(cameraFrame,844,390,fs,null,16.7,safeAscent);
 const floor=390/2+(458-f.y)*f.zoom;
 fs[0].y=415;
 const next=fullStageCameraFrame(cameraFrame,844,390,fs,f,16.7,safeAscent);
 assert.ok(Math.abs((390/2+(458-next.y)*next.zoom)-floor)<.01,'ground anchor stays fixed during safe ascent');
});
test('main and later classic street stay near approved stable scale while nonstreet pairs stay unchanged',()=>{
 const [player,enemy]=actors();const world={player,enemy,enemies:[enemy],worldWidth:3600};
 for(const camera of ['classic','stable']){const f=depthRouteCameraFrame(844,390,world,{...opts,fullStage:true,landscapePreview:true,camera,cameraMode:camera});
 assert.ok(f.zoom*276>=160,`route standing body ${f.zoom*276}px`);assert.equal(!!f.playerCloseCamera,camera==='classic');clearMeasuredUI(f,camera==='classic'?[player]:[player,enemy]);if(camera==='classic')assert.ok(f.zoom>=(390*.68/328)*.9&&f.zoom<=390*.68/328);}
 // Real later-chapter standing preferences, rather than the old synthetic .3 zoom.
 for(const [route,preferred]of [[false,{zoom:275/390,left:0,base:275}],[true,{zoom:.8,left:0,base:295}]]){const adapted=createMobileCameraAdapter().frame(preferred,world,{...opts,width:844,height:390,camera:'classic',route});assert.ok(adapted.zoom*276>=160,'later chapters retain readable bodies when the measured layout has room');assert.equal(!!adapted.cameraFrame.playerCloseCamera,route);if(route)assert.ok(adapted.zoom>=(390*.68/328)*.9&&adapted.zoom<=390*.68/328,'classic street stays within10% of approved stable scale');else assert.ok(adapted.zoom>=preferred.zoom,'shared mobile profile can exceed the older chapter VS preference');clearMeasuredUI(adapted.cameraFrame,route?[player]:[player,enemy]);}
});
test('portrait HUD item hint has its own readable solid background including held items',()=>{
 const css=readFileSync(new URL('../dist/combat-presentation-v75.css',import.meta.url),'utf8');
 assert.match(css,/\[data-layout="portrait"\] #item-status\{[^}]*background:#17353a;/);
 assert.match(css,/\[data-layout="portrait"\] #item-status\{[^}]*font-size:10px;/);
 assert.match(css,/\[data-layout="portrait"\] #item-status\.has-item\{[^}]*background:#ffdf7b;/);
});
test('short landscape title gets two face rows instead of a 28 percent height cap',()=>{
 const css=readFileSync(new URL('../dist/title-screen.css',import.meta.url),'utf8');
 assert.match(css,/--title-face-height:clamp\(58px,38cqh,118px\)/);
});
test('landscape street jump keeps the player safe at exact scale across front and back lanes',async()=>{
 const {Duel}=await import('../dist/core.mjs');
 for(const depth of [-90,0,100])for(const jumping of ['player','enemy']){
  const duel=new Duel('wang','easy',()=>.2,'han',{mode:'training',trainingBehavior:'stand'});
  duel.player.x=1000;duel.enemy.x=1088;duel.nextItemAt=Infinity;
  duel.player.depth=depth;duel.enemy.depth=depth;
  const route={player:duel.player,enemy:duel.enemy,enemies:[duel.enemy],worldWidth:3600};
  const options={...opts,fullStage:true,landscapePreview:true,camera:'classic'};
  let frame=depthRouteCameraFrame(844,390,route,options);
  // Drive a legal ballistic envelope without route AI or input changing lanes.
  for(let i=0;i<=120;i++){
   const t=i/120,actor=route[jumping];actor.y=430-270*Math.sin(Math.PI*t);actor.vy=-270*Math.PI*Math.cos(Math.PI*t);
   const next=depthRouteCameraFrame(844,390,route,{...options,previous:frame,delta:1000/120});
   assert.ok(next.playerCloseCamera);assert.equal(next.zoom,frame.zoom,'jumping player or enemy cannot alter scale');
   for(const a of [route.player]){
    assert.ok(195+(a.y+depth*.65-300-next.y)*next.zoom>=101-1e-6,'player head clears HUD');
    assert.ok(195+(a.y+depth*.65+28-next.y)*next.zoom<=measured.safeRect.bottom+1e-6,'player feet fit');
    assert.ok(422+(a.x-132-next.x)*next.zoom>=0,'player left edge fits');
    assert.ok(422+(a.x+132-next.x)*next.zoom<=844,'player right edge fits');
   }
   frame=next;
  }
 }
});
