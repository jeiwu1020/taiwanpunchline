import test from 'node:test';
import assert from 'node:assert/strict';
import {rosterMotion} from '../dist/art-roster-motion.mjs';
import {MOVE_VISUALS} from '../dist/art-expression.mjs';
const keys=['ma_handshake','ma_gaze','ma_cough','su_shout','su_rush','su_dare','huang_shout','huang_debt','huang_queue','chen_dream','chen_question','chen_calm','ko_bags','ko_name','ko_resolve'];
for(const key of keys)test(key+' has a finite, bounded distinct signature pose and visual entry',()=>{
 assert.ok(MOVE_VISUALS[key]?.label);
 for(const t of [0,.08,.18,.28,.42,.62,.82,1.1]){const p=rosterMotion(key,t);assert.ok(p);for(const w of [p.wrist,p.farW])assert.ok(Number.isFinite(w.x)&&Number.isFinite(w.y)&&Math.abs(w.x)<130&&w.y>-220&&w.y<-65);assert.ok(Number.isFinite(p.drop));}
});
test('cough covers mouth twice rather than standing as a counter',()=>{const a=rosterMotion('ma_cough',.24),b=rosterMotion('ma_cough',.47);assert.equal(a.hand,'cough');assert.ok(a.wrist.y>-175&&a.wrist.y<-158&&b.wrist.y>-175&&b.wrist.y<-158);assert.ok(a.drop>0);});
test('debt and queue show the near right hand back while dare beckons',()=>{const d=rosterMotion('huang_debt',.3);assert.equal(d.hand,'back-right');assert.equal(d.farHand,'back-left');assert.equal(rosterMotion('huang_queue',.3).hand,'back-right');assert.equal(rosterMotion('su_dare',.3).hand,'beckon');});
test('dream releases plane from raised hand while question alternates hands',()=>{assert.equal(rosterMotion('chen_dream',.2).farHand,'plane');assert.notDeepEqual(rosterMotion('chen_question',.22).wrist,rosterMotion('chen_question',.45).wrist);});
test('resolve uses grounded fists distinct from name calling',()=>{const a=rosterMotion('ko_resolve',.4),b=rosterMotion('ko_name',.4);assert.equal(a.hand,'fist');assert.ok(a.drop>0);assert.notDeepEqual(a.wrist,b.wrist);});

test('dream remains raised through release into the V13 high trajectory',()=>{const raised=rosterMotion('chen_dream',.22),release=rosterMotion('chen_dream',.299);assert.ok(raised.farW.y<-165);assert.ok(release.farW.y>-220&&release.farW.y<-205);});
