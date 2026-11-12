// Explicit QA-page controls only. Does not run in the published game page.
const frame=document.querySelector('iframe'),output=document.querySelector('#viewport-report');
let lastPointer=null,safe=false;
function snapshot(){
 const d=frame.contentDocument,w=frame.contentWindow,app=d?.querySelector('.app'),vv=w?.visualViewport;
 if(!app)return {error:'Game not ready'};
 const targets=[...d.querySelectorAll('#touch-stick,.punch,[data-hold="guard"],[data-action^="special"]')].filter(e=>e.getBoundingClientRect().width&&e.getBoundingClientRect().height);
 return {viewport:[w.innerWidth,w.innerHeight],visual:vv&&{width:vv.width,height:vv.height,left:vv.offsetLeft,top:vv.offsetTop,scale:vv.scale},rootScroll:[w.scrollX,w.scrollY],rotation:app.dataset.rotation,ready:app.dataset.viewportReady,safeSimulation:safe,
  targets:targets.map(e=>{const r=e.getBoundingClientRect(),x=r.left+r.width/2,y=r.top+r.height/2,hit=d.elementFromPoint(x,y);return {target:e.id||e.dataset.hold||e.dataset.action,x,y,width:r.width,height:r.height,hit:!!hit&&(hit===e||e.contains(hit)),inside:r.left>=0&&r.top>=0&&r.right<=w.innerWidth+.5&&r.bottom<=w.innerHeight+.5};}),lastPointer};
}
function report(){output.textContent=JSON.stringify(snapshot(),null,2);}
function listen(){const d=frame.contentDocument;if(!d)return;d.addEventListener('pointerdown',e=>{lastPointer={type:e.pointerType,x:e.clientX,y:e.clientY,target:e.target.closest('#touch-stick,button')?.outerHTML.slice(0,200),held:[...d.querySelectorAll('[data-hold].held')].map(x=>x.dataset.hold)};report();});}
frame.addEventListener('load',listen);if(frame.contentDocument?.readyState==='complete')listen();
for(const id of ['check-hit','safe-test','scroll-test','rotation-cycle'])document.querySelector('#'+id).addEventListener('pointerdown',e=>e.preventDefault());
document.querySelector('#check-hit').onclick=report;
document.querySelector('#safe-test').onclick=()=>{const w=frame.contentWindow,d=frame.contentDocument;safe=!safe;const landscape=w.innerWidth>w.innerHeight;d.querySelector('#safe-insets').style.padding=safe?(landscape?'0px 47px 21px 47px':'47px 0px 34px 0px'):'';w.dispatchEvent(new Event('resize'));requestAnimationFrame(report);};
document.querySelector('#scroll-test').onclick=()=>{frame.contentWindow.scrollTo(0,100);requestAnimationFrame(report);};

document.querySelector('#rotation-cycle').onclick=async()=>{
 const cases=[];for(let n=0;n<3;n++)for(const [width,height]of[[390,720],[844,390],[390,720]]){
  frame.width=width;frame.height=height;frame.contentWindow.dispatchEvent(new Event('orientationchange'));
  for(let f=0;f<14;f++)await new Promise(resolve=>frame.contentWindow.requestAnimationFrame(resolve));
  cases.push(snapshot());
 }output.textContent=JSON.stringify({rotationCycles:cases},null,2);
};
