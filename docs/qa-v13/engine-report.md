# V13 combat engine report

Date: 2026-11-06. Base: `aff83c013ff9fc9e1e19d6631172675e0256723d`.
Scope completed locally: `dist/core.mjs`, `dist/roster.mjs`, new `dist/combat-rules.mjs`, combat tests and this report. No commit, push, preview, deployment, new task, or helper agent was created by this worker. UI, rendering, guide and art are owned by the parent integration work.

## Result

- Implemented all21 approved move mechanics with fixed, shared damage/startup for player/enemy and easy/normal.
- Latest engine aggregate: **568/568 passed**. Latest full repository suite: **668/668 passed**. The final universal-movement correction and exact source hash are recorded at the end of this report.
-588 complete matches, all49 pairings ×2 difficulties ×6 seeds, all finite. At the final universal-movement revision: easy293 player wins/1 enemy win; normal167 player wins/127 enemy wins. All21 AI special types were actually cast, including11 heals. Maximum3 projectiles and2 queues total, never more than one plane or one queue per owner.
- Final2000-match Wang/Han soak:1229 player/763 enemy/8 draws, max2 projectiles, max1512 steps, stable heap around7.42MB. This is a fixed input-script benchmark, not a claim that human competitive balance is established.
-43 held-punch AI tests plus a safe-gap heal test pass. This includes all7 AI kits × center/corner ×3 seeds: AI survives12 seconds of every-legal-frame jab pressure and lands a real retaliatory hit. Normal also demonstrably blocks an observed jab and legally punches its recovery.
-98 separate all49-pair/both-wall tests prove a human-input jump can escape repeated grounded pressure while physical body separation remains intact.

## Common engine decisions

### Resolution and deterministic inputs

Both actors advance before queued contacts resolve. Normal contacts already valid that frame can trade, including a lethal draw. A normal hit can cancel an uncaptured grab, but does not erase an already-valid ordinary opposing strike. Counter returns are applied once without recursive defense calls.

The existing public surface remains: `player`, `enemy`, `events`, `projectiles`, `remaining`, `status`, `winner`, `stats`, `press`, `request`, `step`, `finish`, and compatibility `damage`/`animateAttack`. Real collision tests use requests and inputs rather than injected damage. `request(f,'jump')` now supports either fighter. `step(delta, playerInput={}, ai=true, enemyInput=null)` accepts a fourth ordinary input object for the enemy when AI is disabled; it uses the same legal input gates as the player. No test-only methods or immunity flags exist.

60 seconds,100HP, cooldown on accepted activation, no refund for whiff/interruption. Player's.15s buffer and late basic-to-special cancel after.21s remain. Enemy gets no extra startup and no damage scaling.

### Height, facing and physical geometry

- High/mid/low/grab are explicit on each damaging contact. High crouch evasion requires visible lowering, not merely pressing down. Mid can hit crouchers; low ground effects and grab never hit airborne targets.
- Standing projectile hurtbox top: footY−277; ordinary crouch/Han folded top: footY−235; Wang roll top: footY−175. Bottom: footY−28. High coin/plane center: footY−252, radius13.
- Crouch low profile becomes active at crouchBlend≥.95 of the.14s lowering. Attack/jump exits crouch. Wang roll low phase is.16–.50. Han folded phase is.12≤age<.98, matching the parent's approved folded drawing, including the shout while still folded. The travel remains.18–.60.
- Jump uses initial vy−900 and gravity1550, approximately261px apex and1.16s flight. Old−580 only reached108px, insufficient to visibly clear a high shot with the actual277px rig. High shots are not automatically defeated by jumping: the feet/body must actually clear the shot band. Ground attacks are the dependable jump counter.
- Melee is forward-only with committed facing during the action. Idle/guard face the opponent. Reflected/projectile knock uses stored actual travel direction rather than the owner's current facing/action. Grounded/vertically overlapping fighters maintain88px separation, including at walls.

### Guard

