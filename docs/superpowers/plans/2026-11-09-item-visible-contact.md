# Visible Item Contact Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make thrown paper and ducks hit the body they visibly touch without unconditional posture immunity.

**Architecture:** Add an item-only swept-circle versus separate body-capsule module. Reuse a pure rendering-pose sampler in the simulation and renderer, and give paper a bounded rise from the real hand to a high lane.

**Tech Stack:** Existing native JavaScript ES modules and Node test runner. No dependencies.

**Spec:** docs/superpowers/specs/2026-11-09-item-visible-contact.md

## Global Constraints

- Preserve damage, horizontal speed, life, knockback, guard behavior and throw startup/duration.
- Modify only thrown-item contact/trajectory and the pose sampling needed to align it with drawing.
- No new task, deployment, account changes or paid services in this worker.

## Review Focus

- Real hand origins, including table and airborne throws, must not use the old fallback lane.
- Near rising paper may hit; fully cleared crouch/roll poses must not receive invisible hits.
- Extended hands and feet must be vulnerable without filling the gaps between limbs.
- 30/60/120 fps, both roles/facings and every character must keep identical damage and single-hit behavior.
- Special projectile collision and prop-only regions must remain unchanged.

### Task 1: Contact and trajectory correction

Files: create dist/item-collision.mjs and tests/item-contact-v54.test.mjs; modify dist/core.mjs, dist/stage-rules.mjs, dist/art-render.mjs and dist/game.mjs.

- [x] Add failing close-duck, no-posture-immunity, real-hand and swept-XY tests. Run node --test tests/item-contact-v54.test.mjs and record expected failures.
- [x] Export fighterArtPose(f,time,spit,impact) from the existing renderer without changing its drawing. Share current pose sampling with core callbacks.
- [x] Implement itemBodyShapes(f,pose), itemProjectileTouches(p,f,previous,pose), and bounded paper rise parameters. Keep non-item projectiles on the old path.
- [x] Add table/air/guard/limb-gap/roll/mirror/fps/AI regressions and explicitly revise old tests only where they assert the superseded falling immunity.
- [x] Run focused tests and npm test, report every failure and measured clearance, then hand the working tree to the parent for review/release.

Verification: initial baseline 1875/1875; eight new symptom tests failed before implementation. Final item-contact suite 115/115 and integrated npm test 1992/1992 passed. Four measured cutout regressions were reproduced before correction: lotus knees too wide, lotus elbow omitted, roll side/foot mismatch, and over-wide Han shout portrait. All now pass in both orientations. See docs/v54/item-contact-verification.md.
