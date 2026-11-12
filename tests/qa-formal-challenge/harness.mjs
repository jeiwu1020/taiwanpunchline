import './storage-faults.mjs';
import {openUnifiedProgress} from '/preview/campaign/unified/progress.mjs';
import {prepareMainContinuation} from '/main-campaign-bridge.mjs';
import {createCampaignHandoff} from '/preview/campaign/navigation.mjs';
export const $=s=>document.querySelector(s),f=$('#game-frame'),observations=[],events=[];
const legacy=(complete,checkpoint=0)=>({version:1,activeProfileId:'slot-1',profiles:[{id:'slot-1',unlockedCharacters:complete?['wang','han','huang']:['wang','han'],characters:{},challenge:{version:1,xp:160,checkpoint,completed:complete,rewards:[],attemptSerial:0,routeAttempt:null}},...['slot-2','slot-3'].map(id=>({id,unlockedCharacters:['wang','han'],characters:{},challenge:{}}))]});
const advance=['story-complete','route-complete','boss-win','route-complete','boss-win','route-complete','story-complete','boss-win','story-complete','continue'];
function dims(){[f.width,f.height]=$('#size').value.split(',');}
$('#resize').onclick=dims;
async function loadFormal(){try{f.src='about:blank';const n=Number($('#chapter').value),step=$('#step').value;dims();
 for(const k of ['taiwanpunchline-progress-v1','taiwanpunchline-progress-v2','taiwanpunchline-progress-v2:v1-import-seed','taiwanpunchline-progress-v3'])localStorage.removeItem(k);
 localStorage.setItem('parliament-settings-v1',JSON.stringify({version:1,rotate:$('#rotate').value==='true',camera:$('#camera').value,masterMuted:true}));
 const [left,right]=$('#safe').value.split(',');document.cookie='qa-safe-left='+left+'; path=/';document.cookie='qa-safe-right='+right+'; path=/';
 const seed=legacy(n>1,n===1?({entry:0,'route-a':0,'miniboss-a':1,'route-b':2,'miniboss-b':3,'route-c':4,'boss-comic':5,boss:5,'roster-choice':6}[step]):6);if(n===1&&$('#fixture')?.value==='saved'){Object.assign(seed.profiles[0].challenge,{selection:{characterId:'han',helperId:'wang'},difficulty:'hard',carry:{hp:37,rally:41,assist:{helper:'wang',charge:12,used:true,active:false,damageTaken:0}},attemptSerial:7,routeAttempt:{id:7,checkpoint:2}});} localStorage.setItem('taiwanpunchline-progress-v1',JSON.stringify(seed));
 const p=await openUnifiedProgress({storage:localStorage,locks:navigator.locks});if(n===1&&$('#authority').value==='adopted'){const i=p.inspectAdoption();const r=await p.adoptProfile('slot-1',{source:'legacy',expectedRevision:i.revision,evidence:i.evidence});if(!r.persisted)throw Error(JSON.stringify(r));}
 let target='/?'+(Number(f.width)<1000?'touchPreview=1':'');
 if(n>1){const ready=await prepareMainContinuation({progress:p,characterId:'wang',helperId:'han',confirm:async()=>true});if(!ready.accepted)throw Error(JSON.stringify(ready));
 while(p.readProfile().campaign.cursor.chapterId!==`chapter-${n}`){let r=await p.beginChallenge();for(const type of advance){r=await p.dispatchChallenge(r.token,{type});if(!r.accepted)throw Error(JSON.stringify(r));}}
 let r=await p.beginChallenge(),i=0;while(p.readProfile().campaign.cursor.stepId!==step){r=await p.dispatchChallenge(r.token,{type:advance[i++]});if(!r.accepted||i>10)throw Error(JSON.stringify(r));}
 const handoff=createCampaignHandoff({window,url:`/preview/chapter${n}/`,view:{...p.get(),profileId:'slot-1',chapterId:`chapter-${n}`,canNavigate:true},difficulty:'beginner'});if(!handoff.accepted)throw Error(JSON.stringify(handoff));target=handoff.url+(Number(f.width)<1000?'&touchPreview=1':'');}
 $('#status').textContent=`Loading formal chapter ${n}, ${step}, ${f.width}×${f.height}; synthetic revision ${p.get().revision}; no previewOnly.`;f.src=target;
 }catch(e){$('#status').textContent=String(e.stack);throw e;}}
