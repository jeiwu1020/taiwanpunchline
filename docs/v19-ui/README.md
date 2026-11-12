# V19 solid cooldown and item-status handoff

## Delivered

- Result action now says **更換角色**. The existing reselect listener and touch target are unchanged.
- Every U/I/O button contains a filled SVG sector, not a stroked ring. The visible brown area is proportional to true remaining cooldown, starting at 12 o'clock and decreasing clockwise. A full cooldown uses two arcs to draw a complete disk; zero clears the sector and shows the existing green check and 就緒.
- Numeric seconds remain centered and outlined for contrast. There is no opaque round center or inner-radius cutout, so the indicator remains a pie rather than a donut.
- The three move names, keyboard labels, control sizes, and countdown accessibility remain intact. Visible tenths still round upward; positive remaining time never displays the ready check. Accessible remaining seconds change at whole-second boundaries, not at every rendered frame.
- Added one non-interactive item-status slot below the existing HUD. It is visible in portrait and landscape, without taking height from the stage or controls. No item logic, game rules, camera, or assets were changed.

## Item integration contract

Use the existing unique element `document.querySelector('#item-status')` and set `textContent` only when the displayed state changes.

Suggested text:
- Empty hands: `走近拿道具 · 攻擊鍵投擲`
- Holding paper: `持有：搞笑紙團 · 攻擊鍵投擲`
- Holding duck: `持有：吱吱鴨 · 攻擊鍵投擲`

The element has `role="status"`, `aria-live="polite"`, and `aria-atomic="true"`. Do not rewrite it every frame or use it for a continuously announcing numeric timer. The slot does not add a button or intercept input. Game integration owns resets on reselect/replay and updates after pickup/throw.

The slot is the second grid row in `.dom-hud`, spanning all three columns and centered. Its size is 10px text with a 12px line height on desktop; 9px text on mobile; 11px line height in short landscape. Max width is 100%, with one-line ellipsis only for unexpectedly long text. The normal supplied prompts fit the available stage width by declaration budget. Existing HP/status/HUD content is unchanged.

Allow additional HUD height of **21px desktop, 19px mobile portrait, and 18px short landscape**, including the 3px row gap. The slot is HUD-only and sits under opaque menu/result overlays, as existing HUD does. Parent camera integration and actual browser QA must ensure the new lower HUD boundary does not overlap enlarged fighters.

## Exact files to integrate

Production:
- `dist/index.html`
- `dist/style.css`
- `dist/cooldown-view.mjs`

Tests/fixture:
- `tests/cooldown-ui-v18.test.mjs`
- `tests/cooldown-layout-v18.test.mjs`
- `tests/cooldown-sector-v19.test.mjs` (new)
- `tests/qa-voice-cooldown-v18.html` (existing diagnostic fixture updated to the new path markup)

Documentation:
- `docs/v19-ui/README.md`

`v19-ui.patch` is an incremental patch against supplied V18 baseline 1c356909. It contains only the files above. Do not replace the whole isolated tree because the parent is integrating game/core/art work separately. Index cache version and V18 release label are intentionally left for the parent to bump with the complete V19 release. The source/audio provenance text remains unchanged except for replacing the gameplay explanation of the old ring with the new filled pie.

## Verification

- Baseline focused checks: 11 passed.
- TDD red: 8 intended failures in sector geometry, filled markup/paint, item slot, and renderer updates; 5 unchanged checks passed. `red.log` preserves the run.
- Focused green: 16 passed after implementation. `green.log` preserves the run.
- Final full `npm test`: **860 passed, 0 failed**. `suite.log` preserves the run.
- `node --check dist/cooldown-view.mjs`: passed.
- SHA-256 comparison confirms `game.mjs`, `core.mjs`, `roster.mjs`, voice configuration/controllers, and moves guide unchanged. `unchanged-baseline.sha256` records exact files.
- CSS budget tests cover 320×568 and 390×844 portrait; 568×320, 667×375, and 844×390 landscape; desktop wrapping and reduced motion. All seven cast members initialize their actual three cooldown labels.
- Geometry tests independently inspect full/three-quarter/half/quarter sectors, verify center-connected paths, ensure colored area decreases with true remaining time, and cover zero/invalid/overflow endpoints.

No browser/headless preview, screenshot, commit, deployment, push, or main-branch action was performed by this worker. Static declaration tests are not a replacement for actual font/layout painting. Parent must use the authorized 4173 browser flow to check selection, combat, result/reselect, long names, item prompt visibility, fighter clearance, and full/half/nearly-empty/ready pie states at all target viewport sizes.
