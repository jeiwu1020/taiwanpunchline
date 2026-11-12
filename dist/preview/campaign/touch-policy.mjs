import {mountPageZoomGuard,ownsGamePageTarget} from '../../page-zoom-gestures.mjs?v=post69-street-seam-cull-20261112-r1';
// The later chapters share the main game's explicit reading-zoom preference.
// No persistent state is written by this binding or by its resize handling.
export function mountCampaignTouch({document,window}){
 const sync=()=>{let enabled=false;try{enabled=window.localStorage.getItem('brawl-page-zoom-v51')==='true';}catch{}document.documentElement.dataset.allowPageZoom=String(enabled);};
 sync();window.addEventListener('storage',sync);
 const guard=mountPageZoomGuard({root:document,ownsTarget:target=>ownsGamePageTarget(document,target),allowsZoom:()=>document.documentElement.dataset.allowPageZoom==='true'});
 return{destroy(){window.removeEventListener('storage',sync);guard.destroy();}};
}
