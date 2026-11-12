import {challengePhase} from '../../../challenge-flow.mjs?v=post69-street-seam-cull-20261112-r1';
import {normalizeCarry} from '../core/model.mjs?v=post69-street-seam-cull-20261112-r1';
const STEPS=['route-a','miniboss-a','route-b','miniboss-b','route-c','boss-comic'];
/** One saved operation owns the next scene. Failed writes retain the old scene. */
export class AsyncChallengeSession{
 static async create(options={}){const s=new AsyncChallengeSession(options);s.startResult=await s.begin();return s;}
 constructor({progress,characterId,helperId,difficulty,replay=false,preparation=null,preparationOptions={}}={}){
  if(!progress)throw new TypeError('progress required');const saved=progress.preparationSnapshot();
  Object.assign(this,{progress,characterId:preparation?.characterId??characterId??saved.characterId,helperId:preparation?.helperId??helperId??saved.helperId,difficulty:preparation?.difficulty??difficulty??saved.difficulty,replay,preparation,preparationOptions});
  this.context=progress.progressContext();this.preview=progress.testMode;this.legacy=progress.get().authority==='legacy';this.checkpoint=0;this.carry=null;this.finished=false;this.lastReward=null;this.token=null;this.run=null;this.attemptId=null;this.startResult=null;this._tail=Promise.resolve();this._started=false;this._phaseSerial=0;this._legacyProfile=null;this._pendingApply=[];this._workingToken=null;this._phasePending=false;
 }
 get phase(){return challengePhase(this.finished?6:this.checkpoint);}
 get busy(){return this._pending>0;}
 get savePending(){return this._pendingApply.length>0;}
 _queue(work){this._pending=(this._pending??0)+1;const task=this._tail.then(work);this._tail=task.catch(()=>{});return task.finally(()=>this._pending--);}
 _reject(reason){return {accepted:false,persisted:this.preview?false:this.progress.get().persisted,reason};}
 _apply(result){if(result.run){this.token=result.token;this.run=result.run;this.finished=['handoff-comic','roster-choice'].includes(this.run.stepId)||this.run.finished||this.run.chapterId!=='chapter-1';this.checkpoint=this.finished?6:Math.max(0,STEPS.indexOf(this.run.stepId==='boss'?'boss-comic':this.run.stepId));this.attemptId=this.run.attemptId;}return result;}
 _accept(result,apply=()=>{}){
  this.lastReward=result;if(!result.accepted)return result;
  if(result.token)this._workingToken=result.token;if(this.legacy)this._rememberLegacy();
  const commit=()=>{this._apply(result);apply();};
  if(result.persisted||this.preview)commit();else this._pendingApply.push(commit);
  return result;
 }
 _legacyContext(){return {...this.context,expectedLegacyProfile:this._legacyProfile};}
 _rememberLegacy(){this._legacyProfile=JSON.stringify(this.progress.readProfile(this.context.profileId));}
 preparationSnapshot(){return {...this.progress.preparationSnapshot(),characterId:this.characterId,helperId:this.helperId,difficulty:this.difficulty,token:this.token};}
 async begin(){
  if(this._started)return this._reject('already-started');this._started=true;
  if(this.preview){this.attemptId=1;return {accepted:true,persisted:false,reason:'test-mode',preview:true};}
  const snapshot=this.progress.preparationSnapshot();this._rememberLegacy();
  let r=await this.progress.prepareEncounter({...snapshot,...this.preparation,characterId:this.characterId,helperId:this.helperId,difficulty:this.difficulty},{...snapshot,intent:'resume',...this.preparationOptions,resetCarry:this.preparationOptions.resetCarry??!!this.preparation,replay:this.replay,chapterId:'chapter-1',enterFirstRoute:true});
  this._accept(r,()=>{if(this.legacy){this.checkpoint=r.checkpoint;this.finished=this.checkpoint===6;this.attemptId=r.attemptId;}this.carry=r.carry??null;});
  if(r.accepted&&r.persisted&&!this.legacy&&this.run.stepId==='entry')r=this._accept(await this.progress.dispatchChallenge(this._workingToken,{type:'story-complete'}));
  return r;
 }
 prepareEncounter(draft,options={}){return this._queue(async()=>{
  if(this.savePending)return this._reject('unsaved-progress');
  if(this.progress.get().generation!==undefined&&!['boundary','retry'].includes(options.intent))return this._reject('explicit-intent-required');
  if(this.preview){
   if(!this.progress.testMode||this.context.modeEpoch!==undefined&&this.context.modeEpoch!==this.progress.preparationSnapshot().modeEpoch)return this._reject('stale-preview');
   if(!['beginner','easy','hard'].includes(draft.difficulty)||![draft.characterId,draft.helperId].every(id=>this.progress.canUse(id)))return this._reject('invalid-preparation');
   const oldMax=this.progress.getChallengeStats(this.characterId).maxHp;
   const result=this.progress.preparePreview?await this.progress.preparePreview(draft,options):{accepted:true,persisted:false,preview:true};if(!result.accepted||!result.preview)return result;
   Object.assign(this,{characterId:draft.characterId,helperId:draft.helperId,difficulty:draft.difficulty});
   if(options.intent!=='boundary'){this.carry=null;this.attemptId++;}
   else if(this.carry){const newMax=this.progress.getChallengeStats(this.characterId).maxHp,carry=normalizeCarry(this.carry);this.carry={...carry,hp:Math.min(carry.hp,newMax),assist:{...carry.assist,helper:this.helperId,damageTaken:oldMax===newMax?carry.assist.damageTaken:carry.assist.damageTaken*newMax/oldMax}};}
   this._phaseSerial++;return result;
  }
  const r=await this.progress.prepareEncounter(draft,{...options,token:this.legacy?undefined:this._workingToken,profileId:this.context.profileId,checkpoint:this.checkpoint,replay:this.replay});
  return this._accept(r,()=>{Object.assign(this,{characterId:draft.characterId,helperId:draft.helperId,difficulty:draft.difficulty,carry:Object.hasOwn(r,'carry')?normalizeCarry(r.carry):options.intent==='boundary'?this.carry:null});if(this.legacy)this.attemptId=r.attemptId;this._phaseSerial++;});
 });}
 // A simulation frame is the smallest durable reward/transition boundary.
 // Root pauses progression while it is pending, matching later chapter bridges.
 routeEvents(events){const point=this.checkpoint,serial=this._phaseSerial,list=events.filter(e=>['enemyDefeated','routeGate'].includes(e.type)).map(e=>({...e}));return this._queue(async()=>{
  if(this.savePending||this._phasePending||this.phase.kind!=='route'||this.checkpoint!==point||serial!==this._phaseSerial)return this._reject('stale-phase');
  if(!list.length)return this._reject('invalid-batch');
  const gate=list.find(e=>e.type==='routeGate'),clean=normalizeCarry(gate?.carry);
  if(this.legacy)return this._reject('legacy-frame-unsupported');
  const actions=list.filter(e=>e.type==='enemyDefeated').map(e=>({type:'mob-defeated',enemyId:e.encounterId,xp:e.xp??8}));if(gate)actions.push({type:'route-complete',carry:clean});
  const r=this.preview?{accepted:true,persisted:false,reason:'test-mode',preview:true}:await this.progress.dispatchChallenge(this._workingToken,actions);
  if(gate&&r.accepted&&!r.persisted&&!this.preview)this._phasePending=true;
  return this._accept(r,()=>{if(gate){this._phasePending=false;if(this.preview)this.checkpoint++;this.carry=clean;this._phaseSerial++;}});
 });}
 rewardMob(event){const point=this.checkpoint,serial=this._phaseSerial;return this._queue(async()=>{
  if(this._phasePending||this.phase.kind!=='route'||this.checkpoint!==point||serial!==this._phaseSerial)return this._reject('stale-phase');
  if(this.preview)return {accepted:true,persisted:false,reason:'test-mode'};
  return this._accept(this.legacy?await this.progress.legacyCommand('rewardEncounter',{encounterId:event.encounterId,attemptId:this.attemptId,xp:event.xp??8,characterId:this.characterId,checkpoint:this.checkpoint,context:this._legacyContext()}):await this.progress.dispatchChallenge(this._workingToken,{type:'mob-defeated',enemyId:event.encounterId,xp:event.xp??8}));
 });}
 routeComplete(carry){const point=this.checkpoint,serial=this._phaseSerial;return this._queue(async()=>{
  if(this._phasePending||this.phase.kind!=='route'||this.checkpoint!==point||serial!==this._phaseSerial)return this._reject('stale-phase');
  const clean=normalizeCarry(carry);
  const r=this.preview?{accepted:true,persisted:false,reason:'test-mode'}:this.legacy?await this.progress.legacyCommand('rewardEncounter',{encounterId:'route-'+this.phase.section,xp:25,characterId:this.characterId,checkpoint:this.checkpoint+1,carry:clean,replay:this.replay,context:this._legacyContext()}):await this.progress.dispatchChallenge(this._workingToken,{type:'route-complete',carry:clean});
  if(r.accepted&&!r.persisted&&!this.preview)this._phasePending=true;
  return this._accept(r,()=>{this._phasePending=false;if(this.preview||this.legacy)this.checkpoint++;this.carry=clean;this._phaseSerial++;});
 });}
 bossWon(carry){const point=this.checkpoint,serial=this._phaseSerial;return this._queue(async()=>{
  if(this._phasePending||this.phase.kind!=='boss'||this.checkpoint!==point||serial!==this._phaseSerial)return this._reject('stale-phase');
  const section=this.phase.section,clean=normalizeCarry(carry);
  const r=this.preview?{accepted:true,persisted:false,reason:'test-mode'}:this.legacy?await this.progress.legacyCommand('rewardEncounter',{encounterId:'boss-'+section,xp:section===2?160:100,characterId:this.characterId,checkpoint:this.checkpoint+1,boss:section===2,carry:clean,replay:this.replay,...(section<2?{nextAttempt:this.checkpoint+1}:{}),context:this._legacyContext()}):await this.progress.dispatchChallenge(this._workingToken,this.run.stepId==='boss-comic'?[{type:'story-complete'},{type:'boss-win',carry:clean}]:{type:'boss-win',carry:clean});
  if(r.accepted&&!r.persisted&&!this.preview)this._phasePending=true;
  return this._accept(r,()=>{this._phasePending=false;if(this.preview||this.legacy){this.checkpoint++;this.finished=this.checkpoint>=6;if(this.legacy)this.attemptId=this.progress.readProfile().challenge.routeAttempt?.id??null;}this.carry=clean;this._phaseSerial++;});
 });}
 retry(){const serial=this._phaseSerial;return this._queue(async()=>{
  if(this.savePending)return this._reject('unsaved-progress');if(serial!==this._phaseSerial||this.finished)return this._reject('stale-phase');
  if(this.preview){this.attemptId++;this.carry=null;this._phaseSerial++;return {accepted:true,persisted:false,reason:'test-mode',phase:this.phase};}
  const snapshot=this.preparationSnapshot();let r;
  if(this.legacy)r=await this.progress.prepareEncounter(snapshot,{...snapshot,profileId:this.context.profileId,checkpoint:this.checkpoint,replay:this.replay});
  else r=await this.progress.dispatchChallenge(this._workingToken,this.run.stepId==='boss-comic'?[{type:'story-complete'},{type:'retry'}]:{type:'retry'});
  this._accept(r,()=>{if(this.legacy)this.attemptId=r.attemptId;this.carry=null;this._phaseSerial++;});return {...r,phase:this.phase};
 });}
 finishChapter(){return this._queue(async()=>{
  if(!this.finished)return this._reject('chapter-incomplete');if(this.savePending)return this._reject('unsaved-progress');
  if(this.preview)return {accepted:true,persisted:false,reason:'test-mode'};if(this.legacy)return {accepted:true,persisted:this.progress.get().persisted,reason:'legacy-adoption-required'};
  const actions=[];if(this.run.stepId==='handoff-comic')actions.push({type:'story-complete'});if(['handoff-comic','roster-choice'].includes(this.run.stepId))actions.push({type:'continue'});
  return actions.length?this._accept(await this.progress.dispatchChallenge(this._workingToken,actions)):this._reject('already-finished');
 });}
 retrySave(){return this._queue(async()=>{let r=await this.progress.retrySave();if(r.accepted&&r.persisted){for(const apply of this._pendingApply.splice(0))apply();if(this.legacy)this._rememberLegacy();if(!this.legacy&&this.run?.stepId==='entry')r=this._accept(await this.progress.dispatchChallenge(this._workingToken,{type:'story-complete'}));if(r.accepted&&r.persisted&&this.startResult?.accepted&&!this.startResult.persisted)this.startResult={...this.startResult,...r,token:this.token,run:this.run};}return r;});}
 flush(){return this._tail;}
}
