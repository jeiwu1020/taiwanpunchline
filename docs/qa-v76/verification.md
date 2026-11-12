# Follow-up repair after Site #50

Base source: 04b6cc4e80ad6b2791150f7ae612ffaef97c5d25.
Scope: challenge progression-dialog title overlap and boss arena background coverage. No combat, physics, actor-size, collision, save-schema or reward changes intended.

## Baseline safety
The complete #50 backup was freshly materialized from all eleven saved parts, reconstructed to SHA-256 3ca5852e1b4942aab08e6ffea97f1af932c8e983dc08c150b0172bf32a3c0b36 and every 1,401 manifest file verified before implementation. #49 and #50 remain saved Site versions.

## Header regression
The combat presentation stylesheet used a descendant header selector, accidentally matching the header inside the challenge dialog. The fix scopes those four toolbar rules to the direct child of .app. No dialog re-layout or typography changes.
- Regression reproduced by the real mounted dialog under all loaded production stylesheets.
- Header contract matrix: 320,360,375,390,430 portrait widths, native landscape, both sideways logical orientations and desktop; chapter/character/save/reopen; saves unchanged.
- Initial post-header full test run: 2,489 passed, zero failed.
- Cloud Chrome actual production page in localhost iframe: 320×568,360×640,375×667,390×720,430×932 have static header, 10px gap before tabs and zero horizontal paper overflow. Native landscape844×390 and667×320 retain intentionally side-by-side header/tab columns with14px separation. No overlap.

## Verification limits
Cloud Chrome layout/input simulation is not a physical iPhone or Mobile Safari run. Native Canvas pixel tests are renderer tests, not physical-device screenshots or fps measurements. QA save seeding only affects the isolated localhost origin, never the published-site player saves.

## Actual-page boss checks in cloud Chrome
The production scripts were exercised through their real title, challenge-progress and boss-intro screens using isolated localhost saves at checkpoints1/3/5. First boss jump checked in390×720nativeportrait and+90sideways; second boss jump checked at844×390native landscape with side rotation off; chapter boss jump checked at430×932tallportrait. Each had continuous warm sky and correctly proportioned pavement behind overlays. Player jump animation was visibly active. Pause still blurs the existing scene without collapsing the stage.
The header was also checked in actual+90sideways mode, with separate title/tab columns and no overlap. The±90full matrix remains covered by layout and native-renderer tests.
Browser screenshots were inspected in-session only, not saved as user deliverables. Final antialias-edge extrusion was covered by native pixel tests and a later browser smoke check rather than repeating every interaction above.

## Final verification
- Full suite: 2,498/2,498 passed, zero failed/skipped. Exact cache-entry assertions updated to current game246/trial76 keys, never removed.
- Native boss matrix:648 combinations across three bosses, dynamic/stable cameras, multiple viewport heights, portrait/native landscape,±90sideways, floor/desk jump apex and side positions, normal/missing-optional-sky/legacy assets. Normal and missing-sky432cases fully opaque alpha255. Legacy216cases have minimumalpha254in7cases from raster rounding; zero pixels below254 anywhere.
- Material/cache allocation: five bounded canvases; maximum47native paint calls per moving frame after one-time preparation. This is not an FPS measurement.
- Independent review caught skipped lateral tiles, excessive per-frame fragments and subpixel seams before release; these were corrected and rechecked.
- Final runtime snapshot resynced99entries, verified game.mjs?v246 and narrow320×568header/body fit with real game scene. Transient browser automation timeout was recovered by re-reading current UI; no page crash observed.
- Camera, character scale, collision coordinates, combat values and player-save schema unchanged.
