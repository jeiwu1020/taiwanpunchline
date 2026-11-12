import {SKILLS,MAX_RANK,XP_PER_POINT,allowance,deriveStats} from './core/model.mjs?v=campaign-visuals-20261112-r2';
import {CHARACTER_IDS} from './core/catalog.mjs?v=campaign-visuals-20261112-r2';

const LABELS=Object.freeze({hp:'續航氣勢',move:'靈活走位',basic:'基本功',defense:'防守韌性',special:'招牌絕招',rally:'揪團聲勢',assist:'助拳默契'});
const EFFECTS=Object.freeze({hp:'氣勢上限 +3%',move:'移動速度 +1%',basic:'普攻傷害 +2%',defense:'承受傷害 −1.5%',special:'絕招傷害 +2%',rally:'揪團傷害 +2%',assist:'助拳傷害 +2%'});
const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const reasons=Object.freeze({
 'preview-only':'測試模式不寫入正式進度。',
 'test-mode':'測試模式不寫入正式進度。',
 'storage-unavailable':'儲存空間目前無法使用。',
 'quota-exceeded':'儲存空間不足。',
 'stale-run':'進度已變更，請重新開啟挑戰。',
 'stale-document':'進度已變更，請重新開啟挑戰。',
 'character-locked':'這個角色尚未解鎖。',
 'no-skill-point':'點數不足或該技能已達上限。'
});
let nextId=0;

/**
 * Storage-free view. The host loads growth-ui.css and calls refresh() whenever
 * its source changes. get() is synchronous; allocate/reset return promises.
 * onChange(result, context) is called only for accepted mutations, including
 * accepted but unpersisted ones. It is a notification, never a second write.
 * Opening pins a profile until close/reopen. The controller must independently
 * enforce its source/run token because UI guards cannot secure async storage.
 */
