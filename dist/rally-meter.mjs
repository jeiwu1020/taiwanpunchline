// Reserve a visible top gap until the actual threshold, rather than visually
// rounding 99 into a full button. This affects presentation only.
export function rallyMeterView(value,status='active'){
 const charge=Math.max(0,Math.min(100,Number(value)||0)),ready=charge>=100;
 return {ready,fill:ready?100:charge*.94,label:ready?'可發動':'集氣中',disabled:!ready||status!=='active',aria:`揪團，${ready?'已集滿，可發動':'集氣中，尚未集滿'}，鍵盤 L`};
}
