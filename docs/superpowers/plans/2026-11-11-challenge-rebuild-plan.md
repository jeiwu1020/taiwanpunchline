# Challenge Rebuild Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development or superpowers:executing-plans. Complete each independently testable task with failing regression evidence, implementation, verification, and review.

**Goal:** Stabilize the four existing challenge chapters and deliver a coherent preparation, ability, and fresh-save system as an unpublished candidate.

**Architecture:** Keep existing content and combat/transition kernels. Add shared viewport epochs, predictive camera framing, shared real character stats, a fresh single-authority storage API, and one preparation component. Parent integration owns shared entry files and resolves cross-task contracts.

**Tech Stack:** Existing browser ES modules, Canvas/Phaser renderer, CSS, localStorage plus Web Locks, Node test runner and jsdom. No new product dependency.

**Spec:** ../specs/2026-11-11-challenge-rebuild-design.md

## Global Constraints

- Base c8d83fda73ca9de58fc163f64124a3579db5f0d5 / Site #64. No publish, remote push, access change, new Site, or migration.
- Never delete old saves, backups, source directories, artwork, or unrelated previews.
- Preserve original assets, 21 moves, four chapter content, XP/first-clear rules and original comic style.
- Mutations run only in the candidate or a per-task isolated clone. Shared entry files are integrated by the owner, not concurrently edited.
- No actual player storage in tests. Use isolated browser origin/profile fixtures and explicitly synthetic data.
- Full suite runs against frozen inputs before completion; a focused suite is not the full pass.

## Review Focus

- Delayed viewport/safe inset and overlapping rotations must never enable stale-coordinate input; pin to Task 1 tests.
- Normal enemy spawn plus safe fit must not bypass camera smoothing or churn texture coverage; pin to Task 2 integration trace.
- Character stats must not be multiplied twice or leak challenge ranks to VS/training; pin to Task 3 mode matrix.
- Old pending writes, another tab and reset/import generation changes must not restore obsolete progress; pin to Task 4 adversarial storage suite.
- Viewing, drafting, cancelling, retrying and leaving must have distinct side effects and honest buttons; pin to Task 5 and Task 6 real-flow suite.

### Task 0: Verify immutable baseline

- [ ] Re-materialize current backup and compare runtime source to #64.
- [ ] Preserve all 1,866 tracked files, including historical docs omitted by the older build-source package, in a new full-source backup.
- [ ] Read back, CRC/SHA/manifest check, restore and build; run fresh baseline test suite with required evidence output directories.
- [ ] Create external isolated worktree/copy from #64, no edits to the published checkout.

### Task 1: Unify viewport and pointer epochs

Files: dist/viewport-geometry.mjs, game-viewport.mjs, viewport-boot.js, touch-controls.mjs, challenge-dialog-viewport.mjs, preview/campaign/chapter-ui.mjs; related viewport CSS only. New shared viewport lifecycle module allowed. Entry wiring patches for game.mjs and chapter playables go to integration.

Interfaces: preserve existing game viewport API; add an explicit ready/epoch/invalidation contract shared by chapter UI. Layout consumers use committed geometry rather than independent immediate resize values.

- [ ] Add failing regressions: scale1 innerHeight720/vv.height720/offsetTop95 must not commit bottom815; continuously moving offsets after12frames remain not-ready; late safe47/34 after8frames is observed; valid zoom offsets are retained; rapid rotations clear captures and hold.
- [ ] Implement geometric validity, time-and-rect stability, bounded late inset observation and fail-safe readiness.
- [ ] Share lifecycle with later chapters and bootstrap, preserve desktop and canvas-no-change optimization.
- [ ] Test + browser pointer-center hits and actual elementFromPoint on the candidate; log exact emulation/physical limits.

### Task 2: Smooth cameras and preserve-resolution caches

Files: dist/challenge-camera.mjs, challenge-backdrop-cache.mjs, challenge-depth-render.mjs, relevant street/mobile camera adapters and rendering cache modules. Coordinate chapter-playable loop changes with integration.

Interfaces: existing camera-frame APIs stay compatible. Additional predictive subjects and scene identity flow from existing route spawn data; output includes stable cache coverage independent from frame-by-frame visible bounds.

- [ ] Reproduce original seeded 60Hz route spawn and 561→559 boundary, record #64 zoom and cache refresh counts.
- [ ] Add failing tests for normal spawn zoom steps≤5%, disappearance/assist hysteresis, player-body safety and stable mode retention.
- [ ] Implement anticipation and state manager, without changing spawn, actor/collision size or combat timing.
- [ ] Fix backdrop content keys and bounded grow-only coverage. Back-and-forth within coverage cannot rebuild.
- [ ] Add equivalent later chapter static caching and changed-value HUD updates, same-size canvas guard. Preserve exact assets/DPR/compositing.
- [ ] Compare trace outcomes and original-resolution pixel landmarks; report actual performance measurements separately from call-count probes.

### Task 3: Implement shared real fighter attributes

Files: new dist/fighter-attributes.mjs; dist/core.mjs, challenge-engine.mjs, challenge-depth-engine.mjs as needed; both challenge growth calculators. Do not edit artwork, combat-rules.mjs or roster move definitions.

Interfaces: export immutable FIGHTER_BASE_ATTRIBUTES; fighterBaseStats(id) and deriveFighterStats(id,{skills,challenge=false}) returning maxHp/moveMultiplier/basicMultiplier/damageTakenMultiplier/specialMultiplier/rallyMultiplier/assistMultiplier plus clear base/bonus metadata. UI consumes the same derived values. Existing options.*Stats are effective explicit overrides, not a second growth multiplier.

