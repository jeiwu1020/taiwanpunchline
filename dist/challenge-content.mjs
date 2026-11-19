// Fictional comic archetypes, never portraits or stand-ins for real people.
export const MOB_TYPES=Object.freeze({
 placard:{name:'宣傳尖兵',hp:32,speed:92,damage:5,range:105,windup:.55,recovery:1.15,behavior:'brawler',xp:8,cp:2},
 leaflet:{name:'文宣投手',hp:25,speed:65,damage:5,range:430,windup:.85,recovery:1.8,behavior:'thrower',xp:9,cp:2},
 barricade:{name:'排隊糾察',hp:48,speed:48,damage:8,range:135,windup:.9,recovery:1.8,behavior:'guard',xp:12,cp:3},
});
export const CHALLENGE_SECTIONS=Object.freeze([
 {id:'street',name:'巷口口號街',width:2600,theme:'street',platforms:[{left:1040,right:1270,y:342,kind:'crate'},{left:1450,right:1590,y:370,kind:'step'}],gate:{id:'miniboss-1',kind:'miniboss',opponent:'han',name:'擴音隊長',moves:['mini_flyer_shot','mini_whistle_charge','mini_megaphone_blast']},spawns:[['placard',580],['placard',930],['leaflet',1180],['placard',780,1000],['barricade',1660],['leaflet',2050]],supplyX:1850},
 {id:'market',name:'市場文宣戰',width:2900,theme:'market',platforms:[{left:1160,right:1430,y:330,kind:'stall'},{left:1740,right:1890,y:370,kind:'step'}],gate:{id:'miniboss-2',kind:'miniboss',opponent:'su',name:'封街總管',moves:['mini_megaphone_blast','mini_step_rush','mini_pass_grab']},spawns:[['leaflet',650],['barricade',980],['placard',480,1050],['leaflet',1550],['placard',1850],['barricade',2340]],supplyX:2050},
 {id:'campaign',name:'造勢終點路',width:3100,theme:'campaign',platforms:[{left:1100,right:1260,y:370,kind:'step'},{left:1260,right:1580,y:325,kind:'stage'}],gate:{id:'final-huang',kind:'boss',opponent:'huang',name:'咆哮哥'},spawns:[['placard',620],['leaflet',900],['barricade',1350],['placard',860,1450],['leaflet',1900],['barricade',2370],['placard',2600]],supplyX:2220},
]);
// Final-boss helpers are the fictional captains the player has already met.
// `helper` selects a combat move kit; `mobKind` and `displayName` define identity.
export const CHALLENGE_BOSS_ASSIST_ROSTER=Object.freeze([
 {helper:'han',mobKind:'mini_mic',displayName:'擴音隊長',moves:['mini_flyer_shot','mini_whistle_charge']},
 {helper:'su',mobKind:'mini_guard',displayName:'封街總管',moves:['mini_megaphone_blast','mini_step_rush']},
]);
export const CHALLENGE_DIFFICULTY=Object.freeze({beginner:{damage:.55,speed:.8,windup:1.35},easy:{damage:.8,speed:.95,windup:1.1},hard:{damage:1.15,speed:1.1,windup:.85}});
