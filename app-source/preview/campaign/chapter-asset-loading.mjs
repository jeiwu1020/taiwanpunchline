/**
 * Load the chapter's shared art first, then only the saved route's backdrop.
 * Other route backdrops and miniboss atlases can download after the first
 * playable frame without delaying continuation from a saved checkpoint.
 */
export function chapterAssetLoadPlan(files,{sceneIndex=null,includeMinibossAtlas=false,sceneAssetIndexes={}}={}){
 const required={},background={};
 for(const [key,file]of Object.entries(files??{})){
  const scene=key.match(/-scene-(\d+)$/),owner=scene?Number(scene[1]):sceneAssetIndexes[key];
  const laterScene=Number.isInteger(owner)&&(sceneIndex===null||owner!==sceneIndex);
  const laterAtlas=/miniboss-atlas$/i.test(key)&&!includeMinibossAtlas;
  (laterScene||laterAtlas?background:required)[key]=file;
 }
 return {required,background};
}

/**
 * `resolveScene` runs after shared assets are ready so the caller can attach a
 * saved chapter and inspect its current route. Its returned scene index and
 * miniboss flag select the rest of the startup-critical image set.
 */
export async function loadChapterAssetsInStages({files,resolveScene,loadImage,onProgress,sceneAssetIndexes,concurrency=6}={}){
 if(typeof loadImage!=='function')throw new TypeError('loadImage must be a function');
 const limit=Math.max(1,Number(concurrency)||6);
 const loadBatch=async(batch,phase)=>{
  const entries=Object.entries(batch),total=entries.length;if(!total)return {images:{},errors:[]};
  const results=new Array(total);let next=0,loaded=0;
  const worker=async()=>{
   while(next<total){
    const index=next++,[key,file]=entries[index];
    try{results[index]={key,image:await loadImage(key,file,phase)};}
    catch(error){results[index]={key,error};}
    finally{loaded++;try{onProgress?.({phase,key,loaded,total});}catch{/* Progress UI cannot block asset loading. */}}
   }
  };
  await Promise.all(Array.from({length:Math.min(limit,total)},()=>worker()));
  return {images:Object.fromEntries(results.filter(result=>!result.error).map(result=>[result.key,result.image])),errors:results.filter(result=>result.error).map(result=>result.error)};
 };

 const commonPlan=chapterAssetLoadPlan(files,{sceneIndex:null,sceneAssetIndexes});
 const common=await loadBatch(commonPlan.required,'shared');
 if(common.errors.length)throw common.errors[0];
 const target=await resolveScene?.({images:common.images})??{};
 const currentPlan=chapterAssetLoadPlan(files,{sceneIndex:Number.isInteger(target.sceneIndex)?target.sceneIndex:0,includeMinibossAtlas:target.includeMinibossAtlas===true,sceneAssetIndexes});
 const currentOnly=Object.fromEntries(Object.entries(currentPlan.required).filter(([key])=>!Object.hasOwn(common.images,key)));
 const current=await loadBatch(currentOnly,'current-scene');
 if(current.errors.length)throw current.errors[0];
 const images={...common.images,...current.images};let backgroundPromise=null;
 return {
  images,
  backgroundFiles:currentPlan.background,
  loadBackground(){
   if(!backgroundPromise)backgroundPromise=loadBatch(currentPlan.background,'background');
   return backgroundPromise;
  }
 };
}
