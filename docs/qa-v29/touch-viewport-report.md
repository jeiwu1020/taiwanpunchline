# V29 touch viewport and controls verification

## Scope

- `dist/viewport-boot.js`: blocking bootstrap directly inside the app, before header/game markup. Resolves saved rotation and safe-area geometry without waiting for Phaser or images. Disabled/corrupt storage falls back to visible defaults. Early resize listeners are released when the scene mounts.
- `dist/game-viewport.mjs`: camera display labels, boot-to-scene handoff, larger settings bounds and logical orientation data. Persisted `classic`/`stable` values are unchanged.
- `dist/interface-v29.css`: touch-only dock outside the arena; portrait rotation-off reuses the same joystick, guard, jump and attack controls.

Core combat, motion, voice assets and music were not changed by this work.

## Automated checks

Executed `node --test tests/touch-dock-v29.test.mjs tests/viewport-boot-v29.test.mjs tests/settings-viewport-v27.test.mjs`: 12/12 passed.

Executed full `npm test`: 1302/1302 passed at the time of the touch worker's check. Parent integration may subsequently add tests and must rerun the final aggregate.

Boot tests cover synchronous geometry before Phaser exists, four phone sizes, desktop, safe areas, visual viewport offsets, saved version-1 rotation-off, malformed/version-mismatched/blocked storage, and releasing startup listeners. Layout contract tests are not a substitute for browser rendering.

## Browser observations

Used a separate cloud Chrome tab on the already-running local `qa-viewport.html` page. Did not start/stop the preview service, commit, or deploy.

- 568×320 native landscape: control dock 546×104 at logical y=208. Three special cards approximately 107×91; guard/jump 44×44; attack 94×44. All controls inside the cabinet and clear of fighters. Move names 14px with purposes visible and 32px cooldown discs. Arena is approximately 156px high, resulting in standing characters around 50px high. This is the tradeoff for an unobstructed stage on the shortest screen.
- 844×390 native landscape: move cards approximately 199×91, names 16px, cooldown discs measured 36×36. Fighters approximately 110px high; no control overlap.
- 320×568, rotation off: dock 298×216 at logical y=343. Special cards measured 90×94; guard/jump 44×44; attack 64×64; joystick 82px. Full actions remain reachable inside the app. Tested both Wang and Huang. Huang's seven-character name `可以這樣插隊喔` wraps cleanly into two lines. Its purpose remains visible, and all three cards had scroll dimensions equal to their client dimensions (no clipped overflow).
- 390×720, rotation off: action groups remain inside the logical 720px height (joystick group ends y=701.5; move row ends y=599). Parent test-page toolbar makes the outer desktop page taller, but there is no internal game overflow.
- Reload with rotation off saved: the first accessibility observation still showed disabled/loading controls, while the app DOM already had `data-rotation="0"`, `data-layout="portrait"`, and `transform:none`. Saved upright mode resolves before scene readiness.
- Automatic pause when clicking the outer viewport-size controls and normal resume were observed repeatedly.

The final attempt to collect browser console logs timed out in DOMSnapshot capture; no console log claim is made. No visual blocker was observed in the completed size checks. This was desktop browser emulation, not an iPhone device test or audio listening verification.

## Shared test state

Only rotation was changed in the shared preview settings, ending at `rotate:false`; `camera` remained `classic`. Audio settings were not changed by this worker. Parent was notified and is handling final settings/audio verification.
