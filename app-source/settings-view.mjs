import {CAST} from './roster.mjs?v=chapter-presentation-20261117-r1';
import {MOVE_READABILITY} from './combat-view.mjs?v=chapter-presentation-20261117-r1';
import {playableVoice} from './voice-slots.mjs?v=chapter-presentation-20261117-r1';
const tabs=['audio','controls','moves','about'];
export function moveInformation(character,kind){
 const m=CAST[character]?.moves.find(m=>m.kind===kind);if(!m)return null;
 let details=m.hits?m.hits.map(h=>h.damage).join('＋')+' 傷害。':m.damage?m.damage+' 傷害。':'';
 if(kind==='chen_dream')details=m.damage+' 去程／'+m.returnDamage+' 回程傷害。';
 if(kind==='ma_gaze')details='地面 '+m.damage+'／對空 '+m.airDamage+' 傷害。';
 if(kind==='heal')details=m.start+' 秒後回復 '+m.heal+'，不超過 100。';
 if(m.behavior==='counter')details=m.window+' 秒近身防反窗口，反擊 '+m.damage+'。';
 if(m.behavior==='reject')details=m.window+' 秒拒收窗口，無自動近身反傷。';
 if(m.behavior==='calm')details='一次普通傷害最多 4，退開 60px。';
 if(m.behavior==='armor')details='一次傷害減為 60%（取整數），不硬直、不退；可接普攻。';
 return {character,kind,name:m.name,purpose:m.purpose,key:['U','I','O'][CAST[character].moves.indexOf(m)],cooldown:m.cooldown,details:details+' '+MOVE_READABILITY[kind].counter,action:MOVE_READABILITY[kind].action,voice:playableVoice(kind)};
}
export function mountSettingsPanel({document,store,onPreview=()=>false,onInspect=()=>{},onStopPreview=()=>{},onTestSfx=()=>{},onAudition=()=>false,canUse=()=>true,resolveAsset=path=>path}){
 const $=id=>document.querySelector('#'+id);let character='wang',kind='rush',tab='audio',opened=false,audioCharacter='wang',audioKind='rush',sfxAttempt=0;
 const stop=()=>{sfxAttempt++;onStopPreview();};
 function closeDetails(focus=false){$('settings-detail-layer').hidden=true;$('settings-main-workspace').inert=false;if(focus)$('settings-show-details').focus();}
 function audioDisabled(channel){const p=store.get();return p.masterMuted?'全部聲音已靜音，請先取消「全部靜音」。':p[channel+'Muted']?(channel==='voice'?'招式語音':'遊戲音效')+'已靜音，請先取消這個聲道的靜音。':p[channel+'Volume']<=0?'此聲道音量為零，請先調高音量。':null;}
 function chooseAudioCharacter(id){if(!CAST[id]||!canUse(id))return;stop();audioCharacter=id;audioKind=CAST[id].moves[0].kind;for(const c of Object.keys(CAST))$('settings-audio-character-'+c).setAttribute('aria-pressed',String(c===id));$('settings-audio-moves').innerHTML=CAST[id].moves.map(m=>`<button type="button" id="settings-audio-move-${m.kind}" aria-pressed="false">${m.name}</button>`).join('');for(const m of CAST[id].moves)$('settings-audio-move-'+m.kind).onclick=()=>{stop();audioKind=m.kind;for(const mm of CAST[id].moves)$('settings-audio-move-'+mm.kind).setAttribute('aria-pressed',String(mm.kind===m.kind));const muted=audioDisabled('voice');if(muted){$('settings-audition-status').textContent=muted;return;}$('settings-audition-status').textContent='正在試聽：'+CAST[id].name+' · '+m.name+'。';const result=onAudition(m.kind);if(result===false)$('settings-audition-status').textContent='語音未能啟動，請再點一次招式；也請檢查裝置音量與瀏覽器播放權限。';};$('settings-audition-status').textContent=CAST[id].name+'：點招式試聽一句。';}
 $('settings-audio-characters').innerHTML=Object.entries(CAST).map(([id,c])=>`<button type="button" id="settings-audio-character-${id}" aria-pressed="false">${c.name}</button>`).join('');for(const id of Object.keys(CAST))$('settings-audio-character-'+id).onclick=()=>chooseAudioCharacter(id);
 $('settings-audio-stop').onclick=()=>{stop();$('settings-audition-status').textContent='語音已停止。';};
 $('settings-show-details').onclick=()=>{stop();$('settings-detail-layer').hidden=false;$('settings-main-workspace').inert=true;$('settings-close-details').focus();};
 $('settings-close-details').onclick=()=>closeDetails(true);$('help-dialog').addEventListener?.('cancel',e=>{if(!$('settings-detail-layer').hidden){e.preventDefault();closeDetails(true);}});
 function sync(){const p=store.get();for(const channel of ['sfx','voice','music']){$('settings-'+channel+'-volume').value=String(Math.round(p[channel+'Volume']*100));$('settings-'+channel+'-value').textContent=Math.round(p[channel+'Volume']*100)+'%';$('settings-'+channel+'-muted').checked=p[channel+'Muted'];}
  $('settings-master-muted').checked=p.masterMuted;$('settings-storage').textContent=store.persisted?'偏好已保存在這個瀏覽器。':'偏好會保存在這個瀏覽器；無法儲存時仍可本次使用。';
 }
 function showTab(value){if(!tabs.includes(value))return;stop();closeDetails();tab=value;$('help-dialog').setAttribute('data-settings-tab',value);for(const id of tabs){$('settings-pane-'+id).hidden=id!==tab;$('settings-tab-'+id).setAttribute('aria-pressed',String(id===tab));}$('settings-scroll').scrollTop=0;$('settings-reset-confirm').hidden=true;}
 function renderMove(next,play=false){const info=moveInformation(character,next);if(!info)return;stop();closeDetails();kind=next;for(const m of CAST[character].moves)$('settings-move-'+m.kind).setAttribute('aria-pressed',String(kind===m.kind));
  $('settings-move-name').textContent=info.name;$('settings-detail-title').textContent=info.name+' · 招式詳情';$('settings-move-purpose').textContent=info.purpose;$('settings-move-binding').textContent='按鍵 '+info.key+' · 手機點招式鍵 · 冷卻 '+info.cooldown+' 秒';$('settings-move-action').textContent=info.action;$('settings-move-data').textContent=info.details;$('settings-move-details').open=false;$('settings-move-source').textContent=info.voice?'角色語音素材用於虛構戲仿；部分原始來源與再利用授權尚未獨立確認。':'目前沒有可播放的語音。';
  $('settings-demo-status').textContent='點招式或「動作＋語音」觀看動作並試聽。';
  if(!play)onInspect(character,kind);
  if(play){const result=onPreview(character,kind);$('settings-demo-status').textContent=result===false?'動作示範未能啟動，請重新整理。':result?.audioError?'動作示範可用，但語音播放未成功；請再按「動作＋語音」。':result?.audio===false?'動作示範播放一次；語音已靜音或音量為零。':'動作示範播放一次；語音依音訊設定播放，不會循環。';}
 }
 function chooseCharacter(id){if(!CAST[id]||!canUse(id))return;stop();character=id;for(const c of Object.keys(CAST))$('settings-character-'+c).setAttribute('aria-pressed',String(c===id));$('settings-move-list').innerHTML=CAST[id].moves.map(m=>`<button type="button" id="settings-move-${m.kind}" aria-pressed="false"><strong>${m.name}</strong><small>${m.purpose}</small></button>`).join('');for(const m of CAST[id].moves)$('settings-move-'+m.kind).onclick=()=>renderMove(m.kind,true);renderMove(CAST[id].moves[0].kind);}
 $('settings-characters').innerHTML=Object.entries(CAST).map(([id,c])=>`<button type="button" id="settings-character-${id}" aria-pressed="false"><img src="${resolveAsset(c.portrait)}" alt="" loading="lazy"><span id="settings-character-name-${id}">${c.name}</span></button>`).join('');for(const id of Object.keys(CAST))$('settings-character-'+id).onclick=()=>chooseCharacter(id);
 for(const id of tabs)$('settings-tab-'+id).onclick=()=>showTab(id);
 for(const channel of ['sfx','voice','music']){$('settings-'+channel+'-volume').oninput=e=>{store.update({[channel+'Volume']:Number(e.target.value)/100});sync();};$('settings-'+channel+'-muted').onchange=e=>{store.update({[channel+'Muted']:e.target.checked});sync();};}
 $('settings-master-muted').onchange=e=>{store.update({masterMuted:e.target.checked});sync();};
 $('settings-test-sfx').onclick=async()=>{stop();const muted=audioDisabled('sfx');if(muted){$('settings-sfx-status').textContent=muted;return;}const attempt=sfxAttempt;$('settings-sfx-status').textContent='準備播放三種音效…';let result;try{result=await onTestSfx();}catch{result={status:'error'};}if(attempt!==sfxAttempt)return;const state=result?.status;$('settings-sfx-status').textContent=state==='playing'?'試聽：打擊 → 跳躍 → 回復（約一秒）。':state==='muted'?'音效已靜音或音量為零。':state==='cancelled'?(audioDisabled('sfx')||'試聽已取消，可再按一次播放。'):state==='blocked'?'瀏覽器尚未允許播放，請再按一次試聽；也請檢查裝置音量。':'音效播放未成功，請再按一次或重新整理。';};
 $('settings-demo-play').onclick=()=>renderMove(kind,true);$('settings-demo-stop').onclick=()=>{stop();$('settings-demo-status').textContent='示範已停止。';};
 $('settings-reset').onclick=()=>{$('settings-reset-confirm').hidden=false;$('settings-cancel-reset').focus();};
 $('settings-cancel-reset').onclick=()=>{$('settings-reset-confirm').hidden=true;$('settings-reset').focus();};
 $('settings-confirm-reset').onclick=()=>{stop();store.reset();sync();$('settings-reset-confirm').hidden=true;$('settings-reset').focus();};
 function refreshAccess(){
  for(const id of Object.keys(CAST)){
   const unlocked=canUse(id),button=$('settings-character-'+id),audioButton=$('settings-audio-character-'+id);
   button.disabled=!unlocked;button.setAttribute('data-locked',String(!unlocked));$('settings-character-name-'+id).textContent=unlocked?CAST[id].name:'???';
   audioButton.disabled=!unlocked;audioButton.textContent=unlocked?CAST[id].name:'???';
  }
  if(!canUse(character))chooseCharacter('wang');if(!canUse(audioCharacter))chooseAudioCharacter('wang');
 }
 chooseCharacter(character);chooseAudioCharacter(audioCharacter);refreshAccess();showTab(tab);sync();
 return {open(selected){opened=true;refreshAccess();chooseCharacter(CAST[selected]&&canUse(selected)?selected:'wang');chooseAudioCharacter(CAST[selected]&&canUse(selected)?selected:'wang');showTab(tab);sync();},close(){opened=false;stop();closeDetails();$('settings-reset-confirm').hidden=true;},stop, sync,refreshAccess,get tab(){return tab;},get selected(){return{character,kind};},get opened(){return opened;}};
}