-3 pips. Guard covers high/mid/low, not grab. Back-direction auto-guard remains; held guard and attack cannot coexist.
- A cast can charge pips at most once across its multihits. Normal cost1, Su shout2. Every blocked impact chips2; the breaking hit is only blocked chip, never simultaneous raw damage.
- Zero emits one guardBreak and creates.38s vulnerable recovery. On recovery refill at least2 pips, plus.65s anti-rebreak grace. During grace a further exhaustion leaves1 pip rather than another zero-pip loop.
- Regeneration requires being unguarded and at least1.2s after both the latest blocked impact and latest guard release, then.8s per pip. First ordinary pip is therefore about2s after a clean release. Repeated tapping/back input restarts release delay and does not regenerate pips.
- Ordinary raw hitstun.16s, blockstun.07s; hitstop.025/.012s. No armor except Ko's advertised one-hit resource, no extra invulnerability. Both roles can legally punish a basic-induced break with their next normal punch before break recovery.

### Projectiles, queue and special defenses

Each cast gets a stable numeric castId. Every projectile stores owner, originalOwner, impact, height, phase and travel direction independently of the actor's live action. Only straight coin/plane can reflect. Reflection physically reverses vx, changes owner and phase, clears phase-contact tracking and cannot reflect a second time. Original shooter may guard/crouch/jump the returned object. Contact parry does not remotely damage a projectile/lob owner.

Plane travels450px outward then returns to its launchX. It hits at most once per target per phase,8 outward and6 returning. Block ends the original route. Reflection produces one ordinary returning projectile, not an indefinite loop. One plane per owner. Lob uses fixed targetX and real ballistic x/y/current vy; arrow flight1.2s, word flight.56s. Ground impact radius48. No homing after launch.

One queue per owner, lifespan1.5s after planting. First grounded crossing triggers10 damage and65 knock, consuming the line; jump bypasses it. Ordinary punch/Ko bag reach and straight projectile crossing can destroy it. It never prevents movement as a physical wall. Cough erases at most one physical straight projectile per pulse, with both forward range and matching vertical lane; arrow/word are not erased.

Wang/Su counters stop eligible close contact and return damage only within150px. Grabs and noncontact shout/projectile/lob ignore them. Huang rejection consumes one contact without automatic damage or reflects a straight shot, then permits an ordinary manual attack. Chen calm reduces one ordinary hit to at most4 and retreats60; a second hit/grab still works. Retreat chooses away from the attacker and clamps at walls, never escapes through them. Ko armor consumes one ordinary hit at60% rounded damage with no hitstun/knock/cancel, carries into a normal punch, and is removed by any other accepted special. Grab ignores armor. It is not a permanent replacement for guard.

## Exact move timing / renderer rescale map

All seconds are simulation time. Active intervals are open boundaries as in the previous engine. Damage is identical for both roles/difficulties. For combo recovery, total minus the final active end is the visible whiff recovery. The authoritative playable numbers are `COMBAT` merged into each roster move.

