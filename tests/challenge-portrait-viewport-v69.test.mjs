import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {routeCameraFrame} from '../dist/challenge-render.mjs';
const route={depthMode:true,player:{x:140,y:430,depth:0},worldWidth:3600};
test('portrait browser chrome does not select landscape camera because the remaining canvas is wider than tall',()=>{
 const browser=routeCameraFrame(374,366,route,{portrait:true});
 const installed=routeCameraFrame(374,440,route,{portrait:true});
 assert.equal(browser.zoom,installed.zoom);
 assert.ok(browser.zoom>.65,'portrait actor should be around 180px, not 96px');
});
test('very short portrait browser retains readable actors within the available height',()=>{
 const f=routeCameraFrame(374,266,route,{portrait:true});
 assert.ok(f.zoom>.55);assert.ok(f.zoom<=254/440);
});
test('the game passes logical viewport orientation, not the leftover canvas aspect',()=>{
 const s=readFileSync(new URL('../dist/game.mjs',import.meta.url),'utf8');
 assert.match(s,/routeCameraFrame\(sw,sh,duel,\{[^}]*portrait:viewportUI\?\.frame\?\.width<viewportUI\?\.frame\?\.height/);
});
test('backdrop extension never stretches a one-pixel skyline into vertical columns',()=>{
 const s=readFileSync(new URL('../dist/challenge-art.mjs',import.meta.url),'utf8');
 assert.doesNotMatch(s,/crop\(ctx,img,\[0,0,frame\.width,1\]/);
});
