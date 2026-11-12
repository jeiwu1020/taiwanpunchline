import test from 'node:test';
import assert from 'node:assert/strict';
import {existsSync,readFileSync} from 'node:fs';
import {stylesAt} from './helpers/css-contracts.mjs';
import {cameraFrame,stableCameraFrame,backgroundFrame} from '../dist/arena-presentation.mjs';

const file=name=>new URL('../dist/'+name,import.meta.url);
const read=name=>existsSync(file(name))?readFileSync(file(name),'utf8'):'';
const overlayFile=file('overlay-framing.mjs');
const overlay=existsSync(overlayFile)?await import(overlayFile):{};
const native='.app[data-touch="true"][data-overlay-controls="true"]';
const touch='.app[data-touch="true"][data-layout]';
const landscape='.app[data-touch="true"][data-layout="landscape"]';
const portrait='.app[data-touch="true"][data-layout="portrait"]';
const css=()=>['style.css','mobile-game.css','interface-v29.css','interface-v30.css','interface-v32.css','interface-v33.css'].map(read).join('\n');
const style=(part,mode=native,width=568,height=320)=>stylesAt(css(),[part,'.app '+part,touch+' '+part,(mode===portrait?portrait:landscape)+' '+part,mode+' '+part],{width,height});
const near=[{x:436,y:430},{x:524,y:430}];
const views=[[480,320],[568,320],[844,390],[750,369]];
const approx=(a,b)=>assert.ok(Math.abs(a-b)<1e-8,`${a} != ${b}`);
function screen(frame,x,y){return{x:frame.width/2+(x-frame.x)*frame.zoom,y:frame.height/2+(y-frame.y)*frame.zoom};}
function assertBodiesVisible(frame,fighters,label){
 for(const f of fighters){
  const topLeft=screen(frame,f.x-130,f.y-285),bottomRight=screen(frame,f.x+130,458);
  assert.ok(topLeft.x>=0,`${label}: left edge`);
  assert.ok(bottomRight.x<=frame.width+1e-8,`${label}: right edge`);
  assert.ok(topLeft.y>=-1e-8,`${label}: head`);
  assert.ok(bottomRight.y<=frame.height-66,`${label}: lower cards`);
  assert.ok(topLeft.x>=104-1e-8||bottomRight.y<=frame.height-90,`${label}: stick overlap`);
 }
}

test('logical touch landscape reclaims the dock while empty overlay space passes pointer hits through',()=>{
 const deck=style('.control-deck');
 assert.equal(style('.cabinet')['grid-template-rows'],'minmax(0,1fr)');
 assert.equal(deck.position,'absolute');assert.equal(deck.background,'transparent');
 assert.equal(deck['pointer-events'],'none');assert.equal(deck.height,'84px');
 assert.equal(deck.bottom,'6px');assert.equal(deck.left,'14px');assert.equal(deck.right,'14px');
 for(const part of ['.touch-pad','.specials','.basic','.touch-aux'])assert.equal(style(part)['pointer-events'],'none',part+' empty wrapper');
 for(const part of ['#touch-stick','.control-deck button'])assert.equal(style(part)['pointer-events'],'auto',part+' target');
});

test('overlay touch targets stay reachable at narrow and safe-area-reduced landscape widths',()=>{
 for(const [w,h] of views){
  assert.equal(style('#touch-stick',native,w,h).width,'84px');
  assert.equal(style('#touch-stick',native,w,h).height,'84px');
  const deck=style('.control-deck',native,w,h);
  assert.equal(deck['grid-template-columns'],'84px minmax(0,1fr) 54px 54px');
  // 12px app padding + 4px cabinet borders + 28px overlay inset,
  // fixed tracks 84+54+54, three 6px gaps, and two 5px move gaps.
  const card=(w-12-4-28-84-54-54-18-10)/3;
  assert.ok(card>=64,`${w}px: ${card}px move targets`);
  assert.equal(style('.specials button',native,w,h).height,'60px');
  assert.equal(style('.specials small',native,w,h).display,'none');
  assert.notEqual(style('.specials .cooldown',native,w,h).display,'none');
  for(const part of ['.basic .punch','.touch-aux button']){
   assert.ok(parseFloat(style(part,native,w,h).width)>=48);
   assert.ok(parseFloat(style(part,native,w,h).height)>=48);
  }
 }
});

test('upright portrait and desktop retain their original reserved docks',()=>{
 assert.equal(style('.cabinet',portrait,320,568)['grid-template-rows'],'minmax(0,1fr) 184px');
 assert.equal(style('.specials small',landscape).display,'block');
 const desktop=stylesAt(css(),['.cabinet','.app[data-touch="false"] .cabinet'],{width:1180,height:757});
 assert.equal(desktop['grid-template-rows'],'minmax(0,1fr) 62px');
});

