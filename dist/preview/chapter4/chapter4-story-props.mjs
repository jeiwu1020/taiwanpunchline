// Presentation-only continuation of chapter 3's truck and wheeled microphone stand.
// Transport is scripted geometry, never a collision object or campaign/save mutation.
const ease=value=>{const x=Math.max(0,Math.min(1,value));return x*x*(3-2*x);};
export function storyPropState(shot,{width,base,zoom,elapsed=0}={}){
 const u=ease(elapsed/3),standHeight=150*zoom,tw=Math.min(width*.44,480*zoom),startX=width*.53;
 const truck={x:startX-10/1536*tw,y:base-838/1536*tw,width:tw,height:tw*1024/1536};
 let x=startX,standY=base,showTruck=false,staff=null,lift=0;
 const entry=['truck-unload','rolling-stand','anonymous-broadcast','market-trail'].includes(shot);
 const loadedTravel=690/1536*tw,rampTravel=340/1536*tw,deckHeight=258/1536*tw;
 if(shot==='truck-unload'||shot==='truck-reload'||shot==='follow-truck'){
  const progress=shot==='truck-unload'?1-u:shot==='follow-truck'?1:u;
  const travel=loadedTravel*progress;x=startX+travel;
  lift=shot==='truck-reload'&&u>0&&u<1?Math.sin(Math.PI*u)*16*zoom:0;
  standY=base-deckHeight*Math.min(1,travel/rampTravel)-lift;showTruck=true;
  if(shot!=='follow-truck')staff={x:x-60*zoom,y:standY+lift,scale:.72,face:shot==='truck-unload'?-1:1};
  else{const offset=Math.min(width*.27,220*zoom)*u;truck.x+=offset;x+=offset;}
 }else if(shot==='rolling-stand'){
  x=startX+width*.22*u;showTruck=true;
 }else if(shot==='anonymous-broadcast')x=width*.75;
 const mic={x,y:standY-standHeight};
 return {mic,micCount:1,carrier:'wheeled-stand',standY,standHeight,truck:showTruck?truck:null,staff,lift,wheelsLocked:!entry,bossVisible:!entry,progress:u};
}
