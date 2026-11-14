import {CHAPTER2,STEP_IDS,storyFrames,CHARACTER_NAMES} from './chapter2-content.mjs?v=campaign-boot-20261112-r3';
import {createChapter2Route,createChapter2Duel} from './chapter2-engine.mjs?v=street-object-polish-r3';
import {createChapterController} from '../campaign/chapter-controller.mjs?v=campaign-boot-20261112-r3';
export const createPlayableChapter=options=>createChapterController({chapterId:'chapter-3',content:CHAPTER2,stepIds:STEP_IDS,storyFrames,characterNames:CHARACTER_NAMES,defaultUnlocked:['wang','han','huang','su'],unlockId:'ko',nextChapterId:'chapter-4',createRoute:createChapter2Route,createDuel:createChapter2Duel},options);
