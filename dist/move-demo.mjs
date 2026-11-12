import {CAST,GROUND} from './core.mjs?v=workers-background-only-20261113-r1';
import {HIGH_Y} from './combat-rules.mjs?v=workers-background-only-20261113-r1';
import {drawFighterArt,drawProp} from './art-render.mjs?v=workers-background-only-20261113-r1';
import {drawSignatureProp} from './art-expression.mjs?v=workers-background-only-20261113-r1';
import {moveCaption,SIGNATURE_SIZE,gazeGlyph,drawComicCaption,drawHumanGlyph,presentationFighter,nameTileOffset} from './move-readability.mjs?v=workers-background-only-20261113-r1';
import {arrowPresentation} from './art-motion.mjs?v=workers-background-only-20261113-r1';

// Presentation only. No Duel, live fighters, audio, asset loading or network.
const WIDTH=800,HEIGHT=440,FLOOR=394,SETTLE=.24,MAX_DURATION=3;
const clamp=(n,min,max)=>Math.min(max,Math.max(min,n));
const propKinds=new Set(['coin','arrow','huang_queue','chen_dream','ko_name']);

function descriptor(character,kind){
 if(typeof character!=='string'||!Object.hasOwn(CAST,character))throw new RangeError('Unknown demo character');
 const move=CAST[character].moves.find(move=>move.kind===kind);
 if(!move)throw new RangeError('Demo move does not belong to this character');
 let effectEnd=move.duration;
 if(kind==='coin')effectEnd=move.start+.85;
 if(kind==='arrow'||kind==='ko_name')effectEnd=move.start+move.flight;
 if(kind==='huang_queue')effectEnd=move.start+move.life;
 if(kind==='chen_dream')effectEnd=move.start+2*move.travel/move.speed;
 if(move.behavior==='armor')effectEnd=move.start+move.window;
 return {move,effectEnd,duration:Math.min(MAX_DURATION,Math.max(move.duration,effectEnd,moveCaption(kind).duration)+SETTLE)};
}

/** Build a fresh display model. Age is in seconds; invalid ages start at zero. */
export function buildMoveDemoFrame(character,kind,age=0){
 const {move,effectEnd,duration}=descriptor(character,kind);
 const t=clamp(Number.isFinite(age)?age:age===Infinity?duration:0,0,duration);
 const originX=propKinds.has(kind)?200:320;
 let advance=0;
 if(move.behavior==='rush'||move.behavior==='advance')advance=move.speed*clamp(t-move.advanceStart,0,move.advanceEnd-move.advanceStart);
 for(const step of move.steps||[])advance+=step.speed*clamp(t-step.start,0,step.end-step.start);
 const active=t<move.duration,fighter={type:character,x:originX+advance,y:GROUND,vy:0,face:1,move:0,guard:false,stun:0,flash:0,reaction:0,counter:0,reject:0,calm:0,armor:0,brace:0,crouch:false,crouchBlend:0,land:0,attack:active?{kind,age:t}:null};
 // Demos are honest unanswered actions. Success reactions require real combat
 // events, so only expired handshake/counter windows show the whiff beat here.
 fighter.performance=t<move.duration+(kind==='han_knee'?0:.28)?{kind,age:t,actionDuration:move.duration,duration:move.duration+(kind==='han_knee'?0:.28),outcome:kind==='ma_handshake'&&t>move.end||kind==='su_dare'&&t>move.start+move.window?'whiff':'pending',outcomeAge:0}:null;
 if(['counter','reject','calm','armor'].includes(move.behavior)&&t>=move.start&&(active||move.behavior==='armor'))fighter[move.behavior]=Math.max(0,move.start+move.window-t);
 const props=[],markers=[],labels=[],elapsed=t-move.start;
 const startX=originX+60,startY=FLOOR-HIGH_Y;
 if(elapsed>=0&&t<effectEnd){
  if(kind==='coin')props.push({kind:'coin',phase:'outbound',x:startX+move.speed*elapsed,y:startY,width:26,height:27,angle:t*6});
  if(kind==='chen_dream'){
   const turn=move.travel/move.speed,returning=elapsed>=turn;
   props.push({kind:'dream',phase:returning?'return':'outbound',x:startX+move.speed*(returning?2*turn-elapsed:elapsed),y:startY,...SIGNATURE_SIZE.dream,angle:Math.sin(t*8)*.06,flipX:returning});
  }
  if(kind==='huang_queue')props.push({kind:'queue',x:originX+move.range,y:FLOOR-37,width:92,height:74,angle:0,alpha:Math.min(1,(effectEnd-t)*3)});
  if(kind==='arrow'||kind==='ko_name'){
   const targetX=kind==='arrow'?630:originX+move.range,targetY=FLOOR-18,flight=move.flight;
   const vx=(targetX-startX)/flight,vy=(targetY-startY-.5*950*flight*flight)/flight;
   const p={x:startX+vx*elapsed,y:startY+vy*elapsed+.5*950*elapsed*elapsed,vx,vy:vy+950*elapsed,age:elapsed};
   if(kind==='arrow')props.push({kind:'arrow',...arrowPresentation(p)});
   else props.push({kind:'word',x:p.x+nameTileOffset(elapsed,flight),y:p.y,...SIGNATURE_SIZE.word,angle:0,text:'賴祥德'});
   markers.push({kind:kind==='arrow'?'arrow':'word',x:targetX,y:FLOOR,text:kind==='arrow'?'落箭':'落字'});
  }
 }
 if(kind==='heal'&&t>=move.start&&t<duration-.04)labels.push({text:`+${move.heal} 氣勢`,x:fighter.x+100,y:FLOOR-240-22*(t-move.start),color:'#28754d',size:22});
 return {character,kind,name:move.name,characterName:CAST[character].name,age:t,duration,moveDuration:move.duration,effectEnd,done:t>=duration,fighter,props,markers,labels,caption:t<moveCaption(kind).duration?moveCaption(kind):null,glyph:kind==='ma_gaze'?gazeGlyph(t):null};
}

