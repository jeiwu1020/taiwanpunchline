// Browser-only regression using actual rendered DOM rectangles. No world/save
// injection and no production edits; native and sideways share logical axes.
export function inspectCompactHud(document){
 const root=document.querySelector('#trial-app')||document.querySelector('#viewport-shell > .app');
 if(!root)return {passed:false,violations:['Missing game root'],panels:[]};
 const rotation=Number(root.dataset.rotation)||0,origin=root.getBoundingClientRect(),win=document.defaultView;
 const rect=element=>{const r=element.getBoundingClientRect(),left=rotation===90?r.top-origin.top:r.left-origin.left,top=rotation===90?origin.right-r.right:r.top-origin.top,width=rotation===90?r.height:r.width,height=rotation===90?r.width:r.height;return {left,top,right:left+width,bottom:top+height,width,height};};
 const visible=element=>!element.closest('[hidden],.hidden')&&win.getComputedStyle(element).display!=='none'&&win.getComputedStyle(element).visibility!=='hidden';
 const violations=[],panels=[];
 for(const panel of root.querySelectorAll('.dom-hud .hud-side,.dom-hud .timer')){
  if(!visible(panel))continue;const bounds=rect(panel),style=win.getComputedStyle(panel),children=[],panelId=panel.id||(panel.classList.contains('timer')?'timer':'fighter-panel');
  for(const child of panel.querySelectorAll(':scope > *, .hud-name > *, .guard-row > *')){
   if(!visible(child))continue;const box=rect(child);if(!box.width||!box.height)continue;
   const id=child.id||child.className||child.tagName;children.push({id,rect:box});
   if(box.left<bounds.left-.5||box.right>bounds.right+.5||box.top<bounds.top-.5||box.bottom>bounds.bottom+.5)violations.push(`${panelId}/${id} outside HUD panel`);
  }
  panels.push({id:panelId,rect:bounds,rows:style.gridTemplateRows,gap:style.rowGap,children});
 }
 if(!panels.length)violations.push('No visible fighter HUD');
 return {passed:!violations.length,rotation,compact:root.dataset.compact,layout:root.dataset.layout,violations,panels};
}
