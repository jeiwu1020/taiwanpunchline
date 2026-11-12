import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {JSDOM} from 'jsdom';
import {mountChapterInterface,chapterKeyboardAction} from '../dist/preview/campaign/chapter-ui.mjs';

const settingsKey='parliament-settings-v1';
function fixture(t,{url='https://game.test/preview/chapter2/?previewOnly=1',...overrides}={}){
 const dom=new JSDOM(readFileSync(new URL('../dist/preview/chapter2/index.html',import.meta.url),'utf8'),{url,pretendToBeVisual:true});
 const {window:w}=dom,d=w.document;
 w.matchMedia=()=>({matches:false});
 w.HTMLDialogElement.prototype.showModal=function(){this.open=true;};
 w.HTMLDialogElement.prototype.close=function(){this.open=false;this.dispatchEvent(new w.Event('close'));};
 let active=true,session=1,resumes=0,pauses=0;
 const writes=[],pausePurposes=[],restorations=[];
 const backing=overrides.storage||{getItem:()=>null,setItem(){},removeItem(){}};
 const storage={
  getItem:key=>backing.getItem(key),
  setItem(key,value){writes.push({operation:'set',key,value});backing.setItem(key,value);},
  removeItem(key){writes.push({operation:'remove',key});backing.removeItem(key);}
 };
 const ui=mountChapterInterface({
  document:d,window:w,
  cast:{wang:{name:'恰吉王',moves:[{name:'長招式名稱',kind:'rush',purpose:'貼近對手',cooldown:8},{name:'反擊',kind:'counter',cooldown:8},{name:'喝水',kind:'heal',cooldown:8}]}},
  getCharacter:()=> 'wang',
  pauseForUI(purpose){
   pausePurposes.push(purpose);
   const id=session,was=active;
   if(was){active=false;pauses++;}
   return()=>{
    restorations.push(purpose);
    if(purpose!=='settings'&&was&&id===session&&!active){active=true;resumes++;}
   };
  },
  ...overrides,storage
 });
 t.after(()=>{ui.destroy();w.close();});
 return {ui,d,w,writes,pausePurposes,restorations,setActive:v=>active=v,changeSession:()=>session++,stats:()=>({active,resumes,pauses,writes:writes.length})};
}

test('settings pauses once and remains paused after closing, matching chapter one',t=>{
 const f=fixture(t);
 f.ui.openSettings();f.ui.openSettings();
 assert.equal(f.stats().pauses,1);
 assert.deepEqual(f.pausePurposes,['settings']);
 assert.equal(f.d.querySelector('#help-dialog').open,true);
 f.ui.closeSettings();f.ui.closeSettings();
 assert.equal(f.d.querySelector('#help-dialog').open,false);
 assert.deepEqual(f.restorations,['settings']);
 assert.equal(f.stats().resumes,0);
 assert.equal(f.stats().active,false);
 assert.equal(f.stats().writes,0);
});

test('opening from pause never resumes; changing the session never resumes a new game',t=>{
 const f=fixture(t);
 f.setActive(false);f.ui.openSettings();f.ui.closeSettings();
 assert.equal(f.stats().resumes,0);
 f.setActive(true);f.ui.openSettings();f.changeSession();f.ui.closeSettings();
 assert.equal(f.stats().resumes,0);
 assert.equal(f.stats().active,false);
 assert.equal(f.stats().writes,0);
});

test('Escape closes the real settings workspace without toggling the underlying pause handler',t=>{
 const f=fixture(t);let toggles=0;
 f.w.addEventListener('keydown',()=>toggles++);
 f.d.querySelector('#help').focus();f.ui.openSettings();
 assert.equal(f.d.activeElement.id,'close-help');
 const event=new f.w.KeyboardEvent('keydown',{key:'Escape',code:'Escape',bubbles:true,cancelable:true});
 f.d.querySelector('#help-dialog').dispatchEvent(event);
 assert.equal(event.defaultPrevented,true);
 assert.equal(f.d.querySelector('#help-dialog').open,false);
 assert.equal(f.d.activeElement.id,'help');
 assert.equal(f.stats().resumes,0);
 assert.equal(toggles,0);
});

