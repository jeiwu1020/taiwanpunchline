import {Duel} from './core.mjs';
import {loadArtImages,drawFighterArt} from './art-render.mjs';
const $=s=>document.querySelector(s),ctx=$('#view').getContext('2d'),images=await loadArtImages();let time=0,last=0,play=true,face=1;
$('#play').onclick=()=>play=!play;$('#mirror').onclick=()=>face*=-1;$('#time').oninput=e=>{time=+e.target.value;play=false};
function state(t){const g=new Duel($('#char').value),action=$('#action').value;let fired=false;for(let s=0;s<t;s+=1/120){if(!fired&&s>=.3){g.press(action);fired=true}g.step(Math.min(1/120,t-s),{crouch:true},false);}return g.player;}
function frame(now){if(play)time=(time+Math.min(.05,(now-last)/1000)*.35)%1.6;last=now;const f=state(time);ctx.clearRect(0,0,900,460);ctx.save();ctx.translate(450,420);ctx.scale(face*1.05,1.05);ctx.translate(0,f.y-430);drawFighterArt(ctx,images,f,time*1000);ctx.restore();$('#label').textContent=`${time.toFixed(3)}s; action at .300; crouch blend ${f.crouchBlend.toFixed(3)}`;$('#time').value=time;requestAnimationFrame(frame)}requestAnimationFrame(frame);
