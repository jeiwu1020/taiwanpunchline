export const clone = value => JSON.parse(JSON.stringify(value));
export const zeroSkills = () => ({hp:0,move:0,basic:0,defense:0,special:0,rally:0,assist:0});
export function legacy({checkpoint=0,completed=false,xp=160,rewards=[],attemptSerial=0,routeAttempt=null}={}) {
 return {version:1,activeProfileId:'slot-1',profiles:[
  {id:'slot-1',unlockedCharacters:completed?['wang','han','huang']:['wang','han'],characters:{wang:{xp:80,skills:{...zeroSkills(),hp:1}},han:{xp:80,skills:{...zeroSkills(),move:1}}},challenge:{version:1,xp,checkpoint,completed,rewards,attemptSerial,routeAttempt}},
  {id:'slot-2',unlockedCharacters:['wang','han'],characters:{},challenge:{}},
  {id:'slot-3',unlockedCharacters:['wang','han'],characters:{},challenge:{}}
 ]};
}

export function memoryStorage(initial={}){
 const values=new Map(Object.entries(initial));let writes=0,failWrites=false,throwAfterWrite=false,failReads=0,corruptAfterWrite=null;
 return {values,get writes(){return writes;},set failWrites(v){failWrites=v;},set throwAfterWrite(v){throwAfterWrite=v;},set failReads(v){failReads=v;},set corruptAfterWrite(v){corruptAfterWrite=v;},
  getItem(k){if(failReads>0){failReads--;throw Error('read denied');}return values.get(k)??null;},
  setItem(k,v){if(failWrites)throw Error('quota');writes++;values.set(k,corruptAfterWrite??v);if(throwAfterWrite)throw Error('reported after write');}
 };
}
// A real in-process exclusive lock coordinator shared between independent stores.
export function serialLocks(){const tails=new Map();return {async request(name,options,fn){if(options.mode!=='exclusive')throw Error('exclusive required');const before=tails.get(name)??Promise.resolve();let release;const next=new Promise(r=>release=r);tails.set(name,before.then(()=>next));await before;try{return await fn();}finally{release();}}};}

// Formal-page fixtures advance the current v4 authority through real, validated
// transitions. No completed profile or receipt is inserted into saved bytes.
export async function freshCampaignAt({storage=memoryStorage(),locks=serialLocks(),chapterId='chapter-2',difficulty='easy'}={}){
 const {openChallengeProgress}=await import('../../dist/preview/campaign/fresh/progress.mjs');
 const api=await openChallengeProgress({storage,locks});
 const draft=api.preparationSnapshot();
 const prepared=await api.savePreparation({...draft,characterId:'han',helperId:'wang',difficulty},draft);
 if(!prepared.accepted||!prepared.persisted)throw Error(`Fixture preparation: ${prepared.reason}`);
 while(api.readProfile().campaign.cursor.chapterId!==chapterId){
  let result=await api.beginChallenge();
  if(!result.accepted||!result.persisted)throw Error(`Fixture begin: ${result.reason}`);
  for(const type of ['story-complete','route-complete','boss-win','route-complete','boss-win','route-complete','story-complete','boss-win','story-complete','continue']){
   result=await api.dispatchChallenge(result.token,{type});
   if(!result.accepted||!result.persisted)throw Error(`Fixture ${type}: ${result.reason}`);
  }
 }
 return {api,storage,locks};
}
