import {settleBackdrop} from './helpers/bounded-backdrop-assertions.mjs';
const createDepthBackdropRenderer=(...args)=>{const renderer=rawBackdrop(...args);return {...renderer,draw:(...args)=>settleBackdrop(renderer,...args)};};
import test from 'node:test';
import assert from 'node:assert/strict';
import * as art from '../dist/challenge-art.mjs';
import {createFiniteBackdropRenderer as rawBackdrop} from './helpers/finite-backdrop-fixture.mjs';
import {depthRouteCameraFrame,depthBackdropLayout} from '../dist/challenge-depth-render.mjs';
import {continuousCoverage} from './helpers/bounded-backdrop-assertions.mjs';
import {sceneFixture,artImages} from './helpers/street-render-scene.mjs';
const facade={id:'facade',width:1536,height:1024},sky={id:'sky',width:1536,height:1024};
const images=()=>({...artImages,'challenge-street-facade':facade,'challenge-street-sky':sky});
function recording(){const calls=[];const ctx=new Proxy({drawImage:(...args)=>calls.push(args),globalAlpha:1},{get:(o,k)=>o[k]??(()=>{})});return {ctx,calls};}
test('one continuous sky draw sits behind all repeated facade tiles',()=>{
 const {ctx,calls}=recording();art.drawChallengeBackdrop(ctx,images(),{width:4000,height:2000,top:-1200,bottom:800,curbY:346.5,buildingHeight:489,camera:1850});
 const skyDraws=calls.filter(c=>c[0]===sky),front=calls.filter(c=>c[0]===facade&&c[3]===1536);
 assert.equal(skyDraws.length,1);assert.ok(front.length>=3);assert.equal(calls[0][0],sky);
 const draw=skyDraws[0];assert.deepEqual(draw.slice(5),[0,-1200,4000,2000]);
 for(const c of front){assert.equal(c[6],346.5-489);assert.equal(c[7],1536*489/715);assert.equal(c[8],1024*489/715);}
});
test('layered backdrop requires both complete assets and otherwise keeps old source',()=>{
 for(const missing of ['challenge-street-facade','challenge-street-sky']){const a=images();delete a[missing];const {ctx,calls}=recording();art.drawChallengeBackdrop(ctx,a,{width:2400,height:900});assert.ok(calls.some(c=>c[0]===a['challenge-street-deep']));assert.equal(calls.filter(c=>c[0]===facade||c[0]===sky).length,0);}
});
test('retained facade stays transparent above roof and sky is one independently retained image',()=>{
 const f=sceneFixture(),a=images(),renderer=createDepthBackdropRenderer(f.scene,a);
 const route={player:{x:1100,y:430,depth:0},worldWidth:3600};
 for(const y of [430,53,430]){route.player.y=y;const frame=depthRouteCameraFrame(844,390,route,{fullStage:true,touch:true,portrait:false}),bg=depthBackdropLayout(frame),density=2*frame.zoom;
 renderer.draw(bg,density,density);
 const skies=f.images.filter(i=>i.key==='challenge-depth-sky'&&i.visible);assert.equal(skies.length,1);
 const s=skies[0];assert.equal(s.x,bg.camera);assert.equal(s.y,bg.top);assert.equal(s.width,bg.width);assert.equal(s.height,bg.height);
 continuousCoverage(f,bg,density,density,{repaired:false});
 }
 assert.ok(f.draws.some(c=>c.image===facade));assert.ok(f.draws.some(c=>c.image===sky));
 const skyCount=f.draws.filter(c=>c.image===sky).length;
 const frame=depthRouteCameraFrame(844,390,route,{fullStage:true,touch:true,portrait:false}),bg=depthBackdropLayout(frame);renderer.draw({...bg,camera:bg.camera+40},frame.zoom*2,frame.zoom*2);
 assert.equal(f.draws.filter(c=>c.image===sky).length,skyCount,'horizontal walking does not repaint sky');
 delete a['challenge-street-sky'];renderer.draw(bg,frame.zoom*2,frame.zoom*2);assert.ok(f.images.filter(i=>i.key==='challenge-depth-sky').every(i=>!i.visible));
 renderer.hide();assert.ok(f.images.every(i=>!i.visible));
});
test('optional layered-sky load failure retains playable legacy art, required failures still block',async()=>{
 const {gameHarness}=await import('./helpers/game-harness.mjs');const h=await gameHarness(),callbacks={};
 const scene={load:{image(){},on(name,handler){callbacks[name]=handler;}}};h.ui.Arena.prototype.preload.call(scene);
 callbacks.loaderror({key:'challenge-street-facade'});callbacks.loaderror({key:'challenge-street-sky'});callbacks.loaderror({key:'challenge-street-left-repair'});callbacks.loaderror({key:'challenge-street-right-repair'});
 assert.equal(scene.assetFailure,false);assert.ok(scene.optionalArtFailures.has('challenge-street-facade'));assert.ok(scene.optionalArtFailures.has('challenge-street-sky'));
 callbacks.loaderror({key:'challenge-street-deep'});assert.equal(scene.assetFailure,true);
});
test('actual scene creation excludes missing optional Phaser placeholders before renderer setup',async()=>{
 const {gameHarness}=await import('./helpers/game-harness.mjs');
 for(const reported of [false,true]){const h=await gameHarness(),stop=new Error('canvas boundary'),requested=[];
 const fake=new Proxy({},{get:()=>()=>fake});
 const scene={assetFailure:false,optionalArtFailures:new Set(reported?['challenge-street-facade','challenge-street-sky']:[]),makeBackdrop(){},add:{rectangle:()=>fake,graphics:()=>fake,container:()=>fake,image:()=>fake},textures:{exists:key=>!['challenge-street-facade','challenge-street-sky'].includes(key),get(key){requested.push(key);return{getSourceImage:()=>({width:32,height:32,id:key})};},createCanvas(){throw stop;}}};
 assert.throws(()=>h.ui.Arena.prototype.create.call(scene),error=>error===stop);
 assert.ok(scene.artImages['challenge-street-deep']);assert.equal(scene.artImages['challenge-street-facade'],undefined);assert.equal(scene.artImages['challenge-street-sky'],undefined);
 assert.equal(requested.includes('challenge-street-facade'),false);assert.equal(art.hasLayeredStreet(scene.artImages),false);
 }
});
