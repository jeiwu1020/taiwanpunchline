// The source select remains the value/event boundary, never the visible picker.
// Popups live in the game's transformed app or modal, not an OS-owned menu.
const bindings=new WeakMap(),mounts=new WeakMap();
let nextId=0;
export function setGameSelectValue(select,value){select.value=value;bindings.get(select)?.sync();}
export function logicalSelectRect(rect,host,{width,height,rotation=0}){
 if(rotation===90)return{left:(rect.top-host.top)*width/host.height,top:(host.right-rect.right)*height/host.width,width:rect.height*width/host.height,height:rect.width*height/host.width};
 if(rotation===-90)return{left:(host.bottom-rect.bottom)*width/host.height,top:(rect.left-host.left)*height/host.width,width:rect.height*width/host.height,height:rect.width*height/host.width};
 return{left:(rect.left-host.left)*width/host.width,top:(rect.top-host.top)*height/host.height,width:rect.width*width/host.width,height:rect.height*height/host.height};
}
export function gameSelectFrame({left,top,width,height,panelWidth,panelHeight,optionCount=1}){
 const gutter=6,gap=6,menuWidth=Math.max(1,Math.min(Math.max(180,width),panelWidth-gutter*2));
 const wanted=Math.min(280,Math.max(1,optionCount)*49+12),below=Math.max(0,panelHeight-gutter-top-height-gap),above=Math.max(0,top-gap-gutter);
 const placement=below>=wanted||below>=above?'below':'above',maxHeight=Math.max(1,Math.min(wanted,placement==='below'?below:above,panelHeight-gutter*2));
 return{left:Math.max(gutter,Math.min(left,panelWidth-gutter-menuWidth)),top:Math.max(gutter,Math.min(placement==='below'?top+height+gap:top-gap-maxHeight,panelHeight-gutter-maxHeight)),width:menuWidth,maxHeight,placement};
}
export function mountGameSelects({document:doc=globalThis.document}={}){
 if(mounts.has(doc))return mounts.get(doc);
 const win=doc.defaultView,records=new Map(),listeners=[];let opened=null,disposed=false;
 function listen(target,type,handler,options){target.addEventListener(type,handler,options);listeners.push(()=>target.removeEventListener(type,handler,options));}
 function visible(record){
  if(!record.wrapper.isConnected)return false;
  for(let node=record.wrapper;node&&node!==doc;node=node.parentElement){
   if(node.hidden||node.inert||node.classList?.contains('hidden')||(node.tagName==='DIALOG'&&!node.open)||(node.tagName==='DETAILS'&&!node.open))return false;
  }
  return true;
 }
 function close(focus=false){
  if(!opened)return false;const record=opened;opened=null;record.menu.hidden=true;record.trigger.setAttribute('aria-expanded','false');record.gesture=null;record.search='';
  if(focus&&visible(record)&&!record.trigger.disabled)record.trigger.focus({preventScroll:true});return true;
 }
 function focusOption(option){
  if(!option)return;option.focus({preventScroll:true});const menu=opened?.menu;if(!menu)return;
  const top=option.offsetTop,bottom=top+option.offsetHeight;
  if(top<menu.scrollTop)menu.scrollTop=top;else if(bottom>menu.scrollTop+menu.clientHeight)menu.scrollTop=bottom-menu.clientHeight;
 }
 function place(record){
  const {host,trigger,menu}=record,body=host===doc.body,rotation=body?0:Number(host.dataset.rotation)||0;
  menu.dataset.rotation=String(rotation);menu.style.position=body?'fixed':'absolute';
  const panelWidth=body?win.innerWidth:host.clientWidth,panelHeight=body?win.innerHeight:host.clientHeight;
  if(!panelWidth||!panelHeight)return;
  const rect=trigger.getBoundingClientRect(),hostRect=body?{left:0,top:0,width:panelWidth,height:panelHeight}:host.getBoundingClientRect();
  const logical=logicalSelectRect(rect,hostRect,{width:body?panelWidth:host.offsetWidth,height:body?panelHeight:host.offsetHeight,rotation});
  const frame=gameSelectFrame({...logical,left:logical.left-(host.clientLeft||0),top:logical.top-(host.clientTop||0),panelWidth,panelHeight,optionCount:record.options.length});
  Object.assign(menu.style,{left:(frame.left+(body?0:host.scrollLeft))+'px',top:(frame.top+(body?0:host.scrollTop))+'px',width:frame.width+'px',maxHeight:frame.maxHeight+'px'});menu.dataset.placement=frame.placement;
 }
 function open(record,last=false){
  close();record.sync();if(record.trigger.disabled||!visible(record))return;
  const host=record.select.closest('dialog')||record.select.closest('.app')||doc.body;
  if(record.menu.parentElement!==host)host.append(record.menu);record.host=host;
  opened=record;record.suppressClick=false;record.menu.hidden=false;record.trigger.setAttribute('aria-expanded','true');place(record);
  const choices=record.options.filter(b=>!b.disabled&&!b.hidden);focusOption(last?choices.at(-1):choices.find(b=>b.getAttribute('aria-selected')==='true')||choices[0]);
 }
 function choose(record,button){
  if(opened!==record||!button||button.disabled||button.hidden||record.select.disabled||!visible(record))return;
  const option=record.select.options[Number(button.dataset.index)];if(!option||option.disabled||option.hidden||option.parentElement?.disabled)return;
  const changed=record.select.value!==option.value;record.select.value=option.value;close();
  if(changed){record.select.dispatchEvent(new win.Event('input',{bubbles:true}));record.select.dispatchEvent(new win.Event('change',{bubbles:true}));}
  record.sync();if(visible(record)&&!record.trigger.disabled)record.trigger.focus({preventScroll:true});
 }
 function keyboard(record,e){
  // Arrows, space, J/K/etc must never reach combat while choosing an option.
  e.stopPropagation();
  if(e.key==='Tab'){if(opened===record)close(true);return;}
  if(e.key==='Escape'){if(opened===record){e.preventDefault();close(true);}return;}
  if(e.key==='Enter'||e.key===' '){e.preventDefault();if(e.repeat)return;if(opened===record&&e.target!==record.trigger)choose(record,e.target.closest('[role="option"]'));else opened===record?close(true):open(record);return;}
  if(['ArrowDown','ArrowUp','Home','End'].includes(e.key)){
   e.preventDefault();if(opened!==record){open(record,e.key==='ArrowUp'||e.key==='End');return;}
   const choices=record.options.filter(b=>!b.disabled&&!b.hidden),index=choices.indexOf(doc.activeElement);
   const next=e.key==='Home'?0:e.key==='End'?choices.length-1:e.key==='ArrowDown'?(index+1)%choices.length:(index+choices.length-1)%choices.length;focusOption(choices[next]);return;
  }
  if(e.key.length===1&&!e.ctrlKey&&!e.metaKey&&!e.altKey){
   e.preventDefault();if(opened!==record)open(record);const now=Date.now();record.search=(now-record.searchAt<700?record.search:'')+e.key.toLocaleLowerCase();record.searchAt=now;
   const choices=record.options.filter(b=>!b.disabled&&!b.hidden),found=choices.find(b=>b.textContent.trim().toLocaleLowerCase().startsWith(record.search));focusOption(found);
  }
 }
 function enhance(select){
  if(records.has(select)||select.multiple)return; // This game's six controls are single-select.
  const original={hidden:select.hidden,tabindex:select.getAttribute('tabindex'),ariaHidden:select.getAttribute('aria-hidden')};
  const labels=[...select.labels||[]],name=()=>select.getAttribute('aria-label')||(select.getAttribute('aria-labelledby')||'').split(/\s+/).map(id=>doc.getElementById(id)?.textContent||'').join(' ').trim()||labels.map(label=>{const clone=label.cloneNode(true);clone.querySelectorAll('select,button,[data-game-select]').forEach(n=>n.remove());return clone.textContent.trim();}).join(' ')||'選擇選項';
  const wrapper=doc.createElement('span');wrapper.className='game-select';wrapper.dataset.gameSelect='';wrapper.hidden=original.hidden;
  const trigger=doc.createElement('button');trigger.type='button';trigger.className='game-select-trigger';trigger.id=`game-select-${++nextId}`;trigger.dataset.gameSelectFor=select.id||trigger.id;trigger.setAttribute('aria-haspopup','listbox');trigger.setAttribute('aria-expanded','false');
  const value=doc.createElement('span');value.className='game-select-value';const arrow=doc.createElement('span');arrow.className='game-select-arrow';arrow.textContent='▾';arrow.setAttribute('aria-hidden','true');trigger.append(value,arrow);
  const menu=doc.createElement('div');menu.className='game-select-menu';menu.id=`${trigger.id}-options`;menu.hidden=true;menu.setAttribute('role','listbox');trigger.setAttribute('aria-controls',menu.id);
  select.before(wrapper);wrapper.append(select,trigger);select.hidden=true;select.tabIndex=-1;select.setAttribute('aria-hidden','true');
  const record={select,wrapper,trigger,menu,value,original,options:[],signature:'',search:'',searchAt:0,gesture:null,suppressClick:false};records.set(select,record);bindings.set(select,record);
  (select.closest('dialog')||select.closest('.app')||doc.body).append(menu);
  function sync(){
   const opts=[...select.options],signature=JSON.stringify(opts.map(o=>[o.value,o.label,o.disabled,!!o.parentElement?.disabled,o.hidden]));
   const selected=opts[select.selectedIndex];value.textContent=selected?.label||'請選擇';trigger.setAttribute('aria-label',`${name()}：${value.textContent}`);menu.setAttribute('aria-label',name());
   const described=select.getAttribute('aria-describedby');if(described)trigger.setAttribute('aria-describedby',described);else trigger.removeAttribute('aria-describedby');
   trigger.disabled=select.disabled||select.matches(':disabled')||!opts.some(o=>!o.disabled&&!o.parentElement?.disabled&&!o.hidden);
   if(signature!==record.signature){
    const focusIndex=record.options.indexOf(doc.activeElement);record.signature=signature;record.options=opts.map((o,index)=>{
     const button=doc.createElement('button');button.type='button';button.className='game-select-option';button.setAttribute('role','option');button.tabIndex=-1;button.dataset.value=o.value;button.dataset.index=String(index);button.textContent=o.label;button.disabled=o.disabled||!!o.parentElement?.disabled;button.hidden=o.hidden;return button;
    });menu.replaceChildren(...record.options);if(opened===record&&focusIndex>=0)focusOption(record.options[focusIndex]||record.options[0]);
   }
   record.options.forEach((b,i)=>b.setAttribute('aria-selected',String(i===select.selectedIndex)));
   if(opened===record){if(trigger.disabled||!visible(record))close();else place(record);}
  }
  record.sync=sync;
  const sourceObserver=new win.MutationObserver(sync);sourceObserver.observe(select,{attributes:true,childList:true,subtree:true,characterData:true});
  const ancestryObserver=new win.MutationObserver(mutations=>{if(opened===record&&mutations.some(m=>m.attributeName==='data-rotation'))close(true);sync();});
  for(let node=wrapper.parentElement;node;node=node.parentElement)ancestryObserver.observe(node,{attributes:true,attributeFilter:['hidden','class','open','inert','disabled','data-rotation']});
  const cleanups=[];function on(target,type,fn,options){target.addEventListener(type,fn,options);cleanups.push(()=>target.removeEventListener(type,fn,options));}
  on(trigger,'click',()=>opened===record?close(true):open(record));on(trigger,'keydown',e=>keyboard(record,e));on(menu,'keydown',e=>keyboard(record,e));
  on(menu,'click',e=>{if(record.suppressClick&&e.detail!==0){record.suppressClick=false;e.preventDefault();e.stopPropagation();return;}const button=e.target.closest('[role="option"]');if(button)choose(record,button);});
  on(select,'change',sync);on(select,'input',sync);
  for(const label of labels)on(label,'click',e=>{if(e.target.closest('button,input,select,a'))return;e.preventDefault();trigger.focus({preventScroll:true});});
  on(menu,'pointerdown',e=>{record.suppressClick=false;if(!Number(menu.dataset.rotation)||e.pointerType!=='touch'||e.isPrimary===false)return;record.gesture={id:e.pointerId,x:e.clientX,y:e.clientY,top:menu.scrollTop,angle:Number(menu.dataset.rotation)*Math.PI/180,moved:false};});
  on(menu,'pointermove',e=>{const g=record.gesture;if(!g||g.id!==e.pointerId)return;const dx=e.clientX-g.x,dy=e.clientY-g.y;if(!g.moved&&Math.hypot(dx,dy)<6)return;g.moved=true;record.suppressClick=true;e.preventDefault();menu.setPointerCapture?.(e.pointerId);menu.scrollTop=Math.max(0,Math.min(menu.scrollHeight-menu.clientHeight,g.top-(-Math.sin(g.angle)*dx+Math.cos(g.angle)*dy)));},{passive:false});
  const release=e=>{if(record.gesture?.id===e.pointerId){if(e.type==='pointercancel')record.suppressClick=true;record.gesture=null;}};on(menu,'pointerup',release);on(menu,'pointercancel',release);
  on(menu,'wheel',e=>{if(!Number(menu.dataset.rotation))return;const unit=e.deltaMode===1?16:e.deltaMode===2?menu.clientHeight:1,delta=Math.abs(e.deltaY)>=Math.abs(e.deltaX)?e.deltaY:-Math.sin(Number(menu.dataset.rotation)*Math.PI/180)*e.deltaX;if(!delta)return;e.preventDefault();menu.scrollTop=Math.max(0,Math.min(menu.scrollHeight-menu.clientHeight,menu.scrollTop+delta*unit));},{passive:false});
  record.destroy=(restore=true)=>{if(opened===record)close();sourceObserver.disconnect();ancestryObserver.disconnect();cleanups.forEach(fn=>fn());menu.remove();if(restore)wrapper.before(select);wrapper.remove();select.hidden=original.hidden;for(const [attr,val]of [['tabindex',original.tabindex],['aria-hidden',original.ariaHidden]])val===null?select.removeAttribute(attr):select.setAttribute(attr,val);records.delete(select);bindings.delete(select);};
  sync();
 }
 function scan(root){if(root.nodeType===1&&root.matches('select'))enhance(root);root.querySelectorAll?.('select').forEach(enhance);}
 scan(doc);
 const additions=new win.MutationObserver(changes=>{
  if(disposed)return;
  for(const change of changes)for(const node of change.addedNodes)if(node.nodeType===1&&node.isConnected)scan(node);
  for(const record of records.values())if(!record.select.isConnected||!record.wrapper.isConnected)record.destroy(false);
 });additions.observe(doc.body,{childList:true,subtree:true});
 listen(doc,'pointerdown',e=>{if(opened&&!opened.wrapper.contains(e.target)&&!opened.menu.contains(e.target))close();},true);
 listen(doc,'focusin',e=>{if(opened&&!opened.wrapper.contains(e.target)&&!opened.menu.contains(e.target))close();});
 listen(doc,'scroll',e=>{if(opened&&e.target!==opened.menu)place(opened);},true);
 listen(doc,'reset',()=>win.queueMicrotask(()=>records.forEach(r=>r.sync())),true);
 listen(doc,'cancel',e=>{if(opened){e.preventDefault();e.stopPropagation();close(true);}},true);
 listen(doc,'visibilitychange',()=>{if(doc.hidden)close();});listen(win,'resize',()=>close(true));listen(win,'orientationchange',()=>close(true));listen(win,'pagehide',()=>close());
 if(win.visualViewport)listen(win.visualViewport,'resize',()=>close(true));
 const api={refresh(){scan(doc);records.forEach(r=>r.sync());},close,destroy(){if(disposed)return;disposed=true;additions.disconnect();close();listeners.forEach(fn=>fn());for(const record of [...records.values()])record.destroy();mounts.delete(doc);}};
 mounts.set(doc,api);return api;
}
