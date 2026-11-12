# V71 actual cloud Chromium browser checks

Run against the isolated V71 worktree via managed Sites preview and CUA. These are real browser UI checks at explicit iframe CSS viewport sizes, not physical iPhone/Safari testing. DPR was 1 in the performance probe. No production deployment yet.

## Controls

- 390×650 portrait VS/practice: existing V70 positions preserved; five equal utility actions including 跳躍 present. Three move names, U/I/O and ready marks readable.
- 844×390 landscape: joystick left, three specials bottom-center, five actions right. All action rectangles measured 54×54; all specials bottom 376, names and keyboard hints visible. Deck 20..824, no clipped action.
- 1200×750 desktop: directions left, specials center, five actions right. Clicking independent 跳躍 caused the player to jump. Real keyboard Space press measured `key-pressed` and translateY(2px); release cleared the class and transform. W/up aliases and clear/pause paths are additionally covered by input regression tests.
- 390×844 CSS-sideways (logical 844×390): same bottom-center arrangement. A real 喝水回氣 cast reported 9.7 seconds, readiness 3.8323%, bottom-up gradient, and old cooldown SVG display:none. Countdown and damage continued normally.
- 650×360 landscape: special row remains at bottom, right utility group wraps into two rows. No clipping or overlap in screenshot.
- 320×568 CSS-sideways (logical 568×320): deck scrollWidth=528 and clientWidth=528; all five utility buttons 54×54. Compact status fix rechecked visually: 集氣中 stays one line. Computed font14px/line16px, width42px, padding0, nowrap; deck clientWidth=scrollWidth=528.

## Challenge dialogs

Clicked chapter, character/skills and save tabs through ordinary UI. The logical dialog top stayed 8px across differing page heights:
- Desktop 1200×750: top=8 for all three; widths900. Dialog heights661.8125 /734 /524.765625. X top20, 44×44.
- Portrait390×650: top8 and height634 for all three; X top20 at right corner.
- Landscape844×390: top8 for all three, heights350.03125 /374 /374; X top20 at right corner.
- Sideways390×844: rotation90; all right edges382, matching logical top8. X remains logical top-right, not center column.
- Scrolled portrait skill tree to scrollTop1197. X remained at top20, 44×44, and clickable.

Character picker, skill definitions, storage schema and battle mechanics were not changed by this batch. Existing save regression tests remain required in final suite.

## Actual mode transition

Entered the normal challenge through its three opening cards, retried a street checkpoint, moved right and jumped with Space. The player and street foreground remained visible over the retained high-resolution scene. Returning through the visible home-confirm selector and starting a normal VS match restored the original council chamber and both duel fighters, with no street backdrop left behind. No save migration or reset was performed.

Final post-bleed cached scene was visually inspected in the actual Phaser Canvas browser probe. It matches the baseline world mirroring and actor layout, without a visible full-height tile seam. Native pixel coverage tests additionally verify alpha255 throughout desktop, portrait and jump-pan interiors. Full final suite:2363/2363 passing.
