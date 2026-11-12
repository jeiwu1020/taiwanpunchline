// Fixture acceptance, not a layout estimate. Call only with measured logical
// rectangles from the current browser frame. A 44px target may still be clipped.
export function firstRankPairVisibility({panel,footer,firstPair=[]}){
 const viewport=panel?.rect;
 if(!viewport||firstPair.length!==2)return {fullyVisible:false,hasTwoTargets:false,targets:[]};
 const bottom=Math.min(viewport.bottom,footer?.top??viewport.bottom),targets=firstPair.map(target=>{
  const visibleWidth=Math.max(0,Math.min(viewport.right,target.right)-Math.max(viewport.left,target.left));
  const visibleHeight=Math.max(0,Math.min(bottom,target.bottom)-Math.max(viewport.top,target.top));
  return {width:target.width,height:target.height,visibleWidth,visibleHeight,minimumSize:target.width>=44&&target.height>=44,fullyVisible:visibleWidth+.01>=target.width&&visibleHeight+.01>=target.height};
 });
 return {fullyVisible:targets.every(target=>target.minimumSize&&target.fullyVisible),hasTwoTargets:true,initialScroll:panel.scrollTop===0,targets};
}
export function assertInitialRankPair(measurement){
 const result=firstRankPairVisibility(measurement);
 if(!result.initialScroll||!result.fullyVisible)throw new Error('Initial preparation must show both complete 44px rank targets above the footer. '+JSON.stringify(result));
 return result;
}

// Standard acceptance is narrower than the reusable rectangle assertion.
// Fail closed when provenance is absent, contradictory, or from a breakpoint
// override. Do not trust a stale initialPairRequired flag by itself.
export function standardAllocationProfile(measurement){
 const {sample,logical,physical,view}=measurement;
 const reject=reason=>({applicable:false,reason});
 if(sample?.containerSizing!=='natural'||sample.requestedContainerWidth!==null)return reject('Standard acceptance requires natural container width; overrides are not applicable.');
 if(!['direct-fixture','single-profile','six-size-natural-matrix'].includes(sample.source))return reject('Standard acceptance requires a recognized natural sample source.');
 if(sample.purpose!=='editable-allocation'||view!=='preparation')return reject('Standard acceptance requires editable preparation, not a read-only or other view.');
 if(logical?.width!==844||logical.height!==390||![0,90,-90].includes(logical.rotation))return reject('Standard acceptance applies only to the logical 844×390 profile.');
 const rotated=logical.rotation!==0;
 if(physical?.width!==(rotated?390:844)||physical.height!==(rotated?844:390))return reject('Standard acceptance requires physical dimensions matching its native/sideways profile.');
 return {applicable:true,reason:null};
}
export function assertStandardInitialAllocation(measurement){
 const profile=standardAllocationProfile(measurement);
 if(!profile.applicable)throw new Error(profile.reason);
 if(measurement.initialPairRequired!==true)throw new Error('Standard initial-allocation gate is not applicable for this sample.');
 return {status:'PASS',profile:'natural-editable-844x390',...assertInitialRankPair(measurement)};
}
export function standardInitialAllocationResult(measurement){
 const profile=standardAllocationProfile(measurement);
 if(!profile.applicable||measurement.initialPairRequired!==true)return {status:'N/A',reason:profile.reason||'Standard initial-allocation gate is not applicable for this sample.'};
 try{return assertStandardInitialAllocation(measurement);}catch(error){return {status:'FAIL',reason:error.message};}
}
