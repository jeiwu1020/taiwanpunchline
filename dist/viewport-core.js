/* Shared, synchronous geometry and lifecycle definitions. No DOM state or
 * listeners are installed until an owner explicitly creates a controller.
 * Loaded as a classic script before bootstrap and as an ESM side effect. */
(function(root){
 'use strict';
 if(root.parliamentViewportCore)return;
 const positive=value=>Math.max(0,Number(value)||0);
 function gameViewport({width,height,left=0,top=0,safe={},touch=false,rotate=true,fullBleed=false}){
  const pad=k=>positive(safe[k]);
  if(fullBleed&&touch&&width>height)return {left,top,screenWidth:width,screenHeight:height,width,height,rotation:0,touch,fullBleed:true,safeTop:pad('top'),safeRight:pad('right'),safeBottom:pad('bottom'),safeLeft:pad('left')};
  const screenWidth=Math.max(1,width-pad('left')-pad('right')),screenHeight=Math.max(1,height-pad('top')-pad('bottom'));
  const rotation=touch&&rotate&&screenHeight>screenWidth?90:0;
  return {left:left+pad('left'),top:top+pad('top'),screenWidth,screenHeight,width:rotation?screenHeight:screenWidth,height:rotation?screenWidth:screenHeight,rotation,touch};
 }
 function sampleViewport(win){
  const width=Math.max(1,Number(win.innerWidth)||1),height=Math.max(1,Number(win.innerHeight)||1),fallback={width,height,left:0,top:0},vv=win.visualViewport;
  if(!vv)return {geometry:fallback,valid:true,reason:''};
  const vw=Number(vv.width),vh=Number(vv.height),scale=Number(vv.scale)||1,left=Number(vv.offsetLeft)||0,top=Number(vv.offsetTop)||0;
  if(!Number.isFinite(vw)||vw<=0||!Number.isFinite(vh)||vh<=0)return {geometry:fallback,valid:false,reason:'visual-metrics'};
  if(Math.abs(scale-1)<.01){
   // Rotation sometimes exposes the preceding orientation's visual metrics.
   // The layout viewport is the consistent fallback; never add stale offsets.
   if(Math.abs(vw-width)>2&&((vw>vh)!==(width>height)))return {geometry:fallback,valid:true,reason:'layout-fallback'};
   if(left< -2||top< -2||left+vw>width+2||top+vh>height+2)return {geometry:fallback,valid:false,reason:'visual-bounds'};
   // Rounding tolerance is not permission to paint beyond the layout bounds.
   const w=Math.min(vw,width),h=Math.min(vh,height);
   return {geometry:{width:w,height:h,left:Math.max(0,Math.min(left,width-w)),top:Math.max(0,Math.min(top,height-h))},valid:true,reason:''};
  }
  return {geometry:{width:vw,height:vh,left,top},valid:true,reason:''};
 }
 function viewportSample(win){return sampleViewport(win).geometry;}
 function readGameViewport(win,options){const sample=sampleViewport(win);return {frame:gameViewport({...sample.geometry,...options}),valid:sample.valid,reason:sample.reason};}
 function measureViewportElements(frame,elements,{allowNarrow=false}={}){
  const rects=[];
  for(const element of elements.filter(Boolean)){
   if(typeof element.getBoundingClientRect!=='function')return {valid:false,key:'missing-rect',reason:'layout-unavailable'};
   const rect=element.getBoundingClientRect(),values=['left','top','width','height'].map(k=>Number(rect[k]));
   if(values.some(n=>!Number.isFinite(n))||rect.width<=0||rect.height<=0)return {valid:false,key:'empty-rect',reason:'layout-empty'};
   rects.push(values);
  }
  const expected=[frame.left,frame.top,frame.screenWidth,frame.screenHeight];
  // Desktop retains its existing max-width content inside the physical shell.
  // Only horizontal containment may differ; vertical offsets remain invalid.
  const valid=rects.length>0&&rects.every(rect=>allowNarrow?rect[0]>=expected[0]-1.5&&rect[2]<=expected[2]+1.5&&rect[0]+rect[2]<=expected[0]+expected[2]+1.5&&Math.abs(rect[1]-expected[1])<=1.5&&Math.abs(rect[3]-expected[3])<=1.5:rect.every((n,i)=>Math.abs(n-expected[i])<=1.5));
  return {valid,key:JSON.stringify(rects.map(r=>r.map(n=>Math.round(n*100)/100))),reason:valid?'':'layout-mismatch'};
 }
 // Reading primitive viewport metrics is cheap and does not force a DOM layout.
 function viewportMetricKey(win,doc){const v=win.visualViewport;return [win.innerWidth,win.innerHeight,win.devicePixelRatio,win.scrollX,win.scrollY,!!doc?.hidden,v?.width,v?.height,v?.offsetLeft,v?.offsetTop,v?.scale].join(':');}
 function validSurface(surface){return !!surface&&surface.valid!==false&&surface.contextLost!==true&&[surface.width,surface.height].every(v=>Number.isFinite(v)&&v>0)&&[surface.backingWidth,surface.backingHeight].every(v=>Number.isFinite(v)&&v>1);}
 function createViewportLifecycle({window:win,document:doc=win.document,read,apply,measure=()=>({valid:true,key:''}),prepare=()=>null,requirePaint=false,clearInput=()=>{},onState=()=>{},onSurfaceReset=()=>{},settleMs=100,orientationMs=240,quietMs=64,observeMs=1000,timeoutMs=2200,activeProbeMs=1000}){
  const now=()=>win.performance?.now?.()??Date.now();
  const request=win.requestAnimationFrame?.bind(win)||root.requestAnimationFrame?.bind(root)||((fn)=>win.setTimeout?.(()=>fn(now()),16)||0);
  const cancel=win.cancelAnimationFrame?.bind(win)||root.cancelAnimationFrame?.bind(root)||win.clearTimeout?.bind(win)||(()=>{});
  let frame=null,epoch=0,surfaceGeneration=0,token=null,prepared=false,painted=false,recoveryStarted=null,ready=false,status='settling',reason='',raf=0,disposed=false,applying=false,started=now(),changed=started,minimum=orientationMs,geometryKey='',previousKey='',stable=0,metricKey='',lastProbe=started,lastValidation=false;
  const subscribers=new Set();
  const matches=value=>!!value&&value.epoch===epoch&&value.surfaceGeneration===surfaceGeneration;
  function publish(){const state={frame,epoch,surfaceGeneration,token,prepared,painted,ready,status,reason,readiness:requirePaint?'paint':'geometry'};onState(state);for(const fn of subscribers)fn(state);if(win.CustomEvent&&win.dispatchEvent)win.dispatchEvent(new win.CustomEvent('parliamentviewportchange',{detail:state}));}
  function gate(){clearInput();ready=false;status='settling';publish();}
  function renew(){surfaceGeneration++;token=Object.freeze({epoch,surfaceGeneration});prepared=false;painted=false;}
  function acknowledgePrepared(value,surface){if(disposed||!matches(value)||!validSurface(surface))return false;prepared=true;return true;}
  function prepareCurrent(){if(!frame)return;const surface=prepare(frame,token);if(requirePaint){if(!validSurface(surface)){beforeSurfaceMutation();prepared=false;return surface;}acknowledgePrepared(token,surface);}return surface;}
  function applyCurrent(){applying=true;try{apply(frame,epoch,token);prepareCurrent();}finally{applying=false;}}
  function sample(time){
   const reading=read(),nextKey=JSON.stringify(reading.frame),geometryChanged=nextKey!==geometryKey;
   metricKey=viewportMetricKey(win,doc);lastProbe=time;
   if(geometryChanged){
    if(recoveryStarted!==null){started=time;recoveryStarted=null;}gate();geometryKey=nextKey;frame=Object.freeze({...reading.frame});epoch++;renew();previousKey='';stable=0;changed=time;
    applyCurrent();publish();
   }
   const rect=measure(frame)||{},key=nextKey+':'+rect.key,valid=reading.valid!==false&&rect.valid!==false&&!doc?.hidden;
   lastValidation=valid;reason=doc?.hidden?'hidden':reading.valid===false?reading.reason:rect.reason||'';
   if(key!==previousKey||!valid){if(ready)gate();stable=0;changed=time;}else stable++;
   previousKey=key;
   const renderReady=!requirePaint||prepared&&painted;
   if(valid&&renderReady&&time-started>=minimum&&time-changed>=quietMs&&stable>=2){if(!ready){ready=true;status='ready';reason='';publish();}}
   if(!ready&&time-started>=timeoutMs){status='blocked';reason=reason||(!renderReady?'surface-unpainted':'layout-unstable');publish();return false;}
   return !ready||time-started<observeMs;
  }
  function tick(time){raf=0;if(disposed)return;try{if(sample(Number.isFinite(time)?time:now()))raf=request(tick);}catch(_){ready=false;status='blocked';reason='surface-prepare-failed';clearInput();publish();}}
  function invalidate(kind='resize'){
   if(disposed||applying)return frame;
   const name=typeof kind==='string'?kind:kind?.type||'resize';
   if(['orientationchange','orientation','pageshow','scroll','visibilitychange'].includes(name)&&(win.scrollX||win.scrollY))win.scrollTo?.(0,0);
   const wasReady=ready;recoveryStarted=null;started=now();changed=started;const requested=['orientationchange','orientation','pageshow','visibilitychange','mount'].includes(name)?orientationMs:settleMs;minimum=wasReady?requested:Math.max(minimum,requested);stable=0;previousKey='';renew();gate();
   try{if(['pageshow','visibilitychange','contextlost','contextrestored','surface-reset','draw-failed'].includes(name))onSurfaceReset(name);
    if(!frame||JSON.stringify(read().frame)!==geometryKey)sample(started);else{applyCurrent();metricKey=viewportMetricKey(win,doc);lastProbe=started;publish();}
   }catch(_){reason='surface-prepare-failed';}
   if(!raf)raf=request(tick);return frame;
  }
  function beginSurfaceRecovery(kind){
   if(disposed)return;
   // Recovery has one deadline, while each failed attempt needs a fresh token
   // and clean drawing state. Retrying must never postpone protection.
   if(recoveryStarted===null){const wasReady=ready;recoveryStarted=now();started=recoveryStarted;changed=started;stable=0;previousKey='';if(wasReady)minimum=settleMs;}
   renew();clearInput();ready=false;status=now()-started>=timeoutMs?'blocked':'settling';reason=kind;publish();
   if(!raf&&status!=='blocked')raf=request(tick);
   applying=true;try{onSurfaceReset(kind);}finally{applying=false;}
  }
  function beforeSurfaceMutation(){
   // Adapters call this before a direct resize/transform repair. An enclosing
   // invalidation already revoked the old lease; a no-change prepare skips it.
   if(disposed||applying||!prepared&&!painted&&!ready)return;
   beginSurfaceRecovery('surface-reset');
  }
  function invalidateSurface(kind='surface-reset'){
   if(kind!=='surface-reset'&&kind!=='draw-failed')return invalidate(kind);
   if(disposed||applying)return frame;
   try{beginSurfaceRecovery(kind);applying=true;try{prepareCurrent();}finally{applying=false;}}
   catch(_){prepared=false;reason='surface-prepare-failed';publish();}
   return frame;
  }
  function failSurface(kind='draw-failed'){
   // Always reset: a later failed attempt may leave nested save/clip state even
   // when its transform still looks valid. The recovery deadline stays fixed.
   invalidateSurface(kind);return false;
  }
  function acknowledgePaint(value,surface){
   if(disposed||!matches(value)||!prepared||!validSurface(surface)||doc?.hidden)return false;
   const firstPaint=!painted;painted=true;recoveryStarted=null;
   if(firstPaint&&!raf&&!ready){if(status==='blocked'){started=now();changed=started;stable=0;previousKey='';status='settling';}raf=request(tick);}
   return true;
  }
  function checkActive(time=now()){
   if(disposed)return null;
   if(viewportMetricKey(win,doc)!==metricKey)invalidate('active-metrics');
   else if(time-lastProbe>=activeProbeMs){
    lastProbe=time;const reading=read();
    if(JSON.stringify(reading.frame)!==geometryKey)invalidate('active-recheck');
    else{const rect=measure(frame)||{},valid=reading.valid!==false&&rect.valid!==false&&!doc?.hidden;if(valid!==lastValidation){if(recoveryStarted!==null)invalidateSurface('surface-reset');else invalidate('active-layout');}}
   }
   return token;
  }
  const events=['resize','orientationchange','pageshow','scroll','pagehide'];
  events.forEach(type=>win.addEventListener?.(type,invalidate));
  win.visualViewport?.addEventListener?.('resize',invalidate);win.visualViewport?.addEventListener?.('scroll',invalidate);doc?.addEventListener?.('visibilitychange',invalidate);
  const api={get frame(){return frame;},get epoch(){return epoch;},get surfaceGeneration(){return surfaceGeneration;},get token(){return token;},get ready(){return ready;},get status(){return status;},get reason(){return reason;},get applying(){return applying;},get prepared(){return prepared;},invalidate,invalidateSurface,beforeSurfaceMutation,failSurface,acknowledgePrepared,acknowledgePaint,checkActive,prepareCurrent,subscribe(fn){subscribers.add(fn);return()=>subscribers.delete(fn);},destroy(){if(disposed)return;disposed=true;clearInput();if(raf)cancel(raf);raf=0;events.forEach(type=>win.removeEventListener?.(type,invalidate));win.visualViewport?.removeEventListener?.('resize',invalidate);win.visualViewport?.removeEventListener?.('scroll',invalidate);doc?.removeEventListener?.('visibilitychange',invalidate);subscribers.clear();}};
  invalidate('mount');return api;
 }
 Object.defineProperty(root,'parliamentViewportCore',{value:Object.freeze({gameViewport,viewportSample,sampleViewport,readGameViewport,measureViewportElements,createViewportLifecycle}),configurable:true});
})(globalThis);
