// The displayed percentage and bar share the same clamped value. Readiness is
// supplied by the game rather than inferred from a rounded percentage.
export function chargeMeterView({charge=0,ready=false,active=false}={}){
 const value=Number.isFinite(charge)?Math.max(0,Math.min(100,charge)):0;
 const percent=Math.floor(value);
 return {percent,ratio:value/100,text:active?'登場中':ready?'可用':percent+'%'};
}
export function renderChargeMeter(button,state){
 const view=chargeMeterView(state),fill=button.querySelector('.charge-fill');
 if(fill)fill.style.transform=`scaleX(${view.ratio})`;
 button.setAttribute('data-charge-percent',String(view.percent));
 return view;
}
