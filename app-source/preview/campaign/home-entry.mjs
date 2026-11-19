/** Read UI selection only. This module never obtains browser storage. */
export function mountHomeContinuation({document,window}){
 const link=document.querySelector('#campaign-home-entry');if(!link)return null;
 const update=()=>{
  const selected=['1','2','3'].find(n=>document.querySelector('#profile-'+n)?.getAttribute('aria-pressed')==='true')??'1';
  const badge=document.querySelector('#profile-test-badge'),test=!!badge&&!badge.hidden;
  link.setAttribute('href',`preview/chapter2/?${test?'test=1':'campaign=1'}&profile=slot-${selected}`);
  link.textContent=test?'試玩後續章節（不存進度） →':'繼續追麥：後續章節 →';
 };
 update();link.addEventListener('click',update);
 const observer=new window.MutationObserver(update);
 for(const element of [document.querySelector('.profile-controls'),document.querySelector('#profile-test-badge')])if(element)observer.observe(element,{attributes:true,subtree:true,attributeFilter:['hidden','aria-pressed']});
 return {update,dispose(){observer.disconnect();link.removeEventListener('click',update);}};
}
if(typeof document!=='undefined'&&typeof window!=='undefined')mountHomeContinuation({document,window});
