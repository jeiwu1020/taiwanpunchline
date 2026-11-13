// Float inside the isolated game document so tools do not blur/pause gameplay.
// Shadow styles keep test controls out of the game's layout and CSS selectors.
export function createQuickViewTools(document){
 const host=document.createElement('div');host.id='quick-view-tools';
 host.style.cssText='position:fixed;inset:0;z-index:2147483647;pointer-events:none;margin:0;border:0;padding:0;width:auto;height:auto;background:transparent;overflow:visible;';
 // The top layer escapes transformed/scrolling game dialogs while remaining
 // their DOM descendant, so modal inertness cannot disable the controls.
 if(typeof host.showPopover==='function')host.setAttribute('popover','manual');
 const root=host.attachShadow({mode:'open'});
 root.innerHTML=`<style>
 :host{font:15px/1.45 system-ui;color:#173239;--safe-top:env(safe-area-inset-top,0px);--safe-bottom:env(safe-area-inset-bottom,0px);--safe-left:env(safe-area-inset-left,0px);--safe-right:env(safe-area-inset-right,0px)}*{box-sizing:border-box}[hidden]{display:none!important}
 button,select,a{font:inherit;min-height:44px;border:2px solid #173239;border-radius:8px;padding:7px 10px}button{background:#f9da8b;color:#173239;cursor:pointer}button:disabled{opacity:.5;cursor:default}
 #toggle{position:absolute;top:max(6px,env(safe-area-inset-top));left:50%;transform:translateX(-50%);min-height:32px;padding:3px 12px;border-radius:0 0 12px 12px;box-shadow:0 2px 5px #0004;pointer-events:auto;font-size:13px}
 #panel{pointer-events:auto;position:absolute;top:max(44px,calc(env(safe-area-inset-top) + 38px));right:max(8px,env(safe-area-inset-right));width:min(370px,calc(100vw - 16px));max-height:calc(100dvh - 58px - env(safe-area-inset-top));overflow:auto;overscroll-behavior:contain;background:#fff3d3;border:3px solid #173239;border-radius:12px;padding:12px;box-shadow:4px 6px 0 #17323955}
 h1{font-size:18px;margin:0 0 10px}.controls{display:grid;grid-template-columns:1fr 1fr;gap:8px}label{display:grid;gap:4px;font-size:13px}select{width:100%;min-width:0;background:#fff9eb}#advance{grid-column:1/-1;font-weight:800}#status{font-size:13px;margin:10px 0 0;overflow-wrap:anywhere}footer{display:flex;justify-content:space-between;gap:8px;margin-top:10px}a{display:flex;align-items:center;color:#173239;text-decoration:none;background:#fff9eb}#close{flex:1}
 @media(max-height:450px){#panel{width:min(570px,calc(100vw - 16px));padding:10px}h1{font-size:16px;margin:0 0 6px}.controls{grid-template-columns:1fr auto 1fr auto;align-items:end}#advance{grid-column:auto}#status{font-size:12px;margin-top:7px}footer{margin-top:6px}button,select,a{font-size:13px;padding:5px 8px}}
 </style>
 <button id="toggle" type="button" aria-controls="panel" aria-expanded="false">快通工具</button>
 <section id="panel" hidden aria-label="快速通關工具">
 <h1>快通工具 · 預覽限定</h1><div class="controls">
 <label>章節<select id="chapter"><option value="1">第一章</option><option value="2">第二章</option><option value="3">第三章</option><option value="4">第四章</option><option value="5">第五章</option><option value="6">最終戰與結局</option></select></label>
 <button id="load" type="button" disabled>進入／重看</button>
 <label>畫面<select id="view-size" aria-label="快覽畫面尺寸"><option value="auto">跟隨視窗（原尺寸）</option><option value="portrait">直向 390×844</option><option value="landscape">橫向 844×390</option><option value="desktop">桌機 1280×720</option></select></label>
 <button id="advance" type="button" disabled>快速過關</button></div>
 <p id="status" role="status">正在確認預覽環境…</p>
 <footer><a href="/" target="_top">離開快覽</a><button id="close" type="button">收合工具</button></footer></section>`;
 const toggle=root.querySelector('#toggle'),panel=root.querySelector('#panel');let observer=null,owner=document,positionFrame=0;const prepared=new WeakSet();
 function positionToggle(){
  const w=owner.defaultView.innerWidth,h=owner.defaultView.innerHeight,tw=toggle.offsetWidth||80,th=toggle.offsetHeight||32;
  const scope=host.parentElement?.localName==='dialog'?host.parentElement:owner;
  const obstacles=[...scope.querySelectorAll('button,a,input,select,[role="button"],[role="tab"],[role="checkbox"]')].map(node=>node.getBoundingClientRect()).filter(r=>r.width&&r.height);
  const style=owner.defaultView.getComputedStyle(host),safe=edge=>Math.max(6,parseFloat(style.getPropertyValue('--safe-'+edge))||0),top=safe('top'),bottom=h-th-safe('bottom'),left=safe('left'),right=w-tw-safe('right');
  const candidates=[[w/2-tw/2,top],[w/2-tw/2,bottom],[left,h/2-th/2],[right,h/2-th/2],[left,top],[right,top]];
  const score=([x,y])=>obstacles.reduce((total,r)=>total+Math.max(0,Math.min(x+tw+4,r.right)-Math.max(x-4,r.left))*Math.max(0,Math.min(y+th+4,r.bottom)-Math.max(y-4,r.top)),0);
  const [x,y]=candidates.map(point=>({point,score:score(point)})).sort((a,b)=>a.score-b.score)[0].point;
  toggle.style.left=Math.max(0,x)+'px';toggle.style.top=Math.max(0,y)+'px';toggle.style.transform='none';
 }
 function schedulePosition(){if(positionFrame)return;positionFrame=owner.defaultView.requestAnimationFrame(()=>{positionFrame=0;positionToggle();});}
 function close({focus=false}={}){panel.hidden=true;toggle.setAttribute('aria-expanded','false');toggle.textContent='快通工具';schedulePosition();if(focus)toggle.focus();}
 function open(){panel.hidden=false;toggle.setAttribute('aria-expanded','true');toggle.textContent='收合工具';}
 toggle.onclick=()=>panel.hidden?open():close();root.querySelector('#close').onclick=()=>close({focus:true});
 root.addEventListener('keydown',event=>{event.stopPropagation();if(event.key==='Escape'){event.preventDefault();close({focus:true});}});
 // Releases must reach the game if a held key is released after focus enters tools.
 for(const type of ['pointerdown','pointerup','pointermove','pointercancel','wheel','click'])root.addEventListener(type,event=>event.stopPropagation());
 function prepare(nextDocument){
  if(prepared.has(nextDocument))return;prepared.add(nextDocument);
  // Called by the early isolation bootstrap, before game modal capture handlers.
  nextDocument.defaultView.addEventListener('keydown',event=>{
   if(!event.composedPath().includes(host))return;
   event.stopImmediatePropagation();
   if(event.key==='Escape'){event.preventDefault();close({focus:true});}
  },true);
  nextDocument.defaultView.addEventListener('resize',()=>{if(owner===nextDocument)schedulePosition();});
  // Prevent a rotated game dialog from starting its own scroll/drag gesture.
  for(const type of ['pointerdown','wheel'])nextDocument.defaultView.addEventListener(type,event=>{
   if(event.composedPath().includes(host))event.stopImmediatePropagation();
  },{capture:true,passive:true});
 }
 function mount(nextDocument){
  observer?.disconnect();if(positionFrame)owner.defaultView.cancelAnimationFrame(positionFrame);positionFrame=0;owner=nextDocument;prepare(nextDocument);let modalOrder=[];
  const place=(records=[])=>{
   modalOrder=modalOrder.filter(dialog=>dialog.isConnected&&dialog.open);
   for(const dialog of nextDocument.querySelectorAll('dialog[open]'))if(!modalOrder.includes(dialog))modalOrder.push(dialog);
   for(const record of records)if(record.type==='attributes'&&record.target.localName==='dialog'&&record.target.open){modalOrder=modalOrder.filter(dialog=>dialog!==record.target);modalOrder.push(record.target);}
   const target=modalOrder.at(-1)??nextDocument.body;
   if(target&&host.parentNode!==target){target.append(host);if(host.hasAttribute('popover'))host.showPopover();schedulePosition();}
  };
  place();const Observer=nextDocument.defaultView?.MutationObserver;
  if(Observer){observer=new Observer(place);observer.observe(nextDocument.documentElement,{subtree:true,childList:true,attributes:true,attributeFilter:['open']});}
 }
 mount(document);
 return {host,root,open,close,mount,prepare,destroy(){observer?.disconnect();if(positionFrame)owner.defaultView.cancelAnimationFrame(positionFrame);host.remove();}};
}

// Fixed sizes are opt-in; auto uses the entire viewport without navigation.
export function bindQuickViewSize(root,document){
 const select=root.querySelector('#view-size'),frame=document.querySelector('#game'),host=document.querySelector('#view-host');
 const sizes={portrait:[390,844],landscape:[844,390],desktop:[1280,720]};
 const resize=()=>{const size=sizes[select.value];host.dataset.fixed=String(!!size);frame.style.width=size?size[0]+'px':'100%';frame.style.height=size?size[1]+'px':'100%';};
 select.addEventListener('change',resize);resize();
}
