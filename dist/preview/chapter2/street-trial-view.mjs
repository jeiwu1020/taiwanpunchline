import {GROUND} from './core.mjs?v=campaign-boot-20261112-r3';
import {shoutCaptionLayout} from './shout-caption.mjs?v=campaign-boot-20261112-r3';
export function streetTrialFrame({width,height,portrait,player,worldWidth=2300}){
 const zoom=Math.max(.42,portrait?width/550:Math.min(width/1050,(height-102)/360));
 const visible=width/zoom,camera=Math.min(worldWidth-visible/2,Math.max(visible/2,player.x+visible*.13));
 const depth=player.depth??0,rawBase=(portrait?height*.76:height-115)-depth*.08*zoom;
 const jumpPan=Math.max(0,55-(rawBase+(player.y-GROUND+depth*.65-300)*zoom));
 // Background overscan covers the whole viewport even when the camera follows
 // a jump. Background origin stays above the viewport, never below it.
 return {zoom,visible,camera,left:camera-visible/2,base:rawBase+jumpPan,jumpPan,backgroundTop:0,backgroundHeight:height+jumpPan};
}
export function containSprite(width,height,targetHeight){
 const h=Math.max(1,Number(height)||1);return {width:targetHeight*Math.max(1,Number(width)||1)/h,height:targetHeight};
}
export function trialCaption(spec,view){
 const p=shoutCaptionLayout(spec.name,spec.helper?'enemy':'player',{...view,x:view.width/2,y:view.height/2,zoom:1},{top:58,bottom:145},{kind:spec.kind,actor:spec.actor});
 if(view.height<340&&view.width>550){
  // Short landscape uses one compact shout line, not two rows squeezed into
  // the health bar. Preserve the original per-character ink and accents.
  p.text=spec.name;p.size=Math.min(34,(view.width*.4-30)/[...spec.name].length);p.width=[...spec.name].length*p.size+14;p.height=p.size*1.18+10;
  p.screenY=p.y=104;p.tagY=58;
 }
 if(spec.helper)p.tag='助拳 · '+p.style.label;
 return p;
}
