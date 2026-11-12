# V10 Signature Moves Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development or superpowers:executing-plans. Steps use checkbox syntax for tracking.

**Goal:** Replace generic moves with the user's selected signature jokes, distinct art and tested mechanics.
**Architecture:** One engine/roster task, independent generated-asset tasks, presentation integration, independent review and owner-private deployment.
**Tech Stack:** Buildless ES modules, Canvas/Phaser, node:test, built-in image generation.
**Spec:** docs/superpowers/specs/2026-11-06-signature-moves-v10.md

## Global Constraints
- Existing owner-private Site only; no GitHub main or new Codex task.
- Seven characters, three special buttons, existing ordinary inputs and crouch hurtbox preserved.
- Synthetic non-speech effects labelled; no unverified new original voice.
- Existing approved faces and suit identities preserved, arms and knees anatomically connected.

## Review Focus
- Mid-move hits must cancel lingering brace/counter/projectile issuance, not permit duplicate hits.
- Grounded knee move must remain hittable, recover safely when interrupted and stay inside arena bounds.
- Brace consumes exactly one attack, applies block chip and no knockback, then clears even across pause/result.
- Simultaneous/mirrored hand and prop layers must remain readable, with no wrong hand facing.
- Phone layouts and visual memory must remain bounded despite additional art.

### Task 1: Engine and move metadata
Files: dist/core.mjs, dist/roster.mjs, corresponding engine tests.
Interface: CAST moves expose kind/name/behavior/duration/start/end/range/damage/cooldown; Duel remains public API. New keys exactly as spec.
- [ ] Write failing tests for new names, behaviors, brace consumption and interruption.
- [ ] Implement minimal data-driven projectile, advancing melee and brace; retain base movement/combat.
- [ ] Update obsolete move-specific expectations with equivalent new behavior coverage; never remove generic safeguards.
- [ ] Run full tests and report explicit remaining presentation failures to integrator. No commit/push from worker.

### Task 2: Generated assets
Files: new assets under versioned v10 filenames and provenance docs; no runtime source edits by asset workers.
- [ ] Inspect reference pixels and generate transparent anatomically usable knee/cough/palm/expression assets.
- [ ] Inspect every output; record source path, prompt, anchors/dimensions and alpha.
- [ ] Compile appropriately sized WebP without overwriting originals.

### Task 3: Presentation and source disclosures
Files: art-motion, art-roster-motion, art-expression, art-render, art-roster, art-view, game, HTML; visual tests.
- [ ] Write failing coverage/pose tests for each new key and phase.
- [ ] Implement clear silhouettes and recovery; update props, expression map, UI and source status.
- [ ] Preserve existing real Han clip and all unaffected input semantics.
- [ ] Run full suite, load/texture checks and source disclosure checks.

### Task 4: Independent review, browser QA and publication
- [ ] Independent engine/code and visual review, fix findings.
- [ ] Review normal/mirrored phase sheets and live desktop/phone combat, foreground soak.
- [ ] Remove temporary QA files; fresh full tests and archive validation.
- [ ] Use Sites source helper for exact source commit and archive, then private deployment; verify owner-only audience and terminal success.
