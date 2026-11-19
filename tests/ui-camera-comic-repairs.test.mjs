import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { JSDOM } from 'jsdom';
import { drawBubble } from '../dist/starter-comic-layout.mjs';
import { layoutStoryComic } from '../dist/story-comic-layout.mjs';
import { storyComicScene } from '../dist/story-comic-scenes.mjs';
import { comicActorGeometry } from '../dist/preview/campaign/story-comic-art.mjs';
import { routeCameraFrame } from '../dist/challenge-render.mjs';
import { depthRouteCameraFrame } from '../dist/challenge-depth-render.mjs';
import { mountChapterLoadingOverlay } from '../dist/chapter-unified-presentation.mjs';
import { mountChallengeUI } from '../dist/challenge-ui.mjs';
import { CAST } from '../dist/roster.mjs';
import { stylesAt } from './helpers/css-contracts.mjs';

function traceBubbleOps(bubble, font = 24) {
  const ops = [];
  const ctx = {
    save() { ops.push(['save']); },
    restore() { ops.push(['restore']); },
    beginPath() { ops.push(['beginPath']); },
    closePath() { ops.push(['closePath']); },
    roundRect(...args) { ops.push(['roundRect', ...args]); },
    moveTo(x, y) { ops.push(['moveTo', x, y]); },
    lineTo(x, y) { ops.push(['lineTo', x, y]); },
    arcTo(...args) { ops.push(['arcTo', ...args]); },
    fill() { ops.push(['fill']); },
    stroke() { ops.push(['stroke']); },
    fillRect(...args) { ops.push(['fillRect', ...args]); },
    fillText(...args) { ops.push(['fillText', ...args]); }
  };
  drawBubble(ctx, bubble, font);
  return ops;
}

test('drawBubble traces one unified closed bubble-and-tail contour anchored on flat bottom inside corner radii', () => {
  const leftBubble = { x: 20, y: 14, width: 300, height: 96, tailSide: 'left', kind: 'dialogue', speaker: '恰吉王', lines: ['把麥還來！'], index: 0 };
  const ops = traceBubbleOps(leftBubble);
  const fills = ops.filter(op => op[0] === 'fill');
  const strokes = ops.filter(op => op[0] === 'stroke');
  const fillRects = ops.filter(op => op[0] === 'fillRect');
  assert.equal(fills.length, 1, 'left dialogue bubble draws one unified fill');
  assert.equal(strokes.length, 1, 'left dialogue bubble draws one unified stroke');
  assert.equal(fillRects.length, 0, 'unified contour needs no fillRect seam patch');
  assert.equal(ops.filter(op => op[0] === 'closePath').length, 1);

  const lineTos = ops.filter(op => op[0] === 'lineTo').map(op => ({ x: op[1], y: op[2] }));
  const bottomY = leftBubble.y + leftBubble.height;
  const corner = 22;
  const tailTip = lineTos.find(pt => pt.y === bottomY + 12);
  assert.ok(tailTip, 'tail tip extends below bubble bottom');
  const tipIdx = lineTos.indexOf(tailTip);
  const tailRight = lineTos[tipIdx - 1];
  const tailLeft = lineTos[tipIdx + 1];
  assert.equal(tailRight.y, bottomY);
  assert.equal(tailLeft.y, bottomY);
  assert.ok(tailLeft.x >= leftBubble.x + corner + 4, `left tailLeft=${tailLeft.x} must sit on flat bottom inside left corner (${leftBubble.x + corner + 4})`);
  assert.ok(tailRight.x - tailLeft.x >= 18, 'tail base width preserved');

  const rightBubble = { ...leftBubble, x: 400, tailSide: 'right' };
  const rightOps = traceBubbleOps(rightBubble);
  const rightLines = rightOps.filter(op => op[0] === 'lineTo').map(op => ({ x: op[1], y: op[2] }));
  const rTipIdx = rightLines.findIndex(pt => pt.y === bottomY + 12);
  const rRight = rightLines[rTipIdx - 1];
  const rLeft = rightLines[rTipIdx + 1];
  assert.ok(rRight.x <= rightBubble.x + rightBubble.width - corner - 4, `right tailRight=${rRight.x} stays on flat bottom inside right corner`);
  assert.ok(rLeft.x > rightBubble.x + rightBubble.width * 0.6);

  const broadcastOps = traceBubbleOps({ ...leftBubble, kind: 'broadcast', speaker: '旁白' });
  assert.equal(broadcastOps.filter(op => op[0] === 'roundRect').length, 1, 'broadcast keeps rectangular bubble without tail');
});

