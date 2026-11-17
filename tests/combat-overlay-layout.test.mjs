import test from 'node:test';import assert from 'node:assert/strict';
let api={};try{api=await import('../dist/combat-overlay-layout.mjs');}catch(e){if(e.code!=='ERR_MODULE_NOT_FOUND')throw e;}
test('portrait feedback anchors cleanly below the top HUD without touching controls',()=>{
 assert.equal(typeof api.feedbackPlacement,'function');
 const p=api.feedbackPlacement({width:390,height:844,touch:true,portrait:true,specials:[{left:165,top:650,right:271,bottom:702}],buttons:[],stick:{right:106}});
 assert.equal(p.top,160);assert.equal(p.left,195);assert.ok(p.width<=370);
 const custom=api.feedbackPlacement({width:390,height:844,touch:true,portrait:true,hudBottom:153});
 assert.equal(custom.top,159);
});
test('landscape feedback anchors cleanly below the top HUD',()=>{
 assert.equal(typeof api.feedbackPlacement,'function');
 const p=api.feedbackPlacement({width:844,height:390,touch:true,portrait:false,specials:[{left:500,top:260}],buttons:[{left:500,top:260},{left:505,top:322}],stick:{right:138}});
 assert.equal(p.top,120);assert.equal(p.left,422);assert.ok(p.width<=520);
});
test('mic overlay keeps its 44px size below the information row, with no HUD width reservation',()=>{
 assert.equal(typeof api.routeMicPlacement,'function');
 for(const [width,height,hudBottom] of [[390,844,134],[844,390,112],[568,320,112]]){
  const p=api.routeMicPlacement({width,height,hudBottom});assert.equal(p.size,44);assert.ok(p.top>=hudBottom+6);assert.ok(p.right>=6);assert.ok(p.top+p.height<height);
 }
});

test('mounted overlays track rotation and HUD extents, hide outside routes, and clean up',async()=>{
 const {JSDOM}=await import('jsdom');
 const {readFileSync}=await import('node:fs');
 const dom=new JSDOM(readFileSync(new URL('../dist/index.html',import.meta.url),'utf8'),{pretendToBeVisual:true});
 const d=dom.window.document,app=d.querySelector('.app');
 let width=390,height=844,rotated=false;
 const geo=new Map([[app,{left:0,top:0,right:390,bottom:844}],[d.querySelector('.dom-hud'),{left:8,top:70,right:382,bottom:134}],[d.querySelector('#item-status'),{left:100,top:138,right:290,bottom:153}],[d.querySelector('#touch-stick'),{left:10,top:720,right:108,bottom:818}]]);
 for(const b of d.querySelectorAll('.control-deck button'))geo.set(b,{left:170,top:650,right:270,bottom:702});
 Object.defineProperties(app,{clientWidth:{get:()=>width},clientHeight:{get:()=>height}});
 dom.window.HTMLElement.prototype.getBoundingClientRect=function(){const r=geo.get(this)||{left:0,top:0,right:0,bottom:0};const b=rotated?{left:height-r.bottom,top:r.left,right:height-r.top,bottom:r.right}:r;return{...b,width:b.right-b.left,height:b.bottom-b.top};};
 dom.window.HTMLCanvasElement.prototype.getContext=()=>null;
 Object.assign(app.dataset,{touch:'true',layout:'portrait',rotation:'0'});
 const mounted=api.mountCombatOverlayLayout({document:d}),banner=d.querySelector('#broadcast'),canvas=d.querySelector('.route-mic-overlay');
 assert.equal(banner.style.getPropertyValue('--feedback-bottom'),'');assert.equal(banner.style.getPropertyValue('--feedback-top'),'159px');assert.equal(app.style.getPropertyValue('--hud-safe-top'),'159px');assert.equal(banner.dataset.placed,'true');assert.equal(canvas.style.top,'161px');
 assert.ok(Array.isArray(mounted.cameraSafety.occlusions),'overlay exposes measured logical camera blockers');assert.ok(mounted.cameraSafety.occlusions.some(r=>r.kind==='control'),'buttons reserve their actual rectangles');assert.equal(mounted.cameraSafety.safeRect.right,390);
 mounted.draw({route:true,images:{},time:0});assert.equal(canvas.hidden,false);
 mounted.draw({route:false,images:{},time:0});assert.equal(canvas.hidden,true);
 rotated=true;app.dataset.rotation='90';mounted.refresh();assert.equal(banner.style.getPropertyValue('--feedback-bottom'),'');assert.equal(banner.style.getPropertyValue('--feedback-top'),'159px');assert.equal(app.style.getPropertyValue('--hud-safe-top'),'159px');assert.equal(canvas.style.top,'161px');
 mounted.destroy();assert.equal(d.querySelector('.route-mic-overlay'),null);dom.window.close();
});
