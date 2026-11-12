import test from 'node:test';
import assert from 'node:assert/strict';

import { createBackgroundMusic } from '../dist/background-music.mjs';
const tracks = { menu: { src: '/fluffing.mp3', label: 'Fluffing a Duck' }, battle: { src: '/amok.mp3', label: 'Run Amok' } };
const deferred = () => { let resolve, reject; const promise = new Promise((a, b) => { resolve = a; reject = b; }); return { promise, resolve, reject }; };
const settle = async () => { for (let i = 0; i < 15; i++) await Promise.resolve(); };

// Node has no browser AudioContext. This boundary fake records the real
// controller's graph, lifecycle, clocks, and buffer-source start arguments.
function setup({ state = 'running', fetchImpl, decodeImpl, resumeImpl, onState } = {}) {
  const sources = [], gains = [], fetched = [], events = [], listeners = new Set();
  const context = {
    state, currentTime: 0, destination: {},
    addEventListener(type, fn) { if (type === 'statechange') listeners.add(fn); },
    removeEventListener(type, fn) { if (type === 'statechange') listeners.delete(fn); },
    resume() { events.push('resume'); if (resumeImpl) return resumeImpl(context); context.state = 'running'; return Promise.resolve(); },
    decodeAudioData(bytes) { events.push('decode'); return decodeImpl ? decodeImpl(bytes) : Promise.resolve({ duration: 10, id: new Uint8Array(bytes)[0] }); },
    createGain() {
      const node = { gain: { value: 1, setValueAtTime(value) { this.value = value; } }, connect(target) { this.target = target; }, disconnect() { this.disconnected = true; } };
      gains.push(node); return node;
    },
    createBufferSource() {
      const node = { buffer: null, loop: false, connect(target) { this.target = target; }, start(when, offset) {
        assert.equal(sources.filter(source => source.started && !source.stopped).length, 0, 'never overlap sources');
        this.started = true; this.when = when; this.offset = offset;
      }, stop() { this.stopped = true; this.onended?.(); }, disconnect() { this.disconnected = true; } };
      sources.push(node); return node;
    },
  };
  const controller = createBackgroundMusic({ tracks, getContext() { events.push('getContext'); return context; }, fetchImpl: async src => {
    fetched.push(src); events.push('fetch');
    return fetchImpl ? fetchImpl(src) : { ok: true, arrayBuffer: async () => new Uint8Array([src === tracks.menu.src ? 1 : 2]).buffer };
  }, onState });
  return { controller, context, sources, gains, fetched, events, listeners,
    changeState(next) { context.state = next; for (const listener of listeners) listener(); },
    live: () => sources.filter(source => source.started && !source.stopped),
  };
}

test('construction and selections do not acquire audio or fetch before a gesture', () => {
  const { controller, events } = setup();
  assert.equal(controller.state.key, 'menu');
  assert.equal(controller.state.status, 'waiting');
  controller.select('battle'); controller.setHidden(true); controller.setHidden(false);
  controller.setPreferences({ musicVolume: .6 });
  assert.deepEqual(events, []);
  assert.equal(Object.isFrozen(controller.state), true);
});

test('unlock gets/resumes the shared context synchronously, then starts menu looping at independent gain', async () => {
  const resume = deferred();
  const h = setup({ state: 'suspended', resumeImpl: context => resume.promise.then(() => { context.state = 'running'; }) });
  const ready = h.controller.unlock();
  assert.deepEqual(h.events, ['getContext', 'resume']);
  resume.resolve(); await ready;
  assert.equal(h.controller.state.status, 'playing');
  assert.equal(h.controller.state.label, 'Fluffing a Duck');
  assert.equal(h.sources[0].loop, true);
  assert.equal(h.sources[0].offset, 0);
  assert.equal(h.gains[0].gain.value, .22);
  assert.equal(h.sources[0].target, h.gains[0]);
  assert.equal(h.gains[0].target, h.context.destination);
});

