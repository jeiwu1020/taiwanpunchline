# V4 four-limb animation and crouch QA — 2026-11-06

## Scope and rules
- Basic attack visually cycles left jab, right punch and low forward kick. Damage, reach, hit timing, buffer, special cancels and guard remain the existing rules.
- S/down-arrow or held phone button crouches. Crouch stops voluntary horizontal movement; back+crouch retains automatic guard. Jump or an accepted attack exits the pose; holding down resumes crouch after the action. Crouch does not shrink the hurtbox or avoid attacks.
- Both hands participate in walk, balance, guard and special poses. Both legs now have articulated hip, knee and ankle joints. Landing has a short visual bend.
- Existing Wang/Han identities and six specials remain. No new politician or clip added. Original Han voice and its unconfirmed reuse-rights notice are retained.

## Automated and independent source review
- 49/49 tests pass. New tests cover crouch/guard, release, aliases, pointer cancel, pause/blur, attack restrictions, unchanged damage rules, cosmetic cycle and finite/continuous joints.
- Regression tests were added after reproducing crouch→jump torso snap, crouch→attack hand snap and double-blended interrupted crouched sip. Fixes were independently rechecked.
- 64 seeded baseline comparisons without crouch matched original combat states/events/timing. Independent reviewer additionally compared 128 seeded always-crouch traces with no direction, randomized jump/basic/specials/guard and AI: all tracked combat outcomes matched baseline.
- Independent reviewer sampled 616 standing drink/interruption poses, unchanged from V3; crouched interruptions at 25/50/75/100/125 ms remained continuous after fix.

## Visual/browser review
- Independent CUA review covered Wang/Han normal and whole-character mirror: idle, walk, jump/land, left/right punches, low kick, crouch, guard and each special. No new limb-identity or joint/layer regression identified in the sampled poses.
- Initial kick layer incorrectly put hip over coat pocket; replaced with a lower kick whose root stays behind coat hem. Initial jump inspector crop and contact-sheet aspect ratio corrected and independently rechecked.
- 320×568 portrait and 667×375 landscape menu and battle inspected. All controls fit, no horizontal overflow, smallest control 47.25×51 portrait / 78.5×44 landscape; all specials at least 44px high. Crouch press/release and pause exercised in browser. Not physical-phone/Safari or simultaneous multi-touch verification.

## Limits
- Whole-character mirror remains a presentation mirror, not independently drawn opposite anatomy.
- Archery and roll still switch to whole cutout poses. Cup recovery still substitutes empty fist; no full cup stow animation. No claim of perfect anatomy or complete cinematic continuity.
- New lossless limb atlas adds 6 MiB decoded pixels; older phones may be slower. No hours-long stress test.
- QA-only files are retained under tests/qa-v4 and excluded from the published dist.

## Final pass
- Foreground Chromium autoplay completed 2 consecutive rounds with both characters, crouch, basic attacks, jump and specials: observed 57.1–60.9 FPS, 15–18 scene objects, 22–25 textures and up to4 pooled projectile sprites. No application console errors or tab crash; browser-extension metadata errors excluded. Not a physical-device performance claim.
- Actual-core transition fixture visually inspected crouch→jump at .321/.463 s and crouch→punch at .293/.420 s, including Han mirror. Torso and hands now move through the bent-to-raised posture without the prior abrupt jump. This is sampled visual review plus regression tests, not a claim of every continuous-frame transition being perfect.
- Original Han MP3 SHA256 remains eda509cd3c4847a52237c88dbdcfc71cfa660aeb06375000d290504bf8ab4492.
