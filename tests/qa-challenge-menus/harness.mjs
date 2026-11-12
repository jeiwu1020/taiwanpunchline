import {CAST} from '../../dist/roster.mjs';
import {mountChallengeUI} from '../../dist/challenge-ui.mjs';
import {mountChallengePreparation} from '../../dist/challenge-preparation.mjs';
import {openChallengeProgress,CHALLENGE_KEY} from '../../dist/preview/campaign/fresh/progress.mjs';
import {newEnvelope} from '../../dist/preview/campaign/fresh/schema.mjs';
const params=new URLSearchParams(location.search),prefix='task5-isolated-qa:',rotation=Number(params.get('rotation'))||0,app=document.querySelector('.app'),shell=document.querySelector('#viewport-shell');
const w=innerWidth,h=innerHeight;app.style.width=(rotation?h:w)+'px';app.style.height=(rotation?w:h)+'px';app.dataset.rotation=String(rotation);shell.style.width=w+'px';shell.style.height=h+'px';
if(params.has('fresh'))for(const key of Object.keys(localStorage))if(key.startsWith(prefix))localStorage.removeItem(key);
if(!localStorage.getItem(prefix+CHALLENGE_KEY)){const e=newEnvelope();for(const p of e.campaign.profiles){p.campaign.xp=560;p.unlockedCharacters=Object.keys(CAST);}localStorage.setItem(prefix+CHALLENGE_KEY,JSON.stringify(e));}
let fail=false;const storage={getItem:k=>localStorage.getItem(prefix+k),setItem(k,v){if(fail)throw Error('isolated quota failure');localStorage.setItem(prefix+k,v);}};
const controller=await openChallengeProgress({storage,locks:navigator.locks});
const characters=Object.fromEntries(Object.entries(CAST).map(([id,c])=>[id,{...c,portrait:'/dist/'+c.portrait}]));
let applied=[],closed=[];
const prep=mountChallengePreparation({document,controller,characters,parent:app,getEncounter:()=>({mode:'menu'}),onApplied:(...args)=>applied.push(args),onClose:o=>closed.push(o)});
const ui=mountChallengeUI({controller,characters,parent:app,onPrepare:o=>prep.open(o)});
document.querySelector('#qaLauncher').onclick=()=>ui.open();
window.QA={ui,prep,controller,storage,applied,closed,setFailure:v=>fail=v,prefix,open:view=>view==='prep'?prep.open({intent:'save-only',characterId:'han'}):ui.open({view}),snapshot:()=>controller.preparationSnapshot()};
window.QA.open(params.get('view')||'prep');window.qaReady=true;
function report(){const snap=controller.preparationSnapshot(),dialog=prep.isOpen?prep.element:ui.element,panel=dialog.querySelector('.challenge-preparation-panel')||dialog,r=dialog.getBoundingClientRect();parent.postMessage({task5State:{width:innerWidth,height:innerHeight,rotation,rectangle:{x:r.x,y:r.y,width:r.width,height:r.height},horizontalOverflow:panel.scrollWidth-panel.clientWidth,cardCount:dialog.querySelectorAll('[data-skill-card]').length,snapshot:snap,storageStatus:controller.get().persisted,applied:applied.map(a=>a[1]),closed,fail}},location.origin);}
const observer=new MutationObserver(()=>requestAnimationFrame(report));observer.observe(app,{childList:true,subtree:true,attributes:true});
window.addEventListener('message',e=>{if(e.origin!==location.origin||!e.data.task5Action)return;const action=e.data.task5Action;if(action==='fail'||action==='recover')fail=action==='fail';else{prep.hide();ui.hide();if(action==='prep')prep.open({intent:'save-only',characterId:'han'});else if(action==='readonly')prep.open({intent:'resume',characterId:'han',readOnly:true});else ui.open({view:action});}report();});report();
