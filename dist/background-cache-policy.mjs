import {isMobileLandscapePresentation} from './challenge-layout.mjs?v=workers-background-only-20261113-r1';
// Presentation-only metadata. Missing/unknown touch is never treated as a phone.
export function backgroundPresentation(width,height,options={}){
 return {width,height,touch:options.touch===true};
}
export function backgroundCachePolicy(presentation){
 return isMobileLandscapePresentation(presentation)?'finite':'retained';
}
