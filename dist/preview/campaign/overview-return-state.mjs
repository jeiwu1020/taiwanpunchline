const STORAGE_KEY='taiwanpunchline:challenge-overview-return';
const FIELDS=['selected','opponent','rosterSide','difficulty','roundFormat','playerAssist','enemyAssist','gameMode','trainingBehavior','trainingInfinite','trainingRepeat'];

function clean(value){
 if(!value||typeof value!=='object'||Array.isArray(value))return null;
 const result={};
 for(const field of FIELDS){const entry=value[field];if(typeof entry==='string'||typeof entry==='boolean')result[field]=entry;}
 return Object.keys(result).length?result:null;
}

export function createChallengeOverviewReturnState(storage){
 let memory=null;
 return {
  save(value){
   memory=clean(value);
   if(!memory)return false;
   try{if(!storage)return false;storage.setItem(STORAGE_KEY,JSON.stringify(memory));return true;}catch{return false;}
  },
  take(){
   let result=memory;
   try{
    const saved=storage?.getItem(STORAGE_KEY);
    if(saved){const parsed=clean(JSON.parse(saved));if(parsed)result=parsed;}
    storage?.removeItem(STORAGE_KEY);
   }catch{}
   memory=null;
   return result?{...result}:null;
  }
 };
}
