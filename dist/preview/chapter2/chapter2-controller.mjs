import {CHAPTER2,STEP_IDS,storyFrames,CHARACTER_NAMES} from './chapter2-content.mjs?v=campaign-complete-20261112-r1';
import {createChapter2Route,createChapter2Duel} from './chapter2-engine.mjs?v=campaign-complete-20261112-r1';
import {createChapterController} from '../campaign/chapter-controller.mjs?v=campaign-complete-20261112-r1';
export const createPlayableChapter=options=>createChapterController({chapterId:'chapter-2',content:CHAPTER2,stepIds:STEP_IDS,storyFrames,characterNames:CHARACTER_NAMES,defaultUnlocked:['wang','han','huang'],unlockId:'su',nextChapterId:'chapter-3',createRoute:createChapter2Route,createDuel:createChapter2Duel},options);
