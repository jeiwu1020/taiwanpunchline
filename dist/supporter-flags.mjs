// The first supporter is supporter-woman-v46.png (1312 × 1199). Her raised
// outer fist is centered at (176, 134), well outside the face. Match the image's
// bottom-center origin, horizontal flip, and rotation before placing the pole.
export function supporterFlagLayout(bearer,view){
 const z=Math.max(.1,view.zoom||1),W=view.width,H=view.height,sign=bearer.direction<0?-1:1;
 const lx=(176-656)/1199*bearer.height*sign,ly=(134-1199)/1199*bearer.height,angle=bearer.rotation||0;
 const grip={x:bearer.x+lx*Math.cos(angle)-ly*Math.sin(angle),y:bearer.y+lx*Math.sin(angle)+ly*Math.cos(angle)};
 const sx=W/2+(grip.x-view.x)*z,sy=H/2+(grip.y-view.y)*z;
 const fontSize=W<480?13:15,text=bearer.name,widthPx=Math.max(46,Array.from(text).length*fontSize+18),heightPx=fontSize+12;
 // Keep text horizontal and above the hand. If necessary, let the cloth fly
 // the other way at an edge; never slide the pole away from the actual fist.
 let fly=sign;
 if(sx+fly*widthPx<4||sx+fly*widthPx>W-4)fly=-fly;
 const x=grip.x+fly*widthPx/2/z,y=grip.y-(8+heightPx/2)/z;
 const left=sx+Math.min(0,fly*widthPx),top=sy-8-heightPx;
 return {text,fontSize,grip,poleTop:{x:grip.x,y:grip.y-(heightPx+11)/z},x,y,width:widthPx/z,height:heightPx/z,
  visible:left>=4&&left+widthPx<=W-4&&top>=6&&sy<=H-6};
}
