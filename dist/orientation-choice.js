/* First-visit direction choice runs before either viewport controller starts. */
(function(){
 'use strict';
 if(window.parliamentOrientationChoice)return;
 const key='parliament-settings-v1',sessionKey='parliament-orientation-session-v1';
 const own=(value,key)=>Object.prototype.hasOwnProperty.call(value,key);
 const supported=value=>value&&typeof value==='object'&&!Array.isArray(value)&&(!own(value,'version')||value.version===1);
 const direction=value=>supported(value)&&own(value,'rotate')&&typeof value.rotate==='boolean'?value.rotate:undefined;
 let saved,session;
 try{saved=JSON.parse(window.localStorage.getItem(key));}catch(_){/* Storage is optional. */}
 try{session=JSON.parse(window.sessionStorage.getItem(sessionKey));}catch(_){}
 let rotate=direction(saved)??direction(session);
 const smallTouch=(window.matchMedia?.('(pointer:coarse)').matches||(navigator.maxTouchPoints>0&&window.matchMedia?.('(hover:none)').matches))&&Math.min(window.innerWidth,window.innerHeight)<=900;
 let pending=!!smallTouch&&typeof rotate!=='boolean',resolve;
 const ready=new Promise(done=>{resolve=done;});
 window.parliamentOrientationChoice=Object.freeze({get pending(){return pending;},get rotate(){return rotate;},ready});
 if(!pending){resolve();return;}
 document.documentElement.dataset.orientationChoice='pending';
 function mount(){
  const card=document.createElement('dialog');
  card.id='orientation-choice';card.setAttribute('aria-labelledby','orientation-choice-title');card.setAttribute('aria-describedby','orientation-choice-note');
  card.innerHTML='<p class="orientation-choice-kicker">拳民開講</p><h1 id="orientation-choice-title">選擇遊玩方向</h1><div class="orientation-choice-options"><button type="button" data-orientation="portrait"><strong>直向遊玩</strong><span>直拿就能玩</span></button><button type="button" data-orientation="landscape"><strong>橫向遊玩</strong><span>戰鬥畫面更寬</span></button></div><p id="orientation-choice-note"></p>';
  const buttons=[...card.querySelectorAll('button')];
  function describe(){card.querySelector('#orientation-choice-note').textContent=window.innerWidth>window.innerHeight?'手機已橫拿，畫面不會再轉；直拿時依所選方向顯示。之後可在設定切換。':'選橫向時畫面會側轉，將手機橫拿即可遊玩。之後可在設定切換。';}
  function choose(value){
   if(!pending)return;
   rotate=value;let persisted=false;
   try{
    const raw=window.localStorage.getItem(key),current=raw===null?null:JSON.parse(raw);
    // Preserve unrelated settings and never replace an unknown future format.
    if(raw===null||supported(current)){window.localStorage.setItem(key,JSON.stringify({...current,version:1,rotate}));persisted=true;}
   }catch(_){}
   try{if(persisted)window.sessionStorage.removeItem(sessionKey);else window.sessionStorage.setItem(sessionKey,JSON.stringify({version:1,rotate}));}catch(_){}
   pending=false;window.removeEventListener('resize',describe);window.removeEventListener('orientationchange',describe);
   card.remove();delete document.documentElement.dataset.orientationChoice;resolve();
  }
  buttons.forEach(button=>button.addEventListener('click',()=>choose(button.dataset.orientation==='landscape')));
  card.addEventListener('cancel',event=>event.preventDefault());
  card.addEventListener('keydown',event=>{
   if(event.key==='Escape'){event.preventDefault();return;}
   if(event.key!=='Tab')return;
   const first=buttons[0],last=buttons[1];
   if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus();}
   else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}
  });
  describe();window.addEventListener('resize',describe);window.addEventListener('orientationchange',describe);document.body.append(card);
  if(typeof card.showModal==='function')card.showModal();else{card.setAttribute('open','');card.setAttribute('role','dialog');card.setAttribute('aria-modal','true');}
  buttons[0].focus({preventScroll:true});
 }
 if(document.body)mount();else document.addEventListener('DOMContentLoaded',mount,{once:true});
})();
