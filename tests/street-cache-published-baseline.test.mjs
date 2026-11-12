import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';

// Release contract: preserve the published #67 cache, including partial-band
// painting. This digest was derived from git show at the published commit,
// replacing only its three ?v=post66-mobile-landscape-20261111-r3 import tokens.
// It is deliberately independent of the current renderer and version helper.
const publishedCommit='806f00c3f16d51708c7bd52f4da8ca57825f7b89';
const publishedCacheSha256='dcff84704a5249a4c85bd6fb1566d252ef40c092825ad73131d52cf0a9787867';

test('street cache preserves published allocation policy except approved continuous partial paint',()=>{
 const source=readFileSync(new URL('../dist/challenge-backdrop-cache.mjs',import.meta.url),'utf8');
 let imports=0;
 const approved=source.replace(`  // Partial rows share one continuous dynamic facade. Separate band clips or
  // cached/pending joins can expose the sky at fractional projected edges.
  if(!ready){for(const display of displays)display.setVisible(false);return false;}
`, '').replace('ctx.save();ctx.translate(bg.camera,0);drawChallengeBackdrop(ctx,images,{...bg,facadeOnly:true});ctx.restore();return true;', 'ctx.save();ctx.translate(bg.camera,0);for(const band of pendingBands)drawChallengeBackdrop(ctx,images,{...bg,top:band.top,bottom:band.bottom,height:band.bottom-band.top,facadeOnly:true});ctx.restore();return true;');
 const normalized=approved.replace(/^import (\{[^}\r\n]+\}) from '\.\/(background-cache-policy|street-seam-repair|challenge-art)\.mjs\?v=[^'\r\n]+';$/gm,(_,symbols,module)=>{
  imports++;
  return `import ${symbols} from './${module}.mjs?v=<runtime>';`;
 });
 assert.equal(imports,3,'normalize only the three published runtime imports');
 assert.equal(createHash('sha256').update(normalized).digest('hex'),publishedCacheSha256,
  `cache must remain byte-equivalent to published ${publishedCommit} after import-token normalization`);
});
