import test from 'node:test';import assert from 'node:assert/strict';
import * as shout from '../dist/shout-caption.mjs';
const frame={x:480,y:270,width:844,height:390,zoom:1.3};
test('shout layout reserves HUD and controls, with separate colored lanes',()=>{
 for(const [width,height] of [[390,640],[844,390],[667,320],[320,480]]){
 const v={...frame,width,height},safe={top:72,bottom:90};
 const a=shout.shoutCaptionLayout('我把你當人看','player',v,safe),b=shout.shoutCaptionLayout('我不會屈服','enemy',v,safe);
 assert.ok(a.screenX+a.width*.56<b.screenX-b.width*.56);assert.notEqual(a.color,b.color);
 for(const p of [a,b]){assert.ok(p.size>=26);assert.ok(p.screenY-p.height*.56>=safe.top);assert.ok(p.screenY+p.height*.56<=height-safe.bottom);assert.ok(p.screenX-p.width*.56>=0&&p.screenX+p.width*.56<=width);assert.equal(p.tail,undefined);}
 }
});
test('camera movement and side switching cannot make captions chase actors',()=>{
 const a=shout.shoutCaptionLayout('死亡之握','player',frame),b=shout.shoutCaptionLayout('死亡之握','player',{...frame,x:800,y:350,zoom:1.7});
 assert.equal(a.screenX,b.screenX);assert.equal(a.screenY,b.screenY);assert.notEqual(a.x,b.x);
});
test('brief punch-in settles and fades instead of endlessly bouncing',()=>{
 assert.ok(shout.shoutCaptionBeat(70,1350).scale>1);assert.equal(shout.shoutCaptionBeat(400,1350).scale,1);assert.equal(shout.shoutCaptionBeat(700,1350).alpha,1);assert.ok(shout.shoutCaptionBeat(1250,1350).alpha<1);assert.equal(shout.shoutCaptionBeat(1400,1350).alpha,0);
});
import {gameHarness} from './helpers/game-harness.mjs';
test('live arena hides legacy boards, holds screen location, then retires shout',async()=>{
 const h=await gameHarness();
 const node=()=>new Proxy({visible:true},{get(o,k){if(k in o)return o[k];return (...args)=>{if(k==='setVisible')o.visible=args[0];if(k==='setPosition'){o.x=args[0];o.y=args[1];}return new Proxy(o,this);};}});
 const t=node(),a=h.ui.duel.player;t.burst=node();t.captionActor=a;t.captionSpec={text:'我把你當人看',duration:1.35};t.popupStarted=0;t.bubble=node();t.subtitle=node();
 const arena={textPool:[t],time:{now:400}};
 h.ui.Arena.prototype.updateCaptions.call(arena,[a],frame);const p=t.captionLayout;
 assert.equal(t.bubble.visible,false);assert.equal(t.subtitle.visible,true);a.x+=200;a.face=-1;
 h.ui.Arena.prototype.updateCaptions.call(arena,[a],frame);assert.equal(t.x,p.x);assert.equal(t.y,p.y);
 arena.time.now=1400;h.ui.Arena.prototype.updateCaptions.call(arena,[a],frame);assert.equal(t.visible,false);assert.equal(t.captionActor,null);
});
