import {mountChallengePreparation,downloadChallengeBackup} from './challenge-preparation.mjs?v=chapter-presentation-20261117-r1';
import {characterAbilityMarkup} from './challenge-ability-view.mjs?v=campaign-boot-20261112-r3';
import {saveIssueText} from './save-copy.mjs?v=chapter-presentation-20261117-r1';
import {mountChallengeDialogViewport} from './challenge-dialog-viewport.mjs?v=chapter-presentation-20261117-r1';
import {SKILLS,SKILL_LABELS,MAX_RANK,XP_PER_LEVEL} from './challenge-progress.mjs?v=chapter-presentation-20261117-r1';
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export const CHECKPOINT_LABELS=Object.freeze(['巷口','擴音隊長','市場','封街總管','造勢','咆哮哥','首章完成']);
const effects={hp:'氣勢上限 +3%',move:'移動速度 +1%',basic:'普攻傷害 +2%',defense:'承受傷害 −1.5%',special:'絕招傷害 +2%',rally:'揪團傷害 +2%',assist:'助拳傷害 +2%'};
export function radarMarkup(ranks){
 const point=(i,r)=>{const a=-Math.PI/2+i*2*Math.PI/7;return`${120+Math.cos(a)*r},${116+Math.sin(a)*r}`;};
 const polygon=r=>SKILLS.map((_,i)=>point(i,r)).join(' ');
 return `<svg class="challenge-radar" viewBox="0 0 240 240" role="img" aria-label="七項已分配技能雷達圖；各項最多五點"><title>各能力投入點數，外圈為五點</title>${[16,32,48,64,80].map(r=>`<polygon points="${polygon(r)}" class="radar-grid"/>`).join('')}${SKILLS.map((_,i)=>`<line x1="120" y1="116" x2="${point(i,80).replace(',','" y2="')}" class="radar-grid"/>`).join('')}<polygon class="radar-value" points="${SKILLS.map((k,i)=>point(i,8+72*(ranks[k]||0)/5)).join(' ')}"/>${SKILLS.map((k,i)=>{const [x,y]=point(i,101).split(',');return`<text x="${x}" y="${y}" text-anchor="middle" dominant-baseline="middle">${SKILL_LABELS[k].slice(0,2)}</text>`;}).join('')}</svg>`;
}
function routeMarkup(state){
 return `<div class="challenge-route" aria-label="第一章路線進度，未到達的地點與對手暫不揭露">${[['巷口','擴音隊長'],['市場','封街總管'],['造勢','咆哮哥']].map((pair,i)=>{
  const reached=state.completed||state.checkpoint>=i*2,bossReached=state.completed||state.checkpoint>=i*2+1,cleared=state.completed||state.checkpoint>i*2+1;
  return `<div class="challenge-stage-card ${cleared?'is-cleared':reached?'is-current':'is-locked'}"><small>第 ${i+1} 站${i===2&&reached?' · 決戰':''}</small><strong>${reached?pair[0]:'未探索'}</strong><span class="challenge-stage-link" aria-hidden="true">↓</span><strong>${bossReached?pair[1]:'未知對手'}</strong><span class="challenge-stage-kind">${bossReached?(i===2?'章末 Boss':'小頭目'):'尚未揭曉'}</span></div>`;
 }).join('')}</div>`;
}
// All positions are logical CSS pixels inside the transformed dialog. Native
// screen rectangles swap axes after rotation and must not drive this chooser.
export function challengePickerFrame({left,top,width,height,panelWidth,panelHeight,optionCount=1}){
 const gutter=Math.min(10,Math.max(0,(Math.min(panelWidth,panelHeight)-1)/2)),gap=6;
 const menuWidth=Math.max(1,Math.min(Math.max(220,width),panelWidth-2*gutter));
 const wanted=Math.min(270,Math.max(1,optionCount)*61+11);
 const below=Math.max(0,panelHeight-gutter-(top+height+gap)),above=Math.max(0,top-gap-gutter);
 const placement=below>=wanted||below>=above?'below':'above';
 const maxHeight=Math.max(1,Math.min(wanted,placement==='below'?below:above,panelHeight-2*gutter));
 return{left:Math.max(gutter,Math.min(left,panelWidth-gutter-menuWidth)),top:Math.max(gutter,Math.min(placement==='below'?top+height+gap:top-gap-maxHeight,panelHeight-gutter-maxHeight)),width:menuWidth,maxHeight,placement};
}
export function mountChallengeUI({progress,controller=null,characters={},onStart=()=>{},onContinue=null,onReview=null,onPrepare=null,onClose=()=>{},onChange=()=>{},parent=document.body,chapterTitle='第一章・街頭試煉'}={}){
 if(controller)return mountFreshChallengeUI({progress,controller,characters,onStart,onContinue,onReview,onPrepare,onClose,onChange,parent,chapterTitle});
 const dialog=document.createElement('dialog');dialog.className='challenge-dialog';dialog.setAttribute('aria-label','挑戰模式與角色成長');parent.appendChild(dialog);
 let openingParty={characterId:'wang',helperId:'han'},selected='wang',helper='han',view='chapter',status='',previousFocus=null,openPicker=null,busy=false;
 const viewport=mountChallengeDialogViewport(dialog,{maxWidth:900,onFrame:()=>{if(openPicker)positionPicker(openPicker);}});
 const names=id=>characters[id]?.name||id;
 const available=()=>Object.keys(characters).filter(id=>progress.canUse(id));
 function pickerMarkup(kind,label,value,ids){
  const menuId=`challenge-${view}-${kind}-options`;
  return `<div class="challenge-picker" data-picker="${kind}"><span id="${menuId}-label">${label}</span><button type="button" class="challenge-pick-trigger" data-pick="${kind}" aria-haspopup="listbox" aria-expanded="false" aria-controls="${menuId}" aria-label="${label}：${esc(names(value))}"><span>${esc(names(value))}</span><span aria-hidden="true">▾</span></button><div id="${menuId}" class="challenge-pick-menu" data-pick-menu="${kind}" role="listbox" aria-labelledby="${menuId}-label" hidden>${ids.map(id=>`<button type="button" role="option" class="challenge-pick-option" data-pick-option="${kind}" data-value="${esc(id)}" aria-selected="${id===value}" tabindex="-1">${characters[id]?.portrait?`<img src="${esc(characters[id].portrait)}" alt=""/>`:''}<span>${esc(names(id))}</span><b aria-hidden="true">${id===value?'✓':''}</b></button>`).join('')}</div></div>`;
 }
 function closePicker(focus=false){
  if(!openPicker)return false;const kind=openPicker;openPicker=null;
  const trigger=dialog.querySelector(`[data-pick="${kind}"]`),menu=dialog.querySelector(`[data-pick-menu="${kind}"]`);
  if(menu)menu.hidden=true;trigger?.setAttribute('aria-expanded','false');if(focus)trigger?.focus({preventScroll:true});return true;
 }
 function positionPicker(kind){
  const trigger=dialog.querySelector(`[data-pick="${kind}"]`),menu=dialog.querySelector(`[data-pick-menu="${kind}"]`);
  if(!trigger||!menu||!dialog.clientWidth||!dialog.clientHeight)return;
  let left=0,top=0;
  for(let node=trigger;node&&node!==dialog;node=node.offsetParent){left+=node.offsetLeft||0;top+=node.offsetTop||0;const parent=node.offsetParent;if(parent&&parent!==dialog){left+=parent.clientLeft||0;top+=parent.clientTop||0;}}
  const frame=challengePickerFrame({left:left-(dialog.scrollLeft||0),top:top-dialog.scrollTop,width:trigger.offsetWidth,height:trigger.offsetHeight,panelWidth:dialog.clientWidth,panelHeight:dialog.clientHeight,optionCount:menu.querySelectorAll('[data-pick-option]').length});
  // The transformed dialog is the fixed containing block and scrolls its
  // descendants. Fit in visible coordinates, then return to content offsets.
  Object.assign(menu.style,{left:(frame.left+(dialog.scrollLeft||0))+'px',top:(frame.top+dialog.scrollTop)+'px',width:frame.width+'px',maxHeight:frame.maxHeight+'px'});menu.dataset.placement=frame.placement;
 }
 function focusOption(option){
  if(!option)return;option.focus({preventScroll:true});
  const menu=dialog.querySelector(`[data-pick-menu="${option.dataset.pickOption}"]`);if(!menu)return;
  const top=option.offsetTop,bottom=top+option.offsetHeight;
  if(top<menu.scrollTop)menu.scrollTop=top;else if(bottom>menu.scrollTop+menu.clientHeight)menu.scrollTop=bottom-menu.clientHeight;
 }
 function showPicker(kind,last=false){
  closePicker();openPicker=kind;dialog.querySelector(`[data-pick="${kind}"]`)?.setAttribute('aria-expanded','true');
  const menu=dialog.querySelector(`[data-pick-menu="${kind}"]`);if(menu)menu.hidden=false;positionPicker(kind);
  const options=[...dialog.querySelectorAll(`[data-pick-option="${kind}"]`)];
  focusOption(last?options.at(-1):options.find(b=>b.getAttribute('aria-selected')==='true')||options[0]);
 }
 function choose(option){
  const kind=option.dataset.pickOption,id=option.dataset.value;if(!available().includes(id))return;
  const scroll=dialog.scrollTop;if(kind==='character')selected=id;else helper=id;closePicker();refresh();dialog.scrollTop=scroll;dialog.querySelector(`[data-pick="${kind}"]`)?.focus({preventScroll:true});
 }
 function bindPickers(){
  dialog.querySelectorAll('[data-pick]').forEach(trigger=>{
   const kind=trigger.dataset.pick;trigger.onclick=()=>openPicker===kind?closePicker(true):showPicker(kind);
   trigger.onkeydown=e=>{if(e.key==='ArrowDown'||e.key==='ArrowUp'){e.preventDefault();showPicker(kind,e.key==='ArrowUp');}else if(e.key==='Escape'&&closePicker(true)){e.preventDefault();e.stopPropagation();}};
  });
  dialog.querySelectorAll('[data-pick-option]').forEach(option=>{
   option.onclick=()=>choose(option);
   option.onkeydown=e=>{
    if(e.key==='Escape'){e.preventDefault();e.stopPropagation();closePicker(true);return;}
    if(e.key==='Tab'){closePicker(true);return;}
    if(e.key==='Enter'||e.key===' '){e.preventDefault();choose(option);return;}
    const options=[...dialog.querySelectorAll(`[data-pick-option="${option.dataset.pickOption}"]`)],index=options.indexOf(option);
    const next=e.key==='Home'?0:e.key==='End'?options.length-1:e.key==='ArrowDown'?(index+1)%options.length:e.key==='ArrowUp'?(index+options.length-1)%options.length:-1;
    if(next>=0){e.preventDefault();focusOption(options[next]);}
   };
  });
 }
 function hide(){closePicker();if(dialog.open&&dialog.close)dialog.close();else dialog.removeAttribute('open');onClose();previousFocus?.focus?.();}
 function refresh(){
  closePicker();
  const state=progress.get(),ids=available();if(!ids.includes(selected))selected=ids[0]||'wang';if(!ids.includes(helper))helper=ids.find(id=>id!==selected)||selected;
  const chapterId=state.campaign?.cursor?.chapterId,number=chapterId?.split('-')[1],later=!state.testMode&&!!onContinue&&(state.completed||chapterId&&chapterId!=='chapter-1'),locked=false;
  const currentTitle=later&&number?`第 ${number} 章・繼續追麥`:chapterTitle;
  const char=characters[selected]||{},stats=progress.derivedStats(selected),r=stats.skills,charXP=state.characters[selected]?.xp||0,remaining=Math.max(0,state.allowance-stats.spent);
  dialog.dataset.view=view;
  dialog.innerHTML=`<div class="challenge-tools"><button type="button" class="challenge-close" data-action="close" aria-label="關閉挑戰面板">✕</button></div><div class="challenge-paper"><header class="challenge-head"><div><small>挑戰檔案 / ${esc(state.profileId.replace('slot-','存檔 '))}</small><h2>${view==='chapter'?'上街闖關！':view==='save'?'存檔備份':'角色研究所'}</h2></div></header>
   <nav class="challenge-tabs" aria-label="挑戰頁籤"><button type="button" data-view="chapter" aria-pressed="${view==='chapter'}">章節進度</button><button type="button" data-view="character" aria-pressed="${view==='character'}">角色・技能樹</button><button type="button" data-view="save" aria-pressed="${view==='save'}">存檔備份</button></nav>
   ${state.testMode?'<p class="challenge-warning">測試模式：可試玩所有角色，但不寫入經驗、技能、解鎖或存檔。</p>':''}
   ${state.storageIssue?'<p class="challenge-warning">瀏覽器儲存無法使用或資料版本不符；請先匯出備份。未持久保存的進度可能於關閉後消失。</p>':''}
   <div class="challenge-shared"><strong>全員共用額度 ${state.allowance} 點 / 每位角色</strong><span>隊伍成長 Lv.${state.level} · ${state.xp} XP ${state.nextLevelXP===null?'· 已達本版上限':`· 再 ${state.nextLevelXP} XP +1 點`}</span></div>
   ${view==='chapter'?`<section class="challenge-chapter"><div class="challenge-chapter-heading"><h3>${esc(currentTitle)}</h3><span class="challenge-stamp">${state.completed?'首章制霸':'現在開打'}</span></div>${later?'':routeMarkup(state)}<p class="challenge-checkpoint"><strong>${locked?'第五章尚未開放，已保存檢查點':later?'依這一槽已保存的章節與檢查點繼續':state.completed?'第一章完成，可從巷口重訪':`接續地點：${CHECKPOINT_LABELS[Math.min(6,Math.max(0,state.checkpoint))]}`}</strong></p><p class="challenge-rules">倒下保留永久經驗與解鎖；調整出戰配置會先確認套用範圍。</p>${onPrepare?'':`<div class="challenge-picks">${pickerMarkup('character','主戰',selected,ids)}${pickerMarkup('helper','助拳',helper,ids)}</div>`}<div class="challenge-launch-actions"><button type="button" class="challenge-start" data-action="start" ${locked||busy||state.dirty||state.readOnly?'disabled':''}>${locked?'第五章尚未開放':later?`繼續第 ${number&&number!=='1'?number:2} 章`:state.completed?'重訪第一章':state.checkpoint?'接續挑戰':'開始挑戰'} →</button>${later?`<button type="button" class="challenge-continue" data-action="replay-first" ${busy||state.dirty||state.readOnly?'disabled':''}>重訪第一章 →</button>`:''}${onContinue&&state.testMode?'<button type="button" data-action="preview-later">測試後續章節（不存進度） →</button>':''}</div>${onReview&&['wang','han'].includes(selected)?'<button type="button" class="challenge-review-opening" data-action="review-opening">回顧開場漫畫</button>':''}<p class="challenge-fine challenge-replay-note">重試或重訪可再打小怪賺經驗；通關獎勵只領一次。後續章節可沿用此槽的選角與進度。</p></section>`:''}
   ${view==='character'?`<section class="challenge-character">${pickerMarkup('character',onPrepare?'檢視角色':'選擇角色',selected,ids)}<div class="challenge-bio">${char.portrait?`<img src="${esc(char.portrait)}" alt="${esc(names(selected))}"/>`:''}<div><span class="challenge-tag">${esc(char.tag||'街頭選手')}</span><h3>${esc(names(selected))}</h3><p>${esc(char.roast||'登場戰鬥，一步一步練出自己的風格。')}</p><p>${esc(char.tip||'')}</p><strong>角色 Lv.${1+Math.floor(charXP/XP_PER_LEVEL)} · ${charXP} XP</strong><p class="challenge-fine">角色經驗記錄出戰歷程；可用技能點由全隊進度決定，每個角色額度一致。</p></div></div>
   <div class="challenge-build"><div class="challenge-chart">${radarMarkup(r)}<p>雷達顯示七項技能投入，外圈 5 點</p><dl class="challenge-stats"><div><dt>氣勢上限</dt><dd>${stats.maxHp.toFixed(0)}</dd></div><div><dt>移動</dt><dd>×${stats.moveMultiplier.toFixed(2)}</dd></div><div><dt>普攻 / 絕招</dt><dd>×${stats.basicMultiplier.toFixed(2)} / ×${stats.specialMultiplier.toFixed(2)}</dd></div><div><dt>承傷</dt><dd>×${stats.damageTakenMultiplier.toFixed(3)}</dd></div><div><dt>揪團 / 助拳傷害</dt><dd>×${stats.rallyMultiplier.toFixed(2)} / ×${stats.assistMultiplier.toFixed(2)}</dd></div></dl></div><div class="challenge-tree"><h4>自由技能樹 <span>剩餘 ${remaining} 點</span></h4><p class="challenge-fine">七條獨立分支，無前置限制。每點小幅成長，只作用於挑戰。</p><div class="challenge-tree-root"><span aria-hidden="true">★</span> ${esc(names(selected))} · 自由養成</div><div class="challenge-branches">${SKILLS.map(k=>`<button type="button" class="challenge-node ${r[k]?'has-ranks':''}" data-skill="${k}" ${state.testMode||remaining===0||r[k]>=MAX_RANK?'disabled':''}><span><strong>${SKILL_LABELS[k]}</strong><small>每點 ${effects[k]}</small></span><span class="challenge-ranks" aria-label="已投入 ${r[k]}，上限 5">${Array.from({length:5},(_,i)=>`<i class="${i<r[k]?'filled':''}"></i>`).join('')}</span><b>${r[k]}/5 ＋</b></button>`).join('')}</div><button type="button" data-action="reset" ${state.testMode||!stats.spent?'disabled':''}>免費重置此角色配點</button><p class="challenge-fine">其他角色配點與章節進度不受影響。</p></div></div><section class="challenge-moves"><h4>現有招牌招式</h4>${(char.moves||[]).map(m=>`<p><strong>${esc(m.name)}</strong> · ${esc(m.purpose||m.hint)}</p>`).join('')}<p class="challenge-fine">招式為虛構諷刺；未開放的後續技能不列入已完成內容。</p></section></section>`:''}
   ${view==='character'&&onPrepare?'<button type="button" data-action="prepare">調整出戰準備</button><p>檢視角色不會換人；主角、助拳、配點與難度會一起確認後保存。</p>':''}
   ${view==='save'?`<section class="challenge-save"><div class="challenge-save-intro"><h3>把三個冒險帶著走</h3><p>匯出包含三格進度、各槽採用來源與原始存檔備份，不包含音量等裝置設定。</p></div><div class="challenge-save-actions"><section class="challenge-save-card"><h4>先保存一份</h4><p>保留現在的三格冒險，換裝置時再帶回來。</p><button type="button" data-action="export">下載 JSON 備份</button></section><section class="challenge-save-card"><h4>載入既有備份</h4><label class="challenge-import">匯入 JSON 備份<input type="file" accept="application/json,.json" data-import ${state.testMode?'disabled':''}></label></section></div><p class="challenge-save-caution">匯入前會另存可恢復備份。支援舊版與新版存檔；衝突須明確選用備份的整槽，不能混合進度。</p><p class="challenge-fine">此為本機可攜存檔，並非雲端同步或排名認證。</p></section>`:''}
   <p class="challenge-status" role="status" aria-live="polite">${esc(status)}</p></div>`;
  dialog.querySelector('[data-action="close"]').onclick=hide;
  dialog.querySelectorAll('[data-view]').forEach(b=>b.onclick=()=>{view=b.dataset.view;status='';refresh();dialog.scrollTop=0;dialog.querySelector(`[data-view="${view}"]`)?.focus({preventScroll:true});});
  if(onPrepare&&view==='character'){const section=dialog.querySelector('.challenge-character');if(section)section.innerHTML=pickerMarkup('character','檢視角色',selected,ids)+characterAbilityMarkup({id:selected,character:char,savedSkills:r,allowance:state.allowance,readOnly:true});}
  bindPickers();
  async function mutate(action,message,focus){
   if(busy)return;const scroll=dialog.scrollTop;busy=true;status='儲存中，請稍候。';refresh();
   try{const result=await action();const saved=result===true||(result?.accepted&&result?.persisted);status=saved?message:saveIssueText(result?.reason);if(saved)onChange();}
   catch{status='尚未保存，請保留此頁並重試。';}
   finally{busy=false;refresh();dialog.scrollTop=scroll;if(focus)dialog.querySelector(focus)?.focus({preventScroll:true});}
  }
  dialog.querySelectorAll('[data-skill]').forEach(b=>b.onclick=()=>{if(onPrepare)return;const id=selected,skill=b.dataset.skill;return mutate(()=>progress.allocate(id,skill),`${names(id)}：${SKILL_LABELS[skill]} +1`,`[data-skill="${skill}"]`);});
  const prepare=dialog.querySelector('[data-action="prepare"]');if(prepare&&later)prepare.textContent='接續目前章節後調整';if(prepare)prepare.onclick=()=>{hide();onPrepare?.({characterId:selected,intent:'save-only'});};
  const reset=dialog.querySelector('[data-action="reset"]');if(reset)reset.onclick=()=>{if(onPrepare)return;const id=selected;return mutate(()=>progress.reset(id),'此角色配點已全部退回，可重新分配。');};
  if(busy||state.busy)dialog.querySelectorAll('button:not(.challenge-close),input').forEach(b=>b.disabled=true);
  if(state.dirty||state.readOnly||state.testMode)dialog.querySelectorAll('[data-skill],[data-action="reset"],[data-import]').forEach(b=>b.disabled=true);
  async function continueSaved(){if(busy)return;busy=true;status='正在確認此槽進度…';refresh();try{const result=await onContinue(onPrepare?openingParty:{characterId:selected,helperId:helper});if(result?.reason!=='cancelled')status=result?.accepted?'':result?.message||'尚未接續：'+saveIssueText(result?.reason);else status='已取消，原資料不變。';}catch{status='無法確認保存狀態，請保留此頁。';}finally{busy=false;onChange();refresh();}}
  const start=dialog.querySelector('[data-action="start"]');if(start)start.onclick=()=>{if(busy||state.dirty||state.readOnly||locked)return;if(later&&!state.testMode)return continueSaved();hide();onStart({...onPrepare?openingParty:{characterId:selected,helperId:helper},replay:state.completed});};
  const replay=dialog.querySelector('[data-action="replay-first"]');if(replay)replay.onclick=()=>{if(busy||state.dirty||state.readOnly)return;hide();onStart({...onPrepare?openingParty:{characterId:selected,helperId:helper},replay:true});};
  const preview=dialog.querySelector('[data-action="preview-later"]');if(preview)preview.onclick=continueSaved;
  const review=dialog.querySelector('[data-action="review-opening"]');if(review)review.onclick=()=>{hide();onReview?.({characterId:selected});};
  const download=text=>{const url=URL.createObjectURL(new Blob([text],{type:'application/json'})),a=document.createElement('a');a.href=url;a.download='taiwan-punchline-save-v3.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);};
  const exp=dialog.querySelector('[data-action="export"]');if(exp)exp.onclick=async()=>{if(busy)return;busy=true;try{download(await progress.exportJSON());status='備份下載已送出，請確認檔案已保存。';}catch{status='無法匯出備份，未變更存檔。';}finally{busy=false;refresh();}};
  const imp=dialog.querySelector('[data-import]');if(imp)imp.onchange=async()=>{
   if(busy)return;const file=imp.files?.[0];if(!file)return;
   if(file.size>4000000){status='檔案過大，原存檔未變更。';refresh();return;}
   busy=true;status='正在檢查備份版本…';refresh();
   try{
    const text=await file.text();let data;try{data=JSON.parse(text);}catch{throw Error('無法讀取備份格式，原存檔未變更。');}
    const old=data.version===1,campaign=data.version===2;if(((old||campaign)&&file.size>250000)||(!old&&!campaign&&data.version!==3))throw Error('版本或大小不支援，原存檔未變更。');
    if(!window.confirm((old||campaign)?'匯入'+(campaign?'後續章節':'舊版')+'三格存檔？會先備份目前資料，再把備份的三格完整採用為新版共用進度，不與現有進度合併。原始舊檔與裝置設定保留。':'匯入新版備份並取代三格共用進度？會先建立可恢復備份。原始舊檔與裝置設定保留。')){status='已取消，原資料不變。';return;}
    let result=await progress.importJSON(text,{adoptLegacySlots:old,adoptCampaignSlots:campaign});
    if(result?.reason==='legacy-source-conflict'&&window.confirm('備份中的舊版槽與目前資料不同。要完整採用備份中的全部舊版槽嗎？不會合併兩份進度；目前資料會先備份。'))result=await progress.importJSON(text,{adoptLegacySlots:true});
    const saved=result?.accepted&&result?.persisted;status=saved?'已匯入並保存三格共用進度。':'尚未匯入保存：'+saveIssueText(result?.reason||result?.error);if(saved)onChange();
   }catch(error){status=error.message||'無法讀取檔案，原存檔未變更。';}finally{busy=false;refresh();}
  };
  if(view==='save'&&progress.retrySave&&(state.dirty||state.storageIssue)){
   const retry=document.createElement('button');retry.type='button';retry.textContent=state.dirty?'重試保存未存進度':'重新讀取存檔狀態';retry.disabled=busy;retry.onclick=()=>mutate(()=>state.dirty?progress.retrySave():progress.refresh(),'存檔狀態已更新。');dialog.querySelector('.challenge-save')?.append(retry);
  }

 }
 dialog.addEventListener('scroll',()=>{if(openPicker)positionPicker(openPicker);});
 dialog.addEventListener('click',e=>{if(openPicker&&!e.target.closest?.('[data-picker]'))closePicker();});
 dialog.addEventListener('cancel',e=>{e.preventDefault();if(!closePicker(true))hide();});
 function open(options={}){if(typeof options==='string')selected=options;else{if(options.characterId)selected=options.characterId;if(options.helperId)helper=options.helperId;if(options.view)view=options.view;}if(!dialog.open){previousFocus=document.activeElement;openingParty={characterId:selected,helperId:helper};}status='';refresh();viewport.sync();if(!dialog.open){if(dialog.showModal)dialog.showModal();else dialog.setAttribute('open','');}dialog.querySelector('[data-action="close"]')?.focus();}
 return{open,show:open,hide,refresh,element:dialog,destroy(){viewport.destroy();dialog.remove();}};
}

/** V4 overview: one storage controller, one shared editable preparation page.
 * Legacy progress is optional and display-only here. The runtime controls actual
 * encounter launch via onStart/onContinue; overview never creates an encounter.
 */
const REPLAY_CHAPTERS=Object.freeze([
 {id:'chapter-1',label:'第一章 · 議場前哨'},
 {id:'chapter-2',label:'第二章 · 街口開講'},
 {id:'chapter-3',label:'第三章 · 巷戰接力'},
 {id:'chapter-4',label:'第四章 · 護車推進'},
 {id:'chapter-5',label:'第五章 · 終局清點'},
 {id:'finale-3v4',label:'最終戰 · 七人開講'}
]);

function mountFreshChallengeUI({controller,characters,onStart,onContinue,onReview,onPrepare,onClose,onChange,parent,chapterTitle}){
 const document=parent.ownerDocument,window=document.defaultView,dialog=document.createElement('dialog');dialog.className='challenge-dialog challenge-overview-v4';dialog.setAttribute('aria-label','挑戰總覽與單槽存檔管理');parent.append(dialog);
 const viewport=mountChallengeDialogViewport(dialog,{document,maxWidth:940,onFrame:()=>{syncPreparationGeometry();if(replayMenuOpen)positionReplayMenu();}});let view='chapter',inspect=null,status='',busy=false,previousFocus=null,pending=null,preparation=null,disposed=false,replayChoice='chapter-1',replayMenuOpen=false;
 function syncPreparationGeometry(){const page=dialog.querySelector('[data-embedded="true"]');if(page)for(const key of ['layout','compact','rotation','viewportReady','viewportEpoch'])page.dataset[key]=dialog.dataset[key]||'';}
 const q=s=>dialog.querySelector(s),name=id=>characters[id]?.name||id;
 const state=()=>controller.get(),slotId=()=>state().activeProfileId||state().profileId,slotNumber=id=>String(id||'').replace('slot-','');
 const guard=()=>{const s=state();return{expectedRevision:s.revision,expectedGeneration:s.generations?.[slotId()]??s.generation};};
 const blocked=s=>!s.testMode&&!!(s.busy||s.dirty||s.readOnly||s.storageIssue);
 function read(){const s=state(),id=s.activeProfileId||s.profileId;return{s,id,p:(s.testMode?controller.previewProfile?.():null)||controller.readProfile(id)};}
 function savedState(s){if(s.testMode)return busy?'正在套用測試配置…':'測試模式，不保存／不記錄進度。正式存檔不變。';return busy||s.busy?'保存中，請稍候。':s.dirty?'需處理：尚有未保存進度，請重試保存或先匯出。':s.readOnly||s.storageIssue?'需處理：無法安全寫入，請匯出完整復原備份。':s.initialized===false?'新存檔，尚未寫入；第一次確認配置或開始時會正式保存。':'已保存。';}
 function closeReplayMenu(focus=false){
  if(!replayMenuOpen)return false;replayMenuOpen=false;
  const trigger=q('[data-replay-trigger]'),menu=q('[data-replay-menu]');
  if(menu)menu.hidden=true;trigger?.setAttribute('aria-expanded','false');
  if(focus)trigger?.focus({preventScroll:true});return true;
 }
 function positionReplayMenu(){
  const trigger=q('[data-replay-trigger]'),menu=q('[data-replay-menu]');
  if(!trigger||!menu||!dialog.clientWidth||!dialog.clientHeight)return;
  let left=0,top=0;
  for(let node=trigger;node&&node!==dialog;node=node.offsetParent){left+=node.offsetLeft||0;top+=node.offsetTop||0;const p=node.offsetParent;if(p&&p!==dialog){left+=p.clientLeft||0;top+=p.clientTop||0;}}
  const frame=challengePickerFrame({left:left-(dialog.scrollLeft||0),top:top-dialog.scrollTop,width:trigger.offsetWidth,height:trigger.offsetHeight,panelWidth:dialog.clientWidth,panelHeight:dialog.clientHeight,optionCount:menu.querySelectorAll('[data-replay-option]').length});
  Object.assign(menu.style,{left:(frame.left+(dialog.scrollLeft||0))+'px',top:(frame.top+dialog.scrollTop)+'px',width:frame.width+'px',maxHeight:frame.maxHeight+'px'});menu.dataset.placement=frame.placement;
 }
 function focusReplayOption(option){
  if(!option)return;option.focus({preventScroll:true});
  const menu=q('[data-replay-menu]');if(!menu)return;
  const top=option.offsetTop,bottom=top+option.offsetHeight;
  if(top<menu.scrollTop)menu.scrollTop=top;else if(bottom>menu.scrollTop+menu.clientHeight)menu.scrollTop=bottom-menu.clientHeight;
 }
 function openReplayMenu(last=false){
  replayMenuOpen=true;q('[data-replay-trigger]')?.setAttribute('aria-expanded','true');
  const menu=q('[data-replay-menu]');if(menu)menu.hidden=false;positionReplayMenu();
  const options=[...dialog.querySelectorAll('[data-replay-option]')];
  focusReplayOption(last?options.at(-1):options.find(b=>b.getAttribute('aria-selected')==='true')||options[0]);
 }
 function hide({notify=true}={}){if(busy||preparation?.busy)return false;closeReplayMenu();preparation?.hide({notify:false});if(view==='preparation')view='chapter';if(dialog.open&&dialog.close)dialog.close();else dialog.removeAttribute('open');pending=null;previousFocus?.focus?.({preventScroll:true});if(notify)onClose();return true;}
 function openPreparation(characterId=inspect){
  if(busy||preparation?.busy||blocked(state()))return false;
  closeReplayMenu();
  const id=characterId||controller.preparationSnapshot().characterId;
  if(preparation?.isOpen){if(characterId&&characterId!==inspect){preparation.hide({notify:false});}else return true;}
  inspect=id;view='preparation';pending=null;status='';
  if(!dialog.open){previousFocus=document.activeElement;}
  refresh();viewport.sync();if(!dialog.open){if(dialog.showModal)dialog.showModal();else dialog.setAttribute('open','');}
  preparation??=mountChallengePreparation({document,window,parent:q('.challenge-shell-body'),embedded:true,controller,characters,
   onBusy:value=>{for(const b of dialog.querySelectorAll('.challenge-shell-header button'))b.disabled=value;dialog.setAttribute('aria-busy',String(value));},
   onClose:()=>{view='chapter';refresh();q('[data-action="prepare"]')?.focus({preventScroll:true});},onApplied:()=>{onChange();}});
  q('.challenge-shell-body').append(preparation.element);syncPreparationGeometry();return preparation.open({characterId:id,intent:'save-only'});
 }
 async function transaction(action,success){if(busy||state().testMode)return;busy=true;status='保存中，正在確認寫入與讀回…';refresh();try{const result=await action();if(result?.accepted&&result?.persisted){status=success;pending=null;onChange();}else status='尚未完成，原場景不變。'+saveIssueText(result?.reason);return result;}catch{status='尚未完成，無法確認保存結果。請保留此頁並匯出備份。';}finally{busy=false;if(!disposed)refresh();}}
 function exportFile(full=false){if(busy)return;try{const id=slotId(),text=full?controller.exportBackup():controller.exportSlotBackup(id);if(text==null){status='無法取得可用的單槽備份，請下載完整復原備份。';refresh();return;}downloadChallengeBackup(document,window,text,full?'punchline-v4-recovery-all-slots.json':`punchline-v4-${id}-backup.json`);status='備份下載已送出，請確認檔案已保存。';}catch{status='無法匯出備份，原存檔未變更。';}refresh();}
 const labels={entry:'開場準備','route-a':'第一段街道','miniboss-a':'第一場小頭目','route-b':'第二段街道','miniboss-b':'第二場小頭目','route-c':'章末街道',boss:'章末頭目','handoff-comic':'通關漫畫','roster-choice':'新角色整備','team-select':'最終戰組隊',battle:'最終混戰',ending:'結局漫畫',complete:'主線完成／重看結局'};
 function refresh(){if(disposed)return;closeReplayMenu();const scroll=q('.challenge-shell-body')?.scrollTop||0,preparationPage=preparation?.element,{s,id,p}=read(),c=p.campaign,selection=c.selection,chapter=c.cursor?.chapterId||'chapter-1',step=c.cursor?.stepId||'entry',unopened=false,finale=chapter==='finale-3v4',number=chapter.split('-')[1],locked=busy||preparation?.busy||blocked(s),slotLocked=locked||s.testMode;if(s.testMode)pending=null;inspect=p.unlockedCharacters?.includes(inspect)?inspect:selection.characterId;dialog.dataset.view=view;dialog.setAttribute('aria-busy',String(busy));
  const replayOptions=REPLAY_CHAPTERS.filter(item=>item.id==='finale-3v4'?c.finale?.status==='completed':c.chapterClears?.includes(item.id));
  if(replayOptions.length&&!replayOptions.some(item=>item.id===replayChoice))replayChoice=replayOptions[0].id;
  const selectedReplay=replayOptions.find(item=>item.id===replayChoice)??replayOptions[0]??null;
  const replayMarkup=selectedReplay?`<div class="challenge-replay-row"><div class="challenge-picker challenge-replay-picker" data-replay-picker><span id="challenge-replay-label">重玩已通關關卡</span><button type="button" class="challenge-pick-trigger" data-replay-trigger aria-haspopup="listbox" aria-expanded="false" aria-controls="challenge-replay-menu" aria-labelledby="challenge-replay-label" ${locked?'disabled':''}><span>${esc(selectedReplay.label)}</span><span aria-hidden="true">▾</span></button><div id="challenge-replay-menu" class="challenge-pick-menu" data-replay-menu role="listbox" aria-labelledby="challenge-replay-label" hidden>${replayOptions.map(item=>`<button type="button" role="option" class="challenge-pick-option" data-replay-option="${esc(item.id)}" aria-selected="${item.id===selectedReplay.id}" tabindex="-1"><span>${esc(item.label)}</span><b aria-hidden="true">${item.id===selectedReplay.id?'✓':''}</b></button>`).join('')}</div></div><button type="button" class="challenge-replay-launch" data-action="replay-selected" ${locked?'disabled':''}>重玩所選關卡 →</button></div>`:'';
  const confirmation=pending?`<section class="challenge-slot-confirm" data-slot-confirm role="region" aria-labelledby="slotConfirmTitle"><h4 id="slotConfirmTitle">${pending.kind==='reset'?'重新開始':'還原'}存檔 ${slotNumber(pending.id)}？</h4><p>${pending.kind==='reset'?'清除本槽的經驗、配點、解鎖、章節進度與已讀漫畫。重設為王／韓、一般難度、第一章全新開始。':`備份摘要：${pending.summary.persisted===false?'此備份包含尚未持久保存的進度。 ':''}${pending.summary.xp} XP · 第 ${esc(pending.summary.chapterId?.split('-')[1]||'?')} 章 · ${esc(labels[pending.summary.stepId]||pending.summary.stepId)} · 主角 ${esc(name(pending.summary.selection?.characterId))}／助拳 ${esc(name(pending.summary.selection?.helperId))}。將以這份備份完整替換同槽內容。`}</p><p>僅存檔 ${slotNumber(pending.id)} 會改變，其他兩槽與音量等裝置設定不變。寫入前會建立並讀回復原備份，失敗不會當作成功。</p><div><button type="button" data-action="cancel-slot-action" ${busy?'disabled':''}>取消，保留原檔</button><button type="button" data-action="confirm-slot-action" ${busy?'disabled':''}>${busy?'保存中…':pending.kind==='reset'?'確認重置本槽':'確認還原本槽'}</button></div></section>`:'';
  dialog.innerHTML=`<div class="challenge-tools"><button type="button" class="challenge-close" data-action="close" aria-label="關閉挑戰總覽" ${busy?'disabled':''}>✕</button></div><div class="challenge-paper"><header class="challenge-head"><div><small>拳民開講 / ${s.testMode?'測試預覽（正式存檔 '+slotNumber(id)+' 不變）':'存檔 '+slotNumber(id)}</small><h2>${view==='save'?'存檔管理':view==='preparation'?'出戰準備':'挑戰總覽'}</h2></div></header><nav class="challenge-tabs" aria-label="挑戰頁籤"><button type="button" data-view="chapter" aria-pressed="${view==='chapter'}">挑戰總覽</button><button type="button" data-action="prepare" data-view="preparation" aria-pressed="${view==='preparation'}" ${locked?'disabled':''}>出戰準備</button><button type="button" data-view="save" aria-pressed="${view==='save'}">存檔管理</button></nav>${s.testMode?'<p class="challenge-warning" data-preview-notice>測試模式，不保存／不記錄進度。不能切槽、重置或匯入正式資料；下載備份仍只包含正式存檔。</p>':''}<p class="challenge-save-state">${esc(savedState(s))}</p><div class="challenge-slot-tabs" aria-label="三個獨立存檔">${[1,2,3].map(n=>`<button type="button" data-slot="slot-${n}" aria-pressed="${id==='slot-'+n}" ${slotLocked?'disabled':''}>存檔 ${n}${id==='slot-'+n?' · 目前':''}</button>`).join('')}</div><div class="challenge-shared"><strong>每角獨立額度 ${Math.min(35,Math.floor((c.xp||0)/80))} 點</strong><span>隊伍 ${c.xp||0} XP · 技能加成只作用於挑戰</span></div>${view==='preparation'?'':view==='chapter'?`<section class="challenge-chapter"><div class="challenge-chapter-heading"><h3>${finale?(step==='complete'?'主線完成':'七人最終戰'):`第 ${esc(number||1)} 章`}</h3><span class="challenge-stamp">路段檢查點</span></div><p class="challenge-checkpoint">接續：${unopened?'第五章尚未開放':esc(labels[step]||step)}</p><p class="challenge-rules">${s.testMode?'此處是隔離測試配置。可試用全部角色，不寫入經驗、解鎖、章節或配點；離開測試模式即捨棄。':'接續路段起點，保留 XP。同一敵人重試不重領；首通獎與各章首次完整重玩 120 XP 各領一次。'}</p><div class="challenge-party-summary">${[['主角',selection.characterId],['助拳',selection.helperId]].map(([role,char])=>`<button type="button" data-inspect="${esc(char)}" ${locked?'disabled':''}>${characters[char]?.portrait?`<img src="${esc(characters[char].portrait)}" alt=""/>`:''}<span>${role} · ${esc(name(char))}<small>查看能力與配點</small></span></button>`).join('')}</div><p>難度：${c.difficulty==='hard'?'高手':c.difficulty==='beginner'?'新手':'一般'}</p><div class="challenge-launch-actions">${unopened?'<p class="challenge-warning">第五章未開放。可調整配置、重訪已完成章節或返回選單。</p>':`<button type="button" class="challenge-start" data-action="start" ${locked?'disabled':''}>${s.testMode?'開始測試':finale?(step==='complete'?'重看結局':step==='ending'?'繼續結局':'進入最終戰'):step==='entry'?'開始挑戰':'繼續挑戰'} →</button>`}${replayMarkup}</div>${onReview&&['wang','han'].includes(selection.characterId)?'<button type="button" data-action="review-opening">回顧開場漫畫</button>':''}</section>`:`<section class="challenge-save"><div class="challenge-save-intro"><h3>管理存檔 ${slotNumber(id)}</h3><p>下載與還原只作用於目前這一槽。其他兩槽與音量等設定不變。</p></div><div class="challenge-save-actions"><section class="challenge-save-card"><h4>先保存一份</h4><p>單槽備份只能還原到相同槽號。</p><button type="button" data-action="export-slot" ${busy?'disabled':''}>下載存檔 ${slotNumber(id)} 備份</button><button type="button" data-action="export-all" ${busy?'disabled':''}>下載完整復原備份</button><p class="challenge-fine">完整復原備份保留原始內容，不能當作單槽檔匯入。</p></section><section class="challenge-save-card"><h4>還原同槽備份</h4><label class="challenge-import">選擇單槽 JSON<input type="file" accept="application/json,.json" data-slot-import ${slotLocked?'disabled':''}></label><p>先顯示摘要並確認，再寫入。舊格式、全份備份或別槽檔案不會匯入。</p></section></div><section class="challenge-save-card"><h4>重新開始本槽</h4><p>清除經驗、配點、解鎖、章節與已讀漫畫；其他兩槽與設定不變。</p><button type="button" data-action="reset-slot" ${slotLocked?'disabled':''}>重新開始存檔 ${slotNumber(id)}</button></section>${confirmation}<p class="challenge-fine">本機存檔並非雲端同步。重置或還原後，其他已開啟分頁的舊草稿不能覆寫本槽。</p>${!s.testMode&&(s.dirty||s.storageIssue||s.readOnly)?`<button type="button" data-action="retry-save" ${busy?'disabled':''}>${s.dirty?'重試保存':'重新讀取存檔狀態'}</button>`:''}</section>`}<p class="challenge-status" role="status" aria-live="polite">${esc(status)}</p></div>`;
  // One fixed-size shell, one shared chrome, and one body scroller for every tab.
  const paper=q('.challenge-paper'),header=document.createElement('header'),body=document.createElement('div');header.className='challenge-shell-header';body.className='challenge-shell-body';
  header.append(q('.challenge-tools'),q('.challenge-head'),q('.challenge-tabs'));
  if(view==='preparation'){if(preparationPage)body.append(preparationPage);}else body.append(...paper.childNodes);
  paper.replaceChildren(header,body);syncPreparationGeometry();
  q('[data-action="close"]').onclick=()=>hide();
  for(const button of dialog.querySelectorAll('[data-view]'))button.onclick=()=>{
   if(busy||preparation?.busy)return;
   closeReplayMenu();
   if(button.dataset.view==='preparation'){openPreparation(inspect);return;}
   preparation?.hide({notify:false});view=button.dataset.view;pending=null;status='';refresh();q('.challenge-shell-body').scrollTop=0;q(`[data-view="${view}"]`)?.focus({preventScroll:true});
  };
  for(const button of dialog.querySelectorAll('[data-inspect]'))button.onclick=()=>openPreparation(button.dataset.inspect);
  for(const button of dialog.querySelectorAll('[data-slot]'))button.onclick=()=>{if(slotLocked||state().testMode||button.dataset.slot===id)return;pending=null;return transaction(()=>controller.selectProfile(button.dataset.slot),'已切換存檔。');};
  const start=q('[data-action="start"]');if(start)start.onclick=async()=>{if(locked)return;hide({notify:false});const options={characterId:selection.characterId,helperId:selection.helperId,intent:step==='entry'?'start':'resume'};try{const result=await ((chapter!=='chapter-1'&&onContinue)?onContinue(options):onStart(options));if(result?.accepted===false&&result.reason!=='cancelled'){open();status='尚未開始。'+saveIssueText(result.reason);refresh();}}catch{open();status='尚未開始，請重試或查看保存狀態。';refresh();}};
  const replayTrigger=q('[data-replay-trigger]');
  if(replayTrigger){
   replayTrigger.onclick=()=>{if(locked)return;if(replayMenuOpen)closeReplayMenu(true);else openReplayMenu();};
   replayTrigger.onkeydown=e=>{if(locked)return;if(e.key==='ArrowDown'||e.key==='ArrowUp'){e.preventDefault();openReplayMenu(e.key==='ArrowUp');}else if(e.key==='Escape'&&closeReplayMenu(true)){e.preventDefault();e.stopPropagation();}};
  }
  const chooseReplay=option=>{
   const idValue=option.dataset.replayOption;if(!replayOptions.some(item=>item.id===idValue))return;
   replayChoice=idValue;const bodyScroll=q('.challenge-shell-body')?.scrollTop||0;closeReplayMenu();refresh();if(q('.challenge-shell-body'))q('.challenge-shell-body').scrollTop=bodyScroll;q('[data-replay-trigger]')?.focus({preventScroll:true});
  };
  for(const option of dialog.querySelectorAll('[data-replay-option]')){
   option.onclick=()=>chooseReplay(option);
   option.onkeydown=e=>{
    if(e.key==='Escape'){e.preventDefault();e.stopPropagation();closeReplayMenu(true);return;}
    if(e.key==='Tab'){closeReplayMenu(true);return;}
    if(e.key==='Enter'||e.key===' '){e.preventDefault();chooseReplay(option);return;}
    const options=[...dialog.querySelectorAll('[data-replay-option]')],index=options.indexOf(option);
    const next=e.key==='Home'?0:e.key==='End'?options.length-1:e.key==='ArrowDown'?(index+1)%options.length:e.key==='ArrowUp'?(index+options.length-1)%options.length:-1;
    if(next>=0){e.preventDefault();focusReplayOption(options[next]);}
   };
  }
  const replaySelected=q('[data-action="replay-selected"]');
  if(replaySelected)replaySelected.onclick=()=>{if(locked||!selectedReplay)return;hide({notify:false});onStart({characterId:selection.characterId,helperId:selection.helperId,replay:true,chapterId:selectedReplay.id,intent:'start'});};
  const review=q('[data-action="review-opening"]');if(review)review.onclick=()=>{if(busy)return;hide({notify:false});onReview({characterId:selection.characterId});};
  const exp=q('[data-action="export-slot"]');if(exp)exp.onclick=()=>exportFile();const all=q('[data-action="export-all"]');if(all)all.onclick=()=>exportFile(true);
  const reset=q('[data-action="reset-slot"]');if(reset)reset.onclick=()=>{if(slotLocked||state().testMode)return;pending={kind:'reset',id,guards:guard()};status='';refresh();q('[data-action="cancel-slot-action"]')?.focus();};
  const cancel=q('[data-action="cancel-slot-action"]');if(cancel)cancel.onclick=()=>{if(busy)return;pending=null;status='已取消，原資料不變。';refresh();q('[data-action="reset-slot"]')?.focus();};
  const confirm=q('[data-action="confirm-slot-action"]');if(confirm)confirm.onclick=()=>{if(busy||state().testMode||!pending)return;const action=pending;return transaction(()=>action.kind==='reset'?controller.resetProfile(action.id,action.guards):controller.importSlotBackup(action.text,{profileId:action.id,...action.guards}),action.kind==='reset'?`存檔 ${slotNumber(action.id)} 已重置並保存。`:`已還原並保存存檔 ${slotNumber(action.id)}。`);};
  const imp=q('[data-slot-import]');if(imp)imp.onchange=async()=>{if(slotLocked||state().testMode)return;const file=imp.files?.[0];if(!file)return;if(file.size>4000000){status='檔案過大，原存檔未變更。';refresh();return;}const target=id,guards=guard();busy=true;status='正在檢查單槽備份…';refresh();try{const text=await file.text();if(state().testMode){pending=null;status='已切換測試模式，未匯入正式資料。';return;}const summary=controller.inspectSlotBackup(text);if(!summary?.ok){status='格式不支援：只接受單槽備份。原存檔未變更。';pending=null;}else if(summary.profileId!==target){status='槽號不符，只能還原同槽備份；原存檔未變更。';pending=null;}else{pending={kind:'import',id:target,guards,text,summary};status='請核對備份摘要，再確認還原。';}}catch{status='無法讀取單槽備份，原存檔未變更。';}finally{busy=false;refresh();q('[data-action="cancel-slot-action"]')?.focus();}};
  const retry=q('[data-action="retry-save"]');if(retry)retry.onclick=()=>transaction(()=>s.dirty?controller.retrySave():controller.refresh(),'存檔狀態已更新。');
  const bodyEl=q('.challenge-shell-body');if(bodyEl){bodyEl.scrollTop=scroll;bodyEl.onscroll=()=>{if(replayMenuOpen)positionReplayMenu();};}
 }
 function open(options={}){if(busy||preparation?.busy)return false;if(typeof options==='string')options={characterId:options};if(options.characterId)inspect=options.characterId;if(options.view==='character'||options.view==='preparation'){return openPreparation(options.characterId||inspect);}if(options.view){preparation?.hide({notify:false});view=options.view==='saves'?'save':options.view;}if(!dialog.open)previousFocus=document.activeElement;pending=null;status='';refresh();viewport.sync();if(!dialog.open){if(dialog.showModal)dialog.showModal();else dialog.setAttribute('open','');}q('[data-action="close"]')?.focus();return true;}
 dialog.addEventListener('cancel',e=>{e.preventDefault();if(busy||preparation?.busy)return;if(closeReplayMenu(true))return;if(view==='preparation'){preparation?.hide();return;}if(pending){pending=null;status='已取消，原資料不變。';refresh();}else hide();});for(const type of ['keydown','keyup','pointerdown','pointerup','click'])dialog.addEventListener(type,e=>{e.stopPropagation();if(type==='click'&&replayMenuOpen&&!e.target.closest?.('[data-replay-picker]'))closeReplayMenu();});
 return{element:dialog,open,show:open,hide,refresh,openPreparation,get isOpen(){return dialog.open;},get busy(){return busy||!!preparation?.busy;},destroy(){disposed=true;preparation?.destroy();viewport.destroy();dialog.remove();}};
}
