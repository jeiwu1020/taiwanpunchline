# V18 AI timing and recovery handoff

## Scope

Work is isolated to `/workspace/shared/parliament-v18-core`. The supplied baseline is V16, commit `426ddb874cda7f08e672cd487ddfc28b140d0ba3`. No edits were made to the real Site checkout. No preview, browser, deployment, commit, push, source audio, art, roster, or numerical combat rules were changed.

Integrate only these source/test files, not the older copied checkout:
- `dist/core.mjs`
- `tests/ai-pressure-v13.test.mjs`
- `tests/ai-timing-v18.test.mjs`
- `tests/ai-pairs-v18.test.mjs`

`core-and-tests.patch` carries the initial handoff for exactly these four files. Apply `p2-preserve-defense.patch` afterward for the independent-review correction described below. The live isolated source files already contain both patches. This folder contains supporting results and can be retained as QA evidence. Integration/browser review belongs to the parent task.

## Implemented behavior and exact parameters

- A current visible attack, projectile, or ground queue has its own identity, first-seen simulation timestamp, first-response deadline, and recheck deadline.
- First response and later recheck delays: **normal 0.16–0.30s**, **easy 0.40–0.68s**, uniformly sampled. The old values were only recheck delays, allowing the first decision immediately.
- Existing eligibility remains: melee telegraph age greater than 0.05s and within move range + 15px; straight projectile within 290px; marked lob within 65px and less than 0.6s from impact; hostile ground queue ahead and within 140px.
- A new cast or hazard cannot inherit the time spent observing a previous one. Leaving perception range or disappearing removes its observation. Re-entering earns a new delay. The AI observes while busy, but all choices still use the ordinary legal action gates.
- Offensive selection of counter/reject/calm stances also requires the observed attack deadline. This closes the independent path that previously read a fresh attack before the defensive reaction path.
- The actual end or cancellation of an AI attack starts a separate offensive recovery gap: **normal 0.14–0.22s**, **easy 0.26–0.40s**. It cannot expire during the attack. Natural completion, interruption, and a consumed rejection/counter stance are covered.
- Recovery is **not a movement/defense freeze**. Within 170px the AI steps away using the same ordinary retreat guard as a player. This follows its own action ending, even when the opponent does nothing. Grabs and guard depletion still beat it. Jump/guard and defensive responses to already-observed threats remain legal; normal offensive follow-ups, descending punches, and buffered recovery punches must wait.
- Response probability remains normal 78% / easy 40%. Ordinary offensive choice intervals remain normal 0.32–0.62s / easy 0.60–1.15s. The initial 0.9s offensive wait is unchanged.
- Hitstop and pause do not advance these simulation deadlines. Frame quantization can make actual delays slightly longer. At 120Hz, the measured sight-to-guard examples are normal 0.166667–0.300000s and easy 0.400000–0.683333s. See `measured-timing.json`.

No damage, special cooldown, move startup/active/duration, guard pips, ordinary hitstun, armor, or attack legality changed. No new armor or invulnerability was added. Existing Ko one-hit armor remains unchanged.

## Defect found and fixed during verification

The first implementation cleared all AI input during recovery. That also disabled retreat and guarding, giving a close opponent repeated free hits. This was a real regression, not merely expected easing from slower reactions. In a fixed-player-input, same-seed 294-round normal comparison, recovery occupied 44,656 of 269,216 initial-version frames, about 16.6%.

We isolated the causes rather than tuning to an arbitrary win target:
- V16: AI won 116/294; mean damage to player 84.9.
- Initial V18 with movement/defense frozen: AI won 1/294; mean damage 55.4.
- Remove recovery entirely but retain genuine perception delay: AI won 18/294; mean damage 67.2. This confirms that part of the old strength came from immediate reads, not just the recovery regression.
- Allow defense without adding a recovery movement policy: AI won 0/294; mean damage 55.0.
- Pre-P2 policy, retreat guard during the same offensive gap: AI won 19/294; mean damage 65.5. Blocks rose from 1,091 to 1,966 and special starts from 897 to 1,166. See `investigation.json` and `investigation-spacing.json`.

The separate pre-existing 588-round stress script shares its RNG between AI and scripted input. Its exact outcomes therefore are not an identical-input comparison, but remain useful as a fixed seeded regression scenario:
- V16 easy: player 293, AI 1. Normal: player 167, AI 127.
- Initial V18: player won all 294 easy and all 294 normal fights.
- Pre-P2 V18 easy: player 285, AI 9. Normal: player 270, AI 23, draw 1.
- Final V18 after P2 easy: player 289, AI 5. Normal: player 267, AI 26, draw 1.

