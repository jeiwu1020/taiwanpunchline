// Presentation only: collision radii, damage and simulation timing remain in core.
export const ITEM_ART={paper:{key:'item-paper',file:'assets/item-paper-v47.png',width:56,height:37.33},rubber_duck:{key:'item-duck',file:'assets/item-duck-v47.png',width:66,height:44}};
export function itemActorName(actor,other,cast){return (cast[actor.type]?.name||'角色')+(actor.type===other.type?(actor.id==='player'?'（你）':'（對手）'):'');}
// Store the chosen hand with the item episode, never reselect it each frame.
export function chooseCarryHand(pose){return (pose?.farArm?.wrist?.y??-92)>(pose?.arm?.wrist?.y??-127)?'farArm':'arm';}
export function heldItemAnchor(f,pose,hand='farArm'){
 if(!f.item||!pose)return null;
 const wrist=pose[hand]?.wrist||{x:42,y:-92};let x=wrist.x+(pose.bodyX||0)+10,y=wrist.y+(pose.bodyY||0)-3;
 // Full-body action cutouts use measured wrist anchors rather than hidden rig arms.
 if(pose.kind==='han_knee'&&pose.actualAge>=.12&&pose.actualAge<.98){x=hand==='farArm'?52:0;y=hand==='farArm'?-66:-77;}
 if(pose.kind==='arrow'){x=(hand==='farArm'?117:15)+(pose.bodyX||0);y=(hand==='farArm'?-144:-155)+(pose.bodyY||0);}
 if(pose.roll>.6){const px=hand==='farArm'?39:-27,py=hand==='farArm'?12:5,c=Math.cos(pose.rollAngle),s=Math.sin(pose.rollAngle);x=px*c-py*s;y=-115+px*s+py*c;}
 else if(pose.roll>0){const c=Math.cos(.12*pose.roll),s=Math.sin(.12*pose.roll),xx=x*c-y*s;y=13*pose.roll+x*s+y*c;x=xx;}
 return {x:f.x+f.face*x,y:f.y+y,hand,rotation:f.face*(pose.roll>.6?pose.rollAngle:0),flip:f.face<0,scale:.68};
}
