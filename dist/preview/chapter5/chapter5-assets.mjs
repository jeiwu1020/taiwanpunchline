import {chapterAssetURL} from '../shared-asset-urls.mjs?v=campaign-complete-20261112-r1';
// Resolve the retained fourth-chapter artwork against its owner page. Shared
// aliases still resolve to canonical root assets in the Workers release.
export const chapter5AssetURL=file=>new URL(chapterAssetURL('chapter4',file),new URL('../chapter4/',import.meta.url)).href;