test('comic actor size stays constant across short vs long lines and left vs right speaker switches', () => {
  const shortLeft = '恰吉王：「出發。」';
  const longRight = '電火球：「這支神麥上面貼滿了我們巡迴的路線圖，大家跟緊了！」';
  const twoTurnCopy = `${shortLeft}${longRight}`;

  // 1. Portrait (390x700): both beats & single short vs long panel preserve art height & actor height
  const pTurn0 = layoutStoryComic({ width: 390, height: 700, copy: shortLeft, anchor: 0 });
  const pTurn1 = layoutStoryComic({ width: 390, height: 700, copy: longRight, anchor: 0 });
  assert.equal(pTurn0.art.y, pTurn1.art.y, 'portrait art top stays locked across short vs long dialogue');
  assert.equal(pTurn0.art.height, pTurn1.art.height, 'portrait art height stays locked across short vs long dialogue');

  const stateBase = { mode: 'story', stepId: 'entry', characterId: 'wang', frameIndex: 0 };
  const scene0 = storyComicScene('chapter-2', { ...stateBase, storyFrame: { speaker: '恰吉王', title: 't', copy: twoTurnCopy } });
  const scene1 = storyComicScene('chapter-2', { ...stateBase, frameIndex: 1, storyFrame: { speaker: '電火球', title: 't', copy: twoTurnCopy } });

  // 2. Landscape (960x540 & compact 844x300): actors never resize when speakers alternate or line count changes
  for (const [w, h] of [[960, 540], [844, 300]]) {
    const lShort = layoutStoryComic({ width: w, height: h, copy: shortLeft, anchor: 0 });
    const lLong = layoutStoryComic({ width: w, height: h, copy: longRight, anchor: 0 });
    const actorsShort = comicActorGeometry(scene0, lShort, { time: 0, reducedMotion: true });
    const actorsLong = comicActorGeometry(scene0, lLong, { time: 0, reducedMotion: true });
    assert.ok(Math.abs(actorsShort[0].height - actorsLong[0].height) < 1e-6, `${w}x${h} lead actor height must not jump between 1-line and 2-line beats`);
    if (actorsShort[1] && actorsLong[1]) {
      assert.ok(Math.abs(actorsShort[1].height - actorsLong[1].height) < 1e-6, `${w}x${h} second actor height must stay locked`);
    }

    const lMix0 = layoutStoryComic({ width: w, height: h, copy: twoTurnCopy, anchor: 0 });
    const lMix1 = layoutStoryComic({ width: w, height: h, copy: twoTurnCopy, anchor: shortLeft.length });
    const mixActors0 = comicActorGeometry(scene0, lMix0, { time: 0, reducedMotion: true });
    const mixActors1 = comicActorGeometry(scene1, lMix1, { time: 0, reducedMotion: true });
    const heights0 = mixActors0.map(a => a.height).sort((a, b) => a - b);
    const heights1 = mixActors1.map(a => a.height).sort((a, b) => a - b);
    for (let i = 0; i < heights0.length; i++) {
      assert.ok(Math.abs(heights0[i] - heights1[i]) < 1e-6, `${w}x${h} speaker swap cannot resize actors (${heights0[i]} vs ${heights1[i]})`);
    }
  }
});

