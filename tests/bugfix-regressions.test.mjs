import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {resolve, dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {JSDOM} from 'jsdom';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const {ChallengeRoute} = await import('../dist/challenge-engine.mjs');
const {VoiceChannels} = await import('../dist/voice-channels.mjs');
const {SFX_FREQUENCIES} = await import('../dist/sfx-frequencies.mjs');
const {controlledCombatCameraFrame} = await import('../dist/challenge-camera.mjs');

test('SFX_FREQUENCIES shares complete move & event frequency table', () => {
  assert.equal(Object.isFrozen(SFX_FREQUENCIES), true);
  for (const key of [
    'hit', 'guard', 'jump', 'dash', 'heal', 'drink', 'counter', 'rally',
    'assist', 'ko', 'han_bottle', 'su_shout', 'huang_queue', 'chen_dream', 'ko_resolve'
  ]) {
    assert.ok(Number.isFinite(SFX_FREQUENCIES[key]) && SFX_FREQUENCIES[key] > 0, `missing freq for ${key}`);
  }
});

test('ChallengeRoute buffers press() input during attack and executes on recovery', () => {
  const route = new ChallengeRoute('ko', 'easy', () => 0.5, 'none');
  route.status = 'active';
  assert.equal(route.press('punch'), true);
  assert.ok(route.player.attack);
  assert.equal(route.press('special1'), false);
  assert.equal(route.buffer?.action, 'special1');
  for (let i = 0; i < 40; i++) route.step(1 / 60, {});
  assert.equal(route.buffer, null);
});

test('ChallengeRoute caps active chen_dream / huang_queue projectiles and applies ko_resolve rule.window', () => {
  const route = new ChallengeRoute('ko', 'easy', () => 0.5, 'none');
  route.status = 'active';
  route.player.attack = null;
  assert.equal(route.press('special3'), true);
  for (let i = 0; i < 20; i++) route.step(1 / 60, {});
  assert.ok(route.player.armor > 0 && route.player.armor <= 0.9 + 1e-6);

  const chen = new ChallengeRoute('chen', 'easy', () => 0.5, 'none');
  chen.status = 'active';
  for (let i = 0; i < 4; i++) chen.projectiles.push({owner: chen.player, kind: 'dream', lob: false, age: 0, dead: false});
  assert.equal(chen.press('special1'), false);

  const huang = new ChallengeRoute('huang', 'easy', () => 0.5, 'none');
  huang.status = 'active';
  for (let i = 0; i < 4; i++) huang.obstacles.push({owner: huang.player, life: 5, dead: false});
  assert.equal(huang.press('special3'), false);
});

test('VoiceChannels caps decoded AudioBuffer LRU cache at 32 entries', async () => {
  const dom = new JSDOM('<!doctype html><body><audio id="p"></audio><audio id="e"></audio></body>');
  const els = {player: dom.window.document.getElementById('p'), enemy: dom.window.document.getElementById('e')};
  let decodeCount = 0;
  const fakeAudio = {
    state: 'running',
    currentTime: 0,
    createMediaElementSource: () => ({connect() {}}),
    createGain: () => ({gain: {setValueAtTime() {}, linearRampToValueAtTime() {}}, connect() {}}),
    decodeAudioData: async () => ({duration: 0.4, id: ++decodeCount}),
    createBufferSource: () => ({connect() {}, start() {}, stop() {}, disconnect() {}})
  };
  const vc = new VoiceChannels(els, {
    fetchImpl: async () => ({ok: true, arrayBuffer: async () => new ArrayBuffer(8)})
  });
  vc.connectAudio(fakeAudio);
  const clips = Array.from({length: 40}, (_, i) => ({src: `assets/v/${i}.mp3`, voiceId: `id-${i}`, label: `line-${i}`}));
  await vc.preload(clips);
  assert.equal(vc.buffers.size, 32);
  assert.equal(vc.buffers.has('assets/v/0.mp3'), false);
  assert.equal(vc.buffers.has('assets/v/39.mp3'), true);
});

test('challenge-overview redirect preserves existing query parameters cleanly via URLSearchParams', () => {
  const html = readFileSync(resolve(root, 'app-source/challenge-overview/index.html'), 'utf8');
  assert.ok(html.includes('URLSearchParams'), 'must parse query with URLSearchParams');
  assert.ok(!html.includes("'/?challengeOverview=1'+(location.search||'')"), 'must not concatenate raw location.search');
});

test('quick-view isolation removes hardcoded workers.dev host bypass across entry points', () => {
  for (const rel of [
    'app-source/index.html',
    'app-source/preview/chapter2/index.html',
    'app-source/preview/chapter3/index.html',
    'app-source/preview/chapter4/index.html',
    'app-source/preview/chapter5/index.html',
    'app-source/preview/finale/index.html'
  ]) {
    const html = readFileSync(resolve(root, rel), 'utf8');
    assert.ok(!html.includes('playformosa.workers.dev'), `${rel} must not contain hardcoded workers.dev host bypass`);
    assert.ok(html.includes('/preview/quick-view/'), `${rel} must keep strict quick-view path guard`);
  }
});

test('server.ts uses differentiated Cache-Control headers instead of blanket no-store', () => {
  const srv = readFileSync(resolve(root, 'server.ts'), 'utf8');
  assert.ok(srv.includes('no-cache'), 'HTML should use no-cache');
  assert.ok(srv.includes('max-age=31536000, immutable'), 'versioned/media assets should use immutable caching');
});

test('controlledCombatCameraFrame protects desktop exact opening composition when unblocked', () => {
  const desktop = controlledCombatCameraFrame(1280, 720, [{x: 436, y: 430, supportY: 430}, {x: 524, y: 430, supportY: 430}], null, 16.7, {
    touch: false, portrait: false, cameraMode: 'classic',
    preferredCameraFrame: {width: 1280, height: 720, x: 500, y: 210, zoom: 0.8},
    safeRect: {left: 0, top: 0, right: 1280, bottom: 720}, occlusions: []
  });
  assert.equal(desktop.zoom, 0.8);
  assert.equal(desktop.x, 500);
});

test('portrait touch-pad centers halfway between edge and specials without altering vertical offset or landscape', async () => {
  const {stylesAt} = await import('./helpers/css-contracts.mjs');
  const css = readFileSync(resolve(root, 'app-source/combat-controls-v73.css'), 'utf8');
  const portraitPad = stylesAt(css, [
    '.app[data-touch="true"][data-layout="portrait"][data-overlay-controls="false"][data-depth-route] .control-deck .touch-pad'
  ], {width: 390, height: 844});
  assert.equal(portraitPad['justify-self'], 'center');
  assert.equal(portraitPad['align-self'], 'end');
  assert.equal(portraitPad['grid-row'], '1/4');
  assert.equal(portraitPad['margin-bottom'], '12px');
  assert.equal(portraitPad['max-width'], '100px');

  const portraitDeck = stylesAt(css, [
    '.app[data-touch="true"][data-layout="portrait"][data-overlay-controls="false"][data-depth-route] .control-deck'
  ], {width: 320, height: 568});
  assert.equal(portraitDeck['grid-template-columns'], 'minmax(56px,1fr) repeat(4,52px)');

  const landscapePad = stylesAt(css, [
    '.app[data-touch="true"][data-layout="landscape"][data-overlay-controls="true"][data-depth-route] .control-deck .touch-pad'
  ], {width: 844, height: 390});
  assert.equal(landscapePad['grid-row'], '1/3');
  assert.equal(landscapePad['margin-bottom'], undefined);
});
