import test from 'node:test';import assert from 'node:assert/strict';
import * as type from '../dist/shout-caption.mjs';import {CAST} from '../dist/roster.mjs';
test('all current signature moves have a deliberate comic treatment',()=>{
 const styles=new Set(),colors=new Set();for(const [actor,c] of Object.entries(CAST))for(const m of c.moves){const s=type.comicMoveStyle(m.kind,actor);assert.ok(s.treatment);assert.ok(s.accent);assert.ok(s.label);styles.add(s.treatment);colors.add(s.accent);}
 assert.ok(styles.size>=5);assert.equal(colors.size,7);
});
test('mobile accents are plainly visible through the reading hold, not a 180ms flash',()=>{
 const p=type.shoutCaptionLayout('太離譜了','player',{width:667,height:320,zoom:1},{top:55,bottom:90},{kind:'huang_shout',actor:'huang'});
 for(const age of [80,250,600]){const a=type.comicAccentState(age,1350,false);assert.ok(a.alpha>=.85);}
 assert.ok(p.tag);assert.ok(p.rotation);assert.ok(p.tagY<p.screenY);
});
test('all treatments stay within their half-screen and below the HUD',()=>{
 for(const [w,h] of [[390,640],[844,390],[667,320],[320,480]])for(const [actor,c] of Object.entries(CAST))for(const m of c.moves){
 const p=type.shoutCaptionLayout(m.name,'player',{width:w,height:h,zoom:.8},{top:64,bottom:90},{kind:m.kind,actor});
 assert.ok(p.screenX-p.width*.6>=0,m.kind);assert.ok(p.screenX+p.width*.6<w/2,m.kind);assert.ok(p.tagY>=64,m.kind);assert.ok(p.screenY+p.height*.6<h-90,m.kind);
 }
});
test('each accent uses high-contrast local ink without a filled plate or actor connector',()=>{
 for(const [actor,c] of Object.entries(CAST))for(const m of c.moves){
 const calls=[],g=new Proxy({},{get(o,k){return(...args)=>{calls.push([k,...args]);return g;}}});
 const p=type.shoutCaptionLayout(m.name,'player',{width:667,height:320,zoom:1},{top:64,bottom:90},{kind:m.kind,actor});
 type.paintComicAccent(g,p,type.comicAccentState(600,1350));
 assert.ok(calls.some(([k,w])=>k==='lineStyle'&&w>=6));assert.ok(calls.every(([k])=>!k.startsWith('fill')));
 for(const [k,x1,y1,x2,y2] of calls.filter(([k])=>k==='lineBetween'))for(const [x,y] of [[x1,y1],[x2,y2]]){assert.ok(Math.abs(x)<=p.width/2+10);assert.ok(Math.abs(y)<=p.height/2+10);}
 }
});
