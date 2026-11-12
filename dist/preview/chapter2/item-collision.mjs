import {fighterArtPose} from './art-render.mjs?v=workers-background-only-20261113-r1';
import {presentationFighter} from './move-readability.mjs?v=workers-background-only-20261113-r1';
import {HEAD_SEAT} from './art-collar.mjs?v=workers-background-only-20261113-r1';
import {HAND_FRAMES,signatureHandAngle,lotusBalance} from './art-signature.mjs?v=workers-background-only-20261113-r1';

// Paper rises visibly from the wrist rather than teleporting to an invisible
// high hitbox. Close contact during this rise still counts, including crouchers.
export const PAPER_FLIGHT=Object.freeze({riseTime:.18,height:265});
export function itemFighterPose(f,time=0){
 const shown=f.attack?.kind==='item_throw'?{...f,attack:{...f.attack,kind:'punch',variant:'right'}}:presentationFighter(f);
 return fighterArtPose(shown,time);
}
const rotate=(p,a)=>({x:p.x*Math.cos(a)-p.y*Math.sin(a),y:p.x*Math.sin(a)+p.y*Math.cos(a)});
const add=(p,q)=>({x:p.x+q.x,y:p.y+q.y});
const point=(x,y)=>({x,y});

// Separate capsules follow only visible flesh/clothing, not one enclosing box.
// Radii fit inside the drawn costume widths; the projectile contributes its
// own visible radius. Empty elbow/leg gaps, bow strings and carried props stay empty.
export function itemBodyShapes(f,p=itemFighterPose(f)){
 const shapes=[],face=f.face||1;
 const world=q=>({x:f.x+face*q.x,y:f.y+q.y});
 const capsule=(name,a,b,r,transform=q=>q)=>shapes.push({name,a:world(transform(a)),b:world(transform(b)),r});
 const head=(origin,angle,transform=q=>q)=>{
  const at=(x,y)=>add(origin,rotate(point(x,y),angle));
  if(f.type==='han'&&p.kind==='han_knee'){
   // The shouting portrait is visibly narrower/asymmetric, unlike the other
   // portraits. Preserve its bald top and cheek/chin contour separately.
   capsule('head',at(-5,-86),at(-5,-78),25,transform);
   capsule('head-cheeks',at(-4,-62),at(-3,-40),31,transform);
   capsule('head-chin',at(4,-26),at(4,-15),20,transform);
  }else capsule('head',at(0,-64),at(0,-44),46,transform);
 };
 if(p.roll>.6){
  const turn=q=>add(point(0,-115),rotate(add(q,point(0,115)),p.rollAngle));
  // Measured cutout: the jacket is broad above the folded knees, but tapers
  // sharply at the lower right. Shoes protrude separately, not a giant circle.
  capsule('roll-torso',point(-25,-112),point(-26,-59),25,turn);
  capsule('roll-near-leg',point(2,-99),point(-3,-38),20,turn);
  capsule('roll-far-leg',point(27,-98),point(24,-36),18,turn);
  capsule('roll-near-arm',point(-35,-82),point(28,-60),15,turn);
  capsule('roll-far-arm',point(42,-99),point(48,-71),14,turn);
  capsule('roll-near-hand',point(34,-65),point(40,-62),14,turn);
  capsule('roll-far-hand',point(45,-73),point(47,-69),12,turn);
  capsule('roll-near-foot',point(4,-21),point(27,-16),7,turn);
  capsule('roll-far-foot',point(27,-24),point(47,-18),6,turn);
  head(point(-13,-131),p.headAngle||0,turn);
  return shapes;
 }
 if(p.kind==='han_knee'&&p.actualAge>=.12&&p.actualAge<.98){
  const half=62*122/599,balance=lotusBalance(p.age,{left:point(-half,0),right:point(half,0)});
  const turn=q=>add(rotate(q,balance.angle),point(0,balance.groundY));
  head(point(4*122/599,-122),-balance.angle*.65-.025,turn);
  capsule('torso',point(0,-108),point(0,-54),26,turn);
  // The lotus artwork's folded legs are only about 56px wide. These measured
  // knee shapes must not inherit the much wider standing-leg/arm envelope.
  capsule('folded-thighs',point(-13,-26),point(13,-26),14,turn);
  capsule('near-knee',point(-13,-24),point(-half,-10),12,turn);
  capsule('far-knee',point(13,-24),point(half,-10),12,turn);
  capsule('near-upper-arm',point(-23,-108),point(-32,-72),10,turn);
  capsule('near-forearm',point(-32,-72),point(-7,-75),11,turn);
  capsule('far-upper-arm',point(18,-108),point(25,-70),11,turn);
  capsule('far-forearm',point(25,-70),point(40,-61),10,turn);
  capsule('near-hand',point(-7,-73),point(3,-79),9,turn);
  capsule('far-hand',point(45,-65),point(54,-59),9,turn);
  return shapes;
 }
 const lean=p.roll>0?q=>add(rotate(q,.12*p.roll),point(0,13*p.roll)):q=>q;
 const body=q=>lean(add(q,point(p.bodyX||0,p.bodyY||0)));
 const width={wang:84,han:84,ma:84,su:100,huang:87,chen:87,ko:89}[f.type]||84,r=width/2-5;
 capsule('torso',point(0,-169+r),point(0,-56-r),r,body);
 head(point(0,-163.8+(p.kind==='arrow'?0:HEAD_SEAT[f.type]||0)+(p.bob||0)),p.headAngle||0,body);
 for(const [name,leg]of Object.entries(p.legs||{})){
  capsule(name+'-thigh',leg.hip,leg.knee,14,lean);
  capsule(name+'-shin',leg.knee,leg.ankle,11,lean);
  capsule(name+'-foot',add(leg.ankle,point(-5,4)),add(leg.ankle,point(17,4)),6,lean);
 }
 if(p.kind==='arrow'){
  // The archery cutout replaces the rig arms. The bow itself is not a hurtbox.
  capsule('near-arm',point(-29,-143),point(15,-155),13,body);
  capsule('far-arm',point(23,-143),point(117,-144),11,body);
  capsule('near-hand',point(15,-155),point(23,-155),10,body);
  capsule('far-hand',point(117,-144),point(123,-144),10,body);
  return shapes;
 }
 for(const [key,far]of [['arm',false],['farArm',true]]){
  const arm=p[key];if(!arm)continue;
  capsule(key+'-upper',arm.shoulder,arm.elbow,far?11.5:14.5,body);
  capsule(key+'-forearm',arm.elbow,arm.wrist,far?12:14,body);
  const gesture=p.rosterAction?.[far?'farHand':'hand'],h=HAND_FRAMES[gesture];
  if(h&&!p.capture){
   const scale=h.width/h.r[2]*(far?.93:1),radius=h.width*(far?.93:1)*.4;
   const x=(h.r[0]+h.r[2]/2-h.anchor[0])*scale,y1=(h.r[1]-h.anchor[1])*scale+radius,y2=(h.r[1]+h.r[3]-h.anchor[1])*scale-radius;
   const angle=signatureHandAngle(arm,p.rosterAction?.[far?'farHandAngle':'handAngle']||0,p.rosterAction?.[far?'farHandTurn':'handTurn']);
   const at=y=>add(arm.wrist,rotate(point(h.flipX?-x:x,y),angle));
   capsule(key+'-hand',at(Math.min(y1,y2)),at(Math.max(y1,y2)),radius,body);
  }else{
   const dx=arm.wrist.x-arm.elbow.x,dy=arm.wrist.y-arm.elbow.y,length=Math.hypot(dx,dy)||1;
   capsule(key+'-hand',arm.wrist,add(arm.wrist,point(dx/length*20,dy/length*20)),10,body);
  }
 }
 return shapes;
}

