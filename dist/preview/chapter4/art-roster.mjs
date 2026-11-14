import {isSignatureHand,drawSignatureHand,signatureHandAngle} from './art-signature.mjs?v=campaign-boot-20261112-r3';
import {expressionFor,drawMoveAccent} from './art-expression.mjs?v=campaign-boot-20261112-r3';
import {HEAD_SEAT,drawCollarFront} from './art-collar.mjs?v=campaign-boot-20261112-r3';
const config={chen:{row:0,body:[35,17,284,421],width:87,head:112,atlas:'final-costumes',upper:[349,18,207,416],near:[614,17,172,416],far:[840,17,167,416],anchors:[687,918,30,286],thigh:[1038,27,218,407],shin:[1301,16,134,323],shoe:[1301,339,218,96]},ko:{row:0,body:[27,537,298,448],width:89,head:112,atlas:'final-costumes',upper:[346,542,213,440],near:[610,542,174,438],far:[839,542,167,438],anchors:[689,916,554,819],thigh:[1031,544,225,434],shin:[1301,545,136,354],shoe:[1297,899,223,80]},ma:{row:0,body:[47,10,245,327],width:84,head:112},su:{row:342,body:[25,352,307,315],width:100,head:119},huang:{row:683,body:[48,686,251,329],width:87,head:112}};
// These source boundaries end before skin, not eight pixels beyond a guessed
// wrist. Different atlas rows have genuinely different cuff heights.
export const ROSTER_SLEEVES={
 ma:{near:{crop:[623,8,145,204],wrist:[687,212]},far:{crop:[850,8,145,204],wrist:[918,212]}},
 su:{near:{crop:[623,350,145,177],wrist:[687,527]},far:{crop:[850,350,145,185],wrist:[918,535]}},
 huang:{near:{crop:[623,691,145,184],wrist:[690,875]},far:{crop:[850,691,145,185],wrist:[920,876]}},
 chen:{near:{crop:[614,17,172,259],wrist:[690,276]},far:{crop:[840,17,167,259],wrist:[918,276]}},
 ko:{near:{crop:[610,542,174,268],wrist:[690,810]},far:{crop:[839,542,167,269],wrist:[918,811]}},
};
export const hasRosterArt=type=>!!config[type];
const crop=(ctx,img,r,x,y,w,h)=>ctx.drawImage(img,...r,x,y,w,h);
function segment(ctx,img,r,a,b,width,cap=6){ctx.save();ctx.translate(a.x,a.y);ctx.rotate(Math.atan2(b.y-a.y,b.x-a.x)-Math.PI/2);crop(ctx,img,r,-width/2,-cap,width,Math.hypot(b.x-a.x,b.y-a.y)+cap*2);ctx.restore();}
function joined(ctx,img,r,a,b,sa,sb){const scale=Math.hypot(b.x-a.x,b.y-a.y)/Math.hypot(sb.x-sa.x,sb.y-sa.y);ctx.save();ctx.translate(a.x,a.y);ctx.rotate(Math.atan2(b.y-a.y,b.x-a.x)-Math.atan2(sb.y-sa.y,sb.x-sa.x));ctx.scale(scale,scale);crop(ctx,img,r,r[0]-sa.x,r[1]-sa.y,r[2],r[3]);ctx.restore();}
function cleanSleeve(ctx,img,s,a,elbowY,far){
 const [x,y,w,h]=s.crop,[wx,wy]=s.wrist,length=Math.hypot(a.wrist.x-a.elbow.x,a.wrist.y-a.elbow.y);
 // Bone length changes only the longitudinal scale. A shorter atlas sleeve
 // must not become wider, and the true wrist centre stays on the joint.
 const sx=(far?26:32)/w,sy=length/(wy-elbowY);
 ctx.save();ctx.translate(a.elbow.x,a.elbow.y);ctx.rotate(Math.atan2(a.wrist.y-a.elbow.y,a.wrist.x-a.elbow.x)-Math.PI/2);
 crop(ctx,img,s.crop,(x-wx)*sx,(y-elbowY)*sy,w*sx,h*sy);ctx.restore();
}
export function drawRosterArt(ctx,images,f,p){
 const c=config[f.type],row=c.row,atlas=images[c.atlas||'roster-costumes'],props=images['roster-props'];
 const leg=(l,near)=>{segment(ctx,atlas,c.thigh||[1059,row+12,191,319],l.hip,l.knee,29,7);segment(ctx,atlas,c.shin||[1318,row+10,120,240],l.knee,l.ankle,24,3);ctx.save();ctx.translate(l.ankle.x,l.ankle.y);ctx.rotate(near?-p.kick*.15:0);crop(ctx,atlas,c.shoe||[1322,row+261,187,72],-11,-3,34,13.1);ctx.restore();};
 leg(p.legs.far,false);leg(p.legs.near,true);ctx.translate(p.bodyX,p.bodyY);
 const bagArm=(a,far)=>{
  // Gravity keeps the weight below the hand. Only the hand/bag crop swings;
  // the character's clean costume sleeve stays registered to the same wrist.
  const r=far?[912,414,462,602]:[167,414,455,602],anchor=far?1139:384,s=.145;
  ctx.save();ctx.translate(a.wrist.x,a.wrist.y);ctx.rotate((far?-1:1)*(p.rosterAction?.bagSway||0));ctx.scale(s,s);
  crop(ctx,images['ko-bags'],r,r[0]-anchor,r[1]-425,r[2],r[3]);ctx.restore();
  const aa=c.anchors;cleanSleeve(ctx,atlas,ROSTER_SLEEVES.ko[far?'far':'near'],a,aa[2],far);
 };
 const hasBags=p.kind==='ko_bags',hasBlue=hasBags;
 const forearm=(a,far)=>{const gesture=p.rosterAction?.[far?'farHand':'hand'],angle=signatureHandAngle(a,p.rosterAction?.[far?'farHandAngle':'handAngle']||0,p.rosterAction?.[far?'farHandTurn':'handTurn']),x=far?850:623,aa=c.anchors||[682,915,row+18,row+222],r=far?(c.far||[x,row+8,145,328]):(c.near||[x,row+8,145,328]);
  const replacement=isSignatureHand(gesture),sleeve=ROSTER_SLEEVES[f.type][far?'far':'near'];
  if(replacement&&!p.capture)drawSignatureHand(ctx,images,gesture,a,angle,{scale:far?.93:1});
  if(replacement||(p.capture&&!far)){
   // A clean sleeve is registered to the real wrist and covers the hand seam.
   cleanSleeve(ctx,atlas,sleeve,a,aa[2],far);
  }else joined(ctx,atlas,r,a.elbow,a.wrist,{x:aa[far?1:0],y:aa[2]},{x:aa[far?1:0],y:aa[3]});
 };
 const arm=(a,far)=>{segment(ctx,atlas,c.upper||[365,row+10,181,326],a.shoulder,a.elbow,far?23:29,7);if(far&&hasBags)bagArm(a,true);else forearm(a,far);};
 drawMoveAccent(ctx,images,p,'back',f.face||1);arm(p.farArm,true);crop(ctx,atlas,c.body,-c.width/2,-169,c.width,113);
 const headImage=images[expressionFor(f.type,p,f)]||images[f.type+'-head'];ctx.save();ctx.translate(0,-163.8+HEAD_SEAT[f.type]+p.bob);ctx.rotate(p.headAngle);ctx.drawImage(headImage,-c.head/2,-114,c.head,120);ctx.restore();
 drawCollarFront(ctx,atlas,c.body,[-c.width/2,-169,c.width,113],f.type);
 drawMoveAccent(ctx,images,p,'front',f.face||1);

 segment(ctx,atlas,c.upper||[365,row+10,181,326],p.arm.shoulder,p.arm.elbow,29,7);
 if(p.rosterAction?.hand==='handshake'&&!p.capture){ctx.save();ctx.shadowColor='#ffcf61';ctx.shadowBlur=10*Math.sin(Math.min(1,p.age/.56)*Math.PI);joined(ctx,props,[300,8,224,504],p.arm.elbow,p.arm.wrist,{x:385,y:20},{x:389,y:287});ctx.restore();}
 else if(hasBlue)bagArm(p.arm,false);
 else forearm(p.arm,false);
 if(f.guard||f.counter>0||f.reject>0||f.calm>0){ctx.strokeStyle=f.counter>0?'#f5ae42aa':'#7ce1d699';ctx.lineWidth=3;ctx.beginPath();ctx.arc(0,-135,87,-1.18,1.18);ctx.stroke();}
 if(['su_shout','huang_shout'].includes(p.kind)&&p.age>(p.kind==='su_shout'?.22:.24)&&p.age<.52){const start=p.kind==='su_shout'?.22:.24,u=(p.age-start)/(.52-start);ctx.save();ctx.globalAlpha=Math.sin(u*Math.PI)*.75;ctx.strokeStyle=p.kind==='su_shout'?'#c07835':'#8d597c';ctx.lineWidth=4;for(let i=0;i<3;i++){ctx.beginPath();ctx.arc(42,-193,15+u*55+i*15,-.6,.6);ctx.stroke();}ctx.restore();}
 if(f.brace>0){ctx.strokeStyle='#5db8c4';ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(72,-192);ctx.lineTo(84,-178);ctx.lineTo(84,-93);ctx.lineTo(72,-80);ctx.stroke();}
 if(p.kind==='ma_handshake'&&p.age>.18&&p.age<.4){ctx.save();ctx.globalAlpha=Math.sin((p.age-.18)/.22*Math.PI);ctx.strokeStyle='#e8b044';ctx.lineWidth=3;for(let i=0;i<5;i++){const a=-1+i*.5;ctx.beginPath();ctx.moveTo(p.arm.wrist.x+24+Math.cos(a)*12,p.arm.wrist.y+Math.sin(a)*12);ctx.lineTo(p.arm.wrist.x+24+Math.cos(a)*25,p.arm.wrist.y+Math.sin(a)*25);ctx.stroke();}ctx.restore();}
}