test('chapter-one settings tabs and native cancel preserve the pause without preference writes',t=>{
 const f=fixture(t);f.ui.openSettings();
 const dialog=f.d.querySelector('#help-dialog');
 assert.equal(f.d.querySelector('#chapter-settings'),null);
 for(const tab of ['audio','controls','moves','about']){
  f.d.querySelector('#settings-tab-'+tab).click();
  assert.equal(dialog.dataset.settingsTab,tab);
  for(const other of ['audio','controls','moves','about']){
   assert.equal(f.d.querySelector('#settings-pane-'+other).hidden,other!==tab);
   assert.equal(f.d.querySelector('#settings-tab-'+other).getAttribute('aria-pressed'),String(other===tab));
  }
 }
 const cancel=new f.w.Event('cancel',{cancelable:true});dialog.dispatchEvent(cancel);
 assert.equal(cancel.defaultPrevented,true);
 assert.equal(dialog.open,false);
 assert.equal(f.stats().active,false);
 assert.equal(f.stats().writes,0);
});

test('sound controls retain existing settings fields and do not write on mount',t=>{
 const f=fixture(t),before=f.ui.preferences;
 assert.equal(f.stats().writes,0);
 f.d.querySelector('#sound').click();
 assert.equal(f.stats().writes,1);
 assert.deepEqual(f.ui.preferences,{...before,masterMuted:true});
 assert.equal(f.d.querySelector('#sound').getAttribute('aria-pressed'),'false');
 assert.equal(f.d.querySelector('#settings-master-muted').checked,true);
 assert.deepEqual(f.writes.map(write=>write.key),[settingsKey]);
});

test('route and battle HUD derive real health, guard, time and progression without state mutation',t=>{
 const f=fixture(t);
 const world={player:{hp:72,maxHp:120,guardPips:2,cooldowns:[.01,0,0],assist:{charge:45,active:false,used:false},rally:99.99},enemy:{hp:40,maxHp:100,guardPips:1,displayName:'對手'},remaining:31.2,routeProgress:.5};
 const before=JSON.stringify(world);
 f.ui.render({state:{mode:'battle',characterId:'wang',rounds:{player:1,enemy:0}},world});
 assert.equal(f.d.querySelector('#p-hp').textContent,'72');
 assert.equal(f.d.querySelector('#timer').textContent,'32');
 assert.equal(f.d.querySelector('#p-guard small').textContent,'防守 2/3');
 assert.equal(f.d.querySelector('#health').style.width,'60%');
 assert.equal(f.d.querySelector('#specials .cooldown-value').textContent,'0.1');
 assert.equal(f.d.querySelector('.rally-button').classList.contains('ready'),false);
 assert.equal(f.d.querySelector('#match-score').textContent,'1 : 0');
 f.ui.render({state:{mode:'route',characterId:'wang',rounds:{}},world});
 assert.equal(f.d.querySelector('#timer').textContent,'50%');
 assert.equal(f.d.querySelector('#enemy-panel').hidden,true);
 assert.equal(f.d.querySelector('.movement [data-direction="up"]').dataset.hold,'up');
 f.ui.render({state:{mode:'battle',characterId:'wang',rounds:{}},world});
 assert.equal(f.d.querySelector('.movement [data-direction="up"]').dataset.action,'jump');
 assert.equal(f.d.querySelector('.movement [data-direction="up"]').dataset.hold,undefined);
 assert.equal(JSON.stringify(world),before);
 assert.equal(f.stats().writes,0);
});

