import test from 'node:test';
import assert from 'node:assert/strict';
import moduleApi from 'node:module';
import { JSDOM } from 'jsdom';

import {
  portraitStableCameraFrame,
  fixedStableCameraFrame,
  cameraFrame
} from '../dist/arena-presentation.mjs';
import {
  CHAPTER_METADATA,
  mountChapterLoadingOverlay,
  fixedBackdropPresentation,
  unifiedChallengeBackdropFrame
} from '../dist/chapter-unified-presentation.mjs';

// Provide lightweight in-memory stubs for snapshot-omitted sibling modules so we can
// test the real dist/combat-presentation.mjs and dist/challenge-camera.mjs directly.
if (typeof moduleApi.registerHooks === 'function') {
  const layoutStub = `
    export function isMobileLandscapePresentation(frame = {}) {
      const w = Number(frame.width) || 0;
      const h = Number(frame.height) || 0;
      return frame.touch === true && w > h && h <= 500;
    }
    export function streetPlayerCameraProfile(frame = {}) {
      if (frame.touch !== true || frame.route !== true) return null;
      const w = Number(frame.width) || 0;
      const h = Number(frame.height) || 0;
      if (w < h && w <= 600) return 'portrait';
      if (w > h && h <= 500 && frame.camera === 'classic') return 'landscape';
      return null;
    }
  `;
  const contentStub = `export const MOB_TYPES = {};`;
  moduleApi.registerHooks({
    resolve(specifier, context, nextResolve) {
      if (specifier.startsWith('./challenge-layout.mjs')) {
        return { shortCircuit: true, url: 'stub://challenge-layout.mjs' };
      }
      if (specifier.startsWith('./challenge-content.mjs')) {
        return { shortCircuit: true, url: 'stub://challenge-content.mjs' };
      }
      return nextResolve(specifier, context);
    },
    load(url, context, nextLoad) {
      if (url === 'stub://challenge-layout.mjs') {
        return { shortCircuit: true, format: 'module', source: layoutStub };
      }
      if (url === 'stub://challenge-content.mjs') {
        return { shortCircuit: true, format: 'module', source: contentStub };
      }
      return nextLoad(url, context);
    }
  });
}

const { fullStageCameraFrame } = await import('../dist/combat-presentation.mjs');
const { controlledCombatCameraFrame, fitChallengeCamera, streetPlayerCameraFrame } = await import('../dist/challenge-camera.mjs');

function screenBoundsForActor(actor, frame) {
  const left = frame.width / 2 + (actor.x - 132 - frame.x) * frame.zoom;
  const right = frame.width / 2 + (actor.x + 132 - frame.x) * frame.zoom;
  return { left, right };
}

test('Mobile portrait opening framing fits both fighters completely in both Stable and Dynamic modes', () => {
  const fighters = [
    { id: 'player', x: 260, y: 430, supportY: 430, vy: 0 },
    { id: 'enemy', x: 700, y: 430, supportY: 430, vy: 0 }
  ];

  for (const [w, h] of [[390, 844], [320, 568]]) {
    for (const cameraMode of ['stable', 'classic']) {
      const frame = fullStageCameraFrame(
        cameraMode === 'stable' ? fixedStableCameraFrame : cameraFrame,
        w,
        h,
        fighters,
        null,
        16,
        { touch: true, portrait: true, cameraMode }
      );
      const pBounds = screenBoundsForActor(fighters[0], frame);
      const eBounds = screenBoundsForActor(fighters[1], frame);
      assert.ok(pBounds.left >= -1, `${w}x${h} ${cameraMode} player left ${pBounds.left} must be >= 0`);
      assert.ok(eBounds.right <= w + 1, `${w}x${h} ${cameraMode} enemy right ${eBounds.right} must be <= ${w}`);
    }
  }
});

