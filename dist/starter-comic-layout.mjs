const INK='#173239',PAPER='#fff3d3';
function linesOf(text,columns){const out=[];for(const line of text.split('\n')){let chars=Array.from(line);while(chars.length){out.push(chars.splice(0,columns).join(''));}if(!line)out.push('');}return out;}
export function comicLayout(width,height,bubbles){
 if(!Number.isFinite(width)||!Number.isFinite(height)||width<240||height<260)throw new RangeError('Unsupported comic size');
 const landscape=width>height*1.35,font=landscape&&height<400?24:Math.max(24,Math.min(30,Math.floor(width*.067))),pad=14,gap=16;
 const column=landscape?Math.min(360,Math.max(294,width*.39)):width-28;
 let y=14;const boxes=bubbles.map((b,i)=>{const lines=linesOf(b.text,Math.floor((column-32)/font));const bh=lines.length*font*1.28+42;const box={...b,x:14,y,width:column,height:bh,lines,index:i};y+=bh+gap;return box;});
 const art=landscape?{x:column+30,y:14,width:width-column-44,height:height-28}:{x:14,y:Math.max(14,y),width:width-28,height:height-Math.max(14,y)-14};
 if(art.height<68||boxes.some(b=>b.y+b.height>height-8))throw new RangeError('Comic size cannot fit the dialogue at a readable font');
 return {font,bubbles:boxes,art,width,height,landscape,pad};
}
function cover(ctx,img,r,focus=.5){const scale=Math.max(r.width/img.width,r.height/img.height),sw=r.width/scale,sh=r.height/scale;ctx.drawImage(img,(img.width-sw)*focus,(img.height-sh)/2,sw,sh,r.x,r.y,r.width,r.height);}
function contain(ctx,img,src,r){const scale=Math.min(r.width/src[2],r.height/src[3]),w=src[2]*scale,h=src[3]*scale;ctx.drawImage(img,...src,r.x+(r.width-w)/2,r.y+(r.height-h)/2,w,h);}
export const STARTER_POSES=Object.freeze({
 wang:{sleep:[164,5,315,615],clock:[718,5,395,613],suit:[153,631,310,619],run:[661,638,477,612]},
 han:{sleep:[187,5,289,618],clock:[719,5,401,619],suit:[156,632,330,620],run:[671,635,464,612]},
});
export const PREVIEW_ASSETS={wang:'wang-complete-poses-b.png',han:'han-complete-poses-b.png',wangRoom:'wang-bedroom-b.png',hanRoom:'han-bedroom-b.png',props:'props.png',street:'street.webp',news:'news-chamber-b.png'};
function windowMicGeometry(width,height,layout,time=0,reducedMotion=false,fitEnvelope=false){
 const scale=Math.max(width/1536,height/1024),sw=width/scale,sh=height/scale,focus=.18+Math.min(1,time/2200)*.015;
 const left=(1536-sw)*focus,top=(1024-sh)/2;
 // Conservative glass interior, projected through the same crop and reverse angle as the room.
 const pane={left:Math.max(8,width-(660-left)*scale),right:Math.min(width-8,width-(200-left)*scale),top:Math.max(8,(180-top)*scale),bottom:Math.min(height-8,(490-top)*scale)};
 const r=layout.art,w=Math.min(r.width*.20*.46,r.height*.30*.38),h=w*444/192;
 const y=Math.max(pane.top+10,layout.landscape?r.y+8:r.y-11)+(fitEnvelope?4:reducedMotion?2:Math.sin(time*.003)*2+2);
 const minX=pane.left+w/2+16,maxX=pane.right-w/2-16;
 if(maxX<minX||y+h>pane.bottom-8)return null;
 const drift=reducedMotion?0:(Math.min(1,time/4000)-.5)*10;
 const center=Math.max(minX,Math.min(maxX,r.x+r.width*.90))+drift;
 return {pane,bounds:{left:center-w/2,right:center+w/2,top:y,bottom:y+h,width:w,height:h}};
}
export function fitWindowHeight(width,height,bubbles){
 for(let h=height;h<=Math.max(height,2400);h+=8){
  const layout=comicLayout(width,h,bubbles);
  if(windowMicGeometry(width,h,layout,0,false,true)&&windowMicGeometry(width,h,layout,2500,false,true))return h;
 }
 throw new RangeError('Window panel cannot fit the glass and readable dialogue');
}
function microphone(ctx,images,r,time=0,reducedMotion=false,placement=null){
 const progress=reducedMotion?.5:Math.min(1,time/4000),lift=reducedMotion?0:Math.sin(time*.003)*Math.min(3,r.height*.03);
 const w=placement?.bounds.width??Math.min(r.width*.46,r.height*.38),h=w*444/192,cx=placement?placement.bounds.left+w/2:r.x+r.width*(.38+progress*.24),cy=placement?placement.bounds.top+h/2:r.y+r.height*.5+lift,x=cx-w/2,y=cy-h/2;
 ctx.save();ctx.strokeStyle='#f9d56ba0';ctx.lineWidth=2;
 for(let i=0;i<3;i++){ctx.beginPath();ctx.moveTo(cx-w*(2.4-i*.3),cy+h*(.05+i*.10));ctx.quadraticCurveTo(cx-w*1.4,cy+h*.3,cx-w*.55,cy+h*.12);ctx.stroke();}
 ctx.fillStyle='#ffe79a44';ctx.beginPath();ctx.ellipse(cx,cy,w*1.2,h*.65,0,0,Math.PI*2);ctx.fill();
 ctx.drawImage(images.props,1186,543,192,444,x,y,w,h);
 ctx.restore();
}

