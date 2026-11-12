# Task 1: V13 combat engine and 21 moves

Read this first. These are the approved requirements and draft starting values. Numeric tuning is allowed only to make legal counterplay work; document changed starting values and why. Keep all character IDs, aliases, sourceName, all move kinds/names/source links and original audio identity. Scope: dist/core.mjs, dist/roster.mjs, new combat modules, engine tests only. Do not edit UI/render/art/HTML/CSS/voice/generator. Do not create tasks, preview, commit, push or deploy. No helper subagents. Owner handles integration and independent review.

## Common rules
Keep Duel public surface used by game: player/enemy, events, projectiles, remaining, status, winner, stats, press/request/step/finish. Existing controls still work. 100hp, 60s, cooldowns on activation, failed/aborted moves do not refund. No input inversion, long lockout or invulnerability.
- Classify high, mid, low and grab explicitly. High projectiles can be crouched. Low/ground attacks can be jumped. Normal guard blocks high/mid/low without extra buttons. Guard is directional toward opponent; attacks are forward-facing, not magical behind-body hits. Crouch genuinely lowers hurtbox only after visually lowered, and exits on attack/jump. Roll and folded Han phase are low-profile only in their visible low phase. Mid attacks can hit crouchers; low effects must not hit airborne actors. Preserve physical collision separation.
- Three guard pips. One cast consumes at most one pip across its multihits (Su shout costs two). Block still chips 2 per hit. At zero emit one guardBreak and vulnerable recovery about .35s, then refill enough to prevent a recurring zero-pip loop; use a short anti-rebreak grace if needed. Delay regeneration since last blocked impact AND release of guard; no tap/back-input exploit. Breaking hit deals block damage only, not chip plus full raw. Legal-input tests must prove both sides can punish a break once.
- Queue contacts before resolving so same-frame normal hits can trade symmetrically. Do not let player-first mutation cancel an already-valid enemy hit. Strike beats a grab that has not captured yet; grab cannot snatch someone airborne. Avoid counter recursion and multiple resolves.
- All projectiles keep cast identity, impact kind and travel/knock direction independent of current owner action/face. Reflection changes owner and velocity, at most once; original caster can then block/evade it. No direct remote damage from parry. Max one active plane or queue per owner.
- Preserve deterministic seeded tests. Difficulty should primarily change reaction/choice rather than move stats/hidden extra startup. Same moves use same damage/timing for both sides; easy AI makes more mistakes. Need range-aware legal movement, block, jump/crouch and reasonable move selection so each kit gets used. No reads of future player input. Keep ai=false mode and add clean player/enemy input simulation if useful for tests.
- No test-only production backdoors. Tests may set starting positions/hp/state as fixture, but claims about responding to moves must execute real requests/inputs and time steps, not inject damage.

