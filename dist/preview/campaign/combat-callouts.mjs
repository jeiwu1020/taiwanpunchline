import {moveCaption} from '../../move-readability.mjs?v=chapter-presentation-20261117-r1';
import {comicMoveStyle,shoutCaptionBeat,shoutCaptionLayout} from '../../shout-caption.mjs?v=chapter-presentation-20261117-r1';
import {CAST} from '../../core.mjs?v=chapter-presentation-20261117-r1';

export function makeCombatCallout(text,subtitle='',kind='impact',actorType='wang'){
 const value=String(text??'').trim();if(!value)return null;
 const size=30;
 return {text:value,subtitle:String(subtitle??''),size,width:Math.max(178,[...value].length*size+36),height:78,duration:1.35,kind,style:comicMoveStyle(kind,actorType)};
}

export function moveCalloutForMove(kind,text,actorType='wang'){
 const caption=moveCaption(kind);return caption?{...makeCombatCallout(text||caption.text,'',kind,actorType),duration:caption.duration}:null;
}

export function moveKindForAction(action,actorOrType='wang'){
 if(!/^special[123]$/.test(action??''))return action||'impact';
 const actorObj=actorOrType&&typeof actorOrType==='object'?actorOrType:null;
 const moves=actorObj?.customMoves??CAST[actorObj?.type??actorOrType]?.moves;
 return moves?.[Number(action.at(-1))-1]?.kind??'impact';
}

export function rememberCombatCallout(callouts,actor,caption,now=performance.now()){
 if(!actor||!caption)return;
 const previous=callouts.get(actor);
 if(previous?.caption.text===caption.text&&previous?.caption.subtitle===caption.subtitle&&previous.until>now)return previous;
 const record={actor,caption,started:now,until:now+caption.duration*1000,previous:previous?.placement};callouts.set(actor,record);return record;
}

export function combatCalloutEntries(state,world,actors,callouts,now=performance.now()){
 for(const [actor,record]of callouts)if(record.until<=now||!actors.includes(actor))callouts.delete(actor);
 if(!world||!state)return [];
 if(state.mode==='battle'&&world.warning?.name&&world.enemy){
  const actor=world.enemy,current=callouts.get(actor),name=world.warning.name;
  if(current?.caption.text!==name)rememberCombatCallout(callouts,actor,makeCombatCallout(name,'',moveKindForAction(world.warning.action,actor),actor.mobKind?'mini':actor.type),now);
 }else if(state.mode==='route'){
  for(const actor of actors){
   if(actor===world.player||actor.hp<=0||!actor.mobKind?.startsWith('mini_')||!(actor.warning>0))continue;
   const name=actor.chapterCaption??'注意對手動作',current=callouts.get(actor);
   if(current?.caption.text!==name)rememberCombatCallout(callouts,actor,makeCombatCallout(name,'',actor.attack?.kind??'impact',actor.mobKind?'mini':actor.type),now);
  }
 }
 return actors.flatMap(actor=>{const record=callouts.get(actor);return record?[{...record,previous:record.placement,player:actor===world.player}]:[];}).slice(0,2);
}

export function layoutCombatCallouts(entries,actors,frame,width,height,ground,delta=16,now=performance.now(),safeTop=0){
 if(!entries.length)return [];
 const zoom=Math.max(.01,frame.zoom||1),view={x:frame.left+width/(2*zoom),y:ground+(height/2-frame.base)/zoom,width,height,zoom};
 return entries.map(entry=>{
  const placement=shoutCaptionLayout(entry.caption.text,entry.player?'player':'enemy',view,{top:Math.max(0,safeTop),bottom:18},{kind:entry.caption.kind,actor:entry.actor.mobKind?'mini':entry.actor.type});
  placement.showSubtitle=!!entry.caption.subtitle;entry.previous=placement;const age=Math.max(0,now-entry.started),beat=shoutCaptionBeat(age,entry.caption.duration*1000);
  return {...entry,placement,alpha:beat.alpha,scale:beat.scale};
 });
}