| Character / kind | Startup / active or effect | Total | Damage / guard cost | CD | Counterplay / notes |
|---|---|---:|---|---:|---|
| Wang rush |.16–.50 contact; travel.12–.50 at620px/s |.72 |14 low /1 |4 | Visible low phase.16–.50; low, queue, grab and jump beat it |
| Wang counter |.08 startup, then.40 counter window |.84 |12 close mid return; retreat45 |6 | Contact only, no ranged/grab defense, whiff.36s |
| Wang heal | Effect at1.00 uninterrupted |1.20 |+10, cap100 |10 | Any hit spits/cancels before effect |
| Han coin | Launch after.16 |.48 |11 high /1 |4 |520px/s; actual high lane, crouch/block/clear jump/reflect/erase |
| Han knee | Travel.18–.60 at150px/s; shout.62–.74 |1.08 |14 mid /1 |5.5 | Folded visible low phase.12–.98; low/grab/mid interrupt |
| Han arrow | Launch.24, fixed mark, flight1.20 |.60 actor |20 ground /1 |7 | Leave fixed mark, jump or block; no remote parry/reflection |
| Ma handshake |.28–.36 capture |.80 |12 grab |5 |.44s whiff recovery, no safe cancel; grounded only |
| Ma gaze |.25–.38 |.72 |9 ground /14 anti-air; mid /1 |5.5 | Reach150, vertical reach250; block/range win |
| Ma cough |.20–.28; .44–.52 |.90 |4+6 high /1 per cast |6 | Reach165; one erasure per pulse, interrupt/guard then punish |
| Su shout |.32–.44 |.76 |14 mid /2 |5 | Reach190, knock68; slow visible startup |
| Su rush | Hits.22–.29,.42–.49,.62–.69; steps.12–.22,.32–.42,.52–.62 at330px/s |.96 |6+5+5 low /1 per cast |5.5 | Jump/contact parry/queue/startup interrupt, no armor |
| Su dare |.20 startup, then.30 counter window |1.00 |18 close mid return |7 |.50s whiff recovery; no ranged retaliation, grab wins |
| Huang shout |.30–.42 |.78 |14 mid /1; knock88, one wall bonus≤3 |5.5 | One30px inward rebound where free room permits, never crosses attacker; no added stun chain |
| Huang debt |.14 startup, then.35 rejection window |.76 |No automatic contact retaliation |6 | One contact rejection or physical straight-shot reflection; grab/late second hit/lob wins |
| Huang queue | Plant.28 at110px in front |.72 actor |10 ground /1, knock65 |6.5 | One line,1.5s life; jump/punch/projectile/bags counter |
| Chen dream | Launch.30, speed350; turn after450px |.72 actor |8 outward +6 return high /1 per cast |6 | One plane,3s hard life; block/reflect ends original route |
| Chen question |.18–.27 high; .42–.52 low |.80 |5+8 /1 per cast |4.5 | Crouch evades first only; guard both; timely jump low |
| Chen calm |.12 startup, then.45 one-hit reduction window |.82 |One hit max4, retreat60, no retaliation |7 | Second strike/grab/wall pressure can catch it |
| Ko bags |.16–.26 low; .40–.51 mid |.78 |6+8 /1 per cast |4.5 | Reach155, destroys reachable queue, not a projectile eraser |
| Ko name | Launch.30; fixed-mark flight.56 |.78 actor |12 ground /1; slow25% for.7s unblocked |6 | Mark at min(current target distance,230px); move/jump/guard prevents slow |
| Ko resolve |.16 startup; .90 one-hit armor |.46 stance |60% ordinary damage once; no stun/knock/cancel |7 | Can carry into next punch; other special clears, grab bypasses |

Basic remains.10–.23 active,.32 total,6 mid damage,15 knock,130 reach; all3 visual basic variants share this logic. The direct legacy defense field `brace` remains numeric zero for compatibility; Ko is represented by `armor`, not by obsolete2-chip brace semantics.

### Starting-value changes / rationale

Approved draft damage targets were kept. Final guard break.38s rather than the draft approximate.35s leaves a reproducible next-punch punish after a block at.10 and attack recovery at.32. The jump arc/high lane and folded Han interval were coordinated with the actual approved art geometry to avoid visible hits being declared misses, or invisible high hits through a crouched body. Ko stance total.46 permits its advertised armor to carry into a basic while its.90s protection timer continues from startup. Plane knock14 keeps the return timing usable; wall bonus is capped3 and now causes real inward motion. No difficulty-specific damage, cooldown, hidden startup, or extra armor was introduced.

## Exact renderer/HUD contract

Fighter additions:
- `guardPips`: integer0..3.
- `guardBroken`: remaining seconds,0 means not broken; `guardGrace`: anti-rebreak timer.
- `armor`: remaining one-hit armor seconds,0 means unavailable. `brace` remains0.
- `slow`: remaining seconds; while positive movement is multiplied by.75. No reversal or input lock.
- `lowProfile`: current effective visible low state.
- `grabPose`, `grabbedPose`: remaining.22s presentation timers. Capture faces target toward grabber, stands target briefly and aligns to about136px while clamped inside arena; does not exchange sides or create a long lock.
- Existing `attack.kind`, `attack.age`, `attack.variant`, `crouchBlend`, `land`, `reaction`, `reactionKind`, `counter` remain available. Attack adds `castId`, indexed strike tracking and per-pulse erased tracking.

