// A visual label projection only: keep the original buttons, text and actions.
const fullText=button=>(button.textContent||'').replace(/\s+/g,' ').trim();
export function compactToolbarLabel(button){
 const text=fullText(button);
 switch(button.id){
  case 'home':return text.includes('總覽')?'總覽':'首頁';
  case 'sound':{const pressed=button.getAttribute('aria-pressed');return pressed==='true'?'聲音開':pressed==='false'?'聲音關':text.includes('聲音關')?'聲音關':'聲音開';}
  case 'pause':return text.includes('繼續')?'繼續':'暫停';
  case 'help':return '設定';
  default:return '';
 }
}
export function mountCompactToolbar({document,root=document}){
 const buttons=[...root.querySelectorAll('header .toolbar button')].filter(button=>['home','sound','pause','help'].includes(button.id));
 let destroyed=false;
 function sync(){
  if(destroyed)return;
  for(const button of buttons){
   const short=compactToolbarLabel(button),text=fullText(button);
   // A pressed-state update can precede its text mutation. Never announce the
   // old sound state while the compact visual label already reflects the new one.
   const name=button.id==='sound'?text.replace(/聲音[開關]/g,short):text;
   if(button.dataset.shortLabel!==short)button.dataset.shortLabel=short;
   if(button.getAttribute('aria-label')!==name)button.setAttribute('aria-label',name);
  }
 }
 sync();
 const Observer=document.defaultView?.MutationObserver,observer=Observer?new Observer(sync):null;
 // Our data/aria-label writes cannot trigger this observer. No frame polling.
 for(const button of buttons)observer?.observe(button,{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:['aria-pressed']});
 return {sync,destroy(){destroyed=true;observer?.disconnect();}};
}
