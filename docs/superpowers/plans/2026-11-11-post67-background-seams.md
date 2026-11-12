# Post-67 Background Seam Repair Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove proven partial-row bright seams without changing artwork, ready-state rendering or other display profiles.

**Architecture:** Finite cache filling remains incremental. While visible coverage is partial, the existing dynamic layer paints one continuous facade and all cached facade displays stay hidden. Ready coverage returns to the existing cached display path.

**Tech Stack:** Existing JavaScript, Phaser.CANVAS, native Canvas test dependency, Node tests; no new dependency.

**Spec:** `docs/superpowers/specs/2026-11-11-post67-background-seams.md`

## Global Constraints

- Product baseline is #67 commit806f00c3f16d51708c7bd52f4da8ca57825f7b89 plus the separately reviewed portrait-toolbar fix; no Phaser pilot.
- Modify only first-chapter finite background pending presentation and focused tests. Retained portrait/desktop and legacy non-layered behavior remain unchanged.
- Preserve all original artwork, world anchors, filters, DPR, density tiers, per-frame build budgets and allocation/release limits. No new canvas or persistent cache.
- Preserve draw/paintPending signatures, return meanings and pending diagnostics. Offscreen prefetch alone must not activate fallback.
- No camera, combat, UI, v4 storage, publication, dependency installation, cleanup or deletion. Edit dist source, not generated out.
- Browser and native Canvas verification are not physical-phone/Safari evidence.

## Review Focus

- A partially ready frame has two layer boundaries, so merging adjacent pending bands alone is insufficient; tests exercise mixed ready/pending and all-pending stages.
- Final sky opacity hides the defect from alpha-only assertions; exact-stage comparison includes per-row RGB at worldY0/256/512.
- Prefetch pending outside visible coverage must not cause needless full-facade work; a focused test pins that return/display behavior.
- More area may be drawn in a partial frame; record cold/refill native timing and keep unchanged build/managed-surface bounds without claiming FPS improvement.
- Reset, policy switch and same-size surface loss must not leave hidden or stale facade displays; retain existing lifecycle regressions and add a pending-to-ready recovery check.

---

### Task 1: Present incomplete finite backgrounds as one continuous facade

**Files:**
- Modify: `dist/challenge-backdrop-cache.mjs` only for product code.
- Create: `tests/street-partial-seams.test.mjs`.
- Create if needed: `tests/helpers/street-partial-compositor.mjs` for the real raster-chain fixture only.
- Existing cache tests may change only an explicitly obsolete expectation that partially ready facade displays remain visible; report each exact case first.

**Interfaces:**
- Existing `createDepthBackdropRenderer(scene,images)` returns `draw(bg,scaleX,scaleY,retained,presentation)`, `paintPending(ctx,bg)` and diagnostics. No signature change.
- `draw` returns false while visible finite coverage is partial, marks reason partial, keeps sky visible, hides every cached facade display, and still advances the bounded queue. Complete visible coverage returns true even if prefetch remains pending.
- `paintPending(ctx,bg)` returns true only for that partial frame and renders one uninterrupted facade for the entire bg visible region, using the caller's existing world-to-dynamic transform. It must not create another backing surface or render sky again.
- Preserve ready-state row positioning/crops and retained policy code. Keep pendingBands diagnostics useful even though painting no longer clips each band.

- [ ] **Step 1: Write failing raster and lifecycle tests.** Use original four images, dynamic1688×780/final844×390 at near zoom0.8085365853658538/top−4.811463046757154 and far zoom0.45561892934506987/top−196.40180838684654, fractional camera x144.41666666666669. Iterate bounded filling through every partial stage, explicitly encounter a mixed stage, compare boundary rows against uninterrupted dynamic facade plus the same sky. Assert per-row RGB mean delta<0.02 for partial-stage reference at each visible boundary, no cached facade visible during partial, sky visible, no extra canvases beyond existing fixture dynamic/static pool/sky. Also pin visible-ready with offscreenpending, reset/same-size loss and convergence/reuse. Ready-state comparison uses existing direct/reference raster tests, not a new expected snapshot generated from changed product.
- [ ] **Step 2: Run `node --test tests/street-partial-seams.test.mjs` and capture behavioral RED before product edits.** The expected failure is partial RGB bright seams and mixed cached facade visibility, not missing dependencies or fixture errors.
- [ ] **Step 3: Implement the minimum transition in challenge-backdrop-cache.mjs.** Hide the cached facade collection for incomplete visible coverage while leaving sky visible, and paint the whole facade once in paintPending. Do not change ready crops, tiers, queue budgets, camera or assets.
- [ ] **Step 4: Run focused cache suites, then full `npm test`.** Include street-backdrop-cache-v71/v73, street-cache-coverage/density/lifecycle, street-jump-cache, mobile-landscape-cache-raster and challenge-cache-contract. Record all failures. Run a bounded native comparison of cold fill and newly exposed rows against readonly #67, recording draw time distributions, paint passes, build pixels and peak surfaces; do not turn it into a phone performance claim. Store benchmark outside product under evidence/seams.
- [ ] **Step 5: Self-review and commit only task files.** Subject `fix: draw partial street backgrounds without row seams`. Report commit, RED/GREEN/full tests, unchanged boundaries and any performance tradeoff.

## Final integration gate

Independent task review follows. Actual Chromium fixture verification, frozen combined-candidate browser checks, complete backup fresh readback and restoration remain required before user delivery. This task does not start a preview or publish by itself.
