# Full-stage presentation repair implementation plan

Goal: repair user-reported #49 regressions without changing campaign, saves, combat values or Site audience.
Architecture: stable full-stage canvas with overlay controls, scoped collision fixes, sequential generated-raster opening. Local candidate is isolated from verified #49 source backup. Source publication requires exact current-head comparison.
Tech stack: existing HTML/CSS modules, Phaser Canvas, Node tests, native Canvas renders.

## Approved scope
- Mobile native landscape without rotation fills available viewport, percentage fits.
- All layouts place controls over visible background; portrait VS pause only blurs current scene without resizing camera.
- Art covers legal camera envelope and jump bounds without blank edges.
- Street tables stop ground traversal but retain jumping onto and walking off their existing top bounds.
- Opening restores one sequential animated shot; complete raster anatomy remains uncropped. MiniBoss diagonal split has no rectangular tint.
- Supply uses built-in generated transparent original, with unchanged pickup and healing rules.
- Originals and #49 backup are preserved; each integrated stage gets a persistent backup with readback checksum.

## Tasks
- [ ] Add failing layout/gesture/camera regressions; implement stage overlay and safe camera insets; pass focused tests.
- [ ] Add failing swept collision, tabletop footprint, generated supply regressions; implement scoped depth route repair; pass focused tests.
- [x] Add failing one-frame opening and miniboss rectangle regressions; fix sequential raster motion and remove mismatched tint; focused green.
- [ ] Run full Node suite, production native Canvas checks and managed Chrome actual interface flows; label device simulation accurately.
- [ ] Review all changes; fix any regression, persist full source and originals with manifest, materialize and verify all hashes.
- [ ] Reconcile latest exact source head, push tested tree using authorized short-term credential, deploy privately, retain #49 rollback.

## Review focus
- Pause/resume and Settings close do not resize or shift the battle scene.
- 100% progress and long button labels fit on smallest viewports.
- Table corners and adjacent platforms never trap a grounded or airborne actor.
- Maximum jumps at top street lane never expose a flat blank band.
- Gestures remain functional across mixed touches, cancellation, orientation and accessibility zoom mode. Cloud Chrome is not physical Safari.
