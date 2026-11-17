import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {fullStageCameraFrame} from '../dist/combat-presentation.mjs';
import {cameraFrame,fixedStableCameraFrame} from '../dist/arena-presentation.mjs';
import {PORTRAIT_COMBAT_ZOOM_DIVISOR,PORTRAIT_STREET_ZOOM_DIVISOR,portraitStreetDensity,streetPlayerCameraFrame} from '../dist/challenge-camera.mjs';
const fixtures=JSON.parse(readFileSync(new URL('./fixtures/shared-camera-measured-nov11.json',import.meta.url),'utf8')).profiles;
const clone=value=>JSON.parse(JSON.stringify(value));
const WIDTH=390,HEIGHT=844,START_PLAYER=260,START_ENEMY=700;

function runVs(mode,steps,{touch=true,portrait=true,profile='portrait-vs',width=WIDTH,height=HEIGHT}={}){
 const safety=fixtures[profile].cameraSafety;
 let previous=null,frame;
 for(const step of steps){
  const fighters=[{x:step.player,y:430,vy:0,supportY:430,depth:0},{x:step.enemy,y:430,vy:0,supportY:430,depth:0}];
  for(let i=0;i<(step.frames??1);i++){
   frame=fullStageCameraFrame(mode==='stable'?fixedStableCameraFrame:cameraFrame,width,height,fighters,previous,1000/60,{gameMode:'battle',touch,portrait,nativeLandscape:false,cameraMode:mode,paused:false,...(step.safety??safety),measuredCameraSafety:true});
   previous=frame;
  }
 }
 return frame;
}
const view=(frame,width=WIDTH)=>({left:frame.x-width/(2*frame.zoom),right:frame.x+width/(2*frame.zoom)});
const hudShifted=()=>{const safety=clone(fixtures['portrait-vs'].cameraSafety),hud=safety.occlusions.find(item=>item.kind==='hud');hud.bottom+=3;hud.height+=3;return safety;};

test('portrait stable opens between both fighters instead of locking onto the player',()=>{
 const frame=runVs('stable',[{player:START_PLAYER,enemy:START_ENEMY}]),{left,right}=view(frame);
 assert.ok(frame.x>START_PLAYER+60,`camera centre ${frame.x} must sit between the fighters, not on the player`);
 assert.ok(frame.x<START_ENEMY-60);
 assert.ok(START_ENEMY>left&&START_ENEMY<right,'the opponent centre is on screen at the opening');
 assert.ok(START_PLAYER-132>=left-1e-6,'the controlled fighter stays fully inside the safe view');
});

test('portrait stable holds its opening framing and does not slide onto the player',()=>{
 const opening=runVs('stable',[{player:START_PLAYER,enemy:START_ENEMY}]);
 const later=runVs('stable',[{player:START_PLAYER,enemy:START_ENEMY,frames:240}]);
 assert.ok(Math.abs(later.x-opening.x)<1e-6,'idle fight must not move the stable camera after the opening');
 assert.equal(later.zoom,opening.zoom);
});

test('portrait stable follows only when the controlled fighter nears the safe edge, and keeps the opponent in when both fit',()=>{
 const approached=runVs('stable',[{player:START_PLAYER,enemy:START_ENEMY},{player:520,enemy:START_ENEMY,frames:120}]),{left,right}=view(approached);
 assert.ok(520-132>=left-1e-6&&520+132<=right+1e-6);
 assert.ok(START_ENEMY+132<=right+1,'a pair that fits must end up fully framed');
 const walkedAway=runVs('stable',[{player:START_PLAYER,enemy:START_ENEMY},{player:120,enemy:START_ENEMY,frames:120}]),walked=view(walkedAway);
 assert.ok(120-132>=walked.left-1e-6,'the player is never pushed out of the safe view');
});

test('portrait classic keeps one standing scale and no longer re-baselines when HUD geometry changes',()=>{
 const standing=WIDTH/PORTRAIT_COMBAT_ZOOM_DIVISOR;
 const start=runVs('classic',[{player:START_PLAYER,enemy:START_ENEMY,frames:120}]);
 assert.ok(start.zoom>=standing*.9-1e-6&&start.zoom<=standing+1e-6,`opening zoom ${start.zoom} stays within 90-100% of the standing scale`);
 assert.ok(start.zoom>.55,'opening is closer than the old far-away 0.52 framing');
 const closed=runVs('classic',[{player:START_PLAYER,enemy:START_ENEMY,frames:30},{player:330,enemy:480,frames:150,safety:hudShifted()}]);
 assert.ok(closed.zoom<=standing+1e-6,'closing the gap with a HUD reflow must not jump to a closer baseline');
 const reflowedAtRest=runVs('classic',[{player:START_PLAYER,enemy:START_ENEMY,frames:30},{player:START_PLAYER,enemy:START_ENEMY,frames:150,safety:hudShifted()}]);
 assert.ok(Math.abs(reflowedAtRest.zoom-start.zoom)<1e-6,'a layout reflow alone cannot change the zoom');
});

test('street and combat share one phone-portrait standing scale family',()=>{
 for(const [width,height] of [[360,780],[390,844],[430,932]]){
  const street=portraitStreetDensity(width,height),combat=width/PORTRAIT_COMBAT_ZOOM_DIVISOR;
  assert.ok(Math.abs(street-width/PORTRAIT_STREET_ZOOM_DIVISOR)<1e-9);
  assert.ok(combat<street,`${width}px: Boss/VS ${combat.toFixed(3)} stays slightly wider than street ${street.toFixed(3)}`);
  assert.ok(street/combat<1.4,`${width}px: street and Boss are within 40% of each other (was about 2x)`);
 }
});

test('portrait street close camera is pulled back from the old 1.03 and Boss is pushed in from 0.52',()=>{
 const safety=fixtures['portrait-street'].cameraSafety,world={player:{x:300,y:430,supportY:430,depth:0,vy:0,hp:100},enemies:[],mobs:[]};
 const street=streetPlayerCameraFrame(WIDTH,HEIGHT,world,{touch:true,route:true,cameraMode:'classic',camera:'classic',...safety,measuredCameraSafety:true});
 const boss=runVs('classic',[{player:START_PLAYER,enemy:START_ENEMY,frames:120}]);
 assert.ok(street.zoom<1.0&&street.zoom>.7,`street zoom ${street.zoom}`);
 assert.ok(boss.zoom>.55&&boss.zoom<street.zoom,`boss zoom ${boss.zoom}`);
});

test('desktop and non-touch layouts keep the original combat composition',()=>{
 const desktop=runVs('stable',[{player:START_PLAYER,enemy:START_ENEMY}],{touch:false,portrait:false,profile:'desktop-vs',width:1280,height:720});
 assert.ok(Math.abs(desktop.x-START_PLAYER)<1,'desktop stable still opens on the controlled fighter when the pair is wide');
});
