import {openChallengeProgress} from './preview/campaign/fresh/progress.mjs?v=chapter-presentation-20261117-r1';
import {prepareMainContinuation} from './main-campaign-bridge.mjs?v=chapter-presentation-20261117-r1';
import {createCampaignHandoff} from './preview/campaign/navigation.mjs?v=chapter-presentation-20261117-r1';
import {chooseAdoptionSource,adoptionConfirmation} from './save-copy.mjs?v=chapter-presentation-20261117-r1';
import {mountChallengeUI} from './challenge-ui.mjs?v=chapter-presentation-20261117-r1';
import {CAST} from './roster.mjs?v=chapter-presentation-20261117-r1';

const storage=(()=>{try{return window.localStorage;}catch{return null;}})();
const controller=await openChallengeProgress({storage,locks:window.navigator?.locks});
const app=document.querySelector('#challenge-overview-app');
const showLoadFailure=()=>{app.innerHTML='<section class="screen centered"><div class="paper"><h2>首頁畫面無法載入</h2><p>請重新整理後再試。挑戰進度沒有變更。</p><a href="/">返回遊戲</a></div></section>';};

async function loadHomeSurface(){
 const response=await fetch('/index.html',{credentials:'same-origin'});
 if(!response.ok)throw new Error('home-unavailable');
 const source=new DOMParser().parseFromString(await response.text(),'text/html');
 const sourceApp=source.querySelector('#viewport-shell > main.app');
 if(!sourceApp)throw new Error('home-markup-unavailable');
 sourceApp.querySelectorAll('script').forEach(script=>script.remove());
 const styles=[...source.head.querySelectorAll('link[rel="stylesheet"]')];
 await Promise.all(styles.map(original=>new Promise(resolve=>{
  const link=document.createElement('link');link.rel='stylesheet';link.href=new URL(original.getAttribute('href'),location.origin+'/').href;
  link.media=original.media||'all';link.onload=resolve;link.onerror=resolve;document.head.append(link);
  if(link.sheet)queueMicrotask(resolve);
 })));
 for(const attribute of [...app.attributes])if(attribute.name!=='id')app.removeAttribute(attribute.name);
 for(const attribute of [...sourceApp.attributes])if(attribute.name!=='id')app.setAttribute(attribute.name,attribute.value);
 app.id='challenge-overview-app';app.classList.add('app');app.dataset.titleOpen='false';
 app.replaceChildren(...[...sourceApp.childNodes].map(node=>document.importNode(node,true)));
 app.querySelectorAll('script').forEach(script=>script.remove());
 return app;
}