function render(ctx,canvas,images,frame){
 const width=Number.isFinite(canvas.width)&&canvas.width>0?canvas.width:WIDTH;
 const height=Number.isFinite(canvas.height)&&canvas.height>0?canvas.height:HEIGHT;
 const scale=Math.min(width/WIDTH,height/HEIGHT);
 ctx.save();
 try{
  ctx.clearRect(0,0,width,height);ctx.fillStyle='#edf0e4';ctx.fillRect(0,0,width,height);
  ctx.translate((width-WIDTH*scale)/2,(height-HEIGHT*scale)/2);ctx.scale(scale,scale);
  ctx.textAlign='center';ctx.font='bold 20px system-ui';ctx.fillStyle='#24464a';ctx.fillText('招式示範',WIDTH-104,26);
  ctx.font='16px system-ui';ctx.fillText(`${frame.characterName} · ${frame.name}`,WIDTH-104,49);
  ctx.strokeStyle='#b9c7b2';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(54,FLOOR);ctx.lineTo(WIDTH-54,FLOOR);ctx.stroke();
  for(const marker of frame.markers){
   ctx.strokeStyle=marker.kind==='word'?'#367e8a':'#be4033';ctx.lineWidth=3;ctx.beginPath();ctx.ellipse(marker.x,marker.y,marker.kind==='word'?46:55,9,0,0,Math.PI*2);ctx.stroke();
   ctx.fillStyle=ctx.strokeStyle;ctx.font='15px system-ui';ctx.fillText(marker.text,marker.x,marker.y+24);
  }
  ctx.save();ctx.translate(frame.fighter.x,FLOOR);drawFighterArt(ctx,images,presentationFighter(frame.fighter,{kind:frame.kind,age:frame.age}),frame.age*1000);ctx.restore();
  for(const prop of frame.props){
   if(prop.kind==='coin'){
    for(let i=2;i>=0;i--){ctx.save();ctx.globalAlpha=i?.21:1;drawProp(ctx,images,'coin',prop.x-i*19,prop.y,prop.width,prop.height,prop.angle);ctx.restore();}
   }else if(prop.kind==='arrow')drawProp(ctx,images,'arrow',prop.x,prop.y,prop.width,prop.height,prop.angle);
   else if(prop.kind==='dream'){
    ctx.save();ctx.translate(prop.x,prop.y);ctx.scale(prop.flipX?-1:1,1);drawSignatureProp(ctx,images,'dream',0,0,prop.width,prop.height,prop.angle);ctx.restore();
    if(prop.phase==='return'){ctx.fillStyle='#28754d';ctx.font='16px system-ui';ctx.fillText('↶ 回程',prop.x,prop.y+30);}
   }else if(prop.kind==='queue'){
    drawSignatureProp(ctx,images,'queue',prop.x,prop.y,prop.width,prop.height,prop.angle,prop.alpha);
    ctx.strokeStyle='#ab4e3c';ctx.lineWidth=5;ctx.beginPath();ctx.moveTo(prop.x-35,FLOOR-2);ctx.lineTo(prop.x+35,FLOOR-2);ctx.stroke();
    ctx.fillStyle='#893b2c';ctx.font='15px system-ui';ctx.fillText('地面攔停',prop.x,prop.y-50);
   }else if(prop.kind==='word'){
    ctx.fillStyle='#fff7e5';ctx.fillRect(prop.x-prop.width/2,prop.y-prop.height/2,prop.width,prop.height);
    ctx.strokeStyle='#367e8a';ctx.lineWidth=3;ctx.strokeRect(prop.x-prop.width/2,prop.y-prop.height/2,prop.width,prop.height);
    ctx.fillStyle='#295e66';ctx.font=`900 ${prop.size}px system-ui`;ctx.fillText(prop.text,prop.x,prop.y+12);
   }
  }
  if(frame.glyph)drawHumanGlyph(ctx,frame.glyph,frame.fighter.x,FLOOR);
  if(frame.caption)drawComicCaption(ctx,frame.caption,Math.max(180,Math.min(620,frame.fighter.x)),76,Math.min(1,(frame.caption.duration-frame.age)/.2));
  for(const label of frame.labels){ctx.fillStyle=label.color;ctx.font=`bold ${label.size}px system-ui`;ctx.fillText(label.text,label.x,label.y);}
 }finally{ctx.restore();}
}

