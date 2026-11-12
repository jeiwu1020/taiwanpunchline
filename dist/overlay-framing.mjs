// Presentation-only adapter. Existing cameras still choose their zoom/easing
// and follow mode; combat/world coordinates and the HUD never change.
const clamp=(n,min,max)=>Math.max(min,Math.min(max,n));
export function overlayCameraFrame(camera,width,height,fighters,previous=null,delta=1000/60,overlayControls=false){
 if(!overlayControls)return camera(width,height,fighters,previous,delta);
 const w=Math.max(1,width),h=Math.max(1,height),reserve=Math.min(66,h/2),viewHeight=h-reserve;
 const old=previous?.overlayView;
 const frame=camera(w,viewHeight,fighters,old,delta);
 const classic=frame.mode==='classic',topInset=Math.min(classic?12:8,viewHeight/4),bottomInset=Math.min(classic?10:14,viewHeight/4);
 // The 84px stick is 14px from the left, with a 6px visible clearance.
 // Keep the full conservative fighter envelope to its right. Near fights
 // need no horizontal adjustment; wide fights may move a little or zoom out.
 const leftInset=Math.min(104,w/3),rightInset=Math.min(classic?10:18,w/4);
 const left=Math.min(...fighters.map(f=>f.x))-130,right=Math.max(...fighters.map(f=>f.x))+130;
 const top=Math.min(...fighters.map(f=>f.y))-285,bottom=458;
 const zoom=Math.min(frame.zoom,(w-leftInset-rightInset)/Math.max(1,right-left));
 const x=clamp(frame.x,right-(w/2-rightInset)/zoom,left+(w/2-leftInset)/zoom);
 const y=clamp(frame.y,bottom-(viewHeight/2-bottomInset)/zoom,top+(viewHeight/2-topInset)/zoom);
 // Store the fitted camera in its original coordinate system for next-frame
 // easing. Translate only the output so its safe rectangle starts at canvas y=0.
 const overlayView={...frame,x,y,zoom};
 return {...frame,x,y:y+reserve/(2*zoom),zoom,width:w,height:h,overlayView};
}
// Size once per viewport/mode, not per actor position: the camera exposes an
// extra lower strip behind the translucent controls. Extend the same anchored
// backdrop enough for the widest legal gap and highest jump, without pumping.
export function overlayBackgroundFrame(background,width,height,frame){
 if(!frame?.overlayView)return background(width,height,frame);
 const w=Math.max(1,width),h=Math.max(1,height),reserve=Math.min(66,h/2),viewHeight=h-reserve;
 const classic=frame.mode==='classic',top=Math.min(classic?12:8,viewHeight/4),bottom=Math.min(classic?10:14,viewHeight/4),ease=Math.min(classic?10:6,viewHeight/8);
 const left=Math.min(104,w/3),right=Math.min(classic?10:18,w/4);
 const minZoom=Math.min(classic?1.45:1.12,(w-left-right)/1084,(w-right*2)/(classic?1094:1084),(viewHeight-top-bottom-ease)/583);
 const worldTop=458-(viewHeight-bottom)/minZoom-1;
 const worldBottom=Math.max(458+(reserve+bottom)/minZoom,300+(h+reserve)/2/minZoom)+1;
 const aspect=1672/941,fixedHeight=Math.max((430-worldTop)/.76,(worldBottom-430)/.24,(w/minZoom+1084+80)/aspect);
 return{x:480,y:430,width:fixedHeight*aspect,height:fixedHeight,top:430-fixedHeight*.76,bottom:430+fixedHeight*.24,floor:430};
}
