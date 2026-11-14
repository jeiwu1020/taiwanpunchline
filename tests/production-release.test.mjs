import test from 'node:test';
import assert from 'node:assert/strict';
import {cpSync,mkdtempSync,mkdirSync,readFileSync,writeFileSync,existsSync,readdirSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join,resolve,dirname} from 'node:path';
import {pathToFileURL} from 'node:url';
import {execFileSync} from 'node:child_process';
import {JSDOM} from 'jsdom';
import {memoryStorage,memoryLocks} from './helpers/main-unified-fixture.mjs';
import {campaignStorage} from './helpers/campaign-complete-fixture.mjs';
const root=resolve(import.meta.dirname,'..');
function fixture(channel){
 const dir=mkdtempSync(join(tmpdir(),'punchline-release-'));
 cpSync(join(root,'dist'),join(dir,'dist'),{recursive:true,filter:p=>!/(?:^|\/)(?:assets|vendor)(?:\/|$)/.test(p)});
 mkdirSync(join(dir,'build'));
 for(const p of ['build-release-output.mjs','build/player-release-policy.mjs'])cpSync(join(root,p),join(dir,p));
 writeFileSync(join(dir,'build/asset-release-plan.json'),JSON.stringify({exclude:[],equivalentAliases:[],previouslyMissingCharacterAliases:[]}));
 writeFileSync(join(dir,'build/release-channel.json'),JSON.stringify({channel}));
 execFileSync(process.execPath,[join(dir,'build-release-output.mjs')]);
 return {dir,out:join(dir,'out'),load:p=>import(pathToFileURL(join(dir,'out',p)).href)};
}
test('production output omits development pages and quick-view implementation, while preview retains it',async t=>{
 for(const channel of ['production','preview']){
  const f=fixture(channel);t.after(()=>rmSync(f.dir,{recursive:true,force:true}));
  assert.equal((await f.load('release-features.mjs')).DEVELOPMENT_TOOLS,channel==='preview');
  for(const p of ['index.html','moves.html',...['chapter2','chapter3','chapter4','chapter5','finale'].map(n=>`preview/${n}/index.html`)])assert.ok(existsSync(join(f.out,p)),p);
  for(const p of ['preview/quick-view/index.html','preview/quick-view/viewer.mjs','art.html','qa-viewport.html','qa-viewport-checks.mjs','street-trial.html','street-trial.mjs'])assert.equal(existsSync(join(f.out,p)),channel==='preview',p);
  assert.ok(existsSync(join(f.out,'preview/quick-view/hook.mjs')));
 }
});
test('production disables five taps and every progress authority test-mode entry without touching saved bytes',async t=>{
 const f=fixture('production');t.after(()=>rmSync(f.dir,{recursive:true,force:true}));
 const {createProfileProgress,createFiveTapGate}=await f.load('profile-progress.mjs');
 let activated=0;const gate=createFiveTapGate({onActivate:()=>activated++});for(let n=0;n<15;n++)assert.equal(gate.tap('chen'),false);assert.equal(activated,0);
 const base=memoryStorage(),simple=createProfileProgress({storage:base});const before=[...base.entries];assert.equal(simple.enterTestMode(),false);assert.deepEqual(simple.availableCharacters(),['wang','han']);assert.deepEqual([...base.entries],before);
 for(const [path,name]of [['preview/campaign/fresh/progress.mjs','openChallengeProgress'],['preview/campaign/unified/progress.mjs','openUnifiedProgress'],['preview/campaign/core/store.mjs','openCampaignStore']]){
  const storage=memoryStorage(),api=await(await f.load(path))[name]({storage,locks:memoryLocks()}),saved=[...storage.entries];assert.equal(api.enterTestMode(),false,path);assert.equal(api.get().testMode,false,path);assert.deepEqual([...storage.entries],saved,path);
 }
 const hook=await f.load('preview/quick-view/hook.mjs');let called=0;const w={location:{hostname:'codex-complete-challenge-story-taiwanpunchline.playformosa.workers.dev'},__quickViewIsolated:{setHandler(){called++;}}};w.parent={};assert.equal(hook.registerQuickView(w,()=>called++),false);assert.equal(called,0);
});
test('production ignores query, dataset and explicit preview requests at every later chapter entry',async t=>{
 const f=fixture('production');t.after(()=>rmSync(f.dir,{recursive:true,force:true}));
 const {mountContinuationControls}=await f.load('preview/campaign/page-bridge.mjs');
 for(const id of ['2','3','4','5'])for(const query of ['test','qa','previewOnly']){
  const dom=new JSDOM('<html data-test-preview="true"><body><div id="menu"><div class="card"><button id="start">start</button><div id="menu-roster"></div></div></div><div id="stage"></div></body></html>',{url:`https://example.test/preview/chapter${id}/?${query}=1`});t.after(()=>dom.window.close());
  mountContinuationControls({document:dom.window.document,window:dom.window,chapterId:`chapter-${id}`,testPreview:true,createPlayableChapter(){throw Error('must not start');}});
  assert.equal(dom.window.document.querySelector('#start').hidden,true);assert.equal(dom.window.document.querySelector('#campaign-entry').hidden,false);assert.equal(dom.window.document.querySelector('#campaign-resume').disabled,false);
 }
});
test('production fresh save advances all five chapters and ending with normal unlocks and durable reloads',async t=>{
 const f=fixture('production');t.after(()=>rmSync(f.dir,{recursive:true,force:true}));
 const {openChallengeProgress}=await f.load('preview/campaign/fresh/progress.mjs');
 const input={storage:memoryStorage(),locks:memoryLocks()};let api=await openChallengeProgress(input);assert.equal(api.testMode,false);
 const untouched=JSON.stringify(api.readProfile('slot-2'));
 for(let chapter=1;chapter<=5;chapter++){
  let r=await api.beginChallenge({chapterId:`chapter-${chapter}`});assert.equal(r.accepted,true,r.reason);
  for(const type of ['story-complete','route-complete','boss-win','route-complete','boss-win','route-complete','story-complete','boss-win','story-complete','continue']){
   r=await api.dispatchChallenge(r.token,{type});assert.equal(r.accepted,true,`${chapter}:${type}:${r.reason}`);assert.equal(r.persisted,true);
  }
  api=await openChallengeProgress(input);assert.equal(api.testMode,false);assert.equal(JSON.stringify(api.readProfile('slot-2')),untouched);
 }
 assert.equal(api.readProfile().unlockedCharacters.length,7);
 let r=await api.beginChallenge({chapterId:'finale-3v4'});r=await api.dispatchChallenge(r.token,{type:'finale-start',team:['wang','han','chen']});assert.equal(r.persisted,true,r.reason);
 r=await api.dispatchChallenge(r.token,{type:'finale-win'});assert.equal(r.persisted,true,r.reason);api=await openChallengeProgress(input);r=await api.beginChallenge({chapterId:'finale-3v4'});assert.equal(r.run.stepId,'ending');
 r=await api.dispatchChallenge(r.token,{type:'story-complete'});assert.equal(r.persisted,true,r.reason);api=await openChallengeProgress(input);assert.equal(api.readProfile().campaign.finale.status,'completed');
 const old=campaignStorage(4),raw=[...old.storage.entries];const loaded=await openChallengeProgress(old);assert.deepEqual([...old.storage.entries],raw);assert.equal((await loaded.beginChallenge({chapterId:'chapter-5'})).accepted,true);
});
