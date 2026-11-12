# Retain street art through vertical camera movement

## Cause and change

The existing tile key included the camera's exact `top` and `bottom`. Lane
movement changes the camera every frame, so 150 vertical frames repainted the
same street 150 times. Subtracting those fractional bounds also toggled the
rounded canvas height at 1920 × 1080, producing 47 resizes.

The cache now paints one fixed world rectangle, expanded by 512 world units
on each vertical side. This covers the current jump, table height and lane
range, whether the first frame is on the ground or mid-jump. Its world
position and pixel density remain fixed while the camera moves. A viewport,
density, curb/building geometry or source change rebuilds it. A viewport that
actually escapes its coverage also rebuilds it, with fresh overscan. The same
texture and visible tile pool are reused; there is no accumulating map cache.

The original street image, absolute horizontal tile parity, seam padding,
camera equations, actor/effect rendering, gameplay and saves are unchanged.
The existing procedural sky/asphalt extension is painted across the retained
coverage instead of being recomputed against the moving viewport edge.

## Comparable native measurement

Both runs use the actual street asset and production cache implementation,
150 frames with the first 30 excluded from steady-state timing, and the same
1200 × 750 / 1920 × 1080 projection. These numbers measure the synchronous
cache draw call in native Skia. They are **not browser frame time or FPS**, and
exclude foreground actors and final scene compositing.

| Viewport, vertical motion | Repaints before / after | Resizes before / after | Steady mean before / after | p95 before / after |
| --- | --- | --- | --- | --- |
| 1200 × 750 | 150 / 1 | 1 / 1 | 21.735 / 0.00279 ms | 27.904 / 0.00485 ms |
| 1920 × 1080 | 150 / 1 | 47 / 1 | 16.270 / 0.00210 ms | 22.952 / 0.00225 ms |

Raw comparable captures: `street-vertical-before.jsonl` and
`street-vertical-after.jsonl`. A subsequent run of the committed reproduction
script is in `street-vertical-final.jsonl`; like all microbenchmarks, individual
timings vary. The invariant is one initial repaint/allocation in each motion
sequence, instead of repainting on every vertical frame.

## Explicit memory and first-frame tradeoff

The raster density was not reduced. Retaining vertical coverage costs more
memory and makes a rebuild more expensive:

- 1200 × 750: texture 2406 × 1500 → 2406 × 3841, raw RGBA 14.44 → 36.97 MB.
- 1920 × 1080: texture 1965 × 1440 → 1965 × 3352, raw RGBA 11.32 → 26.35 MB.
- 390 × 592: retained texture 1494 × 2638, raw RGBA about 15.76 MB.
- 844 × 354: retained texture 1638 × 2301, raw RGBA about 15.08 MB.

These are decimal raw pixel sizes, excluding browser/driver backing overhead.
The committed native benchmark recorded 39–102 ms for the initial allocation
and full retained paint. Resize/source/coverage invalidation can still incur
that work. This fix removes repeated work during ordinary movement; it does
not promise every frame, including initialization, meets a 16.67 ms budget.
Real-browser/device compositing performance remains for integration QA.

## Verification

- Tests were written first: six failures in `street-vertical-red.log` exposed
  moving art bounds, repeated repainting, viewport invalidation and jump reuse.
- All 10 cache tests pass (`street-vertical-green.log`). The broader rendering
  and existing select-control subset passes 44/44 (`street-render-focused.log`).
- Native real-pixel tests reuse the same cache through seven walking, jumping
  and landing states at four viewports. Each has one refresh/resize, minimum
  interior alpha 255 and zero translucent interior pixels
  (`street-vertical-raster.json`).
- The existing native fractional seam regression passes in all three cases
  (`street-seam-green.json`).
- Full `npm test` was run while other v73 work was in progress: 2368 passed,
  five failed (`street-full-suite.log`). Three were not-yet-implemented opening
  animation/layout functions. Two files could not load jsdom before the shared
  dependency link was restored. The existing select tests then passed in the
  44-test focused run. The parent owns the final integrated full-suite rerun.

Reproduce native checks using the already-installed diagnostic dependency;
no production package was added:

```
node scripts/benchmark-street-vertical-v73.mjs ../tower-results-nov1/node_modules/@napi-rs/canvas/index.js
node scripts/check-street-vertical-v73.mjs ../tower-results-nov1/node_modules/@napi-rs/canvas/index.js
node scripts/check-street-seams-v71.mjs ../tower-results-nov1/node_modules/@napi-rs/canvas/index.js
node --test tests/street-backdrop-cache-v73.test.mjs tests/street-backdrop-cache-v71.test.mjs tests/challenge-depth-render-v68.test.mjs tests/game-select-v72.test.mjs
```

The cache/depth/render import chain uses v73. The parent owns the matching
`game.mjs` import version and final publication; this change was not published.
