// Presentation only: no campaign writes, combat mutation, or new audio assets.
import {VoiceChannels} from '../../voice-channels.mjs?v=chapter-presentation-20261117-r1';
import {createBackgroundMusic} from '../../background-music.mjs?v=chapter-presentation-20261117-r1';
import {playableVoice} from '../../voice-slots.mjs?v=chapter-presentation-20261117-r1';
import {createMoveDemo} from '../../move-demo.mjs?v=chapter-presentation-20261117-r1';
import {ART_FILES} from '../../art-render.mjs?v=chapter-presentation-20261117-r1';
import {normalizeSettings} from '../../settings-state.mjs?v=chapter-presentation-20261117-r1';

export function createChapterMedia({document,window,getSettings=()=>({}),getImages=()=>null,canvas,onState=()=>{},onError=()=>{}}){
 const root=new URL('../../',document.baseURI||window.location.href);
 const asset=path=>new URL(path,root).href;
 const elements=Object.fromEntries(['player','enemy','assist-player','assist-enemy'].map(id=>{const el=document.createElement('audio');el.preload='none';el.dataset.chapterVoice=id;document.body.append(el);return[id,el];}));
 const fetchImpl=window.fetch?.bind(window)||globalThis.fetch;
 const voices=new VoiceChannels(elements,{fetchImpl});
 let prefs=normalizeSettings(getSettings()),context=null,sfxGain=null,unlocked=false,destroyed=false,hidden=false,demo=null,view={},epoch=0,previewAudioFailure=false;
 const timers=new Set(),oscillators=new Set();
 const emit=(channel,status,extra={})=>{if(destroyed)return;const value={channel,status,...extra};try{onState(value);}catch{}if(status==='error'||status==='blocked'){try{onError(value);}catch{}}};
 const voiceAllowed=()=>!destroyed&&!prefs.masterMuted&&!prefs.voiceMuted&&prefs.voiceVolume>0;
 const sfxAllowed=()=>!destroyed&&!prefs.masterMuted&&!prefs.sfxMuted&&prefs.sfxVolume>0;
 function getContext(){
  if(destroyed)throw Error('Media adapter destroyed');
  if(!context){const AudioContext=window.AudioContext||window.webkitAudioContext;if(!AudioContext)throw Error('Web Audio unavailable');context=new AudioContext();}
  if(!sfxGain){sfxGain=context.createGain();sfxGain.connect(context.destination);}
  sfxGain.gain.setValueAtTime(sfxAllowed()?prefs.sfxVolume:0,context.currentTime);
  voices.connectAudio(context);return context;
 }
 const music=createBackgroundMusic({getContext,fetchImpl,tracks:{menu:{src:asset('assets/music/fluffing-a-duck-menu-v28.mp3'),label:'Fluffing a Duck'},battle:{src:asset('assets/music/run-amok-battle-v28.mp3'),label:'Run Amok'}},onState:s=>emit('music',s.status,{...s})});
 const clip=kind=>{const c=playableVoice(kind);return c?{...c,src:asset(c.src)}:null;};
 function setPreferences(next){
  prefs=normalizeSettings(next);voices.setVolume(prefs.voiceVolume);music.setPreferences(prefs);
  if(!voiceAllowed())voices.stopAll();if(!sfxAllowed())stopEffects();
  if(sfxGain)sfxGain.gain.setValueAtTime(sfxAllowed()?prefs.sfxVolume:0,context.currentTime);
 }
 function unlock(){
  if(destroyed)return Promise.resolve({status:'destroyed'});unlocked=true;
  // The context is obtained and resumed synchronously in music.unlock().
  const pending=music.unlock();
  if(voiceAllowed()&&context)voices.prime(asset('assets/audio-unlock-silence-v37.wav'));
  return pending;
 }
 function stopEffects(){epoch++;for(const id of timers)window.clearTimeout(id);timers.clear();for(const o of oscillators){o.onended=null;try{o.stop();}catch{}try{o.disconnect();}catch{}o._chapterGain?.disconnect?.();}oscillators.clear();}
 function stopPreview(){stopEffects();voices.stopAll();demo?.stop();emit('preview','stopped');}
 function stop(){stopPreview();}
 function setHidden(value){hidden=!!value;if(hidden)stop();music.setHidden(hidden);}
 function sync(next={}){
  if(destroyed)return;
  const sessionChanged=next.sessionId!==undefined&&view.sessionId!==undefined&&next.sessionId!==view.sessionId;
  const stepChanged=next.stepId!==undefined&&view.stepId!==undefined&&next.stepId!==view.stepId;
  const explicitStop=next.restart||(view.mode==='result'&&next.active)||sessionChanged||stepChanged||next.paused&&!view.paused||!!next.settingsOpen!==!!view.settingsOpen;
  if(explicitStop)stop();
  else if(view.active&&!next.active){
   // Match chapter one's finishVoice: let the current line finish, never start
   // a queued sentence after natural completion. Explicit interruption wins.
   if(next.mode==='result'){stopEffects();demo?.stop();voices.clearQueued();}
   else stop();
  }
  view={...next};music.select(next.settingsOpen?'menu':['route','battle'].includes(next.mode)?'battle':'menu',{restart:!!next.restart});
 }
 function playVoice(kind,lane='player',preview=false){
  const c=clip(kind);if(!c||!voiceAllowed()||hidden||!unlocked)return false;
  return voices.play(lane,c,{preview,onStart:()=>emit('voice',context?.state==='running'?'playing':'blocked',{kind,lane:preview?'preview':lane,label:c.label}),onError:()=>{if(preview)previewAudioFailure=true;emit('voice','error',{kind,lane:preview?'preview':lane,label:c.label});}});
 }
 function tone(kind){
  if(!unlocked||hidden||!sfxAllowed()||!context||context.state!=='running')return false;
  let o,g;
  try{const t=context.currentTime;o=context.createOscillator();g=context.createGain();o._chapterGain=g;const freq={hit:125,block:260,jump:360,heal:680,start:440}[kind]||200;o.type=kind==='hit'?'square':'triangle';o.frequency.setValueAtTime(freq,t);o.frequency.exponentialRampToValueAtTime(kind==='heal'?1000:freq*.45,t+.13);g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(.045,t+.005);g.gain.exponentialRampToValueAtTime(.0001,t+.15);o.connect(g);g.connect(sfxGain);oscillators.add(o);o.onended=()=>{oscillators.delete(o);o.disconnect();g.disconnect();};o.start(t);o.stop(t+.17);return true;}catch{if(o){oscillators.delete(o);try{o.disconnect();}catch{}}try{g?.disconnect();}catch{}emit('sfx','error');return false;}
 }
 function handleEvents(events,world={}){
  if(destroyed||!unlocked||hidden||!view.active||view.paused||view.settingsOpen)return;
  for(const e of events||[]){
   if(e.type==='assistStart'){
    const owner=e.assist?.owner||e.f;const lane=owner===world.enemy||owner?.id==='enemy'?'assist-enemy':'assist-player';if(!e.assist?.displayName)playVoice(e.kind,lane);tone(e.kind);
   }else if(e.type==='move'&&!e.assist&&!e.f?.isAssist&&!e.f?.mobKind){playVoice(e.kind||e.f?.attack?.kind,e.f===world.enemy||e.f?.id==='enemy'?'enemy':'player');tone(e.kind);}
   else if(['hit','block','jump','heal','counter','spit','launch'].includes(e.type))tone(e.type);
   else if(e.type==='supply')tone('heal');
  }
 }
 function audition(kind){if(!voiceAllowed()||hidden||!clip(kind))return false;stopPreview();unlock();return playVoice(kind,'player',true);}
 async function testSfx(){
  stopPreview();if(!sfxAllowed())return{status:'muted'};const ticket=epoch;
  await unlock();if(ticket!==epoch||destroyed||hidden)return{status:'cancelled'};
  if(!sfxAllowed())return{status:'muted'};if(!context||context.state!=='running'){emit('sfx','blocked');return{status:'blocked'};}
  if(!tone('hit'))return{status:'error'};
  for(const [kind,delay] of [['jump',280],['heal',560]]){const id=window.setTimeout(()=>{timers.delete(id);if(ticket===epoch&&!destroyed&&!hidden)tone(kind);},delay);timers.add(id);}
  emit('sfx','playing');return{status:'playing'};
 }
 function getDemo(){
  if(destroyed)return null;if(demo)return demo;const images=getImages();
  if(!images||Object.keys(ART_FILES).some(k=>!images[k]||images[k].complete===false))return null;
  const target=canvas||document.querySelector('#settings-demo-canvas,#settings-demo');if(!target)return null;
  try{demo=createMoveDemo({canvas:target,images,requestFrame:fn=>window.requestAnimationFrame(fn),cancelFrame:id=>window.cancelAnimationFrame(id),onState:s=>emit('demo',s.status,s)});return demo;}catch{emit('demo','error');return null;}
 }
 function inspect(character,kind){stopPreview();try{const d=getDemo();if(!d)return false;d.play(character,kind);d.stop();return true;}catch{emit('demo','error');return false;}}
 function preview(character,kind){stopPreview();try{const d=getDemo();if(!d)return false;d.play(character,kind);if(voiceAllowed()){previewAudioFailure=false;unlock();const audio=playVoice(kind,'player',true);return{audio,audioError:previewAudioFailure};}return{audio:false};}catch{emit('demo','error');return false;}}
 function destroy(){if(destroyed)return;stop();music.destroy();demo?.destroy();destroyed=true;window.removeEventListener('blur',blur);window.removeEventListener('focus',focus);window.removeEventListener('pagehide',blur);window.removeEventListener('pageshow',focus);document.removeEventListener('visibilitychange',visibility);for(const el of Object.values(elements))el.remove();}
 const blur=()=>setHidden(true),focus=()=>setHidden(!!document.hidden),visibility=()=>setHidden(!!document.hidden);
 window.addEventListener('blur',blur);window.addEventListener('focus',focus);window.addEventListener('pagehide',blur);window.addEventListener('pageshow',focus);document.addEventListener('visibilitychange',visibility);
 setPreferences(prefs);
 return{setPreferences,unlock,sync,handleEvents,audition,testSfx,inspect,preview,stopPreview,stop,setHidden,destroy,get state(){return{music:music.state,unlocked,hidden,destroyed};}};
}
