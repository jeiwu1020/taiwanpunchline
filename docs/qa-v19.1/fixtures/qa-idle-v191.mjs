import {performanceGuardActive,STAGE_ITEMS} from './stage-rules.mjs?v=19';
import {ARENA_ASSET,cameraFrame,backgroundFrame,ambientPaper,drawComicItem} from './arena-presentation.mjs?v=19.1';
import {renderCooldownButton} from './cooldown-view.mjs?v=19';
import {VoiceChannels} from './voice-channels.mjs?v=18';
import {VoiceCueQueue} from './voice-cues.mjs?v=17';
import {playableVoice} from './voice-slots.mjs?v=17';
import { Duel,CAST,GROUND } from './core.mjs?v=19';
import {MOVE_READABILITY,moveCue,guardView,combatStatus,impactY} from './combat-view.mjs?v=19';
import {ART_FILES,PROP_FRAMES,drawFighterArt} from './art-render.mjs?v=18';
import {SIGNATURE_PROP_FRAMES} from './art-expression.mjs?v=13';
import {activeSpitAge,retainSpitEpisode,arrowPresentation} from './art-motion.mjs?v=13';
const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
let selected='wang',opponent='han',duel=new Duel(),scene,started=false,counting=false,sound=true,audio,hold={},punchWait=0,countTimer;
duel.status='menu';
const heldKeys=new Set(),heldPointers=new Map();
const ink=0x142b32,paper=0xfff7e5;
// Existing media IDs are retained for compatibility; identity belongs to the actor,
// not to the clip: player uses move-voice, enemy uses han-voice, even in mirror duels.
const voiceChannels=new VoiceChannels({player:$('#move-voice'),enemy:$('#han-voice')});
let voiceEnabled=true;
const voiceCues=new VoiceCueQueue(playableVoice);
function stopVoice(){voiceCues.clear();voiceChannels.stopAll();}
function primeVoice(){if(sound&&voiceEnabled)voiceChannels.prime(playableVoice('coin').src);}
function playConfiguredVoice(kind,preview=false,f=duel.player){const clip=playableVoice(kind);if(!clip||!sound||!voiceEnabled||(!preview&&duel.status!=='active'))return false;
 return voiceChannels.play(f.id||'player',clip,{preview,
  onStart:()=>{$('#voice-status').textContent=kind==='coin'?'已播放韓國瑜原片短句：高雄發大財。':'已播放'+(clip.catalogProvided?'語錄站音檔：':'使用者提供音檔：')+clip.label+'。未獨立認證發言者與來源。';},
  onError:()=>{$('#voice-status').textContent='此音檔播放未成功，請按試聽重試。';}
 });
}
function drainVoiceCues(){if(!sound||!voiceEnabled||duel.status!=='active'){voiceCues.clear();return;}for(const cue of voiceCues.ready())playConfiguredVoice(cue.kind,false,cue.f);}
$('#voice-enabled').onchange=e=>{voiceEnabled=e.target.checked;if(!voiceEnabled)stopVoice();else primeVoice();$('#voice-status').textContent=voiceEnabled?'招式音訊已啟用：19 招可播放，死亡之握與電火球三招均已接入；其餘未接入招式仍用合成音效。':'招式音訊已關閉。';};
$('#play-voice').onclick=()=>{stopVoice();if(!sound||!voiceEnabled){$('#voice-status').textContent='請先開啟聲音與招式音訊。';return;}playConfiguredVoice($('#voice-sample').value,true);};
$('#stop-voice').onclick=()=>{stopVoice();$('#voice-status').textContent='試聽已停止。';};
$('#voice-sample').onchange=()=>stopVoice();
$('#help-dialog').addEventListener('close',()=>stopVoice());

