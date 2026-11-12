import test from 'node:test';
import assert from 'node:assert/strict';
import * as copy from '../dist/save-copy.mjs';
import {newProfileDocument} from '../dist/profile-progress.mjs';
import {newDocument} from '../dist/preview/campaign/core/model.mjs';
const old=newProfileDocument(),later=newDocument();old.profiles[0].challenge={version:1,xp:120,checkpoint:0,completed:false,rewards:[],attemptSerial:0,routeAttempt:null};
const info={profileId:'slot-1',choices:['legacy','campaign'],reason:'both-sources-changed',evidence:{legacyRaw:JSON.stringify(old),campaignRaw:JSON.stringify(later),seedRaw:null}};
test('adoption question uses numbered Chinese sources and actual slot summaries',()=>{
 let question;assert.equal(copy.chooseAdoptionSource({prompt:q=>(question=q,'2')},info),'campaign');
 assert.match(question,/存檔 1/);assert.match(question,/1[．.] 原版第一章/);assert.match(question,/2[．.] 舊版後續章節/);assert.match(question,/120 XP/);assert.doesNotMatch(question,/legacy|campaign|slot-|both-sources/);
});
test('cancel, blank and unlisted numeric choice never select a source',()=>{for(const answer of [null,'',' ','0','3','legacy','campaign'])assert.equal(copy.chooseAdoptionSource({prompt:()=>answer},info),null);});
test('numeric choices are mapped to offered source, never a hard-coded source order',()=>{assert.equal(copy.chooseAdoptionSource({prompt:()=>' 1 '},{...info,choices:['campaign','legacy']}),'campaign');});
test('adoption confirmation names the slot and preserves other slots, originals and old-tab warning',()=>{const t=copy.adoptionConfirmation({...info,source:'legacy'});for(const p of ['存檔 1','原版第一章','原始','其他存檔不變','舊版遊戲分頁'])assert.ok(t.includes(p),p);assert.doesNotMatch(t,/legacy|campaign|slot-/);});
test('save errors use helpful Chinese fallback without rendering raw codes',()=>{for(const reason of ['source-changed','unsupported-envelope','backup-write-failed','storage-unavailable','pending-save','unexpected-internal-code']){const t=copy.saveIssueText(reason);assert.ok(t.length>10);assert.ok(!t.includes(reason));}});
test('main-page slot-switch failures and continuation use readable copy helpers',async()=>{const {readFile}=await import('node:fs/promises');const s=await readFile(new URL('../dist/game.mjs',import.meta.url),'utf8');assert.ok(s.includes("'存檔切換尚未保存。'+saveIssueText(result.reason)"));assert.ok(s.includes('choose:info=>chooseAdoptionSource(window,info)'));assert.ok(s.includes('window.confirm(adoptionConfirmation(info))'));});
