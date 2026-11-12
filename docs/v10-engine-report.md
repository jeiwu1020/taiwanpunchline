# V10 signature-move engine report

## Result

Implemented the approved 21-slot roster and V10 combat rules. No proposed balance values were changed. No new voice assets, commits, pushes, deployment, or new Codex tasks were created by this worker.

Owned edits:
- `dist/core.mjs`
- `dist/roster.mjs`
- `tests/roster.test.mjs`
- `tests/second-roster.test.mjs`
- `tests/second-roster-legacy.test.mjs`
- `tests/signature-moves.test.mjs`
- `tests/fixtures/unaffected-v9-traces.json`
- This report

The presentation worker edited art/game/UI files concurrently; those changes are not claimed here.

## Public integration contract

`Duel` remains the API. `CAST[id].moves` preserves three slots per character, in spec order:

- Wang: `rush`, `counter`, `heal`.
- Han: `coin`, `han_knee`, `arrow`.
- Ma: `ma_handshake`, `ma_gaze`, `ma_cough`.
- Su: `su_shout`, `su_rush`, `su_dare`.
- Huang: `huang_shout`, `huang_debt`, `huang_queue`.
- Chen: `chen_dream`, `chen_question`, `chen_calm`.
- Ko: `ko_bags`, `ko_name`, `ko_resolve`.

New runtime metadata:
- `han_knee`: `behavior: 'advance'`, `advanceStart: .18`, `advanceEnd: .60`, `speed: 150`; its distinct damage window remains `.62 < age < .74`. Advancement does not itself hit.
- `chen_dream`: `behavior: 'projectile'`, `projectileKind: 'dream'`, `speed: 350`, `life: 1.8`. It emits one `launch` event. The projectile includes `impact: 'chen_dream'` and `knock: 30`, so its identity remains correct even after the owner recovers or starts a different move.
- `ko_resolve`: `behavior: 'brace'`, `start: .12`, `window: .65`, `duration: .92`. Fighters now have numeric `brace`, initialized to zero and decremented on simulation time.

`move` events still include `f`, `name`, `kind`, `word`, and `fictional`. Counters retain their own move's damage, knockback, and hit impact. The new brace emits an ordinary `block` event with the additional `braced: true` field.

All active-hit windows use the existing strict boundary convention: start and end themselves do not deal damage. Move recovery ends strictly after duration. The enemy retains its existing `.23` second extra startup telegraph. Cooldowns begin on acceptance and are never refunded by interruption.

## Rules and exact values

| Move | Behavior and timing | Damage / knockback | Cooldown |
| --- | --- | --- | --- |
| han_knee | Advance .18–.60 at 150; melee .62–.74, range 170; duration 1.08 | 18 / 60 | 5.5 |
| ma_handshake | Melee .18–.30, range 142; duration .56 | 14 / 72 | 4 |
| ma_gaze | Melee .25–.38, range 175; duration .72 | 13 / 70 | 5 |
| ma_cough | Pulses .20–.28 and .42–.50, range 165; duration .82 | 6 + 7 / 5 + 42 | 5.5 |
| su_shout | Melee .22–.36, range 185; duration .64 | 16 / 62 | 4.5 |
| su_rush | Rush .18–.48 at 500, range 118; duration .72 | 16 / 45, one hit | 5 |
| su_dare | Counter startup .20, window .48; duration .88 | 18 / 56 | 7 |
| huang_shout | Melee .24–.36, range 205; duration .68 | 16 / 55 | 5 |
| huang_debt | Counter startup .14, window .50; duration .82 | 15 / 48 | 6.5 |
| huang_queue | Melee .24–.38, range 175; duration .74 | 15 / 78 | 5.5 |
| chen_dream | Launch after .30; duration .72; speed 350; lifetime 1.8 | 12 / 30 | 5.5 |
| chen_question | Pulses .18–.27 and .40–.50, range 165; duration .76 | 6 + 7 / 5 + 35 | 4.5 |
| chen_calm | Counter startup .12, window .56; duration .82 | 13 / 44 | 6.5 |
| ko_bags | Pulses .16–.26 and .38–.50, range 155; duration .72 | 7 + 9 / 6 + 38 | 4.5 |
| ko_name | Melee .26–.40, range 190; duration .74 | 15 / 52 | 5 |
| ko_resolve | Brace startup .12, window .65; duration .92 | Receives 2 chip once, no retaliation | 7 |

Wang's three moves and Han's coin/arrow retain existing mechanics. Wang's counter label is now 從從容容. Ma's handshake says 謝謝指教 and is not an instant kill. Su's three-step rush is one hit, not three. Huang's queue effect creates no wall or persistent collision object.

## Defensive and interruption semantics

- Ko's brace only blocks while grounded, with the same ground criterion as ordinary guard. It is not invulnerability and does not modify any hurtbox.
- On the first accepted grounded hit, brace applies ordinary 2-point block chip, `.09` stun, `.1` reaction, and `.018` hit-stop. It applies zero attack knockback, immediately clears the attack and brace, and never automatically damages the attacker.
- A second simultaneous projectile or a later combo strike is handled by ordinary damage/guard rules. Brace cannot absorb a whole combo. The 2-point chip is not reduced by AI difficulty.
- An airborne brace attempt does not block an airborne hit. That hit applies ordinary difficulty-scaled damage and cancels the pending stance.
- Every accepted damage event cancels the victim's attack and clears both counter and brace timers. Counter resolution first consumes its own stance, then resolves the response. Two nested counters therefore terminate, and a counter response can consume a brace without causing another retaliation.
- Startup hits prevent later projectile issuance, melee pulses, or defense activation. An already launched projectile remains in flight after owner interruption, matching existing projectile behavior. It cannot duplicate its launch.
- Pausing returns before simulation work, freezing attack age, defense timers, cooldowns, reaction, positions, projectile lifetime, hit-stop, and match time. Resuming continues the same state rather than rearming defense.
- Match finish clears both defense timers and any live counter/brace attack. Further damage and input are rejected. A fresh `Duel` starts with no attacks, cooldowns, defense, or projectiles.
- Han's kneeling presentation does not set `crouch`, shrink the hurtbox, grant armor, or disable normal damage. Existing aerial attack eligibility and jump physics were not changed.

