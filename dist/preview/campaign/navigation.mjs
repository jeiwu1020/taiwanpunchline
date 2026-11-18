// An explicit saved-game action grants one same-tab navigation. URL flags alone
// never grant access. The destination rechecks this saved revision before writes.
const KEY='taiwanpunchline-campaign-handoff-v1',MAX_AGE=300000;
const chapters=['chapter-2','chapter-3','chapter-4','chapter-5','finale-3v4'],profiles=['slot-1','slot-2','slot-3'];
const reject=reason=>({accepted:false,reason});
export function createCampaignHandoff({window,url,view,difficulty,now=Date.now()}={}){
 if(!view?.persisted||view.dirty||view.busy||view.readOnly||view.reason||view.testMode||view.canNavigate===false)return reject('unsaved-progress');
 if(view.generation!==undefined&&(!Number.isSafeInteger(view.generation)||view.generation<0))return reject('stale-handoff');
 if(!chapters.includes(view.chapterId)||!profiles.includes(view.profileId)||!Number.isSafeInteger(view.revision))return reject('content-locked');
 try{
  const target=new URL(url,window.location.href),number=view.chapterId==='finale-3v4'?'finale':'chapter'+view.chapterId.split('-')[1];
  if(target.origin!==window.location.origin||!target.pathname.endsWith(`/preview/${number}/`)||['test','qa','previewOnly'].some(k=>target.searchParams.has(k)))return reject('invalid-destination');
  const bytes=new Uint8Array(16);window.crypto.getRandomValues(bytes);const id=Array.from(bytes,x=>x.toString(16).padStart(2,'0')).join('');
  const handoff={profileId:view.profileId,chapterId:view.chapterId,revision:view.revision,...(view.generation!==undefined?{generation:view.generation}:{}),...(['beginner','easy','hard','normal'].includes(difficulty)?{difficulty:difficulty==='normal'?'hard':difficulty}:{})},raw=JSON.stringify({id,handoff,createdAt:now});
  const storage=window.sessionStorage;storage.setItem(KEY,raw);if(storage.getItem(KEY)!==raw)return reject('handoff-unavailable');
  target.searchParams.set('campaign','1');target.searchParams.set('profile',view.profileId);target.searchParams.set('handoff',id);
  return {accepted:true,url:target.href};
 }catch{return reject('handoff-unavailable');}
}
export function consumeCampaignHandoff({window,chapterId,now=Date.now()}={}){
 const query=new URL(window.location.href).searchParams,id=query.get('handoff');
 if(['test','qa','previewOnly'].some(k=>query.has(k))||!id||!/^\w{32}$/.test(id))return reject('no-handoff');
 try{
  const storage=window.sessionStorage,record=JSON.parse(storage.getItem(KEY));
  if(!record||record.id!==id)return reject('stale-handoff');
  storage.removeItem(KEY);const h=record.handoff;
  if(!h||!chapters.includes(h.chapterId)||!profiles.includes(h.profileId)||!Number.isSafeInteger(h.revision)||h.generation!==undefined&&(!Number.isSafeInteger(h.generation)||h.generation<0)||h.chapterId!==chapterId||h.difficulty!==undefined&&!['beginner','easy','hard'].includes(h.difficulty)||query.get('profile')!==h.profileId||!Number.isFinite(record.createdAt)||now<record.createdAt||now-record.createdAt>MAX_AGE)return reject('stale-handoff');
  return {accepted:true,handoff:h};
 }catch{return reject('handoff-unavailable');}
}