test('overlay framing adds real safe fight height and larger near fighters in both camera modes',()=>{
 assert.equal(typeof overlay.overlayCameraFrame,'function','presentation helper must exist');
 for(const camera of [cameraFrame,stableCameraFrame])for(const [w,h] of views){
  // App: 8px padding, 32px header, 4px gap, 4px border, 54px HUD.
  const width=w-16,height=h-102;
  const old=camera(width,height-98,near);
  const frame=overlay.overlayCameraFrame(camera,width,height,near,null,1000/60,true);
  assert.equal(frame.width,width);assert.equal(frame.height,height);
  assertBodiesVisible(frame,near,`${camera.name} ${w}x${h}`);
  assert.ok(frame.zoom>=old.zoom*1.15,`${camera.name} ${w}x${h}: should gain at least 15%`);
 }
});

test('head, feet and left stick stay separate through near, far, edge and jumping frames',()=>{
 assert.equal(typeof overlay.overlayCameraFrame,'function','presentation helper must exist');
 assert.equal(typeof overlay.overlayBackgroundFrame,'function','overlay backdrop must cover lower visible canvas');
 const poses=[near,[{x:68,y:430},{x:152,y:430}],[{x:68,y:430},{x:892,y:430}],
  [{x:68,y:160},{x:892,y:430}],[{x:808,y:160},{x:892,y:160}],
  [{x:808,y:430},{x:892,y:430}],near];
 for(const camera of [cameraFrame,stableCameraFrame])for(const [w,h] of views){
  let frame;
  for(const fighters of poses)for(let tick=0;tick<12;tick++){
   frame=overlay.overlayCameraFrame(camera,w-16,h-102,fighters,frame,1000/60,true);
   assertBodiesVisible(frame,fighters,`${camera.name} ${w}x${h} tick ${tick}`);
   const backdrop=overlay.overlayBackgroundFrame(backgroundFrame,frame.width,frame.height,frame);
   assert.ok(backdrop.x-backdrop.width/2<=frame.x-frame.width/2/frame.zoom,'backdrop left');
   assert.ok(backdrop.x+backdrop.width/2>=frame.x+frame.width/2/frame.zoom,'backdrop right');
   assert.ok(backdrop.top<=frame.y-frame.height/2/frame.zoom,'backdrop top');
   assert.ok(backdrop.bottom>=frame.y+frame.height/2/frame.zoom,'backdrop bottom');
  }
 }
});

test('non-overlay framing is an exact passthrough and never mutates fighters',()=>{
 assert.equal(typeof overlay.overlayCameraFrame,'function','presentation helper must exist');
 const fighters=Object.freeze(near.map(f=>Object.freeze({...f})));
 for(const camera of [cameraFrame,stableCameraFrame]){
  const before=camera(552,120,fighters);
  assert.deepEqual(overlay.overlayCameraFrame(camera,552,120,fighters,before,16,false),camera(552,120,fighters,before,16));
  assert.deepEqual(overlay.overlayBackgroundFrame(backgroundFrame,552,120,before),backgroundFrame(552,120,before));
 }
});

test('a wide overlay deck restores complete purposes beside the same live cooldown',()=>{
 // The repository CSS reader has no DOM/container engine. Model only this
 // stylesheet's nearest deck container at its measured width; browser QA
 // separately owns wrapping/paint at those widths.
 const source=read('interface-v33.css').replaceAll('@container','@media');
 for(const [deckWidth,visible] of [[436,false],[524,false],[600,true],[706,true],[800,true]]){
  const value=part=>stylesAt(source,[native+' '+part],{width:deckWidth,height:84});
  assert.equal(value('.specials small').display,visible?'block':'none');
  assert.equal(value('.specials .cooldown').width,'26px');
  assert.equal(value('.specials .cooldown')['grid-column'],visible?'2':'1');
 }
});

test('overlay backdrop stays fixed in world space through movement and jumping',()=>{
 for(const camera of [cameraFrame,stableCameraFrame])for(const [w,h] of views){
  let frame=overlay.overlayCameraFrame(camera,w-16,h-102,near,null,16,true);
  const fixed=overlay.overlayBackgroundFrame(backgroundFrame,w-16,h-102,frame);
  for(const fighters of [[{x:68,y:160},{x:892,y:430}],[{x:808,y:430},{x:892,y:430}],near]){
   frame=overlay.overlayCameraFrame(camera,w-16,h-102,fighters,frame,16,true);
   assert.deepEqual(overlay.overlayBackgroundFrame(backgroundFrame,w-16,h-102,frame),fixed);
  }
 }
});
