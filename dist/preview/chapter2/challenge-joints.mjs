/** Attach the actual painted cuff inlet, not the crop's centre, to the wrist.
 * Anchors were measured on the unchanged transparent atlases. The whole hand
 * and held object turn together so raising an arm cannot tear its cuff away.
 * This is drawing-only: no actor, attack, collision or save state is changed. */
export function drawAttachedProp(ctx,image,rect,arm,{width,height,anchor,fit=false}){
 if(fit){const scale=Math.min(width/rect[2],height/rect[3]);width=rect[2]*scale;height=rect[3]*scale;}
 const [x,y,axis]=anchor;
 const paintedAxis=Math.atan2(Math.sin(axis)*height,Math.cos(axis)*width);
 const forearmAxis=Math.atan2(arm.wrist.y-arm.elbow.y,arm.wrist.x-arm.elbow.x);
 ctx.save();ctx.translate(arm.wrist.x,arm.wrist.y);ctx.rotate(forearmAxis-paintedAxis);
 ctx.drawImage(image,...rect,-x*width,-y*height,width,height);ctx.restore();
}
