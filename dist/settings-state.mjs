// Volume is a multiplier: 1 preserves the game's existing channel balance.
export const DEFAULT_SETTINGS=Object.freeze({
 version:1,sfxVolume:1,voiceVolume:1,musicVolume:.22,sfxMuted:false,voiceMuted:false,musicMuted:false,
 masterMuted:false,rotate:true,camera:'classic'
});

const fields=Object.keys(DEFAULT_SETTINGS).filter(key=>key!=='version');

function isRecord(value){return value!==null&&typeof value==='object'&&!Array.isArray(value);}

function ownData(object,key){
 // Never invoke getters or accept inherited properties from supplied objects.
 try{return Object.getOwnPropertyDescriptor(object,key);}
 catch{return undefined;}
}

function supportedRecord(input){
 if(!isRecord(input))return false;
 const version=ownData(input,'version');
 return !version||version.value===1;
}

function validFields(input){
 const result={};
 if(!isRecord(input))return result;
 for(const key of fields){
  const value=ownData(input,key)?.value;
  if(key==='sfxVolume'||key==='voiceVolume'||key==='musicVolume'){
   if(typeof value==='number'&&Number.isFinite(value))result[key]=Math.max(0,Math.min(1,value));
  }else if(key==='camera'){
   if(value==='classic'||value==='stable')result[key]=value;
  }else if(typeof value==='boolean')result[key]=value;
 }
 return result;
}

export function normalizeSettings(input){
 return supportedRecord(input)?{...DEFAULT_SETTINGS,...validFields(input)}:{...DEFAULT_SETTINGS};
}

/**
 * Construction only reads storage and never invokes onChange.
 * Invalid patch fields are ignored; get/update/reset return detached snapshots.
 * persisted describes the current snapshot: a valid load, successful save, or
 * successful reset removal is true; no saved record or failed persistence is false.
 * reset assumes its caller has obtained the user's confirmation.
 */
export function createSettingsStore({storage,key='parliament-settings-v1',onChange=()=>{},initialRotate}={}){
 let state={...DEFAULT_SETTINGS},persisted=false,hasSavedDirection=false;
 if(storage===undefined){
  try{storage=globalThis.localStorage;}
  catch{storage=null;}
 }
 try{
  const raw=storage?.getItem(key);
  if(raw!==null&&raw!==undefined){
   const parsed=JSON.parse(raw);
   if(supportedRecord(parsed)){
    state=normalizeSettings(parsed);
    hasSavedDirection=typeof ownData(parsed,'rotate')?.value==='boolean';
    persisted=true;
   }
  }
 }catch{/* Disabled storage or corrupt JSON must not prevent playing. */}
 if(!hasSavedDirection&&typeof initialRotate==='boolean')state.rotate=initialRotate;

 const get=()=>({...state});
 const changed=next=>fields.some(key=>next[key]!==state[key]);
 function persist(remove=false){
  try{
   if(!storage)return false;
   if(remove)storage.removeItem(key);
   else storage.setItem(key,JSON.stringify(state));
   return true;
  }catch{return false;}
 }
 function notify(){if(typeof onChange==='function')onChange(get());}

 return {
  get,
  update(patch){
   const next={...state,...validFields(patch)};
   if(!changed(next))return get();
   state=next;
   persisted=persist();
   const snapshot=get();
   notify();
   return snapshot;
  },
  reset(){
   const next={...DEFAULT_SETTINGS},didChange=changed(next);
   state=next;
   persisted=persist(true);
   const snapshot=get();
   if(didChange)notify();
   return snapshot;
  },
  get persisted(){return persisted;}
 };
}