$('#load').onclick=()=>loadFormal().catch(()=>{});
for(const b of document.querySelectorAll('[data-action]'))b.onclick=()=>{events.push({action:b.dataset.action,at:new Date().toISOString()});f.contentWindow.postMessage({formalQA:true,action:b.dataset.action},location.origin);};
window.addEventListener('message',e=>{if(e.origin===location.origin&&e.source===f.contentWindow&&e.data?.formalQA){$('#state').textContent=JSON.stringify(e.data,null,2);events.push(e.data);}});
export function capture(label='manual'){const d=f.contentDocument,w=f.contentWindow;if(!d?.body)return;const visible=e=>{if(!e)return false;const s=w.getComputedStyle(e),r=e.getBoundingClientRect();return !e.closest('[hidden]')&&s.display!=='none'&&s.visibility!=='hidden'&&r.width>0&&r.height>0&&(!e.closest('details:not([open])')||e.tagName==='SUMMARY');};const rect=e=>{const r=e.getBoundingClientRect();return {x:r.x,y:r.y,w:r.width,h:r.height,right:r.right,bottom:r.bottom};};
 const selectors=['header','#hud','.dom-hud','#campaign-bar','#challenge-save-slot','#game-canvas','#game canvas','.chapter-objective','#controls','.control-deck','#story-panel .story-card','#result-panel .card','#pause-panel .card','#choice-panel .card','#help-dialog','#challengePreparationOverlay','.challenge-panel','.challenge-story','.screen:not(.hidden)'];
 const regions=[...new Set(selectors.flatMap(s=>[...d.querySelectorAll(s)]))].filter(visible).map(e=>({selector:e.id?'#'+e.id:e.className,rect:rect(e)}));
 const controls=[...d.querySelectorAll('button,a,summary,select,input')].filter(visible).map(e=>{const r=rect(e),x=r.x+r.w/2,y=r.y+r.h/2,hit=d.elementFromPoint(x,y),reachable=!!hit&&(e===hit||e.contains(hit));return {id:e.id,text:(e.getAttribute('aria-label')||e.textContent).trim().replace(/\s+/g,' ').slice(0,85),rect:r,disabled:e.disabled||false,combatControl:!!e.closest('#controls,.control-deck'),modal:!!e.closest('dialog[open]'),reachable,hit:hit?.id||hit?.className||hit?.tagName,outside:r.x<-.5||r.y<-.5||r.right>w.innerWidth+.5||r.bottom>w.innerHeight+.5};});
 const o={label,at:new Date().toISOString(),url:w.location.href,chapter:$('#chapter').value,selectedStep:$('#step').value,size:[w.innerWidth,w.innerHeight],camera:$('#camera').value,rotation:$('#rotate').value,safe:$('#safe').value,body:{...d.body.dataset,app:d.querySelector('.app')?.dataset?{...d.querySelector('.app').dataset}:null},document:[d.documentElement.scrollWidth,d.documentElement.scrollHeight],formal:d.body.dataset.campaignMode==='true'||($('#chapter').value==='1'&&!w.location.search.includes('test')),regions,controls};observations.push(o);f.contentWindow.postMessage({formalQA:true,action:'snapshot'},location.origin);$('#report').textContent=JSON.stringify({count:observations.length,last:o},null,2);return o;}
$('#capture').onclick=()=>capture();
export async function saveReport(){const r=await fetch('/qa-results',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({generatedAt:new Date().toISOString(),limitations:['Synthetic profile on isolated localhost origin','World gate/win/loss actions are controlled injection, not player-input proof','Viewport simulation, not physical device'],observations,events},null,2)});$('#status').textContent='Report '+(r.ok?'saved':'FAILED');}
$('#save-report').onclick=saveReport;

import {installMatrix} from './matrix.mjs';
installMatrix({loadFormal,capture,saveReport,frame:f,events});

import {installFirstMatrix} from './matrix-first.mjs';
installFirstMatrix({loadFormal,capture,saveReport,frame:f,events});

import {installFocused} from "./focused.mjs";
installFocused({loadFormal,capture,saveReport,frame:f,events});

import {installTwoRuntime} from "./two-runtime.mjs";
installTwoRuntime({loadFormal,capture,saveReport,frame:f,events});

import {installVisibility} from "./visibility.mjs";
installVisibility({loadFormal,capture,saveReport,frame:f,events});

import {inspectCompactHud} from "./hud-containment.mjs";
$("#hud-check").onclick=async()=>{const result=inspectCompactHud(f.contentDocument);events.push({compactHUD:{at:new Date().toISOString(),chapter:$("#chapter").value,size:$("#size").value,rotation:$("#rotate").value,result}});capture("compact-hud-"+$("#chapter").value+"-"+$("#rotate").value);await saveReport();};
