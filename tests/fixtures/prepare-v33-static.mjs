// Optional visual-only fixture for the official Sites preview. Never publish its files.
import {readFileSync,writeFileSync} from 'node:fs';
const root=new URL('../../',import.meta.url),read=p=>readFileSync(new URL(p,root),'utf8'),write=(p,s)=>writeFileSync(new URL(p,root),s);
write('dist/qa-v33-static.local.html',read('tests/fixtures/qa-v33-static.html'));
write('dist/qa-v33-scene.local.mjs',read('tests/fixtures/qa-v33-scene.mjs'));
write('dist/qa-v33-scene.local.html',read('dist/index.html').replace('<script src="vendor/phaser.min.js"></script>','').replace(/<script type="module" src="game\.mjs\?v=\d+"><\/script>/,'<script type="module" src="qa-v33-scene.local.mjs"></script>'));
console.log('Temporary static fixture prepared. Delete all three dist/qa-v33-*.local* files before packaging.');
