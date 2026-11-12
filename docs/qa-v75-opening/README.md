# Restored articulated opening, candidate v75

This candidate restores the actual four-shot animation from source commit 7362f532b2c93ad929d8ba3cc177b5cee50df68d rather than replacing movement with zoomed storyboard stills. The waking torso sits up, arms reach with constant-length bones, hands attach independently at wrists, and a separate raster blanket rises and slides. Wardrobe uses the original clothing wipe; the street scene uses the existing animated fighter. Original beat text, timings, replay/skip, reduced motion and save ownership remain intact.

New built-in-imagegen assets provide isolated pajama parts, blanket, pillow, bed, alarm clock, breakfast and microphone. A new empty room prevents duplicated beds and slippers. All complete hands/heads/props remain bounded within the scene; original character portraits preserve identity. TV casing, framing, stamps and accent lines remain Canvas UI/comic graphics, not SVG character substitutes.

The MiniBoss face-off no longer paints a rectangular right-half tint behind its diagonal divider. Its original scene and captain assets are unchanged.

Only three new opening assets are preloaded. Seven v74 storyboard masters/runtime files and compatibility helpers remain intact, but are not downloaded by the normal art preload. Missing articulated assets produce an explicit loading message instead of the wrong character or a storyboard collage.

## Verification

- Focused opening/lifecycle/tint tests: 28 passed, including unchanged save bytes, replay/skip, reduced motion, constant arm lengths and actual raster-rig drawing. Red and green logs retained here.
- `articulated/` contains 28 montage PNGs representing 84 real production Canvas renders: all seven characters, 844×390 and 390×700, wake at 0/780/1800 ms plus bulletin/wardrobe/chase at 2400 ms.
- Each montage compares separate moments/scenes. The game displays one scene at a time, never the montage.
- Repeat with `node docs/opening-rig-v75/render-evidence.mjs /path/to/@napi-rs/canvas/index.js`.
- These are native Canvas renders, not browser screenshots or evidence of mobile performance. Parent owns final integrated suite and browser QA.

The earlier sequential-raster implementation and evidence remain under `checkpoint-sequential-raster/` and the top-level comparison PNGs as historical checkpoints, not the final animated result. Source generation prompts, measured bounds, hashes and validation are in `docs/opening-rig-v75/`.