test('logical viewport reports touch/orientation and visible safety bounds with rotation disabled',t=>{
 const f=fixture(t,{storage:{getItem:()=>JSON.stringify({version:1,rotate:false}),setItem(){}}});
 Object.defineProperty(f.w,'innerWidth',{value:390,configurable:true});
 Object.defineProperty(f.w,'innerHeight',{value:844,configurable:true});
 Object.defineProperty(f.w.navigator,'maxTouchPoints',{value:1});f.ui.resize();
 assert.equal(f.d.body.dataset.touch,'true');
 assert.equal(f.d.body.dataset.layout,'portrait');
 assert.equal(f.ui.cameraOptions.touch,true);
 assert.equal(f.ui.cameraOptions.portrait,true);
 assert.equal(f.ui.cameraOptions.nativeLandscape,false);
 assert.equal(f.stats().writes,0);
});

test('keyboard movement has shared street and duel semantics',()=>{
 assert.equal(chapterKeyboardAction('KeyW',true),'up');
 assert.equal(chapterKeyboardAction('KeyW',false),'jump');
 assert.equal(chapterKeyboardAction('ArrowDown',false),'crouch');
 assert.equal(chapterKeyboardAction('Space',true),'jump');
 assert.equal(chapterKeyboardAction('ShiftLeft',false),'guard');
});

test('home cancellation resumes once; saved exit uses the same homepage without writes',t=>{
 let dest;const f=fixture(t,{getExitState:()=>({campaignChapterId:'chapter-2',persisted:true}),navigate:v=>dest=v});
 f.d.querySelector('#home').click();f.d.querySelector('#home').click();
 f.d.querySelector('#chapter-home-confirm [data-cancel]').click();
 assert.equal(f.stats().resumes,1);
 assert.deepEqual(f.restorations,['home']);
 assert.equal(dest,undefined);
 f.d.querySelector('#home').click();f.d.querySelector('#chapter-home-confirm [data-confirm]').click();
 assert.equal(dest,'../../');
 assert.equal(f.stats().writes,0);
});

for(const failure of [{persisted:false,busy:true},{persisted:false,blocked:true},{persisted:false}]){
 test(`home rechecks ${JSON.stringify(failure)} before allowing navigation`,t=>{
  let state={campaignChapterId:'chapter-2',persisted:true},dest;
  const f=fixture(t,{getExitState:()=>state,navigate:v=>dest=v});
  f.d.querySelector('#home').click();
  const confirm=f.d.querySelector('#chapter-home-confirm [data-confirm]');
  assert.equal(confirm.disabled,false);
  state={...state,...failure};confirm.click();
  assert.equal(dest,undefined);
  assert.match(f.d.querySelector('#chapter-home-copy').textContent,/尚未確認保存/);
  assert.equal(confirm.disabled,true);
  assert.equal(f.d.querySelector('#chapter-home-confirm').open,true);
  assert.equal(f.stats().active,false);
  assert.equal(f.stats().writes,0);
  f.d.querySelector('#chapter-home-confirm [data-cancel]').click();
  state={campaignChapterId:'chapter-2',persisted:true};f.ui.openHome();confirm.click();
  assert.equal(dest,'../../');
  assert.equal(f.stats().writes,0);
 });
}

test('home cancellation after the session changes cannot resume a newer game',t=>{
 const f=fixture(t);f.ui.openHome();f.changeSession();
 f.d.querySelector('#chapter-home-confirm [data-cancel]').click();
 assert.equal(f.stats().active,false);
 assert.equal(f.stats().resumes,0);
 assert.deepEqual(f.restorations,['home']);
 assert.equal(f.stats().writes,0);
});

test('unavailable settings storage reports failure without touching game saves',t=>{
 const f=fixture(t,{url:'https://game.test/preview/chapter2/',storage:{getItem:()=>null,setItem(){throw Error('quota');}}});
 f.d.querySelector('#sound').click();
 assert.equal(f.ui.preferences.masterMuted,true);
 assert.deepEqual(f.writes.map(write=>write.key),[settingsKey]);
 assert.match(f.d.querySelector('#settings-storage').textContent,/尚未保存|無法儲存/);
 assert.doesNotMatch(f.d.querySelector('#settings-storage').textContent,/已保存在/);
 f.ui.openSettings();f.ui.closeSettings();
 assert.equal(f.stats().writes,1);
});

