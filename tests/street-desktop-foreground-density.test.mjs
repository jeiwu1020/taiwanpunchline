import test from 'node:test';
import assert from 'node:assert/strict';
import {createDepthChallengeRenderer,depthRouteCameraFrame} from '../dist/challenge-depth-render.mjs';
import {ChallengeRoute} from '../dist/challenge-engine.mjs';
import {sceneFixture,artImages} from './helpers/street-render-scene.mjs';
function setup(){const f=sceneFixture(),route=new ChallengeRoute('wang','easy',()=>.2);route.depthMode=true;route.player.x=1100;route.spawn();const renderer=createDepthChallengeRenderer(f.scene,artImages);return {...f,route,renderer};}
function draw(f,extra={}){const frame={...depthRouteCameraFrame(1440,900,f.route),presentation:{width:1440,height:900,touch:false},...extra};f.renderer.draw(f.route,0,frame);return f.textures.get('challenge-depth-world');}
test('desktop density experiment preserves full-density direct painting when retained backdrop exceeds its budget',()=>{
 const f=setup();let t=draw(f);assert.deepEqual([t.width,t.height],[2304,1440]);
 t=draw(f,{backdropZoom:40,backdropTop:-500,backdropBottom:1000});assert.equal(f.renderer.diagnostics.reason,'budget');assert.deepEqual([t.width,t.height],[2560,1600]);
 t=draw(f);assert.deepEqual([t.width,t.height],[2304,1440]);
});
test('touch and missing presentation retain the original foreground dimensions',()=>{
 for(const presentation of [{width:1440,height:900,touch:true},undefined]){const f=setup(),t=draw(f,{presentation});assert.deepEqual([t.width,t.height],[2560,1600]);}
});
