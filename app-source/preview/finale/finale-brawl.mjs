import {CAST} from '../../core.mjs?v=chapter-presentation-20261117-r1';
import {deriveFighterStats} from '../../fighter-attributes.mjs?v=chapter-presentation-20261117-r1';
import {CHARACTER_IDS} from '../campaign/core/catalog.mjs?v=chapter-presentation-20261117-r1';
import {FinaleArena} from './finale-engine.mjs?v=chapter-presentation-20261117-r1';

const VALID_DIFFICULTIES=new Set(['beginner','easy','hard']);
const reject=reason=>({accepted:false,persisted:false,reason});

/**
 * Standalone 3v4 Brawl session (?brawl=1).
 * Never touches localStorage or campaign saves; unlocks all 7 fighters with
 * toggleable Rank-5 signature perks for everyone in the arena.
 */
export function createFinaleBrawlSession({difficulty='easy',rank5Perks=true,team=['wang','han','huang'],rng=Math.random,onChange=()=>{}}={}){
 let currentDifficulty=VALID_DIFFICULTIES.has(difficulty)?difficulty:'easy';
 let useRank5=!!rank5Perks;
 let currentTeam=Array.isArray(team)&&team.length===3&&new Set(team).size===3&&team.every(id=>CHARACTER_IDS.includes(id))?[...team]:['wang','han','huang'];
 let world=null,mode='team-select',result=null,paused=false,serial=0;

 const notify=()=>{try{onChange();}catch{}};
 const statsFor=id=>deriveFighterStats(id,{challenge:true,skills:useRank5?{special:5}:{}});
 const newWorld=()=>{
  world=new FinaleArena({team:currentTeam,difficulty:currentDifficulty,rng,statsForCharacter:statsFor});
  mode='battle';result=null;paused=false;serial++;notify();
 };

 function view(){
  return {
   mode,
   brawl:true,
   replay:false,
   stepId:mode,
   token:String(serial),
   characterId:currentTeam[0],
   helperId:currentTeam[1],
   difficulty:currentDifficulty,
   rank5Perks:useRank5,
   unlocked:[...CHARACTER_IDS],
   team:[...currentTeam],
   rounds:{player:0,enemy:0},
   result,
   paused,
   busy:false,
   blocked:false,
   frameIndex:0,
   frameCount:1,
   storyFrame:null,
   preview:true,
   persisted:true,
   canNavigate:true,
   saveIssue:null,
   saveLabel:'3v4 大亂鬥（全角解鎖 · 不寫入正式存檔）',
   review:false,
  };
 }

 return {
  view,
  get world(){return world;},
  flush:()=>Promise.resolve(),
  setOptions({difficulty:nextDiff,rank5Perks:nextRank5}={}){
   let changed=false;
   if(nextDiff!==undefined&&VALID_DIFFICULTIES.has(nextDiff)&&nextDiff!==currentDifficulty){currentDifficulty=nextDiff;changed=true;}
   if(nextRank5!==undefined&&Boolean(nextRank5)!==useRank5){useRank5=Boolean(nextRank5);changed=true;}
   if(changed){serial++;notify();}
   return {accepted:true,persisted:true};
  },
  async start(selectedTeam=currentTeam){
   if(!Array.isArray(selectedTeam)||selectedTeam.length!==3||new Set(selectedTeam).size!==3||!selectedTeam.every(id=>CHARACTER_IDS.includes(id)))return reject('invalid-team');
   currentTeam=[...selectedTeam];
   newWorld();
   return {accepted:true,persisted:true};
  },
  step(dt,input={}){
   if(paused||mode!=='battle'||!world)return;
   world.step(dt,input);
   if(world.status==='over'){
    result={kind:'battle',winner:world.winner,matchWon:world.winner==='player',matchLost:world.winner==='enemy'};
    mode='result';serial++;notify();
   }
  },
  press(action){
   return !paused&&mode==='battle'&&!!world&&world.player.hp>0&&world.press(action);
  },
  setPaused(value,t){
   if(!['battle','result'].includes(mode)||(t!==undefined&&t!==String(serial)))return false;
   paused=!!value;serial++;notify();return true;
  },
  async continueResult(){
   if(mode!=='result')return reject('not-result');
   newWorld();
   return {accepted:true,persisted:true};
  },
  async reselect(){
   if(!['battle','result'].includes(mode))return reject('not-battle');
   mode='team-select';world=null;paused=false;result=null;serial++;notify();
   return {accepted:true,persisted:true};
  },
  async restartSegment(){
   if(mode!=='battle'||!paused)return reject('not-paused');
   newWorld();
   return {accepted:true,persisted:true};
  },
  async retrySave(){return {accepted:true,persisted:true};},
  preparationSnapshot(){
   const skillsFor=()=>({hp:0,move:0,basic:0,defense:0,special:useRank5?5:0,rally:0,assist:0});
   return {
    characterId:currentTeam[0],
    helperId:currentTeam[1],
    difficulty:currentDifficulty,
    unlockedCharacters:[...CHARACTER_IDS],
    allowance:useRank5?5:0,
    characters:Object.fromEntries(CHARACTER_IDS.map(id=>[id,{skills:skillsFor()}])),
    rank5Perks:useRank5,
    skills:skillsFor(),
    perks:Object.fromEntries(CHARACTER_IDS.map(id=>[id,{...statsFor(id).perk,castName:CAST[id].name}])),
    token:String(serial),
    testMode:true,
    preview:true,
    readOnly:true,
   };
  },
  exportJSON:()=>null,
  exportLegacyJSON:()=>null,
  drainEvents:()=>world?.drainEvents()??[],
 };
}
