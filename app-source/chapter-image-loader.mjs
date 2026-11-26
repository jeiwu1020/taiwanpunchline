// A pending image request must not leave a chapter transition waiting forever.
export function loadChapterImage(src,{timeoutMs=30000,retries=2,ImageType=globalThis.Image,onLoad}={}){
 return new Promise((resolve,reject)=>{
  let settled=false,attempt=0,timer=null,activeImage=null;
  const failure=code=>Object.assign(new Error(code==='timeout'?'圖片載入逾時，請重新整理再試。':'圖片載入失敗，請重新整理再試。'),{code,assetURL:src});
  const clear=()=>{if(timer!=null){clearTimeout(timer);timer=null;}if(activeImage){activeImage.onload=null;activeImage.onerror=null;}};
  const start=()=>{
   if(settled)return;
   attempt++;
   const image=new ImageType();activeImage=image;
   const fail=code=>{
    if(settled||activeImage!==image)return;
    clear();image.removeAttribute?.('src');
    if(attempt<=retries){start();return;}
    settled=true;reject(failure(code));
   };
   const succeed=()=>{
    if(settled||activeImage!==image)return;
    clear();settled=true;onLoad?.(image);resolve(image);
   };
   timer=setTimeout(()=>fail('timeout'),timeoutMs);
   image.onload=succeed;
   image.onerror=()=>fail('network');
   image.src=attempt===1?src:src+(src.includes('?')?'&':'?')+'asset-retry='+attempt;
  };
  start();
 });
}
