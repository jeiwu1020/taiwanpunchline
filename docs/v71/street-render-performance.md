# Street render investigation and measured change

## Result

Retain the static street backdrop as one high-resolution Phaser canvas texture with reused tile images behind the transparent actor/effect canvas. Horizontal camera travel now repositions and mirrors retained images instead of resampling the whole background into the actor canvas every frame.

The foreground remains 2400 × 1500 at the measured 1200 × 750 viewport. All six actors, effects and labels still paint every frame. No gameplay, collision, AI, save, input, actor size, animation cadence, or art resolution changes were made.

## Real-browser A/B

Parent ran the dev-only probe in the shared cloud Chromium through CUA. It uses real Phaser CANVAS, project assets, deterministic six-actor motion and moving camera. Four alternating runs each had 90 warmup frames and 360 measured frames. DPR was measured as 1. The visible report was transcribed by the parent. Raw data: `street-browser-cache-ab.json`.

| Run | Renderer | Synchronous draw median / p95 | Frame interval p95 | Frames over 25 ms |
| --- | --- | --- | --- | --- |
| 1 | Original full repaint | 24.4 / 45.7 ms | 72.2 ms | 360/360 |
| 2 | Retained backdrop | 0.6 / 0.8 ms | 31.0 ms | 134/360 |
| 3 | Original full repaint | 19.8 / 24.8 ms | 39.8 ms | 360/360 |
| 4 | Retained backdrop | 0.7 / 0.8 ms | 29.7 ms | 130/360 |

Both repeated comparisons improved. Frames over 25 ms fell from 720/720 to 264/720 across the two runs. Parent visual review reported no obvious seams and matching mirrored-world layout.

These are controlled browser rendering measurements, not end-user desktop FPS. The probe omits production gameplay and DOM UI. Synchronous drawing time can exclude later raster/compositing work, so the independent frame-interval measurements matter. Frame p95 remains above 16.67 ms; this is not a claim of guaranteed 60 FPS. Vertical camera motion, zoom, viewport changes, or source replacement rebuild the cached tile.

## Root cause evidence

The actual game selects `Phaser.CANVAS`, not WebGL. Street previously repainted one complete high-resolution viewport canvas every frame, including large static image resampling. At logical 1200 × 750 that is 3.6 million pixels. VS instead draws two 512 × 384 fighter canvases over a separately retained backdrop. This is a workload difference, not a claim that the full game is 9.2 times slower.

Native Skia CPU measurement with real assets and the production painter confirmed significant background raster work. With six moving actors, 120 measured frames after 30 warmup frames:

| Logical viewport | Raster canvas | Paint median | Paint p95 | Background drawImage median |
| --- | --- | --- | --- | --- |
| 960 × 540 | 1920 × 1080 | 28.559 ms | 34.408 ms | 10.179 ms |
| 1200 × 750 | 2400 × 1500 | 41.315 ms | 45.445 ms | 17.223 ms |
| 1920 × 1080 | 2560 × 1440 | 36.378 ms | 43.495 ms | 15.904 ms |

These are native CPU workload numbers, not browser/GPU/FPS results. Reproduction uses an already-installed diagnostic dependency outside this repository, without adding production dependencies:

```
node scripts/benchmark-street-render-v71.mjs ../tower-results-nov1/node_modules/@napi-rs/canvas/index.js
```

Raw results: `street-native-render-baseline.json`.

## Rejected experiments

1. Changing `willReadFrequently:true` to false alone was not a consistent browser improvement. Baseline medians were 24.2 and 19.9 ms; candidate medians were 22.4 and 20.2 ms. Every run still had 360/360 frames above 25 ms. That production change was never applied, and its proposed regression tests were removed. Evidence: `context-browser-ab.json`; the original failing context test log is retained as investigation history.
2. Pre-scaling a tile and then painting it into the same large actor canvas was slower in native Skia, including a direct-scale variant. Neither version was retained. Evidence: `street-native-cache-experiment.json` and `street-native-direct-cache-experiment.json`.

Inspection confirmed that Phaser's CanvasTexture `refresh()` does not repeatedly read pixels or upload WebGL textures in this Canvas game. The initial 1 × 1 constructor read is not the per-frame bottleneck. The accepted change removes static raster work from steady frames rather than changing that context hint.

