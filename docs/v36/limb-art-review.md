# V36 limb and facial-layer review

## Repairs

- Measured all five roster costume pairs separately. Replacement gestures and capture now use sleeve crops ending before the old hand, registered at the actual wrist centre. Longitudinal sleeve scaling follows the bone without making a shorter source sleeve wider.
- Gesture sprites now use hand-only measured bounds and fixed apparent sizes rather than whole tile dimensions. Cough has a local skin-only mask. Wang/Han rear palms are separated from their long original sleeve and retain a consistent hand size.
- Huang's far/left hand in `huang_debt` uses a new dorsal sprite with visible fingernails and knuckles. It is not a mirrored palm. The near/right palm remains unchanged in orientation.
- Wang sunglasses use separate rear-temple and front-frame masks. The rear layer precedes the portrait, and the visible near temple connects the frame to the ear.
- Ma cough now uses two small wrist/head pulses during the existing hit timings, keeps the hand near the mouth and recovers to a fist. The expression/air-puff changes are in the companion readability work.
- Han's kneeling shout begins with the spoken cue rather than an arbitrary late visual sub-window. Mechanical low-profile behavior is unchanged by these art files.
- Ma gaze and Ko calling hands are shifted outside the eye region so their corrected full-size palms do not obscure the expression.

## Evidence

- `limbs-before.png`, `limbs-after.png`: targeted before/after.
- `all21-right.png`, `all21-left.png`: every special in both facing directions.
- `limbs-{wang,han,ma,su,huang,chen,ko}.png`: per-character idle and four samples of each special.
- `tests/qa-v36/render-art-review.mjs` reproduces the art-only evidence using `@napi-rs/canvas`. CJK text may display as missing glyphs in this local renderer; game/browser text is checked separately. These sheets do not claim full Arena effect integration.

## New asset

`dist/assets/left-hand-back-v36.png` was generated with the built-in image generator and visually reviewed. The original atlases and portraits were not replaced. Prompt: one isolated anatomical left hand viewed from the back, thumb on viewer's right, visible nails/knuckles, upright open fingers, bare wrist without a cuff, transparent background, matching the existing peach skin/engraved comic texture/dark outline.

## Verification

`tests/limb-layers-v36.test.mjs` covers original-hand removal, sprite dimensions, dorsal selection, two cough pulses, immediate shout expression, sunglasses draw order, fixed rear-palm sizing, capture sleeves and clear eye regions. Existing collar, portrait-preservation and signature-motion tests have explicit updated expectations for the approved changes. No balance, collision, cooldown, audio data, commit or deployment is part of this patch.
