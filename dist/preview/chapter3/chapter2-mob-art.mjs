import {drawAttachedProp} from './challenge-joints.mjs?v=campaign-complete-20261112-r1';
import {fighterPose,solveArm} from './art-motion.mjs?v=campaign-complete-20261112-r1';

// New fictional portraits, bodies and held props, generated for this chapter.
// Original movable limbs retain the existing complete fighter skeleton.
// Rectangles were measured from the transparent source, never guessed cells.
export const MINI_CROPS=Object.freeze([
 {head:[71,8,378,487],body:[578,17,381,480],prop:[1061,12,416,472]},
 {head:[39,519,425,497],body:[555,529,419,488],prop:[1106,522,398,488]}
]);
const limbs=[
 {upper:[637,0,183,274],fore:[898,0,172,274],thigh:[1120,0,220,274],shin:[1393,0,216,274],wrist:.66},
 {upper:[628,550,202,272],fore:[893,550,183,272],thigh:[1111,550,229,272],shin:[1388,550,222,272],wrist:.59}
];
const crop=(ctx,img,r,x,y,w,h)=>ctx.drawImage(img,...r,x,y,w,h);
function part(ctx,img,r,x,y,w,h){const k=Math.min(w/r[2],h/r[3]);crop(ctx,img,r,x+(w-r[2]*k)/2,y+h-r[3]*k,r[2]*k,r[3]*k);}
function bone(ctx,img,r,a,b,w,cap=5){ctx.save();ctx.translate(a.x,a.y);ctx.rotate(Math.atan2(b.y-a.y,b.x-a.x)-Math.PI/2);crop(ctx,img,r,-w/2,-cap,w,Math.hypot(b.x-a.x,b.y-a.y)+cap*2);ctx.restore();}
function arm(ctx,img,c,a,held){const length=Math.hypot(a.wrist.x-a.elbow.x,a.wrist.y-a.elbow.y);ctx.save();ctx.translate(a.elbow.x,a.elbow.y);ctx.rotate(Math.atan2(a.wrist.y-a.elbow.y,a.wrist.x-a.elbow.x)-Math.PI/2);if(held)crop(ctx,img,[...c.fore.slice(0,3),c.fore[3]*c.wrist],-15,-4,30,length+4);else crop(ctx,img,c.fore,-15,-4,30,length/c.wrist+4);ctx.restore();}
/** Local foot origin; caller provides world projection and facing. */
export function drawChapter2Miniboss(ctx,images,mob,time=0,{shadow=true}={}){
 const atlas=images['chapter2-miniboss-atlas'],img=images['challenge-mobs'];if(!atlas||!img)return null;
 const row=mob.mobKind==='mini_guard'?1:0,c=limbs[row],parts=MINI_CROPS[row],p=fighterPose({...mob,type:'wang',supportY:mob.supportY??430},time);
 if(row===1&&!p.kind&&!mob.guard){p.arm=solveArm(p.arm.shoulder,{x:21,y:-88+p.bob});}
 ctx.save();if(shadow){ctx.fillStyle='#33241538';ctx.beginPath();ctx.ellipse(0,2,37,7,0,0,Math.PI*2);ctx.fill();}ctx.scale(1.1,1.06);
 for(const l of [p.legs.far,p.legs.near]){bone(ctx,img,c.thigh,l.hip,l.knee,29);bone(ctx,img,[...c.shin.slice(0,3),c.shin[3]*.72],l.knee,l.ankle,25,3);crop(ctx,img,[c.shin[0],c.shin[1]+c.shin[3]*.69,c.shin[2],c.shin[3]*.31],l.ankle.x-13,l.ankle.y-5,39,16);}
 ctx.translate(p.bodyX,p.bodyY);bone(ctx,img,c.upper,p.farArm.shoulder,p.farArm.elbow,26);arm(ctx,img,c,p.farArm,false);
 part(ctx,atlas,parts.body,-45,-171,90,112);
 ctx.save();ctx.translate(1,-156+p.bob);ctx.rotate(p.headAngle);part(ctx,atlas,parts.head,-53,-119,108,123);ctx.restore();
 // Put the front collar in front of the head's short neck, without a flat patch.
 ctx.save();ctx.beginPath();ctx.moveTo(-18,-158);ctx.lineTo(-3,-150);ctx.lineTo(13,-154);ctx.lineTo(30,-144);ctx.lineTo(17,-130);ctx.lineTo(-10,-140);ctx.closePath();ctx.clip();part(ctx,atlas,parts.body,-45,-171,90,112);ctx.restore();
 bone(ctx,img,c.upper,p.arm.shoulder,p.arm.elbow,30);arm(ctx,img,c,p.arm,true);
 drawAttachedProp(ctx,atlas,parts.prop,p.arm,{width:row?88:82,height:row?102:85,fit:true,anchor:row?[.91,.86,-2.0]:[.10,.87,-1.0]});
 ctx.restore();return p;
}
