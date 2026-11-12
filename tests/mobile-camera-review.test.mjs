import test from 'node:test';
import assert from 'node:assert/strict';
import {Duel} from '../dist/core.mjs';
import {DESK} from '../dist/stage-expansion.mjs';
import {cameraFrame, fixedStableCameraFrame} from '../dist/arena-presentation.mjs';
import {fullStageCameraFrame} from '../dist/combat-presentation.mjs';
import {depthRouteCameraFrame} from '../dist/challenge-depth-render.mjs';
import {createMobileCameraAdapter} from '../dist/preview/campaign/mobile-camera-adapter.mjs';

const measuredLane=(width,height,{top=118,floor=310,left=128,right=535,bottom=height-20}={})=>({safeRect:{left:0,top,right:width,bottom},occlusionPadding:0,occlusions:[{left:0,top:floor,right:left,bottom:height},{left:right,top:floor,right:width,bottom:height}]});
const landscape = {
  ...measuredLane(844,390),
  touch: true, portrait: false, nativeLandscape: true, cameraMode: 'classic',
  hudBottom: 117, lowerLane: {left: 128, right: 535, bottom: 370}
};
const stepMs = 1000 / 60;
const standing = () => [{x: 436, y: 430, vy: 0, hp: 100}, {x: 524, y: 430, vy: 0, hp: 100}];
function bounds(frame, actor, head = 300) {
  const depth = (actor.depth || 0) * .65,halfWidth=frame.playerCloseCamera?132:130;
  return {
    left: frame.width / 2 + (actor.x - halfWidth - frame.x) * frame.zoom,
    right: frame.width / 2 + (actor.x + halfWidth - frame.x) * frame.zoom,
    top: frame.height / 2 + (actor.y + depth - head - frame.y) * frame.zoom,
    bottom: frame.height / 2 + (actor.y + depth + 28 - frame.y) * frame.zoom
  };
}
function assertFit(frame, actors, {top = 0, bottom = frame.height, head = 300} = {}) {
  assert.ok(Number.isFinite(frame.zoom) && frame.zoom > 0);
  for (const actor of actors) {
    const b = bounds(frame, actor, head);
    assert.ok(b.left >= -1e-7 && b.right <= frame.width + 1e-7, 'both body sides stay in frame');
    assert.ok(b.top >= top - 1e-7, 'both heads clear HUD');
    assert.ok(b.bottom <= bottom + 1e-7, 'both feet stay above the safe floor');
  }
}
function duelAt(gap, table = false) {
  const duel = new Duel('wang', 'easy', () => .2, 'han', {mode: 'training', trainingBehavior: 'stand'});
  duel.player.x = 430;
  duel.enemy.x = 430 + gap;
  duel.nextItemAt = Infinity;
  if (table) duel.player.y = duel.player.supportY = DESK.y;
  return duel;
}

test('portrait stable keeps scale through a real ordinary jump with rising velocity', () => {
  const duel = duelAt(88);
  const options = {touch: true, portrait: true, cameraMode: 'stable', hudBottom: 148};
  let frame = fullStageCameraFrame(fixedStableCameraFrame, 390, 844, [duel.player, duel.enemy], null, stepMs, options);
  const zoom = frame.zoom;
  assert.equal(duel.press('jump'), true);
  for (let i = 0; i < 160; i++) {
    duel.step(1 / 120, {});
    frame = fullStageCameraFrame(fixedStableCameraFrame, 390, 844, [duel.player, duel.enemy], frame, 1000 / 120, options);
    assert.equal(frame.zoom, zoom, 'ordinary ascent anticipation must not change stable scale');
    assertFit(frame, [duel.player, duel.enemy], {top: 148, bottom: 646});
  }
});

// Previously, a changing lower-lane height invalidated the previous frame and
// snapped 21% on the first table-jump frame and 12.7% during a ground jump.
test('landscape dynamic preserves easing while jump movement changes lower-lane height', () => {
  const options = {...landscape, hudBottom: 93};
  for (const table of [false, true]) for (const direction of ['left', 'right']) {
    for (const gap of [150, 250, 270, 300, 350, 400]) {
      const duel = duelAt(gap, table);
      let frame = fullStageCameraFrame(cameraFrame, 844, 390, [duel.player, duel.enemy], null, stepMs, options);
      assert.equal(duel.press('jump'), true);
      for (let i = 0; i < 130; i++) {
        duel.step(1 / 60, {[direction]: true});
        const next = fullStageCameraFrame(cameraFrame, 844, 390, [duel.player, duel.enemy], frame, stepMs, options);
        assert.ok(Math.abs(next.zoom - frame.zoom) / frame.zoom < .05,
          `no zoom snap: table=${table}, direction=${direction}, gap=${gap}, frame=${i}`);
        assertFit(next, [duel.player, duel.enemy], {top: 118});
        frame = next;
      }
    }
  }
});