function sfx(kind){if(!sound)return;try{audio??=new(window.AudioContext||window.webkitAudioContext)();audio.resume();const t=audio.currentTime,o=audio.createOscillator(),g=audio.createGain();o.type=kind==='hit'?'square':'triangle';const freq={hit:125,block:260,launch:540,jump:360,heal:680,counter:180,spit:840,whiff:240,over:330,start:440,ma_handshake:410,ma_gaze:470,ma_cough:145,su_shout:170,su_dare:105,su_rush:230,huang_debt:610,huang_shout:390,huang_queue:510,chen_dream:740,chen_question:430,chen_calm:300,ko_bags:580,ko_name:420,ko_resolve:210,han_knee:180}[kind]||200;o.frequency.setValueAtTime(freq,t);o.frequency.exponentialRampToValueAtTime(kind==='heal'?1000:freq*.45,t+.13);g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(.045,t+.005);g.gain.exponentialRampToValueAtTime(.0001,t+.15);o.connect(g);g.connect(audio.destination);o.onended=()=>{o.disconnect();g.disconnect();};o.start(t);o.stop(t+.17);}catch{sound=false;stopVoice();$('#sound').textContent='♪ 聲音關';$('#sound').setAttribute('aria-pressed','false');}}
function clearHold(){hold={};heldKeys.clear();heldPointers.clear();duel.player.crouch=false;duel.player.crouchBlend=0;$$('.held').forEach(b=>b.classList.remove('held'));}
function syncHold(action){hold[action]=[...heldKeys].some(code=>keys[code]===action)||[...heldPointers.values()].includes(action);$$('[data-hold],[data-action]').filter(b=>b.dataset.hold===action).forEach(b=>b.classList.toggle('held',hold[action]));}
function setupMoves(){CAST[selected].moves.forEach((m,i)=>{const b=$(`[data-action="special${i+1}"]`);b.querySelector('strong').textContent=m.name;b.querySelector('small').textContent=m.hint.split(' · ')[0];b.title=m.hint;renderCooldownButton(b,m,duel.player.cooldowns[i]);});}
function syncRoster(){
 for(const [side,id] of [['player',selected],['opponent',opponent]]){
  const cast=CAST[id],portrait=$('#'+side+'-portrait'),card=$('#'+side+'-card');
  portrait.src=cast.portrait;portrait.alt=cast.name+'原創諷刺漫畫';
  $('#'+side+'-name').textContent=cast.name;$('#'+side+'-tag').textContent=cast.tag;
  $('#'+side+'-moves').textContent=cast.moves.map(m=>m.name).join(' · ');
  $('#'+side+'-select').value=id;card.style.setProperty('--cast-color',cast.colorCSS);
 }
}
function initializeRoster(){
 const options=Object.entries(CAST).map(([id,cast])=>`<option value="${id}">${cast.name}</option>`).join('');
 for(const side of ['player','opponent'])$('#'+side+'-select').innerHTML=options;
 syncRoster();setupMoves();
}
function movePresentation(f,kind){
 const cast=CAST[f.type],move=cast.moves.find(m=>m.kind===kind);
 if(!move)return {word:'',banner:'',fictional:true};
 const legacy={han_knee:'可憐哪：膝蓋先到，氣勢跟上。',ma_cough:'酷酷嫂：咳、咳。好，下一頁。',ko_name:'賴祥德：名字喊到破音了！',rush:'本來想從容，結果連滾帶爬。',counter:'先戴墨鏡，假裝一切都在掌握之中。'};
 return {word:move.word||move.name,banner:legacy[kind]||`${cast.name}：${move.name}！`,fictional:move.fictional!==false};
}
function showMenu(){stopVoice();clearTimeout(countTimer);counting=false;started=false;clearHold();duel=new Duel(selected,$('#difficulty').value,undefined,opponent);duel.status='menu';$$('.screen').forEach(e=>e.classList.add('hidden'));$('#menu').classList.remove('hidden');$('#countdown').classList.add('hidden');$('#pause').disabled=true;$('#help').disabled=false;$('#pause').textContent='Ⅱ 暫停';$('#tip').textContent='蹲躲高招 · 跳過地面 · 後退擋，注意三格耐力';$('#broadcast').classList.add('hidden');syncRoster();setupMoves();}
function startGame(){if(!scene)return;clearTimeout(countTimer);stopVoice();primeVoice();clearHold();duel=new Duel(selected,$('#difficulty').value,undefined,opponent);duel.status='countdown';setupMoves();started=true;counting=true;$$('.screen').forEach(e=>e.classList.add('hidden'));$('#countdown').classList.remove('hidden');$('#pause').disabled=true;$('#help').disabled=true;sfx('start');let n=3;$('#countdown').textContent='3';function next(){n--;$('#countdown').textContent=n>0?String(n):'開麥！';sfx('start');if(n>=0)countTimer=setTimeout(next,480);else{$('#countdown').classList.add('hidden');counting=false;duel.status='active';$('#pause').disabled=false;$('#help').disabled=false;if(document.hidden||!document.hasFocus()||$('#help-dialog').open)pauseGame();else $('#game').focus({preventScroll:true});}}countTimer=setTimeout(next,480);$('#tip').textContent=CAST[selected].tip;}
function pauseGame(){if(duel.status!=='active')return;stopVoice();clearHold();duel.status='paused';$('#pause-screen').classList.remove('hidden');$('#pause').textContent='▶ 繼續';}
function resumeGame(){if(duel.status!=='paused')return;duel.status='active';$('#pause-screen').classList.add('hidden');$('#pause').textContent='Ⅱ 暫停';$('#game').focus({preventScroll:true});}
function result(){stopVoice();clearHold();$('#pause').disabled=true;const win=duel.winner==='player';const stats=duel.stats;$('#result-title').textContent=duel.winner==='draw'?'麥克風宣布平手':win?'對手先破防了！':'氣勢先下班了。';let roast=stats.interrupts>0?'本場最佳戰術：不讓對方把水喝完。':stats.counters>0?(selected==='wang'?'墨鏡戴對時機，從容就是一種攻擊。':'等到對方出招，這一回合笑著接下。'):stats.maxCombo>=4?'拳腳沒有在辯論，但場面很有說服力。':CAST[selected].roast;$('#result-sub').textContent=roast;$('#stats').innerHTML=`<div><strong>${stats.maxCombo}</strong><small>最高連段</small></div><div><strong>${stats.specialHits}</strong><small>梗技命中</small></div><div><strong>${stats.interrupts||stats.blocks}</strong><small>${stats.interrupts?'打斷喝水':'成功格擋'}</small></div>`;$('#result').classList.remove('hidden');sfx('over');}
$('#player-select').onchange=e=>{if(!CAST[e.target.value])return;selected=e.target.value;showMenu();};
$('#opponent-select').onchange=e=>{if(!CAST[e.target.value])return;opponent=e.target.value;showMenu();};
$('#start').onclick=startGame;$('#replay').onclick=startGame;$('#reselect').onclick=showMenu;$('#leave').onclick=showMenu;$('#resume').onclick=resumeGame;$('#pause').onclick=()=>duel.status==='paused'?resumeGame():pauseGame();
$('#sound').onclick=()=>{sound=!sound;if(!sound)stopVoice();else primeVoice();$('#sound').textContent=sound?'♪ 聲音開':'♪ 聲音關';$('#sound').setAttribute('aria-pressed',String(sound));if(sound)sfx('start');};
$('#help').onclick=()=>{pauseGame();$('#help-dialog').showModal();};$('#close-help').onclick=()=>$('#help-dialog').close();$('#help-dialog').addEventListener('click',e=>{if(e.target===$('#help-dialog')&&e.offsetX<0)$('#help-dialog').close();});
const keys={ArrowLeft:'left',KeyA:'left',ArrowRight:'right',KeyD:'right',ArrowDown:'crouch',KeyS:'crouch',KeyK:'guard',ShiftLeft:'guard',KeyJ:'punch',ArrowUp:'jump',KeyW:'jump',Space:'jump',KeyU:'special1',KeyI:'special2',KeyO:'special3'};
window.addEventListener('keydown',e=>{if(e.target.closest('dialog,select')||['INPUT','TEXTAREA'].includes(e.target.tagName))return;if(e.code==='Escape'){if(duel.status==='active')pauseGame();else if(duel.status==='paused')resumeGame();return;}const action=keys[e.code];if(!action||!started)return;e.preventDefault();if(e.repeat||duel.status!=='active')return;if(['left','right','guard','punch','crouch'].includes(action)){heldKeys.add(e.code);syncHold(action);if(action==='punch'){duel.press('punch');punchWait=.33;}}else duel.press(action);});
window.addEventListener('keyup',e=>{const action=keys[e.code];if(action){heldKeys.delete(e.code);syncHold(action);}});
$$('[data-hold],[data-action]').forEach(b=>{b.addEventListener('pointerdown',e=>{e.preventDefault();if(duel.status!=='active')return;b.setPointerCapture(e.pointerId);b.classList.add('held');if(b.dataset.hold){heldPointers.set(e.pointerId,b.dataset.hold);syncHold(b.dataset.hold);if(b.dataset.hold==='punch'){duel.press('punch');punchWait=.33;}}else duel.press(b.dataset.action);});const release=e=>{if(b.dataset.hold){heldPointers.delete(e.pointerId);syncHold(b.dataset.hold);}else b.classList.remove('held');};b.addEventListener('pointerup',release);b.addEventListener('pointercancel',release);b.addEventListener('lostpointercapture',release);});
window.addEventListener('blur',()=>{stopVoice();clearHold();pauseGame();});document.addEventListener('visibilitychange',()=>{if(document.hidden){stopVoice();clearHold();pauseGame();}});
function text(scene,x,y,content,size=20,color='#142b32',weight='bold'){return scene.add.text(x,y,content,{fontFamily:'"PingFang TC","Microsoft JhengHei",sans-serif',fontSize:size,color,fontStyle:weight,padding:{x:2,y:2}});}
function ellipse(g,x,y,w,h,color,stroke=true){g.fillStyle(color,1);g.fillEllipse(x,y,w,h);if(stroke){g.lineStyle(3,ink,1);g.strokeEllipse(x,y,w,h);}}
function rect(g,x,y,w,h,color,r=0){g.fillStyle(color);if(r){g.fillRoundedRect(x,y,w,h,r);g.lineStyle(3,ink);g.strokeRoundedRect(x,y,w,h,r);}else{g.fillRect(x,y,w,h);g.lineStyle(3,ink);g.strokeRect(x,y,w,h);}}
function line(g,points,width,color){g.lineStyle(width+5,ink,1);g.beginPath();g.moveTo(...points[0]);for(const p of points.slice(1))g.lineTo(...p);g.strokePath();g.lineStyle(width,color,1);g.beginPath();g.moveTo(...points[0]);for(const p of points.slice(1))g.lineTo(...p);g.strokePath();}
class Arena extends Phaser.Scene {
 preload(){this.load.image('arena-chamber',ARENA_ASSET);this.assetFailure=false;this.load.on('progress',v=>{$('#start').textContent='載入漫畫 '+Math.round(v*100)+'%';});this.load.on('loaderror',()=>{this.assetFailure=true;});for(const [key,file] of Object.entries(ART_FILES))this.load.image(key,'assets/'+file);}
 create(){if(this.assetFailure){$('#start').textContent='素材載入失敗，請重整';$('#tip').textContent='部分漫畫素材未載入，請重新整理再試。';return;}scene=this;this.add.rectangle(480,-1000,6000,2860,0xd4cbaa).setDepth(-30);this.add.rectangle(480,1800,6000,2740,0xe6c695).setDepth(-30);this.makeBackdrop();this.dynamic=this.add.graphics();this.rigs=[this.add.container(),this.add.container()];this.chars=[];this.heads=[];this.extras=[];for(let i=0;i<2;i++){const body=this.add.graphics(),head=this.add.image(4,-75,'wang-head'),extra=this.add.graphics();this.rigs[i].add([body,head,extra]);this.chars.push(body);this.heads.push(head);this.extras.push(extra);}this.artImages=Object.fromEntries(Object.keys(ART_FILES).map(k=>[k,this.textures.get(k).getSourceImage()]));this.artCanvases=[];this.artDisplays=[];this.spitStart=new WeakMap();this.lastArtPose=new WeakMap();this.propPool=[];this.textPool=[];this.markerPool=[];this.statusTexts=[0,1].map(()=>text(this,0,0,'',17,'#fff7e5').setOrigin(.5).setStroke('#142b32',4).setDepth(8));this.guardCache='';
 for(const [name,r] of Object.entries(PROP_FRAMES))this.textures.get('art-props').add(name,0,...r);
 this.textures.get('handshake-grip').add('clasp',0,290,65,1590,610);
 for(const [name,r] of Object.entries(SIGNATURE_PROP_FRAMES))this.textures.get('signature-props').add(name,0,...r);
 for(let i=0;i<2;i++){this.chars[i].setVisible(false);this.heads[i].setVisible(false);this.extras[i].setVisible(false);const texture=this.textures.createCanvas('fighter-art-'+i,512,384);const art=this.add.image(-256,-350,'fighter-art-'+i).setOrigin(0);this.rigs[i].add(art);this.artCanvases.push(texture);this.artDisplays.push(art);}
 this.input.addPointer(4);this.hudCache='';this.lastBroadcast=0;this.trailClock=[0,0];initializeRoster();$('#start').disabled=false;$('#start').innerHTML='上 場 開 吵 <span>→</span>';}

