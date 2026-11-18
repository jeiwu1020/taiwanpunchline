// Optional storyboard proposal, not a gameplay item or approved default.
const CROP=Object.freeze([1186,543,192,444]);
export function chaseWindowPlan(chapter,{width=320,time=0}={}){
 if(![3,4].includes(chapter))throw new RangeError('Unknown chase chapter');
 const x=Math.min(width-88,Math.max(190,width*.65));
 const mic={x,y:5+(chapter===3?Math.sin(time*.0015)*1.5:0),width:44*192/444,height:44,crop:[...CROP]};
 return {chapter,mic,micCount:1,interactive:false,carrier:chapter===3?'ribbon':'wheeled-stand',wheels:chapter===4?{y:72,radius:4,rotation:time*.002}:null,label:chapter===3?'前方：花車綵帶':'前方：帶輪麥架'};
}
export function installChaseWindow({document,chapter}){
 const enabled=DEVELOPMENT_TOOLS&&new URLSearchParams(document.defaultView?.location?.search||'').has('chasePanel');
 if(!enabled)return {paint(){},enabled:false};
 const stage=document.querySelector('#stage'),panel=document.createElement('aside'),canvas=document.createElement('canvas');
 panel.id='later-chase-window';panel.hidden=true;panel.setAttribute('aria-label',chapter===3?'候選追逐畫面：花車綵帶帶著神麥往前':'候選追逐畫面：神麥固定在前方帶輪麥架');panel.style.cssText='height:82px;flex:none;border-bottom:3px solid #17353a;background:#fff0cd;pointer-events:none;';canvas.style.cssText='width:100%;height:79px;display:block;';panel.append(canvas);stage.before(panel);
 const ctx=canvas.getContext('2d');
 return {enabled:true,paint({active,image,time=0}){
  panel.hidden=!active;if(!active||!image)return;
  const width=stage.clientWidth||320,dpr=Math.min(2,document.defaultView?.devicePixelRatio||1);
  if(canvas.width!==Math.round(width*dpr)||canvas.height!==Math.round(79*dpr)){canvas.width=Math.round(width*dpr);canvas.height=Math.round(79*dpr);}
  ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,width,79);const p=chaseWindowPlan(chapter,{width,time}),m=p.mic;
  ctx.fillStyle='#fff0cd';ctx.fillRect(0,0,width,79);ctx.fillStyle='#17353a';ctx.textAlign='left';ctx.font='bold 14px Microsoft JhengHei,system-ui';ctx.fillText(p.label,12,26);ctx.font='11px Microsoft JhengHei,system-ui';ctx.fillStyle='#805633';ctx.fillText('漫畫小窗 · 表現候選',12,47);ctx.fillText('追逐目標在前方 →',12,64);
  if(chapter===3){
   // A flower-decorated parade platform continues beyond the right edge.
   const cartX=m.x+44;ctx.fillStyle='#b95840';ctx.fillRect(cartX,35,90,22);ctx.strokeStyle='#17353a';ctx.lineWidth=2;ctx.strokeRect(cartX,35,90,22);ctx.fillStyle='#17353a';for(const xx of [cartX+15,cartX+66]){ctx.beginPath();ctx.arc(xx,61,8,0,Math.PI*2);ctx.fill();}
   ctx.fillStyle='#efbd55';for(let i=0;i<5;i++){ctx.beginPath();ctx.arc(cartX+7+i*17,33,7,0,Math.PI*2);ctx.fill();}ctx.strokeStyle='#c35942';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(cartX+5,27);ctx.quadraticCurveTo(m.x+27,17,m.x+m.width*.6,m.y+30);ctx.stroke();
  }else{
   const center=m.x+m.width*.38;ctx.strokeStyle='#4c443b';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(center,44);ctx.lineTo(center,67);ctx.moveTo(center-16,67);ctx.lineTo(center+16,67);ctx.stroke();ctx.fillStyle='#26383c';for(const dx of [-14,14]){ctx.beginPath();ctx.arc(center+dx,p.wheels.y,p.wheels.radius,0,Math.PI*2);ctx.fill();}ctx.strokeStyle='#ad8d65';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(m.x-28,77);ctx.lineTo(width-8,77);ctx.stroke();
  }
  ctx.drawImage(image,...m.crop,m.x,m.y,m.width,m.height);
 }};
}
import {DEVELOPMENT_TOOLS} from '../release-features.mjs?v=chapter-presentation-20261117-r1';