function pointSegmentDistanceSq(p,a,b){
 const dx=b.x-a.x,dy=b.y-a.y,length=dx*dx+dy*dy;
 const t=length?Math.max(0,Math.min(1,((p.x-a.x)*dx+(p.y-a.y)*dy)/length)):0;
 return (p.x-a.x-t*dx)**2+(p.y-a.y-t*dy)**2;
}
export function segmentDistanceSq(a,b,c,d){
 const cross=(u,v)=>u.x*v.y-u.y*v.x,ab=point(b.x-a.x,b.y-a.y),cd=point(d.x-c.x,d.y-c.y),ac=point(c.x-a.x,c.y-a.y),den=cross(ab,cd);
 if(Math.abs(den)>1e-9){const t=cross(ac,cd)/den,u=cross(ac,ab)/den;if(t>=0&&t<=1&&u>=0&&u<=1)return 0;}
 return Math.min(pointSegmentDistanceSq(a,c,d),pointSegmentDistanceSq(b,c,d),pointSegmentDistanceSq(c,a,b),pointSegmentDistanceSq(d,a,b));
}
export function itemProjectileTouches(p,f,previous={x:p.x,y:p.y},pose=itemFighterPose(f)){
 const end=point(p.x,p.y),radius=p.radius;
 return itemBodyShapes(f,pose).some(s=>segmentDistanceSq(previous,end,s.a,s.b)<=(radius+s.r)**2);
}