export function mountCampaignGrowthUI({document,window=document?.defaultView,characters={},controller,onChange=()=>{}}={}){
 if(!document?.body||!window||!controller?.get||!controller?.allocate||!controller?.reset)throw new TypeError('Growth UI requires document, window and a controller');
 const dialog=document.createElement('dialog'),id=`campaign-growth-${++nextId}`;
 dialog.className='campaign-growth-dialog';dialog.setAttribute('aria-labelledby',`${id}-title`);dialog.setAttribute('aria-describedby',`${id}-scope`);document.body.append(dialog);
 let selected='',openingProfile=null,stale=false,liveOpen=false,destroyed=false,session=0,previousFocus=null;
 let pending=null,retry=null,uncertain=false,status='',statusKind='';
 // A stale "saved" snapshot must not override an unpersisted mutation result.
 // Clear only after observing unsaved -> saved, or a later persisted mutation.
 const unpersistedProfiles=new Map();
 const name=characterId=>characters[characterId]?.name||characterId||'尚無角色';
 const reasonText=reason=>reasons[reason]||'';
 const usable=state=>Array.isArray(state.unlockedCharacters)?[...new Set(state.unlockedCharacters)].filter(key=>CHARACTER_IDS.includes(key)&&Object.hasOwn(characters,key)):[];
 function read(){
  try{
   const state=controller.get();
   if(!state||typeof state!=='object'||typeof state.profileId!=='string'||!Number.isFinite(state.xp)||state.xp<0)throw new Error('Invalid snapshot');
   return state;
  }catch{return {profileId:openingProfile,xp:0,characters:{},unlockedCharacters:[],readOnly:true,readIssue:true};}
 }
 function ranks(state,characterId){
  const row=state.characters?.[characterId],raw=row?.skills;
  let invalid=!!row&&(!raw||typeof raw!=='object'||Array.isArray(raw));
  if(raw&&typeof raw==='object'&&Object.keys(raw).some(key=>!SKILLS.includes(key)))invalid=true;
  const skills=Object.fromEntries(SKILLS.map(key=>{
   const value=raw?.[key];
   if(value===undefined)return [key,0];
   if(!Number.isInteger(value)||value<0||value>MAX_RANK){invalid=true;return [key,0];}
   return [key,value];
  }));
  const stats=deriveStats({characters:{[characterId]:{skills}},campaign:{xp:state.xp}},CHARACTER_IDS.includes(characterId)?characterId:CHARACTER_IDS[0]);
  if(stats.spent>allowance(state.xp))invalid=true;
  return {...stats,skills,invalid};
 }
 function checkProfile(state){if(liveOpen&&!state.readIssue&&state.profileId!==openingProfile){stale=true;status='';statusKind='';retry=null;}}
 function blocked(state,stats,characterId){return destroyed||!liveOpen||!dialog.open||stale||state.readIssue||state.readOnly||state.testMode||state.reason==='preview-only'||state.reason==='test-mode'||state.busy||pending||uncertain||stats.invalid||!usable(state).includes(characterId);}
 function warning(state,stats){
  if(stale)return '存檔已切換，這個面板已停止配點。請關閉後重新開啟，確認要調整的存檔。';
  if(state.readIssue)return '無法讀取角色進度，暫停配點。請重新讀取或關閉後再試。';
  if(state.testMode||state.reason==='preview-only'||state.reason==='test-mode')return '測試模式：只供檢視，不寫入經驗、技能或正式存檔。';
  if(state.readOnly)return `目前為唯讀，不能配點或重置。${reasonText(state.reason)}`;
  if(state.busy)return '正在讀取或處理進度，請稍候再配點。';
  if(stats.invalid)return '技能資料不完整或超出可用額度，暫停配點。請重新讀取進度。';
  if(!usable(state).length)return '目前沒有可配點的已解鎖角色。';
  return '';
 }
 function focusKey(element){if(!dialog.contains(element))return null;if(element.dataset.skill)return `skill:${element.dataset.skill}`;if(element.hasAttribute('data-character'))return 'character';if(element.dataset.action)return `action:${element.dataset.action}`;return null;}
 function focusTarget(key){if(key==='character')return dialog.querySelector('[data-character]');if(key?.startsWith('skill:'))return dialog.querySelector(`[data-skill="${key.slice(6)}"]`);if(key?.startsWith('action:'))return dialog.querySelector(`[data-action="${key.slice(7)}"]`);return null;}
 function refresh(snapshot){
  if(destroyed)return;
  // Public refresh accepts no data; never let a DOM event become a snapshot.
  const state=snapshot?.profileId!==undefined?snapshot:read();checkProfile(state);
  const ids=usable(state),oldFocus=focusKey(document.activeElement),scroll=dialog.scrollTop;
  if(!ids.includes(selected))selected=ids.includes(state.selection?.characterId)?state.selection.characterId:(ids[0]||'');
  const stats=ranks(state,selected),remaining=Math.max(0,allowance(state.xp)-stats.spent),char=characters[selected]||{},disable=!!blocked(state,stats,selected);
  const notice=warning(state,stats),charXP=Number.isFinite(state.characters?.[selected]?.xp)?Math.max(0,state.characters[selected].xp):0;
  if(unpersistedProfiles.has(state.profileId)){
   if(state.persisted===false)unpersistedProfiles.set(state.profileId,true);
   else if(state.persisted===true&&unpersistedProfiles.get(state.profileId)){
    unpersistedProfiles.delete(state.profileId);
    if(statusKind==='unsaved'){status='目前配點已保存。';statusKind='saved';}
   }
  }
  const storage=unpersistedProfiles.has(state.profileId)||state.persisted===false?'尚未保存：關閉頁面可能遺失變更。請使用原頁面的重試保存／匯出備份。':state.persisted===true?'目前進度已保存。':'目前保存狀態尚未確認。';
  const retryAllowed=retry&&retry.profileId===openingProfile&&retry.characterId===selected&&!stale;
  dialog.setAttribute('aria-busy',String(!!(pending||state.busy)));
  dialog.innerHTML=`<header class="campaign-growth-header"><div><p class="campaign-growth-eyebrow">挑戰檔案 / ${esc((state.profileId||'').replace('slot-','存檔 '))}</p><h2 id="${id}-title" class="campaign-growth-title">角色研究所</h2></div><button type="button" class="campaign-growth-close" data-action="close" aria-label="關閉技能配點">✕</button></header>
   <div class="campaign-growth-paper">
    <p id="${id}-scope" class="campaign-growth-scope">技能只影響挑戰；本場已開始時，新的配點於下一個路段／戰鬥生效。</p>
    <p class="campaign-growth-warning" data-warning ${notice?'':'hidden'}>${esc(notice)}</p>
    <section class="campaign-growth-shared" aria-label="隊伍成長"><strong>全隊 ${Math.floor(state.xp)} XP · 每角色 ${allowance(state.xp)} 點</strong><span>每 ${XP_PER_POINT} XP 給每位角色 1 點，上限 35 點。${allowance(state.xp)<35?`再 ${XP_PER_POINT-Math.floor(state.xp)%XP_PER_POINT} XP 增加 1 點。`:'已達配點額度上限。'}</span></section>
    <label class="campaign-growth-picker" for="${id}-character">檢視角色<select id="${id}-character" class="campaign-growth-select" data-character ${!ids.length||pending||state.busy||stale?'disabled':''}>${ids.length?ids.map(key=>`<option value="${esc(key)}" ${key===selected?'selected':''}>${esc(name(key))}</option>`).join(''):'<option value="">尚無可用角色</option>'}</select></label>
    <div class="campaign-growth-layout"><section class="campaign-growth-summary" aria-label="角色挑戰派生能力"><h3 class="campaign-growth-name">${esc(name(selected))}</h3>${char.tag?`<span class="campaign-growth-tag">${esc(char.tag)}</span>`:''}<p class="campaign-growth-fine">角色 ${Math.floor(charXP)} XP 記錄出戰歷程；技能額度由全隊 XP 決定。切換檢視不會更換出戰角色。</p>
     <h4 class="campaign-growth-subtitle">挑戰派生能力</h4><dl class="campaign-growth-stats">${[
      ['氣勢上限','maxHp',stats.maxHp.toFixed(0)],['移動速度','moveMultiplier',`×${stats.moveMultiplier.toFixed(2)}`],['普攻傷害','basicMultiplier',`×${stats.basicMultiplier.toFixed(2)}`],['承受傷害','damageTakenMultiplier',`×${stats.damageTakenMultiplier.toFixed(3)}`],['絕招傷害','specialMultiplier',`×${stats.specialMultiplier.toFixed(2)}`],['揪團傷害','rallyMultiplier',`×${stats.rallyMultiplier.toFixed(2)}`],['助拳傷害','assistMultiplier',`×${stats.assistMultiplier.toFixed(2)}`]
     ].map(([label,key,value])=>`<div class="campaign-growth-stat"><dt>${label}</dt><dd data-stat="${key}">${value}</dd></div>`).join('')}</dl><p class="campaign-growth-fine">此處只顯示挑戰加成，不改寫角色原有基礎能力。</p></section>
     <section class="campaign-growth-tree" aria-label="技能配點"><h3 class="campaign-growth-tree-title">自由技能樹 <span data-remaining>剩餘 ${remaining} 點</span></h3><p class="campaign-growth-fine">七條獨立分支，沒有前置限制；每項最多 5 點。</p><div class="campaign-growth-branches">${SKILLS.map(key=>`<button type="button" class="campaign-growth-skill" data-skill="${key}" data-rank="${stats.skills[key]}" ${disable||remaining===0||stats.skills[key]>=MAX_RANK?'disabled':''} aria-label="${LABELS[key]}，已投入 ${stats.skills[key]}，上限 5 點，增加 1 點"><span class="campaign-growth-skill-copy"><strong>${LABELS[key]}</strong><small>每點 ${EFFECTS[key]}</small></span><span class="campaign-growth-ranks" aria-hidden="true">${Array.from({length:5},(_,index)=>`<i class="campaign-growth-rank" data-filled="${index<stats.skills[key]}"></i>`).join('')}</span><b class="campaign-growth-count">${stats.skills[key]} / 5 ${stats.skills[key]>=MAX_RANK?'已滿':'＋'}</b></button>`).join('')}</div><button type="button" class="campaign-growth-reset" data-action="reset" ${disable||!stats.spent?'disabled':''}>免費重置此角色配點</button><p class="campaign-growth-fine">點數全數退回，其他角色、經驗與章節進度不受影響。</p></section></div>
    <footer class="campaign-growth-footer"><p class="campaign-growth-storage" data-storage>${esc(storage)}</p><p class="campaign-growth-status" role="status" aria-live="polite" aria-atomic="true" data-kind="${statusKind}">${esc(status)}</p>${retryAllowed?`<button type="button" class="campaign-growth-retry" data-action="retry" ${disable?'disabled':''}>重試剛才的${retry.action==='reset'?'重置':'配點'}</button>`:''}${uncertain||state.readIssue||stats.invalid?'<button type="button" class="campaign-growth-reload" data-action="reload">重新讀取進度</button>':''}</footer>
   </div>`;
  dialog.scrollTop=scroll;
  if(liveOpen&&dialog.open&&oldFocus){const target=focusTarget(oldFocus);(target&&!target.disabled?target:dialog.querySelector('[data-action="close"]'))?.focus({preventScroll:true});}
 }
 function finalizeClose(){
  if(!liveOpen)return;
  liveOpen=false;session++;retry=null;uncertain=false;
  const target=previousFocus;previousFocus=null;if(target?.isConnected)target.focus?.({preventScroll:true});
 }
 function hide(){
  if(destroyed||!liveOpen)return;
  if(dialog.open&&typeof dialog.close==='function')dialog.close();else dialog.removeAttribute('open');
  finalizeClose();
 }
 function open(options={}){
  if(destroyed)return;
  if(liveOpen&&dialog.open){refresh();return;}
  const state=read();openingProfile=state.profileId;stale=false;retry=null;uncertain=false;status='';statusKind='';session++;
  selected=(typeof options==='string'?options:options.characterId)||state.selection?.characterId||'';
  previousFocus=document.activeElement;liveOpen=true;
  // Native showModal supplies the top layer, inert background and focus trap.
  // The attribute fallback is only for platforms without HTMLDialogElement.
  if(typeof dialog.showModal==='function')dialog.showModal();else dialog.setAttribute('open','');
  refresh(state);dialog.scrollTop=0;dialog.querySelector('[data-action="close"]')?.focus({preventScroll:true});
 }
 async function mutate(action,skill,requested){
  const characterId=requested?.characterId||selected,state=read();checkProfile(state);
  const stats=ranks(state,characterId),remaining=allowance(state.xp)-stats.spent;
  if(blocked(state,stats,characterId)||characterId!==selected||requested&&requested.profileId!==openingProfile||action==='allocate'&&(!SKILLS.includes(skill)||remaining<=0||stats.skills[skill]>=MAX_RANK)||action==='reset'&&!stats.spent){refresh(state);return;}
  const context={action,characterId,...(action==='allocate'?{skill}:{}),profileId:openingProfile},operation={context,session};
  pending=operation;retry=null;status=action==='reset'?'正在重置配點…':'正在套用配點…';statusKind='pending';refresh(state);
  let result;
  try{result=await (action==='reset'?controller.reset(characterId):controller.allocate(characterId,skill));}
  catch{result=null;}
  if(pending===operation)pending=null;
  const current=read();checkProfile(current);
  if(result?.accepted===true){
   if(result.persisted===true)unpersistedProfiles.delete(context.profileId);
   else unpersistedProfiles.set(context.profileId,false);
  }
  const sameView=!destroyed&&liveOpen&&operation.session===session&&current.profileId===context.profileId&&!stale;
  if(sameView){
   if(result?.accepted===true){
    const change=action==='reset'?'配點已全部退回':`${LABELS[skill]} +1`;
    status=result.persisted===true?`${name(characterId)}：${change}，已保存。`:`${name(characterId)}：${change}，尚未保存。請使用原頁面的重試保存／匯出備份，勿重送同一次配點。`;
    statusKind=result.persisted===true?'saved':'unsaved';
   }else if(result?.accepted===false){
    retry=context;status=`本次變更未套用。${reasonText(result.reason)}可確認目前點數後重試。`;statusKind='error';
   }else{
    uncertain=true;status='無法確認本次變更是否套用。請先重新讀取進度，確認點數後再操作；不會自動重送。';statusKind='error';
   }
  }
  // A host callback failing cannot retroactively change an accepted mutation.
  if(result?.accepted===true){try{onChange(result,context);}catch{}}
  if(!destroyed)refresh();
 }
 function click(event){
  const button=event.target.closest?.('button');if(!button||!dialog.contains(button))return;
  if(button.dataset.action==='close'){hide();return;}
  if(button.disabled)return;
  if(button.dataset.skill){void mutate('allocate',button.dataset.skill);return;}
  if(button.dataset.action==='reset'){void mutate('reset');return;}
  if(button.dataset.action==='retry'&&retry){void mutate(retry.action,retry.skill,retry);return;}
  if(button.dataset.action==='reload'){uncertain=false;retry=null;status='已重新讀取目前進度，請確認點數。';statusKind='';refresh();}
 }
 function change(event){
  if(!event.target.matches?.('[data-character]'))return;
  const state=read();checkProfile(state);
  if(pending||state.busy||stale||!usable(state).includes(event.target.value)){refresh(state);return;}
  selected=event.target.value;retry=null;status='';statusKind='';refresh(state);
 }
 const stop=event=>event.stopPropagation();
 const isolatedEvents=['keydown','keyup','keypress','pointerdown','pointerup','touchstart','touchend','click'];
 dialog.addEventListener('click',click);dialog.addEventListener('change',change);
 for(const type of isolatedEvents)dialog.addEventListener(type,stop);
 const cancel=event=>{event.preventDefault();hide();};
 const close=()=>{if(!dialog.open)finalizeClose();};
 dialog.addEventListener('cancel',cancel);dialog.addEventListener('close',close);
 return {open,hide,refresh:()=>refresh(),element:dialog,destroy(){
  if(destroyed)return;hide();destroyed=true;session++;
  dialog.removeEventListener('click',click);dialog.removeEventListener('change',change);dialog.removeEventListener('cancel',cancel);dialog.removeEventListener('close',close);
  for(const type of isolatedEvents)dialog.removeEventListener(type,stop);dialog.remove();
 }};
}
