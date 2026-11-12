# Street cache behavior contract

The former test required production `challenge-backdrop-cache.mjs` to hash to published #67 after allowing #70's partial-paint change. It protected all implementation details at once. The approved continuous warm composition intentionally changes those details, so the production hash assertion has been replaced with behavior checks; this Workers release changes only the backdrop cache behavior, plus the shared runtime version marker. Desktop foreground rendering retains the current main implementation and density.

The independent historical fixture `tests/helpers/baseline-cache-69.mjs` remains hash-protected against #67 commit `806f00c3f16d51708c7bd52f4da8ca57825f7b89`. Its normalized SHA-256 remains `dcff84704a5249a4c85bd6fb1566d252ef40c092825ad73131d52cf0a9787867`. Only the three import paths/version tokens are normalized. Current production source is never used to regenerate this oracle.

| Protection | Verification |
|---|---|
| Desktop, portrait, taller touch and unknown presentation retain published background behavior | Differential allocations, world coordinates, paint calls and diagnostics versus the frozen renderer, including movement, expansion, source replacement, viewport change, budget failure and recovery |
| Missing layered artwork retains the old finite fallback | Differential full draw sequence across densities and vertical movement |
| Touch landscape preserves current native density, world coverage and both orientations | Geometry and density checks with rotation 0/90/-90; full vertical projection extent; warm movement without rebuild |
| Full-stage jump trajectories preserve world registration and sky reuse | Existing seven viewport profiles, both start orders, retain their pose sequence, per-frame actor updates and convergence checks. Layered output checks source-pixel-aligned continuous bounds, absolute X anchors, repair parity, density and memory; legacy artwork keeps the original 256-unit row assertions |
| Finite memory and work remain bounded | Combined source/joined/sky/dynamic/repair reservation; published 24–32 Mi-pixel envelope, 4 Mi-pixel source-row cap, 8192 side limit, bounded draw work; moderate budget-boundary cases as well as extreme inputs |
| Warm composition does not retain duplicate source rows | Recycled source ownership, bounded outside prefetch and stable allocations during covered motion |
| Partial painting remains continuous | Existing native near/far boundary RGB error <0.02, exactly one dynamic facade, sky visible and all cached facade fragments hidden |
| Offscreen prefetch cannot delay visible cached painting | After warm fill, move within the composition margin across a prefetch boundary and require ready-with-pending behavior; retain the assertion that this condition actually occurs |
| Source/surface changes cannot retain stale images | Each facade/sky/repair source replacement, reset, same-size loss and policy switching; native raster hash equality before/after recovery |
| Original artwork and registration remain acceptable | Existing native image-error, alpha, source-mask and <16 Mi-pixel allocation thresholds, unchanged |
| Desktop foreground retains main density | No foreground density reduction: desktop 1200×750 keeps a 2400×1500 actor canvas; touch and unknown presentation also retain their original density. Direct background fallback remains unchanged |

The native raster fixture now models Phaser's no-argument `setCrop()` correctly: it clears the crop. The shipped Phaser implementation explicitly sets `isCropped=false` in that case. This fixes the stand-in, not the production renderer or any acceptance threshold.

The compatible tests replace eight uses of the old projected 256-unit row contract while preserving the original desktop foreground density expectation. The old source-row helper remains unchanged for legacy artwork. A separate continuous-output helper checks the same world anchors, union, density and allocation protections for the intentional layered output change. The old animated-actor test now covers desktop, touch and unknown presentation; all still require exactly one actor-canvas refresh per frame, original foreground density, and background reuse.

The partial-recovery test counts only live (>1 pixel) textures plus the dynamic canvas and two source repair masks. Pooled textures deliberately resized to 1×1 remain tracked objects, but are no longer live large surfaces. Exact raster comparisons use SHA-256 of the same PNG bytes to keep assertion failures bounded. Historical differential comparisons hash the complete serialized snapshots, including every recorded draw; neither comparison uses a tolerance or omits data to shorten failures.

The accepted warm implementation can rebuild after coverage/density changes and can differ from retained higher-density rows. These tradeoffs remain in the candidate report. Passing these contracts does not prove an iPhone fix, lossless output, fixed FPS, an external backup, or deployment readiness. The earlier browser and image-quality evidence is reusable only while every runtime byte stays identical.
