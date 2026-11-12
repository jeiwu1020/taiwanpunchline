# Independent V13 engine review

Date: 2026-11-06. Scope: approved combat brief, engine diff, actual `dist/core.mjs`, `dist/combat-rules.mjs`, roster merge, engine tests and implementer report. UI/art/browser validation and competitive balance are outside this review. No production source was edited by this reviewer. The broad unchanged suites/benchmarks were not rerun; their counts below remain implementer-reported. Small real-input Node reproductions were run independently.

## Separate verdicts

- **Specification compliance: needs fixes.** The 21 mechanics and common defenses are substantially implemented, but two reproducible role-dependent outcomes violate symmetric collision/fairness requirements. Queue collision reach and crossing have two further gaps. The guard-jump regeneration exploit found during review has already been patched; independent retest is recorded below.
- **Implementation quality: needs revision before combat sign-off.** Stable cast metadata, queued ordinary contacts, shared move rules, explicit height classes and legal-input tests are good foundations. However, collision-relevant state still changes inside the player-first animation loop. Rechecking melee geometry afterward does not make obstacle mutations or damage selection symmetric. Test totals and finite-match benchmarks do not cover these cases and do not establish competitive balance.

## Findings

### P2: Same-frame queue planting and punch destruction depend on actor role

Source: `dist/core.mjs:65–80,98,110–112,127` in the initial reviewed implementation.

Reproduction, with real requests and no injected hit/state changes after initial positions:

1. Create Huang/Huang, positions player400 and enemy510.
2. Select either actor as planter; request its special3.
3. Advance 21 frames of 1/120s using `step(1/120,{},false,{})`.
4. Request the other actor's punch, then advance 80 frames.

Observed:

- Player plants: planter HP94, puncher HP100. The new queue is planted, then the enemy punch destroys it before crossing damage.
- Enemy plants: planter HP94, puncher HP90. The player's punch checks destruction before the queue exists. The new queue then deals10 even though the same valid punch is resolving that frame.

The actor roles alone decide whether the jab counters the queue. Defer queue destruction to a shared post-animation collision stage, after both plant intents/actor poses are established, with one explicit priority rule for strike versus crossing. Add mirrored-role tests using these real requests.

### P2: Landing-frame palm damage is14 for the player and9 for the enemy

Source: `dist/core.mjs:65–77,100`, `dist/combat-rules.mjs:12`.

Reproduction:

1. Create Ma/Ma at player400/enemy510.
2. Request jump on the defender.
3. Advance108 frames of 1/120s.
4. Request special2 on the attacker, then advance until the first hit.
5. Repeat with attacker/defender roles exchanged.

Both contacts occur at simulation t=1.1583333333333317. The defender starts the contact frame at y427.3645833333324, vy882.4999999999984 and ends it grounded at y430/vy0. Player palm deals14, enemy palm deals9.

Reason: the player chooses `raw` before the enemy's landing physics, while the enemy chooses it after the player's landing physics. Store grounded/air damage options with the contact, then choose from one common final-pose snapshot after both actors have advanced. Test both roles and faces on the landing frame.

### P2: Knockback can cross an active queue without triggering it

Source: `dist/core.mjs:54,78,127,208–216`.

Reproduction:

1. Huang at400, grounded defender at488.
2. Request Huang special3; advance .75s. The live line is at510, defender still488.
3. Request Huang special1; advance .4s.

Observed: shout knocks the grounded defender488→576 across the live line; HP is86 and the line remains alive. Only the shout's14 damage resolves. The crossing check ran before contact knockback, then the next frame's `previous` starts on the far side, losing the crossed segment.

The brief says the first grounded crossing consumes the line. Track swept position changes from damage/retreat/separation too, or explicitly collect queue intersections when those movements are applied. Avoid recursively resolving hazards, and consume each line at most once. If forced movement is intentionally exempt, that is a specification change that should be approved/documented instead.

### P3: Airborne bags destroy a ground queue outside their vertical reach

Source: `dist/core.mjs:98`, contrasted with the grounded-low check at86.

Reproduction:

1. Huang at400, Ko at620; request Huang special3 and advance .30s.
2. Request Ko jump and advance .35s. Ko is y212.19791666666643; the ground line is x510/y430.
3. Request Ko special1 and advance .20s.

Observed: the queue vanishes with `queueBreak`, although Ko is around y173 when the low bag becomes active. The ground opponent is correctly not hit, but destruction ignores vertical/source-height reach entirely. Share a real swing-versus-obstacle geometry test with the height rules; at minimum the low bag must be grounded to reach a ground queue. The approved bags requirement is destruction **if the swing reaches it**.

### P2, fixed during review: Jumping out of guard skipped the release delay

Original source: `request('jump')` cleared `guard` directly, before `setInput` could record `guardReleasedAt`.

Reproduction: block one real jab, hold guard for another2s, then compare a normal release with `press('jump')`; advance .81s. Before the patch normal release retained2 pips but jumping restored the third pip. This skipped the required1.2s release delay plus .8s regeneration period.

