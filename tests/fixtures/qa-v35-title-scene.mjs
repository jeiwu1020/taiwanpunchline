// Local-only: production DOM/CSS/title/viewport, no Phaser and no audio.
import {mountTitleScreen} from './title-screen.mjs';
import {mountGameViewport} from './game-viewport.mjs';
import {CAST} from './core.mjs';
const $=s=>document.querySelector(s);
const title=mountTitleScreen({root:$('#title-screen'),cast:CAST,onStart(){parent.document.querySelector('#fixture-action').textContent='Start clicked';return false;}});
title.show();title.setReady(true);title.setAudioStatus('按開始進入選角，並啟用已開啟的聲音。');
let rotate=false,viewport;
const scene={scale:{resize(){requestAnimationFrame(report);}}};
viewport=mountGameViewport({scene,clearHold(){},initialSettings:{rotate}});
function report(){
 const root=$('#title-screen'),button=$('#title-start'),group=$('.title-ensemble'),actions=$('.title-actions');
 const rect=e=>e.getBoundingClientRect().toJSON(),b=rect(button),r=rect(root),g=rect(group),a=rect(actions),hit=document.elementFromPoint(b.x+b.width/2,b.y+b.height/2);
 const inside=box=>box.x>=r.x-1&&box.y>=r.y-1&&box.right<=r.right+1&&box.bottom<=r.bottom+1;
 const cards=[...document.querySelectorAll('.title-character')].map(e=>({character:e.dataset.character,rect:rect(e),name:rect(e.querySelector('figcaption')),image:rect(e.querySelector('img'))}));
 const ids=['title-heading','title-start','title-status','title-disclaimer','title-audio-status'];
 const overlap=cards.filter(c=>c.rect.x<a.right&&c.rect.right>a.x&&c.rect.y<a.bottom&&c.rect.bottom>a.y).map(c=>c.character);
 parent.document.querySelector('#fixture-report').textContent=JSON.stringify({fixture:'Production title DOM/CSS/controller and viewport; no Phaser/audio',size:[innerWidth,innerHeight],layout:$('.app').dataset,scroll:[root.clientWidth,root.scrollWidth,root.clientHeight,root.scrollHeight],hit:hit===button||button.contains(hit),centerOffset:[a.x+a.width/2-g.x-g.width/2,a.y+a.height/2-g.y-g.height/2],overlap,allInside:cards.every(c=>inside(c.rect)&&inside(c.name)&&inside(c.image))&&ids.every(id=>inside(rect($('#'+id)))),cards,rects:ids.map(id=>({id,rect:rect($('#'+id)),font:getComputedStyle($('#'+id)).fontSize}))},null,2);
}
window.addEventListener('resize',()=>requestAnimationFrame(report));
window.addEventListener('message',e=>{if(e.origin!==location.origin)return;if(e.data==='toggle-rotate'){rotate=!rotate;viewport.setPreferences({rotate});}requestAnimationFrame(report);});
requestAnimationFrame(report);
