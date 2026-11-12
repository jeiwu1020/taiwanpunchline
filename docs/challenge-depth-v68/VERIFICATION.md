# Four-way challenge integration (V68)

## Release scope
- Challenge street sections now use four-direction movement plus an explicit jump button (Space on keyboard). Existing chapter, checkpoints, XP, skill allocations, boss gates and save schema are retained.
- Bosses, ordinary VS and practice continue to use the original Duel model and directional jump/crouch. No additional VS jump control.
- Long-press selection is blocked on gameplay and overlays, preserving native form editing.
- Confirmed stuck-input failure: a missing attack pointerup followed by pointermove with buttons=0 previously retained attack. A regression test first reproduced this; pointer lifecycle cleanup now releases it. This is a confirmed software failure path, not proof of the exact user's phone event sequence.
- Guard mob neck connects through its actual offset V collar; slogan mob display name is 宣傳尖兵. IDs/statistics are unchanged.
- Cooldown dials include seconds; rally/assist have explicit charge tracks; central hints use a contrast plate.
- Road and actors share world translation. Depth-only AI movement drives walking gait instead of being reset to idle. Platforms, melee/projectiles, rally, assist and supplies use depth-aware collision.

## Browser observations
Cloud Chrome local managed preview; iframe dimensions are layout simulations, not physical iPhone tests.
- 390×844 upright: route, readable controls, explicit jump, meters and central hint checked.
- 844×390 landscape: route, cooldown, meter, pause and result checked.
- 390×844 with CSS sideways: route jump and original boss controls checked.
- Played a route by keyboard, walked around/jumped over enemies, reached the gate, advanced two comic beats and entered the original one-on-one miniboss. Extra jump button disappeared and original stick mode returned.
- Route defeat and retry rendered and restarted correctly.
- UI QA mode used; no test XP or unlocks written. Automated session tests also cover XP/checkpoint/profile isolation.
- No application errors appeared in the inspected console entries; Chrome extension metadata errors were unrelated.
- Residual physical-device check: Safari simultaneous touch, OS callout/selection and browser gestures still need owner confirmation on actual hardware.

## Review corrections
- Restored direction aria-labels and game description when entering/leaving a route.
- Cleared stale street instruction below boss health bar.
- Nameplate avoidance added for clustered mobs, with bounded vertical rows and viewport margins.

## Rollback and data safety
Previous published version #44 remains retained; source base ae059295d1e26299db1fefa56f25bf1f737880b7.
Pre-change complete source backup was independently checksum-verified (1,048 files):
SHA-256 656def6db9d87d77639e23f4e1e20183e642f886ed63ee4a55b6735e0d837b38.
No save schema, storage key, profile data migration or reset was introduced. No source/assets were deleted from the prior version. Trial page remains isolated.

## Final verification
- Full suite: 2,317 tests passed, 0 failed on 2026-11-09.
- Final browser landscape screenshot confirmed clustered mob nameplates remain separate and readable.
- Local-only layout QA wrapper is retained under docs, outside deployed dist.
- Publication is authorized for the existing owner-private Site; rollback versions #42, #43 and #44 must remain retained.
