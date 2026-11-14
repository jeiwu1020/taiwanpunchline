import {CHAPTER4,STEP_IDS,storyFrames,CHARACTER_NAMES,STARTER_IDS} from './chapter4-content.mjs?v=campaign-boot-20261112-r3';
import {createChapter4Route,createChapter4Duel} from './chapter4-engine.mjs?v=street-object-polish-r2';
import {createChapterController} from '../campaign/chapter-controller.mjs?v=campaign-boot-20261112-r3';
export const createPlayableChapter=options=>createChapterController({chapterId:'chapter-4',content:CHAPTER4,stepIds:STEP_IDS,storyFrames,characterNames:CHARACTER_NAMES,defaultUnlocked:STARTER_IDS,unlockId:'ma',nextChapterId:'chapter-5',createRoute:createChapter4Route,createDuel:createChapter4Duel},options);
