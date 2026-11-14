/* Runs before game content is parsed. Geometry definitions are shared with the
 * mounted game and chapters; bootstrap owns only its controller instance. */
(function start(){
 'use strict';
 if(window.parliamentOrientationChoice?.pending){window.parliamentOrientationChoice.ready.then(start);return;}
 const core=globalThis.parliamentViewportCore,app=document.querySelector('.app'),shell=document.querySelector('#viewport-shell'),probe=document.querySelector('#safe-insets');
 if(!core||!app||!shell||!probe)return;
 window.parliamentViewportBoot?.stop();
 let rotate=window.parliamentOrientationChoice?.rotate??true,camera='classic';
 try{const saved=JSON.parse(window.localStorage.getItem('parliament-settings-v1'));
  if(saved&&typeof saved==='object'&&!Array.isArray(saved)&&(!Object.prototype.hasOwnProperty.call(saved,'version')||saved.version===1)){if(typeof saved.rotate==='boolean')rotate=saved.rotate;camera=saved.camera==='stable'?'stable':'classic';}
 }catch(_){/* Inaccessible or corrupt settings keep the defaults. */}
 const lifecycle=core.createViewportLifecycle({window,document,
  read(){const touch=!!(window.matchMedia?.('(pointer:coarse)').matches||navigator.maxTouchPoints>0||new URLSearchParams(window.location.search).has('touchPreview'));
   const s=getComputedStyle(probe),safe=Object.fromEntries(['top','right','bottom','left'].map(edge=>[edge,parseFloat(s['padding'+edge[0].toUpperCase()+edge.slice(1)])||0]));
   return core.readGameViewport(window,{touch,safe,rotate,fullBleed:window.innerWidth>window.innerHeight});
  },
  apply(frame){const {rotation,screenWidth,screenHeight,touch}=frame;
   Object.assign(shell.style,{left:frame.left+'px',top:frame.top+'px',width:screenWidth+'px',height:screenHeight+'px'});
   Object.assign(app.style,{width:frame.width+'px',height:frame.height+'px',transform:rotation?'translateX('+screenWidth+'px) rotate(90deg)':'none'});
   app.dataset.fullBleed=String(!!frame.fullBleed);
   for(const edge of ['top','right','bottom','left'])app.style.setProperty?.('--landscape-safe-'+edge,(frame.fullBleed?frame['safe'+edge[0].toUpperCase()+edge.slice(1)]:0)+'px');
   app.dataset.touch=String(touch);app.dataset.nativeLandscape=String(touch&&!rotation&&window.innerWidth>window.innerHeight);app.dataset.overlayControls=String(touch&&(rotation===90||window.innerWidth>window.innerHeight));app.dataset.layout=frame.width>frame.height?'landscape':'portrait';app.dataset.compact=String(frame.height<=360);app.dataset.rotation=String(rotation);
  },
  measure:frame=>{const outer=core.measureViewportElements(frame,[shell]),inner=core.measureViewportElements(frame,[app],{allowNarrow:!frame.touch});return {valid:outer.valid&&inner.valid,key:outer.key+':'+inner.key,reason:outer.reason||inner.reason};},
  onState:state=>{for(const el of [app,shell]){el.__viewportState=state;el.dataset.viewportReady='false';el.dataset.viewportGeometryReady=String(state.ready);el.dataset.viewportEpoch=String(state.epoch);el.dataset.viewportStatus=state.status;el.dataset.viewportReason=state.reason;}}
 });
 window.parliamentViewportBoot={refresh:()=>lifecycle.invalidate('resize'),get frame(){return lifecycle.frame;},get ready(){return lifecycle.ready;},get epoch(){return lifecycle.epoch;},get preferences(){return{rotate,camera};},stop:()=>lifecycle.destroy()};
})();
