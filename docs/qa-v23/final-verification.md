# V23 integrated comparison verification

## Scope and provenance
- The original owner-private Site remains at https://parliament-rumble-nov5.jeiwu1020.chatgpt.site.
- Original source and published V22: `6af0e93b5719698dc2826abeb4c5d468c87b9965`.
- This is a separate private comparison Site, not an overwrite of the original.
- Integrated candidate source is preserved at `parliament-camera-touch-nov7`; publication source is the separate `parliament-sideways-private-nov7` checkout.
- Existing generated art, background image and audio bytes were retained. No new recordings or voice imitation were added.

## Automated verification
- Fresh complete Node test suite: **1108 passed, 0 failed**, 0 skipped.
- Fresh soak: **588 rounds**, all 7×7 matchups, both difficulties and six seeds; no invariant failures. Maximum 3 projectiles and 2 queues.
- All runtime and script `.mjs` files passed `node --check`; `git diff --check` passed.
- Background geometry includes viewport coverage and fixed-landmark regression cases across both arena edges, wide gaps and jumps. The pending background repair is now covered by the passing integrated suite.
- Multi-pointer ownership, portrait inverse axes and clear-on-cancel/orientation/pagehide are unit-tested. They are not a claim of real multi-finger hardware testing.
- Voice replacement and interruption rules pass the mocked browser/media harness. These checks do not establish what a person hears on Safari or iPhone.

## Official cloud Chrome browser checks
- Desktop: assets loaded, selection menu, start, pause, help, close help and return to selection.
- 390×720 portrait comparison: game rotates 90 degrees, menu/start visible, special move accepted and its protection/cooldown appeared.
- 844×390 native landscape: rotation 0, paused battle retained across the size change, resume and both camera modes worked.
- 667×320 short landscape: selected a different fighter, started the match, stage and movement/special/guard/jump/attack controls fit. Measured stage 645×260; touch controls remained within the frame.
- 360×640 small portrait: rotation 90, menu/start visible, help remained inside the frame (x12..348, y12..628), close worked, rotation-off fallback showed upright playable UI and could switch back.
- Browser console inspection did not identify an application warning/error at the desktop checkpoint. A Chrome extension metadata error was unrelated to the game.
- The shared preview was interrupted by another QA session. The interrupted final small-portrait check was repeated in a fresh browser tab after restoring the same source; earlier completed checks were retained.

## Limits
- These were cloud desktop Chrome pages and CSS viewport fixtures, not actual phone hardware, iOS Safari, orientation sensor, safe-area notch or browser toolbar tests.
- No physical multi-touch test or audible listening verification was performed.
- Successful specials request audio immediately. Muting, OS/browser playback restrictions, pause and KO may still stop playback; illegal/rejected inputs do not start a move or audio.
- No full visual sweep of every character and every special at every phone size was claimed.