/**
 * Each play draws once immediately and starts exactly one finite RAF run.
 * onState receives {status, character, kind, age, duration}; stop/destroy cancel
 * outstanding frames. Replaying is deliberately left to an explicit UI action.
 */
export function createMoveDemo({canvas,images,requestFrame=callback=>globalThis.requestAnimationFrame(callback),cancelFrame=id=>globalThis.cancelAnimationFrame(id),onState=()=>{}}){
 const ctx=canvas?.getContext?.('2d');
 if(!ctx)throw new TypeError('Move demo requires a 2D canvas');
 let pending=null,generation=0,current=null,running=false,destroyed=false;
 const notify=status=>onState({status,character:current?.character??null,kind:current?.kind??null,age:current?.age??0,duration:current?.duration??0});
 function cancel(){generation++;if(pending!==null){cancelFrame(pending);pending=null;}running=false;}
 function play(character,kind){
  if(destroyed)return false;
  const first=buildMoveDemoFrame(character,kind,0); // Invalid input leaves the current run intact.
  cancel();current=first;running=true;const ticket=generation;let startedAt=null;
  render(ctx,canvas,images,current);notify('playing');
  function tick(timestamp){
   if(destroyed||!running||ticket!==generation)return;
   pending=null;
   const now=Number.isFinite(timestamp)?timestamp:startedAt??0;
   if(startedAt===null)startedAt=now;
   const age=Math.max(current.age,(now-startedAt)/1000);
   current=buildMoveDemoFrame(character,kind,age);render(ctx,canvas,images,current);
   if(current.done){running=false;notify('completed');}
   else if(!destroyed&&running&&ticket===generation)pending=requestFrame(tick);
  }
  if(!destroyed&&running&&ticket===generation)pending=requestFrame(tick);
  return first;
 }
 function stop(){if(!running)return;cancel();notify('stopped');}
 function destroy(){if(destroyed)return;cancel();destroyed=true;notify('destroyed');}
 return {play,stop,destroy};
}
