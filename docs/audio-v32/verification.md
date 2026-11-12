# V32 replacement ko_name recording

User message: Sentinel_96124fb44b64819187359c63211e4724 (2026-11-07 17:01 UTC), provided to this worker by the parent.

Exact source ID: ko-name-user-v2-original. Source is the voice editor's 48 kHz, stereo Float32 WAV from 賴祥德v2.mp4, 447488 frames. SHA-256 acb162f0ecc3899e0bab75a940244d67290414c1a1135e903d2738e9fabb4cb3; source format and hash checked before rendering.

The user-selected end-exclusive range 5.177–6.219 seconds maps to source frames [248496, 298512). Output is exactly 50016 frames/channel, 1.042 seconds. The original editor DSP (SHA-256 120bad416f1ca4912b5010a2345ee0f9b75726c13ada01cce52edfd9351d6718) is reused without changes. Active RMS target −20 dBFS, 5 ms fade-in/out, linked-channel peak limiting; PCM16 output measured −20.000562 dBFS active RMS and −6.665272 dBFS sample peak, with no clipping and zero-valued endpoints. No resampling, MP3 re-encoding, inserted speech or speaker synthesis.

Output assets/voice/ko-name-user-selected-v32.wav SHA-256 bfbd2b9b8159501a340b7af27244fc00b332a646ddf9912d64ef77bb68b11865.

All twenty V31 voice selections, metadata and asset bytes are unchanged. All legacy game audio files, including user-ko-name-candidate-v15.mp3, remain byte-identical and available for rollback. The full new source remains in the voice studio's source/audio catalog; old source variants also remain. The V32 generated manifest overrides only ko_name and clears its inherited old Drive-source link to avoid false provenance.

Verification: new regression tests first failed on the V31 source (3 expected failures), then passed after integration. All 1373 tests passed (0 failed), including exact ranges, hashes, decoded frames, native sample rate/channels, silent endpoints, unclipped samples, preserved prior assets and the real game battle/preview route harness. The V31 twenty-clip browser checks remain applicable because those bytes are unchanged. V32 ko_name browser playback is pending integration with the UI worker; tests/qa-audio-v32-ko.html is a local-only fixture to copy temporarily into the managed preview, never publish in dist. No physical mobile-device or subjective listening verification is claimed.

Reproduce: node scripts/audio-v32/render-ko-name.mjs /path/to/brawl-voice-studio/dist; node scripts/generate-moves-page.mjs; npm test.

Release ownership belongs to finish_brawl_game, to merge into V32 without replacing their independent UI changes. This audio patch does not modify game/index import versions or deployment state.