test('repeated unlocks, same-track selection, and volume changes do not restart or leak music', async () => {
  const h = setup(); await h.controller.unlock(); h.context.currentTime = 3;
  for (let i = 0; i < 8; i++) { await h.controller.unlock(); h.controller.select('menu'); }
  h.controller.setPreferences({ musicVolume: .7 });
  assert.equal(h.sources.length, 1); assert.equal(h.fetched.length, 1);
  assert.equal(h.controller.state.offset, 3); assert.equal(h.gains[0].gain.value, .7);
});

test('battle/menu switches retain separate modulo loop offsets and a new round restarts battle', async () => {
  const h = setup(); await h.controller.unlock(); h.context.currentTime = 13;
  h.controller.select('battle', { restart: true }); await settle();
  assert.equal(h.sources.at(-1).offset, 0); h.context.currentTime = 17;
  h.controller.select('menu'); await settle();
  assert.equal(h.sources.at(-1).offset, 3); h.context.currentTime = 19;
  h.controller.select('battle'); await settle();
  assert.equal(h.sources.at(-1).offset, 4);
  h.controller.select('battle', { restart: true }); await settle();
  assert.equal(h.sources.at(-1).offset, 0);
  assert.equal(h.fetched.length, 2); assert.equal(h.live().length, 1);
  for (const source of h.sources.slice(0, -1)) { assert.equal(source.stopped, true); assert.equal(source.disconnected, true); }
});

for (const preferences of [{ musicVolume: 0 }, { musicMuted: true }, { masterMuted: true }]) {
  test(`muting ${JSON.stringify(preferences)} stops and later resumes the same position`, async () => {
    const h = setup(); await h.controller.unlock(); h.context.currentTime = 4;
    h.controller.setPreferences(preferences);
    assert.equal(h.controller.state.status, 'muted'); assert.equal(h.live().length, 0);
    h.context.currentTime = 30;
    h.controller.setPreferences({ musicVolume: .4, musicMuted: false, masterMuted: false }); await settle();
    assert.equal(h.sources.at(-1).offset, 4); assert.equal(h.gains.at(-1).gain.value, .4);
    assert.equal(h.controller.state.status, 'playing');
  });
}

test('starting muted cannot create an audible source and unmuting can begin after the gesture', async () => {
  const h = setup(); h.controller.setPreferences({ musicMuted: true }); await h.controller.unlock();
  assert.equal(h.live().length, 0); assert.equal(h.controller.state.status, 'muted');
  h.controller.setPreferences({ musicMuted: false }); await settle();
  assert.equal(h.live().length, 1); assert.equal(h.sources[0].offset, 0);
});

test('hidden/blur pauses and restores position without calling resume outside an unlock gesture', async () => {
  const h = setup(); await h.controller.unlock(); h.context.currentTime = 8;
  h.controller.setHidden(true); assert.equal(h.live().length, 0); assert.equal(h.controller.state.status, 'paused');
  h.context.currentTime = 80; h.controller.setHidden(false); await settle();
  assert.equal(h.sources.at(-1).offset, 8); assert.equal(h.events.includes('resume'), false);
  h.controller.setHidden(true); h.changeState('suspended'); h.controller.setHidden(false);
  assert.equal(h.controller.state.status, 'blocked'); assert.equal(h.events.includes('resume'), false);
  await h.controller.unlock(); assert.equal(h.controller.state.status, 'playing');
  assert.equal(h.sources.at(-1).offset, 8);
});

test('context suspension stops the graph and only a successful running context can play again', async () => {
  let rejectResume = true;
  const h = setup({ resumeImpl: context => rejectResume ? Promise.reject(new Error('gesture needed')) : (context.state = 'running', Promise.resolve()) });
  await h.controller.unlock(); h.context.currentTime = 2; h.changeState('suspended');
  assert.equal(h.controller.state.status, 'blocked'); assert.equal(h.live().length, 0);
  await h.controller.unlock(); assert.equal(h.controller.state.status, 'blocked');
  assert.match(h.controller.state.error, /gesture needed/);
  rejectResume = false; await h.controller.unlock();
  assert.equal(h.controller.state.status, 'playing'); assert.equal(h.sources.at(-1).offset, 2);
});

test('a resume promise resolving while still suspended never reports playing', async () => {
  const h = setup({ state: 'suspended', resumeImpl: () => Promise.resolve() });
  await h.controller.unlock(); assert.equal(h.controller.state.status, 'blocked'); assert.equal(h.live().length, 0);
});

