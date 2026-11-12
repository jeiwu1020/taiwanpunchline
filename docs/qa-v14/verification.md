# V14 voice integration verification

Scope: Existing owner-private Site only. Added the two explicitly uploaded files and three publicly downloadable audio elements from the supplied Kuo-Chang quote site. No YouTube media obtained. No voice synthesis, cloning, pitch/time change or rearranged speech. Core combat, rules and art unchanged. One user-requested display-text change: Chen's third move is now 有這麼嚴重嗎; the new video's audio is still unverified.

## Playable files
- Existing Han coin: original bytes preserved, SHA-256 eda509cd3c4847a52237c88dbdcfc71cfa660aeb06375000d290504bf8ab4492.
- User-uploaded 可憐哪: decoded 0.567229 seconds; original bytes unchanged. Cue .62 seconds after knee-walk starts, at the shout.
- User-uploaded 死亡之咳: decoded 7.340408 seconds. Full successfully decoded sample count preserved. One invalid source packet repaired by decoding/reencoding, highpass 25 Hz removes DC and gain 0.7 avoids clipping. This cannot recover missing source data. Cue .20 seconds after the move starts.
- Quote-site 太離譜了: 3.714195 seconds, full length, gain -10.44 dB; cue .10.
- Quote-site 我有欠你喔: 2.501882 seconds, full length, gain -12.85 dB; immediate cue.
- Quote-site 可以這樣插隊喔: 13.027417 seconds, full length, gain -8.23 dB; cue .10. Repeated speech intentionally not hard-cut based on unreliable ASR.

Source/processing manifests document the three catalog files. Local tiny ASR was unreliable for boundaries and cannot authenticate speakers. It was not treated as listening. All source authenticity and reuse-rights limitations are shown in the game and guide. Catalog-provided and user-provided status are distinct from originalVerified.

## Browser checks
Official Sites preview only, Chromium via CUA. After an initial browser error 9 and stale-tab protocol timeouts, a fresh single game page loaded and completed checks.
- All six preview options produced the correct media URL, non-paused playback, advancing currentTime, finite expected duration and no media error.
- Real player-input attacks triggered all five new clips: Ma O, Han I, Huang U/I/O. Han waited until the post-walk shout rather than move start. Exact cue timing/interruption is additionally covered by deterministic tests.
- Switching sample clips pauses the previous element; pause, stop, close, mute/voice-disable stop/reset playback. Background preview bug was independently found and fixed, with explicit blur/hidden-document regression tests for menu, paused and over states.
- Main document measured 320×568, 390×844 and 667×375 with matching scroll/client width and height, no outer page scroll. Help dialog is intentionally scrollable; measured no horizontal overflow. The 390px iframe exceeded the desktop test viewport height, so locator pointer targeting of its offscreen header failed; keyboard activation then verified the actual controls and sample playback. This is a QA wrapper constraint, not a claim of physical iPhone testing.
- Updated Chen third move visibly reads 有這麼嚴重嗎 on the menu and control.
- Final app console error/warning filter empty; browser extension metadata errors were excluded and recorded as infrastructure noise.
- This checks media playback state, not audible speaker identity, sound-system output, or precise lip sync. Long files can outlast their animation and are interrupted by the next available voice or lifecycle stop, as disclosed.

## Tests and review
Independent readonly review found no blocking issues after the background stop fix and the added-source delta. Final full test count is recorded in test-summary.txt. Core SHA-256 remains 949bd2cb75838379806cd3abc14e96d9d46eaf82ea196e0e39abd3ffd6befe47. No GitHub main changes. Temporary mobile harness moved out of dist before packaging.
