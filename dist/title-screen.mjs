// Foreground cameos are independent of the player's actual matchup.
// The rest of the roster stays visible in the same ensemble on every visit.
// Sampling from the remaining n - 1 slots gives every ordered pair equal odds.
export function sampleTitlePair(cast,rng=Math.random){
 const keys=Object.keys(cast);
 if(keys.length<2)throw new RangeError('The title screen needs at least two characters.');
 const index=length=>{
  const random=rng();
  if(!Number.isFinite(random)||random<0||random>=1)throw new RangeError('The random source must return a number from 0 up to, but not including, 1.');
  return Math.floor(random*length);
 };
 const first=index(keys.length),remaining=index(keys.length-1);
 const second=remaining>=first?remaining+1:remaining;
 return[keys[first],keys[second]];
}

export function mountTitleScreen({root,cast,onStart,rng=Math.random,canUse=()=>true,onCharacter=()=>{},onHide=()=>{},readyStatus=()=>'七位角色，選誰上場？'}){
 if(!root||typeof onStart!=='function')throw new TypeError('A title root and onStart callback are required.');
 const button=root.querySelector('#title-start');
 const label=root.querySelector('#title-start-label');
 const status=root.querySelector('#title-status');
 const audioStatus=root.querySelector('#title-audio-status');
 const heading=root.querySelector('#title-heading');
 let ready=false,visible=false,entering=false,entryError=false,visit=0;
 let readyMessage='正在準備角色與舞台…';

 function renderGate(){
  button.disabled=!ready||entering||!visible;
  button.setAttribute('aria-busy',String(entering));
  label.textContent=entering?'準備開吵…':'開始遊戲';
  status.textContent=entryError?'暫時無法進入，請再試一次。':readyMessage;
 }
 function failedEntry(token){
  if(!visible||visit!==token)return;
  entering=false;entryError=true;
  renderGate();
 }
 button.addEventListener('click',()=>{
  if(!ready||!visible||entering)return;
  entering=true;
  const token=visit;
  renderGate();
  try{
   // Invoke directly in the click stack, before any Promise boundary. The
   // caller owns audio unlocking and navigation, including a silent fallback.
   const outcome=onStart();
   if(outcome===false)failedEntry(token);
   else if(outcome&&typeof outcome.then==='function'){
    Promise.resolve(outcome).then(result=>{if(result===false)failedEntry(token);},()=>failedEntry(token));
   }
  }catch{
   failedEntry(token);
  }
 });
 renderGate();

 return{
  show(){
   const pair=sampleTitlePair(cast,rng);
   const supporting=Object.keys(cast).filter(key=>!pair.includes(key));
   const characters=[...pair.map((key,index)=>[index===0?'left':'right',key]),...supporting.map((key,index)=>['back-'+index,key])];
   characters.forEach(([slot,key])=>{
    const character=cast[key];
    const card=root.querySelector(`[data-title-character="${slot}"]`);
    card.dataset.character=key;
    card.style.setProperty('--title-character-color',character.colorCSS);
    card.querySelector('img').setAttribute('src',character.portrait);
    const available=canUse(key);card.dataset.locked=String(!available);
    card.querySelector('img').setAttribute('alt',available?character.name+'，虛構戲仿角色':'未解鎖角色，???');
    card.querySelector('[data-title-name]').textContent=available?character.name:'???';
    card.setAttribute('role','button');card.setAttribute('tabindex','0');card.setAttribute('aria-label',available?character.name:'未解鎖角色，???');
    if(!card.titleActivationBound){card.titleActivationBound=true;
     card.addEventListener('click',()=>{if(visible&&!entering)onCharacter(card.dataset.character);});
     card.addEventListener('keydown',event=>{if(!event.repeat&&(event.key==='Enter'||event.key===' ')){event.preventDefault();if(visible&&!entering)onCharacter(card.dataset.character);}});
    }
   });
   visit++;visible=true;entering=false;entryError=false;
   root.hidden=false;root.inert=false;root.classList.remove('hidden');
   root.setAttribute('aria-hidden','false');root.scrollTop=0;
   renderGate();heading.focus({preventScroll:true});
  },
  hide(){
   visit++;visible=false;entering=false;onHide();
   root.hidden=true;root.inert=true;root.classList.add('hidden');
   root.setAttribute('aria-hidden','true');
   renderGate();
  },
  setReady(value,message){
   ready=Boolean(value);
   entryError=false;
   readyMessage=message??(ready?readyStatus():'正在準備角色與舞台…');
   renderGate();
  },
  setAudioStatus(message=''){
   audioStatus.textContent=String(message??'');
   audioStatus.hidden=!audioStatus.textContent;
  },
 };
}
