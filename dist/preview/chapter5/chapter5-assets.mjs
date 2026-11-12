import {chapterAssetURL} from '../shared-asset-urls.mjs?v=campaign-visuals-20261112-r2';
// Chapter-owned scenery stays here. Existing fighters, limbs and the incoming
// chapter-four truck keep their canonical assets and remain byte-identical.
export const chapter5AssetURL=file=>file.startsWith('chapter5/')?new URL('./assets/'+file,import.meta.url).href:new URL(chapterAssetURL('chapter4',file),new URL('../chapter4/',import.meta.url)).href;
