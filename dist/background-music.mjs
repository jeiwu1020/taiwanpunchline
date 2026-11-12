/** Looping music on the game's shared AudioContext, with its own gain node.
 * Call unlock() directly from a trusted user gesture. All other methods are
 * safe outside a gesture and never try to resume the shared AudioContext.
 */
export function createBackgroundMusic({ getContext, tracks, fetchImpl = globalThis.fetch, onState = () => {} }) {
  const buffers = new Map(), pending = new Map(), failures = new Map(), positions = new Map();
  let key = 'menu', context = null, voice = null;
  let unlocked = false, hidden = false, destroyed = false;
  let musicVolume = .22, musicMuted = false, masterMuted = false;
  let status = 'waiting', error = null, contextError = null, resumeError = null, resumeVersion = 0;
  const message = reason => reason instanceof Error ? reason.message : String(reason || 'Music could not play.');
  const muted = () => musicMuted || masterMuted || musicVolume === 0;
  const wrap = (offset, duration) => duration > 0 ? ((offset % duration) + duration) % duration : 0;
  const position = track => {
    const buffer = buffers.get(track);
    if (voice?.key === track) return wrap(voice.offset + Math.max(0, context.currentTime - voice.startedAt), buffer.duration);
    return wrap(positions.get(track) || 0, buffer?.duration);
  };
  const snapshot = () => Object.freeze({
    key, label: tracks?.[key]?.label || key, status, offset: position(key),
    duration: buffers.get(key)?.duration || 0, musicVolume, musicMuted, masterMuted,
    hidden, unlocked, destroyed, error,
  });
  function publish(next, reason = null) {
    status = next; error = reason;
    if (!destroyed) {
      // A rendering callback must not break the audio lifecycle or reject a load.
      try { onState(snapshot()); } catch { /* The consumer owns rendering errors. */ }
    }
    return snapshot();
  }
  function stop() {
    if (!voice) return;
    const old = voice;
    positions.set(old.key, position(old.key));
    voice = null;
    try { old.source.stop(); } catch { /* Already stopped or context closed. */ }
    try { old.source.disconnect(); } catch { /* Best-effort node cleanup. */ }
    try { old.gain.disconnect(); } catch { /* Never touch the shared context. */ }
  }
  function updateGain(gain) {
    if (typeof gain.gain.setValueAtTime === 'function') gain.gain.setValueAtTime(musicVolume, context.currentTime);
    else gain.gain.value = musicVolume;
  }
  function start() {
    let source, gain;
    try {
      source = context.createBufferSource();
      gain = context.createGain();
      source.buffer = buffers.get(key);
      source.loop = true;
      updateGain(gain);
      source.connect(gain); gain.connect(context.destination);
      const offset = position(key);
      source.start(0, offset);
      voice = { key, source, gain, offset, startedAt: context.currentTime };
      return publish('playing');
    } catch (reason) {
      try { source?.stop(); } catch { /* A source may not have started. */ }
      try { source?.disconnect(); } catch { /* Best-effort partial graph cleanup. */ }
      try { gain?.disconnect(); } catch { /* Best-effort partial graph cleanup. */ }
      failures.set(key, message(reason));
      return publish('error', failures.get(key));
    }
  }
  function decode(bytes, decodingContext) {
    // Support both promise and callback forms without decoding a buffer twice.
    return new Promise((resolve, reject) => {
      const result = decodingContext.decodeAudioData(bytes, resolve, reject);
      if (result?.then) result.then(resolve, reject);
    });
  }
  function load(track) {
    if (pending.has(track)) return pending.get(track);
    const decodingContext = context;
    const job = Promise.resolve().then(async () => {
      if (destroyed) return;
      const src = tracks?.[track]?.src;
      if (!src) throw new Error('No music file is configured for this track.');
      const response = await fetchImpl(src);
      if (!response.ok) throw new Error(`Music request failed (${response.status || 'HTTP error'}).`);
      const bytes = await response.arrayBuffer();
      if (destroyed) return;
      const buffer = await decode(bytes, decodingContext);
      if (destroyed) return;
      if (!(Number.isFinite(buffer?.duration) && buffer.duration > 0)) throw new Error('The music file has no playable duration.');
      buffers.set(track, buffer);
      failures.delete(track);
    }).catch(reason => {
      if (!destroyed) failures.set(track, message(reason));
    }).then(() => {
      pending.delete(track);
      if (!destroyed && key === track) reconcile();
      return snapshot();
    });
    pending.set(track, job);
    return job;
  }
  function reconcile() {
    if (destroyed) return snapshot();
    if (!unlocked) return publish('waiting');
    if (hidden) { stop(); return publish('paused'); }
    if (muted()) { stop(); return publish('muted'); }
    if (contextError) { stop(); return publish('error', contextError); }
    if (!context || context.state !== 'running') {
      stop(); return publish('blocked', resumeError || 'Audio needs a user gesture to resume.');
    }
    resumeError = null;
    if (failures.has(key)) { stop(); return publish('error', failures.get(key)); }
    if (voice) {
      try { updateGain(voice.gain); return publish('playing'); }
      catch (reason) { stop(); failures.set(key, message(reason)); return publish('error', failures.get(key)); }
    }
    if (buffers.has(key)) return start();
    const job = load(key);
    publish('loading');
    return job;
  }
  const stateChanged = () => { reconcile(); };
  function useContext(next) {
    if (next === context) return;
    stop();
    context?.removeEventListener?.('statechange', stateChanged);
    context = next;
    context?.addEventListener?.('statechange', stateChanged);
  }
  return {
    get state() { return snapshot(); },
    select(next, { restart = false } = {}) {
      if (destroyed || !Object.hasOwn(tracks || {}, next)) return snapshot();
      if (next !== key || restart) {
        stop(); key = next;
        if (restart) positions.set(key, 0);
      }
      reconcile();
      return snapshot();
    },
    unlock() {
      if (destroyed) return Promise.resolve(snapshot());
      unlocked = true; contextError = null; resumeError = null;
      failures.delete(key);
      const version = ++resumeVersion;
      let resume;
      try {
        // Keep both acquisition and resume in the original gesture's call stack.
        useContext(getContext());
        if (!context || typeof context.createBufferSource !== 'function' || typeof context.createGain !== 'function' || typeof context.decodeAudioData !== 'function') {
          throw new Error('Web Audio music is unavailable in this browser.');
        }
        if (context.state !== 'running') {
          try { resume = context.resume(); }
          catch (reason) { resumeError = message(reason); }
        }
      } catch (reason) { contextError = message(reason); }
      return Promise.resolve(resume).catch(reason => {
        if (!destroyed && version === resumeVersion) resumeError = message(reason);
      }).then(() => reconcile()).then(() => snapshot());
    },
    setPreferences(preferences = {}) {
      if (destroyed) return snapshot();
      if (preferences.musicVolume !== undefined && Number.isFinite(Number(preferences.musicVolume))) musicVolume = Math.max(0, Math.min(1, Number(preferences.musicVolume)));
      if (preferences.musicMuted !== undefined) musicMuted = Boolean(preferences.musicMuted);
      if (preferences.masterMuted !== undefined) masterMuted = Boolean(preferences.masterMuted);
      reconcile(); return snapshot();
    },
    setHidden(value) {
      if (destroyed) return snapshot();
      hidden = Boolean(value); reconcile(); return snapshot();
    },
    destroy() {
      if (destroyed) return;
      stop(); destroyed = true; status = 'paused'; error = null; ++resumeVersion;
      context?.removeEventListener?.('statechange', stateChanged);
    },
  };
}
