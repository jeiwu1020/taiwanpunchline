# V74 / candidate Site version 49

Baseline: published #48, commit `7362f532b2c93ad929d8ba3cc177b5cee50df68d`. The baseline checkout remains clean and its full archived source was rehashed successfully before changes.

## Completed

- Street pause now offers a confirmed retry of only the current route. It restores full player health, ready assist and zero rally, while retaining earned XP, skills, unlocks and checkpoint. Boss retry restarts only that encounter; a final boss resets its best-of-three score. No new save schema or migration.
- Portrait pause, home/selection confirmation, and VS results collapse the reserved control row instead of leaving an empty beige band. Normal play restores the controls.
- Deep street foreground continues the original asphalt texture at matching X/Y scale, with overlapped staggered sampling. The unchanged world projection, collisions and retained cache are covered by native diagnostics.
- All seven characters have six cohesive generated opening scenes based on their original portrait and outfit. Complete raster panels replace the earlier cutout assemblies. Four existing story beats advance through sleeping, rising, seated alarm reach, dressing, doorway and chase. This is a motion comic with pose changes/dissolves and subtle camera motion, not interpolated character animation.

## Validation

- Full `npm test`: 2439 passing, zero failures/skips, 25.8 seconds. See `final-full-tests.log`.
- Route retry/cancel/fresh-confirmation/home layering and boss checkpoints 1/3/5 are regression-tested with the actual challenge session/progress store. Repeated mob XP follows the existing retry behavior.
- All seven image dimensions, measured panel bounds and native Canvas portrait/landscape renders passed. Original portraits/assets remain asserted exactly, with the seven new entries added to the provenance fixture.
- CUA in the managed Chrome preview: portrait pause, home confirmation and final VS result no longer show the blank control row. Measured portrait cabinet is 676px high with a single 672px content row and hidden deck. Returning to active route restores the original game/control rows.
- CUA retry confirmed a new route start at full 100 health, zero rally and ready assist; cancel and home return were exercised.
- CUA landscape street view uses the repaired ground without the previous long vertical smear.
- CUA Wang and Ko opening reviewed in portrait, landscape, and Ko in CSS-sideways mode. Sleeping-to-seated pose change, next, replay, skip and final departure were exercised. Native render checks cover all seven characters.
- Browser QA uses the original UI and temporary viewport fixture. No hidden game state or saves were injected. The temporary fixture was removed from deployable dist before packaging.

## Limits

This was managed Chrome and native Canvas testing, not physical iPhone/Safari testing. No claim of real-device frame rate or comprehensive long-run balance testing is made. Future responsive scene architecture was discussed but not changed.

## Recovery

The original #48 archive is retained separately in Space. An in-progress full V74 snapshot was also saved, materialized back, and SHA-256 verified before final work. A new final complete snapshot and publication receipt will be retained separately; neither replaces older backups.