## Cache behavior and memory

- New `dist/challenge-backdrop-cache.mjs` owns exactly one reusable CanvasTexture, not one texture per world segment.
- At the measured viewport the final seam-safe cache is 2406 × 1500 (2402 interior pixels plus four padding pixels), about 14.4 MB for raw RGBA pixels, plus browser-dependent backing overhead. This is the explicit memory tradeoff for retaining the background.
- Visible tile image instances share that texture and are reused. Horizontal position and mirror parity derive from the absolute world tile index, preserving the original projection.
- The cache repaints when raster dimensions, vertical bounds, curb/building geometry, or source image change. It uses the original backdrop painter, including sky and road extensions.
- All pooled images update their display size after a texture resize. Hide/reentry toggles both layers without discarding reusable art.
- The foreground clears to transparency each frame and retains the original resolution formula. Actor depth ordering, shadows, labels, effects and pose callbacks are unchanged.
- `paintDepthRoute` retains its original full-scene behavior by default for existing callers. Only the production retained-layer renderer opts out of duplicate backdrop painting.

## Tests and reproducible browser probe

Three behavioral regressions were written and observed failing against the original implementation before the fix (`street-backdrop-red.log`). They cover horizontal reuse with every-frame actor poses, viewport/jump-pan invalidation without resolution reduction, world-tile registration/mirroring, and hide/reentry. A fourth guard checks bounded texture/image reuse across 20 camera positions and replacement art invalidation.

Focused rendering/art tests: 27/27 passing (`street-backdrop-focused.log`). Full suite before the fourth additional guard: 2360/2360 passing (`street-backdrop-full-suite.log`). Final full suite after seam coverage regression: 2363/2363 passing (`street-backdrop-final-suite.log`).

Serve the repository root and open `tests/qa-street-performance-v71.html`. The dev probe embeds only the original small canvas factory from commit `8a44af7`; it uses the unchanged default painter for baseline and the current retained renderer for candidate. No duplicate production module or production benchmark flag is required. A temporary preview copy in `dist` must be excluded from release. The full metrics appear under the page's “Full measurements” expander.

The parent separately owns final real-game visual/input QA, cache-version integration, and any commit/release decisions.


## Fractional tile seam follow-up

Independent review found a real filtering seam between edge-to-edge retained quads at fractional screen coordinates. The native Canvas regression reproduced alpha 148/255 at 1200 × 750 and 187/255 at 390 × 592, including jump-pan. The original coarse browser visual review had not exposed this thin seam.

The cache now duplicates two raster columns on each side outside the original image interior. Image placement is offset by exactly the padding's world width, and display width includes the symmetric padding. Interior scale, image registration, world tile indices and mirroring remain unchanged. This provides at least one display pixel of bleed per edge at the existing <=2x raster density, without stretching the original art or snapping the moving camera. Desktop cache width grows 2402 → 2406 pixels, about 24 KB additional raw RGBA memory. No additional per-frame painting is introduced.

Regression command:

```
node scripts/check-street-seams-v71.mjs ../tower-results-nov1/node_modules/@napi-rs/canvas/index.js
```

The script uses the production cache and actual native Canvas rasterization with matching image positions, sizes, camera transforms and flips. Desktop, portrait and portrait jump-pan now all have minimum alpha 255 and zero translucent interior pixels. Evidence: `street-seam-red.log`, `street-seam-green.json`, `street-seam-unit-red.log`. The regular Node suite also guards visible overlap and unchanged interior raster density/world registration.

The four-run browser timing table above was recorded before this four-column bleed addition. The parent owns the final refreshed browser check.

## Final post-bleed real-browser verification

Repeated all four alternating browser runs after edge padding. Baseline draw medians25.0/19.8ms, candidate0.7/0.7ms; final candidate frame p95 29.5/29.6ms. >25ms frames remain720/720→264/720. Raw transcribed visible results: street-browser-final-ab.json. A separate frozen candidate frame was visually checked in actual Phaser Canvas, with no vertical bleed line or artwork shift visible. This remains cloud Chromium, not a physical iPhone claim.
