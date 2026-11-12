# V10 independent engine review

Reviewed 2026-11-06 against `11b6ec776728028a84552d3c6f9e6abdcac038bb`, the V10 spec, Task 1 of the implementation plan, and the engine report. Scope: `dist/core.mjs`, `dist/roster.mjs`, and engine tests. No production files were changed by this review. No browser, preview, commit, push, or deployment was started.

## Verdict

**V10 engine semantics: pass. Both findings from this review are resolved within the agreed scope.** The dream lifetime defect has a narrowly scoped fix and fresh independent verification. The brace wording issue has been resolved in the roster hint by clarifying the intended behavior. No unresolved release-blocking engine defect was found.

**Code/test quality: acceptable for this existing buildless engine.** The change is small, preserves the `Duel` API, adds only the needed behaviors, and retains ordinary combat/control safeguards. It does not establish visual/anatomical quality, audio authenticity, source accuracy, or final deployment readiness. Those require the separate presentation/source review and final integration checks.

Snapshot reviewed:

- `dist/core.mjs` SHA-256 after the lifetime fix: `4808463b22b9fd67b339034559eec9335ce306ec7d3a922c133618e7b0adc23d`
- `dist/roster.mjs` SHA-256 after the hint clarification: `17720f35b04b4e62464c9c93488b5e50aa383729650ad585449a27570d733cb6`

## Findings

### Resolved P3: dream could hit after its configured lifetime expired

Location: `dist/core.mjs:41-46`, especially movement/lifetime subtraction at line 41, collision at line 44, and filtering only afterward at line 46.

Before the review fix, the shared integrator moved a projectile for the entire frame and checked collision even when its lifetime expired partway through that frame. Floating-point residue could also grant an extra frame. This code predated V10; the newly introduced dream projectile inherited it. The effect was a small frame-dependent range extension, not duplicate issuance or a persistent projectile.

Reproduction using normal public inputs and initial positioning:

```js
const g = new Duel('chen', 'normal', () => .5, 'wang');
g.player.x = 68;
g.enemy.x = 815;
g.press('special1');
for (let i = 0; i < 200; i++) g.step(.031, {}, false);
console.log(g.enemy.hp); // Before fix: 88. After fix: 100.
```

The projectile starts at x128. Speed 350 and lifetime 1.8 give a maximum center of x758, leaving a 57-pixel gap to the target, outside the strict 48-pixel collision radius. On the observed final frame, life is .002 and center is 757.3; the engine nevertheless integrates .031 seconds and applies the hit after life becomes -.029. At 60 Hz, x810 also gets hit because a lifetime residue near `1.44e-15` survives the preceding frame.

Resolution: the engine author added `simDt`, capped to remaining live time only for `kind === 'dream'`, and uses it for position, velocity, life, and age. Collision is permitted at the final legal endpoint, followed by removal. Coin and arrow retain their original `dt` behavior. Six real-move regressions were added for x815 miss / x805 hit at .031 seconds, 60 Hz, and 144 Hz.

Independent re-review: those six regressions and all 20 V9 fixture tests pass, **26/26**. A further **80/80** range checks pass across eight frame sizes, target x805/807/810/812/815, and both orientations. Each produces one launch, bounded travel and age, and no remaining projectile. The previously failing x815 and x810 cases now miss while the valid near-endpoint target still takes 12 damage.

### Resolved clarification: brace cancels impact knockback, not later body pushing

Locations: `dist/core.mjs:22` (zero braced attack knockback), `dist/core.mjs:40` (ordinary body separation), `dist/roster.mjs:65` (hint).

Ko at x500 versus Wang at x300, with Ko special3 and Wang special1 requested together, takes exactly 2 chip at elapsed .4917 and remains at x500 on impact. Wang's still-running rush subsequently causes body-overlap separation, moving Ko to x560.25. Su's rush similarly moves Ko to x519. No retaliation occurs.

