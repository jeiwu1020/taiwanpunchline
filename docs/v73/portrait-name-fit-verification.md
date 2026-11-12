# Approved portrait D and single-line move names

This follow-up replaces the earlier V73 decision to leave upright phone controls unchanged. The portrait HUD remains unchanged.

## Implementation

- Fixed utility targets: 52x52px. Fixed special targets: 110x52px.
- The specials wrapper remains a positioned, measurable 226x110px grid. Move 1 is below move 2; move 3 is upper right. Its empty lower-right cell has no pointer hit interception, leaving assist/jump usable underneath.
- At 320px portrait, the joystick shrinks to 56px; at 360px it is 96px. At 375/390/430px it stays 100px. Button sizes never shrink.
- All phone keyboard hints are hidden. All move names stay on one line. Horizontal card padding is 1px; external card dimensions and approved desktop/landscape placement are preserved.
- `dist/special-name-fit.mjs` exports `mountSpecialNameFit({document})` and `fitSpecialNameSize`. The parent owns its game entry wiring.
- The fitter measures native Canvas text using the actual computed family/weight, and uses local `clientWidth` so CSS-sideways rotation cannot swap width/height. It reacts to name, resize, layout and font-load events, coalesces work, caches unchanged measurements, and ignores cooldown mutations. No game-frame polling, persistence or game-state mutation.
- Font size never drops below 12px. Unexpected unfit text emits `specialnamefitoverflow`, exposes diagnostic data attributes, and is made visible rather than silently clipped. None of the current 21 names require this fallback.
- `destroy()` cancels pending work and disconnects observers/listeners. Repeated mounting replaces the previous binding.

## Native Canvas audit

The optional audit script uses a separately installed native Skia Canvas and registered Noto Sans CJK Bold, without adding production/project dependencies. It reads every actual move from CAST, not invented fixtures. Full results are in `special-name-canvas-audit.json`.

Longest name: 可以這樣插隊喔 (7 characters).

| Mode | Available name width | Font size | Measured text width |
| --- | ---: | ---: | ---: |
| Portrait, fixed 110px card | 102px | 14.4px | 100.735px |
| Landscape / sideways, 94px card | 86px | 12.1px | 84.656px |
| Compact desktop minimum, 96px card | 88px | 12.4px | 86.734px |
| 1200px desktop | 155px | 20px | 140px |

All 21 names fit in all four audited geometries with at least the 12px minimum. Short names retain their normal 18/20px size. Browser-specific font fallback still requires actual-browser checking.

## Verification

- TDD: missing module/layout failed first; fixed-size, positioning, fit-floor, event lifecycle, cooldown isolation, and label-width tests then passed.
- A four-character secondary hint initially exceeded the 52px utility's inner width. Red regression caught it; 1px horizontal utility padding now preserves the complete hint.
- Parent CUA reported 320/360/390/430 portrait cards at 110x52px with the longest name at 14.4px; 568/844 landscape at 12.1px; all nine interaction targets non-overlapping. Parent also confirmed all 21 names and post-rotation fit.
- Read-only peer review found no remaining geometry, lifecycle, or pointer-layering blockers.
- The two existing VM test helpers, `tests/helpers/game-harness.mjs` and `tests/helpers/game-imports.mjs`, replace only the browser-layout mount with a no-op boundary. Their fake DOM deliberately has no Canvas/layout observers. Production fitting is still exercised by dedicated jsdom event tests and the native Canvas audit; production code contains no fake-DOM branch.
- An initial full-suite run after parent entry wiring failed 214 VM tests at missing fake Canvas `getContext`. After the narrow helper adaptation, the complete suite passed 2417/2417. Two further explicit-unfit visibility/event checks were then added; see the final run below.

Final full-suite result: `npm test` passed 2419/2419 with zero failures. The focused fitter suite passed 5/5. `node --check dist/special-name-fit.mjs` and `git diff --check` passed.