test('preview navigation and settings inspection do not create preferences or game saves',t=>{
 const f=fixture(t);f.ui.openSettings();
 assert.match(f.d.querySelector('#settings-storage').textContent,/預覽偏好不寫入正式存檔/);
 f.d.querySelector('#settings-tab-moves').click();
 f.d.querySelector('#settings-show-details').click();
 f.d.querySelector('#settings-close-details').click();
 f.ui.closeSettings();f.ui.openHome();
 f.d.querySelector('#chapter-home-confirm [data-cancel]').click();
 assert.deepEqual(f.writes,[]);
});

test('settings and homepage dialogs are mutually exclusive and preserve the pause',t=>{
 const f=fixture(t);f.ui.openSettings();f.d.querySelector('#home').click();
 assert.equal(f.d.querySelector('#help-dialog').open,false);
 assert.equal(f.d.querySelector('#chapter-home-confirm').open,true);
 f.ui.openSettings();
 assert.equal(f.d.querySelector('#help-dialog').open,true);
 assert.equal(f.d.querySelector('#chapter-home-confirm').open,false);
 f.ui.closeSettings();
 assert.equal(f.stats().active,false);
 assert.equal(f.stats().pauses,1);
 assert.equal(f.stats().resumes,0);
 assert.equal(f.stats().writes,0);
});

test('delayed native close events cannot resume gameplay underneath another dialog or a reopened dialog',t=>{
 const f=fixture(t),events=[];
 f.w.HTMLDialogElement.prototype.close=function(){this.open=false;events.push(()=>this.dispatchEvent(new f.w.Event('close')));};
 f.ui.openHome();f.ui.openSettings();
 const resumes=f.stats().resumes;
 for(const event of events.splice(0))event();
 assert.equal(f.stats().active,false);
 assert.equal(f.stats().resumes,resumes);
 assert.equal(f.d.querySelector('#help-dialog').open,true);
 f.ui.closeSettings();f.ui.openHome();
 for(const event of events.splice(0))event();
 assert.equal(f.stats().active,false);
 assert.equal(f.stats().resumes,resumes);
 assert.equal(f.d.querySelector('#chapter-home-confirm').open,true);
 // A queued close belongs to the previous opening, not the newly opened home.
 f.d.querySelector('#chapter-home-confirm [data-cancel]').click();f.ui.openHome();
 const restorations=f.restorations.length;
 for(const event of events.splice(0))event();
 assert.equal(f.d.querySelector('#chapter-home-confirm').open,true);
 assert.equal(f.restorations.length,restorations);
 assert.equal(f.stats().active,false);
 assert.equal(f.stats().writes,0);
});

for(const [n,module] of [[2,'chapter2-controller.mjs'],[3,'chapter2-controller.mjs'],[4,'chapter4-controller.mjs']]){
 test(`chapter ${n} route and duel render only engine-backed HP, guard, progress and round data`,async t=>{
  const {createPlayableChapter}=await import(`../dist/preview/chapter${n}/${module}`);
  const {CAST}=await import(`../dist/preview/chapter${n}/core.mjs`),f=fixture(t,{cast:CAST});
  for(const initialStepId of ['route-a','boss']){
   const c=createPlayableChapter({initialStepId,characterId:'wang'}),world=c.world,state=c.view();
   assert.equal(Number.isFinite(world.player.hp),true);
   assert.equal(Number.isFinite(world.player.guardPips),true);
   if(state.mode==='battle'){
    assert.equal(Number.isFinite(world.remaining),true);
    assert.equal(Number.isFinite(state.rounds.player),true);
   }else assert.equal(Number.isFinite(world.routeProgress),true);
   const before=JSON.stringify(world);f.ui.render({state,world});
   assert.equal(f.d.querySelector('#p-hp').textContent,String(Math.ceil(world.player.hp)));
   assert.equal(f.d.querySelector('#enemy-panel').hidden,state.mode==='route');
   assert.equal(f.d.querySelector('.assist-button').disabled,false);
   assert.equal(JSON.stringify(world),before);
  }
  assert.equal(f.stats().writes,0);
 });
}

