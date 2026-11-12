import {flyingMicLayout,drawFlyingMic,createMicPlan,micRasterInfo} from './flying-mic.mjs?v=post69-street-seam-cull-20261112-r1';

// Track the actual renderer's transformed draw rectangles, including transparent
// crop padding. This is conservative, and includes stretched arms / held props.
// A rectangle is safer than guessed sprite coordinates. Never writes to actor.
export function createDrawBoundsRecorder(ctx,dpr=1){
 let bounds=null;
 function points(ps,stroke=false){const m=ctx.getTransform(),trace=m.a*m.a+m.b*m.b+m.c*m.c+m.d*m.d,det=m.a*m.d-m.b*m.c,sigma=Math.sqrt((trace+Math.sqrt(Math.max(0,trace*trace-4*det*det)))/2),pad=(2+Number(ctx.shadowBlur||0)*2+(stroke?Number(ctx.lineWidth||1)*sigma/2:0))/dpr;for(const [x,y] of ps){const xx=(m.a*x+m.c*y+m.e)/dpr,yy=(m.b*x+m.d*y+m.f)/dpr;const r={left:xx-pad,right:xx+pad,top:yy-pad,bottom:yy+pad};bounds=bounds?{left:Math.min(bounds.left,r.left),right:Math.max(bounds.right,r.right),top:Math.min(bounds.top,r.top),bottom:Math.max(bounds.bottom,r.bottom)}:r;}}
 const rect=(x,y,w,h,stroke=false)=>points([[x,y],[x+w,y],[x,y+h],[x+w,y+h]],stroke);
 const context=new Proxy(ctx,{get(target,key){const v=target[key];if(typeof v!=='function')return v;return (...a)=>{
  if(key==='drawImage'){const im=a[0];if(a.length===9)rect(...a.slice(5));else if(a.length===5)rect(...a.slice(1));else rect(a[1],a[2],im.width,im.height);}
  else if(key==='fillRect'||key==='strokeRect')rect(...a,key==='strokeRect');
  else if(key==='fillText'||key==='strokeText'){
   const metrics=ctx.measureText(a[0]),scale=a[3]&&metrics.width>a[3]?a[3]/metrics.width:1;
   rect(a[1]-metrics.actualBoundingBoxLeft*scale,a[2]-metrics.actualBoundingBoxAscent,(metrics.actualBoundingBoxLeft+metrics.actualBoundingBoxRight)*scale,metrics.actualBoundingBoxAscent+metrics.actualBoundingBoxDescent,key==='strokeText');
  }
  else if(key==='arc'){
   const [x,y,r,start,end,ccw=false]=a,TAU=Math.PI*2,m=ctx.getTransform();let span=ccw?start-end:end-start;
   span=Math.abs(end-start)>=TAU?TAU:(span%TAU+TAU)%TAU;
   const angles=[start,end];for(const q of [Math.atan2(m.c,m.a),Math.atan2(m.c,m.a)+Math.PI,Math.atan2(m.d,m.b),Math.atan2(m.d,m.b)+Math.PI])if(((ccw?start-q:q-start)%TAU+TAU)%TAU<=span)angles.push(q);
   points(angles.map(v=>[x+r*Math.cos(v),y+r*Math.sin(v)]),true);
  }
  else if(key==='ellipse'){const r=Math.max(a[2],a[3]);rect(a[0]-r,a[1]-r,r*2,r*2,true);}
  else if(key==='moveTo'||key==='lineTo')points([a],true);
  else if(key==='quadraticCurveTo'||key==='bezierCurveTo')points(Array.from({length:a.length/2},(_,i)=>a.slice(i*2,i*2+2)),true);
  return v.apply(target,a);
 };},set(target,key,value){target[key]=value;return true;}});
 return {context,get bounds(){return bounds;}};
}
export function makeFlyingMicOverlay({canvas,ctx,document}){
 let playerBounds=null,last=null,plan=null;
 const notice=document.createElement('div');notice.id='mic-geometry-notice';notice.setAttribute('role','status');notice.hidden=true;canvas.parentElement.append(notice);
 return {
  recordPlayer(draw,dpr=1){const recorder=createDrawBoundsRecorder(ctx,dpr);draw(recorder.context);playerBounds=recorder.bounds;},
  reset(){playerBounds=null;notice.hidden=true;last=null;}, // Keep viewport plan and raster across every draw, character and route.
  paint({image,width,height,zoom,time,jumpHeight,extraRects=[]}){
   const c=canvas.getBoundingClientRect();
   const hudRects=[...document.querySelectorAll('#hud .hp-panel,#hud .route-panel')].filter(el=>!el.hidden).map(el=>{const r=el.getBoundingClientRect();return {left:r.left-c.left,top:r.top-c.top,right:r.right-c.left,bottom:r.bottom-c.top};});
   // resize rounds backing dimensions but sets the true device scale. Read
   // that exact scale, never infer DPR from rounded canvas.width/width.
   const matrix=ctx.getTransform(),dpr=Math.hypot(matrix.a,matrix.b)||1,key=[width,height,dpr].join('x');
   if(!plan||plan.key!==key)plan=createMicPlan({width,height,zoom,dpr});
   const reducedMotion=!!document.defaultView?.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
   last=flyingMicLayout({plan,time,reducedMotion,playerBounds,hudRects:[...hudRects,...extraRects]});
   notice.hidden=last.visible&&last.safe;notice.textContent=notice.hidden?'':last.message||'視窗尺寸不足，請調整大小。';
   document.body.dataset.micVisible=String(last.visible);document.body.dataset.micCompressed=String(!!last.compressed);
   drawFlyingMic(ctx,image,last,time);return {...last,playerBounds,hudRects,raster:micRasterInfo(ctx)};
  },
  get last(){return last;},get playerBounds(){return playerBounds;}
 };
}