test('Mobile landscape keeps characters readable (matching portrait proportions) in both Stable and Dynamic modes', () => {
  const fighters = [
    { id: 'player', x: 260, y: 430, supportY: 430, vy: 0 },
    { id: 'enemy', x: 700, y: 430, supportY: 430, vy: 0 }
  ];

  for (const cameraMode of ['stable', 'classic']) {
    const portrait = fullStageCameraFrame(
      cameraMode === 'stable' ? fixedStableCameraFrame : cameraFrame,
      390,
      844,
      [{ ...fighters[0], x: 340 }, { ...fighters[1], x: 620 }],
      null,
      16,
      { touch: true, portrait: true, cameraMode }
    );
    const landscape = fullStageCameraFrame(
      cameraMode === 'stable' ? fixedStableCameraFrame : cameraFrame,
      844,
      390,
      fighters,
      null,
      16,
      { touch: true, portrait: false, nativeLandscape: true, cameraMode }
    );
    // Previously mobile landscape dropped to ~0.47 zoom. Now characters should be at least as readable as portrait (~0.70+).
    assert.ok(landscape.zoom >= 0.70, `mobile landscape ${cameraMode} zoom ${landscape.zoom} must be >= 0.70`);
    assert.ok(
      landscape.zoom >= portrait.zoom * 0.9,
      `landscape zoom (${landscape.zoom}) should match portrait standing zoom (${portrait.zoom})`
    );
  }
});

test('Wide separation on mobile landscape only zooms out slightly in Dynamic mode and holds scale in Stable mode', () => {
  const close = [
    { id: 'player', x: 340, y: 430, supportY: 430, vy: 0 },
    { id: 'enemy', x: 620, y: 430, supportY: 430, vy: 0 }
  ];
  const wide = [
    { id: 'player', x: 140, y: 430, supportY: 430, vy: 0 },
    { id: 'enemy', x: 820, y: 430, supportY: 430, vy: 0 }
  ];

  // Stable mode keeps zoom strictly locked
  let stablePrev = fullStageCameraFrame(fixedStableCameraFrame, 844, 390, close, null, 16, {
    touch: true, portrait: false, cameraMode: 'stable'
  });
  const stableBaseZoom = stablePrev.zoom;
  for (let i = 0; i < 20; i++) {
    stablePrev = fullStageCameraFrame(fixedStableCameraFrame, 844, 390, wide, stablePrev, 16, {
      touch: true, portrait: false, cameraMode: 'stable'
    });
  }
  assert.equal(stablePrev.zoom, stableBaseZoom, 'Stable mode must lock zoom during separation');

  // Dynamic mode eases out gently without shrinking characters tiny
  let dynPrev = fullStageCameraFrame(cameraFrame, 844, 390, close, null, 16, {
    touch: true, portrait: false, cameraMode: 'classic'
  });
  const dynBaseZoom = dynPrev.zoom;
  for (let i = 0; i < 30; i++) {
    dynPrev = fullStageCameraFrame(cameraFrame, 844, 390, wide, dynPrev, 16, {
      touch: true, portrait: false, cameraMode: 'classic'
    });
  }
  assert.ok(dynPrev.zoom >= dynBaseZoom * 0.80, `Dynamic wide zoom ${dynPrev.zoom} must stay >= 80% of ${dynBaseZoom}`);
});

test('Jumping causes zero zoom pumping, zero vertical wobble, and zero sky/backdrop scaling change', () => {
  const grounded = [
    { id: 'player', x: 340, y: 430, supportY: 430, vy: 0 },
    { id: 'enemy', x: 620, y: 430, supportY: 430, vy: 0 }
  ];
  const airborne = [
    { id: 'player', x: 340, y: 160, supportY: 430, vy: -720 },
    { id: 'enemy', x: 620, y: 430, supportY: 430, vy: 0 }
  ];

  for (const [w, h, touch, portrait] of [
    [390, 844, true, true],
    [844, 390, true, false],
    [1280, 720, false, false]
  ]) {
    for (const cameraMode of ['stable', 'classic']) {
      const camFn = cameraMode === 'stable' ? fixedStableCameraFrame : cameraFrame;
      const baseFrame = fullStageCameraFrame(camFn, w, h, grounded, null, 16, {
        touch, portrait, cameraMode
      });
      const jumpFrame = fullStageCameraFrame(camFn, w, h, airborne, baseFrame, 16, {
        touch, portrait, cameraMode
      });
      assert.equal(jumpFrame.zoom, baseFrame.zoom, `${w}x${h} ${cameraMode} jump must not pump zoom`);
      assert.equal(jumpFrame.y, baseFrame.y, `${w}x${h} ${cameraMode} jump must not wobble vertical camera`);
      assert.equal(jumpFrame.backdropZoom, baseFrame.backdropZoom, `${w}x${h} ${cameraMode} jump must keep backdropZoom constant`);
    }
  }

  // Also test portraitStableCameraFrame and fitChallengeCamera directly
  const ps1 = portraitStableCameraFrame(390, 600, grounded, null, 16);
  const ps2 = portraitStableCameraFrame(390, 600, airborne, ps1, 16);
  assert.equal(ps2.zoom, ps1.zoom);
  assert.equal(ps2.y, ps1.y);

  const fc1 = fitChallengeCamera({ width: 390, height: 844, x: 480, y: 270, zoom: 0.55, base: 680 }, grounded, null, 16, { cameraMode: 'classic' });
  const fc2 = fitChallengeCamera({ width: 390, height: 844, x: 480, y: 270, zoom: 0.55, base: 680 }, airborne, fc1, 16, { cameraMode: 'classic' });
  assert.equal(fc2.zoom, fc1.zoom);
  assert.equal(fc2.backdropZoom, fc1.backdropZoom);
});

