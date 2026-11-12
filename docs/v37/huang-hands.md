# Huang hand orientation repair

## Camera and anatomy

The supplied `image(20261108-021244).png` shows Huang's debt move. The near arm is the anatomical right arm in the source right-facing pose. Its forward, pronated gesture should show dorsal knuckles and nails, but the previous `open-right` frame showed a palm, with left-palm thumb placement. Merely mirroring that palm would not correct the visible surface.

- Debt: near right dorsal hand, separate far left dorsal hand.
- Queue: near right dorsal stop/push hand, consistent with the forward arm and camera.
- Shout: a dedicated right dorsal pointing gesture, instead of a palm-view pointing sprite.
- Idle, guard and normal punches: existing fist art is retained.

The entire fighter still mirrors as one unit for opposite facing, as it did before. The new source-hand flip only converts the real left dorsal asset into a right dorsal asset. It never converts a palm to a hand back and does not apply to other gestures or characters.

## Joint and cuff treatment

Signature-hand rotations now blend from the solved forearm's direction to the target gesture for these Huang moves. The earlier fixed final angle twisted the far wrist during startup and recovery, while the arm was still low. Gesture hands return to the original fists close to rest. The measured bare wrist anchors and costume-specific clean sleeve boundaries remain on the same solved joint. The new pointing sprite is cropped above its long spare wrist so the hand is not stretched or burdened by another cuff.

## Asset provenance

`dist/assets/right-hand-point-v37.png` is additive. It was generated through the built-in image generator from the existing dorsal-hand style reference; no paid external generation API was used. All original faces, costume atlases and palm frames are retained.

Prompt: single isolated anatomical right hand seen from the back, index extended upright, middle/ring/little fingers curled into the palm, thumb on the viewer's left, visible index nail and dorsal knuckles/tendons, warm peach skin and engraved comic texture with bold outline, centered bare wrist, no sleeve/cuff/text/shadow, transparent PNG. The existing left-hand-back-v36.png was supplied as a style reference. The output was visually checked before its wrist crop and anchor were measured.

## Verification and evidence

- `tests/huang-hand-orientation-v37.test.mjs`: dorsal selection, side-specific source transforms, bounded continuous wrist angles, startup/recovery fists, both-facing hand/cuff registration, transparent asset loading, and unchanged ordinary fist rendering.
- Tests were run red before implementation: 16 expected failures and one existing behavior pass. After implementation all 18 regressions pass.
- `huang-right.png` and `huang-left.png`: reviewed idle and four samples of each of the three moves. Reproduce with `tests/qa-v36/render-art-review.mjs --all --type=huang`, adding `--mirror` for the other facing. `CANVAS_MODULE` may point at an installed `@napi-rs/canvas`.
- These are art-only sheets, not a claim of full gameplay/browser testing. Local canvas lacks the CJK font, so effect characters may appear as empty boxes. The sibling integration work owns the browser check.
- No combat definitions, hitboxes, damage, timings, cooldowns, balance, AI or control rules changed in this patch.
