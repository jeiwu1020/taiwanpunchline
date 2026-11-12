import test from 'node:test';
import assert from 'node:assert/strict';
import {existsSync} from 'node:fs';
import {JSDOM} from 'jsdom';
import {CAST} from '../dist/roster.mjs';
const path=new URL('../dist/special-name-fit.mjs',import.meta.url);
const missing=()=>assert.fail('The bounded, event-driven special-name fitter is not implemented');
const {fitSpecialNameSize=missing,mountSpecialNameFit=missing}=existsSync(path)?await import(path):{};
const names=Object.values(CAST).flatMap(c=>c.moves.map(m=>m.name));
function fixture(){
 const dom=new JSDOM('<main class="app" data-layout="portrait"><div class="specials"><button><span class="move-copy"><strong>可以這樣插隊喔</strong></span><span class="cooldown-value">8.0</span></button></div></main>',{pretendToBeVisual:true});
 const {document}=dom.window,name=document.querySelector('strong'),frames=new Map();let id=0,width=102,measures=0;const resize=[];
 const context={font:'',measureText(text){measures++;const size=parseFloat(this.font.match(/([\d.]+)px/)[1]);return {width:[...text].length*size};}};
 dom.window.HTMLCanvasElement.prototype.getContext=function(){return context;};
 Object.defineProperty(name,'clientWidth',{get:()=>width});name.style.setProperty('--special-name-max','18px');name.style.fontFamily='sans-serif';name.style.fontWeight='900';name.style.letterSpacing='0px';
 dom.window.requestAnimationFrame=fn=>{frames.set(++id,fn);return id;};dom.window.cancelAnimationFrame=key=>frames.delete(key);
 dom.window.ResizeObserver=class{constructor(cb){this.cb=cb;resize.push(this);}observe(){}disconnect(){this.disconnected=true;}};
 const ui=mountSpecialNameFit({document});
 return{dom,document,name,ui,resize,frames,measureCount:()=>measures,setWidth:value=>{width=value;resize.forEach(r=>r.cb([]));},flush(){const next=[...frames.values()];frames.clear();next.forEach(fn=>fn());},tick:()=>new Promise(resolve=>dom.window.queueMicrotask(resolve)),close(){ui.destroy();dom.window.close();}};
}
test('all 21 real move names fit the available portrait and landscape width above a readable 12px floor',()=>{
 assert.equal(names.length,21);assert.equal(names.reduce((a,b)=>a.length>b.length?a:b),'可以這樣插隊喔');
 for(const width of [102,86,88,155])for(const name of names){const measured=[...name].length*18,result=fitSpecialNameSize({availableWidth:width,measuredWidth:measured,maxSize:18});
  assert.ok(result.size<=18&&result.size>0);assert.ok(measured*result.size/18<=width-1);assert.equal(result.fits,true);
 }
 assert.equal(fitSpecialNameSize({availableWidth:102,measuredWidth:126,maxSize:18}).size,14.4);
 assert.equal(fitSpecialNameSize({availableWidth:86,measuredWidth:126,maxSize:18}).size,12.1);
 assert.equal(fitSpecialNameSize({availableWidth:151,measuredWidth:140,maxSize:20}).size,20);
 const tooNarrow=fitSpecialNameSize({availableWidth:40,measuredWidth:126,maxSize:18});assert.equal(tooNarrow.size,12);assert.equal(tooNarrow.fits,false,'unfit text is explicitly reported, never shrunk below 12');
 assert.equal(fitSpecialNameSize({availableWidth:0,measuredWidth:126,maxSize:18}),null,'hidden controls wait for a measurable width');
});
test('mount measures local client width, so CSS-sideways bounding boxes cannot swap the fit dimensions',()=>{
 const h=fixture();h.name.getBoundingClientRect=()=>({width:18,height:126});h.document.querySelector('.app').dataset.rotation='90';h.flush();
 assert.equal(h.name.style.getPropertyValue('--special-name-fit'),'14.4px');assert.equal(h.name.dataset.nameFitSize,'14.4');assert.equal(h.name.dataset.nameFitOverflow,'false');h.close();
});
test('name and resize changes coalesce, cooldown updates never trigger measurements, and font size grows back',async()=>{
 const h=fixture();h.flush();const first=h.measureCount();assert.equal(h.frames.size,0,'there is no continuing frame loop');
 h.document.querySelector('.cooldown-value').textContent='7.9';await h.tick();h.flush();assert.equal(h.measureCount(),first,'cooldown frame work does not remeasure names');
 h.name.textContent='死亡之握';await h.tick();h.setWidth(100);h.setWidth(100);assert.equal(h.frames.size,1);h.flush();assert.equal(h.name.dataset.nameFitSize,'18');
 const measured=h.measureCount();h.setWidth(100);h.flush();assert.equal(h.measureCount(),measured,'unchanged layout uses its last font measurement');
 h.setWidth(56);h.flush();assert.equal(h.name.dataset.nameFitSize,'13.7');h.setWidth(100);h.flush();assert.equal(h.name.dataset.nameFitSize,'18');h.close();
});
test('unmount disconnects observers and cancels queued work without touching storage',async()=>{
 const h=fixture();h.ui.destroy();assert.ok(h.resize.every(r=>r.disconnected));assert.equal(h.frames.size,0);
 h.name.textContent='從從容容';await h.tick();assert.equal(h.frames.size,0);h.dom.window.close();
});
test('an unexpected name that cannot fit at 12px is reported instead of silently shrinking further',()=>{
 const h=fixture(),events=[];h.name.addEventListener('specialnamefitoverflow',event=>events.push(event.detail));h.flush();
 h.setWidth(50);h.flush();assert.equal(h.name.dataset.nameFitSize,'12');assert.equal(h.name.dataset.nameFitOverflow,'true');
 assert.equal(events.length,1);assert.equal(events[0].text,'可以這樣插隊喔');assert.equal(events[0].availableWidth,50);assert.equal(events[0].fits,false);h.close();
});