function renderHomeMenu(){
 const snapshot=controller.preparationSnapshot(),profile=controller.readProfile(),selection=profile?.campaign?.selection||snapshot;
 const player=CAST[selection.characterId]?selection.characterId:'wang',helper=CAST[selection.helperId]?selection.helperId:'han',opponent='han';
 const menu=app.querySelector('#menu'),title=app.querySelector('#title-screen'),stage=app.querySelector('.stage-wrap'),deck=app.querySelector('.control-deck');
 if(!menu||!stage)throw new Error('home-menu-unavailable');
 title?.classList.add('hidden');if(title)title.hidden=true;
 app.querySelectorAll('.screen').forEach(screen=>screen.classList.add('hidden'));menu.classList.remove('hidden');
 app.dataset.titleOpen='false';stage.inert=false;if(deck)deck.inert=false;
 const challengeButton=app.querySelector('#mode-challenge');challengeButton?.removeAttribute('disabled');if(challengeButton)challengeButton.textContent='挑戰';
 app.querySelector('#pause')?.setAttribute('disabled','');app.querySelector('#help')?.removeAttribute('disabled');
 const paintCard=(side,id,role)=>{const cast=CAST[id];if(!cast)return;const image=app.querySelector(`#${side}-portrait`);if(image){image.src=cast.portrait;image.alt=`${cast.name}原創諷刺漫畫`;}app.querySelector(`#${side}-name`).textContent=cast.name;app.querySelector(`#${side}-tag`).textContent=cast.tag;app.querySelector(`#${side}-moves`).textContent=cast.moves.map(move=>move.name).join(' · ');app.querySelector(`#${side}-selection-hint`).textContent=role;};
 paintCard('player',player,'你 · 選角中');paintCard('opponent',opponent,'AI · 點我換人');
 app.querySelector('#target-player').textContent=CAST[player].name;app.querySelector('#target-playerAssist').textContent=CAST[helper].name;
 app.querySelector('#target-opponent').textContent=CAST[opponent].name;app.querySelector('#target-enemyAssist').textContent=CAST.han.name;
 app.querySelector('#player-portrait')?.closest('.matchup-card')?.style.setProperty('--cast-color',CAST[player].colorCSS);
 app.querySelector('#opponent-portrait')?.closest('.matchup-card')?.style.setProperty('--cast-color',CAST[opponent].colorCSS);
 const roster=app.querySelector('#roster-grid');
 roster.innerHTML=Object.entries(CAST).map(([id,cast])=>`<button type="button" class="roster-option" data-character="${id}" aria-pressed="${id===player}" style="--portrait-color:${cast.colorCSS}"><span class="roster-badge"></span><img src="/${cast.portrait}" alt="" draggable="false"><strong></strong></button>`).join('');
 for(const [id,cast]of Object.entries(CAST)){const button=roster.querySelector(`[data-character="${id}"]`),available=controller.canUse(id);button.disabled=!available;button.dataset.locked=String(!available);button.querySelector('strong').textContent=available?cast.name:'???';button.querySelector('.roster-badge').textContent=available&&id===player?'你':available&&id===opponent?'AI':available?'':'未解鎖';button.setAttribute('aria-label',available?cast.name:'未解鎖角色，???');}
 app.querySelector('#roster-instruction').textContent='替你選角 · 可同角登場';
 const difficulty=['beginner','easy','hard'].includes(profile?.campaign?.difficulty)?profile.campaign.difficulty:'easy';
 for(const id of ['beginner','easy','normal']){const key=id==='normal'?'hard':id,button=app.querySelector(`#difficulty-${id}`);button.disabled=false;button.setAttribute('aria-pressed',String(key===difficulty));app.querySelector(`#difficulty-mark-${id}`).textContent=key===difficulty?'✓':'○';}
 app.querySelector('#format-single')?.setAttribute('aria-pressed','true');app.querySelector('#format-series')?.setAttribute('aria-pressed','false');
}

function openMainChallenge({characterId,helperId,intent='start',replay=false,chapterId}={}){
 const target=new URL('/',location.href);target.searchParams.set('challengeLaunch','1');target.searchParams.set('intent',['start','resume'].includes(intent)?intent:'start');
 if(controller.canUse(characterId))target.searchParams.set('characterId',characterId);
 if(controller.canUse(helperId))target.searchParams.set('helperId',helperId);
 if(replay)target.searchParams.set('replay','1');
 if(chapterId)target.searchParams.set('chapterId',chapterId);
 location.assign(target.href);return{accepted:true,persisted:controller.get().persisted};
}

async function continueSavedCampaign({characterId,helperId}={}){
 const result=await prepareMainContinuation({progress:controller,characterId,helperId,choose:info=>chooseAdoptionSource(window,info),confirm:info=>window.confirm(adoptionConfirmation(info))});
 if(!result.accepted)return result;
 if(result.testMode){location.assign(new URL(result.url,location.href).href);return result;}
 const profile=controller.readProfile(),state=controller.get(),handoff=createCampaignHandoff({window,url:result.url,difficulty:profile?.campaign?.difficulty,view:{...state,chapterId:profile?.campaign?.cursor?.chapterId}});
 if(!handoff.accepted)return handoff;
 location.assign(handoff.url);return{accepted:true,persisted:true};
}

let ui=null;
try{
 await loadHomeSurface();renderHomeMenu();
 ui=mountChallengeUI({controller,characters:CAST,parent:app,onStart:openMainChallenge,onContinue:continueSavedCampaign,onClose:()=>{}});
 ui.open({view:'chapter'});
 app.querySelector('#mode-challenge')?.addEventListener('click',()=>ui.open({view:'chapter'}));
 app.querySelector('#home')?.addEventListener('click',()=>location.assign('/'));
 app.querySelector('#start')?.addEventListener('click',()=>location.assign('/?entryMenu=1'));
 app.querySelector('#mode-battle')?.addEventListener('click',()=>location.assign('/?entryMenu=1&mode=battle'));
 app.querySelector('#mode-training')?.addEventListener('click',()=>location.assign('/?entryMenu=1&mode=training'));
}catch{showLoadFailure();}
window.addEventListener('pagehide',()=>ui?.destroy(),{once:true});
