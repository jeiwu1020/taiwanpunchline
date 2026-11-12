# V76 challenge boss background repair

## Root cause

The challenge bosses use `createChallengeRenderer.drawArena`, not the ordinary chamber backdrop. The arena image starts at world Y = -140. Previously, a jump or tall portrait viewport exposed a blue-gray gradient above that cropped image and a 16-source-pixel road strip stretched below it. The camera was already covering the correct actor envelope; changing actor scale or collision geometry was not needed.

The main game update also hid chamber extension images and then called `updateBackdrop` during the same boss frame, showing those unrelated images again behind the boss canvas.

## Scoped correction

- Paint one continuous warm, sunless sky using the existing sky asset.
- Preserve the original arena body, curb, central scene and desk at their existing world coordinates and scale. Prepare a 64-source-pixel fade at the cropped top/bottom once. The original sun is below the fade.
- Keep one complete central scene. Extreme lateral views continue outer tree/wall strips, rather than repeating complete sunsets.
- Prepare native-grain asphalt once into a reusable material canvas. Moving frames place the prepared tiles rather than rebuilding hundreds of feather strips.
- Extrude one raster pixel beneath both scenery-strip edges to prevent bilinear seams as the camera eases.
- Skip ordinary chamber updates during boss fights. Ordinary battles keep their original chamber renderer.
- Cache an unchanged boss frame. Route rendering invalidates that cache before returning to a boss.
- If the optional sunless sky fails to load, use an enlarged warm sky sample from the required original arena. This fallback is visibly less detailed than the normal sky but remains fully covered. The older street-only source also remains supported.

No combat physics, camera fitting, fighter geometry, saves, enemy rules, rewards or desk collision values changed. No new artwork files or dependencies were added.

## Verification

- `npm test`: **2,498 passed, 0 failed**. Final log `/tmp/boss-v76-full-suite.log`; completed 2026-11-10 08:18:34 +0800.
- `node --test tests/challenge-boss-backdrop-v76.test.mjs`: **9 passed**. Includes all three real boss update branches, sky/road source checks, fixed main-scene geometry, fallback, cache reuse and moving-camera allocation/draw budgets.
- `node scripts/check-boss-backdrop-v76.mjs`: **648 native Canvas composites passed**. This calls the production challenge renderer with real images and real dynamic/stable camera functions.
- Normal and missing-optional-sky variants: all 432 composites have minimum alpha **255**. The 216 legacy-only composites have minimum alpha 255 except seven at 254 from raster rounding. **No pixel below alpha 254** across the matrix. There are no blank strips or partially transparent facade columns in the normal path.
- Nine viewport/orientation cases: 320×568, 390×720, 390×844, 430×932, 844×390, 568×320, forced +90° and -90° at 390×844, and desktop 1280×800.
- Three boss sections × two cameras × ground / maximum desk-jump apex / left-edge apex / right-edge apex × normal / missing-sky / legacy sources.
- Maximum test apex is world Y **52.5087**, derived from the current desk height, jump speed and gravity with four extra units of margin.
- 120-frame movement traces across six viewports and both cameras: **0–47 drawImage calls per moving frame**, **five fixed canvases** (three existing renderer canvases plus two prepared arena materials). Material preparation happens once. Details: `moving-paint-results.json`.
- `git diff --check` and `node --check dist/challenge-arena-backdrop.mjs` passed.

The focused regressions were first run against the old implementation and failed for missing real sky, stretched road, repeated refresh, and chamber updates. The native alpha audit also reproduced the fractional-strip gap before edge extrusion.

## Evidence

- `before-boss1-390x844-jump.png` / `after-boss1-390x844-jump.png`: identical camera, visible gray upper space and stretched road before; textured sky and pavement after.
- Other PNGs: representative production-renderer composites for bosses 1 and 3, portrait, landscape, both forced rotations, desktop and optional/legacy fallbacks.
- `native-canvas-results.json`: all 648 pixel-check records.
- `moving-paint-results.json`: moving-frame operation counts and retained canvas counts.

These native composites verify background coverage and source placement. They do not simulate Safari, HUD interaction, touch input or physical device performance, and do not draw fighters. Actual browser/gameplay verification is recorded separately by the coordinating task.
