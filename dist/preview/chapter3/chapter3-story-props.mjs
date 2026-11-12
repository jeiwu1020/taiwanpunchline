// Presentation-only storyboard geometry. Never changes collision or campaign state.
const clamp=x=>Math.max(0,Math.min(1,x));
const ease=x=>{x=clamp(x);return x*x*(3-2*x);};
export function storyPropState(shot,{width,base,zoom,elapsed=0}={}){
 const u=ease(elapsed/3),standHeight=150*zoom,tw=Math.min(width*.44,480*zoom),startX=width*.53;
 const truck={x:startX-10/1536*tw,y:base-838/1536*tw,width:tw,height:tw*1024/1536};
 let x=startX,standY=base,carrier='wheeled-stand',ribbon=null,parade=null,showTruck=false,staff=null;
 const ribbonShots=['ribbon-follow','parade-trail','anonymous-broadcast','market-trail'];
 if(ribbonShots.includes(shot)){
  carrier='ribbon';x=width*(.5+.03*u);standY=base-25*zoom+Math.sin(elapsed*2)*4;
  // This small parade float is distinct from the later sound-truck handoff.
  // Tie the ribbon to the sprite's rear rosette, never to an offscreen point.
  const pw=width*.42,ph=pw*857/1835;
  parade={x:width*(.55+.02*u),y:base-ph*.98,width:pw,height:ph};
  parade.ribbonAnchor={x:parade.x+pw*139/1835,y:parade.y+ph*244/857};
  ribbon={start:{...parade.ribbonAnchor},end:null};
 }
 if(shot==='cart-catch'||shot==='follow-cart'){
  const p=shot==='cart-catch'?u:1;
  // Ramp rises linearly from source x=10,y=838 to x=350,y=580.
  const travel=690/1536*tw*p;x=startX+travel;
  const rise=Math.min(1,travel/(340/1536*tw));standY=base-(258/1536*tw)*rise;
  showTruck=true;staff={x:x-60*zoom,y:standY,scale:.72};
  if(shot==='follow-cart'){
   const offset=Math.min(width*.27,220*zoom)*u;truck.x+=offset;x+=offset;staff=null;
  }
 }
 const mic={x,y:standY-standHeight};if(ribbon)ribbon.end={...mic};
 return {mic,micCount:1,carrier,standY,standHeight,ribbon,parade,playerX:parade?width*.27:null,truck:showTruck?truck:null,staff,bossVisible:!ribbonShots.includes(shot),progress:u};
}
