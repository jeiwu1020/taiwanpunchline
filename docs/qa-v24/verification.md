# V24 portrait selection verification

## Scope and provenance

The owner-approved change replaces character and difficulty native pickers with seven in-game portrait buttons and two difficulty buttons inside the existing rotating app shell. Source baseline: `59248bd2257cce1f274687001e4bd212f08a7521`, the separate sideways Site. Original V22 Site is not a publish target.

Seven existing character images, role switching, mirror matches, replay, and match rules are preserved. Assets, combat rules, camera module and voice module are unchanged from the baseline. The separate help audio sample control is outside this selection-screen change.

## Automated checks

- Fresh final Node suite: 1,115 tests passed, zero failed/skipped (`final-test.log`).
- Deterministic combat soak: 588 rounds (`soak.json`).
- All `dist/*.mjs` syntax checks and `git diff --check` passed.
- New tests were observed failing before implementation for native-free buttons, loading safety, and visible difficulty selection markers; corresponding red logs are retained.
- Existing 49-pairing/replay tests now exercise actual portrait/role button handlers.

## Independent review

A read-only review exercised 98 fighter/difficulty combinations and selection guards during countdown, active, paused and completed states. It found pre-load role/difficulty clicks could reach uninitialized UI and the difficulty state depended only on color. Both are fixed with disabled loading controls plus a readiness guard and visible check/ring markers, with new regression tests. No other behavioral regression was found. Review did not claim browser layout coverage.

## Official browser checks

Cloud Chrome and the local viewport fixture were used, not a physical phone or Safari. Desktop at 1180 by 757, rotated portrait at 390 by 720 and 320 by 568, landscape at 844 by 390 and 568 by 320, and rotation-off portrait at 320 by 568 were exercised.

- Clicked portrait cards for each role and difficulty buttons, including a mirror match. All choices stay in the page; no native character/difficulty popup remains.
- Selected fighters and difficulty persist across orientation/viewport changes, start, pause and return to selection.
- Desktop keyboard Enter selected a portrait without changing the other role.
- At 568 by 320 all seven portrait targets measured at least 44 CSS pixels in height, and both difficulty controls and Start measured 44 pixels. All fit inside the menu.
- At upright 320 by 568, a card-name clipping issue was reproduced through scroll/client height measurement and fixed. Final check confirmed all seven card contents fit: inner height 45, content height 45, target height about 48.8 pixels.
- At 844 by 390, the menu measured 822 by 330, seven cards 106 by 126, and difficulty/Start height 44. Final screenshot confirmed readable names, role badges, selected outline, and visible difficulty checkmark.
- Final actual click flow selected Ma versus Chen on normal difficulty, started the correct match, paused and returned to the same selections.

An old browser tab timed out during final capture. The managed preview was still running; closing only task-created tabs and opening a fresh task tab resolved it. The final compact-card and landscape checks above were then completed. Preview was stopped after QA.

## Limitations

This validates cloud-browser layouts and DOM interactions, not physical touch hardware, iOS system UI, phone audio output or Safari. Combat/audio/camera assets and modules are unchanged in this roster-only update.
