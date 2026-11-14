/** Presentation only: a receipt comes from verified write/readback, never from
 * a loaded snapshot, a story token, or a busy->idle transition. */
export function mountChallengeSaveFeedback({document,window,button,isPreview=()=>false,duration=2600}={}){
 const header=button?.parentElement;if(!header)return {saved(){},update(){},destroy(){}};
 const notice=document.createElement('span');notice.dataset.saveNotice='';notice.setAttribute('role','status');notice.setAttribute('aria-live','polite');notice.setAttribute('aria-atomic','true');header.append(notice);
 button.classList.add('save-feedback-error');button.hidden=true;
 let enabled=false,error='',success=false,epoch=0,timer=null,disposed=false;
 function position(){
  const h=header.getBoundingClientRect(),brand=header.querySelector('.brand')?.getBoundingClientRect(),toolbar=header.querySelector('.toolbar')?.getBoundingClientRect();
  if(!h.width||!brand||!toolbar)return;
  const left=Math.max(0,brand.right-h.left+6),room=Math.max(0,toolbar.left-h.left-left-6);
  header.style.setProperty('--save-notice-left',left+'px');header.style.setProperty('--save-notice-width',room+'px');
 }
 function render(){
  header.toggleAttribute('data-save-feedback',enabled);
  button.hidden=!enabled||!error;
  if(error){(button.querySelector('#campaign-save-state')??button).textContent='存檔失敗';button.dataset.status='error';button.title=error;button.setAttribute('aria-label',error+' 開啟保存與備份');}
  const text=enabled?(error?'存檔失敗：'+error:success?'✓ 已存檔':''):'';
  // Failure remains available to readers here and visibly on its recovery
  // button; a success deadline owns neither the error nor the recovery panel.
  notice.dataset.failure=String(!!error);if(notice.textContent!==text)notice.textContent=text;
  position();
 }
 const observer=window?.ResizeObserver?new window.ResizeObserver(position):null;observer?.observe(header);window?.addEventListener('resize',position);
 return {
  update({enabled:active=true,error:issue=''}={}){
   if(disposed)return;enabled=!!active;
   if(issue){error=String(issue);success=false;epoch++;window.clearTimeout(timer);}
   render();
  },
  saved(receipt){
   if(disposed||receipt?.persisted!==true||isPreview())return;
   error='';success=true;const owner=++epoch;window.clearTimeout(timer);render();
   timer=window.setTimeout(()=>{if(disposed||owner!==epoch||error)return;success=false;render();},duration);
  },
  destroy(){disposed=true;epoch++;window.clearTimeout(timer);observer?.disconnect();window?.removeEventListener('resize',position);notice.remove();header.removeAttribute('data-save-feedback');}
 };
}
