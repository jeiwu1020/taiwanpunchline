# V28 verification

## Scope and rollback
V27 source 3b6827bcd3d3cc94ee58892f2b65010320e80932 was archived before edits. V28 adds only the two user-selected licensed music tracks, music controller, independent saved preferences and credits. Combat modules, animations, roster, stage rules and voice assets are unchanged. Original V22 Site is not a deployment target.

## Automated checks
- Final complete npm test: see full-test-final.log.
- 29 controller tests: looping, per-track resume offset, round reset, no overlaps, immediate silence, hidden/suspended context recovery, load/decode failures, retries and stale async protection.
- 4 integration tests: saved music defaults/migration, independent music controls, real game state routing, required credits.
- Existing settings, combat, voice, art and viewport tests retained.
- 588-round deterministic soak: see soak-final.json.

## Official cloud browser QA
Cloud Chromium, not physical iPhone/Safari. Tested desktop and logical 320×568 portrait sideways / 568×320 landscape via the existing viewport fixture. Settings music controls remained reachable by scrolling; music volume/mute saved across reload; reset cancel and confirm exercised; confirmation restored 22%. Credits and full historical disclosure remain available.

Observed in actual game: first interaction unlocked Fluffing; start/countdown selected Run Amok; pause kept battle track; settings selected Fluffing, closing returned to Run Amok while combat remained paused; independent music mute and master mute worked. One Han voice preview played concurrently with Fluffing and had no media error. About attribution links and edit description rendered. Full result/replay routing is automated-tested; a full round ending was not completed in this browser session.

A separate UI-driven harness imported the production music controller with real AudioContext, official local MP3 files and an analyser. Both decoded and played: Fluffing duration31.4599773s, Run Amok104.05s. Both crossed loop boundaries without a new source. The max active source count remained1; switching preserved offsets (e.g.battle17.85034s), hiding stopped the source, showing resumed31.56034s, and newround restarted at0. Zero volume produced RMS0; 25% Run Amok peak RMS~.040 and 100%~.171 in sampled portions (not a controlled loudness comparison). No claim that these different samples are identical in musical loudness. Harness retained in tests/qa-music-v28.html, not deployed.

Browser console sampling showed extension metadata errors from chrome-extension://, not game/audio errors. AX/screenshot capture occasionally lagged one state; subsequent DOM observations confirmed final states. Rotated iframe automated locator clicks missed the target, so coordinates from the fresh screenshot were used successfully; native pointer opened settings. No issue requiring a game code workaround was found.

## Asset validation and limitations
Official Incompetech track/catalog/license records saved in music-evidence. The composer is Kevin MacLeod, license CC BY4.0, attribution and alterations visible in Settings > About and assets/music/CREDITS.txt. Original downloads retained.

Fluffing uses first rendition0–31.460s with10ms fade-in and510ms fade-out; next strong measured onset~31.475s. Its original boundary has quiet decay, not exact silence. Run Amok uses0.800–104.850s with5ms/150ms fades. Decoded PCM passed finite-sample/no-clipping checks and hashes match records.

No subjective listening verification, physical iOS/Safari, hardware-volume or real phone interruption testing. Functional loop playback is verified, not musically seamless phrasing. Mid-song track changes stop/start immediately and may have a click; they do not overlap. Default22% is a conservative mix and remains user-adjustable. CC BY4.0 applies only to these two music tracks, not the previously supplied voice clips.