test('fast switching cannot let a stale decode play the wrong track', async () => {
  const menu = deferred(), battle = deferred();
  const h = setup({ decodeImpl: bytes => new Uint8Array(bytes)[0] === 1 ? menu.promise : battle.promise });
  const first = h.controller.unlock(); await settle(); h.controller.select('battle'); await settle();
  battle.resolve({ duration: 20, id: 2 }); await settle();
  assert.equal(h.live()[0].buffer.id, 2);
  menu.resolve({ duration: 10, id: 1 }); await first; await settle();
  assert.equal(h.live().length, 1); assert.equal(h.live()[0].buffer.id, 2);
  assert.equal(h.controller.state.key, 'battle');
});

test('switching back during pending decoding shares the one in-flight request per track', async () => {
  const decoded = deferred(); const h = setup({ decodeImpl: () => decoded.promise });
  const first = h.controller.unlock(); await settle();
  h.controller.select('battle'); h.controller.select('menu'); await settle();
  decoded.resolve({ duration: 10 }); await first; await settle();
  assert.equal(h.fetched.filter(src => src === tracks.menu.src).length, 1);
  assert.equal(h.live().length, 1); assert.equal(h.controller.state.key, 'menu');
});

test('a decode completing while hidden stays stopped until visible', async () => {
  const decoded = deferred(); const h = setup({ decodeImpl: () => decoded.promise });
  const ready = h.controller.unlock(); await settle(); h.controller.setHidden(true);
  decoded.resolve({ duration: 10 }); await ready;
  assert.equal(h.controller.state.status, 'paused'); assert.equal(h.live().length, 0);
  h.controller.setHidden(false); await settle(); assert.equal(h.live().length, 1);
});

test('a decode completing after destroy cannot resurrect audio or notify state changes', async () => {
  const decoded = deferred(), states = []; const h = setup({ decodeImpl: () => decoded.promise, onState: state => states.push(state) });
  const ready = h.controller.unlock(); await settle(); h.controller.destroy(); const count = states.length;
  decoded.resolve({ duration: 10 }); await ready;
  h.controller.select('battle'); h.controller.setHidden(false); await h.controller.unlock();
  assert.equal(h.live().length, 0); assert.equal(h.sources.length, 0);
  assert.equal(states.length, count); assert.equal(h.listeners.size, 0);
});

for (const failure of ['fetch', 'http', 'decode']) test(`${failure} failure is visible and only a later explicit unlock retries`, async () => {
  let fail = true;
  const h = setup({ fetchImpl: async () => {
    if (fail && failure === 'fetch') throw new Error('network failed');
    return { ok: !(fail && failure === 'http'), status: 503, arrayBuffer: async () => new ArrayBuffer(1) };
  }, decodeImpl: async () => { if (fail && failure === 'decode') throw new Error('decode failed'); return { duration: 10 }; } });
  await h.controller.unlock();
  assert.equal(h.controller.state.status, 'error'); assert.ok(h.controller.state.error); assert.equal(h.live().length, 0);
  h.controller.setPreferences({ musicVolume: .5 }); h.controller.setHidden(true); h.controller.setHidden(false); await settle();
  assert.equal(h.fetched.length, 1);
  fail = false; await h.controller.unlock();
  assert.equal(h.fetched.length, 2); assert.equal(h.controller.state.status, 'playing');
});

test('stale loading failure cannot overwrite the current playing track status', async () => {
  const decoded = deferred();
  const h = setup({ decodeImpl: bytes => new Uint8Array(bytes)[0] === 1 ? decoded.promise : Promise.resolve({ duration: 10 }) });
  const ready = h.controller.unlock(); await settle(); h.controller.select('battle'); await settle();
  decoded.reject(new Error('old menu decode failed')); await ready;
  assert.equal(h.controller.state.status, 'playing'); assert.equal(h.controller.state.error, null);
});

test('missing source capability is contained, visible, and never leaks a rejected unlock', async () => {
  const h = setup(); delete h.context.createBufferSource;
  await h.controller.unlock(); assert.equal(h.controller.state.status, 'error'); assert.equal(h.live().length, 0);
});