`Duel.obstacles`: queue objects `{kind:'queue', owner, x, y:GROUND, life, castId, damage:10, knock:65, direction, dead}`. Render only live entries. Array is filtered after resolution.

Projectiles: `{kind:'coin'|'dream'|'arrow'|'word', owner, originalOwner, castId, impact, height, direction, travelDir, x,y,vx,vy,gravity,life,age,damage,knock,phase,reflected,dead,hits,radius:13}`. Plane adds `originX,turnX,returnDamage`; lob adds `flight,targetX,startX,startY,targetY,slow,word`. Phases: `'outbound'`, `'return'`, `'reflected'`, `'lob'`. `vx` and current ballistic `vy` are suitable for orientation. Ground lob targetY is `GROUND−18`.

New / expanded events:
- `guardBreak {f}`; `guardRecover {f}`.
- `capture {from,to,duration:.22}`.
- `reflect {f,p}`; `reject {f,from}`; `erase {f,p}`.
- `queuePlant {f,obstacle}`; `queueBreak {x,y,f,obstacle}`.
- `armor {f}`; `armorAbsorb {f,amount}`; `calm {f}`; `slow {f,duration}`.
- `wallBounce {f,amount,x}` at most once per shout contact, with actual resulting rebound position.
- `wordMark {f,x,y}` and `wordMiss {x,y}` alongside existing arrow equivalents.
- Existing `move`, `jump`, `launch`, `heal`, `spit`, `counter`, `counterMiss`, `hit`, `block`, `over` retained. `launch` also carries `p`. Hit/block now include `height,castId` and optional `armored,calmed`. Counter return is one nonrecursive ordinary hit. Wall bonus is separately reported and included in stats.damage.

## AI choices, pressure diagnosis and fix

First implementation removed asymmetric damage/startup but retained slow offense-only choices, and the old pressure script won1999/2000. Further inspection found three concrete decision bugs: threats were gated behind the next offensive turn, a stale held-guard state caused legal attack requests to fail, and contact parry could be chosen against a noncontact shout.

Normal now reacts to already visible actions with.16–.30s choice cadence and.78 response probability; easy uses.40–.68s and.40. These choices do not change move execution speed. AI releases guard through the same input path before requesting attacks. It chooses only a compatible defensive move that can become active before the visible impact. Low/ground/grab threats can induce a legal jump; high shots can induce crouch/guard. Airborne AI moves toward a possible escape and waits until a real returning grounded contact is within vertical reach instead of repeatedly swinging in empty air.

During actual received hitstun it buffers jump or guard, then executes on the first legal frame. Normal buffers a normal punch after a blocked close hit and uses the opponent's already-visible recovery to punish. Wounded Wang preserves a safe gap for drinking instead of approaching before its healing decision. Both ordinary controls and all move/stat gates still apply. Seeded reproducibility is tested.

## Tests first, red/green evidence and changes

Baseline: `npm test`440/440 green on the pre-edit tree. New66-test V13 rules/lifecycle batch:24 pass/42 fail on the old implementation, including symmetric trades/lethal draw, directional contacts,3-pip guard, high crouch, grabs,21 move functions and enemy scaling. Tests failed on incorrect behavior, not missing imports.

