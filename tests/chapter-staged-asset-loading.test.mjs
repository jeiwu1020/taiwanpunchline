import test from 'node:test';
import assert from 'node:assert/strict';
import {loadChapterAssetsInStages} from '../dist/preview/campaign/chapter-asset-loading.mjs';

test('only shared and current-scene assets gate chapter continuation',async()=>{
 const files={
  shared:'shared.webp',
  'chapter3-scene-0':'street-a.png',
  'chapter3-scene-1':'street-b.png',
  'chapter3-scene-2':'street-c.png',
  'chapter3-sky-0':'sky-a.png',
  'chapter3-sky-1':'sky-b.png',
  'chapter3-miniboss-atlas':'miniboss.png'
 };
 const loaded=[];
 let continuationStarted=false;
 const staged=await loadChapterAssetsInStages({
  files,
  sceneAssetIndexes:{'chapter3-sky-0':0,'chapter3-sky-1':1},
  resolveScene:async({images})=>{
   assert.equal(images.shared,'shared.webp');
   assert.equal(images['chapter3-scene-1'],undefined);
   continuationStarted=true;
   return {sceneIndex:1,includeMinibossAtlas:false};
  },
  loadImage:async(key,file)=>{loaded.push(key);return file;}
 });

 assert.equal(continuationStarted,true);
 assert.deepEqual(loaded.sort(),['chapter3-scene-1','chapter3-sky-1','shared']);
 assert.deepEqual(Object.keys(staged.images).sort(),['chapter3-scene-1','chapter3-sky-1','shared']);
 assert.deepEqual(staged.backgroundFiles,{
  'chapter3-scene-0':'street-a.png',
  'chapter3-scene-2':'street-c.png',
  'chapter3-sky-0':'sky-a.png',
  'chapter3-miniboss-atlas':'miniboss.png'
 });

 const background=await staged.loadBackground();
 assert.equal(background.images['chapter3-scene-2'],'street-c.png');
 assert.deepEqual(loaded.sort(),Object.keys(files).sort());
});

test('a saved miniboss encounter keeps its atlas in the required startup batch',async()=>{
 const loaded=[];
 const staged=await loadChapterAssetsInStages({
  files:{'chapter4-scene-0':'street.png','chapter4-miniboss-atlas':'boss.png'},
  resolveScene:async()=>({sceneIndex:0,includeMinibossAtlas:true}),
  loadImage:async(key,file)=>{loaded.push(key);return file;}
 });
 assert.deepEqual(loaded.sort(),['chapter4-miniboss-atlas','chapter4-scene-0']);
 assert.deepEqual(staged.backgroundFiles,{});
});

test('later-scene loading starts only after the startup scene is ready',async()=>{
 const calls=[];
 const staged=await loadChapterAssetsInStages({
  files:{'chapter2-scene-0':'a.png','chapter2-scene-1':'b.png'},
  resolveScene:async()=>({sceneIndex:0}),
  loadImage:async(key,file)=>{calls.push(key);return file;}
 });
 assert.deepEqual(calls,['chapter2-scene-0']);
 const promise=staged.loadBackground();
 assert.deepEqual(calls,['chapter2-scene-0','chapter2-scene-1']);
 await promise;
});

test('background image failures do not discard other downloaded scenes',async()=>{
 const staged=await loadChapterAssetsInStages({
  files:{'chapter5-scene-0':'ready.png','chapter5-scene-1':'failed.png'},
  resolveScene:async()=>({sceneIndex:0}),
  loadImage:async(key,file)=>{if(key==='chapter5-scene-1')throw Error('offline');return file;}
 });
 const result=await staged.loadBackground();
 assert.equal(result.images['chapter5-scene-1'],undefined);
 assert.equal(result.errors.length,1);
});

test('a required shared asset failure prevents continuation setup',async()=>{
 let continuationStarted=false;
 await assert.rejects(loadChapterAssetsInStages({
  files:{shared:'required.webp','chapter2-scene-0':'street.png'},
  resolveScene:async()=>{continuationStarted=true;return {sceneIndex:0};},
  loadImage:async(key)=>{if(key==='shared')throw Error('required asset missing');return key;}
 }),/required asset missing/);
 assert.equal(continuationStarted,false);
});