test('landscape dynamic grants extra lower space only while the eased pair fits its corridor', () => {
  const options = {...landscape, hudBottom: 93};
  let exercised = 0;
  for (const direction of ['left', 'right']) for (const gap of [100, 150, 250, 300]) {
    const duel = duelAt(gap);
    let frame = fullStageCameraFrame(cameraFrame, 844, 390, [duel.player, duel.enemy], null, stepMs, options);
    duel.press('jump');
    for (let i = 0; i < 180; i++) {
      duel.step(1 / 60, {[direction]: true});
      frame = fullStageCameraFrame(cameraFrame, 844, 390, [duel.player, duel.enemy], frame, stepMs, options);
      if (Math.max(...[duel.player,duel.enemy].map(a=>bounds(frame,a).bottom)) <= 310 + 1e-7) continue;
      exercised++;
      for (const actor of [duel.player, duel.enemy]) {
        const b = bounds(frame, actor);
        if(b.bottom<=310+1e-7)continue;
        assert.ok(b.left >= options.lowerLane.left - 1e-7 && b.right <= options.lowerLane.right + 1e-7,
          'final eased envelope, rather than target zoom, determines usable lower space');
      }
    }
  }
  assert.ok(exercised > 100);
});

test('short landscape off-center corridor never snaps sideways when lower-space gain changes', () => {
  for (const hudBottom of [93, 117]) for (const direction of ['left', 'right']) {
    for (const gap of [150, 250, 270, 300, 350]) {
      const options = {...landscape,...measuredLane(568,320,{top:hudBottom+8,floor:240,left:128,right:258,bottom:300}), hudBottom, lowerLane: {left: 128, right: 258, bottom: 300}};
      const duel = duelAt(gap);
      let frame = fullStageCameraFrame(cameraFrame, 568, 320, [duel.player, duel.enemy], null, stepMs, options);
      duel.press('jump');
      for (let i = 0; i < 180; i++) {
        duel.step(1 / 60, {[direction]: true});
        const next = fullStageCameraFrame(cameraFrame, 568, 320, [duel.player, duel.enemy], frame, stepMs, options);
        assert.ok(Math.abs(next.x - frame.x) * next.zoom < 10,
          `no sideways snap: HUD=${hudBottom}, direction=${direction}, gap=${gap}, frame=${i}`);
        assertFit(next, [duel.player, duel.enemy], {top: hudBottom});
        frame = next;
      }
    }
  }
});

test('close street player keeps lower-space clearance at the front depth lane', () => {
  const options = {...measuredLane(844,390,{top:101}),fullStage: true, touch: true, portrait: false, landscapePreview: true,
    camera: 'classic', hudBottom: 93, lowerLane: landscape.lowerLane};
  let exercised = 0;
  for (const motion of ['translate', 'approach', 'retreat']) for (const gap of [150, 350, 380, 400]) {
    const player = {x: 1000, y: 430, depth: 100, hp: 100};
    const enemy = {x: 1000 + gap, y: 430, depth: 100, hp: 100};
    const route = {player, enemy, enemies: [enemy], worldWidth: 4000};
    let frame;
    for (let i = 0; i < 200; i++) {
      player.x += motion === 'translate' ? 4 : motion === 'approach' ? 3 : -4;
      enemy.x += motion === 'translate' ? 4 : motion === 'approach' ? -2 : -1;
      frame = depthRouteCameraFrame(844, 390, route, {...options, previous: frame, delta: stepMs});
      assert.ok(frame.playerCloseCamera,'measured touch classic street selects close framing');
      assertFit(frame, [player], {top: 101, bottom: 370});
      if (bounds(frame, player).bottom <= 310 + 1e-7) continue;
      exercised++;
      for (const actor of [player]) {
        const b = bounds(frame, actor);
        assert.ok(b.left >= 128 - 1e-7 && b.right <= 535 + 1e-7, 'front-lane feet cannot enter corner controls');
      }
    }
  }
  assert.ok(exercised > 100);
});

test('short street camera does not snap when approaching actors first fit the open lane', () => {
  for (const depth of [-90, 0, 100]) {
    const player = {x: 1000, y: 430, depth, hp: 100};
    const enemy = {x: 1500, y: 430, depth, hp: 100};
    const route = {player, enemy, enemies: [enemy], worldWidth: 5000};
    const options = {...measuredLane(568,320,{top:101,floor:240,left:128,right:258,bottom:300}),fullStage: true, touch: true, portrait: false, landscapePreview: true,
      camera: 'classic', hudBottom: 93, lowerLane: {left: 128, right: 258, bottom: 300}};
    let frame = depthRouteCameraFrame(568, 320, route, options);
    for (let i = 0; i < 140; i++) {
      player.x += 3;
      enemy.x -= 2;
      const next = depthRouteCameraFrame(568, 320, route, {...options, previous: frame, delta: stepMs});
      assert.ok(Math.abs(next.x - frame.x) * next.zoom < 10,
        `no route lane-activation snap: depth=${depth}, frame=${i}`);
      assertFit(next, [player, enemy], {top: 101});
      frame = next;
    }
  }
});

