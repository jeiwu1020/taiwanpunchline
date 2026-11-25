const clamp=v=>Math.max(0,Math.min(1,v)),ease=v=>{v=clamp(v);return v*v*(3-2*v)},mix=(a,b,t)=>a+(b-a)*t;
const pulse=(t,inEnd,holdEnd,end)=>ease(t/inEnd)*(1-ease((t-holdEnd)/(end-holdEnd)));
// Coordinates are in the established right-facing rig. These beats are render
// only; art-motion maps actual combat hit/release times into this legacy clock.
export function rosterMotion(kind,t,{outcome='pending',outcomeAge=0}={}){
 if(!/^(ma_|su_|huang_|chen_|ko_|mini_)/.test(kind))return null;
 let wrist={x:9,y:-126.6},farW={x:42,y:-92},headAngle=0,drop=0,shift=0,gait=0,hand='fist',farHand='fist',handAngle=0,farHandAngle=0,handTurn,farHandTurn,shoulderLift=0,footSpread=0,bagSway=0,prop=null;
 const reach=(near,far,u)=>{wrist={x:mix(9,near.x,u),y:mix(-126.6,near.y,u)};farW={x:mix(42,far.x,u),y:mix(-92,far.y,u)};};
 if(kind==='ma_handshake'){
  const u=pulse(t,.18,.30,.56),bow=pulse(t,.16,.30,.46);reach({x:78,y:-118},{x:32,y:-148},u);headAngle=.14*bow;drop=10*bow;shift=14*bow;hand='handshake';
  if(outcome==='whiff'){const inspect=pulse(Math.max(0,t-.30),.10,.16,.26);wrist={x:mix(wrist.x,48,inspect),y:mix(wrist.y,-156,inspect)};headAngle-=.26*inspect;shift-=12*inspect;farW={x:mix(farW.x,21,inspect),y:mix(farW.y,-151,inspect)};}
 }else if(kind==='ma_gaze'){
  const u=pulse(t,.25,.38,.72),look=pulse(t,.10,.35,.62),inspect=pulse(t,.10,.18,.25);reach({x:72,y:-208},{x:46,y:-160},u);wrist.x+=11*inspect;wrist.y-=18*inspect;headAngle=-.14*look;shift=11*u;drop=-5*u;hand=t<.25?'point':'open-right';handAngle=t<.25?.28:.12;handTurn=u;
 }else if(kind==='ma_cough'){
  const u=pulse(t,.13,.56,.82),beat=(start,end)=>t>start&&t<end?Math.sin((t-start)/(end-start)*Math.PI):0,c=beat(.20,.28)+beat(.42,.50),tie=pulse(t,.05,.07,.15);reach({x:26-4*c,y:-168-8*c},{x:55,y:-132},u);farW.x-=27*tie;farW.y-=20*tie;drop=3*u+5*c;shift=4*u+4*c;shoulderLift=8*c;headAngle=.03*u+.08*c;hand=u>.05?'cough':'fist';handAngle=-.4+.08*c;prop='briefing';
 }else if(kind==='su_shout'){
  const u=pulse(t,.22,.36,.64),inhale=pulse(t,.10,.15,.22);reach({x:56,y:-139},{x:78,y:-164},u);headAngle=-.13*u+.09*inhale;drop=-4*u+4*inhale;shift=15*u-6*inhale;shoulderLift=5*inhale;farHand=u>.05?'open-left':'fist';farHandAngle=.45;farHandTurn=u;
 }else if(kind==='su_rush'){
  const u=pulse(t,.18,.48,.96),s=Math.sin(t*27)*u;gait=s*.85;reach({x:19+s*21,y:-156+s*14},{x:59-s*17,y:-144-s*12},u);shift=12*u;drop=7*u+Math.abs(s)*4;headAngle=.08*u;
 }else if(kind==='su_dare'){
  const u=pulse(t,.20,.68,.88),beck=Math.sin(t*23)*8*u;reach({x:66+beck,y:-164},{x:36,y:-106},u);shift=-8*u;drop=6*u;headAngle=-.09*u;hand='beckon';handAngle=.2+Math.sin(t*23)*.16*u;
  if(outcome==='counter'){const punch=pulse(outcomeAge,.07,.13,.25);wrist={x:mix(wrist.x,92,punch),y:mix(wrist.y,-148,punch)};farW={x:30,y:-158};hand='fist';shift+=20*punch;drop+=6*punch;headAngle=.11*punch;}
  if(outcome==='whiff'){const wait=ease((t-.68)/.12);wrist.y+=17*wait;wrist.x-=17*wait;headAngle=.15*wait;shoulderLift=6*wait*(1-ease((t-.80)/.08));}
 }else if(kind==='huang_shout'){
  const u=pulse(t,.24,.36,.68);reach({x:76,y:-176},{x:56,y:-142},u);headAngle=.11*u;drop=2*u;shift=16*u;hand=u>.08?'point-back-right':'fist';handAngle=1.12;handTurn=u;farHandTurn=0;
 }else if(kind==='huang_debt'){
  const u=pulse(t,.14,.64,.82),push=['reject','reflect'].includes(outcome)?pulse(outcomeAge,.07,.13,.24):0;reach({x:72+9*push,y:-128},{x:84+6*push,y:-174},u);headAngle=-.10*u;shift=-9*u-8*push;hand=u>.08?'back-right':'fist';farHand=u>.08?'back-left':'fist';handAngle=.9;farHandAngle=-.65;handTurn=u;farHandTurn=u;shoulderLift=4*push;
 }else if(kind==='huang_queue'){
  const u=pulse(t,.24,.38,.74),pull=pulse(t,.12,.19,.24);reach({x:82,y:-144},{x:36,y:-107},u);wrist.x-=24*pull;farW={x:mix(farW.x,61,pull),y:mix(farW.y,-139,pull)};shift=14*u-6*pull;drop=9*u;headAngle=.06*u;hand=u>.08?'back-right':'fist';handAngle=.15;handTurn=u;farHandTurn=0;gait=.45*u;if(t>0&&t<.24){prop='queue-pull';if(t<.18)hand='fist';}
 }else if(kind==='chen_dream'){
  const u=pulse(t,.22,.40,.72),release=ease((t-.30)/.12),aim=pulse(t,.12,.24,.30);reach({x:-10,y:-132},{x:36+28*release,y:-222+28*release},u);wrist.x+=12*aim;headAngle=-.14*u;shift=7*u;hand='open-right';handAngle=-.75;handTurn=u;farHand=t<.30?'plane':'open-left';farHandAngle=.4+.28*release;farHandTurn=u;
 }else if(kind==='chen_question'){
  const first=pulse(t,.18,.26,.36),second=pulse(Math.max(0,t-.28),.12,.22,.48),u=Math.max(first,second);wrist={x:9+62*first,y:-126.6-28*first};farW={x:42+42*second,y:-92+16*second};headAngle=.12*(first-second);shift=9*u;drop=9*second;hand='open-right';farHand='open-left';handAngle=.8;farHandAngle=-.7;handTurn=u;farHandTurn=u;
 }else if(kind==='chen_calm'){
  const u=pulse(t,.12,.68,.82),retreat=outcome==='calm'?pulse(outcomeAge,.06,.13,.28):0;reach({x:-18,y:-142},{x:72,y:-136},u);headAngle=-.12*u;shift=-7*u-12*retreat;shoulderLift=10*u;drop=-2*u+5*retreat;footSpread=9*retreat;hand='open-right';farHand='open-left';handAngle=-1;farHandAngle=.9;handTurn=u;farHandTurn=u;
 }else if(kind==='ko_bags'){
  const blue=pulse(t,.16,.26,.39),green=pulse(Math.max(0,t-.26),.12,.24,.46),u=Math.max(blue,green),load=pulse(t,.07,.54,.72);wrist={x:9+62*blue,y:-126.6+34*blue+6*load};farW={x:42+46*green,y:-92-44*green+4*load};headAngle=.07*u;shift=7*u-4*load;drop=9*load+3*u;shoulderLift=-3*load;footSpread=9*load;bagSway=.36*blue-.32*green;
 }else if(kind==='ko_name'){
  const u=pulse(t,.20,.42,.74),crack=pulse(t,.27,.34,.50),inhale=pulse(t,.10,.16,.26);reach({x:68,y:-180},{x:50,y:-142},u);headAngle=-.12*u+.24*crack;shift=10*u;drop=-4*inhale+3*crack;shoulderLift=4*inhale;hand='open-right';handAngle=.28;handTurn=u;
 }else if(kind==='ko_resolve'){
  const u=pulse(t,.12,.77,.92),absorb=outcome==='armor'?pulse(outcomeAge,.04,.09,.20):0;reach({x:23,y:-145},{x:58,y:-140},u);drop=14*u+4*absorb;shift=4*u+5*absorb;headAngle=-.04*u+.04*absorb;footSpread=15*u;
 }else if(kind==='mini_flyer_shot'){
  const u=pulse(t,.14,.26,.48);reach({x:66,y:-152},{x:36,y:-138},u);shift=7*u;headAngle=-.04*u;hand='open-right';handAngle=.2;handTurn=u;
 }else if(kind==='mini_whistle_charge'){
  const u=pulse(t,.18,.62,1.02),s=Math.sin(t*22)*u;reach({x:34,y:-166},{x:58,y:-122},u);drop=13*u;shift=9*u;gait=s*.6;headAngle=-.12*u;
 }else if(kind==='mini_megaphone_blast'){
  const u=pulse(t,.26,.46,.76);reach({x:68,y:-164},{x:52,y:-138},u);shift=9*u;drop=-2*u;headAngle=-.07*u;farHand=u>.05?'open-left':'fist';farHandAngle=.35;farHandTurn=u;
 }else if(kind==='mini_step_rush'){
  const u=pulse(t,.16,.62,.96),s=Math.sin(t*26)*u;gait=s*.85;reach({x:22+s*20,y:-154+s*12},{x:58-s*16,y:-140-s*10},u);shift=7*u;drop=5*u+Math.abs(s)*3;headAngle=.05*u;
 }else if(kind==='mini_notice_lob'){
  const u=pulse(t,.20,.42,.78);reach({x:58,y:-185},{x:46,y:-142},u);headAngle=-.11*u;shift=5*u;hand='open-right';handAngle=.3;handTurn=u;
 }else if(kind==='mini_folder_combo'){
  const b1=pulse(t,.16,.26,.39),b2=pulse(Math.max(0,t-.26),.12,.24,.46),u=Math.max(b1,b2);wrist={x:9+56*b1,y:-126.6+24*b1};farW={x:42+38*b2,y:-92-36*b2};shift=5*u;drop=4*u;headAngle=.04*u;
 }else if(kind==='mini_pass_grab'){
  const u=pulse(t,.20,.38,.80);reach({x:72,y:-136},{x:38,y:-148},u);shift=8*u;drop=4*u;headAngle=.06*u;hand='open-right';handAngle=.15;handTurn=u;
 }else if(kind==='mini_baton_upper'){
  const u=pulse(t,.22,.40,.72);reach({x:64,y:-204},{x:44,y:-152},u);headAngle=-.09*u;shift=6*u;drop=-3*u;
 }else if(kind==='mini_whistle_double'){
  const b1=pulse(t,.16,.28,.36),b2=pulse(Math.max(0,t-.28),.14,.24,.56),u=Math.max(b1,b2);reach({x:48,y:-172},{x:52,y:-148},u);shoulderLift=4*(b1+b2);headAngle=.05*(b1+b2);
 }else if(kind==='mini_barrier_drop'){
  const u=pulse(t,.20,.42,.72);reach({x:68,y:-118},{x:54,y:-116},u);drop=8*u;shift=9*u;headAngle=.06*u;hand='open-right';handTurn=u;
 }
 return {wrist,farW,headAngle,drop,shift,gait,hand,farHand,handAngle,farHandAngle,handTurn,farHandTurn,shoulderLift,footSpread,bagSway,prop,outcome};
}
