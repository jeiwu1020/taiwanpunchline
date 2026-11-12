# V18 approved interaction update

User-selected intent: preserve seven-character basic duel, make AI pressure readable and fair, prevent either actor's voice from cutting the other actor's phrase, and display special-move cooldown with an obvious circular pie countdown and ready state. Continue using existing Phaser3 / canvas artwork and one-page phone/desktop layout. No new modes, changed roster, source audio, public sharing, or GitHub main.

The user chose independent actor audio, same-actor skip while busy (not long FIFO), true first-observation AI reaction delay plus post-action gaps. Limited one-hit slow-move protection is optional after evidence, not a mandate. Start without new armor; retain existing Ko armor and rules unless testing identifies a justified narrow need. No global invulnerability.

## Boundaries
- Core worker owns isolated dist/core.mjs and new core AI tests/docs only. It must not edit shared main checkout, voice files, CSS or HTML.
- Voice/UI worker owns isolated dist/game.mjs, dist/index.html, dist/style.css, optional new focused helper modules, voice/UI tests/docs. It must not edit core.mjs, combat-rules.mjs, roster, art or any audio source/asset.
- Main integrates only after the separately authorized V17 handshake audio addition is done. Copies start from V16, so preserve newer V17 slots/status/tests/cache metadata when applying the V18 patch. Never overwrite shared main with an entire older copy.

## Core tasks
1. Add failing behavior tests for actual first observation delay, inability to instantly counter an unseen fresh attack, and a minimum recovery gap after AI completes/cancels actions. Check both difficulty settings and relevant timer resets.
2. Implement explicit observation identity/age tracking and separate reaction deadline; defensive and offensive choices must not inspect invisible future input. Post-action gap must start at action end rather than expiring during it. Choose documented tuning values that are slower/easier on warmup but not idle/passive.
3. Test player/AI damage, guard, cooldown and special rules remain symmetrical; deterministic seeded all-pair smoke checks and sample counterplay cases. Do not assert win-rate fairness from a single seed or claim no interrupts.

## Voice/UI tasks
1. Add failing tests for two simultaneous actors, same-actor busy skip with no queue, pending play promises/rejection/end, delayed cues cancelled by interrupted attacks, and stop-all on pause/reselect/blur/mute/result. A failed autoplay attempt must not permanently mark a channel busy.
2. Implement at most two actor channels, each at most one voice; retain original files/provenance and all configured cue behavior. If audible overlap is too loud, modest AI attenuation is allowed and must be disclosed. Preview should remain deterministic and not create a third live channel or leak game audio.
3. Add pie/ring cooldown to three special buttons, visibly shrinking time-remaining sector with numeric remaining and distinct ready label/shape. Preserve names, simple keys and44px touch controls. Use text as well as color, respect reduced motion, do not pollute live regions everyframe.
4. Add tests for normalized cooldown endpoints, no negative/NaN/overflow, ready transition, 320px portrait/landscape structural layout. Browser visual QA is main's responsibility; worker must not start shared preview.

## Integration and review
- Full npm test on each isolated deliverable; main runs merged suite and independent read-only review.
- Browser QA on phone-sized and desktop viewport, real accepted moves, both actor audio overlap and same-actor skip, mute/pause/reset, cooldown ring start/mid/ready states and no overflow.
- Keep private audience and unchanged source audio hashes. Publish via existing Site helper only after verification; disclose measured limits and intentional tuning. Never claim untouched mechanics once AI timing changes.

## Added user scope: neck/collar seams

Inspect all seven existing heads and outfits in standing, crouch/jump and special-move extremes, both facing directions. Correct attachment/layering consistently without covering the jaw/face or changing the already-approved faces, hand identities, grip geometry or limbs. A third isolated art worker owns art collar helpers/render modules and QA fixtures only. Final visual review must inspect actual composed sprites; numeric geometry tests alone are insufficient.
