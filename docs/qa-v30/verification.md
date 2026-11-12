# V30 verification

## Scope and preservation

The HUD occupies its own compact row above the fight canvas. The camera no longer subtracts a second HUD margin. Phone landscape has stick, three move cards, attack and stationary guard in a single dock. Phone jump uses joystick-up; desktop jump remains. Upright touch controls stay below the stage. Visual low rails mark the existing arena edges without adding collision objects.

The V29 source was backed up before changes to parliament-v29-before-camera-f9c5719.tar.gz, SHA256 9c7bee81dc9c4eba11b6b15904d446623c1cefa0017599424b5e8502bb363f6f. The exact prior commit is f9c571908306e712a1ba1ef9b86b041979b00522. The original V22 Site is a different project and is not modified.

Core combat, roster data, actor drawing/motion, touch event routing, voice slots/channels, music controller and all assets are byte-unchanged from V29. Changes to game.mjs only import the new presentation module and add fixed-world decorative boundary graphics. Historical source verification confirms V18/V19/V29 use the same 68..892 fighter-center limits, ground 430 and basic movement/separation geometry. This does not claim all combat behavior has been unchanged since V18.

## Automated checks

- Final full suite: 1,328 tests passed, no failures, skips or cancellations. See full-final.log.
- Camera-focused tests: 27 passed. Independent review additionally exercised 36,000 random sequential frames across both camera modes and canvas dimensions from 1x1 through 2000x500 for finite frames, body fit and background coverage.
- Two-pointer production-binding regressions: 6 passed, covering independent joystick plus attack/guard pointers, release/cancel and rotation/page-hide cleanup. These are simulated pointer events, not physical two-finger tests.
- Deterministic 588-round combat soak matches V29 outcomes: warm-up 268 player / 26 enemy / 0 draw; formal 222 player / 71 enemy / 1 draw. See soak.json.
- Syntax checks passed for game.mjs, arena-presentation.mjs and arena-boundaries.mjs. git diff --check passed.
- The complete legacy information block remains byte-identical to V29, checked by a regression test.

## Official cloud-browser visual checks

Used the supported Sites managed preview and Chrome through CUA. Viewport sizes were embedded preview dimensions, not physical-device emulation. Screenshots and read-only DOM measurements were inspected.

- 568x320 touch landscape: fight canvas 552x148, HUD 54 high, compact dock 70 high. Three cards fit with no content overflow. Attack and guard are side by side, 54x54. Standing and jumping fighters stayed in view; the camera zoomed out during the observed jump.
- 844x390 touch landscape: fight canvas 828x218. Full characters and controls fit; the observed airborne pose remained within the stage.
- 320x568 upright touch: stage above the two-row dock. Activated armor status originally squeezed the guard label; a separate fourth HUD row now keeps guard and status each 8 high without overlap. Three move cards fit.
- 320x568 with 90-degree rotation: fight canvas 552x148; rotated card and attack/guard bounds remain inside the view. Settings toggle, close and resume were exercised.
- 480x320 available landscape width: models reduced logical width, not real device safe-area behavior. A seven-character move name exposed clipped purpose text. An 82-high dock at this width fixes the overlap; all three cards measured 80x68 client and scroll sizes, with title and purpose separated.
- 1180x690 desktop: fight canvas 1152x510, compact 62-high dock. Three move cards stay on one row. Full standing figures remained visible.
- 844x390 desktop: fight canvas 816x210. Three move cards stay on one row. The inherited attack-button row layout was fixed to a column; final attack button measured 62x40 client and scroll size, with the two-character attack label horizontally displayed.

Menu/start, pause, settings and resume were exercised across the matrix. Natural low edge markers were visibly present. Camera zoom/framing tests cover long-distance and jumping envelopes beyond the few live poses observed.

## Limits

No physical iPhone/Android, Safari, true simultaneous two-finger input, device notch/safe-area measurement, or independent audio listening was performed. Audio and music were not changed, and their automated regression tests passed; browser audio permission branches were not re-run. The browser was muted for layout QA. No claim is made that every pose of every move was visually inspected. No battle-interruption or move-duration design changes are included.

Publication identifiers, exact final commit, source/archive hashes and original-site verification are recorded separately in the final release JSON, after successful publication.
