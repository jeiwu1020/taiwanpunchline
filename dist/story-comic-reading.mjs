import {layoutStoryComic} from './story-comic-layout.mjs?v=chapter-presentation-20261117-r1';

/** Local reading only. Tokens may change while saving without changing a frame. */
export function createComicReadingPosition(){
 let owner=null,segment='',frame=-1,anchor=0,copy='',speaker='旁白',readAsOne=false,sideDialogue=false,wideDialogue=false,width=814,height=294,landing=null;
 function sync(next,nextOwner){
  const nextSegment=`${next?.mode}:${next?.stepId}`,nextFrame=next?.frameIndex??0;
  if(nextOwner!==owner||nextSegment!==segment||nextFrame!==frame){
   anchor=landing&&landing.owner===nextOwner&&landing.segment===nextSegment&&landing.frame===nextFrame?landing.anchor:0;
   landing=null;owner=nextOwner;segment=nextSegment;frame=nextFrame;
  }
  copy=next?.storyFrame?.copy??'';speaker=next?.storyFrame?.speaker??'旁白';readAsOne=next?.storyFrame?.readAsOne===true;sideDialogue=next?.storyFrame?.sideDialogue===true;wideDialogue=next?.storyFrame?.wideDialogue===true;return view();
 }
 const view=()=>layoutStoryComic({width,height,copy,speaker,anchor,readAsOne,sideDialogue,wideDialogue});
 return {sync,view,resize(w,h){width=Math.max(240,w);height=Math.max(width>h*1.35?180:260,h);return view();},
  advance(direction){const l=view(),next=direction<0?l.previousAnchor:l.nextAnchor;if(next===null)return false;anchor=next;return true;},
  reset(){anchor=0;landing=null;},
  landOnPrevious(state,currentOwner){landing={owner:currentOwner,segment:`${state.mode}:${state.stepId}`,frame:state.frameIndex-1,anchor:Infinity};},
  cancelLanding(){landing=null;},
  get sourceOffset(){return anchor;}
 };
}
