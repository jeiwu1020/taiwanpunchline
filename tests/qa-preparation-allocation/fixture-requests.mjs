// One request builder used by the real fixture UI and its regression tests.
// A formal six-size matrix never inherits the interactive breakpoint picker.
export function frameRequest(size,{rotation=90,readOnly=false,containerWidth='',source='single-profile'}={}){
 const [name,width,height,angle]=size,naturalMatrix=source==='six-size-natural-matrix';
 const override=naturalMatrix?'':String(containerWidth??'').trim();
 const params=new URLSearchParams({name,width:String(width),height:String(height),rotation:String(angle?rotation:0),readOnly:String(readOnly),sampleSource:naturalMatrix?'six-size-natural-matrix':override?'breakpoint-probe':source});
 if(override)params.set('containerWidth',override);
 return {width,height,src:'frame.html?'+params.toString()};
}