test('Unified challenge backdrop & frame helpers work consistently across all viewports and chapters 1-5', () => {
  const world = {
    player: { x: 260, y: 430, supportY: 430 },
    enemy: { x: 700, y: 430, supportY: 430 }
  };

  const portraitFrame = unifiedChallengeBackdropFrame(390, 844, world, { portrait: true, touch: true });
  const landscapeFrame = unifiedChallengeBackdropFrame(844, 390, world, { portrait: false, touch: true });
  const desktopFrame = unifiedChallengeBackdropFrame(1280, 720, world, { portrait: false, touch: false });

  // Portrait fits full pair at start
  const pairSpan = 700 + 132 - (260 - 132);
  assert.ok(pairSpan * portraitFrame.zoom <= 390, 'portrait challenge duel must fit both fighters');
  // Mobile landscape avoids tiny zoom (~0.47)
  assert.ok(landscapeFrame.zoom >= 0.70, `mobile landscape zoom ${landscapeFrame.zoom} must stay readable`);
  // Desktop stays balanced
  assert.ok(desktopFrame.zoom >= 0.9 && desktopFrame.zoom <= 1.25);

  // Sky scale is locked and matches across frames
  const sky = fixedBackdropPresentation(390, 844, { touch: true });
  assert.equal(sky.lockSkyScale, true);
  assert.equal(sky.horizonZoom, portraitFrame.backdropZoom);

  // All 5 chapters have complete metadata
  for (const ch of [1, 2, 3, 4, 5]) {
    assert.ok(CHAPTER_METADATA[ch]?.title);
    assert.ok(CHAPTER_METADATA[ch]?.subtitle);
    assert.ok(CHAPTER_METADATA[ch]?.tips.length >= 2);
  }
});

