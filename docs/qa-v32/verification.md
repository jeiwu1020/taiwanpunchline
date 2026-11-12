# V32 verification and remaining limits

## Confirmed defects and fixes

Desktop guard was in the DOM but hidden by the touch-only container rule. The same held guard control is now exposed beside attack, labeled 防守 and K／左 Shift. S/down remain crouch; no guard mechanics changed. The phone stick was 56px in V30. It is now 84px with a 40px knob and a larger inset, wholly inside a reserved dock so it does not cover a fighter. The dock is 98px in landscape and 184px upright; the camera implementation is unchanged and continues to fit the smaller available canvas.

Both old viewport implementations unconditionally trusted one visualViewport sample per event. A reproducible model showed that after a landscape-to-portrait change, a stale landscape sample could leave rotation=0 until a further browser event. Offset-only changes did not release held pointers. The V32 code rejects clearly orientation-mismatched stale sizes at normal zoom, resamples for bounded settling, clears active input immediately, and gates fresh gameplay input during the transition. The bootstrap-to-mounted handoff also continues settling rather than discarding pending samples. The fullscreen document's scroll is reset on orientation/pageshow/root-scroll; settings/menu internal scrollers are left alone.

Button targeting is still native DOM hit testing. The joystick still reads its current DOM rectangle on each move and uses the existing inverse rotation. An independent property check passed 24,300 translated/scaled/rectangular points at both 0 and 90 degrees; no replacement coordinate correction was invented.

This establishes and repairs synchronization defects. It does NOT prove that the user's exact iPhone visual-layer/hit-region disagreement has been reproduced or fully resolved. A browser-reported offset that has matching dimensions can still be stale in ways geometry alone cannot identify; valid visual viewport offsets are intentionally preserved. The settling cap is 12 animation frames, not an indefinite guarantee about Safari compositing.

## Validation completed

- Full integrated test suite: 1,390 passed, 0 failed, no skips. See full-with-audio.log.
- Added red/green regressions for delayed viewport dimensions, late safe areas, immediate held-input release/readiness, offset-only movements, root scroll, valid pinch zoom, and the bootstrap handoff. See viewport-red/green and handoff-red/green logs.
- Control CSS budgets cover logical 320 upright, 480/568/844 landscape and rotated portrait. The 84px stick fits its reserved row, attack/guard remain adjacent and at least48px, and all three move cards retain allocated space. These are stylesheet/geometry checks, not screenshots.
- Independent reviewer additionally exercised two-pointer production bindings through viewport transitions: both captures released immediately, transition presses rejected, no held action resumed accidentally, fresh presses worked afterward.
- Deterministic 588-round combat soak outcomes match V30/V31: easy268 player/26 enemy/0 draw; normal222 player/71 enemy/1 draw. See soak.json.
- Core, roster/moves, actor drawing/motion, touch pointer math, camera and music-controller source are byte-unchanged from V31. Only the approved ko_name audio is added on top of its20 reviewed clips.
- Syntax checks and git diff --check passed. Independent viewport and integration reviews found no remaining blocker in the inspected code.

## Audio integration

All20 V31 clips and metadata remain unchanged. ko_name uses the user's new source range5.177–6.219 seconds, exactly50,016 frames/channel at48kHz stereo, duration1.042 seconds. PCM16 active RMS is approximately−20.001dBFS and peak−6.665dBFS, with5ms fades, no clipping, and no resampling or speech synthesis. Original files remain available. Detailed source hashes and frame checks are in docs/audio-v32/verification.md. Subjective listening is not claimed.

## Browser verification blocked

Official Sites preview started successfully at the returned URL. A new CUA Chrome tab opened the QA page, but the game inspection failed with Runtime.evaluate timeout and then DOMSnapshot.captureSnapshot timeout. The documented native fallback obtained a screenshot of Chromium's existing renderer error9, but a keyboard action failed with AT-SPI provider unavailable. No other browser-control route or denied DevTools emulation was used.

Thus V32 final visual layout, actual pointer hit testing, repeated live-browser orientation cycles, live root-scroll behavior, physical safe areas and the new ko_name browser decode/playback were NOT verified. Existing V31 browser verification covers the unchanged20 audio files only. The QA page has explicit controls for viewport cycling, simulated safe insets, root-scroll attempts and DOM elementFromPoint reports ready for a functioning browser.

No physical iPhone/Android, Safari or simultaneous real two-finger test was performed. Automated two-pointer routing is not described as a physical touch test. V30 visual results are not relabeled as V32 passes.

## Preservation and publication

V30 commit e248af9d6947c306c7b66baf3044be00cc953680 and its full archive remain preserved. The immediate audio V31 baseline is5a14fe376b2bd07bae6846b9dad6a7958eea7f2d; a complete pre-UI backup is parliament-v31-before-touch-5a14fe3.tar.gz, SHA2569f62c7137363ef8d0954dcb2df6043720895945df93ae9143b323ee47850463a.

The final release JSON outside the source checkout records exact pushed commit, saved version, deployment result, source/archive hashes and original V22 verification. Publication does not change audience or the separate original V22 Site.
