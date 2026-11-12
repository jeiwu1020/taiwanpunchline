# Challenge v65 verification

## Scope delivered
First playable chapter adds the wake-up comic, three Taiwanese street sections, three fictional mob types, two one-round mini bosses and a best-of-three Huang finale. The original duel/training modes remain available. Starting roster and hidden QA entry retain existing profile behavior.

Each of three independent local saves owns its checkpoint, roster and team XP. Every character gets the same total skill allowance, with independent allocation/reset and personal XP display. Seven stat branches have five ranks each; buffs apply to challenge only. JSON export/import includes all three saves with strict validation. Local saves are not Google-account synchronization, online ranking or tamper-proof records.

Assist starts ready and recharges after actual received damage totaling 35% maximum HP, maximum one charge. Ordinary duel and challenge use the same rule. Healing does not recharge or reset it; Boss/new-round entry restores one assist and zero rally. Route transitions preserve resources in the running session. Reload/retry resumes the saved encounter checkpoint, not an exact mid-animation combat snapshot.

Retries/replays can earn mob XP again. Persisted attempt receipts prevent duplicate payout within one attempt and prevent reload farming. Route/Boss/unlock rewards remain once per save. Reward values and the 35% threshold are provisional and configurable, not claimed to be balanced.

## Browser observations, 2026-11-09
- Local managed preview served the current source, not the public website.
- Viewed generated wake-up/pajama/story art and live skeleton-based mobs.
- Used keyboard controls to fight/move/jump along the first street, reach its gate, enter the mini-boss duel, lose and retry.
- Reloaded and confirmed checkpoint and earned 59 XP persisted.
- Exported original test saves before importing a synthetic checkpoint-5 fixture through the normal file chooser and confirmation.
- Confirmed each character had six independently allocatable points. Resetting/allocating Wang did not alter Han. One HP point produced 103 maximum HP in actual battle.
- Entered final Boss at 0:0, saw the series advance to 0:1 after loss, and verified new-round HP/resources reset. The entire finale was NOT manually won end-to-end; final completion/unlock paths are covered by automated tests.
- Inspected desktop 1180-wide, portrait 390x844, landscape 844x390 and 390x720 rotated-touch previews. Chapter landing and comic dialogs follow the game's rotation; skill detail remains scrollable with themed styling.
- Cycled portrait/landscape/portrait three times; final active-battle stick, guard, attack and all three special controls were inside the viewport and hit their visible centers.
- No local application console errors observed in these flows.
- Restored the original test JSON (slot 2, 59 XP, checkpoint 1), and restored local sideways preference to off.

These are Chrome viewport checks, not physical iPhone/Safari tests or simultaneous multi-touch hardware verification. Audio routing has automated regressions; perceptual audio mixing on a real phone still warrants user testing.

## Defects fixed during verification
- Route loss handling assumed a named political opponent for fictional mobs.
- Route item sprite indexing grew instead of resetting per frame.
- Between-round result visibility could show the retry button due to CSS specificity.
- Native challenge/story dialogs did not inherit the app's rotated logical viewport.
- Permanently deduplicated mob rewards prevented repeated attempts from yielding growth.
- Cough-erased projectiles could still collide during the same update.
- Replayed chapters used the wrong speaker name for newly unlocked characters.

## Deferred content
Only the first chapter and Huang unlock are authored. Later political Boss chapters, variants/infinite castle, additional stories and cosmetic/new-move skill branches remain future work. The first version supports the extension structure but does not pretend those stages exist. Cloud accounts, leaderboards and multiplayer are excluded.

## Recovery and release
Baseline is published Site #41, source a69ba1babac970384c66492bf4a0a9174bf73700. The baseline archive and a separate v65 source archive are retained. No public Site was replaced during implementation or this QA session. Publication must use the parent-owned authorized release flow, followed by deployed-site smoke testing.

## Final automated run
`npm test` on 2026-11-09 after all fixes: **2,207 tests passed, 0 failed, 0 skipped**, 9.41 seconds. Coverage includes original regression tests, all starter/mob attacks, route/boss transitions, best-of-three reset, final unlock, profile/QA boundaries, strict save import, attempt reward deduplication, stat effects and actual-damage assist charging. Unit coverage is not a substitute for a real-device playthrough or balance evaluation.
