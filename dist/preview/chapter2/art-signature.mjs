import {drawCollarFront} from './art-collar.mjs?v=campaign-visuals-20261112-r2';
// Hand-only bounds measured from the atlas; every gesture seats at its bare wrist.
// Width is apparent hand width in world pixels, independent of arm foreshortening.
export const HAND_FRAMES={
 'open-right':{image:'signature-hands',r:[145,12,272,385],anchor:[252,390],width:32,includesSleeve:false},
 'open-left':{image:'signature-hands',r:[608,12,274,385],anchor:[768,390],width:32,includesSleeve:false},
 beckon:{image:'signature-hands',r:[1124,76,264,306],anchor:[1293,379],width:32,includesSleeve:false},
 point:{image:'signature-hands',r:[154,529,208,365],anchor:[258,891],width:28,includesSleeve:false},
 plane:{image:'signature-hands',r:[1102,579,389,324],anchor:[1146,893],width:49,includesSleeve:false},
 cough:{image:'signature-hands',r:[741,531,216,198],anchor:[793,707],width:32,mask:[[741,531],[957,531],[957,729],[839,729],[755,676],[741,650]],includesSleeve:false},
 'back-left':{image:'left-hand-back',r:[352,55,619,960],anchor:[590,1010],width:32,side:'left',surface:'back',includesSleeve:false},
 // A palm cannot become a hand back by flipping it. These two definitions
 // share a real dorsal source; the flip changes left/right anatomy only.
 'back-right':{image:'left-hand-back',r:[352,55,619,960],anchor:[590,1010],width:32,side:'right',surface:'back',flipX:true,includesSleeve:false},
 'point-back-right':{image:'right-hand-point',r:[190,100,611,1120],anchor:[529,1208],width:28,side:'right',surface:'back',includesSleeve:false},
};
export function isSignatureHand(name){return !!HAND_FRAMES[name];}
export function signatureHandAngle(arm,target=0,turn){
 if(turn==null)return target;
 const bone=Math.atan2(arm.wrist.x-arm.elbow.x,arm.elbow.y-arm.wrist.y);
 const difference=Math.atan2(Math.sin(target-bone),Math.cos(target-bone));
 return bone+difference*Math.max(0,Math.min(1,turn));
}
export function drawSignatureHand(ctx,images,name,arm,angle=0,{scale=1,glow=0}={}){
 const h=HAND_FRAMES[name],im=h&&images[h.image];if(!im)return false;
 const s=h.width/h.r[2]*scale;
 ctx.save();ctx.translate(arm.wrist.x,arm.wrist.y);ctx.rotate(angle);ctx.scale(h.flipX?-s:s,s);
 // Crops stop above the foreign grey cuff. The costume sleeve is painted last,
 // covering the bare wrist seam without retaining a second, original fist.
 if(h.mask){ctx.beginPath();h.mask.forEach(([x,y],i)=>ctx[i?'lineTo':'moveTo'](x-h.anchor[0],y-h.anchor[1]));ctx.closePath();ctx.clip();}
 if(glow){ctx.shadowColor='#ffd36a';ctx.shadowBlur=12/s*glow;}
 ctx.drawImage(im,...h.r,h.r[0]-h.anchor[0],h.r[1]-h.anchor[1],h.r[2],h.r[3]);ctx.restore();return true;
}
export function kneePresentation(age){
 const ease=v=>{v=Math.max(0,Math.min(1,v));return v*v*(3-2*v)};
 const blend=age>=.12&&age<.98?1:0;
 const crouch=.55*ease(age/.12)*(1-ease((age-.98)/.10));
 const transition=ease(age/.12)*(1-ease((age-.98)/.10));
 return {blend,crouch,transition,shout:age>=0&&age<1.08};
}
export function drawKneeArt(ctx,images,age){
 const im=images['han-lotus-body'];if(!im)return false;const p=kneePresentation(age);if(p.blend===0)return true;
 const scale=122/599,origin={x:371,y:703},neck={x:(375-371)*scale,y:-122};
 const halfKnee=62*scale,balance=lotusBalance(age,{left:{x:-halfKnee,y:0},right:{x:halfKnee,y:0}});
 ctx.save();ctx.translate(0,balance.groundY);ctx.rotate(balance.angle);
 ctx.drawImage(im,-origin.x*scale,-origin.y*scale,768*scale,768*scale);
 ctx.save();ctx.translate(neck.x,neck.y);ctx.rotate(-balance.angle*.65+(p.shout?-.025:0));
 const face=p.shout?images['han-shout']:images['han-head'];
 if(face)ctx.drawImage(face,-54.5,-114,109,120);
 ctx.restore();drawCollarFront(ctx,im,[0,0,768,768],[-origin.x*scale,-origin.y*scale,768*scale,768*scale],'lotus');
 ctx.restore();return true;
}

// A single folded-leg shape rolls between its measured knee contact points.
// This is cartoon balance, not a biomechanical reconstruction of filmed motion.
export function lotusBalance(age,anchors){
 const u=Math.max(0,Math.min(1,(age-.18)/.42));
 const angle=u>0&&u<1?Math.sin(u*Math.PI*2)*Math.sin(u*Math.PI)*.18:0;
 const rotate=p=>({x:p.x*Math.cos(angle)-p.y*Math.sin(angle),y:p.x*Math.sin(angle)+p.y*Math.cos(angle)});
 const left=rotate(anchors.left),right=rotate(anchors.right),groundY=-Math.max(left.y,right.y)||0;
 return {angle,groundY,support:left.y>=right.y?'left':'right',knees:{left:{x:left.x,y:left.y+groundY},right:{x:right.x,y:right.y+groundY}}};
}
