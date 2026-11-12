# V52 match-finish presentation

Implemented a presentation-only ending after the core has already fixed its winner and changed status to `over`:
- 140 ms freeze, 1000 ms visual slow-motion defeat imbalance/winner settle, then a 500 ms named-winner beat and the existing result screen.
- A final-pose snapshot is captured before combat cleanup. The rendering copies cannot deal damage or change the outcome. Timeouts use a gentler settle rather than a fake knockout. A double knockout remains a draw.
- Match input and buffered commands clear immediately. Replay/reselect require a fresh pointer or keyboard press after the result is ready; trusted assistive activation is supported, and known repeated keys are still blocked.
- Music is not time-stretched. Existing voice/effect sources stop at match end; visual tweens alone use the presentation rate. Camera and background stay fixed except necessary viewport resizing.
- Reduced-motion uses a static 650 ms named-text variant. Frozen hit flashes are removed.
- Backgrounding suspends the presentation clock. Menu, home, start/replay, and result cleanup drop presentation state synchronously. There are no result timeouts to reopen an old screen.

## Validation

- `node --test tests/*.test.mjs`: 1875 passed, 0 failed after the cap-25 integration and final finish changes. Full output: `full-suite.log`.
- Syntax checks: `dist/game.mjs`, `dist/core.mjs`, `dist/match-finish.mjs`.
- `git diff --check`: passed.
- New targeted tests: `tests/match-finish-v52.test.mjs` and `tests/match-finish-ui-v52.test.mjs` (10 tests). Exercise real lethal-hit flow, post-over no damage, timing, timeout winners/draw, double KO, reduced motion, held attack/replay, keyboard repeat, trusted assistive activation, audio stops, blur/visibility suspension, home/menu/reset cancellation.
- CUA browser checks used the supported local Sites preview. Verified actual Canvas knockout freeze/settle and winner text; normal result/replay on desktop and an 844×390 touch-layout iframe; timeout text; double-KO draw text; reduced-motion named-text variant. These are desktop browser layout checks, not a physical-phone or screen-reader test.
- Saved screenshots: `finish-desktop-winner.jpg` and `finish-phone-settle.jpg`. The small bottom strip contains temporary local QA controls, not shipped UI.
- Interactive fixture builder: `node tests/qa-v52/prepare.mjs`. It creates three temporary dist files; run `node tests/qa-v52/prepare.mjs --clean` before packaging. Cleanup has been run; no QA globals or controls are shipped.

Standalone shell Chromium was unavailable under the environment's Unix socket restriction. Browser QA was completed through the supported CUA preview instead.
