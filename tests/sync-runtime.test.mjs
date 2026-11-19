import test from 'node:test';
import assert from 'node:assert/strict';
import {existsSync,mkdtempSync,readFileSync,rmSync,writeFileSync,mkdirSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';
import {syncRuntime} from '../scripts/sync-runtime.mjs';

test('runtime sync prunes stale generated mirrors while retaining canonical sources',t=>{
 const root=mkdtempSync(join(tmpdir(),'punchline-sync-'));
 t.after(()=>{const tempRoot=resolve(tmpdir()),target=resolve(root);assert.ok(target.startsWith(tempRoot+ '\\'));rmSync(target,{recursive:true,force:true});});
 for(const name of ['app-source','dist','release-config','build'])mkdirSync(join(root,name),{recursive:true});
 writeFileSync(join(root,'app-source','keep.txt'),'source');writeFileSync(join(root,'release-config','config.json'),'config');
 writeFileSync(join(root,'dist','keep.txt'),'old');writeFileSync(join(root,'dist','stale.txt'),'stale');
 writeFileSync(join(root,'build','config.json'),'old');writeFileSync(join(root,'build','stale.json'),'stale');
 syncRuntime({rootDir:root,quiet:true});
 assert.equal(readFileSync(join(root,'dist','keep.txt'),'utf8'),'source');assert.equal(existsSync(join(root,'dist','stale.txt')),false);
 assert.equal(readFileSync(join(root,'build','config.json'),'utf8'),'config');assert.equal(existsSync(join(root,'build','stale.json')),false);
 assert.equal(readFileSync(join(root,'app-source','keep.txt'),'utf8'),'source');assert.equal(readFileSync(join(root,'release-config','config.json'),'utf8'),'config');
});