## Source and audio accuracy

The supplied research URLs were added without claiming independent listening or reuse clearance. Each source-bearing move retains an explicit note that only title, description, or transcript context has been checked, the media has not been heard, reuse rights remain unconfirmed, and game combat is invented.

Specific contextual caveats remain in metadata:
- Han's knee action and 可憐哪 quote are separate events joined by satire.
- Ma's cough is `word: '咳、咳'`, `memeType: 'cough'`; 酷酷嫂 is a cough-sound joke, not a spouse character or three-word spoken quote. The timestamp came from a PTT reference and remains unverified by listening.
- Ma gaze does not recreate an ethnic target or transformation.
- Huang queue's underlying allegation is described as the speaker's allegation, not established fact.
- Ko's `intendedName: '賴清德'` distinguishes the person being called from 賴祥德, a broken-voice/misspeaking meme interpretation.
- No new `audio` field or audio asset was introduced. Existing Han audio routing is presentation-owned.

## Verification evidence

Before edits: `npm test` passed **311/311**.

TDD: `tests/signature-moves.test.mjs` was written and run against the unmodified engine. Its initial run had **208 expected failures / 237 tests**, covering absent move keys, timing, damage, brace, dream, and revised source semantics. After implementation, three remaining fixture issues were identified and corrected: floating-point equality on a timer, waiting less than the stated dream lifetime, and activating brace too late for the existing coin speed. No production values were adjusted to fit those tests.

Final focused command:

`node --test tests/core.test.mjs tests/roster.test.mjs tests/second-roster*.test.mjs tests/signature-moves.test.mjs tests/crouch.test.mjs`

Result: **347/347 passed**.

Coverage includes:
- All new/reconfigured moves in both orientations, as player and enemy, on easy and normal.
- Independent exact startup/end/duration, damage, knockback, cooldown, reach, and vertical hurtbox assertions.
- Startup interruption, separate combo interruption, held crouch resumption, pause at three phases, fresh restart, and both arena edges.
- Brace against real punch collision, coin, marked arrow, dream, two simultaneous projectiles, both combo hits, counter response, air hits, expiry, and match finish.
- Nested counters without duplicate damage or recursion.
- Dream height, speed, lifetime, one launch, jump avoidance, unchanged crouch collision, and move identity after owner recovery.
- Full **49 matchups × 2 difficulties × 3 seeds = 294 complete matches**, plus 49 independent AI-approach/recovery checks.
- **20 pre-edit V9 golden traces** isolate the five unchanged Wang/Han moves across both orientations and difficulties. Their combat states/events/projectiles remain byte-for-byte equivalent. The intentionally renamed label is the only excluded presentation field.
- Existing normal attack combo, crouch hitbox, movement, jumping, buffer, and pause/replay control tests remain.

Old V5 whole-match hashes necessarily involved replaced specials. They were replaced with the independent V10 behavior contracts and preserved 294 complete-match scenarios, rather than updating hashes to arbitrary new production output.

`node --check dist/core.mjs` and `node --check dist/roster.mjs` passed.

Latest full `npm test` during parallel integration: **418/419 passed**. The sole remaining failure was presentation-owned:

- `tests/roster-ui.test.mjs:51`, “new moves use their own metadata and never inherit Wang or Han captions”, line 56 requires every banner to include `move.name`. The cough disclosure banner is being reconciled by the integrator.

No browser visual QA was performed by this engine worker. Parent integration owns the final full-suite rerun, independent review, browser QA, and private publication.

## Independent-review fix: dream lifetime endpoint

The reviewer reproduced a new-dream-specific expiry overshoot: the shared projectile loop advanced one full frame even when less lifetime remained. At `.031` second steps, Chen at x68 could therefore hit an enemy at x815, despite the paper plane's legal final center being x758 and its horizontal collision radius being 48.

The fix applies `simDt = Math.min(dt, Math.max(0, p.life))` **only to `kind: 'dream'`**. Movement, velocity integration, age, and remaining lifetime use that bounded delta; collision is evaluated at the bounded position. Coin and arrow retain their previous timestep and collision behavior.

TDD evidence:
- Added six real-move cases for `.031`, 60 Hz, and 144 Hz, with target x815 (must miss) and x805 (must hit).
- Before the fix, all three out-of-range cases failed. At `.031`, the target incorrectly lost 12 HP. At 60 and 144 Hz, the final centers incorrectly exceeded x758.
- After the fix, all **6/6** cases pass. The endpoint is x758 at all three step rates, age never exceeds 1.8 seconds, an in-range target remains hittable, and the projectile expires normally.
- Focused engine/input suite: **353/353 passed**, including all **20 unchanged Wang/Han golden traces** and the full matchup scenarios.
- Full `npm test` during ongoing presentation integration: **424/427 passed**. Remaining presentation/UI failures: “new moves use their own metadata and never inherit Wang or Han captions”; “new source links and explicit research/audio limits are present without changing Han clip”; “Chen and Ko special events do not trigger the original Han voice player”. No art, UI, audio, or roster files were changed for this fix.
