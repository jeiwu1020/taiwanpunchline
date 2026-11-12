# V34 scoped browser gesture fallback

## Evidence and scope

- V33 `mobile-game.css` intentionally used `touch-action: manipulation` on the body, shell, and canvas. Manipulation permits pinch zoom. Its tests explicitly required that behavior, so a passing V33 suite could not demonstrate the newly requested battle pinch lock.
- The user reported that repeated real-iPhone taps on/near the joystick still enlarged the page. V33 had no native TouchEvent or Safari GestureEvent fallback. A desktop CSS assertion cannot reproduce or certify that browser behavior.
- V34 adds `mountBattleGestures({root, isProtected})` in `dist/battle-gestures.mjs`. The integration owns the combat/settings state and scoped cabinet CSS. The guard owns only listeners and gesture-sequence bookkeeping.

## Integration contract

- Mount once on `#viewport-shell`. The same root returns the same instance on repeated mounting. `isProtected()` must be true only during the intended protected combat/countdown state and false while settings are open. The integration excludes pause screens from the CSS lock as well.
- Apply the primary `touch-action: none` policy to the active battle cabinet, never the document, body, shell, or settings dialog. A descendant cannot override an ancestor's restrictive touch-action, so menu/pause/settings access also depends on removing the cabinet lock in their native state.
- Call `guard.reset()` when unlocking combat and on relevant viewport interruptions. This drops only gesture ownership, not gameplay pointer state. It handles transitions where settings live outside the root and no touchend reaches the guard.
- `guard.destroy()` removes the owned listeners and permits a later fresh mount.

## Behavior

- Root-only, capture-phase, explicitly non-passive listeners handle touchstart, touchmove, touchend, touchcancel, gesturestart, gesturechange, and gestureend. Only cancelable protected start/move/end events are canceled. Touchcancel only releases bookkeeping.
- A touch beginning inside the cabinet, control dock, or joystick region remains owned when dragged away. Transparent gaps targeted at the shell/app are accepted only inside the live physical cabinet rectangle, which also works after a 90-degree CSS transform.
- Header, toolbar, under-page text, menu/pause/result screens, dialogs, links, text fields, editable text, labels, summaries, native buttons, and explicit `[data-native-gestures]` regions are excluded. Gameplay buttons carrying data-hold/data-action inside the control deck remain protected.
- Unknown contacts and native/outside contacts make the complete touch sequence native until all fingers lift. An inactive-to-active state change cannot adopt an already-held native touch. New touchstart snapshots recover from missing prior touchend events.
- Safari gesture events follow their starting ownership, including shell-retargeted gestures and gestureend arriving after the final touchend. Native contact arrival or a reset releases the gesture latch.
- No click synthesis, stopPropagation, stopImmediatePropagation, pointer cancellation, viewport scale cap, global gesture listener, combat change, or audio change is introduced.
- The guard cannot intercept touches originating on the body outside its root. Browser-specific native gestures, browser chrome, and operating-system accessibility zoom remain outside a web page's guarantees.

## Verification

- The new tests were run before the production module and failed for the missing fallback. Later regressions were also observed failing before their fixes: a native contact arriving after gesturestart retained a stale latch, explicit lifecycle reset was absent, and reset needed to retain old contact identifiers as native to reject a subsequent stale gesturestart.
- `node --test tests/battle-gestures-v34.test.mjs`: 16 passed. These execute real Event cancellation and the production module with only DOM/TouchEvent boundaries substituted. PointerControls remains the production implementation.
- `node --check dist/battle-gestures.mjs`: passed.
- An initial full `npm test` run during concurrent integration had 1414 passes / 1432 tests. Its 18 failures were ReferenceError failures in the legacy crouch and roster UI VM harnesses because they had not yet imported the newly integrated `mountBattleGestures`. After the integration owner updated those harnesses, a fresh full run passed all 1432 tests with zero failures. Log: `/tmp/battle-gestures-v34-final-suite.log`. The release owner still needs to verify any subsequent changes.
- These unit checks do not reproduce physical iPhone Safari gesture recognition or prove actual zoom suppression. Final browser/device QA must exercise repeated taps near all stick edges, two-finger joystick+attack, deliberate battle pinch, settings pinch/scroll/range inputs, pause/menu transitions, orientation changes while held, and native zoom outside the battle.