test('destroy stops/disconnects its own nodes without suspending or closing the shared context', async () => {
  const h = setup(); await h.controller.unlock(); h.context.currentTime = 3;
  h.controller.destroy(); h.controller.destroy();
  assert.equal(h.live().length, 0); assert.equal(h.sources[0].disconnected, true); assert.equal(h.gains[0].disconnected, true);
  assert.equal(h.context.state, 'running'); assert.equal(h.listeners.size, 0);
});

test('muting while decoding prevents a late source from starting', async () => {
  const decoded = deferred(); const h = setup({ decodeImpl: () => decoded.promise });
  const ready = h.controller.unlock(); await settle(); h.controller.setPreferences({ musicVolume: 0 });
  decoded.resolve({ duration: 10 }); await ready;
  assert.equal(h.controller.state.status, 'muted'); assert.equal(h.sources.length, 0);
  h.controller.setPreferences({ musicVolume: .3 }); await settle();
  assert.equal(h.live().length, 1); assert.equal(h.gains[0].gain.value, .3);
});

test('destroy during fetching skips decoding and cannot start a source', async () => {
  const response = deferred(); const h = setup({ fetchImpl: () => response.promise });
  const ready = h.controller.unlock(); await settle(); h.controller.destroy();
  response.resolve({ ok: true, arrayBuffer: async () => new ArrayBuffer(1) }); await ready;
  assert.equal(h.events.includes('decode'), false); assert.equal(h.sources.length, 0);
});

test('a rejected old resume cannot overwrite a successful newer gesture', async () => {
  const firstResume = deferred(); let calls = 0;
  const h = setup({ state: 'suspended', resumeImpl: context => {
    if (++calls === 1) return firstResume.promise;
    context.state = 'running'; return Promise.resolve();
  } });
  const first = h.controller.unlock(); await h.controller.unlock();
  firstResume.reject(new Error('stale blocked gesture')); await first;
  assert.equal(h.controller.state.status, 'playing'); assert.equal(h.controller.state.error, null);
  assert.equal(h.live().length, 1);
});

test('callback-only Safari decode remains supported without decoding twice', async () => {
  const h = setup(); let decodes = 0;
  h.context.decodeAudioData = (_bytes, resolve) => { decodes++; queueMicrotask(() => resolve({ duration: 10 })); };
  await h.controller.unlock(); assert.equal(decodes, 1); assert.equal(h.live().length, 1);
});

test('failed source start cleans up its graph and retries without downloading again', async () => {
  const h = setup(); const createSource = h.context.createBufferSource;
  h.context.createBufferSource = () => { const source = createSource(); source.start = () => { throw new Error('source start failed'); }; return source; };
  await h.controller.unlock();
  assert.equal(h.controller.state.status, 'error'); assert.equal(h.sources[0].disconnected, true); assert.equal(h.gains[0].disconnected, true);
  h.context.createBufferSource = createSource; await h.controller.unlock();
  assert.equal(h.live().length, 1); assert.equal(h.fetched.length, 1);
});

test('unplayable decoded duration is reported instead of starting an invalid loop', async () => {
  const h = setup({ decodeImpl: async () => ({ duration: 0 }) }); await h.controller.unlock();
  assert.equal(h.controller.state.status, 'error'); assert.equal(h.sources.length, 0);
});

test('volume is clamped and malformed values never corrupt an active AudioParam', async () => {
  const h = setup(); await h.controller.unlock();
  h.controller.setPreferences({ musicVolume: 2 }); assert.equal(h.gains[0].gain.value, 1);
  h.controller.setPreferences({ musicVolume: NaN }); assert.equal(h.gains[0].gain.value, 1);
  h.controller.setPreferences({ musicVolume: -2 }); assert.equal(h.live().length, 0); assert.equal(h.controller.state.status, 'muted');
});

test('a rendering callback throwing cannot break playback or reject unlock', async () => {
  const h = setup({ onState() { throw new Error('render failed'); } });
  await h.controller.unlock(); assert.equal(h.live().length, 1); assert.equal(h.controller.state.status, 'playing');
});
