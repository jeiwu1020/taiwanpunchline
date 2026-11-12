// Presentation only. Cooldown truth remains in Duel; never mark a positive
// fraction ready early or report a negative/invalid countdown to the player.
export function cooldownView(remaining,total){
 const duration=Number.isFinite(total)&&total>0?total:0;
 const seconds=duration&&Number.isFinite(remaining)?Math.min(duration,Math.max(0,remaining)):0;
 const ready=seconds===0;
 return {seconds,ratio:duration?seconds/duration:0,ready,
  value:ready?'✓':(Math.ceil(seconds*10)/10).toFixed(1),
  label:ready?'就緒':'秒',
  description:ready?'冷卻完成':`冷卻剩餘 ${Math.ceil(seconds)} 秒`};
}
// The remaining portion is a closed, center-connected filled sector. Full time
// needs two arcs because SVG treats a one-arc identical endpoint as empty.
export function cooldownSectorPath(ratio){
 const fraction=Number.isFinite(ratio)?Math.min(1,Math.max(0,ratio)):0;
 if(fraction===0)return '';
 if(fraction===1)return 'M20 20 L20 3 A17 17 0 1 1 20 37 A17 17 0 1 1 20 3 Z';
 const angle=fraction*Math.PI*2;
 const x=Number((20+17*Math.sin(angle)).toFixed(6));
 const y=Number((20-17*Math.cos(angle)).toFixed(6));
 return `M20 20 L20 3 A17 17 0 ${fraction>.5?1:0} 1 ${x} ${y} Z`;
}
const previous=new WeakMap();
export function renderCooldownButton(button,move,remaining){
 const view=cooldownView(remaining,move.cooldown),last=previous.get(button)||{};
 const ratio=view.ratio;
 const label=`${move.name}，${move.purpose??move.hint}，${view.description}`;
 if(last.ratio!==ratio){
  // Retain legacy geometry for the separate old trial, but the main controls
  // now paint readiness from the bottom. Gameplay cooldown truth is unchanged.
  button.querySelector('.cooldown-sector')?.setAttribute('d',cooldownSectorPath(ratio));
  button.style.setProperty('--cooldown-ready',`${(1-ratio)*100}%`);
 }
 if(last.value!==view.value)button.querySelector('.cooldown-value').textContent=view.value;
 if(last.ready!==view.ready){
  button.classList.toggle('cooling',!view.ready);
  button.querySelector('.cooldown-label').textContent=view.label;
  button.setAttribute('aria-disabled',String(!view.ready));
 }
 // Not a live region. The accessible label changes at most once a second;
 // frame-by-frame sector changes and tenths do not announce repeatedly.
 if(last.label!==label)button.setAttribute('aria-label',label);
 previous.set(button,{ratio,value:view.value,ready:view.ready,label});
 return view;
}
