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

// A real iframe viewport, not device/touch emulation. Resizing never reloads it.
export function bindQuickViewSize(document){
 const select=document.querySelector('#view-size'),frame=document.querySelector('#game'),host=document.querySelector('#view-host');
 if(!select||!frame||!host)return;
 const sizes={portrait:[390,844],landscape:[844,390],desktop:[1280,720]};
 const resize=()=>{const size=sizes[select.value];host.dataset.fixed=String(!!size);frame.style.width=size?size[0]+'px':'';frame.style.height=size?size[1]+'px':'';};
 select.addEventListener('change',resize);resize();
}
