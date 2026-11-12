import test from 'node:test';
import assert from 'node:assert/strict';
import {CAST,Duel} from '../dist/core.mjs';
import * as readability from '../dist/move-readability.mjs';
import {buildMoveDemoFrame} from '../dist/move-demo.mjs';
import {gameHarness} from './helpers/game-harness.mjs';

for(const cast of Object.values(CAST))for(const move of cast.moves)test(`${move.kind}: large single caption lasts long enough to read`,()=>{
 const c=readability.moveCaption(move.kind);
 assert.equal(c.text,move.name);assert.ok(c.size>=30);assert.ok(c.duration>=1.25);
 assert.ok(c.width>=[...c.text].length*c.size);assert.ok(c.width<=330);
});

test('nearby opposing speech bubbles occupy separate horizontal lanes and stay within stage',()=>{
 const a={id:'player',x:110,y:430},b={id:'enemy',x:185,y:430};
 const pa=readability.captionPosition(a,b,300),pb=readability.captionPosition(b,a,300);
 assert.ok(Math.abs(pa.x-pb.x)>=320);assert.ok(pa.x-150>=24&&pb.x-150>=24);
});

test('human glyph flies from the hand across only the existing palm range then fades',()=>{
 const a=readability.gazeGlyph(.25),b=readability.gazeGlyph(.38),late=readability.gazeGlyph(.82);
 assert.equal(a.text,'人');assert.ok(a.size>=80);assert.ok(b.x>a.x);assert.ok(b.x<=150);
 assert.ok(late.alpha>0);assert.equal(readability.gazeGlyph(1.1),null);
});

test('paper plane and full three-character name have larger consistent demo artwork',()=>{
 const plane=buildMoveDemoFrame('chen','chen_dream',.4).props[0];assert.ok(plane.width>=84&&plane.height>=54);
 const name=buildMoveDemoFrame('ko','ko_name',.4).props[0];assert.equal(name.text,'賴祥德');assert.ok(name.width>=150&&name.height>=64);
 const late=buildMoveDemoFrame('ko','ko_name',1.1);assert.equal(late.caption.text,'賴祥德');assert.ok(!late.done);
});

test('Han caption is visible from the first frame, through the recovery beat',()=>{
 for(const age of [0,.12,.62,1.1])assert.equal(buildMoveDemoFrame('han','han_knee',age).caption?.text,'可憐哪');
});

test('resolve has one title bubble rather than overlapping status and catchphrase',()=>{
 const frame=buildMoveDemoFrame('ko','ko_resolve',.3);
 assert.equal(frame.caption.text,'我不會屈服');assert.equal(frame.labels.filter(l=>/屈服|護甲/.test(l.text)).length,0);
});

test('accepted move starts exactly one main title caption with its immediate audio',async()=>{
 const h=await gameHarness();h.ui.activate();const actor={id:'player',type:'han',x:350,y:430,face:1,attack:{kind:'han_knee',age:0}},calls=[];
 const arena={spitStart:new WeakMap(),popup(...a){calls.push(a);},wordBlast(){assert.fail('duplicate floating title');},banner(){}};
 h.ui.Arena.prototype.event.call(arena,{type:'move',f:actor,kind:'han_knee'});
 const title=calls.filter(a=>a[2]==='可憐哪');assert.equal(title.length,1);assert.ok(title[0][4]>=30);assert.ok(title[0][5].bubble);
 assert.equal(h.$('#move-voice').plays.length,1);
});

test('readability presentation never changes authoritative combat definitions',()=>{
 const before=JSON.stringify(CAST),g=new Duel('ma');g.press('special2');
 for(let t=0;t<2;t+=.05){readability.moveCaption('ma_gaze');readability.gazeGlyph(t);buildMoveDemoFrame('ma','ma_gaze',t);}
 assert.equal(JSON.stringify(CAST),before);assert.equal(g.player.cooldowns[1],5.5);
});

test('recovery pose eases longer without extending gameplay and yields immediately to new actions',()=>{
 const fighter={type:'ma',x:300,y:430,face:1,move:0,attack:{kind:'ma_gaze',age:.69}},before=JSON.stringify(fighter);
 const shown=readability.presentationFighter(fighter,{kind:'ma_gaze',age:.69});
 assert.ok(shown.attack.age<.69&&shown.attack.age>=.38);assert.equal(JSON.stringify(fighter),before);
 const idle={...fighter,attack:null};assert.equal(readability.presentationFighter(idle,{kind:'ma_gaze',age:.8}).attack.kind,'ma_gaze');
 assert.equal(readability.presentationFighter(idle,{kind:'ma_gaze',age:1.1}),idle);
 for(const change of [{move:1},{guard:true},{stun:.1},{reaction:.1},{y:380},{attack:{kind:'punch',age:.1}}]){const busy={...idle,...change};assert.equal(readability.presentationFighter(busy,{kind:'ma_gaze',age:.8}),busy);}
});

