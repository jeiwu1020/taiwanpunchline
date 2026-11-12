import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync}from'node:fs';
import{createHash}from'node:crypto';
import {CAST}from'../dist/core.mjs';
import {ART_FILES}from'../dist/art-render.mjs';
const hash=x=>createHash('sha256').update(x).digest('hex');
for(const type of ['su','chen'])test(type+' uses its new V8 portrait in menu and game',()=>{assert.equal(CAST[type].portrait,'assets/'+type+'-head-v8.webp');assert.equal(ART_FILES[type+'-head'],type+'-head-v8.webp');assert.ok(existsSync(new URL('../dist/assets/'+ART_FILES[type+'-head'],import.meta.url)));});
test('approved default portraits and original non-target art assets are retained',()=>{assert.deepEqual(Object.fromEntries(Object.entries(CAST).map(([k,c])=>[k,c.portrait])),{wang:'assets/wang-laugh-head.webp',han:'assets/han-defiant-head.webp',ma:'assets/ma-head-v5.webp',su:'assets/su-head-v8.webp',huang:'assets/huang-head-v5.webp',chen:'assets/chen-head-v8.webp',ko:'assets/ko-head-v6.webp'});assert.deepEqual(Object.fromEntries(Object.entries(ART_FILES).filter(([k,v])=>!['su-head','chen-head','handshake-grip','left-hand-back','right-hand-point'].includes(k)&&!/-v(?:9|10|11)\.webp$/.test(v))),{"opening-pajamas-v75":"challenge/opening-pajamas-v75.png","opening-props-v75":"challenge/opening-props-v75.png","opening-bedroom-v75":"challenge/opening-bedroom-v75.png","ko-head":"ko-head-v6.webp","final-costumes":"final-costumes-v6.webp","ko-bags":"ko-bags-v6.webp","ma-head":"ma-head-v5.webp","huang-head":"huang-head-v5.webp","roster-costumes":"roster-costumes-v5.webp","roster-props":"roster-props-v5.webp","art-limbs":"limbs-v4.webp","wang-parts":"wang-parts-v3.webp","han-parts":"han-parts-v3.webp","left-arms":"left-arms-v3.webp","wang-drink":"wang-drink-v3.webp","wang-sip":"wang-sip-v3.webp","wang-roll":"wang-roll-v3.webp","han-archery":"han-archery-v3.webp","han-release":"han-release-v3.webp","art-props":"props-v3.webp","wang-head":"wang-laugh-head.webp","wang-shock":"wang-shock-head.webp","han-head":"han-defiant-head.webp","han-shock":"han-shock-head.webp"});});
// V10 intentionally redesigns combat and animation; behavioral suites now replace V8 whole-file hash freezes.

test('V13 adds one generated clasp without replacing approved faces',()=>{assert.equal(ART_FILES['handshake-grip'],'handshake-v13.png');assert.ok(existsSync(new URL('../dist/assets/handshake-v13.png',import.meta.url)));});

test('V36 adds dorsal left hand without changing original atlas assets',()=>{assert.equal(ART_FILES['left-hand-back'],'left-hand-back-v36.png');assert.ok(existsSync(new URL('../dist/assets/'+ART_FILES['left-hand-back'],import.meta.url)));});
