# In-game Portrait Selection Implementation Plan

> **For agentic workers:** Execute in this existing task, then request an independent review.

**Goal:** Remove OS character/difficulty pickers while providing a rotating seven-person game-style roster.
**Architecture:** Keep HTML controls inside the existing rotated app. Explicit role, fighter and difficulty state feeds the existing portrait/moves display and Duel constructor. Scoped roster CSS uses logical container width.
**Tech Stack:** Static HTML/CSS, ES modules, Phaser and Node test runner.
**Spec:** docs/superpowers/specs/2026-11-07-native-free-roster-design.md

## Global Constraints
- Preserve seven existing portraits, both roles, mirror matches and combat rules.
- Keep all requested choices in-page, with no native select in the main menu.
- Publish only to the existing owner-private sideways Site; original V22 is untouched.

## Review Focus
- Switching roles must not silently change the other fighter.
- Difficulty and mirror selection must survive replay/reselect and resizing.
- A battle must ignore hidden roster clicks and repeated Start clicks.
- Short/rotated layouts must expose all portraits, role buttons and Start.
- Keyboard focus and selection state must be understandable without color alone.

### Task 1: Native-free menu behavior and layout
Files: dist/index.html, dist/game.mjs, dist/roster-picker.css; tests/roster-ui.test.mjs, tests/roster-picker-v24.test.mjs, tests/helpers/game-harness.mjs, tests/cooldown-ui-v18.test.mjs.
- [x] Add failing tests for no menu selects, exactly seven image buttons, role switching, all pairings, difficulty and invalid/active-state actions.
- [x] Implement button-based role/fighter/difficulty state and integrate Duel initialization.
- [x] Implement responsive logical-width layout, selected badges and at-least-44px targets.
- [x] Run focused tests and full suite; syntax/diff checks and soak.
- [x] Verify official cloud browser at desktop, rotated portrait and landscape including 568x320; resize preserves selections, keyboard click works, start/pause/reselect/replay works.
- [ ] Independently review, address findings, preserve source and exact deployment archive; publish and verify unchanged original Site.
