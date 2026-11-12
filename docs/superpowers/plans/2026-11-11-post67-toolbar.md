# Post-67 Toolbar Repair Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restore the yellow brand and usable single-line portrait controls, and remove stale challenge-save status after exit to ordinary VS.

**Architecture:** One shared label adapter supplies compact visual labels while preserving full button semantics. Existing common portrait CSS owns sizing for all four chapters. The existing challenge exit function synchronizes its status cell without changing persistence.

**Tech Stack:** Existing JavaScript modules, CSS, Node test runner, jsdom; no new dependency.

**Spec:** `docs/superpowers/specs/2026-11-11-post67-toolbar-design.md`

## Global Constraints

- Baseline #67 is commit `806f00c3f16d51708c7bd52f4da8ca57825f7b89`; this branch contains no Phaser pilot.
- Only touch portrait toolbar styling changes. Desktop, native landscape and sideways toolbar geometry stay unchanged.
- Minimum interactive width and height are 44 CSS px; short visible labels use 12px type.
- Preserve portrait HUD top70px, existing actor scale, renderer, art and controls.
- v4 storage key/schema/writers and conflict/recovery behavior remain unchanged. Use synthetic storage only, never player data.
- No camera/cache changes in this task. No publication, dependency installation, directory cleanup or deletion of old backups.
- Edit dist source, not generated out. Do not include unrelated untracked documents or paused Phaser files.

## Review Focus

- A normal return to VS must hide the challenge cell, but a failed save must retain recovery; actual-entry tests cover both.
- Sound/pause labels change at runtime; shared adapter tests cover post-mount text and aria-pressed mutations.
- CSS generated visual text can obscure accessibility names; explicit full accessible labels must remain accurate after every state change.
- Strong old chapter/bar selectors can override compact sizing; all real root/later HTML style stacks need contract checks and later browser geometry, not regex alone.
- A larger header must not change the already accepted portrait camera budget; retain HUD offsets and check actual non-overlap in final browser run.

---

### Task 1: Repair shared portrait toolbar and exit status

**Files:**
- Create: `dist/compact-toolbar.mjs`
- Modify: `dist/game.mjs`, `dist/preview/campaign/chapter-ui.mjs`, `dist/challenge-layout.css`
- Create: `tests/compact-toolbar.test.mjs`, `tests/challenge-exit-toolbar.test.mjs`
- Extend only obsolete portrait32px expectations as necessary: `tests/challenge-layout-css.test.mjs`, `tests/challenge-layout-contract.test.mjs`, `tests/interface-v29.test.mjs` if present.
- Other test files may be changed only for clearly identified old sizing assertions; report exact files before extending scope.

**Interfaces:**
- Export `compactToolbarLabel(button) → string` and `mountCompactToolbar({document,root=document}) → {sync(),destroy()}`.
- Target only header toolbar buttons with ids home/sound/pause/help. Map actual full text/aria-pressed to compact labels: home is 總覽 when its text denotes challenge overview, otherwise 首頁; sound 聲音開/聲音關; pause 暫停/繼續; help 設定. Full accessible name remains the true current action, not hidden or stale text.
- Mount once in root entry and once per chapter interface. Observe only necessary text and aria-pressed changes; no frame-loop observer work and no self-triggered mutation loop. Chapter interface destroy disconnects it. Do not replace button nodes/listeners or change action handlers.
- Portrait CSS displays data-short-label through a styled pseudo-element while full existing text stays available for semantics; outside scoped CSS the original label remains visually unchanged.
- Header columns: narrow `44px 44px minmax(0,1fr)`; at physical width≥390px AND touch portrait, `104px 44px minmax(0,1fr)`. Header/row44px, column gaps4px, toolbar four equal columns with3px gaps and minimum44px children. Brand icon shown and full wordmark hidden below390px; full brand aria-label remains. At≥390px show wordmark and icon without clipping. Top remains6px and HUD remains70px.
- Scope later chapters with data-touch=true as well as data-layout=portrait. Give save cell enough selector specificity to beat legacy #campaign-bar sizing. Its visual pseudo-label reads existing data-status (saved/busy/error/preview); retain title and aria-label for full explanation. No source data hidden on save failure.
- Call the existing syncChallengeSaveSlot at the safe end of endChallenge after challenge state has been cleared. Do not change its cancellation/save logic, don't add writes, and verify initialization order with real game entry tests.

- [ ] **Step 1: Write RED tests.** Use the real #67 gameHarness with synthetic progress: start challenge, return through actual overview, showMenu/showTitle, assert no run/battle mode/hidden save slot; repeat entry, canceled return and failed save retains visible recovery. Shared DOM tests cover initial and mutated labels, accessible names, listener retention and destroy. Style tests assert all four portrait controls44px, icon visible, narrow/wide wordmark rules, correct save specificity and untouched landscape rules.
- [ ] **Step 2: Run focused RED commands and capture expected behavioral failures before product edits.** Do not count an unrelated fixture error as evidence.
- [ ] **Step 3: Implement the exact helper, wiring and CSS.** Prefer minimal scoped overrides; don't patch camera/layout budgets or unrelated dialogs.
- [ ] **Step 4: Run focused GREEN, then full `npm test`.** Report all failures. Explain any preexisting32px assertion updated rather than weakening it silently.
- [ ] **Step 5: Self-review and commit only task files.** Commit subject `fix: restore usable portrait toolbar and clear stale save status`.

## Final integration gate

An independent task review follows this commit. Actual browser measurements and pointer checks run once this repair is integrated with the separately authorized camera/seam repairs, against one frozen candidate. Full-branch review, source/runtime verification and fresh backup restoration precede delivery; the original #67 site stays unchanged.