function paintAccent(ctx,width,height,style,age,duration){
 const halfW=width/2,halfH=height/2,phase=Math.min(1,Math.max(.75,.75+age/440)),accent=style.accent;
 ctx.save();ctx.globalAlpha*=Math.min(.96,Math.max(0,(duration-age)/260));ctx.scale(phase,phase);ctx.strokeStyle=accent;ctx.lineWidth=3;ctx.lineJoin='round';
 const path=(points)=>{ctx.beginPath();ctx.moveTo(points[0][0],points[0][1]);for(const point of points.slice(1))ctx.lineTo(point[0],point[1]);ctx.strokeStyle='#102934';ctx.lineWidth=6;ctx.stroke();ctx.strokeStyle=accent;ctx.lineWidth=3;ctx.stroke();};
 if(style.treatment==='impact'){
  const points=Array.from({length:24},(_,i)=>{const a=i*Math.PI/12,r=i%2?.82:1;return [Math.cos(a)*halfW*r,Math.sin(a)*halfH*r];});
  points.forEach((point,i)=>path([point,points[(i+1)%points.length]]));
 }else if(style.treatment==='speed'){
  for(let i=0;i<3;i++){const y=(-.5+i*.5)*halfH;path([[-halfW-7,y+5],[-halfW+12,y-5]]);path([[halfW-12,y+5],[halfW+7,y-5]]);}
  path([[-halfW*.9,halfH+5],[halfW*.85,halfH-1]]);
 }else if(style.treatment==='combo'){
  path([[-halfW*.9,halfH+2],[halfW*.9,halfH-3]]);path([[-halfW*.65,halfH+9],[halfW*.75,halfH+4]]);
  for(const side of [-1,1]){path([[side*(halfW+3),-halfH*.6],[side*(halfW+6),-halfH*.1]]);path([[side*(halfW+6),halfH*.1],[side*(halfW+3),halfH*.6]]);}
 }else if(style.treatment==='seal'){
  for(const side of [-1,1])path([[side*halfW,-halfH*.8],[side*(halfW+4),halfH*.7],[side*(halfW-9),halfH*.7]]);
  path([[-halfW*.45,halfH+6],[halfW*.45,halfH+6]]);
 }else if(style.treatment==='flight'){
  path([[-halfW*.85,halfH+5],[halfW*.75,halfH-1],[halfW*.55,halfH-9]]);path([[halfW*.75,halfH-1],[halfW*.52,halfH+9]]);
  path([[-halfW-4,-halfH*.5],[-halfW+12,-halfH*.8]]);path([[-halfW-6,0],[-halfW+8,-halfH*.25]]);
 }else if(style.treatment==='grip'){
  for(const side of [-1,1])path([[side*(halfW+4),-halfH*.6],[side*(halfW-5),0],[side*(halfW+4),halfH*.6]]);
  path([[-halfW*.6,halfH+5],[halfW*.6,halfH+5]]);
 }else{
  for(const side of [-1,1]){const x=side*(halfW+1);path([[x-4,0],[x+4,0]]);path([[x,-5],[x,5]]);}
  path([[-halfW*.65,halfH+3],[0,halfH+7],[halfW*.65,halfH+3]]);
 }
 ctx.restore();
}

export function drawCombatCallout(ctx,item,frame,ground,width){
 const p=item?.placement;if(!p||!item.alpha)return;
 const zoom=frame.zoom||1,screenX=(p.x-frame.left)*zoom,screenY=frame.base+(p.y-ground)*zoom,tagY=frame.base+(p.tagY-ground)*zoom;
 const fontSize=p.size,lines=String(p.text).split('\n'),lineHeight=fontSize*1.05;
 ctx.save();ctx.globalAlpha*=item.alpha;ctx.translate(screenX,screenY);ctx.rotate(p.rotation||0);ctx.scale(item.scale||1,item.scale||1);
 ctx.font=`italic 1000 ${fontSize}px "Microsoft JhengHei",system-ui,sans-serif`;ctx.textAlign='center';ctx.textBaseline='middle';
 const textWidth=Math.max(...lines.map(line=>ctx.measureText(line).width)),textHeight=lines.length*lineHeight;
 paintAccent(ctx,textWidth+22,textHeight+12,item.caption.style,item.started?performance.now()-item.started:0,item.caption.duration*1000);
 ctx.shadowColor='#071b25';ctx.shadowBlur=3;ctx.shadowOffsetX=3;ctx.shadowOffsetY=4;ctx.lineWidth=7;ctx.lineJoin='round';ctx.strokeStyle='#102934';ctx.fillStyle=item.caption.style.face;
 lines.forEach((line,index)=>{const y=(index-(lines.length-1)/2)*lineHeight;ctx.strokeText(line,0,y);ctx.fillText(line,0,y);});
 ctx.shadowColor='transparent';ctx.shadowBlur=0;ctx.shadowOffsetX=0;ctx.shadowOffsetY=0;
 const speaker=item.player?'你 · '+item.caption.style.label:'';
 ctx.font=`900 ${Math.max(11,fontSize*.38)}px "Microsoft JhengHei",system-ui,sans-serif`;ctx.fillStyle=p.color||item.caption.style.accent;ctx.strokeStyle='#102934';ctx.lineWidth=3;
 if(speaker){const tagOffset=(tagY-screenY)/(item.scale||1);ctx.strokeText(speaker,0,tagOffset);ctx.fillText(speaker,0,tagOffset);}
 if(p.showSubtitle&&item.caption.subtitle){ctx.font=`900 ${Math.max(11,fontSize*.42)}px "Microsoft JhengHei",system-ui,sans-serif`;ctx.fillStyle='#fff2c7';ctx.strokeStyle='#102934';ctx.lineWidth=4;ctx.strokeText(item.caption.subtitle,0,textHeight/2+fontSize*.72);ctx.fillText(item.caption.subtitle,0,textHeight/2+fontSize*.72);}
 ctx.restore();
}
