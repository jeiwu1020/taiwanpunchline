import {CHAPTER5,STEP_IDS,storyFrames,CHARACTER_NAMES,STARTER_IDS} from './chapter5-content.mjs?v=campaign-boot-20261112-r3';
import {createChapter5Route,createChapter5Duel} from './chapter5-engine.mjs?v=rally-consistency-20261115-r1';
import {createChapterController} from '../campaign/chapter-controller.mjs?v=campaign-state-supply-20261115-r1';
export const createPlayableChapter=options=>createChapterController({chapterId:'chapter-5',content:CHAPTER5,stepIds:STEP_IDS,storyFrames,characterNames:CHARACTER_NAMES,defaultUnlocked:STARTER_IDS,unlockId:'chen',nextChapterId:'finale-3v4',createRoute:createChapter5Route,createDuel:createChapter5Duel},options);
