import {loadChapterImage} from './chapter-image-loader.mjs';
// One optional 88 KB atlas, loaded only once a street/arena is drawn. It is not
// part of the title's critical image queue and never delays gameplay readiness.
export const MOB_FX_SPRITES=Object.freeze({sound:[60,16,136,224],rush:[272,83,224,89],route:[528,98,224,59],handshake:[17,272,221,224],paper:[272,320,224,127],'paper-stamped':[528,276,224,216]});
let atlas=null,requested=false;
export function chapterMobFxImage(){
 if(!requested&&typeof globalThis.Image==='function'){
  requested=true;void loadChapterImage(new URL('./assets/challenge/mob-fx-native-v1.webp',import.meta.url).href).then(image=>{atlas=image;},()=>{});
 }
 return atlas;
}
export function drawMobFx(c,atlas,kind,x,y,w,h){
 const r=MOB_FX_SPRITES[kind];if(!atlas||!r)return false;
 const scale=Math.min(w/r[2],h/r[3]),width=r[2]*scale,height=r[3]*scale;
 c.drawImage(atlas,...r,x+(w-width)/2,y+(h-height)/2,width,height);return true;
}
