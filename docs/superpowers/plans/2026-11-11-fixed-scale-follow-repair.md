# Fixed-Scale Follow Repair Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development. One implementer, one independent task review; no nested delegation.

**Goal:** Remove the new collision-driven background jump without changing fixed player scale or combat.
**Architecture:** Shared fixed-profile geometry reserves80world units horizontally; bounded x follow stays in that connected safe interval. Hints project the actual saved player pose. No wrapper state or new renderer.
**Tech Stack:** Existing ES modules, Node tests, jsdom and native alpha helper.
**Spec:** docs/superpowers/specs/2026-11-11-fixed-scale-follow-repair.md

## Global Constraints
- Base WIP c254321fe84ae57a6c31875792dbd771919668d9, original published #67 immutable. Candidate /workspace/scratch/1a1351aee944/punchline-mobile-landscape-nov11/candidate.
- Only measured compact-touch logical-landscape stable, root/later all shared paths. Constant scale per geometry; no non-target profile, combat, storage, art, cache, density or renderer change.
- Actual player box[-132,132]×[-300,28], expanded initialization box[-212,212]×[-300,28], reserve80world units, horizontal speed480CSSpx/s, elapsed clamp0..50ms, missing/nonfinite1000/60ms. Existing hard and soft safety unchanged.
- Version2 marker/key, target versus actual projection distinction, frozen-state and safety-override semantics follow spec exactly. No new mandatory user approval, preview, publication, branch change or cleanup by implementer.
- Runtime token already post67-display-repair-20261111-r1; retain and normalize only if new local imports need it. Two old untracked trial docs stay untouched.
- Preserve all frozen oracle bytes; do not regenerate from candidate. Full npm test before completion; no claim that model results establish browser/phone or cache performance.

## Review Focus
1. Delta0/negative/nonfinite/long frames and equivalent30/60/120Hz speed budgets; no pause catch-up.
2. Nonzero lag at pause/finish and same-size geometry rebase must not settle or snap unnecessarily.
3. Beyond-reserve/repeated corrections may exceed speed only for minimum safe clamp, with truthful metadata.
4. Hint blocker follows actual saved pose, not target or changed live actor.
5. Small recorded layouts require the reserve and original-alpha checks at both interval edges, without weakening old safety.

### Task 1: Correct shared fixed-scale follow and its contracts

**Files:**
- Modify: dist/challenge-camera.mjs, dist/camera-direction-hints.mjs.
- Create: tests/mobile-stable-player-follow.test.mjs.
- Extend: tests/mobile-stable-player-camera.test.mjs, tests/mobile-stable-camera-lifecycle.test.mjs, tests/camera-direction-hints.test.mjs, tests/mobile-landscape-low-pose.test.mjs.
- Precisely scoped obsolete fixed-profile assertions: tests/mobile-landscape-profile.test.mjs, tests/mobile-camera-review.test.mjs. Report any other required test-file extension before editing.
- Update: docs/mobile-landscape-camera-contract.md for the new behavior/limits. External logs/scripts in this plan workspace or external camera/follow-revision; no production diagnostics.

**Interfaces:** consumes existing fitChallengeCamera/preferred geometry/previous frame/delta and current hint API. Private fitPlayerFixedCamera gains positional delta; public signatures unchanged. Produces spec version2 fixed state/follow interval and actual-position hint blockers. Existing wrappers/world reset owners unchanged.

- [ ] **Step1: Verify base/status and read spec.** Sole writer; inspect applicable instructions. Do not overwrite other paths. Existing external recommendation/proofs are design evidence, not implementation.
- [ ] **Step2: Write RED tests.** Reproduce actual main street seed0x671100/frame825 from frame0 with real input script (external task4/reproduce-inherited-motion.mjs and compare-inherited-motion-camera.mjs provide setup). Assert fixed z, ≤8px horizontal pan per60Hz frame with no override for960frames, known step8px, original engine positions unchanged. Add both-direction synthetic within/beyond-reserve, no enemy-driven effects, stopped-player settling, six recorded geometry scales and intervals, delta boundaries. Add divergent target/actual/live-player hint blocker RED. Run targeted RED and retain failures.
- [ ] **Step3: Implement spec in the two runtime files.** Expanded envelope and version/key validation, bounded x/minimum safety clamp, exact y, freeze/rebase/reset semantics. Cache geometry policy, not per-frame2D searching. Keep legacy code and backdrop formulas intact.
- [ ] **Step4: Complete lifecycle/entry/alpha coverage.** Nonzero-lag pause, finish, true/equivalent reflow, resize, mode change/resume and world reset through actual existing wrappers. Main/later parity844/568/native±90logical geometry. Keep24960 original alpha cases and add original-art left/center/right lag edge cases across recorded layouts/both facings. Preserve explicit low-head overlap caveat. Update only obsolete fixed-profile equality claims; retain target equality, exact z and nonfixed expectations.
- [ ] **Step5: Update contract.** Describe desired target versus actual position, reserve tradeoff relative to unpublished maximum and shipped trace, horizontal-only rate bound, mandatory safety override, inherited actor correction and remaining browser limits. No universal smoothness claim.
- [ ] **Step6: Verify focused.** node --test tests/mobile-stable-player-follow.test.mjs tests/mobile-stable-player-camera.test.mjs tests/mobile-stable-camera-lifecycle.test.mjs tests/camera-direction-hints.test.mjs tests/mobile-landscape-low-pose.test.mjs tests/mobile-landscape-entry-contract.test.mjs tests/mobile-classic-v67-golden.test.mjs tests/mobile-landscape-profile.test.mjs tests/mobile-camera-review.test.mjs tests/challenge-camera-solver-equivalence.test.mjs tests/mobile-camera-preservation.test.mjs . Require zero failures; check original golden SHA584959896ba56b775dce542f500492d690906d9cbf1af2667f6a3c021db48df6 and other original oracle hashes.
- [ ] **Step7: Full npm test and coherence.** Capture complete counts/exit/log hash, known diagnostic counts, normalizer check and git diff --check. No build/freeze/preview yet.
- [ ] **Step8: Scoped commit and report.** Stage exact assigned paths; commit fix: reserve safe horizontal camera follow. Report file list, RED/GREEN/full evidence, correction trace and safety fallback, all exceptions/limits. Stop for independent review. Controller then resumes original Task4 acceptance/freeze and browser/cache/backup gates.

## Self-review
All spec sections map to one coupled task; no new wrapper API or parallel writers. Five review risks map to Steps2–4. Conservative reserve is selected; alternate narrower-head policy is not authorized. Original static alpha suite remains and new lag alpha adds coverage. Parent has approved proceeding under existing user request.
