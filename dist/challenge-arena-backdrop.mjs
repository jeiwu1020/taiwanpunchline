// Boss scenery uses the original fixed world scale. Only material outside the
// cropped painting is extended; actors, camera, curb and desk never move.
const frameFor=images=>images['challenge-arena']?{width:1536,height:1024,curb:670}:{width:2172,height:724,curb:539};
const sourceFor=images=>images['challenge-arena']||images['challenge-street'];
const blend=64;
// Optional matched art is registered to the original 1536x1024 arena. The
// generated upper canopy continues beyond its old crop; the original lower
// architecture and curb are copied back at exact source coordinates.
const canopyPad=544,canopyOrigin=439,canopySourceWidth=1254;
const hasArenaLayers=images=>images['challenge-arena']?.width>0&&images['challenge-arena-layer']?.width===canopySourceWidth&&images['challenge-arena-sky']?.width>0;
const roadSample=frame=>frame.width===1536?[640,700,880,240]:[600,620,1200,90];
export function prepareChallengeArenaImages(scene,images){
 const image=sourceFor(images);if(!image)return images;
 const frame=frameFor(images),layered=hasArenaLayers(images),pad=layered?canopyPad:0,texture=scene.textures.createCanvas('challenge-arena-facade',frame.width,frame.height+pad),ctx=texture.getContext();
 if(layered){
  const layer=images['challenge-arena-layer'],ratio=frame.width/canopySourceWidth;
  ctx.drawImage(layer,0,pad-canopyOrigin*ratio,layer.width*ratio,layer.height*ratio);
  // Blend only within solid architecture, never across open sky. Everything
  // from source row 320 to the bottom remains the original registered art.
  for(let row=256;row<320;row++){ctx.globalAlpha=(row-255)/64;ctx.drawImage(image,0,row,frame.width,1,0,pad+row,frame.width,1);}
  ctx.globalAlpha=1;ctx.drawImage(image,0,320,frame.width,frame.height-320,0,pad+320,frame.width,frame.height-320);
 }else ctx.drawImage(image,0,0,frame.width,frame.height);
 ctx.save();ctx.globalCompositeOperation='destination-out';
 // Prepare narrow edge fades once, never hundreds of alpha strips per frame.
 for(let y=0;y<blend;y++){ctx.globalAlpha=1-y/blend;if(!layered)ctx.fillRect(0,y,frame.width,1);ctx.fillRect(0,pad+frame.height-1-y,frame.width,1);}
 ctx.restore();texture.refresh();
 const [sx,sy,sw,sh]=roadSample(frame),overlap=32,stepX=sw-overlap,stepY=sh-overlap;
 const road=scene.textures.createCanvas('challenge-arena-road',stepX,stepY*4),roadCtx=road.getContext();
 roadCtx.fillStyle='#a57860';roadCtx.fillRect(0,0,stepX,stepY*4);
 // Quilt a seamless four-row material once. Each repeated crop contains only
 // native-sized pavement grain, not another street or stretched edge pixels.
 for(let row=-1;row<=4;row++){
  const phase=[0,337,674,337][((row%4)+4)%4]%stepX,dy=row*stepY-overlap;
  for(let col=-1;col<=2;col++)for(let iy=0;iy<=4;iy++)for(let ix=0;ix<=4;ix++){
   const ox=ix<4?ix*8:overlap,oy=iy<4?iy*8:overlap,w=ix<4?8:sw-overlap,h=iy<4?8:sh-overlap;
   roadCtx.globalAlpha=(iy===4?1:(iy+.5)/4)*(ix===4?1:(ix+.5)/4);
   roadCtx.drawImage(image,sx+ox,sy+oy,w,h,col*stepX-phase+ox,dy+oy,w,h);
  }
 }
 roadCtx.globalAlpha=1;road.refresh();return {...images,'challenge-arena-facade':texture.getCanvas(),'challenge-arena-road':road.getCanvas(),'challenge-arena-top-pad':pad};
}
function sky(ctx,images,image,frame,width,top,bottom){
 const layered=images['challenge-arena-top-pad']>0,warm=layered?images['challenge-arena-sky']:images['challenge-street-sky'];
 // A missing optional sky still paints real warm sky from the required arena
 // asset, never a blue placeholder or a transparent/empty upper rectangle.
 const region=warm?[0,0,warm.naturalWidth||warm.width,warm.naturalHeight||warm.height]:frame.width===1536?[470,0,640,70]:[450,0,1200,70];
 const [sx,sy,sw,sh]=region,height=bottom-top;if(height<=0)return;
 const scale=Math.max(width/sw,height/sh),cw=width/scale,ch=height/scale;
 // The matched sunset is bottom-anchored to the skyline, with one continuous
 // cover crop. No part of the unrelated street sky is composited into it.
 ctx.drawImage(warm||image,sx+(sw-cw)/2,sy+(layered?sh-ch:(sh-ch)/2),cw,ch,0,top,width,height);
}
function asphalt(ctx,images,image,frame,{width,camera,edge,bottom,scale}){
 if(bottom<=edge)return;
 const material=images['challenge-arena-road'],sample=material?[0,0,material.width,material.height]:roadSample(frame);
 const [sx,sy,sw,sh]=sample,tw=sw*scale,th=sh*scale;
 ctx.save();ctx.beginPath();ctx.rect(0,edge,width,bottom-edge);ctx.clip();
 ctx.fillStyle='#a57860';ctx.fillRect(0,edge,width,bottom-edge);
 // The camera only places already-prepared material. At normal and extreme
 // mobile viewports this is a few tiles, never hundreds of feather draws.
 const start=Math.floor(camera/tw);
 for(let row=0;edge+row*th<bottom;row++)for(let col=start,x=col*tw-camera;x<width;col++,x=col*tw-camera)
  ctx.drawImage(material||image,sx,sy,sw,sh,x,edge+row*th,tw,th);
 ctx.restore();
}
export function drawChallengeArenaBackdrop(ctx,images,{width=960,height=540,curbY=370,buildingHeight=489,camera=0,top=0,bottom=height}={}){
 const image=sourceFor(images);if(!image)return false;
 const frame=frameFor(images),facade=images['challenge-arena-facade']||image,scale=Math.max(.02,buildingHeight/frame.curb),tileW=frame.width*scale,tileH=frame.height*scale,y=curbY-buildingHeight;
 ctx.save();ctx.beginPath();ctx.rect(0,top,width,bottom-top);ctx.clip();
 const pad=images['challenge-arena-top-pad']||0,facadeHeight=frame.height+pad,facadeY=y-pad*scale;
 sky(ctx,images,image,frame,width,top,Math.max(top+1,y+(pad?320:blend)*scale));
 asphalt(ctx,images,image,frame,{width,camera,edge:y+tileH-blend*scale,bottom,scale});
 // Keep one original scene and one sun. Wide jump views continue its outer
 // tree/wall edges instead of mirroring another entire stage and sunset.
 // Extrude only the boundary source pixels underneath each strip. Separate
 // fractional drawImage calls otherwise leave a partly transparent raster
 // column between touching edges, especially while the jump camera eases.
 const bleed=Math.max(1,width/1600);
 const draw=(sx,sw,x,flip=false)=>{ctx.save();if(flip){ctx.translate(2*x+sw*scale,0);ctx.scale(-1,1);}
  ctx.drawImage(facade,sx,0,1,facadeHeight,x-bleed,facadeY,bleed+scale,facadeHeight*scale);
  ctx.drawImage(facade,sx+sw-1,0,1,facadeHeight,x+(sw-1)*scale,facadeY,bleed+scale,facadeHeight*scale);
  ctx.drawImage(facade,sx,0,sw,facadeHeight,x,facadeY,sw*scale,facadeHeight*scale);ctx.restore();};
 const x=-camera;draw(0,frame.width,x);
 const side=frame.width===1536?256:320,sideW=side*scale;
 for(let n=0,xLeft=x-sideW;xLeft+sideW>0;n++,xLeft-=sideW)draw(0,side,xLeft,n%2===0);
 for(let n=0,xRight=x+tileW;xRight<width;n++,xRight+=sideW)draw(frame.width-side,side,xRight,n%2===0);
 ctx.restore();return true;
}
