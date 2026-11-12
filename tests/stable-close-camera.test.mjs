import {RUNTIME_VERSION} from '../build/runtime-version.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {ChallengeDepthRoute} from '../dist/challenge-depth-engine.mjs';
import {depthRouteCameraFrame} from '../dist/challenge-depth-render.mjs';
import * as arena from '../dist/arena-presentation.mjs';
const dimensions=[[844,390,true],[932,430,true],[667,375,true],[568,320,true],[390,844,true],[1280,720,false]];
for(const [width,height,touch] of dimensions){
 test(`stable street ${width}x${height}: fixed closer scale through table, lane and jump; player stays visible`,()=>{
 const route=new ChallengeDepthRoute('wang','easy',()=>.2),options={fullStage:true,touch,portrait:width<height,landscapePreview:touch&&width>height,safe:{},camera:'stable'};
 route.player.x=980;const standing=depthRouteCameraFrame(width,height,route,options),classic=depthRouteCameraFrame(width,height,route,{...options,camera:'classic'});
 assert.ok(standing.zoom>classic.zoom,`stable ${standing.zoom} must be closer than ${classic.zoom}`);
 for(const depth of [-90,0,100])for(const y of [430,342,176,53,-82]){
 route.player.depth=depth;route.player.y=y;const f=depthRouteCameraFrame(width,height,route,options),head=height/2+(y+depth*.65-300-f.y)*f.zoom,feet=head+300*f.zoom;
 assert.equal(f.zoom,standing.zoom,'zoom must not depend on pose');assert.ok(head>=0,'head inside viewport');assert.ok(feet<=height,'feet inside viewport');
 assert.ok(f.backdropTop<=f.y-height/f.zoom/2,'backdrop covers top');assert.ok(f.backdropBottom>=f.y+height/f.zoom/2,'backdrop covers bottom');
 }
 });
}
test('street renderer receives the selected camera preference',()=>{
 const s=readFileSync(new URL('../dist/game.mjs',import.meta.url),'utf8');assert.match(s,/routeCameraFrame\([^;]*camera:viewportUI\?\.camera/);
});
test('duel fixed stable camera is invariant through full jump, spacing and resize',()=>{
 assert.equal(typeof arena.fixedStableCameraFrame,'function');
 for(const [w,h] of [[844,206],[390,506],[1280,554],[568,136]]){
 const standing=[{x:260,y:430},{x:700,y:430}];let c=arena.fixedStableCameraFrame(w,h,standing),zoom=c.zoom;
 for(const [x1,x2,y1,y2] of [[68,892,430,430],[68,892,53,430],[600,700,430,53],[260,700,430,430]]){
 const fs=[{x:x1,y:y1},{x:x2,y:y2}];c=arena.fixedStableCameraFrame(w,h,fs,c);assert.equal(c.zoom,zoom);const head=h/2+(y1-285-c.y)*zoom,feet=head+313*zoom;assert.ok(head>=0);assert.ok(feet<=h);assert.ok(w/2+(x1-c.x)*zoom>0);
 }
 }
});
test('fixed duel backdrop covers close panning at arena edges and high table jumps',()=>{
 for(const [w,h] of [[844,206],[390,506],[1280,554],[568,136]])for(const [x,y]of [[68,430],[892,53],[68,-82],[892,430]]){
 const fs=[{x,y},{x:960-x,y:430}],c=arena.fixedStableCameraFrame(w,h,fs),b=arena.backgroundFrame(w,h,c);
 assert.ok(b.x-b.width/2<=c.x-w/c.zoom/2);assert.ok(b.x+b.width/2>=c.x+w/c.zoom/2);assert.ok(b.top<=c.y-h/c.zoom/2);assert.ok(b.bottom>=c.y+h/c.zoom/2);
 }
});
test('cache keys invalidate fixed arena, street camera and main entry as one change',()=>{
 const d=file=>readFileSync(new URL('../dist/'+file,import.meta.url),'utf8');
 for(const [p,child]of [['index.html','game.mjs'],['game.mjs','arena-presentation.mjs'],['game.mjs','challenge-render.mjs'],['challenge-render.mjs','challenge-depth-render.mjs'],['combat-overlay-layout.mjs','challenge-depth-render.mjs']])assert.ok(d(p).includes(child+'?v='+RUNTIME_VERSION),`${p} updates ${child}`);
});
