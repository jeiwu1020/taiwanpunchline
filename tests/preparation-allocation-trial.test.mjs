import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {JSDOM} from 'jsdom';
import {CHALLENGE_KEY} from '../dist/preview/campaign/fresh/progress.mjs';
import {preparationFixture,preparationSizes,injectPreparationCSS,cssAt,flush} from './helpers/preparation-allocation-fixture.mjs';

// Regression: large reference panels must not precede the first useful rank action.
test('allocation is visible while ability and move references start collapsed on the same page',async t=>{
 const f=await preparationFixture(t),action=f.q('[data-skill="hp"][data-delta="1"]');
 assert.ok(action&&!action.disabled);assert.equal(action.closest('details'),null);
 for(const kind of ['ability','moves']){const ref=f.q(`[data-preparation-reference="${kind}"]`);assert.ok(ref,'a labeled native disclosure is required');assert.equal(ref.open,false);assert.equal(ref.firstElementChild.tagName,'SUMMARY');assert.ok(action.compareDocumentPosition(ref)&f.w.Node.DOCUMENT_POSITION_FOLLOWING);}
 assert.equal(f.q('.challenge-chart').closest('details').dataset.preparationReference,'ability');
 assert.equal(f.q('.ability-moves').closest('details').dataset.preparationReference,'moves');
 assert.match(f.q('.challenge-chart').textContent,/天生.*已保存.*草稿/s);
});
// Regression: render-on-plus used to replace all nodes and lose interaction state.
test('expansion, inspection, scroll and focus survive rank edits, depletion and reset',async t=>{
 const f=await preparationFixture(t);f.change('preparationInspect','han');
 assert.ok(f.q('[data-preparation-reference="ability"]'),'reference disclosure missing');f.q('[data-preparation-reference="ability"]').open=true;f.q('[data-preparation-reference="moves"]').open=false;f.q('.challenge-preparation-panel').scrollTop=123;
 f.q('[data-skill="hp"][data-delta="1"]').click();
 assert.equal(f.id('preparationInspect').value,'han');assert.equal(f.id('preparationMain').value,'wang');assert.equal(f.q('[data-preparation-reference="ability"]').open,true);assert.equal(f.q('[data-preparation-reference="moves"]').open,false);assert.equal(f.q('.challenge-preparation-panel').scrollTop,123);assert.equal(f.d.activeElement.dataset.skill,'hp');
 f.q('[data-preparation-reference="ability"]').open=false;f.q('[data-preparation-reference="moves"]').open=true;f.q('[data-skill="basic"][data-delta="1"]').click();
 assert.equal(f.q('[data-preparation-reference="ability"]').open,false);assert.equal(f.q('[data-preparation-reference="moves"]').open,true);assert.equal(f.q('[data-skill="special"][data-delta="1"]').disabled,true);
 f.id('preparationReset').click();assert.equal(f.q('[data-preparation-reference="moves"]').open,true);assert.equal(f.q('[data-skill="special"][data-delta="1"]').disabled,false);assert.equal(f.writes.length,0);
});
test('collapsed draft cancel and switching away from preparation never write',async t=>{
 const f=await preparationFixture(t),before=f.raw();f.q('[data-skill="hp"][data-delta="1"]').click();f.id('preparationCancel').click();assert.equal(f.raw(),before);assert.equal(f.writes.length,0);
 f.ui.open({view:'preparation',characterId:'han'});f.q('[data-skill="hp"][data-delta="1"]').click();f.ui.element.querySelector('[data-view="save"]').click();assert.equal(f.ui.element.dataset.view,'save');assert.equal(f.raw(),before);assert.equal(f.writes.length,0);
 f.ui.element.querySelector('[data-view="preparation"]').click();assert.match(f.q('[data-skill-card="hp"] b').textContent,/0/);
});
test('active-fight readonly opens ability and moves before saved ranks with focus on reference',async t=>{
 const f=await preparationFixture(t,{readOnly:true,standalone:true}),ability=f.q('[data-preparation-reference="ability"]'),moves=f.q('[data-preparation-reference="moves"]'),tree=f.q('.ability-build');
 assert.equal(ability.open,true,'readonly is for reading actual capabilities, not allocation');assert.equal(moves.open,true);assert.ok(ability.compareDocumentPosition(tree)&f.w.Node.DOCUMENT_POSITION_FOLLOWING);assert.ok(moves.compareDocumentPosition(tree)&f.w.Node.DOCUMENT_POSITION_FOLLOWING);assert.equal(f.d.activeElement,ability.querySelector('summary'));assert.equal(f.q('[data-skill]'),null);
 ability.open=false;f.change('preparationInspect','wang');assert.equal(f.q('[data-preparation-reference="ability"]').open,false);assert.equal(f.q('[data-preparation-reference="moves"]').open,true);assert.equal(f.writes.length,0);
});
test('confirm persists one authoritative v4 write and readonly cannot mutate',async t=>{
 const f=await preparationFixture(t);f.q('[data-skill="hp"][data-delta="1"]').click();assert.equal(f.writes.length,0);f.id('preparationConfirm').click();f.id('preparationConfirm').click();await flush();await flush();assert.equal(f.writes.filter(x=>x.key===CHALLENGE_KEY).length,1);assert.equal(f.controller.readProfile().characters.han.skills.hp,1);
 const ro=await preparationFixture(t,{readOnly:true,standalone:true}),before=ro.raw();ro.change('preparationInspect','wang');assert.equal(ro.q('[data-skill]'),null);assert.equal(ro.id('preparationConfirm').hidden,true);ro.id('preparationConfirm').click();assert.equal(ro.raw(),before);assert.equal(ro.writes.length,0);
});
for(const size of preparationSizes)test(`one block scroller and 44px controls at ${size.name}`,async t=>{
 const f=await preparationFixture(t,{size}),style=injectPreparationCSS(f);
 assert.equal(style('.challenge-preparation-panel').display,'block','outer dialog grid must not leak into nested paper');assert.equal(style('.challenge-preparation-panel').overflowY,'auto');
 assert.equal(style(f.ui.element.querySelector('.challenge-shell-body')).overflow,'hidden');
 assert.notEqual(style('.preparation-inspection').alignItems,'end');
 for(const control of f.q('.challenge-preparation-panel').querySelectorAll('[data-skill],summary')){assert.ok(parseFloat(style(control).minHeight)>=44);if(control.matches('[data-skill]'))assert.ok(parseFloat(style(control).minWidth)>=44);}
 assert.notEqual(style('.ability-rank-actions')['grid-template-columns'],'44px 1fr 44px','exhausted reason must not be squeezed between two buttons');
});
// The actual 844×390 browser sample clipped the first pair by 12.5px. The
// identity badge must share the points row at wide logical container sizes.
for(const rotation of [0,90,-90])test(`wide allocation heading keeps badge and points in one row (${rotation})`,async t=>{
 const size=rotation?{...preparationSizes[3],rotation}:preparationSizes[2],f=await preparationFixture(t,{size}),style=injectPreparationCSS(f),heading=f.q('.preparation-allocation-heading');
 assert.ok(heading,'identity and remaining points need a shared layout row before the first rank pair');assert.ok(heading.querySelector('h4'));assert.ok(heading.querySelector('.challenge-tree-root'));assert.equal(style(heading).display,'flex');assert.equal(style(heading).flexWrap,'nowrap');assert.equal(style('.challenge-tree-root').margin,'0px');
});
for(const containerWidth of [679,680,681])test(`setup and heading breakpoint uses real ${containerWidth}px container, not viewport minus a gutter`,async t=>{
 const f=await preparationFixture(t,{size:{...preparationSizes[2],containerWidth}}),style=injectPreparationCSS(f);
 assert.equal(style('.preparation-setup').gridTemplateColumns,containerWidth<680?'':'minmax(0,1fr) minmax(0,1fr)');
 const heading=f.q('.preparation-allocation-heading');assert.ok(heading);assert.equal(style(heading).display,containerWidth<680?'block':'flex');
});
test('equal logical native and either sideways direction select identical preparation declarations',async t=>{
 const native=await preparationFixture(t,{size:preparationSizes[2]}),a=injectPreparationCSS(native);
 const selectors=['.preparation-setup','.preparation-allocation-heading','.challenge-preparation-panel','.preparation-inspection','.challenge-chart','.ability-radar-note','.ability-stats','.challenge-bio','.challenge-bio img','.challenge-bio h3','.challenge-branches','.challenge-node','.challenge-node b'];
 const properties=['display','grid-template-columns','grid-column','grid-row','order','align-items','gap','padding','margin','font-size','width','height','position'];
 for(const rotation of [90,-90]){const side=await preparationFixture(t,{size:{...preparationSizes[3],rotation}}),b=injectPreparationCSS(side);for(const selector of selectors)for(const prop of properties)assert.equal(b(selector).getPropertyValue(prop),a(selector).getPropertyValue(prop),`${rotation} ${selector} ${prop}`);}
});
for(const chapter of [1,2,3,4])test(`chapter ${chapter} soft controls preserve opaque labels, targets and feedback`,t=>{
 const url=new URL(chapter===1?'../dist/index.html':`../dist/preview/chapter${chapter}/index.html`,import.meta.url),html=readFileSync(url,'utf8');
 const dom=new JSDOM(html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/g,'').replace(/<link\b[^>]*>/g,'')),d=dom.window.document,app=d.querySelector(chapter===1?'.app':'#trial-app');t.after(()=>dom.window.close());
 Object.assign(app.dataset,{touch:'true',layout:'landscape',overlayControls:'true',depthRoute:'true',controlOverlay:'soft'});
 const style=d.createElement('style');style.textContent=[...html.matchAll(/<link[^>]+href="([^"?]+\.css)(?:\?[^\"]*)?"/g)].map(m=>cssAt(readFileSync(new URL(m[1],url),'utf8'),preparationSizes[2])).join('\n');d.head.append(style);
 const get=el=>dom.window.getComputedStyle(el),punch=app.querySelector('.punch'),guard=app.querySelector('[data-hold="guard"]'),special=app.querySelector('.specials button'),stick=app.querySelector('#touch-stick');
 for(const el of [punch,guard,special,stick]){assert.equal(get(el).opacity||'1','1');assert.match(get(el).background,/rgba\(|#[0-9a-f]{8}|var\(--soft/,'soft fills must contain alpha instead of dimming the whole control');}
 assert.equal(get(app.querySelector('.stick-cross')).color,'rgb(23, 53, 58)');assert.equal(get(guard.querySelector('.guard-hint')).opacity,'1');
 const normal=get(punch).background;punch.classList.add('key-pressed');assert.notEqual(get(punch).background,normal,'pressed state must remain distinct');special.classList.add('cooling');assert.match(get(special).background,/cooldown-ready/);
 app.dataset.controlOverlay='normal';assert.notEqual(get(punch).background,normal,'soft styling must be gated by the shared profile');
});

// Literal logical measurements from the independent native844 browser run.
// Guarding only declared 44px dimensions missed the 12.5px footer overlap.
test('browser geometry gate rejects full-size buttons clipped by the fixed footer',async()=>{
 const {firstRankPairVisibility,assertInitialRankPair}=await import('./qa-preparation-allocation/geometry-checks.mjs');
 const measurement={panel:{rect:{left:4,top:66,right:824,bottom:308},scrollTop:0},footer:{top:308},firstPair:[{left:292,top:275,right:336,bottom:320.5,width:44,height:45.5},{left:344,top:275,right:388,bottom:320.5,width:44,height:45.5}]};
 const result=firstRankPairVisibility(measurement);assert.equal(result.fullyVisible,false);assert.deepEqual(result.targets.map(t=>t.visibleHeight),[33,33]);assert.ok(result.targets.every(t=>t.minimumSize));assert.throws(()=>assertInitialRankPair(measurement),/both complete 44px rank targets/);
});
test('browser geometry gate requires a complete pair at initial scroll, not merely one visible button',async()=>{
 const {assertInitialRankPair}=await import('./qa-preparation-allocation/geometry-checks.mjs');
 const measurement={panel:{rect:{left:4,top:66,right:824,bottom:308},scrollTop:0},footer:{top:308},firstPair:[{left:292,top:250,right:336,bottom:295.5,width:44,height:45.5},{left:344,top:250,right:388,bottom:295.5,width:44,height:45.5}]};
 assert.equal(assertInitialRankPair(measurement).fullyVisible,true);assert.throws(()=>assertInitialRankPair({...measurement,firstPair:measurement.firstPair.slice(0,1)}));assert.throws(()=>assertInitialRankPair({...measurement,panel:{...measurement.panel,scrollTop:50}}));
});
