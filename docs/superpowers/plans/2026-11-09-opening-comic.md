# Four-shot Opening Comic Implementation Plan

> **For agentic workers:** Use the existing native implementation assignment. Steps use checkbox syntax.

**Goal:** Replace the approved opening with four readable animated comic shots using the existing character artwork.

**Architecture:** Keep explicit story advancement and challenge progress separate. Add a small opening pose/composition renderer, delegate only opening beats from the existing story painter, and give cinematic openings a viewport-filling dialog while preserving boss dialogues.

**Tech Stack:** Canvas 2D, native dialog, ES modules, node:test and jsdom.

**Spec:** Approved four-shot handoff: alarm/TV missing divine microphone, pajamas sit-up/reach/blanket with close-up, wardrobe/breakfast transition, street-corner microphone chase.

## Global Constraints
- Existing Wang/Han portraits and original pajamas; all seven playable characters supported.
- Explicit next, replay and skip; no save writes or invented audio.
- Respect reduced motion, logical portrait/landscape and CSS rotation.
- Portrait art takes roughly 75–85% of a normal phone panel and is not cropped.
- No publication, credentials, paid tools or new Codex task.

## Review Focus
- A later beat or replay must start its own animation at zero.
- Skip or repeated activation must finish only once; close must cancel callbacks.
- Reduced motion must settle to legible poses instead of retaining animated motion.
- Portrait, short landscape and rotated portrait must retain controls and complete art.
- Every roster entry must use its own existing portrait without missing assets.

## Task 1: Story sequencing and lifecycle
**Files:** `dist/challenge-flow.mjs`, `dist/challenge-story.mjs`, `tests/challenge-opening-v73.test.mjs`.
- [x] Add failing behavioral tests for four shot roles, per-panel clock reset, replay, skip, close and reduced-motion options.
- [x] Run `node --test tests/challenge-opening-v73.test.mjs` and inspect expected failures.
- [x] Implement four opening beats with shot IDs, story controls and safe lifecycle without touching progress.
- [x] Re-run focused tests.

## Task 2: Art and responsive presentation
**Files:** `dist/challenge-opening-art.mjs`, `dist/challenge-story-art.mjs`, `dist/challenge-game.css`, opening tests.
- [x] Add failing pose/layout tests for independent sit-up, arm reach, blanket lift, settled reduced motion and full-frame geometry.
- [x] Implement four differentiated compositions with actual source crops, independent limbs and foreground layers.
- [x] Verify rendering and full test suite; give parent exact visual QA cases.
- [x] Commit only owned files and report results/limits.

## Verification
- All seven characters rendered in both orientations at 0, 1000 and 2400 ms (168 real Canvas renders).
- Regression tests cover separate movement, safe figure bounds, four beats, replay/skip/close lifecycle, reduced motion, original save bytes and the loaded compact-landscape CSS cascade.
- Parent owns final browser QA and integration; this implementation does not publish.
