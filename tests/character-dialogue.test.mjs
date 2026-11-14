import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {PLAYER_VOICES,DIALOGUE_NAMES,resolveDialogueFrame} from '../dist/character-dialogue.mjs';
import {challengeOpening,BOSS_DIALOGUES,CHAPTER1_HANDOFF} from '../dist/challenge-flow.mjs';
import {starterPrologue} from '../dist/starter-prologue.mjs';
import {FINALE_INTRO,ENDING} from '../dist/preview/finale/finale-story.mjs';
const ids=['wang','han','ma','su','huang','chen','ko'];
const chapters=[];
for(let n=2;n<=5;n++){let m=await import(`../dist/preview/chapter${n}/chapter${n===3?2:n}-content.mjs`);chapters.push({n,m,c:m.CHAPTER2??m[`CHAPTER${n}`]});}
const keys=new Set();
function verifyFrame(frame){
 assert.ok(frame.voiceKey,'player line requires a stable voice key');keys.add(frame.voiceKey);
 const copies=ids.map(id=>{const f=resolveDialogueFrame(frame,id);assert.equal(f.speaker,DIALOGUE_NAMES[id]);assert.ok(f.copy?.length>5);assert.ok(f.copy.length<=100,`${frame.voiceKey}/${id} too long`);return f.copy;});
 assert.equal(new Set(copies).size,7,`${frame.voiceKey} lacks genuine variants`);
}
for(const {n,m,c}of chapters){
 test(`chapter ${n} every story player line has seven authored voices`,()=>{
  for(const [kind,scene]of Object.entries(c.story))for(const [i,f]of scene.frames.entries())if(f.speaker==='player'){
   verifyFrame(f);
   for(const id of ids)assert.equal(m.storyFrames(kind,id)[i].copy,PLAYER_VOICES[f.voiceKey][id]);
  }
 });
 test(`chapter ${n} miniboss player dialogue has seven voices`,()=>{
  for(const route of c.routes)for(const [speaker,copy,voiceKey]of route.gate.dialogue??[])if(speaker==='player')verifyFrame({speaker,copy,voiceKey});
 });
 test(`chapter ${n} anonymous broadcasts preserve boss suspense`,()=>{
  for(const f of c.story.entry.frames)if(/廣播/.test(f.speaker)){assert.ok(!f.voiceKey);for(const id of ids)assert.deepEqual(resolveDialogueFrame(f,id),f);}
 });
}
test('legacy opening, first chapter bosses and handoff cover all seven IDs',()=>{
 for(const f of challengeOpening('wang'))if(f.voiceKey)verifyFrame(f);
 for(const f of [...BOSS_DIALOGUES.flat(),...CHAPTER1_HANDOFF])if(f.speaker==='你')verifyFrame(f);
 for(const id of ids)for(const f of challengeOpening(id))if(f.voiceKey)assert.equal(resolveDialogueFrame(f,id).speaker,DIALOGUE_NAMES[id]);
});
test('ending player lines have seven voices and named cast retain authored copy',()=>{
 for(const f of ENDING)if(f.speaker==='player')verifyFrame(f);else for(const id of ids)assert.deepEqual(resolveDialogueFrame(f,id),f);
 assert.equal(FINALE_INTRO.length,3);assert.ok(ENDING.length>=14&&ENDING.length<=18);
});
test('every authored variant is referenced, frozen and is original satire not a quotation label',()=>{
 assert.deepEqual([...keys].sort(),Object.keys(PLAYER_VOICES).sort());
 for(const row of Object.values(PLAYER_VOICES)){assert.ok(Object.isFrozen(row));assert.deepEqual(Object.keys(row),ids);}
 assert.ok(Object.isFrozen(PLAYER_VOICES));
});
test('unknown key/character safely retain exact copy and never mutate source frames',()=>{
 const f=Object.freeze({speaker:'player',copy:'測試',voiceKey:'missing'});assert.deepEqual(resolveDialogueFrame(f,'wang'),f);assert.notEqual(resolveDialogueFrame(f,'wang'),f);
 const known=Object.freeze({speaker:'你',copy:'原字',voiceKey:'c1.boss'});assert.deepEqual(resolveDialogueFrame(known,'missing'),known);assert.equal(known.copy,'原字');assert.equal(resolveDialogueFrame(known,'han').speaker,'韓國魚');
});
test('two starter prologues preserve seven scenes, two lines per bubble and original entry',()=>{
 for(const id of ['wang','han']){const scenes=starterPrologue(id);assert.equal(scenes.length,7);assert.deepEqual(scenes.at(-1).entry,{chapterId:'chapter-1',checkpoint:0,sectionId:'street'});for(const s of scenes){assert.equal(s.fictional,true);for(const b of s.bubbles){assert.ok(b.text.split('\n').length<=2);assert.ok(b.text.split('\n').every(x=>x.length<=14),b.text);}}}
});
test('actual render boundaries resolve dialogue rather than only renaming speakers',()=>{
 const story=readFileSync(new URL('../dist/challenge-story.mjs',import.meta.url),'utf8');
 const ctrl=readFileSync(new URL('../dist/preview/campaign/chapter-controller.mjs',import.meta.url),'utf8');
 const finale=readFileSync(new URL('../dist/preview/finale/finale-session.mjs',import.meta.url),'utf8');
 assert.match(story,/next\.map\(beat=>resolveDialogueFrame\(beat,characterId\)\)/);
 assert.match(ctrl,/gate\.dialogue\.map\(\(\[speaker,copy,voiceKey\]\)=>resolveDialogueFrame/);
 assert.match(finale,/storyFrame=\['story','intro'\]\.includes\(mode\)\?resolveDialogueFrame/);
});
import {createChapterController} from '../dist/preview/campaign/chapter-controller.mjs';
import {createFinalePreview} from '../dist/preview/finale/finale-preview.mjs';
for(const {n,m,c}of chapters)test(`chapter ${n} actual controller renders correct voice for every character and mini`,()=>{
 for(const id of ids)for(const initialStepId of ['entry','miniboss-a','miniboss-b','boss-comic','handoff-comic']){
  const ctrl=createChapterController({chapterId:`chapter-${n}`,content:c,stepIds:m.STEP_IDS,storyFrames:m.storyFrames,characterNames:m.CHARACTER_NAMES,defaultUnlocked:ids,unlockId:c.boss.characterId,nextChapterId:c.nextChapterId,createRoute:()=>{throw Error('unexpected route');},createDuel:()=>{throw Error('unexpected duel');}},{characterId:id,unlockedIds:ids,initialStepId});
  let seen=0;while(true){const v=ctrl.view();if(v.storyFrame.voiceKey){seen++;assert.equal(v.storyFrame.copy,PLAYER_VOICES[v.storyFrame.voiceKey][id]);assert.equal(v.storyFrame.speaker,DIALOGUE_NAMES[id]);}if(v.frameIndex===v.frameCount-1)break;ctrl.nextStory(v.token);}
  assert.ok(seen>=1,`${n}/${initialStepId}/${id}`);
 }
});
test('real finale session resolves both ending lines for each team leader',async()=>{
 for(const id of ids){const {chapter}=await createFinalePreview();await chapter.start([id,...ids.filter(x=>x!==id).slice(0,2)]);for(const a of chapter.world.actors)if(a.team===1)a.hp=0;chapter.step(.016);await chapter.flush();await chapter.continueResult();let seen=0;
  while(chapter.view().mode==='story'){const f=chapter.view().storyFrame;if(f.voiceKey){seen++;assert.equal(f.copy,PLAYER_VOICES[f.voiceKey][id]);assert.equal(f.speaker,DIALOGUE_NAMES[id]);}await chapter.nextStory();}assert.equal(seen,2);assert.equal(chapter.view().mode,'complete');assert.equal(chapter.view().persisted,false);
 }
});
import {createHash} from 'node:crypto';
const structureHashes=JSON.parse(readFileSync(new URL('./helpers/dialogue-structure-baseline.json',import.meta.url)));
function mechanicalStructure(o){if(Array.isArray(o))return o.map(mechanicalStructure);if(o&&typeof o==='object')return Object.fromEntries(Object.entries(o).filter(([k])=>!['copy','voiceKey'].includes(k)).map(([k,v])=>[k,k==='dialogue'?v.map(d=>[d[0]]):mechanicalStructure(v)]));return o;}
for(const {n,c}of chapters)test(`chapter ${n} mechanics, dialogue counts, speakers, scene art and story order equal baseline`,()=>assert.equal(createHash('sha256').update(JSON.stringify(mechanicalStructure(c))).digest('hex'),structureHashes[n]));
test('signature phrases accent voices rather than prefixing nearly every event',()=>{
 const rows=Object.values(PLAYER_VOICES);
 assert.ok(rows.filter(v=>v.ko.includes('不是啦')).length<=6,'柯P corrections must use varied sentence structures');
 assert.ok(rows.filter(v=>v.chen.includes('阿扁')).length<=8,'阿扁 self-naming is an accent, not every sentence');
});
