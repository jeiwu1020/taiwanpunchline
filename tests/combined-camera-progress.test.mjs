import {RUNTIME_VERSION} from '../build/runtime-version.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {openUnifiedProgress} from '../dist/preview/campaign/unified/progress.mjs';
import {newProfileDocument} from '../dist/profile-progress.mjs';
import {ChallengeDepthRoute} from '../dist/challenge-depth-engine.mjs';
import {depthRouteCameraFrame} from '../dist/challenge-depth-render.mjs';
import {fixedStableCameraFrame} from '../dist/arena-presentation.mjs';
import {DEFAULT_SETTINGS} from '../dist/settings-state.mjs';
test('adopted progress and device settings are unchanged by both camera modes',async()=>{
 const legacy=newProfileDocument();legacy.profiles[0].challenge={version:1,xp:160,checkpoint:6,completed:true,rewards:[],attemptSerial:0,routeAttempt:null};legacy.profiles[0].unlockedCharacters.push('huang');
 const values=new Map([['taiwanpunchline-progress-v1',JSON.stringify(legacy)],['parliament-settings-v1',JSON.stringify({...DEFAULT_SETTINGS,camera:'stable',musicVolume:.4})]]),storage={getItem:k=>values.get(k)??null,setItem:(k,v)=>values.set(k,String(v))};
 const api=await openUnifiedProgress({storage,locks:{request:async(_name,_opts,run)=>run()}});const info=api.inspectAdoption('slot-1');assert.equal((await api.adoptProfile('slot-1',{source:'legacy',expectedRevision:api.get().revision,evidence:info.evidence})).persisted,true);
 const before=JSON.stringify([...values]),profile=api.readProfile(),stats=api.getChallengeStats('wang');const route=new ChallengeDepthRoute('wang','easy',()=>.2,{stats});
 for(const camera of ['classic','stable'])for(const [width,height] of [[844,390],[390,844],[1280,720]])for(const y of [430,342,53]){route.player.y=y;depthRouteCameraFrame(width,height,route,{fullStage:true,landscapePreview:width>height,touch:true,camera});fixedStableCameraFrame(width,height,[route.player,{x:700,y:430}]);}
 assert.equal(JSON.stringify([...values]),before);assert.deepEqual(api.readProfile(),profile);assert.deepEqual(api.getChallengeStats('wang'),stats);assert.equal(api.canUse('huang'),true);assert.equal(DEFAULT_SETTINGS.camera,'classic');
});
test('combined entry uses fresh v4 without legacy reads and retains stable camera wiring',()=>{
 const source=readFileSync(new URL('../dist/game.mjs',import.meta.url),'utf8'),entry=readFileSync(new URL('../dist/index.html',import.meta.url),'utf8');
 for(const token of ['openChallengeProgress','camera:viewportUI?.camera',"viewportUI?.camera==='stable'?fixedStableCameraFrame:cameraFrame"])assert.ok(source.includes(token),token);
 assert.match(source,/const profileProgress=await openChallengeProgress\(\{storage:browserStorage,locks:window\.navigator\?\.locks\}\)/);assert.doesNotMatch(source,/openUnifiedProgress|createProfileProgress\(\{|getItem\(['"]taiwanpunchline-progress-v[123]/);
 assert.ok(!entry.includes('campaign-home-entry'));assert.ok(entry.includes(`game.mjs?v=${RUNTIME_VERSION}`));assert.ok(!entry.includes('__qa__'));
});
