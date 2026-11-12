import {RUNTIME_VERSION} from '../build/runtime-version.mjs';
import test from 'node:test';import assert from 'node:assert/strict';
import {gameViewport} from '../dist/viewport-geometry.mjs';
import {depthRouteCameraFrame} from '../dist/challenge-depth-render.mjs';
import {ChallengeDepthRoute} from '../dist/challenge-depth-engine.mjs';
import {readFileSync} from 'node:fs';import {createHash} from 'node:crypto';
// Frozen #55 camera/viewport functions, independent of the original checkout.
function oldViewport({width,height,left=0,top=0,safe={},touch=false,rotate=true}){const pad=k=>Math.max(0,Number(safe[k])||0),screenWidth=Math.max(1,width-pad('left')-pad('right')),screenHeight=Math.max(1,height-pad('top')-pad('bottom')),rotation=touch&&rotate&&screenHeight>screenWidth?90:0;return {left:left+pad('left'),top:top+pad('top'),screenWidth,screenHeight,width:rotation?screenHeight:screenWidth,height:rotation?screenWidth:screenHeight,rotation,touch};}
function oldCamera(width,height,route,{touch=true,portrait=width<height}={}){
 const inset={top:Math.min(portrait&&touch?140:118,height*.4),bottom:Math.min(touch?(portrait?198:66):48,height*.45)},available=Math.max(1,height-inset.top-inset.bottom),actorTop=route.player.y+(Number(route.player.depth)||0)*.65-300,floor=495,zoom=Math.min(1.4,width/(portrait?550:1050),Math.max(1,available-40)/Math.max(400,floor-actorTop)),visible=width/zoom,x=Math.max(visible/2,Math.min(Math.max(visible/2,route.worldWidth-visible/2),route.player.x+visible*.13)),base=height-inset.bottom-20-65*zoom,backdropZoom=Math.min(1.4,width/(portrait?550:1050),Math.max(1,available-40)/400),farZoom=Math.min(backdropZoom,Math.max(1,available-40)/(floor-(430-512-90*.65-300))),backdropTop=floor-(height-inset.bottom-20)/farZoom,backdropBottom=floor+(inset.bottom+20)/farZoom;
 return {x,y:430+(height/2-base)/zoom,zoom,backdropZoom,backdropTop,backdropBottom,width,height,mode:'depth-route',hud:0,base,jumpPan:0};
}
for(const [width,height,safe] of [[844,390,{left:47,right:47,bottom:21}],[932,430,{left:59,right:59,bottom:21}],[667,375,{}],[568,320,{}]]){
 test(`${width}x${height}: background fills viewport and the actual fighter remains inside safe bounds`,()=>{
  const old=gameViewport({width,height,safe,touch:true,rotate:false});
  const next=gameViewport({width,height,safe,touch:true,rotate:false,fullBleed:true});
  assert.equal(next.left,0);assert.equal(next.top,0);assert.equal(next.width,width);assert.equal(next.height,height);
  const route=new ChallengeDepthRoute('wang','easy',()=>.2);route.player.x=1100;
  for(const depth of [-90,0,100])for(const y of [430,300,150,53]){
   route.player.depth=depth;route.player.y=y;
   const before=oldCamera(old.width,old.height,route,{fullStage:true,touch:true,portrait:false});
   const after=depthRouteCameraFrame(width,height,route,{fullStage:true,touch:true,portrait:false,landscapePreview:true,safe});
   assert.ok(after.zoom>0);assert.ok(after.zoom<=.9,'phone landscape remains bounded');
   const top=(y+depth*.65-300-after.y)*after.zoom+height/2;
   const front=(y+depth*.65+28-after.y)*after.zoom+height/2;
   assert.ok(top>=88+(safe.top||0));assert.ok(front<=height-(safe.bottom||0)-66);
   assert.ok(after.backdropTop<=after.y-height/after.zoom/2);assert.ok(after.backdropBottom>=after.y+height/after.zoom/2);
  }
 });
}
test('phone portrait, desktop, and CSS-rotated portrait retain viewport geometry with shared camera safety',()=>{
 for(const params of [{width:390,height:844,safe:{top:47,bottom:34},touch:true,rotate:false},{width:1280,height:720,touch:false,rotate:false},{width:390,height:844,safe:{top:47,bottom:34},touch:true,rotate:true}]){
  assert.deepEqual(gameViewport({...params,fullBleed:true}),oldViewport(params));
  const route=new ChallengeDepthRoute('wang','easy',()=>.2),frame=oldViewport(params);
  for(const y of [430,53]){route.player.y=y;const options={fullStage:true,touch:params.touch,portrait:frame.width<frame.height},actual=depthRouteCameraFrame(frame.width,frame.height,route,options),preferred=oldCamera(frame.width,frame.height,route,options);assert.equal(actual.width,preferred.width);assert.equal(actual.height,preferred.height);assert.equal(actual.cameraSafetyFit,true);assert.ok(actual.zoom<=preferred.zoom+1e-7,'safety never inflates the preferred frame');const head=frame.height/2+(y-300-actual.y)*actual.zoom,feet=frame.height/2+(y+28-actual.y)*actual.zoom;assert.ok(head>=0&&feet<=frame.height);}
 }
});
test('combat definitions, legacy storage and art retain their byte contracts; shared engines preserve exact export identity',async()=>{
 for(const file of ['core.mjs','challenge-engine.mjs','challenge-depth-engine.mjs']){
  let sharedURL;
  for(const chapter of ['chapter2','chapter3','chapter4']){
   const facadeURL=new URL('../dist/preview/'+chapter+'/'+file,import.meta.url),source=readFileSync(facadeURL,'utf8');
   const exports=[...source.matchAll(/^export \* from ['"]([^'"]+)['"];$/gm)];assert.equal(exports.length,1,chapter+'/'+file+' has one shared export source');
   // Query parameters are part of the ESM module identity. Import the exact
   // production target, not a second unversioned copy of the same source file.
   const rootURL=new URL(exports[0][1],facadeURL);assert.equal(rootURL.pathname,new URL('../dist/'+file,import.meta.url).pathname,chapter+'/'+file+' points to the root implementation');
   sharedURL??=rootURL.href;assert.equal(rootURL.href,sharedURL,'all chapters use the same complete module URL');
   const root=await import(rootURL),nested=await import(facadeURL);
   assert.deepEqual(Object.keys(nested),Object.keys(root),chapter+'/'+file+' complete exports');
   for(const name of Object.keys(root))assert.equal(nested[name],root[name],chapter+'/'+file+' '+name+' uses the actual shared implementation');
  }
 }
 const hashes={"combat-rules.mjs": "4e1bad86d9885e03b7539e7d9b1084aa09a86ff6039787e070a6cefb86772476", "profile-progress.mjs": "774a98c00191ce84323b3d5ddb9b2bce822d218e72d63c796f0f3d780076cdd1", "art-render.mjs": "0da4c56b1dd60fc415ce7e7d969550df440c34275a23503e0d5cdfed41fdff39", "challenge-art.mjs": "c551408f6f29c284489fd5c9655fd9dbeb966852ec6a895730b3d60dc2487a51"};
 // The freeze changed only these import cache versions, not artwork code.
 // Verify each complete new specifier before restoring its recorded historical
 // version for the existing hashes; no imports or implementation bytes are omitted.
 const priorImportVersions={
  'art-render.mjs':{'challenge-opening-assets.mjs':'75','art-signature.mjs':'37','art-expression.mjs':'39','art-roster.mjs':'39','art-motion.mjs':'44','art-collar.mjs':'18'},
  'challenge-art.mjs':{'challenge-joints.mjs':'integrated-20261110-r1','street-seam-repair.mjs':'integration-20261110-r1','challenge-arena-backdrop.mjs':'boss-sky-20261110-r1','art-motion.mjs':'44'},
 };
 for(const [file,hash] of Object.entries(hashes)){
  let source=readFileSync(new URL('../dist/'+file,import.meta.url),'utf8');
  for(const [dependency,version] of Object.entries(priorImportVersions[file]??{})){
   const actual=`'./${dependency}?v=${RUNTIME_VERSION}'`;assert.ok(source.includes(actual),file+' retains its frozen '+dependency+' import');
   source=source.replace(actual,`'./${dependency}?v=${version}'`);
  }
  if(file==='challenge-art.mjs')source=source.replace(" 'challenge-arena-layer':'challenge/arena-foreground-r1.png',\n",'').replace(" 'challenge-arena-sky':'challenge/arena-sky-r1.png',\n",'').replace("./challenge-arena-backdrop.mjs?v=boss-sky-20261110-r1","./challenge-arena-backdrop.mjs?v=76");
  assert.equal(createHash('sha256').update(source).digest('hex'),hash,file);
 }
});
