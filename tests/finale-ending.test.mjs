import test from 'node:test';
import assert from 'node:assert/strict';
import {ENDING} from '../dist/preview/finale/finale-story.mjs';
import {DIALOGUE_NAMES,PLAYER_VOICES,resolveDialogueFrame} from '../dist/character-dialogue.mjs';
import {createFinalePreview} from '../dist/preview/finale/finale-preview.mjs';

test('ending discovers the battery, map, passage and key in causal order',()=>{
 assert.ok(ENDING.length>=14&&ENDING.length<=18);
 const index=pattern=>ENDING.findIndex(f=>pattern.test(f.copy));
 const battery=index(/議會無限城製造/),map=index(/議會內密道/),corridor=ENDING.findIndex(f=>f.shot==='corridor');
 const door=ENDING.findIndex(f=>f.shot==='sealed-door'),key=ENDING.findIndex(f=>f.shot==='battery-key'),opened=ENDING.findIndex(f=>f.shot==='open-door');
 assert.ok(index(/沒有聲音/)<battery&&battery<map&&map<corridor&&corridor<door&&door<key&&key<opened);
 assert.match(ENDING[battery].copy,/取出|倒出/);assert.match(ENDING[battery].copy,/過保失效/);
 assert.ok(ENDING.slice(0,battery).every(f=>!/無限城|密道/.test(f.copy)),'the destination is unknown until the battery reveals it');
 assert.match(ENDING[map].copy,/背面/);assert.match(ENDING[map].copy,/東廊/);assert.match(ENDING[map].copy,/第三盞燈/);assert.match(ENDING[map].copy,/壁畫/);
 assert.match(ENDING[door].copy,/推.*拉.*敲/);assert.match(ENDING[door].copy,/紋絲不動|打不開/);
 assert.match(ENDING[key].copy,/撞掉|掉落/);assert.match(ENDING[key].copy,/電池.*凹槽/);
 assert.ok(ENDING.slice(key,opened).some(f=>/鑰匙|鎖打開/.test(f.copy)),'the accident must be understood before the door opens');
 for(const shot of ['battery','battery-map','corridor','sealed-door','battery-key','open-door'])assert.ok(ENDING.some(f=>f.shot===shot),shot);
});

test('all seven ending voices face an unknown doorway without a sequel or recharge promise',()=>{
 assert.deepEqual(ENDING.filter(f=>f.speaker==='player').map(f=>f.voiceKey),['ending.first','ending.last']);
 for(const id of Object.keys(DIALOGUE_NAMES)){
  const frames=ENDING.map(f=>resolveDialogueFrame(f,id));
  for(const f of frames){assert.ok([...f.copy].length<=90,`${id}/${f.title} exceeds the dialogue budget`);assert.doesNotMatch(f.copy,/未完待續|尚待開放|下一集|敬請期待/);}
  const last=frames.find(f=>f.voiceKey==='ending.last');assert.equal(last.speaker,DIALOGUE_NAMES[id]);assert.equal(last.copy,PLAYER_VOICES['ending.last'][id]);
  assert.match(last.copy,/門|裡面|裡頭/);assert.doesNotMatch(last.copy,/找電池|找齊|充電|充回來|完成供電|先處理供電/);
 }
 assert.equal(ENDING.at(-1).shot,'open-door');assert.match(ENDING.at(-1).copy,/回音/);
});

test('real finale session presents every new scene and retains player voice keys through completion',async()=>{
 const {chapter}=await createFinalePreview();await chapter.start(['ma','han','huang']);
 for(const actor of chapter.world.actors)if(actor.team===1)actor.hp=0;
 chapter.step(1/60);await chapter.flush();await chapter.continueResult();
 const seen=[];
 while(chapter.view().mode==='story'){
  const state=chapter.view();assert.equal(state.frameIndex,seen.length);assert.equal(state.frameCount,ENDING.length);
  assert.deepEqual(state.storyFrame,resolveDialogueFrame(ENDING[seen.length],'ma'));seen.push(state.storyFrame);
  await chapter.nextStory();
 }
 assert.equal(seen.length,ENDING.length);assert.equal(chapter.view().mode,'complete');assert.equal(chapter.view().persisted,false);
});
