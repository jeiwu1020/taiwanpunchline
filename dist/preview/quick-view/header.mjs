// UI-only disclosure. Never reads or writes session/game storage.
export function bindQuickViewHelp(document){
 const header=document.querySelector('header'),button=document.querySelector('#toggle-help');
 if(!header||!button)return;
 const setOpen=open=>{header.dataset.helpOpen=String(open);button.setAttribute('aria-expanded',String(open));button.textContent=open?'收起':'說明';};
 setOpen(false);
 button.addEventListener('click',()=>setOpen(button.getAttribute('aria-expanded')!=='true'));
 document.addEventListener('keydown',event=>{
  if(event.key==='Escape'&&button.getAttribute('aria-expanded')==='true'){
   setOpen(false);button.focus();
  }
 });
}