Subsequent specific red→green cycles caught:
1. Low bag hitting a grounded target from a disconnected airborne swing: now requires a grounded low melee source and target.
2. Normal slow-threat reaction and stale AI guard prevented defense/offense: fixed choice scheduling and compatible defensive selection.
3. Held-punch center/corner test initially23/42 failed; post-hit buffer/escape passed42/42.
4. Post-block jab punish initially failed; legal first-frame punch changed the2000-round benchmark to1180/813/7.
5. Safe-gap Wang healing initially failed; now casts and completes+10, and the full588-match benchmark includes all21 AI move kinds.
6. Cough initially erased a high shot from an unrelated airborne vertical lane: fixed matching-height requirement.
7. Wall bonus was omitted from statistics: stats now includes14+3.
8. Lob renderer velocity stayed at launch velocity: current ballistic vy now follows the real arc.
9. Wall shout bonus originally only emitted damage/event; left/right position tests failed at892/68 instead of862/98. Added a real one-time30px inward rebound, limited by the attacker's occupied body, with no added stun/bonus recurrence.

Coverage retained/replaced deliberately:
- `signature-moves.test.mjs`'s V10 exact numbers were replaced because the user explicitly approved different mechanics. Obsolete expectations included ordinary crouch still getting high-shot hits, generic remote counter damage/nested counter recursion, enemy damage scaled.64/.88, hidden enemy startup−.23, stationary single-hit Su rush, Ma ordinary handshake, Chen no-return plane and Ko2-chip brace. Equivalent lifecycle, identities, cooldown, start/end, interruption, pause, both roles/faces and actual collision coverage now targets V13.
- `second-roster-legacy.test.mjs` removed20 byte-for-byte V9 combat trace hashes. Those supposedly untouched five Wang/Han moves and shared contact rules are now intentionally changed. Replaced by all21-special lifecycle tests for both roles, cooldown/restart, pause/input safety and deterministic seeded state.
- New `combat-v13.test.mjs`:112 literal damage/impact-count cases across14 damaging actions ×2 roles ×2 faces ×2 difficulties;84 real startup interruption cases;98 all-pair/both-wall legal escape cases; high-lowering, direction, projectile/reflection/queue/slow/armor/lob/wall edges.
- New `ai-pressure-v13.test.mjs`:42 held-punch pressure cases, a legal block→recovery-punch test and safe-gap actual heal test.
- `core.test.mjs`: coin expected damage14→11 and arrow22→20 only. `crouch.test.mjs`: longer real jump landing allowance and explicit crouch-high/mid/low outcomes replace the old cosmetic-only crouch assertion. Input handler, pause, touch release, basic variants, buffer and cooldown tests remain.
- Existing all49×2×3-seed complete-match test and all49 AI approach/attack/recovery tests retained. Noncombat UI/art/source/audio/alias tests were not discarded by this worker. Parent owns their necessary V13 expectation updates.
- Direct comparison against the base confirms all7 IDs, chosen aliases, source names, portrait paths, colors, roast/tag fields and all21 move names/kinds/quotes/source URLs/source notes/audio fields are unchanged. Character tips/hints now explain V13 roles instead of obsolete Ko2-chip or no-line behavior.

Reproduce engine aggregate:
`node --test tests/combat-v13.test.mjs tests/ai-pressure-v13.test.mjs tests/signature-moves.test.mjs tests/second-roster-legacy.test.mjs tests/core.test.mjs tests/crouch.test.mjs tests/roster.test.mjs tests/second-roster.test.mjs`

Full suite: `npm test`.
Benchmarks: `node tests/soak-v13.mjs` (588 all-kit rounds, reports difficulty split and actual AI move usage), `node --expose-gc tests/soak.mjs` (2000 rounds/memory).
Syntax: `node --check dist/core.mjs`, `dist/combat-rules.mjs`, `dist/roster.mjs` all pass.

## Remaining concerns

- No engine failures remain in the latest523-test focused run. Final full-suite and benchmark rerun after spatial rebound is recorded in the follow-up section below.
- Browser/mobile visual review belongs to the parent, especially the deeper jump, high shot trajectory, folded Han clearance, handshake presentation and word/queue silhouettes. This worker did not claim browser visual validation.
- Scripted normal challenge is now substantially stronger while easy is approachable. Human play and per-character matchup balance still need playtesting; the benchmark is not a substitute for that judgment.
- At a completely packed wall, rebound motion is shortened to preserve the occupied attacker's88px body separation. Bonus remains bounded3, once, with ordinary.16s stun.
- Internal numerical roster definitions are merged from COMBAT; source metadata remains canonical in roster.mjs. Renderers/guides should consume the merged values rather than stale inline V12 literals.

