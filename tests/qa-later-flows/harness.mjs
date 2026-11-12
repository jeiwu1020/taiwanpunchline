import {openChallengeProgress,CHALLENGE_KEY} from '/preview/campaign/fresh/progress.mjs';
import {createCampaignHandoff} from '/preview/campaign/navigation.mjs';
const status=document.querySelector('#status');
if(location.origin!=='http://127.0.0.1:4173')throw Error('Only the isolated managed development origin is allowed.');
function snapshot(){const raw=localStorage.getItem(CHALLENGE_KEY);let e=null;try{e=JSON.parse(raw);}catch{}status.textContent=JSON.stringify({origin:location.origin,key:CHALLENGE_KEY,activeProfileId:e?.activeProfileId,revision:e?.revision,profiles:e?.campaign?.profiles.map(p=>({id:p.id,xp:p.campaign.xp,cursor:p.campaign.cursor,selection:p.campaign.selection,clears:p.campaign.chapterClears})),backupKeys:Object.keys(localStorage).filter(k=>k.startsWith('task6-qa-backup:'))},null,2);}
snapshot();document.querySelector('#snapshot').onclick=snapshot;
for(const button of document.querySelectorAll('[data-chapter]'))button.onclick=async()=>{
 for(const b of document.querySelectorAll('button'))b.disabled=true;status.textContent='正在建立合成存檔及驗證讀回…';
 try{
 const data=new Map(),storage={getItem:k=>data.get(k)??null,setItem:(k,v)=>data.set(k,String(v))},api=await openChallengeProgress({storage,locks:navigator.locks}),draft=api.preparationSnapshot();
 let r=await api.savePreparation({...draft,characterId:'han',helperId:'wang',difficulty:'easy'},draft);if(!r.persisted)throw Error(r.reason);
 const chapterId='chapter-'+button.dataset.chapter;
 while(api.readProfile().campaign.cursor.chapterId!==chapterId){r=await api.beginChallenge();if(!r.persisted)throw Error(r.reason);for(const type of ['story-complete','route-complete','boss-win','route-complete','boss-win','route-complete','story-complete','boss-win','story-complete','continue']){r=await api.dispatchChallenge(r.token,{type});if(!r.accepted||!r.persisted)throw Error(type+': '+r.reason);}}
 if(button.dataset.step==='roster-choice'){r=await api.beginChallenge();for(const type of ['story-complete','route-complete','boss-win','route-complete','boss-win','route-complete','story-complete','boss-win','story-complete']){r=await api.dispatchChallenge(r.token,{type});if(!r.accepted||!r.persisted)throw Error(type+': '+r.reason);}}
 const previous=localStorage.getItem(CHALLENGE_KEY),backupKey='task6-qa-backup:'+Date.now();if(previous!==null){localStorage.setItem(backupKey,previous);if(localStorage.getItem(backupKey)!==previous)throw Error('Backup readback failed');}
 const raw=data.get(CHALLENGE_KEY);localStorage.setItem(CHALLENGE_KEY,raw);if(localStorage.getItem(CHALLENGE_KEY)!==raw)throw Error('Seed readback failed');
 const handoff=createCampaignHandoff({window,url:`/preview/chapter${button.dataset.chapter}/?campaign=1&profile=slot-1`,view:{...api.get(),chapterId},difficulty:'easy'});if(!handoff.accepted)throw Error(handoff.reason);
 status.textContent='已備份並讀回合成存檔，進入真正正式頁。';location.assign(handoff.url);
 }catch(error){status.textContent=error.stack;for(const b of document.querySelectorAll('button'))b.disabled=false;}
};
