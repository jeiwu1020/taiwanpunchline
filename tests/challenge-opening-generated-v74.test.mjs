import test from 'node:test';
import assert from 'node:assert/strict';
import {existsSync,readFileSync} from 'node:fs';
import * as art from '../dist/challenge-opening-art.mjs';
import {ART_FILES} from '../dist/art-render.mjs';

test('generated opening selects distinct full-body getting-up states and then holds',()=>{
 assert.equal(typeof art.openingPanelState,'function');
 assert.equal(art.openingPanelState('wake',0).panel,0);
 assert.equal(art.openingPanelState('wake',1100).panel,1);
 assert.equal(art.openingPanelState('wake',2400).panel,2);
 assert.equal(art.openingPanelState('wake',10000).panel,2);
 assert.equal(art.openingPanelState('wardrobe',0).panel,3);
 assert.equal(art.openingPanelState('wardrobe',2500).panel,4);
 assert.equal(art.openingPanelState('chase',2500).panel,5);
});
test('all seven opening assets resolve independently without substituting another face',()=>{
 assert.equal(typeof art.openingSheet,'function');
 for(const name of ['wang','han','ma','su','huang','chen','ko']){
  const sheet=art.openingSheet(name);assert.equal(sheet.character,name);assert.equal(sheet.key,`opening-${name}`);assert.equal(sheet.file,`challenge/opening-v74/${name}-sheet.webp`);assert.equal(sheet.panels.length,6);
  assert.equal(ART_FILES[sheet.key],undefined,'legacy storyboards are retained but never preloaded');
  for(const [x,y,w,h] of sheet.panels){assert.ok(x>=0&&y>=0&&w>0&&h>0);assert.ok(x+w<=sheet.width&&y+h<=sheet.height);}
 }
 assert.equal(art.openingSheet('unknown'),null,'unknown identities must never silently show Wang');
});
test('reduced motion freezes completed generated poses and camera',()=>{
 assert.equal(typeof art.openingPanelState,'function');
 for(const shot of ['bulletin','wake','wardrobe','chase'])assert.deepEqual(art.openingPanelState(shot,0,true),art.openingPanelState(shot,9999,true));
});
test('panel layout contains exactly the current complete scene in every orientation',()=>{
 assert.equal(typeof art.openingPanelLayout,'function');
 for(const character of ['wang','han','ma','su','huang','chen','ko'])for(const [w,h] of [[720,1296],[1000,620],[720,432],[600,900],[844,390],[390,700]])for(const shot of ['bulletin','wake','wardrobe','chase']){
  const sheet=art.openingSheet(character),layout=art.openingPanelLayout(sheet,shot,2400,w,h);
  assert.equal(layout.length,1,'only the current scene is visible');assert.equal(layout[0].panel,art.openingPanelState(shot,2400).panel);
  for(const p of layout){
   const source=sheet.panels[p.panel];assert.ok(p.x>=8&&p.y>=8);assert.ok(p.x+p.width<=w-8+.001&&p.y+p.height<=h-8+.001);
   assert.ok(Math.abs(p.width/p.height-source[2]/source[3])<.0001,'no stretching or partial source crop');
  }
 }
});

test('missing animated assets show a loading prompt, never old storyboard panels',()=>{
 const draws=[],labels=[],ctx={clearRect(){},fillRect(){},save(){},restore(){},strokeRect(){},fillText(text){labels.push(text);},drawImage(...args){draws.push(args);}};
 for(const character of ['wang','han','ma','su','huang','chen','ko','unknown']){
  const result=art.paintOpeningComic(ctx,{'opening-wang':{},'opening-han':{}},{shot:'wake'},character,844,390,2400);
  assert.equal(result.ready,false);assert.equal(draws.length,0);assert.ok(labels.at(-1).includes('載入'));
 }
});

test('retained original storyboard assets remain actual WebP rasters',()=>{
 for(const name of ['wang','han','ma','su','huang','chen','ko']){
  const sheet=art.openingSheet(name),url=new URL('../dist/assets/'+sheet.file,import.meta.url);
  assert.ok(existsSync(url),name+' runtime sheet exists');const data=readFileSync(url);
  assert.equal(data.toString('ascii',0,4),'RIFF');assert.equal(data.toString('ascii',8,12),'WEBP');assert.ok(data.length>100000);
 }
});

test('single scene camera visibly settles and restarts with each waking pose',()=>{
 const first=art.openingPanelState('wake',0),moving=art.openingPanelState('wake',400),next=art.openingPanelState('wake',780),hold=art.openingPanelState('wake',10000);
 assert.ok(first.camera>=.06);assert.ok(moving.camera<first.camera);assert.ok(next.camera>=.06);assert.equal(hold.camera,0);
});