## 21 moves
Values below are initial normal-damage targets; moves default around current cooldowns unless noted. Each must have startup, active/recovery, whiff cost and understandable counters.
Wang:
1 rush: low-profile visible roll, 14 contact damage, CD4; high shots pass over roll. Not invulnerable; low attacks, queues and grabs threaten it.
2 counter: contact-only parry, about .4s window, automatic 12 damage to attacker in true reach plus self-retreat. No projectile or grab defense. CD6, visible whiff recovery.
3 heal: +10 only after ~1.0s uninterrupted drinking, CD10; hit emits spit and cancels heal, cap100.
Han:
1 coin: high fast straight projectile,11 damage, CD4, crouch/jump/block/reflect/erase can beat it.
2 han_knee: retain .18-.60 folded knee travel and .62-.74 shout timeline for approved art, 14 mid shout knockback60, total1.08 CD5.5; low-profile during visible folded body, no invulnerability, low/grab can hit.
3 arrow: mark original target location, ~1.2s flight,20 damage, CD7; no tracking, leave mark or block, no reflect/contact parry of remote owner.
Ma:
1 ma_handshake: true short grounded grab,12 damage, blocks/parries don't stop it, obvious >=.25s startup and >=.35s punishable whiff recovery, CD5. No tracking through jump and no safe cancel. Render event for capture.
2 ma_gaze: upward palm anti-air14; grounded target9, short reach; block/range beat it. CD5.5. No transformation.
3 ma_cough: two high short pulses4+6, each erases at most one straight projectile, not arrow; total ~.9s, CD6. Interrupt startup or block both and punish recovery. No disease status.
Su:
1 su_shout: 14 mid cone,guard cost2, strong push, slower visible >=.30s startup, CD5.
2 su_rush: three stepping impact windows6+5+5 max16; advances in visible steps, CD5.5; max guard-cost1 per cast, can be stopped by contact parry/queue/jump. No uninterruptible armor.
3 su_dare: short ~.30s contact counter window after telegraph,18 damage close return punch, longer >=.4s whiff recovery,CD7; no ranged retaliation, grab beats it.
Huang:
1 huang_shout:14 mid wave, long push, one bounded wall bounce adds at most3 damage without prolonged stun chains,CD5.5. Block/interrupt/range beats it.
2 huang_debt: short ~.35s rejection: contact hit is stopped once with no auto retaliation and quick recovery for manual punch; straight coin/plane physically reflects (max once),CD6. Grab/late second hit/lob beats it. Thus useful even versus no-projectile kits.
3 huang_queue: plant one short-lived ~1.5s ground queue line in front. First grounded crossing takes10 and is knocked back, then line vanishes. Jump, basic attack or projectile can destroy/bypass it. Not an impassable wall,CD6.5.
Chen:
1 chen_dream: high paper plane outward8 and returning6, at most one hit per phase and one plane per owner, ~450px outbound; block or reflect ends its original return path. CD6. Slow projectile earns second timing; no indefinite offscreen loops.
2 chen_question: first high5, second low8; explicit timing and visible staged hands,CD4.5. Guard blocks both; crouch won't avoid second, early jump may meet first. No confusion-input status.
3 chen_calm: one ordinary hit reduced to max4, self-retreat60, no retaliation, no immunity after;short stance,CD7. Grab bypasses,second hit can catch. At wall cannot magically escape through attacker.
Ko:
1 ko_bags: first low6, second mid8; destroys queue obstacle if swing reaches it,CD4.5. Not permanent projectile eraser. Real two-hit timing, block/counter/startup interrupt.
2 ko_name: short/mid range arcing word lands at visibly marked fixed point,12 ground impact plus25% movement slow for~.7s on unblocked hit. Guard prevents slow, move/jump off landing beats it; no input lock/reversal. CD6.
3 ko_resolve: ~.16s startup then ~.9s one-hit armor that may carry into next normal punch: reduce ordinary damage to60%, no hitstun/knock/attack cancellation on that one hit. Second hit and grab win. Other special removes armor. No reflect/heal. CD7. Must not be dominated by permanent normal guard.

## Interface and tests
Send owner an early concise contract: fighter fields for guard pip/break/armor/slow; projectiles (kind/position/phase/target), obstacles array and new events. Prefer fields guardPips,guardBroken,armor,slow and obstacles for display; existing HUD ignores extras safely. Keep f.attack.kind/age/variant so approved rigs keep working. If durations change, report a timing map for pose rescaling.
Tests first: baseline known bugs; crouch/high vs mid/low, jump/grab; guard per-cast costs/regeneration/break; actual reflection and cast identity; legal-input counters/punish; once armor vs second strike; both directions and simultaneous trade; all21 actual mechanics; all49 pairings finite and no corner lock. Old tests intentionally locking old mechanics must be replaced/updated with explicit rationale, not bypassed to inflate pass count. Keep alias/source and noncombat UI/art coverage. Test full suite and report named old failures to owner rather than silently ignoring them.

## Report
Write docs/qa-v13/engine-report.md with implementation decisions, tests red/green evidence, exact interface and changed timing/damage, remaining failures and concerns. Return concise completion summary. No Git commits by delegate.