 makeBackdrop(){
  this.arenaBackdrop=this.add.image(480,430,'arena-chamber').setOrigin(.5,.76).setDepth(-10);
  this.ambient=this.add.graphics().setDepth(-9);this.itemGraphics=this.add.graphics().setDepth(2);
  this.reducedMotion=!!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
 }
 updateBackdrop(time,frame){
  const b=backgroundFrame(this.scale.width,this.scale.height,frame);this.arenaBackdrop.setPosition(b.x,b.y).setDisplaySize(b.width,b.height);
  const g=this.ambient;g.clear();for(const p of ambientPaper(time,this.reducedMotion)){g.fillStyle(0xfff9dc,p.alpha);g.fillRect(p.x,p.y,7,4);g.lineStyle(1,0x8f7759,p.alpha);g.lineBetween(p.x,p.y+4,p.x+7,p.y+4);}
 }
 drawStageItems(time){
  const g=this.itemGraphics;g.clear();for(const item of duel.items||[]){
   const falling=item.state==='falling';g.lineStyle(2,falling?0xe4ae46:0x3c8b80,falling?.65:.5);g.strokeEllipse(item.x,GROUND+1,48,12);
   if(falling){g.lineStyle(1,0xe4ae46,.3);g.lineBetween(item.x,item.y+15,item.x,GROUND-8);}
   drawComicItem(g,item.kind,item.x,item.y-15,1,falling?Math.sin(time*.004)*.2:0);
  }
  for(const f of [duel.player,duel.enemy]){
   if(performanceGuardActive(f)){g.lineStyle(3,0xedba50,.8);g.strokeEllipse(f.x,GROUND+2,97,18);}
  }
  const held=duel.player.item,enemyHeld=duel.enemy.item,name=k=>STAGE_ITEMS[k]?.label||'道具';
  const status=held?'你持有'+name(held.kind)+' · 按攻擊丟出':duel.items?.some(i=>i.state==='falling')?'道具要來了！走近自動拿':duel.items?.some(i=>i.state==='ground')?'走近拿道具 · 攻擊鍵投擲':'隨機掉落道具 · 走近自動拿';
  const nearest=(duel.items||[]).filter(i=>i.state==='ground').sort((a,b)=>Math.abs(a.x-duel.player.x)-Math.abs(b.x-duel.player.x))[0];
  const direction=!held&&nearest?' · '+(nearest.x<duel.player.x?'←':'→'):'';
  const copy=status+direction+(enemyHeld?'｜AI拿著'+name(enemyHeld.kind):'');if(copy!==this.itemHudCopy){this.itemHudCopy=copy;$('#item-status').textContent=copy;$('#item-status').classList.toggle('has-item',!!held);const punch=$('.punch');punch.querySelector('span').textContent=held?'投擲':'攻擊';punch.querySelector('small').textContent=held?name(held.kind):'按住連打';}
 }
 drawFighter(g,f,time,i){
  const texture=this.artCanvases[i],ctx=texture.getContext();ctx.clearRect(0,0,512,384);ctx.save();ctx.translate(256,350);
  const record=retainSpitEpisode(this.spitStart.get(f),f,time);if(!record)this.spitStart.delete(f);
  const spit=activeSpitAge(f,time,record?.time);
  const renderF=f.attack?.kind==='item_throw'?{...f,attack:{...f.attack,kind:'punch',variant:'right'}}:f;
  const pose=drawFighterArt(ctx,this.artImages,renderF,time,{spit,impact:record?.impact,shadow:false});this.lastArtPose.set(f,pose);ctx.restore();
  const rig=this.rigs[i];rig.setPosition(f.x,f.y);rig.setScale(f.face,1);rig.setRotation(0);rig.setAlpha(f.flash>0&&Math.sin(time*.09)>0?.68:1);
  if(f.type==='wang'&&pose.roll>.6&&time-this.trailClock[i]>110){this.trailClock[i]=time;const ghost=this.add.image(f.x-f.face*40,f.y-95,'wang-roll').setDisplaySize(112,112).setAlpha(.16).setFlipX(f.face<0).setRotation(pose.rollAngle*f.face);this.tweens.add({targets:ghost,alpha:0,duration:180,onComplete:()=>ghost.destroy()});}
 }
 drawProjectiles(time,g){
  let used=0,labels=0;
  const sprite=(frame,x,y,w,h,rotation=0,alpha=1,atlas='art-props',flipX=false)=>{let im=this.propPool[used];if(!im){im=this.add.image(0,0,atlas,frame).setDepth(3);this.propPool.push(im);}used++;im.setTexture(atlas,frame).setPosition(x,y).setDisplaySize(w,h).setRotation(rotation).setFlipX(flipX).setAlpha(alpha).setVisible(true);};
  const label=(x,y,copy,color='#fff8e8',size=16)=>{let t=this.markerPool[labels];if(!t){t=text(this,0,0,'',size,color).setOrigin(.5).setDepth(4).setStroke('#142b32',3);this.markerPool.push(t);}labels++;t.setPosition(x,y).setText(copy).setColor(color).setFontSize(size).setVisible(true);};
  for(const q of duel.obstacles||[]){if(q.dead)continue;g.lineStyle(5,0xab4e3c,.9);g.lineBetween(q.x-35,GROUND-2,q.x+35,GROUND-2);sprite('queue',q.x,GROUND-37,92,74,0,Math.min(1,q.life*3),'signature-props');label(q.x,GROUND-87,'地面攔停','#ffe0ab',15);}
  const holder=[duel.player,duel.enemy].find(f=>f.grabPose>0),held=[duel.player,duel.enemy].find(f=>f.grabbedPose>0);
  if(holder&&held){const wrist=f=>{const p=this.lastArtPose.get(f);return {x:f.x+f.face*((p?.arm.wrist.x??33)+(p?.bodyX??0)),y:f.y+(p?.arm.wrist.y??-133)+(p?.bodyY??0)}};const a=wrist(holder),b=wrist(held);sprite('clasp',(a.x+b.x)/2,(a.y+b.y)/2,Math.hypot(b.x-a.x,b.y-a.y)+8,23,Math.atan2(b.y-a.y,Math.abs(b.x-a.x)),1,'handshake-grip',holder.face<0);}
  for(const p of duel.projectiles){
   const direction=p.vx<0?-1:1;
   if(p.kind==='paper'||p.kind==='rubber_duck'){drawComicItem(g,p.kind,p.x,p.y,1.05,p.kind==='paper'?time*.008:Math.sin(time*.013)*.12);}
   else if(p.kind==='coin'){for(let j=2;j>=0;j--)sprite('coin',p.x-direction*j*19,p.y,26,27,time*.006,j===0?1:.21);}
   else if(p.kind==='dream'){sprite('dream',p.x,p.y,42,27,Math.sin(time*.008)*.06,1,'signature-props',p.vx<0);if(p.phase==='return')label(p.x,p.y+28,'↶ 回程','#d0f4d9',15);}
   else if(p.kind==='arrow'||p.kind==='word'){
    const word=p.kind==='word',width=word?92:110,color=word?0x367e8a:0xbe4033;
    g.lineStyle(3,color,.9);g.strokeEllipse(p.targetX,GROUND,width,19);g.fillStyle(color,.13);g.fillEllipse(p.targetX,GROUND,width,15);
    label(p.targetX,GROUND+16,word?'落字':'落箭',word?'#295e66':'#893b2c',15);
    if(word){g.fillStyle(0xfff7e5,.95);g.fillRoundedRect(p.x-26,p.y-18,52,36,8);g.lineStyle(3,color);g.strokeRoundedRect(p.x-26,p.y-18,52,36,8);label(p.x,p.y,'祥?!','#c8f6f0',19);}
    else{const v=arrowPresentation(p);sprite('arrow',v.x,v.y,v.width,v.height,v.angle);}
   }
   if(p.reflected){g.lineStyle(2,0xe8bc4a,.8);g.strokeCircle(p.x,p.y,21);label(p.x,p.y+32,'↶ 反射','#ffe2a4',15);}
   if((p.kind==='coin'||p.kind==='dream')&&(p.age||0)<.11){g.lineStyle(2,0xb2a179,.55);g.lineBetween(p.owner.x+p.owner.face*48,p.owner.y-206,p.x,p.y);}
  }
  for(let i=used;i<this.propPool.length;i++)this.propPool[i].setVisible(false);
  for(let i=labels;i<this.markerPool.length;i++)this.markerPool[i].setVisible(false);
 }

