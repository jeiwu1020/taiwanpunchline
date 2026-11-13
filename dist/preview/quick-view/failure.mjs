export const ISOLATION_FAILURE='無法安全隔離存檔，快速看關已停止。原存檔未讀取或變更。請按「進入／重看」重試，或離開快速看關。';
export function showIsolationFailure({frame,status},source){
 if(source!==frame.contentWindow)return false;
 frame.hidden=true;
 status.textContent=ISOLATION_FAILURE;
 status.setAttribute('role','alert');
 status.dataset.failure='true';
 return true;
}
