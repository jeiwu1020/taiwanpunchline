# V20 landing camera and supplied voice verification

## Scope and cause
V19 introduced a background anchored to the camera and frame-by-frame midpoint framing. The world position of an idle player could stay fixed while the screen position appeared to drift toward an approaching AI. V19.1 retained a safe-zone camera and world-fixed background, but incorrectly limited zoom to decrease only. Jumping therefore left the view permanently zoomed out.

V20 removes that monotonic restriction. Zoom eases toward the fit target in both directions, with an immediate safety cap only where head/body coverage needs it. It retains the stable horizontal safe zone, ground anchor, wider framing and world-fixed generated background. This is a hybrid, not an exact restoration of all V18 parameters. Gameplay, movement, hit rules and AI were not changed.

## Automated and independent review
- Regression tests failed against V19.1 for landing recovery and the initial outward interpolation case, then passed with this fix.
- Focused camera tests: 13 passed.
- Full suite on final application files: 1,027 passed, zero failed.
- Independent reviewer verified three physics jumps at six viewport sizes, 3,780 frames of head/body/backdrop coverage, and 72 resize/edge/jump combinations. Standing zoom recovered in each series.
- Syntax checks passed for game, camera presentation and voice slots; git diff whitespace check passed.

## Actual browser checks
The QA fixtures call the real production simulation and render loop. They add buttons and visible telemetry only; these fixtures are retained under docs and excluded from the deployed dist.
- Desktop: two jumps started at zoom 1.12, reached approximately 0.7416 and returned to 1.12 by seven seconds. Player world x remained 260; y returned to 430. Screenshot showed feet on the stage and the chamber filling the frame.
- 320 by 568 phone-sized iframe: two jumps started at zoom 0.3743, reached 0.346 and returned to 0.3743 by 5.83 seconds. Player world x stayed 260, y returned to 430, and all ordinary controls fit within the frame.
- Clicking the actual first-special button on the phone-sized game selected chen-dream-user-candidate-v20.mp3. Its HTML media time advanced from 0.07 to 0.19 seconds, duration was 2.6 seconds, paused was false and error was null. Later it returned to the idle media state with no error. This verifies triggered playback and decoding, not direct auditory or speaker authentication.
- Some shared-browser reads timed out. Only this task's own tabs 244, 245 and 246 were closed; reopening a fresh own tab allowed the checks above. Unknown tabs were left intact.
- Official preview was stopped and status confirmed stopped after QA.

## Voice provenance and limitations
The new file is a continuous 7.020–9.620 second segment from the user-uploaded recording, with leading waiting time and a later separate vocal burst omitted. It is mono 48 kHz MP3, 2.600 seconds decoded, 42,624 bytes, peak approximately -6 dBFS and no clipped samples. No generated or imitated voice was used.

The user-facing move remains 有夢最美. The program title visible in the supplied recording says 有夢上水; the probable Taiwanese wording is inferred from that title and unreliable phonetic ASR, not independently confirmed by listening. Voice identity and reuse rights were not independently verified. The game's source notes disclose these limits. There are now 20 supplied playable voice slots out of 21 moves; 喝水回氣 still has no supplied human voice.

Only the existing owner-private Site is targeted. GitHub main, sharing settings and paid services are untouched.
