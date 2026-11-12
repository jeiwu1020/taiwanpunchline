export const CAMPAIGN_ID='mic-chase-season-1';
export const PROFILE_IDS=Object.freeze(['slot-1','slot-2','slot-3']);
export const STARTERS=Object.freeze(['wang','han']);
export const CHARACTER_IDS=Object.freeze(['wang','han','huang','su','ko','ma','chen']);
// Keep the historical save ID and implement the accepted three-versus-four structure.
export const FINALE_ID='finale-3v4';
export const FINALE_STEPS=Object.freeze(['team-select','battle','ending','complete']);
export const FINALE_RECEIPT=`${CAMPAIGN_ID}:finale:first-clear`;
export const CHAPTERS=Object.freeze(['huang','su','ko','ma','chen'].map((boss,i)=>Object.freeze({id:`chapter-${i+1}`,boss,index:i})));
export const STEPS=Object.freeze(['entry','route-a','miniboss-a','route-b','miniboss-b','route-c','boss-comic','boss','handoff-comic','roster-choice']);
export const ROUTES=Object.freeze(['route-a','route-b','route-c']);
export const FIRST_CLEAR_STEPS=Object.freeze(['route-a','miniboss-a','route-b','miniboss-b','route-c','boss']);
export const chapterById=id=>CHAPTERS.find(c=>c.id===id);
export const receiptFor=(chapterId,stepId)=>`${CAMPAIGN_ID}:${chapterId}:${stepId}:first-clear`;
export const storyFor=(chapterId,stepId)=>`${chapterId}:${({'entry':'entry','boss-comic':'before-boss','handoff-comic':'after-boss'})[stepId]}`;
