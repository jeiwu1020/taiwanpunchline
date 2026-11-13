import {newDocument} from '../campaign/core/model.mjs?v=campaign-boot-20261112-r3';
import {startRun,applyRunAction} from '../campaign/core/transition.mjs?v=campaign-boot-20261112-r3';
import {newEnvelope,CHALLENGE_KEY} from '../campaign/fresh/schema.mjs';
export const QUICK_VIEW_HOST='codex-complete-challenge-story-taiwanpunchline.playformosa.workers.dev';
export const quickViewAllowed=host=>host===QUICK_VIEW_HOST;
export function createQuickViewStorage(){
 const data=new Map();return {get length(){return data.size;},key:i=>[...data.keys()][i]??null,getItem:k=>data.get(String(k))??null,setItem:(k,v)=>{data.set(String(k),String(v));},removeItem:k=>{data.delete(String(k));},clear:()=>data.clear()};
}
export function seedChapter(number){
 if(!Number.isInteger(number)||number<1||number>6)throw new RangeError('Invalid preview chapter');
 let document=newDocument();
 for(let i=1;i<number;i++){
  let r=startRun(document);if(!r.ok)throw Error(r.reason);
  for(const type of ['story-complete','route-complete','boss-win','route-complete','boss-win','route-complete','story-complete','boss-win','story-complete','continue']){
   r=applyRunAction(r.document,r.run,{type});if(!r.ok)throw Error(r.reason);
  }document=r.document;
 }
 const envelope=newEnvelope();envelope.campaign=document;
 // Later chapters have already seen the opening; chapter one retains the full opening.
 if(number>1)document.profiles[0].campaign.story.opening='seen';
 return envelope;
}

// Preserve only preferences already chosen inside this isolated viewer, never owner data.
export function resetQuickViewChapter(session,number){
 const envelope=seedChapter(number),next=createQuickViewStorage();
 for(const key of ['parliament-settings-v1','brawl-page-zoom-v51']){
  const value=session.local.getItem(key);if(value!==null)next.setItem(key,value);
 }
 next.setItem(CHALLENGE_KEY,JSON.stringify(envelope));
 session.local=next;session.tab=createQuickViewStorage();
}
