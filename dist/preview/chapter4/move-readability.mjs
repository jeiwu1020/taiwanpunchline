import {fighterPose} from './art-motion.mjs?v=chapter-presentation-20261117-r1';
import {HEAD_SEAT} from './art-collar.mjs?v=chapter-presentation-20261117-r1';
import {CAST} from './roster.mjs?v=chapter-presentation-20261117-r1';
import {moveCue} from './combat-view.mjs?v=chapter-presentation-20261117-r1';
// Presentation only: these beats never extend an attack, hitbox, stun or cooldown.
const moves=new Map(Object.values(CAST).flatMap(c=>c.moves.map(m=>[m.kind,m])));
export const SIGNATURE_SIZE=Object.freeze({dream:{width:92,height:59},word:{width:164,height:72,size:36},grip:{height:42,glow:68}});
export function moveCaption(kind){
 const m=moves.get(kind);if(!m)return null;
 const size=32,duration=kind==='han_knee'||kind==='ko_name'?1.65:1.35;
 return {text:m.name,subtitle:moveCue(kind),size,width:Math.max(178,[...m.name].length*size+36),height:78,duration};
}
export function captionPosition(f,other,width=250,view=null){
 const zoom=view?.zoom||1,left=view?view.x-view.width/(2*zoom):0,right=view?view.x+view.width/(2*zoom):960,top=view?view.y-view.height/(2*zoom):0,bottom=view?view.y+view.height/(2*zoom):540;
 const inset=12/zoom,lo=left+inset+width/2,hi=right-inset-width/2,mid=(left+right)/2;
 const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
 let x=f.x;
 if(other&&Math.abs(f.x-other.x)<width+24){
  const first=f.x<other.x||(f.x===other.x&&f.id!=='enemy'),clusterLeft=Math.min(f.x,other.x)-64,clusterRight=Math.max(f.x,other.x)+64,pair=2*width+24;
  if(right-inset-clusterRight>=pair)x=clusterRight+width/2+(first?0:width+24);
  else if(clusterLeft-left-inset>=pair)x=clusterLeft-width/2-(first?width+24:0);
  else x=first?Math.min(f.x-64-width/2,mid-width/2-12):Math.max(f.x+64+width/2,mid+width/2+12);
 }
 return {x:clamp(x,lo,hi),y:clamp(f.y-302,top+39+inset,bottom-51-inset)};
}
export function gazeGlyph(age){
 if(age<.08||age>=1.02)return null;
 const travel=Math.max(0,Math.min(1,(age-.25)/.13)),inspect=Math.max(0,Math.min(1,(age-.08)/.12));
 return {text:'人',x:84+56*travel,y:-194-48*travel,size:92,alpha:Math.min(1,(age-.08)/.05,(1.02-age)/.22),scale:.48+.12*inspect+.40*travel};
}
// A live glyph follows the same simulation clock and explicit cancellation as its pose.
export function fighterGazeGlyph(f){
 const p=f?.performance;if(!p||p.kind!=='ma_gaze'||p.age>=p.duration||f.hp<=0)return null;
 return gazeGlyph(p.age);
}
export function drawComicCaption(ctx,caption,x,y,alpha=1){
 if(!caption)return;
 const w=caption.width,h=caption.height;
 ctx.save();ctx.globalAlpha*=alpha;ctx.translate(x,y);
 ctx.fillStyle='#fff9e9';ctx.strokeStyle='#173c43';ctx.lineWidth=3;
 ctx.beginPath();ctx.moveTo(-w/2,-h/2);ctx.lineTo(w/2,-h/2);ctx.lineTo(w/2,h/2);ctx.lineTo(15,h/2);ctx.lineTo(0,h/2+12);ctx.lineTo(-9,h/2);ctx.lineTo(-w/2,h/2);ctx.closePath();ctx.fill();ctx.stroke();
 ctx.textAlign='center';ctx.fillStyle='#173c43';ctx.font=`900 ${caption.size}px system-ui`;ctx.fillText(caption.text,0,1);
 ctx.font='bold 16px system-ui';ctx.fillStyle='#52696a';ctx.fillText(caption.subtitle,0,25);ctx.restore();
}
export function drawHumanGlyph(ctx,glyph,x,y,face=1){
 if(!glyph)return;
 ctx.save();ctx.globalAlpha*=glyph.alpha;ctx.translate(x+face*glyph.x,y+glyph.y);ctx.scale(glyph.scale,glyph.scale);
 ctx.textAlign='center';ctx.font=`900 ${glyph.size}px system-ui`;ctx.lineWidth=10;ctx.strokeStyle='#315f8b';ctx.fillStyle='#fff0ad';ctx.shadowColor='#f5d96b';ctx.shadowBlur=20;ctx.strokeText(glyph.text,0,0);ctx.fillText(glyph.text,0,0);ctx.restore();
}
// Slow only the non-damaging release. Return a render-only copy, and relinquish it
// on the very first legal movement, defense, hit reaction, jump or next attack.
export function presentationFighter(f,record){
 const performance=f.performance,live=performance&&performance.age<performance.duration;
 // Simulation-owned performances are bounded and paused by the engine. They
 // preserve only the drawing, never attack, hit or movement state.
 if(live){
  if(f.move||f.guard||f.crouch||f.y<429||f.grabPose>0||f.grabbedPose>0||(f.attack&&f.attack.kind!==performance.kind))return f;
  const m=moves.get(performance.kind),age=performance.age;
  const key=m?.hits?Math.max(...m.hits.map(h=>h.end)):m?.end??(m?.window?Math.min(m.duration-.08,m.start+m.window):Math.min((m?.duration||performance.duration)-.08,(m?.start||0)+.08));
  const shown=m&&performance.kind!=='han_knee'&&age>key&&performance.duration>m.duration?key+(age-key)*(m.duration-key)/(performance.duration-key):age;
  return {...f,reaction:0,attack:{...(f.attack||{}),kind:performance.kind,age:Math.min(m?.duration??performance.duration,shown),presentationOutcome:performance.outcome,outcomeAge:performance.outcomeAge||0}};
 }
 if(Object.hasOwn(f,'performance'))return f;
 if(!record||record.kind==='han_knee'||f.move||f.guard||f.stun>0||f.reaction>0||f.y<429||f.grabPose>0||f.grabbedPose>0)return f;
 const m=moves.get(record.kind);if(!m||record.age>=m.duration+.28)return f;
 if(f.attack&&f.attack.kind!==record.kind)return f;
 const key=m.hits?Math.max(...m.hits.map(h=>h.end)):m.end??(m.window?Math.min(m.duration-.08,m.start+m.window):Math.min(m.duration-.08,(m.start||0)+.08));
 const age=f.attack?.age??record.age;if(age<=key)return f;
 const shown=key+(age-key)*(m.duration-key)/(m.duration+.28-key);
 return {...f,attack:{...(f.attack||{}),kind:record.kind,age:Math.min(m.duration,shown),presentationOutcome:record.outcome??'pending',outcomeAge:record.outcomeAge||0}};
}