function outsideMicrophone(ctx,images,r,windowMic,t,reducedMotion){
    const p=windowMic.pane,b=windowMic.bounds;ctx.save();ctx.beginPath();ctx.rect(p.left,p.top,p.right-p.left,p.bottom-p.top);ctx.clip();
    microphone(ctx,images,r,t,reducedMotion,windowMic);
    // A small glass reflection passes in front of the outdoor prop; the actor remains foreground.
    ctx.fillStyle='#e4f7ff16';ctx.fillRect(b.left-2,b.top-2,b.width+4,b.height+4);
    ctx.strokeStyle='#ffffff28';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(b.right+7,b.top-7);ctx.lineTo(b.left-5,b.bottom+5);ctx.stroke();ctx.restore();
}
export function drawBubble(ctx,b,font){
 ctx.save();ctx.fillStyle=PAPER;ctx.strokeStyle=INK;ctx.lineWidth=3;ctx.beginPath();ctx.roundRect(b.x,b.y,b.width,b.height,b.kind==='broadcast'?5:22);ctx.fill();ctx.stroke();
 if(b.kind!=='broadcast'){const x=b.x+(b.kind==='offscreen'?b.width*.85:b.index?b.width*.72:b.width*.22),bottom=b.y+b.height;ctx.beginPath();ctx.moveTo(x,bottom-1);ctx.lineTo(x-9,bottom+12);ctx.lineTo(x+19,bottom-1);ctx.fill();ctx.stroke();ctx.fillRect(x-2,bottom-4,20,6);}
 ctx.fillStyle=b.kind==='broadcast'?'#ad3228':'#59614f';ctx.font='700 16px "Noto Sans CJK TC",sans-serif';ctx.textAlign='left';ctx.textBaseline='top';ctx.fillText(b.speaker,b.x+16,b.y+8);
 ctx.fillStyle=INK;ctx.font=`900 ${font}px "Noto Sans CJK TC","Microsoft JhengHei",sans-serif`;for(const [i,line]of b.lines.entries())ctx.fillText(line,b.x+16,b.y+30+i*font*1.28);ctx.restore();
}
function actor(ctx,images,character,pose,x,foot,height){
 const rect=STARTER_POSES[character][pose],width=height*rect[2]/rect[3];
 ctx.drawImage(images[character],...rect,x-width/2,foot-height,width,height);
 return {character,pose,x:x-width/2,y:foot-height,width,height};
}
function bed(ctx,images,r,height,foot){
 const width=Math.min(r.width*.98,height*.93),bh=width*257/476,seat=foot-height*.255;
 ctx.drawImage(images.props,1037,143,476,257,r.x+(r.width-width)/2,seat-bh*.51,width,bh);
}
function drawNews(ctx,image,scene,width,height,r,landscape){
 const disappeared=scene.art==='seal'&&(scene.visibleBubbleCount??scene.bubbles.length)>1;
 const src=[disappeared?768:0,0,768,1024];
 if(landscape){
  ctx.fillStyle='#473827';ctx.fillRect(0,0,width,height);contain(ctx,image,src,{x:r.x,y:8,width:r.width,height:height-16});
 }else{
  const scale=Math.max(width/src[2],height/src[3]),sw=width/scale,sh=height/scale;
  ctx.drawImage(image,src[0]+(src[2]-sw)/2,(src[3]-sh)/2,sw,sh,0,0,width,height);
 }
}
/** Entire painted bodies are drawn once per actor. No IK or limb slicing. */
export function paintStarterComic(ctx,images,scene,width,height,{time=0,reducedMotion=false}={}){
 const layout=comicLayout(width,height,scene.bubbles),r=layout.art,actors=[];
 const t=reducedMotion?2500:Math.max(0,Number.isFinite(time)?time:0),u=Math.min(1,t/2200),pulse=reducedMotion?0:Math.sin(Math.min(t,4000)*.003)*Math.min(2.4,r.height*.008);
 const outside=scene.art==='window'||scene.art==='wardrobe',windowMic=outside?windowMicGeometry(width,height,layout,t,reducedMotion):null;
 if(outside&&!windowMic)throw new RangeError('Window panel needs more height to keep the microphone outside');
 ctx.clearRect(0,0,width,height);ctx.fillStyle=PAPER;ctx.fillRect(0,0,width,height);ctx.save();ctx.beginPath();ctx.rect(8,8,width-16,height-16);ctx.clip();
 if(scene.news)drawNews(ctx,images.news,scene,width,height,r,layout.landscape);
 else{
  const street=scene.art==='chase'||scene.art==='street';
  ctx.save();if(outside){ctx.translate(width,0);ctx.scale(-1,1);}
  cover(ctx,images[street?'street':scene.characterId==='han'?'hanRoom':'wangRoom'],{x:0,y:0,width,height},street?.42+u*.04:.18+u*.015);ctx.restore();
  if(scene.art==='wake'||scene.art==='window'){
   const h=Math.min(r.height*.94,r.width*1.3),foot=r.y+r.height-8+pulse;
   bed(ctx,images,r,h,foot);
   if(scene.art==='window')outsideMicrophone(ctx,images,r,windowMic,t,reducedMotion);
   actors.push(actor(ctx,images,scene.characterId,scene.art==='wake'&&t<650?'sleep':'clock',r.x+r.width*.54,foot,h));
  }else if(scene.art==='wardrobe'){
   const h=Math.min(r.height*.94,r.width*1.6),foot=r.y+r.height-8+pulse;
   outsideMicrophone(ctx,images,r,windowMic,t,reducedMotion);
   actors.push(actor(ctx,images,scene.characterId,'suit',r.x+r.width*.52,foot,h));
  }else if(scene.art==='chase'){
   const h=Math.min(r.height*.88,r.width*1.1),bob=reducedMotion?0:Math.sin(t*.009)*Math.min(3,r.height*.012);
   microphone(ctx,images,{x:r.x+r.width*.79,y:r.y+r.height*.01,width:r.width*.18,height:r.height*.26},t,reducedMotion);
   ctx.strokeStyle='#fff3c8';ctx.lineWidth=2;ctx.globalAlpha=.65;for(let i=0;i<5;i++){const y=r.y+r.height*(.4+i*.11),dx=reducedMotion?0:t*.045%34;ctx.beginPath();ctx.moveTo(r.x-dx,y);ctx.lineTo(r.x+r.width*.16-dx,y-3);ctx.stroke();}ctx.globalAlpha=1;
   actors.push(actor(ctx,images,scene.characterId,'run',r.x+r.width*(.46+u*.02),r.y+r.height-10+bob,h));
  }else if(scene.art==='street'){
   const h=Math.min(r.height*.88,r.width*.86),foot=r.y+r.height-8;
   microphone(ctx,images,{x:r.x+r.width*.81,y:r.y,width:r.width*.17,height:r.height*.23},t,reducedMotion);
   actors.push(actor(ctx,images,scene.characterId,'suit',r.x+r.width*.27,foot,h));
   actors.push(actor(ctx,images,scene.characterId==='wang'?'han':'wang','suit',r.x+r.width*.73,foot,h));
  }
 }
 const visible=Number.isInteger(scene.visibleBubbleCount)?Math.max(0,Math.min(scene.bubbles.length,scene.visibleBubbleCount)):scene.bubbles.length;
 ctx.restore();for(const b of layout.bubbles.slice(0,visible))drawBubble(ctx,b,layout.font);
 ctx.strokeStyle=INK;ctx.lineWidth=3;ctx.strokeRect(8,8,width-16,height-16);
 return {sceneId:scene.id,characterId:scene.characterId,font:layout.font,bubbleCount:visible,layout,actors,windowMic,artStatus:'approved-style-b-complete-poses',reducedMotion,time:t};
}