**Normal AI is still materially easier than V16. Balance is not finished or claimed.** Genuine first-observation delay intentionally removes impossible fresh-jab blocks and many immediate counters. All seven opponents still escape sustained jab pressure and land retaliatory hits in the unchanged tests. Human playtesting is needed to calibrate normal difficulty; no hidden damage or armor compensation was used to chase the old win rate.

## Tests and evidence

- First TDD run: 17 of 18 new tests failed on V16 for the intended missing delay/gap behaviors; the existing disappearing-threat safety case already passed. `red.log` records this.
- Recovery regression TDD: three focused tests failed before allowing legal retreat/guard and correctly gating buffered punches. `recovery-red.log` and `recovery-green.log` record this.
- Final `npm test` after P2: **819 passed, 0 failed**. See `suite-final.log`.
- New coverage: 34 observation/recovery tests, including minimum/maximum sampled delays, unseen input, real projectile/queue observation, new cast, late observation, leaving/re-entering range, stale threats, round reset, pause/hitstop, interrupted/consumed actions, continued movement, no offensive chaining, no unseen-input dependency for recovery guard, grab punishment, and guard-break punishment.
- New pair coverage: 49 player/opponent combinations × 2 difficulties × 2 seeded sides = **196 complete fights**, plus a repeat-identical-seed determinism check. Numerical state stays finite and valid, rounds end, and AI participates. No win-rate assertion is used as a numerical fairness test.
- All 42 unchanged held-jab pressure tests pass: 7 AI characters × 2 starting positions × 3 seeds, including actual defensive escapes and retaliatory hits.
- Existing side/facing/difficulty damage, interruption/cooldown, guard and all special-rule tests remain green. `combat-rules.mjs` and `roster.mjs` hashes remain identical to the supplied baseline/current Site versions.
- Existing extended soak: **588 rounds completed**, all 21 special kinds used by AI, maximum 3 simultaneous projectiles and 2 queues. See `soak.json`.
- `node --check dist/core.mjs` passes.

The one changed legacy expectation required blocking an unprepared 0.10s jab and immediately punishing it. That contradicts the approved minimum 0.16s observation delay. It now verifies the AI takes the jab and waits for ordinary hitstun before a legal recovery escape. No held-jab escape requirement was removed.

## P2 independent-review correction

The recovery movement fallback replaced the whole AI input object, accidentally deleting an already-selected crouch or explicit guard on the next frame. Reproduction with Chen/Ma, normal, random sample 0, positions 400/560, Ma gaze at time 0 and Chen plane at 0.30s: AI legitimately crouched at 0.775s, then lost it at 0.783333s before the lowering animation could continue.

The fix merges only left/right movement into the preserved input object. It does not bypass perception deadlines or offensive recovery. Two new regressions use real attack/projectile lifecycles: the crouch blend continues on the next frame, and an explicit guard lasts through recovery end. Both failed before the one-line behavior fix and passed afterward (`p2-red.log`, `p2-green.log`).

Final fixed-player-input, same-seed comparison after P2: **17/294 normal AI wins, mean player damage 66.5**, compared with baseline 116/294 and 84.9. The pre-P2 result was 19 wins and 65.5 damage. These small win-count changes are reported, not used to optimize against the script. Normal remains substantially easier than V16 and needs human calibration. Final 588-round stress outcomes are 5 easy AI wins and 26 normal AI wins with 1 normal draw; all 21 specials still execute. See `investigation-p2.json` and `soak.json`.

The precise incremental fix is in `p2-preserve-defense.patch`: `dist/core.mjs` and `tests/ai-timing-v18.test.mjs` only. No tuning values or other combat mechanics changed.

## Human-readable QA for integration

1. At close range in normal mode, throw one fresh jab at an idle unguarded AI. It should no longer read the new input and block instantly. The AI can still guard preemptively or react after a hit it actually received.
2. Compare a slow Han knee shout in normal and easy: normal can notice and defend after a visible delay; easy responds later and will miss more short opportunities.
3. After the AI finishes a punch or special, look for a short offensive pause. Nearby it may step backward and guard; it should not freeze in place or instantly chain another attack.
4. Use Ma's handshake against recovery guard, or break low guard pips with pressure. Both remain real counterplay; this is not invincibility.
5. Interrupt an AI special before its effect: it still cancels and keeps its cooldown. Player specials have the identical rules.
6. Hold jab against every AI in center and at a wall. They should eventually escape/retaliate instead of being permanently locked, without instant new-input reactions.
7. Pause during a telegraph or recovery and resume. The remaining delay should still be there.

Browser/visual QA, audio integration, and subjective game feel were not performed by this core worker.