The implementer introduced a shared `setGuard` transition and a legal-input regression test while review was underway. See retest status below. The fix must cover every release path, not only ordinary input release.

## Confirmed strengths and limits

- The 21 stable action identities are retained and authoritative combat numbers are merged into roster metadata. I did not find a new change to aliases/source/audio identity in the reviewed diff.
- Ordinary same-frame contacts are retained independently of attacker cancellation, and lethal simultaneous normal hits can draw. Strike-before-uncaptured-grab priority is explicit.
- High/mid/low/grab distinctions, forward committed melee, grounded low/grab gates, actual projectile-height evasion and crouch lowering thresholds are present.
- Guard chips2 per hit, caps pip charging per cast, gives Su shout cost2, treats the breaking hit as chip only, then recovers2 pips with grace. Existing tests execute real break/punish inputs for both roles.
- Plane phase hit tracking, stored cast/impact/travel metadata, physical once-only reflection, return termination and the original caster's guard/evasion path are implemented. I found no direct remote projectile-parry damage path.
- Armor/calm are consumed once; grab bypasses them. Other specials clear Ko armor while basic punches can retain it. Counter return is nonrecursive.
- AI uses current visible attack/projectile state and the same request/input and move-stat paths. I found no future-input reads, difficulty damage scaling, hidden enemy startup or special AI immunity in the reviewed source. This is not a claim of fair human matchup balance.
- Han's .12–.98 low-profile range initially appeared to differ from the brief's travel interval. Parent clarified that the approved folded drawing remains visibly folded .12–.98, including its shout, while travel is .18–.60. I accept this documented geometry clarification rather than reporting it as hidden immunity. Mid/low/grab still connect.
- Implementer report states523 focused tests,619 full-tree tests before final additions,588 all-pair matches and the2000-match legacy soak. Those are reported evidence, not independently rerun counts. The exact edge reproductions above are independent evidence.

## Retest status

Initial source changed during review as fixes arrived. The initial guard reproduction was independently confirmed before the fix.

Independent bounded retest against core SHA-256 `b3605690532e5a02fbe91240e5e7a64cabc98a3ea7a8cc0bd3650b0588b792a6`:

- Guard: ordinary release and jump release both retain2 pips after .8167s and both eventually return to3. **Fixed.**
- Palm landing: player14/enemy9. **Still open.**
- Same-frame queue/jab: player planter94/100 versus enemy planter94/90. **Still open.**
- Knockback crossing and airborne bag reach were independently reproduced as described, not reclassified by the guard fix. **Still open.**

Final independent retest results can be appended after the implementer supplies a stable revision.

## Final correction-wave review: c2e1bc9

Reviewed stable core SHA-256 `c2e1bc9e343850263ec0da50403ca18a476eecd9694d21388a7c0176580228db`. Read the correction-wave implementation/report rather than relying on test totals.

**All five exact original reproductions now pass.** Independently ran96 bounded real-input cases: guard release16; palm landing and one-frame neighbors24; queue/jab contact and one-frame neighbors24; shout-forced crossing8; grounded/airborne bag reach16; simultaneous cough/coin8. These include both actor roles, both faces and both difficulties. Palm damage is14 before landing and9 on/after landing in both roles. Queue/jab outcomes now share one priority: early jab interrupts planting, same-frame jab destroys the new line, late jab is interrupted by the crossing. Original shout crossing now gives14+10 exactly once. Airborne bags leave the ground line intact; grounded bags still destroy it. Simultaneous cough erasure remains physical and symmetric.

**One P2 residual remains in forced crossing.** `applyDamage` now tracks movement of its own target, but other forced-movement entry points still skip queue sweeping:

- `dist/core.mjs:188,197`: Huang400/Wang488; plant line510 and run90 frames; request Wang special2; run12 frames; request Huang punch; run36 frames. Wang counters for12 and retreats488→533 across510 while staying HP100; the line remains live. Mirror faces and roles reproduce. `retreat()` called by Wang's counter does not enqueue the crossed line.
- `dist/core.mjs:198–202`: Huang68/Ma156 at the wall; plant line178 and run90 frames; request Ma special1; run72 frames. Capture moves Ma156→204 across178; Huang takes12, Ma remains HP100, line remains live. Mirrored wall/roles reproduce. `capture()` moves the attacker before the subsequent damage call snapshots its target, so neither actor's relevant capture sweep is covered.

Track queue intersections for **every** forced displacement, ideally through one movement helper used by retreat/capture/damage/separation, while retaining the finite nonrecursive contact worklist and once-only line consumption. Add these real counter/capture regressions; do not merely exempt the two specials from the first-grounded-crossing rule.

**Updated separate verdicts:** the four non-crossing findings are resolved; the original shout crossing is resolved but its universal forced-movement fix is incomplete. Specification compliance and quality remain **needs one correction** before engine sign-off. The reported630/630 repository tests were not independently rerun; they do not cover these two residual paths. This remains an engine correctness review, not competitive-balance or browser/art approval.
