// A pending image request must not leave a chapter transition waiting forever.
export function loadChapterImage(src,{timeoutMs=20000,ImageType=globalThis.Image,onLoad}={}){
 return new Promise((resolve,reject)=>{
  const image=new ImageType();let settled=false;
  const finish=error=>{if(settled)return;settled=true;clearTimeout(timer);image.onload=null;image.onerror=null;if(error)reject(error);else{onLoad?.(image);resolve(image);}};
  const failure=code=>Object.assign(new Error(code==='timeout'?'圖片載入逾時，請重新整理再試。':'圖片載入失敗，請重新整理再試。'),{code,assetURL:src});
  const timer=setTimeout(()=>finish(failure('timeout')),timeoutMs);
  image.onload=()=>finish();image.onerror=()=>finish(failure('network'));image.src=src;
 });
}