test('Chapter loading overlay mounts cleanly with blurred backdrop, suppresses duplicate menu loading, and cleans up on ready', () => {
  const dom = new JSDOM('<!doctype html><html><head></head><body><main id="trial-app"><section id="menu"><div class="card"></div></section></main></body></html>');
  const { document } = dom.window;

  let retried = 0;
  const overlay = mountChapterLoadingOverlay({
    document,
    chapter: 3,
    backdropUrl: 'assets/chapter3-scene-0.webp',
    onRetry: () => { retried++; }
  });

  const el = document.getElementById('chapter-loading-overlay');
  const styleEl = document.getElementById('chapter-loading-overlay-style');
  assert.ok(el);
  assert.ok(styleEl);
  assert.equal(document.documentElement.dataset.chapterOverlayLoading, 'true');
  assert.match(styleEl.textContent, /#menu \.card::after/);
  assert.match(el.querySelector('.chapter-loading-title').textContent, /第三章|柯P|巷戰/);
  assert.match(el.querySelector('.chapter-loading-backdrop').style.backgroundImage, /chapter3-scene-0\.webp/);

  overlay.setBackdrop('assets/updated-scene.webp');
  assert.match(el.querySelector('.chapter-loading-backdrop').style.backgroundImage, /updated-scene\.webp/);

  overlay.setProgress(0.45, { phaseLabel: '共用角色素材', statusText: '載入共用素材 45%' });
  assert.equal(el.querySelector('.chapter-loading-percent').textContent, '45%');
  assert.equal(el.querySelector('.chapter-loading-fill').style.transform, 'scaleX(0.45)');
  assert.equal(el.querySelector('.chapter-loading-phase').textContent, '共用角色素材');

  overlay.setError('測試連線逾時');
  assert.equal(el.dataset.loadingState, 'error');
  assert.equal(el.querySelector('.chapter-loading-actions').hidden, false);
  el.querySelector('.chapter-loading-retry').click();
  assert.equal(retried, 1);

  overlay.setReady();
  assert.equal(el.dataset.loadingState, 'ready');
  assert.equal(el.querySelector('.chapter-loading-percent').textContent, '100%');
  assert.equal(el.querySelector('.chapter-loading-fill').style.transform, 'scaleX(1)');

  overlay.destroy();
  assert.equal(document.getElementById('chapter-loading-overlay'), null);
  assert.equal(document.documentElement.dataset.chapterOverlayLoading, undefined);
});

test('Title screen does not use chapter loading overlay and fills #title-start left-to-right in red by boot progress', async () => {
  const { readFileSync } = await import('node:fs');
  const gameSrc = readFileSync(new URL('../dist/game.mjs', import.meta.url), 'utf8');
  assert.doesNotMatch(gameSrc, /mountChapterLoadingOverlay\(/);
  assert.match(gameSrc, /\$\('#title-start'\)/);
  assert.match(gameSrc, /linear-gradient\(90deg,\s*#bc3f31 0%,\s*#bc3f31 \$\{pct\}%/);
});

test('Camera pans smoothly without single-frame teleports on mode switch, separation, and street jumps', () => {
  const close = [
    { id: 'player', x: 300, y: 430, supportY: 430, depth: 0 },
    { id: 'enemy', x: 580, y: 430, supportY: 430, depth: 0 }
  ];
  const wide = [
    { id: 'player', x: 300, y: 430, supportY: 430, depth: 0 },
    { id: 'enemy', x: 860, y: 430, supportY: 430, depth: 0 }
  ];

  const dyn = controlledCombatCameraFrame(844, 390, wide, null, 16, {
    cameraMode: 'classic',
    touch: true,
    portrait: false,
    measuredCameraSafety: false,
    safeRect: { left: 0, top: 44, right: 844, bottom: 372 },
    occlusions: []
  });
  // Switching to stable should ease gently rather than snapping 100px+ in a single frame
  const nextStable = controlledCombatCameraFrame(844, 390, wide, dyn, 16, {
    cameraMode: 'stable',
    touch: true,
    portrait: false,
    measuredCameraSafety: false,
    safeRect: { left: 0, top: 44, right: 844, bottom: 372 },
    occlusions: []
  });
  assert.ok(Math.abs(nextStable.x - dyn.x) * nextStable.zoom <= 8, `mode switch shift ${(nextStable.x - dyn.x) * nextStable.zoom}px must ease smoothly`);

  // Street jump keeps background vertical camera steady instead of bouncing 1:1 with player.y
  const streetWorld = {
    player: { x: 500, y: 430, supportY: 430, depth: 0, hp: 100 },
    enemies: [],
    worldWidth: 3000,
    status: 'active'
  };
  const streetOpts = {
    touch: true,
    portrait: true,
    route: true,
    camera: 'classic',
    safeRect: { left: 8, top: 8, right: 382, bottom: 836 },
    occlusions: [{ left: 8, top: 8, right: 382, bottom: 110, kind: 'hud' }]
  };
  const groundedStreet = streetPlayerCameraFrame(390, 844, streetWorld, streetOpts);
  streetWorld.player.y = 260;
  const jumpedStreet = streetPlayerCameraFrame(390, 844, streetWorld, { ...streetOpts, previous: groundedStreet, delta: 16 });
  assert.ok(Math.abs(jumpedStreet.y - groundedStreet.y) < 1e-6, 'street vertical camera must stay grounded during ordinary jump instead of bouncing the scenery');
});
