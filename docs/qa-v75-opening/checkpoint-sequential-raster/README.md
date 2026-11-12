# Sequential opening repair

The opening now presents one complete raster scene at a time in portrait and landscape. The existing four beats and 780/1800 ms waking pose changes are preserved. Each pose begins a 7% contained camera approach that settles over 700 ms. A clean pose cut avoids crossfading mismatched hands and faces. No SVG figures, skeletal interpolation, new art, sound, save writes or story controls were introduced.

Full measured raster cells remain contained without stretching or source cropping. Wang's original unusually tall source cells consequently retain side space in landscape. New wider Wang originals would be an optional visual improvement, not a requirement for the sequential repair.

The MiniBoss face-off no longer paints a rectangular right-half tint behind its diagonal divider. Original scene and transparent captain artwork remain unchanged.

## Verification

- New single-scene, transition, camera and tint tests failed before implementation, then all thirteen focused tests passed (including the retained v73 geometry/pose contracts). Logs are saved here. The first tint attempt needed one missing Canvas recorder method; the saved tint-red log records the subsequent expected assertion failure.
- Fourteen images show seven characters in both orientations. Each image is a comparison of three separate production Canvas renders at wake 0, 780 and 1800 ms, not three panels displayed simultaneously in-game.
- Native Canvas evidence is not a browser screenshot or proof of mobile performance.
- Existing lifecycle, replay, skip, four-beat, reduced-motion and save ownership code was left unchanged. Parent owns final full-suite and browser verification after concurrent candidate changes finish.