test('reused caption retires old title, bubble and subtitle tweens together',async()=>{
 const h=await gameHarness(),killed=[],tweens=[];
 const node=()=>new Proxy({visible:true,x:0,y:0},{get(o,k){if(k in o)return o[k];return(...args)=>{if(k==='setVisible')o.visible=args[0];if(k==='setPosition'){o.x=args[0];o.y=args[1];}return new Proxy(o,this);};}});
 const title=node(),bubble=node(),subtitle=node(),actor={id:'player',type:'ko',x:350,y:430};
 title.burst=null;title.visible=false;title.bubble=bubble;title.subtitle=subtitle;
 const arena={textPool:[title],time:{now:1000},add:{graphics:node,text:node},tweens:{killTweensOf(target){killed.push(target);},add(config){tweens.push(config);}}};
 h.ui.Arena.prototype.popup.call(arena,350,128,'我不會屈服','#173c43',32,{bubble:true,caption:readability.moveCaption('ko_resolve'),actor});
 assert.ok(killed.includes(title)&&killed.includes(bubble)&&killed.includes(subtitle));
 assert.equal(tweens.length,0);assert.equal(bubble.visible,false);assert.equal(subtitle.visible,false);assert.equal(title.captionActor,actor);
});

for(const [type,cast] of Object.entries(CAST))for(const m of cast.moves)test(`${m.kind}: render-only recovery uses finite resolved combat timings`,()=>{
 for(const age of [0,m.duration-.01,m.duration+.14,m.duration+.29]){
  const f={type,y:430,move:0,attack:age<m.duration?{kind:m.kind,age}:null};
  const shown=readability.presentationFighter(f,{kind:m.kind,age});
  if(shown.attack)assert.ok(Number.isFinite(shown.attack.age)&&shown.attack.age>=0&&shown.attack.age<=m.duration,m.kind+' '+age);
 }
});

test('name tile leaves the face clear, then converges on the honest landing marker',()=>{
 assert.ok(readability.nameTileOffset(0,.56,1)>=60);
 assert.equal(readability.nameTileOffset(.56,.56,1),0);
 assert.equal(readability.nameTileOffset(.28,.56,-1),-readability.nameTileOffset(.28,.56,1));
});

test('Han folded silhouette does not outlast its mechanical low-profile window',()=>{
 const f={type:'han',y:430,move:0,attack:{kind:'han_knee',age:1.0}};
 assert.equal(readability.presentationFighter(f,{kind:'han_knee',age:1.0}),f);
});

test('two cough breaths stay in front of the mouth, never above the head',async()=>{
 const {drawMoveAccent}=await import('../dist/art-expression.mjs');
 for(const age of [.24,.47]){const ovals=[],texts=[];const ctx=new Proxy({globalAlpha:1,ellipse(...v){ovals.push(v)},fillText(t){texts.push(t)}},{get:(o,k)=>o[k]??(()=>{})});
  drawMoveAccent(ctx,{}, {kind:'ma_cough',age,bodyY:0},'front',1);
  assert.ok(ovals.length>=2);assert.ok(ovals.every(v=>v[1]>-215),'breath must leave mouth rather than halo above head');assert.equal(texts.length,0);
 }
});


test('caption bounds clamp to the current camera for close fighting and jumping without changing its zoom',()=>{
 const views=[{x:480,y:300,zoom:1.12,width:800,height:320},{x:220,y:250,zoom:1.4,width:540,height:340},{x:480,y:190,zoom:.8,width:900,height:540}];
 for(const view of views)for(const y of [430,250,160]){
  const a={id:'player',x:350,y},b={id:'enemy',x:430,y:430};
  const before=JSON.stringify(view),pa=readability.captionPosition(a,b,260,view),pb=readability.captionPosition(b,a,260,view);
  for(const p of [pa,pb]){assert.ok(p.x-130>=view.x-view.width/(2*view.zoom));assert.ok(p.x+130<=view.x+view.width/(2*view.zoom));assert.ok(p.y-39>=view.y-view.height/(2*view.zoom));assert.ok(p.y+51<=view.y+view.height/(2*view.zoom));}
  assert.equal(JSON.stringify(view),before);
 }
});