 popup(x,y,word,color='#fff8dd',size=24){
  let t=this.textPool.find(v=>!v.visible);if(!t){if(this.textPool.length<24){t=text(this,x,y,word,size,color).setOrigin(.5).setDepth(6);this.textPool.push(t);}else t=this.textPool.reduce((a,b)=>a.popupStarted<b.popupStarted?a:b);}
  this.tweens.killTweensOf(t);t.popupStarted=this.time.now;t.setPosition(x,y).setText(word).setFontSize(size).setColor(color).setStroke('#142b32',4).setRotation(0).setScale(1).setAlpha(1).setVisible(true);
  this.tweens.add({targets:t,y:y-24,alpha:0,duration:680,ease:'Cubic.Out',onComplete:()=>t.setVisible(false)});
 }

 banner(copy,fictional=true){const el=$('#broadcast');el.textContent=copy;const note=document.createElement('small');note.textContent=fictional?'語錄／迷因改編 · 動作虛構 · 音訊狀態見來源':'來源語句 · 招式效果虛構';el.append(note);el.classList.remove('hidden');this.lastBroadcast=this.time.now;}
 wordBlast(f,word){this.popup(f.x,f.y-150,word,'#fff0be',Math.min(24,Math.floor(210/Math.max(1,[...word].length))))}