## Final independent-review correction wave

Stable engine source SHA-256 for reviewer retest:
- core.mjs: `c2e1bc9e343850263ec0da50403ca18a476eecd9694d21388a7c0176580228db`
- combat-rules.mjs: `174c8070128702eb8cf9596aa66497fa7a18c7c464b2b4dfb41ebb207b4c044e`
- roster.mjs: `7f18d0ee80aa35220ecbfd48b6a04ccab41092045ee7d6cbb226da7f56c50ce2`

The independent reviewer found five additional real edge cases. All were reproduced with real requests/inputs and then fixed, rather than weakening assertions:

1. **Guard jump-release regeneration exploit:** holding guard after a block and then jumping cleared guard before the release timestamp was recorded. A shared `setGuard` now records true→false transitions for ordinary input, jump, guard break, forced raw-hit release and finish. The new regression compares ordinary release/jump: both keep2 pips after.81s and both refill only after the same full release/regeneration interval.
2. **Landing-frame palm damage role asymmetry:** player Ma picked14 before the defender landed, enemy Ma picked9 after the defender landed. Contacts now carry both ground/air damage options and choose from the common final post-physics grounded state. Mirrored actual jump108-frame→palm tests both deal9 on the landing contact.
3. **Same-frame queue/jab role asymmetry:** world spawns and interactions are no longer mutated in actor animation order. After both actors advance, all queue/projectile spawns are committed, then strike/prop-erasure interactions run, then crossing/projectile contacts resolve. This gives the same explicit priority in both roles: a valid grounded jab/bag can destroy a just-created line before crossing damage. Mirrored planter-role/both-face regressions now yield planter94/jabber100 and one queueBreak in all cases. The same shared staging also covers simultaneous cough/shot spawns.
4. **Forced crossing lost a queue:** knockback/retreat can now enqueue swept ground queue intersections into the same contact worklist. The line is marked consumed before its contact is appended, so it cannot recur; there is no recursive hazard damage call. Huang400/target488, line510, then shout now produces14+10 and consumes the line. Hitstun remains at most the ordinary.16s, not a stacked lock.
5. **Airborne bag destroyed a disconnected ground line:** ground-prop destruction now requires a grounded source as well as forward horizontal reach. A real Ko jump at feet around212→173 followed by a bag swing leaves the queue intact. Grounded punch/bags and actual straight projectile crossings still destroy it.

The guard regression first failed1 case. The final role/queue geometry batch first showed5 expected failures out of334 combat tests (player landing palm, enemy planter in both faces, forced crossing, airborne bag). All pass after correction. These are additions to the earlier red/green cycles, not replacements for existing tests.

Final verified aggregate at this stable revision:
- Engine aggregate: **532/532 passed**, no skips/todos/cancellations.
- Full repository `npm test`: **630/630 passed**, no skips/todos/cancellations.
- `node tests/soak-v13.mjs`: **588/588 finite complete rounds**, all49 pairs ×2 difficulties ×6 seeds. Easy293 player/1 enemy; normal167 player/127 enemy (43.2% normal enemy wins against this fixed script). All21 AI specials observed, including11 heals. Maximum3 projectiles/2 queues total, unique plane/queue per owner, maximum1389 steps.
- `node --expose-gc tests/soak.mjs`: **2000/2000 complete rounds**,1229 player/763 enemy/8 draws, maximum2 projectiles, maximum1512 steps; post-GC samples stay about7.38–7.43MB after warmup, final7.42MB.
- `node --check dist/core.mjs` passes. `git diff --check` passes for all worker-owned changed source/tests.

No engine tests are currently failing. Independent reviewer retest and parent browser/visual sign-off are still separate completion gates. Source is intentionally held stable for that retest.

