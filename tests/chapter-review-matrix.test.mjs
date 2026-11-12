// Independent review: controller + DOM simulation, not browser layout verification.
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {JSDOM} from 'jsdom';
import {mountChapterInterface} from '../dist/preview/campaign/chapter-ui.mjs';
const layouts=[['portrait',390,844,true,false,0],['native-landscape',844,390,true,true,0],['sideways',390,844,true,true,90],['desktop',1366,768,false,true,0]];
for(const n of [2,3,4])for(const [name,width,height,touch,rotate,rotation] of layouts)test(`independent simulation chapter ${n}: story, route, settings, retry, battle, result in ${name}`,async()=>{
 const {createPlayableChapter}=await import(`../dist/preview/chapter${n}/${n===4?'chapter4':'chapter2'}-controller.mjs`);
 const {CAST}=await import(`../dist/preview/chapter${n}/core.mjs`);
 const dom=new JSDOM(readFileSync(new URL(`../dist/preview/chapter${n}/index.html`,import.meta.url),'utf8'),{url:'https://test.local/?previewOnly=1'}),w=dom.window,d=w.document;
 Object.defineProperty(w,'innerWidth',{value:width});Object.defineProperty(w,'innerHeight',{value:height});Object.defineProperty(w.navigator,'maxTouchPoints',{value:touch?1:0});w.matchMedia=()=>({matches:touch});
 w.HTMLDialogElement.prototype.showModal=function(){this.open=true};w.HTMLDialogElement.prototype.close=function(){this.open=false;this.dispatchEvent(new w.Event('close'))};
 let chapter=createPlayableChapter({characterId:'wang'}),writes=[];
 const ui=mountChapterInterface({document:d,window:w,cast:CAST,getCharacter:()=>chapter.view().characterId,storage:{getItem:()=>JSON.stringify({version:1,rotate}),setItem:(...args)=>writes.push(args)},pauseForUI:()=>{chapter.setPaused(true,chapter.view().token);return()=>{}}});
 try{
 assert.equal(ui.viewport.rotation,rotation);assert.equal(ui.viewport.width,rotation?height:width);assert.equal(ui.viewport.height,rotation?width:height);
 assert.equal(chapter.view().mode,'story');for(let i=0;chapter.view().mode==='story'&&i<30;i++)chapter.nextStory(chapter.view().token);
 assert.equal(chapter.view().mode,'route');ui.render({state:chapter.view(),world:chapter.world});assert.equal(d.querySelector('#enemy-panel').hidden,true);
 ui.openSettings();assert.equal(chapter.view().paused,true);const before=chapter.world.player.hp;chapter.step(1,{punch:true});assert.equal(chapter.world.player.hp,before);ui.closeSettings();assert.equal(chapter.view().paused,true);chapter.setPaused(false,chapter.view().token);
 chapter.world.status='lost';chapter.world.winner='enemy';chapter.step(0,{});assert.equal(chapter.view().mode,'result');assert.equal(chapter.view().result.kind,'route');chapter.continueResult(chapter.view().token);assert.equal(chapter.view().mode,'route');
 chapter=createPlayableChapter({characterId:'wang',initialStepId:'boss'});assert.equal(chapter.view().mode,'battle');ui.render({state:chapter.view(),world:chapter.world});assert.equal(d.querySelector('#enemy-panel').hidden,false);ui.openSettings();assert.equal(chapter.view().paused,true);ui.closeSettings();chapter.setPaused(false,chapter.view().token);
 chapter.world.status='over';chapter.world.winner='player';chapter.step(0,{});assert.equal(chapter.view().mode,'result');assert.equal(chapter.view().result.winner,'player');assert.equal(chapter.view().rounds.player,1);chapter.continueResult(chapter.view().token);assert.equal(chapter.view().mode,'battle');assert.deepEqual(writes,[]);
 }finally{ui.destroy();w.close()}
});
