# V19 core integration contract

This change is logic-only. It does not render a larger view, draw items, play sounds, alter existing voice files or change UI copy. Those integrations belong to the parent task. The world remains 960 wide, with fighter centers clamped to68..892 and ground y430.

## Files

Replace `dist/core.mjs`. Add `dist/stage-rules.mjs`. Tests are `tests/stage-items-v19.test.mjs` and `tests/performance-guard-v19.test.mjs`. Neither `roster.mjs` nor `combat-rules.mjs` changes: all21 signature base damage, timing and cooldown values are preserved.

## Rendering state

- `duel.items` contains only live pickups. Each has `id`, `kind` (`paper` or `rubber_duck`), `x`, `y`, `state` (`falling` or `ground`), `age`, `spawnedAt`, `landsAt`, `expiresAt`. Times are simulation seconds, not wall-clock time. Render a landing marker at `(x,430)` while falling. The object moves from y-40 to430 over1s with `y=-40+470*t*t`; it cannot damage, block or be picked up until landing. Pause and hitstop freeze this state.
- `fighter.item` is null or `{id,kind}`. Use this for a small held-object graphic/HUD indicator. It clears when an attack is legally accepted, not at the later release time. Do not infer inventory from a launch event.
- While throwing, `fighter.attack.kind==='item_throw'`, with `itemKind`, `itemId`, `age` and the ordinary `castId`. Wind-up is0..0.12s; recovery ends after0.40s. It does not emit the existing `move` event and must not trigger an unrelated signature voice. A simple existing punch/forward-toss pose can be used without changing controls.
- Thrown items live in `duel.projectiles`, not `duel.items`. They have ordinary projectile owner/position/velocity/radius/life fields plus `itemId`; `kind` is paper/rubber_duck and `impact` is item_paper/item_rubber_duck. Paper has height high and phase outbound. Duck has height low and phase falling or ground. Aerial duck gravity is950; after reaching y395 it slides at the same horizontal speed with zero vertical velocity. Ground throws begin at y395. Paper uses the existing head-height lane `fighter.y-252`.
- Import `performanceGuardActive(fighter)` from `core.mjs` (also exported by stage-rules). It returns true only while an alive actor's current protected cast is inside its inclusive guard window and the one charge remains. Use for a small amber ring/『扛一次』 cue, never an invincibility effect. The actual damage resolver uses the same predicate; the cue disappears immediately when the charge is spent. During pause/hitstop it remains as frozen state.
- `PERFORMANCE_GUARD`, `STAGE_ITEMS`, `ITEM_THROW` and `ITEM_DROP` are exported from stage-rules for explanatory UI. Avoid duplicating their numerical values in game logic.

## Events

Event references follow the existing core's live-object convention. Drain them each frame; do not treat referenced item/fighter/projectile objects as immutable historical snapshots.

- `itemSpawn`: `{type,item}`. Item has just entered falling state; show landing warning.
- `itemLand`: `{type,item}`. Item has reached ground. It may also be picked up later in this same frame.
- `itemPickup`: `{type,f,item}`. `f` is the acquiring fighter; `item` includes position/kind/id and its state is now held. The fighter's inventory is already assigned. Both actors use exactly the same event.
- `itemThrow`: `{type,f,p,itemId,kind}` at projectile release. A normal `{type:'launch',f,p}` is emitted as well. Choose one of those for item launch sound/particles so it does not double-play.
- `itemExpire`: `{type,item}` with state expired. No miss or damage occurs.
- Existing `hit`/`block` use `impact:'item_paper'|'item_rubber_duck'` and ordinary `from`, `to`, `amount`, `height`, `castId`. Prefer paper confetti / playful duck bounce over weapon or injury imagery. Paper damage8, duck10; guarded damage2 and one guard pip.
- `performanceGuard`: `{type,f,kind,castId,amount}` reports a consumed cast charge. The normal hit event also contains `performanceGuard:true`; it still counts as a hit and full damage. `f.reaction` is zero so the hit-reaction pose does not visually erase the protected move. Flash/hitstop remain. Pick one event if adding a single UI ping.
- `over` remains the result event. On finish, all ground/falling items, inventories and item projectiles clear. Existing non-item projectile handling is unchanged. Restart/replay is a new Duel and starts a fresh schedule.

## Fairness, counterplay and limits

A live ground item's nearest eligible actor wins; distances tied within1e-8 remain contested for that frame. Actors are evaluated only after both movement and all contacts resolve, preventing actor-loop priority or a newly stunned fighter picking up before a hit. Existing inventory cannot be replaced. Multiple nearby items cannot fill one fighter twice in a frame. Standing guard and crouch permit automatic pickup, but the existing attack input gate still requires releasing guard before throwing. Held items do not expire; a match cannot generate more than four total.

The live-item cap means falling/ground pickups, not held inventory or thrown projectiles. An attempted spawn while that cap is full is skipped and rescheduled after another10–14s. Locations avoid current actors at warning time; they do not track actors moving into the landing marker during the warning. Spawn positions do not flip with player identity. There is no catch-up burst after pause, no HP-based comeback weighting and no per-character pickup advantage.

Paper is high, so crouch/low-profile avoidance and actual vertical jump clearance apply. Duck contacts only grounded targets after landing; crouching does not evade it. Both are forward-guardable and single-hit. Like existing straight projectiles, they can break an opposing queue and are consumed by that collision. They are not added to the existing coin/paper-plane-only reflection/erasure whitelist, and they cannot create permanent obstacles. Aerial ducks do not break queues until grounded.

Guarded slow moves still take all normal base HP damage. Knockback-triggered wall-bonus damage does not occur when no knockback occurs. There is no protection on heal, no reduction in cooldown, no extra damage, no protection after life reaches zero and no protection against grabs. Ko's existing one-hit60% damage armor is independent and can still carry into an ordinary attack (including a held-item throw replacing that attack).

## Verification

The baseline suite passed855/855. Final counts and soak results are recorded in `core-verification.json`; all existing tests are retained. New tests cover every character, both actor roles and physical sides for item damage/usage, and both roles/sides for each protected move. Both easy/normal AI item perception gates and existing V18 timing/recovery tests pass. Independent review also compared48 seeded pre-drop traces to V18 and found identical movement, HP, attacks, guards/stun, recovery and defense.

Automated correctness is not a claim of final game balance or comedy quality. Match winners in scripted soak tests are not a human fairness measure. The integrated parent UI still needs visual/play/audio review.
