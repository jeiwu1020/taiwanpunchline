# V15 verification, 2026-11-06

## Scope and result

Nine continuous excerpts were added from the user-supplied Captures.zip; total playable move slots are now 15. Existing combat rules, core, roster, art and controls are unchanged. Six prior audio files remain byte-identical, while the two requested Huang moves now reference separately cropped V15 files. Han's knee move cue changed from 0.62 seconds to zero.

## Automated and independent checks

- Final full test run: 683 passed, zero failed/skipped/cancelled. Full output is in test-output.txt.
- Both page generators reproduce the checked-in output exactly; git diff --check is clean.
- Independent review found screen-recording metadata in the new derivatives and a missing reference caption. Both were repaired and independently rechecked. Eleven deployed V15 MP3 files retain only encoder metadata; decoded float32 samples match their prepared counterparts exactly after metadata removal. Provenance hashes match.
- All nine source videos decode fully. All eleven V15 MP3 derivatives decode successfully and preserve continuous source ranges. No synthetic speech, voice imitation, speech reordering or speed change was used.
- Temporary QA wrapper moved outside dist before packaging. Original videos, full recording audio and browser-frame evidence are not deployed.

## Browser verification

Official Sites preview and CUA browser were used, without alternate browser automation. All nine new move files and both shortened Huang files played through the real preview controls with the expected currentSrc, duration, active media state and advancing time. Each of the nine new moves was also triggered in an actual player round with keyboard input. The opponent was an unvoiced Su character to avoid unrelated voice interruption.

- Decoded/browser durations: rush 2.38s; counter 4.50s; arrow 2.05s; ma_gaze 1.22s; chen_question 1.85s; chen_calm 1.74s; ko_bags 1.29s; ko_name 1.60s; ko_resolve 2.20s; Huang first shout 1.35s; Huang final debt phrase 1.151882s.
- Han accepted keyboard I input: play at 24.9ms, playing at 38.9ms in one run. Mobile special2 pointer input: play at 54.5ms, playing at 68.4ms in the final run. These are single-environment observations, not universal timing promises. The former intentional 620ms cue is removed.
- Han file analysis at -35dB/25ms showed no leading silence; only final silence at approximately 0.505-0.567s.
- Audio stop, mute, muted play refusal, pause and return to selection were verified. Muting reset the media time to zero and blocked a subsequent play attempt until re-enabled.
- Desktop 1171x489 and iframe viewport sizes 320x568, 390x844, 667x375 had body scroll dimensions matching the viewport. The help dialog had no horizontal overflow at 320 and 390 widths. All 15 sample options were present.
- Final browser error/warning read showed no application entries after excluding browser-extension metadata errors. Test tabs were closed; the preview service was explicitly stopped and status confirmed stopped.

## Limits and pending clips

This runtime did not independently listen to the audio or authenticate speaker/source. The trial cuts use visible captions where present, two local speech-recognition models and pause/waveform evidence. They need human listening for exact phoneme edges. The Wang calm move keeps its approximately 4.5-second surrounding sentence; ko_bags onset remains uncertain by roughly 0.1 second.

The supplied 衝衝衝.mp4 and 要試試看嗎.mp4 contain seeking/replays/background speech and lack a sufficiently reliable phrase boundary, so they remain received but unbound. The latter's visible text uses 嗎; the game still uses its approved 嘛 name. 在那叫什麼 is absent from this ZIP. The three pending Su moves remain synthetic effects, not counterfeit original voice.

All source/reuse rights remain unconfirmed. This update is for the existing owner-private prototype only and is not evidence of permission for public or commercial reuse.

## Unchanged game hashes

- core.mjs: 949bd2cb75838379806cd3abc14e96d9d46eaf82ea196e0e39abd3ffd6befe47
- roster.mjs: e7fcd2ed255f230d4225abc83ab1347cd1df5e59e6d26fc7cbd8e38bd30fc0d3
- combat-rules.mjs: 174c8070128702eb8cf9596aa66497fa7a18c7c464b2b4dfb41ebb207b4c044e
