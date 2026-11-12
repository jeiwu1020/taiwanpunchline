# V19 stage items and bounded performance guard

Goal: add a few playful, predictable-to-react-to random pickups and preserve the readable startup of three slow signatures without invulnerability.
Architecture: `stage-rules.mjs` supplies shared item, drop and guard rules. `core.mjs` owns state and shared collision resolution. Existing roster, combat values, UI, audio and 960-wide world stay untouched.
Scope: the parent task's V19 core handoff and latest user requirements, 2026-11-06. Existing authorized private prototype task; no new Codex task, commit, preview or deployment.

## Final design decisions
- Paper ball (`paper`) and squeaky rubber duck (`rubber_duck`). The original fixed-drop/hammer proposal was replaced by the user's random-drop/nonviolent-comedy request before implementation.
- Random first drop and subsequent intervals of 10–14 simulation seconds, at most four drops per match and two falling/ground items simultaneously. One-second warning/fall; ten-second ground lifetime. Drop positions are selected among x160,240,320,400,480,560,640,720,800, excluding points within120px of either actor at spawn.
- A separate item PRNG is derived from the incoming RNG's first value. That value is replayed to the AI random stream, preserving V18's first observation behavior. Item schedule does not depend on actor ID, character, difficulty, HP or the count of later AI random calls. Allowed locations depend only on both actors' current positions.
- Shared post-combat pickup phase: grounded, alive, not attacking/stunned/guard-broken, empty slot and within52px. A strict nearest-distance tie remains available. Each actor can pick up at most one item per simulation step.
- Next legally accepted punch becomes item_throw, fires at .12 and ends at .40. Inventory is consumed on acceptance; failed requests do not consume. An interrupted throw before release loses the item. No basic-combo increment, special cooldown change or new control.
- Paper: high straight throw, damage8, speed460, life1.6. Rubber duck: low ground slide, damage10, speed360, life1.8. An airborne duck throw falls before its low contact can activate. Both allow normal forward guard; fully lowered crouch avoids paper, jump clears the ground duck. No homing or repeated impact.
- AI observes a newly visible ground item within320px before pursuit, using easy .40–.68s / normal .16–.30s. Ordinary attack delay, recovery, movement/retreat guard and defense remain active. Held items use the normal offensive decision gate at range<520px.
- One guard charge per cast: han_knee [.12,.68], su_shout [.05,.38], ma_cough [.08,.42]. The first non-grab hit takes full base damage without stun, knockback or action/reaction-pose interruption. Second hits, grabs, outside-window hits and lethal damage interrupt normally. Existing Ko damage-reduction armor stays separate. Heal and all other moves remain normally interruptible.

## Review focus and completed steps
- [x] Baseline npm test:855/855.
- [x] Stage-item behavioral tests first:52 expected failures against baseline, then implementation and green.
- [x] Guard behavioral tests first:34 failures/14 unaffected passes, then implementation and green.
- [x] Renderer guard export test first:missing-function failure, then shared predicate and green.
- [x] Expanded symmetric damage/evasion, post-hit pickup, same-frame capacity, queue interaction, independent RNG, real combo/grab/projectile and lifecycle coverage.
- [x] Full npm regression and both existing soak programs.
- [x] Independent read-only code review and renderer/event contract.
- [x] Freeze exact files and applyable patch; no commit or deployment.
