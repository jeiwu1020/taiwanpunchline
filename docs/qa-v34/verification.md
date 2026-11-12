# V34 — battle gesture boundary and side-rotation overlay

## Baseline and authorized change

Published V33 source: `7ed11fc7468b9b19cbe8998f418e1c4440081173`, Site saved version 11. Full pre-edit source backup `parliament-v33-before-gesture-7ed11fc.tar.gz`, SHA-256 `f6ecd61db63bfd3f9b74c244df6874964f43e7a625cea93e04d9e904ffc10ad0`.

The user reported real-device repeated-tap enlargement, pinch enlargement and missing overlay with side rotation enabled. V33 intentionally allowed canvas pinch and explicitly limited overlay to zero rotation plus physical landscape. These two source conditions are confirmed. The exact real-iPhone repeated-tap path was not reproduced in this environment.

## Implemented boundary

- One `overlayControls` flag at synchronous boot and runtime enables the same CSS/camera adapter for rotated portrait and native touch landscape. Upright rotation-off portrait, and desktop, retain their original docks. Physical nativeLandscape remains diagnostic only.
- Only countdown/active `.cabinet[data-gesture-locked="true"]` uses `touch-action: none`. State is synchronized on start/countdown finish, pause/resume, result, menu and settings transitions. Settings, menu, pause and result text retain native browser zoom/scroll; no viewport maximum-scale or user-scalable lock is added.
- Scoped, non-passive TouchEvent/Safari gesture listeners add a fallback inside the game root. They cancel protected browser defaults without stopping propagation, synthesizing clicks, or changing PointerEvents. Native/outside contacts never become gameplay-owned mid-sequence. Reset on clearHold/unlock preserves old IDs as native so they cannot be captured on resume.
- Parent/shell safe-area margins remain manipulation, not a blanket pinch lock. Browser chrome, OS accessibility zoom and touches outside the protected game surface are not controlled by this code.
- Cooldowns, combat core, collision/world limits, artwork, voice selections/controllers and music remain unchanged. All 101 existing assets match V33 by SHA-256. Name remains 拳民開講 and the existing owner-private URL is retained.

## Verification

- 1,432 Node tests pass, including 16 gesture fallback tests and new overlay boot/runtime, combat-state and CSS boundaries.
- 588 deterministic simulated matches pass.
- Existing real PointerControls tests cover independent joystick/action fingers, diagonal input, releases and 0/90-degree geometry. These are synthetic event/engine tests, not physical touch testing.
- All JS/MJS syntax checks and git diff --check pass. Full logs and preserved-asset hashes are in this directory.
- Initial integration run had 18 VM-harness ReferenceErrors because new module imports were missing from two legacy test contexts. The contexts now use the real module; the full suite passes afterward.
- Independent review and browser observations are recorded below when completed. No source-level check alone establishes actual Safari double-tap or pinch behavior.

## Final independent review and browser observations

Independent review passed 44 targeted checks and the 1,432-test suite, with no confirmed release blocker. It notes that a native JS exclusion cannot override an ancestor touch-action:none. The current native screens avoid that issue because the cabinet unlocks for them and settings is outside the cabinet.

The official shared preview was obtained only after the other worker released it. Browser QA used a clearly labeled frozen-pose fixture with production CSS, art, camera/viewport and DOM controls, not the live Phaser game:

- 390×844: rotation 90°, nativeLandscape false, overlayControls true; logical canvas 828×288. All six targets' centers hit the correct element with zero measured target overflow. Rotated screenshot was partially cropped by the screenshot viewport, so it is not counted as a complete visual check of this size.
- Resized the same iframe to 844×390: rotation 0°, both overlay/native true, same 828×288 canvas and six correct target hits. Full screenshot showed HUD, fighters and all overlay controls with the long-name fixture labels.
- Resized to 320×568: rotation 90°, overlay true, logical canvas 552×218. Full screenshot confirmed HUD, full character bodies, joystick, three long-name cards and separate attack/guard within the physical frame. Six targets hit correctly with zero target overflow.
- Resized to 480×320: rotation 0°, overlay true, canvas 464×218. Six targets hit correctly; joystick 84×84, guard/attack 54×54, move cards 72×60. No final screenshot at this size was obtained.
- The following Measure click timed out at Runtime.evaluate, and fresh DOMSnapshot observation also timed out. Browser interaction/settling, physical pinch/double tap/multitouch, settings pinch, orientation while held and full live gameplay remain unverified. Early fixture reports show viewportReady false while settling; no successful gameplay action is claimed from those reports.

No real iPhone was available. These rendered/DOM measurements establish the new overlay condition and layout, not native Safari gesture suppression. Browser and OS-level accessibility zoom remain outside the guarantee. The user should reload V34 and try repeated joystick taps, battle pinch, then joystick-plus-attack, comparing settings/pause text zoom.

All three temporary dist/qa-v34-*.local* files were removed. The official preview was stopped and released; only reproducible test fixture sources remain under tests/fixtures.
