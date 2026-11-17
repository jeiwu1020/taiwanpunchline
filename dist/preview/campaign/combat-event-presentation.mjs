import {makeCombatCallout,moveCalloutForMove,moveKindForAction,rememberCombatCallout} from './combat-callouts.mjs?v=chapter-presentation-20261117-r1';
import {rememberCombatFeedback} from './combat-feedback.mjs?v=chapter-combat-feedback-20261115-r1';
import {CAST} from '../../core.mjs?v=rally-consistency-20261115-r1';
import {rallyEventCopy} from './rally-crowd.mjs?v=rally-depth-alpha-20261115-r1';

// One presentation path for every combat event in chapters 2-5.
//
// Everything the player has to *see* is drawn on the canvas, in the same two
// vocabularies chapter one uses: screen-lane shout callouts for named moves and
// world-anchored pop-ups for everything else. The old green DOM bar (#feedback)
// is gone; that element survives only as a visually hidden live region so screen
// readers still hear rally, assist and supply announcements.
export const LIVE_REGION_MS=1500;
const liveTimers=new WeakMap();

export function announceCombatEvent(live,text){
 if(!live||!text)return;
 live.textContent=text;
 clearTimeout(liveTimers.get(live));
 liveTimers.set(live,setTimeout(()=>{live.textContent='';},LIVE_REGION_MS));
}

export function combatEventAnnouncement(event,world,emitted=[]){
 if(event?.type==='rally')return rallyEventCopy(event,world,emitted.filter(item=>item.type==='rally').length>1);
 if(event?.type==='assistStart')return `${event.assist?.displayName??CAST[event.helper]?.name??'助拳'} · ${event.name??'援護到場'}`;
 if(event?.type==='supply')return '補給到手！HP 全滿';
 return '';
}

export function combatEventCallout(event,world){
 const named=event?.type==='minibossWarning'||event?.type==='move'&&[world?.enemy,world?.player].includes(event.f);
 if(!named)return null;
 return event.f===world.player?moveCalloutForMove(event.kind,event.name,event.f.type):makeCombatCallout(event.name??'注意對手動作','',moveKindForAction(event.action??event.kind,event.f?.type),event.f?.type);
}

export function presentCombatEvents(emitted,world,{callouts,feedback,live,now=performance.now()}={}){
 if(!Array.isArray(emitted)||!emitted.length||!world)return;
 for(const event of emitted){
  // Supply has no actor of its own; the player is who picked it up.
  rememberCombatFeedback(feedback,event.type==='supply'?{...event,f:world.player}:event,now);
  const caption=combatEventCallout(event,world);
  if(caption&&callouts)rememberCombatCallout(callouts,event.f,caption,now);
  announceCombatEvent(live,combatEventAnnouncement(event,world,emitted));
 }
}
