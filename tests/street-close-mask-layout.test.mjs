import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {JSDOM} from 'jsdom';
import * as layout from '../dist/challenge-layout.mjs';
import {depthRouteCameraFrame as depth} from '../dist/challenge-depth-render.mjs';
import {createMobileCameraAdapter as adapter} from '../dist/preview/campaign/mobile-camera-adapter.mjs';
const source=JSON.parse(fs.readFileSync(new URL('./fixtures/street-close-pause-geometry-f03.json',import.meta.url)));
const profiles=JSON.parse(fs.readFileSync(new URL('./fixtures/shared-camera-measured-nov11.json',import.meta.url))).profiles;
const box=(l,t,w,h)=>({left:l,top:t,right:l+w,bottom:t+h,width:w,height:h});
const opposite=(r,rotation,w,h)=>rotation===90?box(h-r.bottom,r.left,r.height,r.width):rotation===-90?box(r.top,w-r.right,r.height,r.width):r;
// jsdom supplies visibility inheritance; only layout rectangles are stubbed.
// The real shared measurement and all four production camera entries run.
function fixture({width=568,height=320,rotation=0,camera='classic',route=true,touch=true,owner=true,g=source.active}={}){
 const dom=new JSDOM('<main class="app"><header></header><aside class="challenge-save-slot"></aside><div class="dom-hud"></div><canvas></canvas><section class="control-deck"></section></main>');
 const {document}=dom.window,root=document.querySelector('main'),canvas=root.querySelector('canvas'),hud=root.querySelector('.dom-hud'),controls=root.querySelector('.control-deck');
 const frame={width,height,rotation,camera,touch,route,fullBleed:true,retainCombatLayout:owner};Object.assign(root.dataset,{gameMode:route?'challenge':'battle',depthRoute:String(route),touch:String(touch)});
 const rects=new Map();let shift=0;const allHud=g.occlusions.filter(r=>r.kind==='hud');
 for(const r of g.occlusions){let node;if(r.kind==='toolbar')node=root.querySelector('header');else if(r.kind==='save')node=root.querySelector('aside');else if(r.kind==='hud'){node=document.createElement(r===allHud.at(-1)?'span':'div');if(r===allHud.at(-1)){node.id='item-status';node.setAttribute('role','status');}else node.className='hud-side';hud.append(node);}else if(r.kind==='control'){node=document.createElement('button');controls.append(node);}else{node=document.createElement('div');node.className='chapter-objective';root.append(node);}rects.set(node,{...r});node.getBoundingClientRect=()=>opposite({...r,top:r.top+(r.kind==='hud'?shift:0),bottom:r.bottom+(r.kind==='hud'?shift:0)},rotation,width,height);}
 root.getBoundingClientRect=canvas.getBoundingClientRect=()=>opposite(box(0,0,width,height),rotation,width,height);
 const first=allHud[0],hull=box(first.left,first.top,width-16,first.height);hud.getBoundingClientRect=()=>opposite({...hull,top:hull.top+shift,bottom:hull.bottom+shift},rotation,width,height);
 return {dom,document,root,frame,hud,controls,measure:()=>{layout.applyChallengeCameraLayout(root,frame);return layout.measureChallengeOcclusions({document,root,canvas,frame});},mask(on=true){hud.style.visibility=controls.style.visibility=on?'hidden':'visible';},reflow(dy){shift=dy;},close(){dom.window.close();}};
}
const world=()=>({player:{...source.player},enemies:[],status:'active'});
const projection=f=>[f.x,f.y,f.zoom,f.base,f.backdropTop,f.backdropBottom,f.backdropZoom,f.challengeCameraMode,f.playerCloseCamera];
const cases=[['small',568,320,0,'classic',source.active],['native',844,390,0,'classic',profiles['native-street'].cameraSafety],['side',844,390,90,'classic',profiles['rotated-street'].cameraSafety],['portraitClassic',390,844,0,'classic',profiles['portrait-street'].cameraSafety],['portraitStable',390,844,0,'stable',profiles['portrait-street'].cameraSafety]];
for(const [name,width,height,rotation,camera,g]of cases)test(`${name}: hidden street combat mask retains real measured slots without changing the paused projection`,()=>{
 const h=fixture({width,height,rotation,camera,g});try{const before=h.measure(),w=world(),o={width,height,touch:true,route:true,fullStage:true,camera,rotation},ads=[adapter(),adapter(),adapter()],first=depth(width,height,w,{...o,...before}),later=ads.map(ad=>ad.frame({left:0,base:300,zoom:.5},w,{...o,...before}).cameraFrame);if(name==='small')assert.equal(first.zoom,source.observedActiveZoom);h.mask();const masked=h.measure();assert.deepEqual(masked.occlusions,before.occlusions);assert.deepEqual(masked.fixedCameraGeometry,before.fixedCameraGeometry);w.status='paused';w.player.x+=300;w.player.y-=100;
  assert.deepEqual(projection(depth(width,height,w,{...o,...masked,previous:first,paused:true})),projection(first));ads.forEach((ad,i)=>assert.deepEqual(projection(ad.frame({left:0,base:300,zoom:.5},w,{...o,...masked,paused:true}).cameraFrame),projection(later[i])));
  h.reflow(7);const shifted=h.measure();assert.notDeepEqual(shifted.occlusions,masked.occlusions,'visibility masking never hides real layout movement');h.reflow(0);assert.deepEqual(h.measure(),masked);h.mask(false);assert.deepEqual(h.measure(),before);
 }finally{h.close();}
});
for(const config of [{route:false},{touch:false},{owner:false},{width:900,height:700},{width:601,height:900}])test(`legacy or ownerless profile is not opted into street retention ${JSON.stringify(config)}`,()=>{const h=fixture(config);try{const a=h.measure();h.mask();const b=h.measure();assert.ok(b.occlusions.length<a.occlusions.length);}finally{h.close();}});
test('genuinely hidden or display-none elements are not retained as live street slots',()=>{const h=fixture();try{const a=h.measure();h.mask();h.hud.hidden=true;h.controls.style.display='none';const b=h.measure();assert.ok(b.occlusions.length<a.occlusions.length);assert.equal(b.occlusions.some(r=>r.kind==='hud'||r.kind==='control'),false);}finally{h.close();}});
test('one close-profile predicate is shared by phone street camera and layout retention',()=>{
 assert.equal(typeof layout.streetPlayerCameraProfile,'function');for(const [name,width,height,rotation,camera]of cases)assert.equal(layout.streetPlayerCameraProfile({width,height,rotation,camera,touch:true,route:true}),width<height?'portrait':'landscape',name);
 for(const x of [{width:568,height:320,camera:'stable'},{width:601,height:900,camera:'classic'},{width:900,height:501,camera:'classic'},{width:390,height:844,camera:'classic',touch:false},{width:390,height:844,camera:'classic',route:false}])assert.equal(layout.streetPlayerCameraProfile({touch:true,route:true,...x}),null);
});