The integrator clarified that the approved meaning is **cancel that hit's knockback**, not root Ko in place or disable body collisions. The hint now says `免該次震退` instead of `不退`; this correction was verified in the current roster. No physics change is recommended. The integrator owns the matching gameplay-description clarification.

## Spec compliance

- All 21 roster slots use the specified keys and names. Wang's counter is renamed without replacing its original mechanic; Han's coin and arrow remain unchanged.
- Brace is grounded-only, chips 2 regardless of enemy difficulty, adds no attack knockback, never retaliates, and is consumed by one accepted hit. Later combo hits/projectiles use ordinary rules. The attack and defensive timers clear on interruption and match finish.
- Counters consume their own stance before resolving the response. Nested counters terminate, use the responding move's damage/knockback/impact, and can consume brace without recursive retaliation.
- Han's advancement and damage windows are separate. The advance itself never calls damage. It does not set crouch, alter collision height, or grant invulnerability; ordinary movement/air-attack eligibility and bounds remain intact.
- Dream creation is guarded by the attack's `fired` flag. Its own impact and knockback metadata remain attached after its owner recovers or changes attacks. An already launched dream survives owner interruption; startup interruption prevents creation. Lifetime integration now stops at the legal endpoint, including fractional final frames.
- Ma cough, Chen question, and Ko bags use two individually consumed strike windows. An interruption after the first prevents the second. Su rush remains a single hit, not three hits.
- Strict attack-window boundaries, cooldown-at-acceptance, non-refund on interruption, the enemy's additional .23-second telegraph, and normal/easy damage scaling are retained.
- Paused and finished games reject simulation/input. Ordinary punch combo, jump, crouch hitbox, buffering, guard, movement, score fields, and AI selection logic were not rewritten.
- No persistent queue wall or new collision object was introduced.

## Test review and independent checks

This review did **not** simply rerun the reported 347 passing engine tests or claim a fresh full-suite pass.

The new signature tests replace obsolete move-specific tests with timing, damage, both orientations, both player/enemy roles, interruption, cooldown, pause, boundaries, brace, dream, and counter cases. The original 49-pair AI approach checks and 294 complete-match scenarios remain. Generic core/crouch tests were not removed.

Additional checks executed during this review:

1. **192 real-step attack executions**: all 12 offensive data-driven moves, player and enemy, both orientations, at 144 Hz, 60 Hz, 30 Hz, and the .034-second cap. Damage totals, hit count implications, recovery, and cleared defense states matched the expected behavior; zero mismatches.
2. **All 16 counter pairings**, including Wang with every new counter, produce two consumed counters and exactly one final bounded response with the expected difficulty-scaled damage.
3. **Actual rush-versus-brace collisions**, revealing and then resolving the wording/physics distinction above.
4. **Projectile lifetime/range edge cases** at multiple frame sizes, producing the P3 reproduction above and then independently verifying the fix with 80 additional cases and the six new regression tests.
5. **Independent reconstruction of all 20 V9 fixture hashes directly from the stated base commit**, loading the base core and roster separately. All 20 saved hashes matched the actual old implementation. They are not merely hashes of V10 output relabeled as legacy evidence.

The full-suite result in `docs/v10-engine-report.md` remains that worker's evidence. Final aggregate testing after concurrent UI/art edits belongs to the integrator.

## Source/audio caveats

The reviewed metadata consistently labels combat as invented satire and source-bearing moves as text-context checks only, not listened-to audio or cleared reuse rights. No new audio field or audio asset was added by the engine implementation.

Specific caveats are preserved: Han's kneeling and quote come from separate events; Ma cough is `咳、咳` and a sound joke rather than a spouse or a spoken three-character quote; the gaze does not target an ethnicity or create a transformation; Huang's queue story is framed as an allegation; Ko's intended name is `賴清德`, distinguished from the meme interpretation `賴祥德`.

These disclosures are appropriate metadata. They do not by themselves verify the linked media, establish reuse permission, prove that synthetic sound labels are visibly rendered, or certify the retained Han recording. No independent listening or external source verification was performed in this engine review.