test('landscape stable keeps fixed player framing through extreme jumps and separation', () => {
  const fighters = standing();
  const options = {...landscape, ...measuredLane(844,390,{top:126,bottom:310,floor:310}),cameraMode: 'stable', hudBottom: 117};
  const legacy = fullStageCameraFrame(fixedStableCameraFrame, 844, 390, fighters, null, stepMs,
    {...options, cameraMode: undefined});
  let frame = fullStageCameraFrame(fixedStableCameraFrame, 844, 390, fighters, null, stepMs, options);
  const initial=frame.playerFixedCamera;
  if(initial){assert.equal(frame.zoom,initial.zoom);assert.equal(422+(fighters[0].x-frame.x)*frame.zoom,initial.anchor.x);assert.equal(195+(fighters[0].y-frame.y)*frame.zoom,initial.anchor.y);}
  else for(const key of ['x','y','zoom'])assert.equal(frame[key],legacy[key],'safe preferred stable composition remains unchanged');
  for (const high of [0, 1]) for (const y of [430, 300, 160, 54, 160, 300, 430]) {
    fighters[high].y = y;
    frame = fullStageCameraFrame(fixedStableCameraFrame, 844, 390, fighters, frame, stepMs, options);
    if(frame.playerFixedCamera){assert.equal(frame.zoom,initial.zoom);assert.deepEqual(frame.playerFixedCamera.anchor,initial.anchor);}
    assertFit(frame, frame.playerFixedCamera?fighters.slice(0,1):fighters, {top: 126, bottom: 310, head: frame.playerFixedCamera?300:285});
  }
  fighters[0].x = 68;
  fighters[1].x = 892;
  frame = fullStageCameraFrame(fixedStableCameraFrame, 844, 390, fighters, frame, stepMs, options);
  if(frame.playerFixedCamera){assert.equal(frame.zoom,initial.zoom);assert.deepEqual(frame.playerFixedCamera.anchor,initial.anchor);assert.ok(422+(fighters[0].x-132-frame.x)*frame.zoom>=0&&422+(fighters[0].x+132-frame.x)*frame.zoom<=844);}
  assertFit(frame, frame.playerFixedCamera?fighters.slice(0,1):fighters, {top: 126, bottom: 310, head: frame.playerFixedCamera?300:285});
});

test('chapter adapter enforces every profile and converts shared camera coordinates exactly', () => {
  const adapter = createMobileCameraAdapter();
  const actors = standing(), world = {player: actors[0], enemy: actors[1]};
  const legacy = {zoom: .4, left: 10, base: 500};
  for (const options of [
    {width: 1280, height: 720, touch: false, portrait: false, camera: 'classic'},
    {width: 390, height: 844, touch: true, portrait: true, camera: 'classic'},
    {width: 844, height: 390, touch: true, portrait: false, nativeLandscape: false, camera: 'stable'}
  ]) assertFit(adapter.frame(legacy, world, options).cameraFrame,actors);
  const changed = adapter.frame(legacy, world,
    {width: 390, height: 844, touch: true, portrait: true, camera: 'stable', hudBottom: 148});
  const frame = changed.cameraFrame;
  for (const actor of actors) {
    assert.ok(Math.abs((actor.x - changed.left) * changed.zoom -
      (390 / 2 + (actor.x - frame.x) * frame.zoom)) < 1e-10);
    assert.ok(Math.abs(changed.base + (actor.y - 430) * changed.zoom -
      (844 / 2 + (actor.y - frame.y) * frame.zoom)) < 1e-10);
  }
});

test('chapter stable adapter keeps exact player scale through a real jump', () => {
  const adapter = createMobileCameraAdapter(), duel = duelAt(88);
  const options = {...measuredLane(844,390,{top:126,bottom:310,floor:310}),width: 844, height: 390, touch: true, portrait: false,
    nativeLandscape: true, camera: 'stable', hudBottom: 117};
  let original, previous;
  for (let i = 0; i < 120; i++) {
    if (i === 1) assert.equal(duel.press('jump'), true);
    if (i > 0) duel.step(1 / 60, {});
    original = fullStageCameraFrame(fixedStableCameraFrame, 844, 390,
      [duel.player, duel.enemy], original, stepMs, options);
    const legacy = {zoom: original.zoom, left: original.x - 844 / (2 * original.zoom),
      base: 195 + (430 - original.y) * original.zoom};
    const frame = adapter.frame(legacy, duel, options);
    if (i === 0)for(const key of ['left','base','zoom'])assert.equal(frame[key],legacy[key],'safe preferred chapter composition remains identical');
    if (previous){
      if(frame.cameraFrame?.playerFixedCamera){assert.equal(frame.zoom,previous.zoom);assert.deepEqual(frame.cameraFrame.playerFixedCamera.anchor,previous.cameraFrame.playerFixedCamera.anchor);}
      else assert.ok(Math.abs(frame.zoom - previous.zoom) / previous.zoom < .06,
        `chapter safety must not snap on frame ${i}`);
    }
    if (frame.cameraFrame) assertFit(frame.cameraFrame, frame.cameraFrame.playerFixedCamera?[duel.player]:[duel.player, duel.enemy],
      {top: 126, bottom: 310, head: frame.cameraFrame.playerFixedCamera?300:285});
    previous = frame;
  }
});
