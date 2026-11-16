import {openChallengeProgress} from './preview/campaign/fresh/progress.mjs?v=campaign-boot-20261112-r3';
import {prepareMainContinuation} from './main-campaign-bridge.mjs?v=campaign-boot-20261112-r3';
import {createCampaignHandoff} from './preview/campaign/navigation.mjs?v=campaign-boot-20261112-r3';
import {chooseAdoptionSource,adoptionConfirmation} from './save-copy.mjs?v=campaign-boot-20261112-r3';
import {mountChallengeUI} from './challenge-ui.mjs?v=campaign-boot-20261112-r3';
import {CAST} from './roster.mjs?v=campaign-boot-20261112-r3';

const storage=(()=>{try{return window.localStorage;}catch{return null;}})();
const controller=await openChallengeProgress({storage,locks:window.navigator?.locks});
const root=document.querySelector('#challenge-overview-app');

function launchChapterOne({characterId,helperId,intent='start',replay=false}={}){
 const target=new URL('/',window.location.href);
 target.searchParams.set('challengeLaunch','1');
 target.searchParams.set('intent',['start','resume'].includes(intent)?intent:'start');
 if(Object.hasOwn(CAST,characterId||''))target.searchParams.set('characterId',characterId);
 if(Object.hasOwn(CAST,helperId||''))target.searchParams.set('helperId',helperId);
 if(replay)target.searchParams.set('replay','1');
 window.location.assign(target.href);
 return {accepted:true,persisted:controller.get().persisted};
}

async function continueSavedCampaign({characterId,helperId}={}){
 const result=await prepareMainContinuation({
  progress:controller,
  characterId,
  helperId,
  choose:info=>chooseAdoptionSource(window,info),
  confirm:info=>window.confirm(adoptionConfirmation(info))
 });
 if(!result.accepted)return result;
 if(result.testMode){
  window.location.assign(new URL(result.url,window.location.href).href);
  return result;
 }
 const profile=controller.readProfile(),state=controller.get();
 const handoff=createCampaignHandoff({
  window,
  url:result.url,
  difficulty:profile?.campaign?.difficulty,
  view:{...state,chapterId:profile?.campaign?.cursor?.chapterId}
 });
 if(!handoff.accepted)return handoff;
 window.location.assign(handoff.url);
 return {accepted:true,persisted:true};
}

const ui=mountChallengeUI({
 controller,
 characters:CAST,
 parent:root,
 onStart:launchChapterOne,
 onContinue:continueSavedCampaign,
 onClose:()=>window.location.assign('/')
});
ui.open({view:'chapter'});
window.addEventListener('pagehide',()=>ui.destroy(),{once:true});