test('master sound toggle preserves chapter-one channel mutes and volumes in both directions',t=>{
 const sounds=[];
 const initial={version:1,sfxMuted:true,voiceMuted:true,musicMuted:false,sfxVolume:.6,voiceVolume:.4,musicVolume:.1};
 const f=fixture(t,{storage:{getItem:key=>key===settingsKey?JSON.stringify(initial):null,setItem(){}},onSound:(...args)=>sounds.push(args)});
 const before=f.ui.preferences,sound=f.d.querySelector('#sound');
 assert.equal(sound.textContent,'♪ 聲音開');
 assert.equal(sound.getAttribute('aria-pressed'),'true');
 assert.equal(f.d.querySelector('#settings-sfx-muted').checked,true);
 assert.deepEqual(sounds.at(-1),[false,.6]);
 sound.click();
 assert.deepEqual(f.ui.preferences,{...before,masterMuted:true});
 assert.equal(sound.textContent,'♪ 聲音關');
 assert.equal(sound.getAttribute('aria-pressed'),'false');
 sound.click();
 assert.deepEqual(f.ui.preferences,before);
 assert.equal(sound.textContent,'♪ 聲音開');
 assert.deepEqual(sounds.at(-1),[false,.6],'master unmute must not unmute effects');
 assert.deepEqual(f.writes.map(write=>write.key),[settingsKey,settingsKey]);
 assert.deepEqual(JSON.parse(f.writes.at(-1).value),before);
});

test('effects can be unmuted in the real audio tab without resetting master or other channels',t=>{
 const f=fixture(t,{storage:{getItem:()=>JSON.stringify({version:1,masterMuted:true,sfxMuted:true,voiceMuted:true,musicVolume:.1}),setItem(){}}});
 f.ui.openSettings();const before=f.ui.preferences;
 f.d.querySelector('#settings-sfx-muted').click();
 assert.deepEqual(f.ui.preferences,{...before,sfxMuted:false});
 assert.equal(f.d.querySelector('#settings-master-muted').checked,true);
 assert.equal(f.d.querySelector('#settings-voice-muted').checked,true);
 assert.equal(f.d.querySelector('#sound').getAttribute('aria-pressed'),'false');
 assert.deepEqual(f.writes.map(write=>write.key),[settingsKey]);
});

test('pending preparation blocks settings, home and Escape behind the shared operation gate',t=>{
 let busy=true;const f=fixture(t,{isBusy:()=>busy});let escapes=0;f.w.addEventListener('keydown',()=>escapes++);
 f.ui.openSettings();f.ui.openHome();assert.equal(f.d.querySelector('#help-dialog').open,false);assert.equal(f.d.querySelector('#chapter-home-confirm').open,false);
 f.w.dispatchEvent(new f.w.KeyboardEvent('keydown',{key:'Escape',code:'Escape',bubbles:true,cancelable:true}));assert.equal(escapes,0);
 busy=false;f.ui.openSettings();assert.equal(f.d.querySelector('#help-dialog').open,true);
});
test('return to selection delegates to draft preparation without leaving the chapter',t=>{let opened=0;const f=fixture(t,{onPrepare:()=>opened++});f.d.querySelector('#leave').click();assert.equal(opened,1);assert.equal(f.d.querySelector('#chapter-home-confirm').open,false);});
test('idle preparation receives Escape while a real pending preparation still blocks it',t=>{
 let pending=false;const f=fixture(t,{isBusy:()=>true,isOperationBusy:()=>pending}),dialog=f.d.createElement('dialog');dialog.id='challengePreparationOverlay';f.d.body.append(dialog);dialog.showModal();let received=0;dialog.addEventListener('keydown',()=>received++);
 const escape=()=>{const e=new f.w.KeyboardEvent('keydown',{key:'Escape',code:'Escape',bubbles:true,cancelable:true});dialog.dispatchEvent(e);return e;};assert.equal(escape().defaultPrevented,false);assert.equal(received,1);pending=true;assert.equal(escape().defaultPrevented,true);assert.equal(received,1);
});