## Universal forced-movement sweep follow-up

The reviewer accepted all five original correction-wave reproductions, then found that the first forced-crossing patch still covered only the damage target's movement. Two other real paths remained: Wang's counter self-retreat crossing an opponent's line, and Ma's packed-wall capture alignment moving its attacker across a line.

Both were reproduced before editing: **8/8 new cases failed**, covering both actor roles and both faces for each action. The real counter case now leaves Huang at88HP and Wang at90HP with exactly one queue hit; the packed-wall grab leaves Huang at88HP and Ma at90HP with exactly one capture and one queue hit. The line is consumed and grounded bodies remain separated.

A shared `moveFighter(f,nextX,sweep=true)` now clamps and sweeps every forced displacement:
- Wang counter and Chen calm retreat.
- Capture alignment of both attacker and target.
- Ordinary knockback, blocked push and inward wall rebound.
- Post-contact body separation.

Pre-contact separation remains part of the shared frame's previous-position sweep, after world spawns/destruction, preserving the reviewed symmetric jab-versus-new-line priority. Post-contact separation now drains any newly discovered hazard into the same finite worklist. There is no recursive hazard resolution and each line is marked consumed before its contact is queued. Voluntary movement, special travel and forced movement therefore all obey the first-grounded-crossing rule without duplicate queue hits.

Latest held-stable core SHA-256: **`df48be1cc93e581f84bcffbc10139f60a09ce388fd9b7bf1f4f58e918151c4f2`**. Rules/roster hashes are unchanged from the prior section.

Final rerun on this source:
- Engine aggregate **540/540 passed**.
- Full `npm test` **640/640 passed**, no skips, cancellations or todos.
- All-kit **588/588 complete rounds**: easy293 player/1 enemy; normal167 player/127 enemy. All21 special kinds used by AI, including11 heals; max3 projectiles,2 queues,1389 steps.
- Legacy **2000/2000 complete rounds**:1229 player/763 enemy/8 draws; max2 projectiles,1512 steps; post-GC heap roughly7.38–7.44MB, final7.42MB.
- Syntax check and worker-owned diff whitespace check pass.

The exact source hash and regressions have been sent to the independent reviewer for a final bounded retest. Browser/visual approval remains owned by parent QA.


## Final visual-only clasp release

The visual reviewer found that ordinary victim hitstun ends after.16s while the clasp presentation lasts.22s. A legal victim jump during the remaining.06s could therefore leave the shared hands visually stretched between a grounded Ma and an airborne victim.

Added `releaseGrabPose()` to clear both fighters' `grabPose` and `grabbedPose` timers when either legally resumes jump, punch, special, movement, guard or crouch, or enters an airborne state. Rejected inputs during hitstun do not release the pose; an idle recovered victim retains the original bounded presentation until its natural expiry. This changes only those four visual timer fields across the two fighters. No hitstun, damage, cooldown, movement, capture alignment, forced-movement sweep or AI choice changes were made.

Added28 real capture/first-legal-action regressions over both victim roles and both faces:24 stale-pose action tests failed before the fix and now pass;4 idle retention controls also pass. Final source is held stable at core SHA-256 **`949bd2cb75838379806cd3abc14e96d9d46eaf82ea196e0e39abd3ffd6befe47`**. Rules and roster hashes remain unchanged. Both reviewers received the exact hash for bounded retest.

Final verification on this exact core:
- Engine aggregate **568/568 passed**.
- Full repository **668/668 passed**, no skipped/cancelled/todo tests.
- All-kit588 rounds and legacy2000 rounds were rerun and all terminate. Outcomes and maximum steps/projectile/queue bounds are identical to the universal-sweep revision: normal167/127, easy293/1; legacy1229/763/8.
- Legacy post-GC heap remains stable around7.39–7.45MB, final7.44MB.
- Syntax and worker-owned whitespace checks pass.

No further edits are planned. Files are held stable for the parent's live browser pass.