test('desktop Chapter 1 street dynamic camera forwards previous/delta and prevents frame-to-frame jitter', () => {
  const nov11 = JSON.parse(readFileSync(new URL('./fixtures/shared-camera-measured-nov11.json', import.meta.url), 'utf8')).profiles['desktop-street'];
  const route = {
    depthMode: true,
    worldWidth: 3600,
    player: { x: 400, y: 430, depth: -90, vy: 0, supportY: 430, hp: 100 },
    enemy: { x: 760, y: 430, depth: 95, vy: 0, supportY: 430, hp: 100, spec: { range: 180 } },
    enemies: [],
    assists: [],
    section: { spawns: [] },
    spawned: new Set()
  };
  route.enemies = [route.enemy];

  const baseOpts = {
    ...nov11.cameraSafety,
    fullStage: true,
    touch: false,
    portrait: false,
    landscapePreview: true,
    camera: 'classic',
    delta: 16.7
  };

  let prevRoute = null;
  let prevDirect = null;
  for (let i = 0; i < 180; i++) {
    route.player.x += 3.2;
    route.player.depth = Math.sin(i * 0.09) * 90;
    route.enemy.depth = -Math.sin(i * 0.09) * 90;
    if (i >= 70 && i < 115) { route.player.supportY = 340; route.player.y = 340; }
    else { route.player.supportY = 430; route.player.y = 430; }

    const nextRoute = routeCameraFrame(1280, 720, route, { ...baseOpts, previous: prevRoute });
    const nextDirect = depthRouteCameraFrame(1280, 720, route, { ...baseOpts, previous: prevDirect });
    assert.deepEqual(nextRoute, nextDirect, `frame ${i}: routeCameraFrame must forward previous and delta identically`);

    if (prevRoute) {
      const dxPx = Math.abs((nextRoute.x - prevRoute.x) * nextRoute.zoom);
      const dyPx = Math.abs((nextRoute.y - prevRoute.y) * nextRoute.zoom);
      const dz = Math.abs(nextRoute.zoom - prevRoute.zoom);
      assert.ok(dxPx <= 12, `frame ${i}: desktop classic street x jumped ${dxPx}px`);
      assert.ok(dyPx <= 10, `frame ${i}: desktop classic street y jumped ${dyPx}px`);
      assert.ok(dz <= 0.025, `frame ${i}: desktop classic street zoom jumped ${dz}`);
    }
    prevRoute = nextRoute;
    prevDirect = nextDirect;
  }
});