 event(e){
  if(e.type==='move'){
   this.spitStart.delete(e.f);const cast=CAST[e.f.type],kind=e.kind||e.f.attack?.kind,view=movePresentation(e.f,kind);
   if(sound&&voiceEnabled&&voiceChannels.canPlay(e.f.id||'player')&&voiceCues.schedule(e.f,kind))playConfiguredVoice(kind,false,e.f);
   this.popup(e.f.x,e.f.y-190,moveCue(kind),MOVE_READABILITY[kind]?.color||cast.colorCSS,20);
   if(kind?.includes('_')){this.wordBlast(e.f,view.word);this.banner(view.banner,view.fictional);}
   else if(['rush','counter'].includes(kind))this.banner(view.banner);
   if(kind?.includes('_'))sfx(kind);
  }
  if(['hit','block'].includes(e.type)){const hitY=impactY(e);this.popup(e.to.x,hitY-14,e.type==='block'?'擋住了':e.impact==='item_rubber_duck'?'嘎！':e.impact==='item_paper'?'紙花！':e.combo>1?`${e.combo} 連段！`:'啪！',e.type==='block'?'#a7ece3':'#fff6c9',e.combo>1?29:36);this.popup(e.to.x+40,e.to.y-220,'−'+e.amount,'#fff6c9',22);if(e.type==='hit'&&!this.reducedMotion)this.cameras.main.shake(95,.005);const sparks=this.add.graphics();sparks.lineStyle(5,0xffdc65);for(let i=0;i<9;i++){const a=i*Math.PI/4.5;sparks.lineBetween(e.to.x+Math.cos(a)*20,hitY+Math.sin(a)*20,e.to.x+Math.cos(a)*59,hitY+Math.sin(a)*59);}this.tweens.add({targets:sparks,alpha:0,duration:200,onComplete:()=>sparks.destroy()});sfx(e.type);}
  else if(e.type==='counter'){const legacy=e.f.type==='wang',move=CAST[e.f.type].moves.find(m=>m.kind===e.kind||m.behavior==='counter');this.wordBlast(e.f,legacy?'游刃有餘':move?.name||'反擊成功');this.banner(legacy?'從容不是慢，是等你先出糗。':'笑容沒收起，攻勢先化解。');sfx('counter');}
  else if(e.type==='counterMiss'){this.popup(e.f.x,e.f.y-255,e.f.type==='wang'?'從容失敗':'等太久了','#bddfe1',23);sfx('whiff');}
  else if(e.type==='spit'){const p=this.lastArtPose.get(e.f);this.spitStart.set(e.f,{time:this.artTime,impact:p?{wrist:{x:p.arm.wrist.x,y:p.arm.wrist.y-p.bob},headAngle:p.headAngle}:null});this.banner('水還沒喝到，先喝了一拳。');sfx('spit');}
  else if(e.type==='heal'){this.popup(e.f.x,e.f.y-245,'喝到了！ +'+(e.amount??10),'#a5f0bc',28);this.banner('這杯水，喝得很有戰術。');sfx('heal');}
  else if(e.type==='arrowMark'){this.popup(e.x,GROUND-34,'離開落點！','#ffe0a1',20);}
  else if(e.type==='arrowMiss'){this.banner('人沒射到，地板先中箭。');const flag=text(this,e.x,GROUND-45,'↙ 沒中',22,'#fff6df');flag.setText('沒中 ↙').setFontSize(22).setStroke('#142b32',4);this.tweens.add({targets:flag,alpha:0,duration:900,onComplete:()=>flag.destroy()});sfx('whiff');}
  else if(e.type==='guardBreak'){this.popup(e.f.x,e.f.y-205,'破防！','#ffbb96',29);this.banner('擋太久，耐力先破了。');sfx('block');}
  else if(e.type==='reflect'){this.popup(e.f.x,e.f.y-272,'拒收，原路退回！','#ffe1a1',22);sfx('counter');}
  else if(e.type==='reject'){this.popup(e.f.x,e.f.y-185,'不欠你，擋回去！','#e4c8ef',22);sfx('block');}
  else if(e.type==='erase'){this.popup(e.f.x,e.f.y-250,'咳掉了！','#e1d9c4',20);sfx('whiff');}
  else if(e.type==='capture'){this.popup((e.from.x+e.to.x)/2,Math.min(e.from.y,e.to.y)-285,'謝謝指教，請往後。','#f4d58c',23);sfx('hit');}
  else if(e.type==='queuePlant'){this.popup(e.f.x+e.f.face*85,GROUND-110,'先排隊！','#ffd9a6',21);}
  else if(e.type==='queueBreak'){this.popup(e.x,GROUND-90,'隊線散了','#f4d4b1',19);}
  else if(e.type==='armor'){this.popup(e.f.x,e.f.y-270,'這一拳，我吃！','#b8f0ed',21);}
  else if(e.type==='armorAbsorb'){this.popup(e.f.x,e.f.y-240,'痛，但不停手','#b8f0ed',21);sfx('block');}
  else if(e.type==='calm'){this.popup(e.f.x,e.f.y-250,'大事化小…','#d4efd6',22);}
  else if(e.type==='wallBounce'){this.popup(e.f.x,e.f.y-230,'牆也聽到了！','#e4c8ef',22);sfx('hit');}
  else if(e.type==='slow'){this.popup(e.f.x,e.f.y-220,'被字絆一下','#bbe5e4',21);}
  else if(e.type==='itemPickup'){this.banner((e.f.id==='player'?'你':'AI')+'拿到'+(e.item.kind==='rubber_duck'?'吱吱鴨':'紙團')+'！');sfx('heal');}
  else if(e.type==='itemThrow'){this.banner(e.kind==='rubber_duck'?'橡皮鴨出勤，嘎！':'紙團出動，請收件！');}
  else if(e.type==='performanceGuard'){this.popup(e.f.x,e.f.y-280,'讓我演完這一下！','#ffe29a',18);sfx('block');}
  else if(e.type==='over')result();else if(['launch','jump'].includes(e.type))sfx(e.type);
 }

