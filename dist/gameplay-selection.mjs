// Block document-like long-press behavior only on the game presentation.
// No touchstart/move interception: settings still scroll and fields still edit.
const editable='input,textarea,select,[contenteditable]:not([contenteditable="false"]),[data-native-selection]';
export function mountGameplaySelectionGuard({root,ownsTarget}){
 const cancel=event=>{
  const target=event.target?.closest?event.target:event.target?.parentElement;
  if(!target||target.closest(editable)||!ownsTarget(target))return;
  if(event.cancelable)event.preventDefault();
 };
 const types=['selectstart','contextmenu','dragstart'];
 for(const type of types)root.addEventListener(type,cancel,{capture:true});
 return {destroy(){for(const type of types)root.removeEventListener(type,cancel,{capture:true});}};
}