test('chapters 2-5 loading transition uses crisp backdrop without blur flashes and defers setReady until first painted frame', () => {
  const dom = new JSDOM('<!doctype html><html><head></head><body><main id="trial-app"><canvas id="stage"></canvas></main></body></html>', { url: 'https://test.local/' });
  const overlay = mountChapterLoadingOverlay({ document: dom.window.document, chapter: 2, backdropUrl: 'assets/chapter2-scene-1.webp' });
  const cssText = dom.window.document.getElementById('chapter-loading-overlay-style').textContent;

  const backdropRule = cssText.match(/\.chapter-loading-backdrop\s*\{[^}]*\}/)?.[0] || '';
  const scrimRule = cssText.match(/\.chapter-loading-scrim\s*\{[^}]*\}/)?.[0] || '';
  assert.doesNotMatch(backdropRule, /blur\(/, 'backdrop removes heavy blur flash');
  assert.doesNotMatch(scrimRule, /blur\(/, 'scrim removes heavy backdrop blur');
  assert.match(backdropRule, /transition:\s*opacity/);
  overlay.destroy();
  dom.window.close();

  const chapterUiCss = readFileSync(new URL('../dist/preview/campaign/chapter-ui.css', import.meta.url), 'utf8');
  assert.doesNotMatch(chapterUiCss, /#trial-app::before\{[^}]*linear-gradient\(/, 'pre-JS veil uses smooth dark vignette without bright gradient flash');

  for (const [label, relPath] of [
    ['chapter2', '../dist/preview/chapter2/chapter2-playable.mjs'],
    ['chapter3', '../dist/preview/chapter3/chapter2-playable.mjs'],
    ['chapter4', '../dist/preview/chapter4/chapter4-playable.mjs'],
    ['chapter5', '../dist/preview/chapter5/chapter5-playable.mjs']
  ]) {
    const src = readFileSync(new URL(relPath, import.meta.url), 'utf8');
    assert.match(src, /targetSceneIndex=routeIndex\(state\)/, `${label} resolves dynamic targetSceneIndex for backdrop`);
    assert.match(src, /loadingOverlay\.setBackdrop\?\.\(/, `${label} updates loading backdrop before reveal`);
    assert.match(src, /ui\.paintFrame\(paintToken\);if\(pendingReveal&&!overlayRevealed\)\{overlayRevealed=true;loadingOverlay\.setReady\(\);\}/, `${label} reveals overlay only after canvas paints first frame`);
  }
});

test('mobile landscape challenge overview does not clip review-opening and supports touch scrolling across buttons & header', () => {
  const css = readFileSync(new URL('../dist/challenge.css', import.meta.url), 'utf8');
  const chapterRules = stylesAt(css, ['.challenge-chapter', '.challenge-overview-v4 .challenge-chapter'], { width: 844, height: 390 });
  assert.equal(chapterRules.overflow, 'visible');

  const reviewBtn = stylesAt(css, ['.challenge-overview-v4[data-compact="true"][data-layout="landscape"][data-view="chapter"] [data-action="review-opening"]'], { width: 844, height: 390 });
  assert.equal(reviewBtn['min-height'], '36px');
  assert.equal(reviewBtn['grid-column'], '1/-1');

  const rotatedChild = stylesAt(css, ['.challenge-dialog button', '.challenge-dialog[data-rotation="90"] .challenge-paper *'], { width: 390, height: 844 });
  assert.equal(rotatedChild['touch-action'], 'none');

  const unrotatedBtn = stylesAt(css, ['.challenge-dialog button', '.challenge-overview-v4:not([data-rotation="90"]):not([data-rotation="-90"]) .challenge-shell-body button'], { width: 844, height: 390 });
  assert.equal(unrotatedBtn['touch-action'], 'pan-y');

  for (const rotation of [90, -90]) {
    const dom = new JSDOM('<div id="viewport-shell"><main class="app"></main></div>', { url: 'https://test.local/', pretendToBeVisual: true });
    const w = dom.window, d = w.document, app = d.querySelector('.app');
    app.style.width = '844px'; app.style.height = '390px'; app.dataset.rotation = String(rotation);
    w.HTMLDialogElement.prototype.showModal = function() { this.open = true; };
    w.HTMLDialogElement.prototype.close = function() { this.open = false; };
    const snapshot = { profileId: 'slot-1', revision: 1, generation: 0, initialized: true, characterId: 'wang', helperId: 'han', difficulty: 'easy', allowance: 3, characters: { wang: { skills: {} }, han: { skills: {} } }, unlockedCharacters: ['wang', 'han'] };
    const controller = {
      get: () => ({ activeProfileId: 'slot-1', initialized: true, persisted: true, revision: 1, generation: 0 }),
      readProfile: () => ({ characters: snapshot.characters, unlockedCharacters: ['wang', 'han'], campaign: { xp: 0, chapterClears: ['chapter-1'], cursor: { chapterId: 'chapter-1', stepId: 'entry' }, selection: { characterId: 'wang', helperId: 'han' }, difficulty: 'easy' } })
    };
    const ui = mountChallengeUI({ controller, characters: CAST, parent: app, onReview: () => {} });
    ui.open({ view: 'chapter' });
    const shellBody = ui.element.querySelector('.challenge-shell-body');
    const header = ui.element.querySelector('.challenge-shell-header');
    const review = ui.element.querySelector('[data-action="review-opening"]');
    assert.ok(shellBody && header && review);
    Object.defineProperty(shellBody, 'scrollHeight', { value: 620, configurable: true });
    Object.defineProperty(shellBody, 'clientHeight', { value: 260, configurable: true });
    shellBody.scrollTop = 0;

    // Swipe starting over a button or header scrolls shellBody to expose [data-action="review-opening"]
    let reviewClicks = 0;
    review.addEventListener('click', () => { reviewClicks++; });
    const dispatchPointer = (target, type, clientX) => {
      const ev = new w.Event(type, { bubbles: true, cancelable: true });
      Object.assign(ev, { pointerId: 7, pointerType: 'touch', isPrimary: true, clientX, clientY: 100 });
      target.dispatchEvent(ev);
      return ev;
    };

    dispatchPointer(review, 'pointerdown', 100);
    dispatchPointer(review, 'pointermove', 100 + 180 * Math.sign(rotation));
    dispatchPointer(review, 'pointerup', 100 + 180 * Math.sign(rotation));
    assert.equal(shellBody.scrollTop, 180, `rotation ${rotation}: swiping on button scrolls overview body`);

    const clickEv = new w.MouseEvent('click', { bubbles: true, cancelable: true, detail: 1 });
    review.dispatchEvent(clickEv);
    assert.equal(reviewClicks, 0, 'drag over button suppresses accidental click');

    dispatchPointer(header, 'pointerdown', 100);
    dispatchPointer(header, 'pointermove', 100 + 120 * Math.sign(rotation));
    dispatchPointer(header, 'pointerup', 100 + 120 * Math.sign(rotation));
    assert.equal(shellBody.scrollTop, 300, `rotation ${rotation}: swiping from header falls back to overview body`);

    ui.destroy();
    w.close();
  }
});
