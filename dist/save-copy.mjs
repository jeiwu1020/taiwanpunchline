// Presentation only: never reads browser storage and never changes save data.
import {legacySlot,parse} from './preview/campaign/unified/schema.mjs?v=campaign-visuals-20261112-r2';
import {validateDocument} from './preview/campaign/core/model.mjs?v=campaign-visuals-20261112-r2';
const sourceName=source=>({legacy:'原版第一章',campaign:'舊版後續章節',new:'新建立的冒險'})[source]??'選定來源';
const slotName=id=>/^slot-[123]$/.test(id)?`存檔 ${id.slice(-1)}`:'這個存檔';
function summary(info,source){
 let profile=null;
 if(source==='legacy'||source==='new'){const parsed=legacySlot(info.evidence?.legacyRaw??null,info.profileId);if(parsed.ok)profile=parsed.profile;}
 else {const parsed=validateDocument(parse(info.evidence?.campaignRaw));if(parsed.ok)profile=parsed.document.profiles.find(p=>p.id===info.profileId);}
 if(!profile)return '進度摘要暫時無法讀取';
 const c=profile.campaign,chapter=/^chapter-([1-5])$/.exec(c.cursor.chapterId)?.[1];
 return `${c.xp} XP・${chapter?`第 ${chapter} 章`:'終章'}・${profile.unlockedCharacters.length} 位角色`;
}
export function chooseAdoptionSource(window,info){
 const choices=info.choices??[],lines=choices.map((source,i)=>`${i+1}. ${sourceName(source)}：${summary(info,source)}`);
 const answer=window.prompt(`${slotName(info.profileId)} 有兩份可接續進度，請選擇保留哪一份完整進度：\n${lines.join('\n')}\n\n請輸入選項數字。兩份原始資料都會保留，不會混合經驗或配點。取消或留白不變更。`,'');
 if(typeof answer!=='string'||!/^\d+$/.test(answer.trim()))return null;
 const n=Number(answer.trim());return Number.isInteger(n)&&n>=1&&n<=choices.length?choices[n-1]:null;
}
export function adoptionConfirmation(info){
 return `採用${slotName(info.profileId)}的${sourceName(info.source)}整槽進度？會保留原始資料備份；此後此槽的挑戰、對戰及訓練共用解鎖。其他存檔不變。請先關閉其他舊版遊戲分頁，以免舊頁繼續寫入另一份進度。`;
}
export function saveIssueText(reason){
 if(['source-changed','legacy-source-changed','legacy-source-conflict','stale-run','stale-revision','revision-conflict','profile-changed'].includes(reason))return '另一個分頁或存檔來源已變更，這次沒有覆蓋新的資料。請保留此頁並匯出備份，再關閉其他遊戲分頁後重新確認。';
 if(['storage-unavailable','storage-write-failed','write-failed','quota-exceeded','readback-mismatch','backup-write-failed','backup-failed'].includes(reason))return '尚未保存，無法確認資料寫入成功。請保留此頁並匯出備份，檢查瀏覽器可用空間後再重試。';
 if(['unsupported-envelope','invalid-envelope','unsupported-legacy-save','unsupported-campaign-save','invalid-backup','invalid-json','unsupported-backup'].includes(reason))return '存檔版本或內容無法安全讀取，原始資料保留。請先匯出備份，勿清除瀏覽器資料。';
 if(reason==='content-locked')return '第五章尚未開放，已到達的檢查點會保留。';
 if(['chapter-1-incomplete','first-chapter-required'].includes(reason))return '這個存檔尚未完成第一章，請先回主頁通關。';
 if(reason==='cancelled')return '已取消，原資料不變。';
 return '尚未確認保存，請保留此頁並匯出備份。原始存檔保留，確認原因後再重試，勿清除瀏覽器資料。';
}
