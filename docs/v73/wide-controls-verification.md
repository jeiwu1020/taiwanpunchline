# V73 wide controls

Scope: desktop and logical landscape only (native landscape and CSS-sideways). Upright phone controls and HUD retain the complete pre-V73 stylesheet cascade. No game input, combat, cooldown, or charge logic changes.

## Layout

- Desktop: square 64px direction buttons with thicker 32px arrows; five utility buttons follow; the three special cards fill all remaining space at the right. Utility gaps remain 8px.
- At cabinet width <=1000px: 54px buttons, a 2x2 direction cluster, 6px utility gaps, and a 300px minimum special group.
- At cabinet width <=736px: the utility group wraps into two rows. Specials remain on the right. At the tested 650px desktop viewport, the required 616px fits the 622px cabinet.
- Phone landscape and CSS-sideways: three 54px special cards span exactly the five 54px utility buttons beneath them. A 112px joystick stays at left. The minimum control footprint fits logical 568px width.
- Special keys are centered on desktop. Live seconds stay at the lower right; ready checkmarks are hidden. Separate name/footer rows allow seven-character names without collisions. All landscape keyboard hints are hidden. Upright phone hints are unchanged.
- Jump, guard, and attack labels share their top alignment. Desktop secondary hints and keys have separate vertical space.
- Wide HUD names are 20px and health tracks 11px. The full 70px HUD row is reserved above the canvas.

## Verification

- Inspected the desktop, landscape, and CSS-sideways reference image pixels before implementation.
- Initial V73 contract run: 5 failures for missing wide behavior, 1 portrait-preservation pass.
- Added red regression checks for utility hint/key clearance, special key/countdown separation, compact alignment, and narrow rally status before fixes.
- Final targeted run: 18/18 passed (9 historical V71 and 9 current V73 tests).
- Current tests use shipped HTML through jsdom and all linked CSS in cascade order. They cover both depth routes, desktop 650/740/844/1028/1200/1440, native landscape down to 568x320, CSS-sideways down to 320x568, and upright phone widths 320/390/430.
- V71 placement tests now explicitly retain their historical stylesheet set. V73 tests cover the current complete sheet set and intentional replacement layout.
- An intermediate full-suite run during parallel comic development had one unrelated “thrown blanket” frame-bound test failure. It was reported and corrected by the comic worker. A fresh independent full `npm test` run then passed 2409/2409 with zero failures.
- Read-only peer review completed; all three findings were fixed with regression coverage.
- `git diff --check` passed.

These are DOM/cascade/budget checks, not painted browser geometry or font-shaping proof. Parent-owned browser verification remains required for final desktop, native landscape, CSS-sideways, cooldown, and upright-phone comparison. No publication was performed.
