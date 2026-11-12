# Street ground repair

The scene's final 16 source rows were enlarged vertically to the requested bottom bound. The retained cache adds 512 world units below the viewport, so those same 16 rows became long vertical columns. The retained cache was exposing a rendering bug, not causing a projection or character-scale bug.

## Change

`dist/challenge-art.mjs` now continues the deep street using its own line-free asphalt sample (source x 320–1416, y 944–988). That region is below the manhole and above the bottom road marking. Every crop uses the original equal X/Y world scale. Sixteen-source-pixel overlaps and a deterministic horizontal phase stagger hide hard joins without vertical reflection. A constant foreground tint matches the darker original bottom edge. Sample size and position do not depend on viewport or retained-cache height.

The original image, buildings, road markings, camera projection, characters, collisions, and playable lane limits are unchanged. The legacy street/arena fallback is outside this repair. The retained texture implementation and its 512-unit margins are unchanged. No new image asset, paid API, or credentials were used.

## Evidence

- `ground-before-after.png`: real production `drawChallengeBackdrop` functions with the actual WebP. It uses a representative fixed layout exposing the extension and includes the same 512-unit cache margin. It is explicitly labeled as a native Canvas render, not a phone screenshot.
- `ground-check.json`: native pixel checks and cache measurements against baseline `7362f532b2c93ad929d8ba3cc177b5cee50df68d`.
- Existing scene pixels above the one-pixel antialiased bottom boundary are identical. The original image's geometry is unchanged.
- Increasing the draw bottom from 1600 to 2400 produces exactly identical visible pixels in the 800×1600 result. Additional cached coverage cannot stretch the existing road.
- Mean neighboring red-channel variation in the exposed road changed from X 9.96 / Y 0.29 to X 7.15 / Y 9.48. The old near-zero vertical detail was the smear; the repaired region has two-dimensional grain.
- Cache runs at 828×272, 390×592, and 1200×750 covered 150 frames each of walking, front/back lane travel, and 377-unit jumps. Before and after each built/resized once and kept the same texture dimensions. Reused-cache p95 was 0.002–0.016 ms in this native run. Initial build cost increased by approximately 1–24 ms depending on viewport; there is no new per-frame asphalt work in the retained renderer. These are native CPU measurements, not browser FPS or device timings.

## Verification

The new aspect-ratio and coverage-invariance tests failed against the old production implementation before the repair. The former test requiring 16-row stretching was replaced because it explicitly protected the faulty behavior.

Passed:

- `npm test`: 2433 tests, 0 failures in the shared checkout at this checkpoint.
- Focused art/cache tests: 21 tests, 0 failures.
- `node scripts/check-street-ground-v74.mjs /path/to/@napi-rs/canvas/index.js`.
- Existing native `check-street-vertical-v73.mjs`: four viewports, seven travel/jump/landing views each, no transparent interior pixels, one cached build each.
- Existing native `check-street-seams-v71.mjs`: no transparent interior pixels at fractional tile boundaries.
- `node --check` on changed production module and new diagnostic script, and `git diff --check`.

Final browser and actual phone-layout review belongs to the parent task; this evidence does not claim device FPS or reproduce an unknown prior player state.
