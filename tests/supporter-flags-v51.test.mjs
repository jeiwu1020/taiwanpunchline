import test from 'node:test';
import assert from 'node:assert/strict';
import {supporterFlagLayout} from '../dist/supporter-flags.mjs';
import {CAST} from '../dist/roster.mjs';
const view={x:480,y:270,width:960,height:540,zoom:1};
const bearer={x:200,y:430,height:119.9,asset:'supporter-woman',direction:1,rotation:0,name:'恰吉王',alpha:1,color:0xffc85a};
const near=(a,b)=>assert.ok(Math.abs(a-b)<.001,`${a} ≠ ${b}`);
const layout=async(m=bearer,v=view)=>supporterFlagLayout(m,v);

test('pole starts at the visible outer fist rather than the woman’s face or torso',async()=>{
 const f=await layout();near(f.grip.x,152);near(f.grip.y,323.5);
 assert.ok(f.poleTop.y<f.grip.y);near(f.poleTop.x,f.grip.x);
 assert.ok(f.y+f.height/2<=f.grip.y-8,'The banner must stay above the fist and head');
});
test('hand attachment follows the same mirror and rotation as the image',async()=>{
 const normal=await layout(),mirror=await layout({...bearer,direction:-1});
 near(mirror.grip.x,248);near(mirror.grip.y,323.5);
 near(normal.x-bearer.x,-(mirror.x-bearer.x));
 const rotated=await layout({...bearer,rotation:Math.PI/2});
 near(rotated.grip.x,306.5);near(rotated.grip.y,382);
});
test('all seven names have readable unbadged text with padding on desktop and portrait',async()=>{
 for(const {name} of Object.values(CAST))for(const width of [390,844,1280])for(const zoom of [.6,1,1.4]){
  const f=await layout({...bearer,name},{...view,width,zoom});
  assert.equal(f.text,name);assert.ok(!/玩家|AI/.test(f.text));assert.ok(f.fontSize>=13);
  assert.ok(f.width*zoom>=Array.from(name).length*f.fontSize+16);
  assert.ok(f.height*zoom>=f.fontSize+10);
 }
});
test('the banner can turn inward at either screen edge without detaching the hand',async()=>{
 for(const [x,direction] of [[60,1],[900,-1],[120,-1],[840,1]]){
  const f=await layout({...bearer,x,direction});
  assert.ok(f.visible);assert.ok(f.x-f.width/2>=4);assert.ok(f.x+f.width/2<=956);
  assert.ok(Math.abs(f.x-f.grip.x)<=f.width/2+.001);
 }
});
test('unsafe HUD and offscreen flags stay hidden rather than moving their pole away from the fist',async()=>{
 assert.equal((await layout({...bearer,y:100})).visible,false);
 assert.equal((await layout({...bearer,x:-60})).visible,false);
 assert.equal((await layout({...bearer,x:1030,direction:-1})).visible,false);
});
