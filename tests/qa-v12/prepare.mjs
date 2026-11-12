import {readFileSync,writeFileSync} from 'node:fs';
const html=readFileSync('dist/index.html','utf8');
writeFileSync('dist/name-qa.html',html.replace('game.mjs?v=12','name-qa.mjs').replace('<main class="app">','<button id="qa-finish" style="position:fixed;z-index:999;bottom:0;right:0">QA finish</button><main class="app">'));
writeFileSync('dist/name-qa.mjs',readFileSync('dist/game.mjs','utf8').replace('const ink=0x142b32,paper=0xfff7e5;',"const ink=0x142b32,paper=0xfff7e5;$('#qa-finish').onclick=()=>{duel.enemy.hp=0;duel.finish();result();};"));
writeFileSync('dist/mobile-qa.html','<!doctype html><meta charset="utf-8"><title>320px name check</title><style>body{margin:0;background:#33484c;display:flex;justify-content:center}iframe{border:0;width:320px;height:568px}</style><iframe src="./" title="320px game preview"></iframe>');
