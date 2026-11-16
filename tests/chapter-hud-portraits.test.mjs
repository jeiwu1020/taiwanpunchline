import test from 'node:test';
import assert from 'node:assert/strict';
import {characterAbilityMarkup} from '../dist/challenge-ability-view.mjs';
import * as assetUrls from '../dist/preview/shared-asset-urls.mjs';
import * as chapterUI from '../dist/preview/campaign/chapter-ui.mjs';

test('later chapter ability portraits use their canonical asset URLs',()=>{
 const resolve=assetUrls.chapterCastWithResolvedPortraits;
 assert.equal(typeof resolve,'function','chapter cast portrait resolver is available');
 if(typeof resolve!=='function')return;
 const cast={wang:{name:'恰吉王',portrait:'assets/wang-laugh-head.webp'}};
 for(const [chapter,assetChapter]of [['chapter-2','chapter2'],['chapter-3','chapter3'],['chapter-4','chapter4'],['chapter-5','chapter4']]){
  const character=resolve(chapter,cast).wang,expected=assetUrls.chapterAssetURL(assetChapter,'wang-laugh-head.webp');
  assert.equal(character.portrait,expected,`${chapter} portrait matches its chapter asset mapping`);
  assert.match(characterAbilityMarkup({id:'wang',character}),new RegExp(`src="${expected.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')}"`));
 }
 assert.equal(cast.wang.portrait,'assets/wang-laugh-head.webp','resolving presentation assets does not mutate the roster');
});

test('street HUD shows the route enemy in the large enemy health panel',()=>{
 const project=chapterUI.chapterEnemyHud;
 assert.equal(typeof project,'function','chapter HUD projection is available');
 if(typeof project!=='function')return;
 const mob={mobKind:'mini_guard',type:'wang',name:'動線總管',hp:45,maxHp:90};
 assert.deepEqual(project({mode:'route'},{depthMode:true,enemy:mob}),{visible:true,name:'動線總管',hp:45,maxHp:90,hpPercent:50});
});

test('street HUD hides an empty mob panel and battle HUD keeps its opponent panel',()=>{
 const project=chapterUI.chapterEnemyHud;
 assert.equal(typeof project,'function','chapter HUD projection is available');
 if(typeof project!=='function')return;
 assert.equal(project({mode:'route'},{depthMode:true,enemy:{type:'han',hp:0,maxHp:100}}).visible,false);
 assert.equal(project({mode:'battle'},{enemy:{type:'han',hp:72,maxHp:100}},{han:{name:'韓國魚'}}).visible,true);
});
