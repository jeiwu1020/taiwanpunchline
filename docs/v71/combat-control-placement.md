# V71 combat controls

## Delivered files

- `dist/combat-controls-v71.css`: final stylesheet after V70; original comic colors and upright-phone action cells remain.
- `tests/combat-control-placement-v71.test.mjs`: cascade and size-budget checks against every stylesheet linked by the real page, then V71.

## Behavior

- VS and street both show the existing independent blue jump control. Its visible text and runtime input handling are supplied by the parent integration.
- Special moves retain a two-line title. U, I and O are visible at 14px beside the live cooldown, rather than over the title.
- Special backgrounds fill from bottom to top using `--cooldown-ready`. The SVG pie is hidden; the existing live number and `s` suffix remain. Parent integration supplies the percentage.
- Desktop places the movement cluster on the left, special moves at the bottom center and five equal actions on the right. Wide desktop actions are 68px with 20px special names. A narrow desktop compacts movement into a 2×2 keyboard cluster and uses 54px action targets.
- Phone landscape and CSS-sideways share logical cabinet-width rules. The stick is 100px, special names are 18px, and all five actions are 54px.
- Cabinet widths above 700px keep the action group in one row. At 650px logical viewport width, only the right action group wraps: rally / assist above jump / guard / attack. This preserves reading order and readable labels without moving specials back above the actions.
- At logical widths of 590px or less, only the joystick reduces to 78px. All five action targets stay 54px, special names stay 18px, and hints/seconds stay 14px. This also covers 320×568 CSS-sideways.
- Portrait keeps the V70 specials row, assist/jump row and rally/guard/attack row. Only universal jump, keyboard-hint and cooldown changes apply.
- `.key-pressed` provides the same 2px depressed feedback as pointer-held buttons.

## Hand-checked budgets

- Portrait 320px: 100px stick + 3 × 54px actions + 4 × 6px gaps + 16px padding = 302px within 304px cabinet content.
- Landscape 740px: 100px stick + 264px minimum special group + 5 × 54px actions + 6 × 6px gaps = 670px within 700px control deck.
- Landscape 650px: 100px stick + 264px minimum specials + 3 × 54px action columns + 4 × 6px gaps = 550px within 610px control deck.
- Landscape 568px and 320×568 CSS-sideways: 78px stick + 264px minimum specials + 3 × 54px action columns + 4 × 6px gaps = 528px within the 528px control deck.
- Minimum special card: (264 − 12) / 3 = 84px; after 6px border and 6px horizontal padding, 72px fits four 18px glyphs. Seven-character names fit two 19px lines plus the separate 20px key/seconds row inside a 72px card.

## Verification

- Initial RED run: five new behavior checks failed for the missing VS jump, incorrect special placement, absent narrow wrap, hidden shortcut keys and pie-style cooldown. Existing portrait-cell guard passed.
- GREEN run: all nine placement tests pass, including a subsequent RED/GREEN test for narrow-desktop height reservation.
- Full-suite snapshot during parallel integration: 2,358 tests, 2,355 passed, three failed. The old concise-jump test still expected `跳`; two new street-render-context tests belonged to in-progress parallel work. Those files were not changed by this CSS task.
- Follow-up full-suite snapshot: 2,359 tests, 2,356 passed. The old jump expectation is now corrected. Three parallel-integration failures remain: `V39 entry and changed dependencies use new cache keys while prior history remains`, `street drawing does not opt its full-scene canvas into frequent CPU pixel readback`, and `draw-only context keeps full street resolution, paints every frame and survives resize`.
- Independent review added a 568px/native-sideways RED/GREEN regression. It initially failed at 550px required versus 528px available; the compact-joystick fallback now fits without shrinking action labels, special titles, shortcuts or seconds.
- These are declaration/cascade and width/height budget checks, not browser paint assertions. The parent owns browser QA at 320px portrait; 568/650/740/844px native landscape and equivalent CSS-sideways widths; and wide/narrow desktop. Verify seven-character names, live seconds, all five equal targets, keyboard feedback, and blocking-menu visibility.

## Compact rally status follow-up

- At logical landscape widths of 590px or less, the rally status has an explicit unpadded, non-shrinking single line at 14px/16px. `集氣中` needs 42px inside the unchanged 54px button's 44px content width.
- A RED/GREEN regression covers native 568×320 and CSS-sideways 320×568, plus guards that ordinary landscape and upright portrait status styling remain unchanged.
- No other action labels or target dimensions changed. Browser confirmation remains with the parent.
