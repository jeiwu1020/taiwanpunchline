import {mountChapterComicReader} from '../campaign/chapter-comic-reader.mjs?v=comic-reader-r1';
import {drawChallengeSignatureProjectile} from '../../challenge-signature-projectile.mjs?v=chapter-upgrade-r1';
import {drawChapterEncounter} from '../../chapter-encounter-art.mjs?v=chapter-upgrade-r1';
import {registerQuickView} from '../quick-view/hook.mjs?v=quick-view-20261113-r1';
import {drawChapterStreetMotifs} from '../campaign/chapter-street-motifs.mjs?v=campaign-boot-20261112-r3';
import {streetActorNeedsPaint} from '../../street-actor-visibility.mjs?v=campaign-boot-20261112-r3';
import {backgroundPresentation} from '../../background-cache-policy.mjs?v=campaign-boot-20261112-r3';
import {planSimulationFrame} from '../../simulation-frame.mjs?v=campaign-boot-20261112-r3';
import {invalidateStreetStaticCaches} from '../campaign/street-static-cache.mjs?v=campaign-boot-20261112-r3';
import {mountChapterPauseLifecycle} from '../campaign/chapter-pause-lifecycle.mjs?v=campaign-boot-20261112-r3';
import {createChapterMedia} from '../campaign/chapter-media.mjs?v=campaign-boot-20261112-r3';
import {createMobileCameraAdapter} from '../campaign/mobile-camera-adapter.mjs?v=campaign-boot-20261112-r3';
import {mountChapterInterface,chapterKeyboardAction} from '../campaign/chapter-ui.mjs?v=campaign-boot-20261112-r3';
import {mountSpecialNameFit} from '../../special-name-fit.mjs?v=campaign-boot-20261112-r3';
import {mountCampaignTouch} from '../campaign/touch-policy.mjs?v=campaign-boot-20261112-r3';
import {chapterAssetURL} from '../shared-asset-urls.mjs?v=campaign-boot-20261112-r3';
import {mountContinuationControls,renderContinuationChoice} from '../campaign/page-bridge.mjs?v=campaign-boot-20261112-r3';
import {drawStreetBackdrop,SKY_EXTENSION_FILES,STREET_SEAM_FILES} from './street-backdrop.mjs?v=campaign-boot-20261112-r3';
import {installChaseWindow} from '../later-chase-window.mjs?v=campaign-boot-20261112-r3';
import {CAST,Duel,GROUND} from './core.mjs?v=campaign-boot-20261112-r3';
import {ART_FILES,drawFighterArt,drawProp} from './art-render.mjs?v=campaign-boot-20261112-r3';
import {drawChallengeMob,drawChallengeStreetProp,drawChallengeSupply} from './challenge-art.mjs?v=campaign-boot-20261112-r3';
import {drawChapter2Miniboss} from './chapter2-mob-art.mjs?v=campaign-boot-20261112-r3';
import {streetTrialFrame,containSprite} from './street-trial-view.mjs?v=campaign-boot-20261112-r3';
import {DESK} from './stage-expansion.mjs?v=campaign-boot-20261112-r3';
import {chapter2RenderActor,chapter2TableFrame,chapter2ObstacleFrame,chapter2SceneLayers,drawChapter2TableLayer} from './chapter2-render-rules.mjs?v=campaign-boot-20261112-r3';
import {arrowPresentation} from './art-motion.mjs?v=campaign-boot-20261112-r3';
import {bindTouchControls} from './touch-controls.mjs?v=campaign-boot-20261112-r3';
import {createPlayableChapter} from './chapter2-controller.mjs?v=campaign-boot-20261112-r3';
import {CHAPTER2,CHARACTER_NAMES} from './chapter2-content.mjs?v=campaign-boot-20261112-r3';
import {ASSET_FILES} from './chapter2-assets.mjs?v=campaign-boot-20261112-r3';
import {CHAPTER2_NEW_ART} from './chapter2-new-art.mjs?v=campaign-boot-20261112-r3';
import {storyPropState} from './chapter3-story-props.mjs?v=campaign-boot-20261112-r3';
import {bossRevealed,storyActors,soloMicX} from './chapter2-reveal.mjs?v=campaign-boot-20261112-r3';
mountCampaignTouch({document,window});
const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)],canvas=$('#game-canvas'),ctx=canvas.getContext('2d');
let images={},chapter=null,selected='wang',uiToken='',held={},keys=new Set(),pointers=new Set(),controls=null,punchWait=0,lastTime=null,sound=false,audio=null,caption='',captionUntil=0,frameTime=0;
const chaseWindow=installChaseWindow({document,chapter:3});
let idle=new Duel('wang','beginner',()=>.3,'wang');
let storyStartedAt=0;
const mobileCamera=createMobileCameraAdapter();
let ui,continuation,comicReader;
const media=createChapterMedia({document,window,getSettings:()=>ui?.preferences,getImages:()=>images,onState:s=>ui?.mediaState(s)});
ui=mountChapterInterface({document,window,cast:CAST,media,clearHold,surfaceContext:ctx,onSurfaceReset:()=>invalidateStreetStaticCaches(ctx),canUse:id=>(v()?.unlocked||['wang','han','huang','su']).includes(id),isBusy:()=>!!continuation?.busy,isOperationBusy:()=>!!continuation?.operationBusy,onPrepare:()=>continuation?.openPreparation({readOnly:true}),onReturnOverview:()=>continuation?.returnOverview({confirmed:true}),onRestart:async()=>{media.unlock();clearHold();const current=chapter,s=v();if(!current||!s?.paused)return false;const result=await current.restartSegment(s.token);if(chapter!==current)return false;if(result===true||result?.accepted&&result?.persisted){if(ui.shouldKeepPausedAfterRestart)current.setPaused(true,current.view().token);sync();ui.syncMedia({restart:true});}else sync();return result;},getCharacter:()=>v()?.characterId||selected,getExitState:()=>v()??continuation?.exitState,onViewportChange:({frame,epoch})=>resizeCanvas(),onCameraChange:()=>{if(!v()?.paused)mobileCamera.reset();},onSound:(enabled)=>{sound=enabled;},pauseForUI:purpose=>{const current=chapter,wasActive=active();if(wasActive&&chapter.setPaused(true,v().token))sync();clearHold();return()=>{if(purpose!=='settings'&&wasActive&&chapter===current&&v()?.paused&&pauseLifecycle.resume())sync();};}});
const pauseLifecycle=mountChapterPauseLifecycle({document,window,getChapter:()=>chapter,isPending:()=>!!continuation?.operationBusy,clearHold,onChange:()=>sync(),onFrameReset:()=>{lastTime=null;}});
ui.setCameraAvailable(true);
mountSpecialNameFit({document});
comicReader=mountChapterComicReader({document,getChapter:()=>chapter,onChange:sync,onAudio:tone,isBlocked:()=>!!ui?.busy});
function v(){return chapter?.view();}
function active(){const s=v();return s&&!pauseLifecycle.blocked&&!s.paused&&!s.blocked&&!s.busy&&!ui?.busy&&ui?.ready!==false&&['route','battle'].includes(s.mode);}
function recalc(){held={};for(const k of keys){const a=chapterKeyboardAction(k,v()?.mode==='route');if(a)held[a]=true;}for(const a of pointers)held[a]=true;}
function clearHold(){keys.clear();pointers.clear();held={};punchWait=0;controls?.clear();}
function tone(){media.unlock();}
function shout(copy){caption=copy;captionUntil=performance.now()+1500;$('#caption').textContent=copy;}
function command(action){const s=v();if(!active())return false;const accepted=chapter.press(action,s.token);if(action==='punch')punchWait=.35;return accepted;}
function portrait(id){return chapterAssetURL('chapter3',CAST[id].portrait.replace(/^assets\//,''));}
function roster(root,ids,choice,onSelect){root.replaceChildren(...ids.map(id=>{const b=document.createElement('button');b.type='button';b.dataset.character=id;b.setAttribute('aria-pressed',String(id===choice));const im=document.createElement('img');im.src=portrait(id);im.alt='';const name=document.createElement('b');name.textContent=CAST[id].name;b.append(im,name);b.onclick=()=>onSelect(id);return b;}));}
function refreshMenu(){roster($('#menu-roster'),['wang','han','huang','su'],selected,id=>{selected=id;idle=new Duel(id,'beginner',()=>.3,'wang');refreshMenu();});}
function sync(){
 pauseLifecycle.sync();const s=v();if(!s)return;chaseWindow.paint({active:s.mode==='route'&&!s.paused,image:images['opening-props-v75'],time:frameTime});if(uiToken!==s.token)storyStartedAt=frameTime;uiToken=s.token;clearHold();ui.refreshAccess();if(!s.paused&&!ui.busy)ui.cancelRestart(false);const noncombat=!['route','battle'].includes(s.mode)||s.paused||s.blocked||s.busy;document.body.dataset.noncombat=String(noncombat);document.body.dataset.chapterMode=s.paused?"pause":s.mode;
 for(const id of ['menu','story-panel','result-panel','pause-panel','choice-panel'])$('#'+id).hidden=true;
 $('#pause').disabled=!['route','battle'].includes(s.mode);$('#pause').textContent=s.paused?'▶ 繼續':'Ⅱ 暫停';
 $('#fighter-name').textContent=CAST[s.characterId].name;
 for(const [i,b] of $$('#specials button').entries())b.querySelector('.move-copy strong').textContent=CAST[s.characterId].moves[i].name;
 idle=new Duel(s.characterId,'beginner',()=>.3,bossRevealed(s)&&s.characterId!=='ko'?'ko':'wang');
 if(s.mode==='story'){
  $('#story-panel').hidden=false;$('#story-count').textContent=`${s.frameIndex+1} / ${s.frameCount}`;$('#story-speaker').textContent=s.storyFrame.speaker;$('#story-title').textContent=s.storyFrame.title;$('#story-copy').textContent=s.storyFrame.copy;
  $('#story-next').textContent=s.frameIndex===s.frameCount-1?'出發 →':'下一格 →';const token=s.token;$('#story-next').onclick=()=>{if(!ui.busy&&chapter.nextStory(token)){tone();sync();}};
 }else if(s.mode==='result'){
  $('#result-panel').hidden=false;$('#result-title').textContent=s.result.winner==='player'?(s.result.matchWon?'這一關，借過了！':'先拿一局！'):s.result.winner==='draw'?'平手，再比一次':'這局先喘口氣';
  $('#result-copy').textContent=s.result.kind==='route'?'倒下不會倒退章節，從目前路段再試一次。':`${s.stepId==='boss'?'三戰兩勝 · ':''}你 ${s.rounds.player}：${s.rounds.enemy} 對手${s.result.matchWon&&s.stepId==='boss'?' · 柯P加入！':''}`;
  $('#result-next').textContent=s.result.matchLost?'重試這一關':s.result.matchWon?'繼續追麥 →':'下一局 →';const token=s.token;$('#result-next').onclick=()=>{media.unlock();if(!ui.busy&&chapter.continueResult(token))sync();};
 }else if(s.mode==='choice'||s.mode==='complete'){
  $('#choice-panel').hidden=false;const token=s.token,choiceRoster=$('#choice-roster');choiceRoster.replaceChildren();choiceRoster.hidden=s.mode==='complete'||!!s.campaignChapterId;if(!choiceRoster.hidden){const prepare=document.createElement('button');prepare.type='button';prepare.textContent='調整下一段出戰準備';prepare.onclick=()=>continuation.openPreparation();choiceRoster.append(prepare);}
  $('#choice-title').textContent=s.mode==='complete'?'神麥往下一站去了':'柯P加入！';$('#choice-copy').textContent=s.mode==='complete'?'第三章已打通。第四章入口已保留，回挑戰總覽，接著追麥。':'選好接下來的主角，跟著音響車追神麥。下一站，繼續追麥。';$('#chapter-next').hidden=s.mode==='complete';$('#chapter-next').onclick=()=>{if(!ui.busy&&chapter.finishChapter(token))sync();};
 }
 renderContinuationChoice({document,state:s,chapterId:'chapter-3'});continuation.render();
 if(s.paused){$('#pause-panel').hidden=false;const token=s.token;$('#pause-roster').replaceChildren();$('#pause-roster').hidden=true;$('#resume').onclick=()=>{media.unlock();if(!ui.busy&&pauseLifecycle.resume())sync();};}
 comicReader?.sync();ui.syncMedia();ui.invalidateGeometry?.();resizeCanvas();
}
function togglePause(){const s=v();if(!s||ui.busy)return;media.unlock();if(s.paused?pauseLifecycle.resume():chapter.setPaused(true,s.token))sync();}
$('#pause').onclick=togglePause;
$('#start').onclick=()=>{media.unlock();chapter=createPlayableChapter({characterId:selected,difficulty:$('#difficulty').value});sync();};
function resizeCanvas(){return ui.prepareSurface();}

window.addEventListener('keydown',e=>{
 if(e.target?.closest?.('dialog,select,input,textarea,[contenteditable],[data-game-select],.game-select-menu'))return;if(e.target?.closest?.('button')&&['Space','Enter'].includes(e.code))return;
 if(e.code==='Escape'){if(!e.repeat)togglePause();return;}const a=chapterKeyboardAction(e.code,v()?.mode==='route');if(!a||!active())return;e.preventDefault();if(e.repeat||keys.has(e.code))return;keys.add(e.code);recalc();if(!['up','down','left','right','guard','crouch'].includes(a))command(a);
});window.addEventListener('keyup',e=>{keys.delete(e.code);recalc();});
controls=bindTouchControls({document,window,active,viewport:()=>({ready:ui.ready,epoch:ui.epoch,rotation:ui.viewport.rotation}),rotation:()=>ui.viewport.rotation,directionMode:()=>v()?.mode==='route'?'depth':'duel',stickSelector:'#touch-stick',knobSelector:'#touch-knob',buttonSelector:'#controls button',onHold:(a,on)=>{on?pointers.add(a):pointers.delete(a);recalc();},onAction:command});
for(const b of $$('#controls button')){
 b.addEventListener('keydown',e=>{if(!['Enter',' '].includes(e.key)||!active())return;e.preventDefault();if(!e.repeat){if(b.dataset.hold){pointers.add(b.dataset.hold);recalc();if(b.dataset.hold==='punch')command('punch');}else if(b.dataset.action)command(b.dataset.action);}});
 b.addEventListener('click',e=>{if(e.detail===0&&active()&&!b.disabled){const action=b.dataset.action||(b.dataset.hold==='punch'?'punch':null);if(action)command(action);}});
 const release=()=>{pointers.delete(b.dataset.hold);recalc();};b.addEventListener('keyup',e=>{if(['Enter',' '].includes(e.key)){e.preventDefault();release();}});b.addEventListener('blur',release);
}

function routeIndex(s){return !s||s.stepId==='entry'||s.stepId==='route-a'||s?.stepId==='miniboss-a'?0:s?.stepId==='route-b'||s?.stepId==='miniboss-b'?1:2;}
function paintBackdrop(im,f,w,h,curb=700,scene=routeIndex(v())){const result=drawStreetBackdrop(ctx,im,{...f,presentation:backgroundPresentation(w,h,ui.cameraOptions)},w,h,curb,images['chapter3-sky-'+scene],images['chapter3-seam-'+scene],scene,images['chapter3-edge-'+scene]);drawChapterStreetMotifs(ctx,images['chapter-street-motifs'],f,{chapter:3,route:routeIndex(v()),worldWidth:CHAPTER2.routes[routeIndex(v())].width,width:w});return result;}
function actor(f,frame,time,alpha=1){f=chapter2RenderActor(f);const x=(f.x-frame.left)*frame.zoom,y=frame.base+(f.y-GROUND+(f.depth??0)*.65)*frame.zoom;ctx.save();ctx.translate(x,y);ctx.scale(frame.zoom*(f.face||1),frame.zoom);ctx.globalAlpha=alpha;if(f.mobKind?.startsWith('mini_'))drawChapter2Miniboss(ctx,images,f,time,{shadow:false});else if(f.mobKind)drawChallengeMob(ctx,images,f,time,{shadow:false});else drawFighterArt(ctx,images,f,time,{shadow:false});ctx.restore();}
function label(copy,x,y,size=20,color='#fff3ce'){ctx.font=`900 ${size}px Microsoft JhengHei,system-ui`;ctx.textAlign='center';ctx.strokeStyle='#17353a';ctx.lineWidth=4;ctx.strokeText(copy,x,y);ctx.fillStyle=color;ctx.fillText(copy,x,y);}
function microphone(x,y,size=58,angle=-.3){const im=images['opening-props-v75'];if(!im)return;ctx.save();ctx.translate(x,y);ctx.rotate(angle);ctx.fillStyle='#fff5c6cc';ctx.strokeStyle='#bc8534';ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(0,-size*.55,size*.42,size*.68,0,0,Math.PI*2);ctx.fill();ctx.stroke();ctx.drawImage(im,1186,543,192,444,-size*.22,-size,size*.44,size);ctx.restore();}
function paintStory(s,w,h,time){
 const compact=h<480,portrait=w<h,f={left:0,base:portrait?Math.min(h*.59,Math.max(h*.42,w*.9)):h*(compact?.53:.59),zoom:Math.min(w/720,(h*(compact?.51:.55))/300)},shot=s?.storyFrame?.shot??'market-trail',scene=routeIndex(s),im=images[`chapter2-scene-${scene}`];paintBackdrop(im,f,w,h,CHAPTER2_NEW_ART.curbs[scene],scene);
 const prop=storyPropState(shot,{width:w,base:f.base,zoom:f.zoom,elapsed:Math.max(0,(time-storyStartedAt)/1000)});
 const cast=storyActors(s,selected),transport=['cart-catch','follow-cart'].includes(shot),p={...idle.player,x:(prop.playerX??w*(transport?.19:cast.length===1?.36:.3))/f.zoom,y:GROUND,depth:0,face:1};
 actor(p,f,time);
 if(cast[1]&&!transport){
  const enemy={...idle.enemy,type:cast[1].characterId,x:w*.7/f.zoom,y:GROUND,depth:0,face:-1};
  if(cast[1].mobKind){enemy.mobKind=cast[1].mobKind;enemy.displayName=s.storyFrame.title;}
  
  actor(enemy,f,time);
 }
 const {mic,standY,standHeight}=prop;
 if(prop.parade){const q=prop.parade;ctx.drawImage(images['chapter3-parade-float'],q.x,q.y,q.width,q.height);}
 if(prop.truck){const q=prop.truck;ctx.drawImage(images['chapter3-sound-truck'],q.x,q.y,q.width,q.height);}
 if(prop.staff){const sf={...f,zoom:f.zoom*prop.staff.scale},staff={...idle.player,type:'wang',mobKind:'leaflet',x:prop.staff.x/sf.zoom,y:GROUND+(prop.staff.y-f.base)/sf.zoom,depth:0,face:1,vx:60};actor(staff,sf,time);}
 if(prop.ribbon){const {start,end}=prop.ribbon;ctx.strokeStyle='#ba4a38';ctx.lineWidth=4*f.zoom;ctx.beginPath();ctx.moveTo(start.x,start.y);ctx.quadraticCurveTo((start.x+end.x)/2,end.y-45*f.zoom,end.x,end.y);ctx.stroke();}
 if(prop.carrier==='wheeled-stand'){
  ctx.strokeStyle='#4c443b';ctx.lineWidth=4*f.zoom;ctx.beginPath();ctx.moveTo(mic.x,mic.y);ctx.lineTo(mic.x,standY-6*f.zoom);ctx.moveTo(mic.x-20*f.zoom,standY-6*f.zoom);ctx.lineTo(mic.x+20*f.zoom,standY-6*f.zoom);ctx.stroke();
  ctx.fillStyle='#273235';for(const d of [-17,17]){ctx.beginPath();ctx.arc(mic.x+d*f.zoom,standY,5*f.zoom,0,Math.PI*2);ctx.fill();}
 }
 microphone(mic.x,mic.y,Math.max(34,48*f.zoom),prop.carrier==='ribbon'?.52:0);label('神麥',mic.x,mic.y+18,Math.max(12,16*f.zoom),'#ffe18b');
}
function draw(time,delta=1000/60){
 const w=canvas.clientWidth,h=canvas.clientHeight,s=v(),g=chapter?.world;ctx.clearRect(0,0,w,h);
 if(!s||s.mode==='story'||s.mode==='choice'||s.mode==='complete'){ui.clearCameraHints();paintStory(s,w,h,time);return;}
 if(!g){ui.clearCameraHints();return;}const route=!!g.depthMode,player=g.player,portrait=ui.viewport.width<ui.viewport.height;
 let f;if(route)f=streetTrialFrame({width:w,height:h,portrait,player,worldWidth:g.worldWidth});else{const spread=Math.abs(g.enemy.x-player.x),zoom=Math.min(portrait?w/660:w/1060,(h-(portrait?90:115))/390,w/(spread+340));f={zoom:Math.max(.3,zoom),left:Math.max(0,Math.min(960-w/Math.max(.3,zoom),(player.x+g.enemy.x)/2-w/Math.max(.3,zoom)/2)),base:portrait?h*.8:h-115};}
 f=mobileCamera.frame(f,g,{width:w,height:h,route,delta,paused:s.paused||g.status==='paused',...ui.cameraOptions});
 ui.renderCameraHints(f.cameraFrame,g,{route,active:!s.paused&&!s.blocked&&!s.busy&&g.status==='active'&&['route','battle'].includes(s.mode)});
 const sx=x=>(x-f.left)*f.zoom,sy=(y,z=0)=>f.base+(y-GROUND+z*.65)*f.zoom;
 const scene=routeIndex(s);paintBackdrop(images[`chapter2-scene-${scene}`],f,w,h,CHAPTER2_NEW_ART.curbs[scene],scene);
 const platforms=route?g.platforms:[{...DESK,depth:0,depthHalf:30}];
 const actors=route?[player,...g.enemies.filter(e=>e.hp>0||e.deadAge<.6)]:[player,g.enemy];
 for(const a of g.assists||[])actors.push({...a.actor,helper:true,alpha:a.phase==='exit'?Math.max(0,1-a.exitAge/a.exitDuration):a.phase==='warning'?.6:1});
 const paintActor=a=>!route||a===player||streetActorNeedsPaint(a,{left:f.left,right:f.left+w/f.zoom});
 const shadow=a=>{ctx.fillStyle=a===player?'#bd543c55':'#17353a33';ctx.beginPath();ctx.ellipse(sx(a.x),sy(route?(a.supportY??GROUND):GROUND,a.depth),38*f.zoom,8*f.zoom,0,0,Math.PI*2);ctx.fill();};
 for(const a of actors)if(paintActor(a)&&(!route||(a.supportY??GROUND)>=GROUND))shadow(a);
 const objects=chapter2SceneLayers(platforms,actors,route);
 drawChapterEncounter(ctx,g,(x,y=GROUND,z=0)=>({x:sx(x),y:sy(y,z)}),f.zoom,images);
 for(const o of objects)if(o.kind==='table-top'||o.kind==='table-front'){drawChapter2TableLayer(ctx,images,o,f);}else if(o.kind==='table-solid'){const p=o.p;drawChallengeStreetProp(ctx,images,'table',chapter2TableFrame(p,f,route));}else{const a=o.a;if(!paintActor(a))continue;if(route&&(a.supportY??GROUND)<GROUND)shadow(a);actor(a,f,time,a.alpha??(a.hp<=0?.4:a.invulnerable>0?.7:1));if(a.mobKind&&a.hp>0)label(a.warning>0?(a.chapterCaption??'要出手囉！'):a.displayName??a.name,sx(a.x),sy(a.y-300,a.depth),Math.max(13,18*f.zoom));}
 if(route){if(!g.supplyUsed)drawChallengeSupply(ctx,images,{x:sx(g.section.supplyX),y:sy(GROUND,g.section.supplyDepth),width:90*f.zoom});drawChallengeStreetProp(ctx,images,'sign',{x:sx(g.gateX),y:sy(GROUND,-90),width:85*f.zoom,height:110*f.zoom});label('前方開講 →',sx(g.gateX),sy(GROUND-145,-90),18*f.zoom);}
 for(const q of g.projectiles||[]){if(q.dead)continue;const qp=q.kind==='arrow'?arrowPresentation(q):q;ctx.save();ctx.translate(sx(qp.x),sy(qp.y,q.depth));ctx.scale(f.zoom,f.zoom);if(q.kind==='coin')drawProp(ctx,images,'coin',0,0,35,36,time*.008);else if(q.kind==='arrow')drawProp(ctx,images,'arrow',0,0,qp.width,qp.height,qp.angle);else if(drawChallengeSignatureProjectile(ctx,images,q,time)){}else{ctx.fillStyle='#fff5dc';ctx.strokeStyle='#17353a';ctx.lineWidth=2;ctx.rotate(time*.004);ctx.fillRect(-16,-11,32,22);ctx.strokeRect(-16,-11,32,22);}ctx.restore();if(q.targetX!=null){ctx.strokeStyle='#d15c37';ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(sx(q.targetX),sy(GROUND,q.depth),35*f.zoom,9*f.zoom,0,0,Math.PI*2);ctx.stroke();}}
 for(const q of g.obstacles||[])if(!q.dead){drawChallengeStreetProp(ctx,images,'sign',chapter2ObstacleFrame(q,f));}
 for(const r of g.rallies||[])for(let i=4;i>=0;i--){const im=images['supporter-'+(i%2?'man':'woman')];if(!im)continue;const box=containSprite(im.width,im.height,150*f.zoom);ctx.drawImage(im,sx(r.x-r.direction*i*43)-box.width/2,sy(GROUND,r.depth)-box.height,box.width,box.height);}
 if(g.warning)label(g.warning.name,sx(g.enemy.x),sy(g.enemy.y-330),Math.min(26,w/18),'#ffe283');
 if(caption&&performance.now()<captionUntil)label(caption,w/2,Math.min(120,h*.25),Math.min(34,w/15),'#ffe4a4');
}
function hudText(selector,value){const element=$(selector);if(element.textContent!==value)element.textContent=value;}
function hud(){const s=v(),g=chapter?.world;if(!s)return;const route=s.mode==='route',battle=s.mode==='battle';hudText('#route-progress',route?`${CHAPTER2.routes[routeIndex(s)].name} · ${Math.round(g.routeProgress*100)}%`:battle?`${g.enemy.displayName} · ${s.rounds.player}:${s.rounds.enemy}`:'第三章 · 追逐神麥');hudText('#objective',route?(g.chapterEncounter?.hint??CHAPTER2.routes[routeIndex(s)].objective):battle?(s.stepId==='boss'?(g.chapterEncounter?.hint??'三戰兩勝，贏的人拿神麥！'):'看預告、閃過招式，再反擊。'):'追麥不停站 · 先看對手動作，再出拳');if(g)ui.render({state:s,world:g});}

function tick(now){
 try{
  const paintToken=ui.beginFrame(now),elapsed=lastTime===null?0:now-lastTime;lastTime=now;frameTime=now;
  const plan=planSimulationFrame(elapsed,{paused:!active()}),dt=plan.acceptedMs/1000;
  if(active()){
   const current=chapter,world=chapter.world,token=v().token;
   if(held.punch){punchWait-=dt;if(punchWait<=0)command('punch');}
   for(const step of plan.steps){
    if(!active()||chapter!==current||chapter.world!==world||v().token!==token)break;
    chapter.step(step,{...held,crouch:v().mode==='battle'&&!!(held.down||held.crouch)});
   }
   const emitted=current.drainEvents();media.handleEvents(emitted,world);for(const e of emitted){if(['move','assistStart','minibossWarning'].includes(e.type))shout(e.name??'助拳！');if(e.type==='supply')shout('補給到手！+18');}
   if(v().token!==uiToken)sync();
  }
 chaseWindow.paint({active:v()?.mode==='route'&&!v()?.paused,image:images['opening-props-v75'],time:now}); hud();if(paintToken){draw(now,plan.acceptedMs);ui.paintFrame(paintToken);}
 }catch(error){ui.failFrame(error);}
 finally{requestAnimationFrame(tick);}
}
continuation=mountContinuationControls({document,window,characters:CAST,chapterId:'chapter-3',createPlayableChapter,getPlayable:()=>chapter,pauseForUI:()=>{clearHold();const s=v();if(s&&!s.paused&&['route','battle'].includes(s.mode)&&chapter.setPaused(true,s.token))sync();},isReady:()=>!$('#start').disabled,getOptions:()=>({difficulty:$('#difficulty').value}),onReady:next=>{chapter=next;selected=next.view().characterId;sync();},onChange:()=>sync()});
refreshMenu();resizeCanvas();
const allFiles={...ART_FILES,...SKY_EXTENSION_FILES,...STREET_SEAM_FILES,...ASSET_FILES,...CHAPTER2_NEW_ART.files};let loaded=0;
Promise.all(Object.entries(allFiles).map(([key,file])=>new Promise((resolve,reject)=>{const im=new Image();im.onload=()=>{$('#start').textContent='載入漫畫 '+Math.round(++loaded/Object.keys(allFiles).length*100)+'%';resolve([key,im]);};im.onerror=()=>reject(new Error('Missing asset: '+file));im.src=chapterAssetURL('chapter3',file);}))).then(entries=>{images=Object.fromEntries(entries);$('#start').disabled=false;$('#start').textContent='獨立預覽（不存進度）';continuation.assetsReady();requestAnimationFrame(tick);}).catch(err=>{continuation.assetsFailed();$('#start').textContent='素材載入失敗，請重新整理';$('#start').disabled=true;hudText('#objective',err.message);});


registerQuickView(window,async()=>{
 if(!active()||continuation?.busy)return false;
 const s=v(),world=chapter?.world;
 if(s.mode==='route'){world.status='gate';chapter.step(0,{});await chapter.flush?.();sync();return true;}
 if(s.mode==='battle'&&world?.enemy){world.enemy.hp=0;return true;}
 return false;
});
