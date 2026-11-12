// Local-only static fixture. Real CSS/art/framing/bindings, no Phaser or combat loop.
import {ART_FILES,drawFighterArt} from './art-render.mjs';
import {cameraFrame,backgroundFrame} from './arena-presentation.mjs';
import {overlayCameraFrame,overlayBackgroundFrame} from './overlay-framing.mjs';
import {mountGameViewport} from './game-viewport.mjs';
import {bindTouchControls} from './touch-controls.mjs';
const $=s=>document.querySelector(s),canvas=document.createElement('canvas');$('#game').append(canvas);
for(const s of document.querySelectorAll('.screen'))s.classList.add('hidden');$('#countdown').classList.add('hidden');
$('#p-name').textContent='恰吉王';$('#e-name').textContent='韓國魚';
const image=src=>new Promise((resolve,reject)=>{const img=new Image();img.onload=()=>resolve(img);img.onerror=reject;img.src=src;});
const keys=['art-limbs','wang-parts','han-parts','left-arms','wang-head','han-head'];
const images=Object.fromEntries(await Promise.all(keys.map(async k=>[k,await image('assets/'+ART_FILES[k])]))),bg=await image('assets/arena-chamber-v19.webp');
const params=new URLSearchParams(location.search),near=params.has('near');
if(params.has('long'))['可以這樣插隊喔','垃圾不分藍綠','一支穿雲箭'].forEach((text,i)=>document.querySelectorAll('.specials strong')[i].textContent=text);
const fighters=[{type:'wang',x:near?400:260,y:430,face:1,move:0,stun:0,flash:0,counter:0,reaction:0},{type:'han',x:near?488:700,y:430,face:-1,move:0,stun:0,flash:0,counter:0,reaction:0}];
let viewport,controls;
const scene={scale:{width:1,height:1,resize(w,h){this.width=w;this.height=h;canvas.width=w;canvas.height=h;requestAnimationFrame(paint);}},cameraView:null};
function report(){const d=document,a=$('.app');const targets=[...d.querySelectorAll('#touch-stick,.punch,[data-hold="guard"],[data-action^="special"]')].filter(e=>e.getBoundingClientRect().width&&e.getBoundingClientRect().height);const data={fixture:'Static production-art fixture; not live gameplay',rotation:a.dataset.rotation,native:a.dataset.nativeLandscape,ready:viewport?.ready,canvas:[canvas.width,canvas.height],rootScroll:[scrollX,scrollY],targets:targets.map(e=>{const r=e.getBoundingClientRect(),hit=d.elementFromPoint(r.left+r.width/2,r.top+r.height/2);return{name:e.id||e.dataset.hold||e.dataset.action,width:r.width,height:r.height,hit:!!hit&&(hit===e||e.contains(hit)),overflow:[e.scrollWidth-e.clientWidth,e.scrollHeight-e.clientHeight]};})};parent.document.querySelector('#fixture-report').textContent=JSON.stringify(data,null,2);}
function paint(){if(!viewport)return;const ctx=canvas.getContext('2d'),w=canvas.width,h=canvas.height,f=overlayCameraFrame(cameraFrame,w,h,fighters,null,16,viewport.nativeLandscape),b=overlayBackgroundFrame(backgroundFrame,w,h,f);ctx.setTransform(1,0,0,1,0,0);ctx.fillStyle='#d4cbaa';ctx.fillRect(0,0,w,h);ctx.translate(w/2,h/2);ctx.scale(f.zoom,f.zoom);ctx.translate(-f.x,-f.y);ctx.drawImage(bg,b.x-b.width/2,b.top,b.width,b.height);for(const fighter of fighters){ctx.save();ctx.translate(fighter.x,fighter.y);ctx.scale(fighter.face,1);drawFighterArt(ctx,images,fighter,0);ctx.restore();}report();}
viewport=mountGameViewport({scene,clearHold(){controls?.clear();},initialSettings:{rotate:!params.has('upright')}});
controls=bindTouchControls({document,window,active:()=>viewport.ready,rotation:()=>viewport.rotation,onHold(action,on){for(const e of document.querySelectorAll('[data-hold="'+action+'"]'))e.classList.toggle('held',on);},onAction(action){parent.document.querySelector('#fixture-action').textContent=action;}});
for(const b of document.querySelectorAll('.toolbar button'))b.disabled=false;
window.addEventListener('resize',()=>requestAnimationFrame(paint));window.addEventListener('pointerdown',()=>requestAnimationFrame(report));requestAnimationFrame(paint);
