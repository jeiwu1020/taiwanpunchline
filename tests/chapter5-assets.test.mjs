import test from 'node:test';
import assert from 'node:assert/strict';
import {existsSync,readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {relative,resolve} from 'node:path';
import {chapter5AssetURL} from '../dist/preview/chapter5/chapter5-assets.mjs';
import {ART_FILES} from '../dist/preview/chapter4/art-render.mjs';
import {ASSET_FILES} from '../dist/preview/chapter4/chapter4-assets.mjs';
import {SKY_EXTENSION_FILES,STREET_SEAM_FILES} from '../dist/preview/chapter4/street-backdrop.mjs';
import {CHAPTER4_NEW_ART} from '../dist/preview/chapter4/chapter4-new-art.mjs';
test('chapter five reuses available release assets, including chapter-owned skies and seams',()=>{
 const excluded=new Set(JSON.parse(readFileSync(new URL('../build/asset-release-plan.json',import.meta.url))).exclude.map(a=>a.path));
 for(const file of Object.values({...ART_FILES,...ASSET_FILES,...SKY_EXTENSION_FILES,...STREET_SEAM_FILES,...CHAPTER4_NEW_ART.files})){
  const path=fileURLToPath(chapter5AssetURL(file));assert.ok(existsSync(path),file);assert.equal(excluded.has(relative(resolve('dist'),path)),false,file+' is in release');
 }
});
