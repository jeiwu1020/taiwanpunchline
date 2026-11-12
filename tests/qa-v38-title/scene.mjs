// Local-only: production DOM/CSS/title/viewport, deterministic cast, no audio.
import {mountTitleScreen} from './title-screen.mjs';
import {mountGameViewport} from './game-viewport.mjs';
import {CAST} from './core.mjs';
const $=s=>document.querySelector(s);
const title=mountTitleScreen({root:$('#title-screen'),cast:CAST,rng:()=>0,onStart(){parent.document.querySelector('#fixture-action').textContent='Start clicked';return false;}});
title.show();title.setReady(true);title.setAudioStatus('按開始進入選角，並啟用已開啟的聲音。');
let rotate=false;
const viewport=mountGameViewport({scene:{scale:{resize(){requestAnimationFrame(report);}}},clearHold(){},initialSettings:{rotate}});
function report(){
 const root=$('#title-screen'),button=$('#title-start'),actions=$('.title-actions');
 const rect=e=>e.getBoundingClientRect().toJSON(),b=rect(button),r=rect(root),a=rect(actions),hit=document.elementFromPoint(b.x+b.width/2,b.y+b.height/2);
 const inside=box=>box.x>=r.x-1&&box.y>=r.y-1&&box.right<=r.right+1&&box.bottom<=r.bottom+1;
 const overlap=(one,two)=>one.x<two.right&&one.right>two.x&&one.y<two.bottom&&one.bottom>two.y;
 const cards=[...document.querySelectorAll('.title-character')].map(e=>({slot:e.dataset.titleCharacter,character:e.dataset.character,rect:rect(e),name:rect(e.querySelector('figcaption')),image:rect(e.querySelector('img')),animation:getComputedStyle(e.querySelector('img')).animationName}));
 const nodes=[...document.querySelectorAll('.title-screen,.title-poster,.title-ensemble,.title-character,.title-actions,#title-heading,#title-start,.title-footer')];
 const geometry=nodes.map(e=>({class:e.className,rect:rect(e),style:['display','position','width','height','gap','transform','animation','padding','grid-template-rows','grid-template-columns','font-size'].map(k=>[k,getComputedStyle(e).getPropertyValue(k)])}));
 const ids=['title-heading','title-start','title-status','title-disclaimer','title-audio-status'];
 parent.document.querySelector('#fixture-report').textContent=JSON.stringify({size:[innerWidth,innerHeight],layout:$('.app').dataset,scroll:[root.clientWidth,root.scrollWidth,root.clientHeight,root.scrollHeight],hit:hit===button||button.contains(hit),namesOverStart:cards.filter(c=>overlap(c.name,b)).map(c=>c.character),allInside:cards.every(c=>inside(c.name))&&ids.every(id=>inside(rect($('#'+id)))),cards,rects:ids.map(id=>({id,rect:rect($('#'+id)),font:getComputedStyle($('#'+id)).fontSize})),geometry},null,2);
}
window.addEventListener('resize',()=>requestAnimationFrame(report));
window.addEventListener('message',e=>{if(e.origin!==location.origin)return;if(e.data==='toggle-rotate'){rotate=!rotate;viewport.setPreferences({rotate});}requestAnimationFrame(()=>requestAnimationFrame(report));});
for(const image of document.images)image.addEventListener('load',report);
requestAnimationFrame(()=>requestAnimationFrame(report));