 update(time,delta){if(!this.dynamic)return;const dt=Math.min(delta/1000,.1);this.artTime=(this.artTime||0)+(['active','menu','countdown'].includes(duel.status)?dt*1000:0);if(duel.status==='active'){punchWait-=dt;if(hold.punch&&punchWait<=0){duel.press('punch');punchWait=.33;}const n=Math.max(1,Math.ceil(dt/(1/60)));for(let j=0;j<n;j++)duel.step(dt/n,hold);for(const e of duel.events.splice(0))this.event(e);drainVoiceCues();}if(this.time.now-this.lastBroadcast>1700)$('#broadcast').classList.add('hidden');
  const fs=[duel.player,duel.enemy];const sw=this.scale.width,sh=this.scale.height,cam=this.cameras.main,frame=cameraFrame(sw,sh,fs,this.cameraDuel===duel?this.cameraView:null);this.cameraDuel=duel;this.cameraView=frame;cam.setViewport(0,0,sw,sh);cam.setZoom(frame.zoom);cam.centerOn(frame.x,frame.y);this.updateBackdrop(this.artTime,frame);this.drawStageItems(this.artTime);fs.forEach((f,i)=>this.drawFighter(this.chars[i],f,this.artTime,i));let g=this.dynamic;g.clear();
  for(const f of fs){if(f.attack?.kind==='su_rush'&&[.22,.42,.62].some(a=>f.attack.age>=a&&f.attack.age<a+.1)){g.lineStyle(6,0xc48230,.8);g.strokeEllipse(f.x+f.face*54,GROUND-16,92,26);g.lineStyle(3,0xffe2a8,.8);g.lineBetween(f.x-f.face*20,GROUND-12,f.x+f.face*105,GROUND-12);}
   const scale=1-Math.min(.25,Math.max(0,GROUND-f.y)/560);g.fillStyle(ink,.16);g.fillEllipse(f.x,GROUND+1,88*scale,14*scale);}
  this.drawProjectiles(this.artTime,g);
  const stamp=[fs[0].type,fs[1].type,Math.ceil(fs[0].hp),Math.ceil(fs[1].hp),Math.ceil(duel.remaining)].join(':');if(stamp!==this.hudCache){this.hudCache=stamp;$('#p-name').textContent=CAST[fs[0].type].name;$('#e-name').textContent=CAST[fs[1].type].name;$('#p-hp').textContent=Math.ceil(fs[0].hp);$('#e-hp').textContent=Math.ceil(fs[1].hp);$('#p-fill').style.width=fs[0].hp+'%';$('#e-fill').style.width=fs[1].hp+'%';$('#p-fill').style.background=CAST[fs[0].type].colorCSS;$('#e-fill').style.background=CAST[fs[1].type].colorCSS;$('#timer').textContent=String(Math.ceil(duel.remaining)).padStart(2,'0');$('#timer').style.color=duel.remaining<10?'#ffa675':'';}
  const guardStamp=fs.map(f=>{const v=guardView(f);return [v.pips,v.broken,combatStatus(f),performanceGuardActive(f),f.item?.kind].join(':')}).join('|');
  if(guardStamp!==this.guardCache){this.guardCache=guardStamp;for(const [i,prefix] of ['p','e'].entries()){const f=fs[i],v=guardView(f),el=$('#'+prefix+'-guard');el.classList.toggle('broken',v.broken);el.setAttribute('aria-label',v.label);el.querySelector('small').textContent=v.label;[...el.querySelectorAll('i')].forEach((pip,j)=>pip.classList.toggle('empty',j>=v.pips));$('#'+prefix+'-status').textContent=combatStatus(f)+(performanceGuardActive(f)?' · 扛一次':'')+(f.item?' · 持有'+STAGE_ITEMS[f.item.kind].label:'');}}
  fs.forEach((f,i)=>{const status=combatStatus(f),t=this.statusTexts[i];t.setText(status).setPosition(f.x,f.y-192).setVisible(!!status&&!f.attack);if(f.armor>0){g.lineStyle(3,0x5baab6,.65);g.strokeRoundedRect(f.x-53,f.y-275,106,274,25);}if(f.slow>0){g.lineStyle(3,0x43858b,.8);g.strokeEllipse(f.x,f.y-6,77,17);}});
  CAST[selected].moves.forEach((m,i)=>{renderCooldownButton($(`[data-action="special${i+1}"]`),m,duel.player.cooldowns[i]);});
 }

}
try{new Phaser.Game({type:Phaser.CANVAS,parent:'game',width:960,height:540,backgroundColor:'#e7e0c9',antialias:true,roundPixels:false,scene:Arena,audio:{noAudio:true},scale:{mode:Phaser.Scale.RESIZE,autoCenter:Phaser.Scale.NO_CENTER},fps:{target:60,forceSetTimeOut:false},render:{powerPreference:'low-power'},callbacks:{}});}catch(e){$('#menu').innerHTML='<div class="paper"><h2>畫面尚未載入</h2><p>請重新整理頁面。此遊戲需要可使用 Canvas 的瀏覽器。</p></div>';console.error(e);}

// Visible diagnostics for this regression; only appended to a temporary QA copy.
const qaTrace=document.createElement('pre');qaTrace.id='qa-idle-trace';qaTrace.style='position:fixed;right:2px;bottom:0;max-height:90px;max-width:100%;overflow:auto;background:#fff9;font:10px monospace;color:#123;z-index:60;pointer-events:none';document.body.append(qaTrace);let qaLines=[],qaClock=0;setInterval(()=>{if(duel.status!=='active'||!scene?.cameraView)return;const c=scene.cameraView,w=scene.scale.width,f=duel.player;const row={t:+duel.elapsed.toFixed(2),world:+f.x.toFixed(2),screen:+(w/2+(f.x-c.x)*c.zoom).toFixed(2),move:f.move,hp:f.hp,enemy:+duel.enemy.x.toFixed(2),inputs:JSON.stringify(hold),held:f.item?.kind||null};qaLines.push(row);if(qaLines.length>30)qaLines.splice(20,1);qaTrace.textContent=JSON.stringify(qaLines);},100);