- [ ] Tests assert all seven exact spec rows, 95 remains95 in street, full-point formulas, zero-point consistency and no duplicate multiplication.
- [ ] Apply defaults symmetrically to Duel and route player; keep explicit encounter maxHp overrides and ordinary mobs' own rules.
- [ ] Separate timeout percentage comparison from KO/doubleKO. Replace fixed AI-heal thresholds with maxHp ratio.
- [ ] Prove VS/training remain independent of high-XP profiles, both sides use base stats; test item/basic semantics, rally/assist recharge interactions, preserved21move parameters.
- [ ] Run controlled multi-strategy/left-right pair probes and challenge rank0/mid/max samples; report balance uncertainty, not a pass/fail fairness claim.

### Task 4: Add fresh single-authority saves and safe slot reset

Files: new dist/preview/campaign/fresh/{schema,progress}.mjs and tests. Reuse core model/transition and the existing first-chapter/session and continuation-shaped public API. No UI edits.

Interfaces: openChallengeProgress({storage,locks,onChange}) uses only taiwanpunchline-challenge-v4 for active state, authority always campaign. Preserve get/readProfile/getCurrentProfile/canUse/preparationSnapshot/beginChallenge/dispatchChallenge/prepareEncounter/campaignStore/exportBackup/retrySave/refresh/test-mode APIs. Add exportSlotBackup(profileId), resetProfile(profileId,{expectedRevision,expectedGeneration}), importSlotBackup(text,{profileId,expectedRevision,expectedGeneration}), and savePreparation(draft,guards). Preparation snapshots include generation. Expose initialized to distinguish a fresh unwritten document from dirty failure. Old-key export is read-only and never a source for active progress.

- [ ] Test opening with populated old v1/v2/v3 makes a fresh v4 model without changing any existing byte.
- [ ] Test source/format validation, lock absence, delayed lock, write exception plus successful readback, unreadable readback, stale revisions and dirty retry conflict.
- [ ] Test reset creates verified backup first, replaces only target slot with fresh generation, preserves all other slot bytes/settings, and saves before returning success.
- [ ] Test queued old run/retry/import cannot overwrite reset; two stores competing on different and same slots; cancellation and quota recovery.
- [ ] Test slot export/import restores only the named slot after confirmation evidence, increments revision/generation and cannot resurrect stale actors.
- [ ] Reuse all four chapter transition/reward tests through the new controller; preserve repeated mob XP and once-only first clears, carry and Boss reset.

### Task 5: Rebuild the common challenge interface

Files: dist/challenge-ui.mjs, challenge-preparation.mjs, challenge.css and a new scoped preparation CSS if needed. Do not edit shared viewport CSS without coordination. Preserve current comic look.

Interfaces: mountChallengePreparation keeps public open/hide/isOpen/busy; open accepts readOnly and characterId and an explicit intent from integration. A dedicated apply callback routes save-only/boundary/restart intent. Main/helper assignment and inspected character are separate. mountChallengeUI exposes overview, preparation, saves and explicit slot-reset confirmation via controller; root and chapter entry wiring is integrated separately.

- [ ] Reproduce failed disabled-plus UX and inspected-character loss; tests require real editable controls where advertised and non-button read-only displays.
- [ ] One character view contains actual shared radar, base/bonus/result, seven clear skill cards, remaining allowance and21move data. Fixed0–140 axis and precise legends; no fabricated stat rating.
- [ ] Implement draft/edit/cancel/Esc/confirm preserving inspected character and latest-save guard. Read-only closes still paused. Dirty or saving controls state why blocked.
- [ ] Implement overview/single-slot save manager, download backup and explicit reset scope; no clearing another slot or settings.
- [ ] Responsive testing of original look, keyboard/focus, scroll/sideways and small landscape. Return exact callback wiring needed by integration.

### Task 6: Integrate lifecycle and coherent flow

Owned entry files: dist/game.mjs, preview/campaign/page-bridge.mjs, continuation router/playable bridge, chapter2/3/4 playables and HTML imports.

- [ ] Wire fresh progress everywhere; remove active migration chooser from user flow while keeping old keys intact.
- [ ] Overview preparation saves without launching; starting explicitly creates the correct first-story/run flow. All four chapters can edit at safe boundaries, battle only read-only or explicit confirmed retry.
- [ ] Safe-boundary changes preserve carried resources; retry changes reset correct encounter/wholeBO3. Returning to overview flushes first and communicates checkpoint behavior.
- [ ] Apply viewport ready and geometry epoch before input/render, cache integration and no same-size canvas resets.
- [ ] Verify content-locked chapter5, fourth completion exit, reload, rapid doubleclick and navigation while saves pending.

### Task 7: Independent review and integrated verification

- [ ] Fresh reviewer checks each subsystem contract and whole candidate; defects get reproducing tests before fixes.
- [ ] Frozen full npm test; build output/static dependency check and asset/source manifests.
- [ ] Actual local browser formal synthetic saves, reset/import and true independent-page competition, four chapters and orientation matrix; explicitly distinguish model tests, controlled battle injections, real browser input and unavailable physical hardware.
- [ ] Same-seed before/after camera traces and measured cache/content invariance; quantify only actual collected performance data.
- [ ] Validate every meaningful late edit again; no detached completion claims from earlier builds.

### Task 8: Persist and hand off unpublished candidate

- [ ] Create complete tracked source candidate backup including all original files, plus user-facing test/limits summary.
- [ ] Library save, new consumer readback, full CRC/SHA restore/build/test validation.
- [ ] Confirm original private Site remains #64 unchanged; return backup identifiers and concise scope/limits. Do not publish.
