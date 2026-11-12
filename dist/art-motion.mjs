import {COMBAT} from './combat-rules.mjs?v=campaign-complete-20261112-r1';
import {rosterMotion} from './art-roster-motion.mjs?v=campaign-complete-20261112-r1';
export const clamp=(v,a=0,b=1)=>Math.min(b,Math.max(a,v));
export const ease=v=>{const t=clamp(v);return t*t*(3-2*t)};
export function activeSpitAge(f,now,started){
 if(started==null||f.guard||(f.attack&&f.attack.kind!=='heal'))return 0;
 const elapsed=(now-started)/1000;return elapsed>=0&&elapsed<.52?Math.max(.001,elapsed):0;
}
export function retainSpitEpisode(record,f,now){
 return record&&!f.guard&&(!f.attack||f.attack.kind==='heal')&&now-record.time<520?record:null;
}
const mix=(a,b,t)=>a+(b-a)*t;
export function solveArm(s,w,l1=57,l2=57){
 const raw=Math.hypot(w.x-s.x,w.y-s.y),dx=raw?w.x-s.x:1,dy=raw?w.y-s.y:0,d=clamp(raw,.001,l1+l2-.001);
 const a=Math.atan2(dy,dx)+Math.acos(clamp((l1*l1+d*d-l2*l2)/(2*l1*d),-1,1));
 return {shoulder:s,elbow:{x:s.x+Math.cos(a)*l1,y:s.y+Math.sin(a)*l1},wrist:{x:s.x+dx*d/Math.hypot(dx,dy),y:s.y+dy*d/Math.hypot(dx,dy)}};
}
export function solveLeg(hip,ankle,l1=35,l2=40){
 const dx=ankle.x-hip.x,dy=ankle.y-hip.y,raw=Math.hypot(dx,dy)||.001,d=clamp(raw,Math.abs(l1-l2)+.001,l1+l2-.001),angle=Math.atan2(dy,dx)-Math.acos(clamp((l1*l1+d*d-l2*l2)/(2*l1*d),-1,1));
 return {hip,knee:{x:hip.x+Math.cos(angle)*l1,y:hip.y+Math.sin(angle)*l1},ankle:{x:hip.x+dx*d/raw,y:hip.y+dy*d/raw}};
}
const legacyTimings={rush:{start:.12,end:.5,duration:.66},counter:{start:.10,window:.58,duration:.8},heal:{start:.8,duration:1},coin:{start:.16,duration:.42},arrow:{start:.24,duration:.55},ma_handshake:{start:.18,end:.30,duration:.56},ma_gaze:{start:.25,end:.38,duration:.72},ma_cough:{hits:[{start:.20,end:.28},{start:.42,end:.50}],duration:.82},su_shout:{start:.22,end:.36,duration:.64},su_dare:{start:.20,window:.48,duration:.88},huang_shout:{start:.24,end:.36,duration:.68},huang_debt:{start:.14,window:.50,duration:.82},huang_queue:{start:.24,duration:.74},chen_dream:{start:.30,duration:.72},chen_question:{hits:[{start:.18,end:.27},{start:.40,end:.50}],duration:.76},chen_calm:{start:.12,window:.56,duration:.82},ko_bags:{hits:[{start:.16,end:.26},{start:.38,end:.50}],duration:.72},ko_name:{start:.26,duration:.74},ko_resolve:{start:.12,duration:.92}};
export function visualTime(kind,t){
 const old=legacyTimings[kind],now=COMBAT[kind];if(!old||!now)return t;
 const pairs=[[0,0]];for(const k of ['start','end'])if(now[k]!=null&&old[k]!=null)pairs.push([now[k],old[k]]);
 if(now.window&&old.window)pairs.push([now.start+now.window,old.start+old.window]);
 if(now.hits&&old.hits)for(let i=0;i<old.hits.length;i++)for(const k of ['start','end'])pairs.push([now.hits[i][k],old.hits[i][k]]);
 pairs.push([now.duration,old.duration]);pairs.sort((a,b)=>a[0]-b[0]);
 for(let i=1;i<pairs.length;i++)if(t<=pairs[i][0]){const [a,x]=pairs[i-1],[b,y]=pairs[i];return x+(y-x)*clamp((t-a)/Math.max(.0001,b-a));}
 return old.duration+(t-now.duration);
}
export function fighterPose(f,time=0,spit=0,impact=null){
 const kind=f.attack?.kind||'',actualAge=Math.max(0,f.attack?.age||0),age=visualTime(kind,actualAge),bob=f.y>=(f.supportY??430)-1?Math.sin(time*.006)*.6:0;
 let walking=!kind&&!f.stun?Math.sin(time*.014)*Math.min(1,Math.abs(f.move||0)):0;
 const variant=f.attack?.variant||'right',airFold=clamp(((f.supportY??430)-f.y)/50),crouch=ease(clamp(f.crouchBlend??(f.crouch?1:0))),phase=time*.014;
 let wrist={x:9+walking*7,y:-126.6+walking*4},farW={x:42-walking*14,y:-92-walking*9},farHand='palm',head='head',headAngle=0,roll=0,rollAngle=0,kick=0;
 if(kind==='punch'){
  const extend=age<.11?ease(age/.11):1-ease((age-.22)/.10);
  farHand='fist';
  if(variant==='left'){wrist={x:mix(9,-7,extend),y:mix(-126.6,-151,extend)};farW={x:mix(42,102,extend),y:mix(-92,-138,extend)};}
  else if(variant==='kick'){kick=extend;wrist={x:mix(9,-14,extend),y:mix(-126.6,-155,extend)};farW={x:mix(42,52,extend),y:mix(-92,-155,extend)};}
  else{wrist={x:mix(9,68,extend),y:mix(-126.6,-135,extend)};farW={x:mix(42,49,extend),y:mix(-92,-158,extend)};}
 }else if(f.guard||kind==='counter'){
  const lift=f.guard?1:ease(age/.10)*(1-ease((age-.68)/.12));
  farHand=kind==='counter'?'palm':'fist';farW={x:mix(42,kind==='counter'?30:49,lift),y:mix(-92,kind==='counter'?-194:-158,lift)};
  wrist={x:mix(9,23,lift),y:mix(-126.6,-171,lift)};headAngle=kind==='counter'?-.05*lift:0;
 }
 else if(kind==='heal'||spit>0){
  farW={x:spit>0?58:52,y:spit>0?-102:-90};
  if(spit>0){
   const from=impact?.wrist||{x:38.4,y:-171},lifted=from.y<-146,away={x:from.x+18,y:Math.min(-126.6,from.y+20)};
   const u=lifted?(spit<.12?ease(spit/.12):ease((spit-.12)/.4)):ease(spit/.52),end=lifted&&spit<.12?away:{x:9,y:-126.6},start=lifted&&spit>=.12?away:from;
   wrist={x:mix(start.x,end.x,u),y:mix(start.y,end.y,u)};head='shock';headAngle=(impact?.headAngle??-.035)*(1-ease(spit/.52));
  }else{
   const lift=age<.25?ease(age/.25):1-ease((age-.83)/.17);
   wrist={x:mix(9,38.4,lift),y:mix(-126.6,-171,lift)};head='sip';headAngle=-.035*lift;
  }
 }else if(kind==='coin'){const reach=ease(age/.13)*(1-ease((age-.25)/.17));wrist={x:mix(9,27,reach),y:mix(-126.6,-217,reach)};farW={x:mix(42,55,reach),y:mix(-92,-151,reach)};}
 else if(kind==='shout'){const reach=ease(age/.12)*(1-ease((age-.42)/.18));wrist={x:mix(9,40,reach),y:mix(-126.6,-135,reach)};farW={x:mix(42,75,reach),y:mix(-92,-155,reach)};head='shock';headAngle=-.035;}
 else if(kind==='rush'){
  // The cutout threshold is roll>.6. Align that threshold with real lowProfile.
  roll=ease((actualAge-(COMBAT.rush.start-.0567069))/.1)*(1-ease((actualAge-(COMBAT.rush.end-.0432931))/.1));
  rollAngle=clamp((age-.12)/.42)*Math.PI*4;head='shock';
 }
 const rosterAction=rosterMotion(kind,age,{outcome:f.attack?.presentationOutcome??f.performance?.outcome??(f.attack?.hit?'hit':'pending'),outcomeAge:f.attack?.outcomeAge??f.performance?.outcomeAge??0});if(rosterAction){wrist=rosterAction.wrist;farW=rosterAction.farW;headAngle=rosterAction.headAngle;walking=rosterAction.gait;farHand=rosterAction.farHand||'fist';}
 if(kind==='su_rush'){
  let gait=0;for(const [i,start] of [.12,.32,.52].entries())if(actualAge>=start&&actualAge<=start+.1)gait=Math.sin((actualAge-start)/.1*Math.PI)*(i%2?-1:1)*.85;
  walking=gait;wrist={x:19+gait*21,y:-156+gait*14};farW={x:59-gait*17,y:-144-gait*12};
  const brake=ease((actualAge-.69)/.07)*(1-ease((actualAge-.84)/.12));
  if(rosterAction){rosterAction.gait=gait;rosterAction.drop=(5+Math.abs(gait)*3)*(1-ease((actualAge-.84)/.12));rosterAction.shift=8*(1-ease((actualAge-.69)/.08))-8*brake;rosterAction.footSpread=13*brake;headAngle=-.10*brake+.055*(1-brake);wrist.x-=14*brake;farW.x+=8*brake;}
 }
 if(airFold>0&&!kind){wrist={x:9+airFold*8,y:-126.6-airFold*20};farW={x:42+airFold*12,y:-92-airFold*24};}
 if(crouch>0){if(!(spit>0&&impact?.wrist))wrist={x:mix(wrist.x,23,crouch),y:mix(wrist.y,-163,crouch)};farW={x:mix(farW.x,49,crouch),y:mix(farW.y,-153,crouch)};farHand='fist';}
 if(f.reaction>0){farW={x:58,y:-114};head='shock';headAngle=Math.sin((.52-f.reaction)*11)*-.10;}
 const capture=(f.grabPose||0)>0||(f.grabbedPose||0)>0;
 if(capture){wrist={x:33,y:-133};farW={x:42,y:-153};walking=0;if(rosterAction){rosterAction.hand='capture';rosterAction.shift=0;rosterAction.drop=0;}}
 const shoulder={x:-28.8,y:-142.2+bob-(rosterAction?.shoulderLift||0)};wrist.y+=bob;
 const airborne=f.y<(f.supportY??430)-1,landing=Math.sin(Math.PI*clamp((f.land||0)/.18)),bodyY=42*crouch+5*landing+(rosterAction?.drop||0)-(walking?Math.abs(Math.sin(phase))*2:0),bodyX=3*crouch-5*kick+(rosterAction?.shift||0);
 const nearAnkle={x:mix(-24+walking*12-(rosterAction?.footSpread||0),52,kick),y:mix(-8-(airborne?22*airFold:Math.max(0,walking)*10),-35,kick)};
 const farAnkle={x:24-walking*12+(rosterAction?.footSpread||0),y:-8-(airborne?15*airFold:Math.max(0,-walking)*10)};
 const legs={near:solveLeg({x:-16+bodyX,y:-78+bodyY+20*kick},nearAnkle),far:solveLeg({x:15+bodyX,y:-78+bodyY},farAnkle)};
 farW.y+=bob;
 return {rosterAction,kind,age,actualAge,capture,variant,bob,walking,crouch,bodyY,bodyX,kick,head,headAngle,roll,rollAngle,spit,arm:solveArm(shoulder,wrist),farArm:solveArm({x:23,y:-140+bob-(rosterAction?.shoulderLift||0)},farW,42,42),farHand,legs,airborne};
}
export function arrowPresentation(p){
 const age=Math.max(0,p.age||0),face=p.vx<0?-1:1,u=clamp(age/1.2),start=face<0?Math.PI:0,target=Math.atan2(p.vy,p.vx);
 const turn=Math.atan2(Math.sin(target-start),Math.cos(target-start));
 const release=ease((age-.12)/.14),lead=(41+120*ease(age/.12))*(1-u);
 // Keep the arrow level until its tail clears the bow, then join the arc.
 const undoRise=(-p.vy*age+.5*950*age*age)*(1-release);
 return {x:p.x+face*lead,y:p.y-15*(1-u)+undoRise,angle:start+turn*release,width:150,height:13};
}