export function nameTileOffset(age,flight=.56,face=1){return face*64*(1-Math.max(0,Math.min(1,age/flight)));}

// Joint placement in world coordinates. The camera and fighter scale are never
// changed to make room for captions. A bounded candidate search is cheap for two.
export function captionHead(f,pose=null){
 const p=pose||fighterPose(presentationFighter(f)),face=f.face||1,angle=p.headAngle||0;
 let x=(p.bodyX||0)+54*Math.sin(angle),y=(p.bodyY||0)-163.8+(HEAD_SEAT[f.type]||0)+(p.bob||0)-54*Math.cos(angle);
 if(p.kind==='arrow')y-=HEAD_SEAT[f.type]||0;
 if(p.kind==='han_knee'&&p.age>=.12&&p.age<.98){x=1;y=-176;}
 if(p.roll>.6){const a=p.rollAngle||0,lx=-13+54*Math.sin(angle),ly=-70-54*Math.cos(angle);x=lx*Math.cos(a)-ly*Math.sin(a);y=-115+lx*Math.sin(a)+ly*Math.cos(a);}
 return {x:f.x+face*x,y:f.y+y};
}
const limit=(v,a,b)=>Math.max(a,Math.min(b,v));
const intersection=(a,b,pad=0)=>Math.max(0,Math.min(a.x+a.width/2+pad,b.x+b.width/2)-Math.max(a.x-a.width/2-pad,b.x-b.width/2))*Math.max(0,Math.min(a.y+a.height/2+pad,b.y+b.height/2)-Math.max(a.y-a.height/2-pad,b.y-b.height/2));
export function captionTail(box,head){
 const dx=head.x-box.x,dy=head.y-box.y,length=Math.hypot(dx,dy)||1;
 const factor=Math.min((box.width/2-12)/Math.max(.001,Math.abs(dx)),(box.height/2-8)/Math.max(.001,Math.abs(dy)));
 const base={x:dx*factor,y:dy*factor},tip={x:head.x-dx/length*51,y:head.y-dy/length*51};
 return {base,tip,a:{x:base.x-dy/length*7,y:base.y+dx/length*7},b:{x:base.x+dy/length*7,y:base.y-dx/length*7}};
}
function tailCrosses(a,b){
 const tip=captionTail(a,a.head).tip;
 for(let t=.1;t<1;t+=.1)if(intersection({x:a.x+(tip.x-a.x)*t,y:a.y+(tip.y-a.y)*t,width:8,height:8},b)>0)return true;
 return false;
}
export function layoutMoveCaptions(entries,fighters,view,delta=16){
 if(!entries.length)return [];
 const zoom=view?.zoom||1,W=(view?.width||960)/zoom,H=(view?.height||540)/zoom,cx=view?.x??480,cy=view?.y??270,inset=12/zoom;
 const left=cx-W/2+inset,right=cx+W/2-inset,top=cy-H/2+inset,bottom=cy+H/2-inset;
 const obstacles=fighters.flatMap(f=>{const h=captionHead(f,entries.find(e=>e.f===f)?.pose);return [{...h,actor:f,width:124,height:128,weight:1000},{actor:f,x:f.x,y:(h.y+f.y)/2+20,width:124,height:Math.max(70,f.y-h.y-68),weight:80}];});
 const lists=entries.map(e=>{
  const head=captionHead(e.f,e.pose),size=Math.max(e.caption.size,24/zoom),chars=[...e.caption.text],wrap=W<900&&chars.length>3,split=Math.ceil(chars.length/2),text=wrap?chars.slice(0,split).join('')+'\n'+chars.slice(split).join(''):e.caption.text;
  const width=Math.min(right-left,Math.max(wrap?128:178,(wrap?split:chars.length)*size+36)),showSubtitle=!wrap&&(view?.height||540)>=380,height=wrap?size*2.35+20:showSubtitle?78:58;
  const behind=-(e.f.face||1),gap=76+width/2,preferred={x:head.x+behind*gap,y:head.y-45};
  const raw=[[preferred.x,preferred.y,'behind'],[head.x-behind*gap,preferred.y,'front'],[head.x,head.y-78-height/2,'above']];
  for(const [side,x] of [['left',left+width/2],['right',right-width/2]])for(const [lane,y] of [['head',head.y-45],['top',top+height/2],['middle',head.y+height+10],['low',bottom-height/2]])raw.push([x,y,side+'-'+lane]);
  fighters.forEach((f,i)=>{const h=captionHead(f,entries.find(e=>e.f===f)?.pose);for(const side of [-1,1])for(const [lane,y] of [['head',preferred.y],['middle',head.y+height+10]])raw.push([h.x+side*(76+width/2),y,'clear-'+i+'-'+side+'-'+lane]);});
  return raw.map(([x,y,slot])=>{
   const p={x:limit(x,left+width/2,right-width/2),y:limit(y,top+height/2,bottom-height/2),width,height,size,text,showSubtitle,head,slot};
   p.cost=obstacles.reduce((n,o)=>n+intersection(p,o,6)*o.weight+(o.actor!==e.f&&tailCrosses(p,o)?o.weight*20:0),0)+Math.hypot(p.x-preferred.x,p.y-preferred.y)*.4+(e.previous&&slot!==e.previous.slot?55:0);
   return p;
  });
 });
 let selected;
 if(lists.length===1)selected=[lists[0].reduce((a,b)=>a.cost<=b.cost?a:b)];
 else{let score=Infinity;for(const a of lists[0])for(const b of lists[1]){const cost=a.cost+b.cost+intersection(a,b,14)*2000+(tailCrosses(a,b)||tailCrosses(b,a)?60000:0);if(cost<score){score=cost;selected=[a,b];}}}
 // Ease only along collision-free paths. A camera edge or crossing fighter may
 // require immediate safe placement rather than dragging text across a face.
 const eased=selected.map((p,i)=>{const prev=entries[i].previous;if(!prev)return p;const k=1-Math.exp(-Math.min(100,Math.max(0,delta))/95);return {...p,x:prev.x+(p.x-prev.x)*k,y:prev.y+(p.y-prev.y)*k};});
 const safe=eased.every(p=>p.x-p.width/2>=left&&p.x+p.width/2<=right&&p.y-p.height/2>=top&&p.y+p.height/2<=bottom&&obstacles.every(o=>intersection(p,o,3)===0))&&(eased.length<2||intersection(eased[0],eased[1],10)===0&&!tailCrosses(eased[0],eased[1])&&!tailCrosses(eased[1],eased[0]));
 return (safe?eased:selected).map(p=>({...p,tail:captionTail(p,p.head)}));
}
export function paintCaptionBoard(g,p){
 const w=p.width,h=p.height,{a,b,tip}=p.tail;
 g.clear().setPosition(p.x,p.y);g.fillStyle(0xfff9e9,.98);g.lineStyle(3,0x173c43,1);
 g.fillTriangle(a.x,a.y,b.x,b.y,tip.x-p.x,tip.y-p.y);g.lineBetween(a.x,a.y,tip.x-p.x,tip.y-p.y);g.lineBetween(tip.x-p.x,tip.y-p.y,b.x,b.y);
 g.fillRoundedRect(-w/2,-h/2,w,h,14);g.strokeRoundedRect(-w/2,-h/2,w,h,14);
}
