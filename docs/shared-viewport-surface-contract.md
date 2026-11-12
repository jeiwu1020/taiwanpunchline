# Shared viewport and painted-surface contract

This document describes the integration required by every playable chapter. It applies to the Phaser main scene and the Canvas2D chapter runtimes. Geometry, renderer preparation, drawing and simulation have separate responsibilities.

A successful paint acknowledgement means that the application completed the rendering commands for the current surface. It does not prove that a browser or operating-system compositor displayed those pixels.

## Ownership and readiness

Use `createViewportLifecycle` from `dist/viewport-lifecycle.mjs`. A playable owner must set `requirePaint: true`; geometry-only readiness is reserved for bootstrap. Stop a preceding bootstrap owner before mounting the playable owner.

The controller owns:

- An immutable geometry frame and its monotonically increasing `epoch`.
- An immutable `{epoch, surfaceGeneration}` token. Generation also changes for same-size surface resets and failed attempts.
- Surface preparation and successful paint acknowledgements for that exact token.
- Positive layout validation, geometry stabilization, input gating, timeout protection and event listeners.

`ready` requires valid current layout, a positive stage, usable backing dimensions, successful preparation and a successful paint for the current token. A 0-sized stage, 1x1 backing, lost context, stale acknowledgement or elapsed timeout cannot unlock gameplay.

Consumers must not set readiness themselves or infer it from unchanged dimensions. Capture the token before drawing and return that same token after drawing, rather than obtaining a newer token at acknowledgement time.

## Lifecycle interface

- `invalidate(reason)`: start a new external geometry/foreground transaction. It gates input, changes the token, applies geometry and prepares the surface. Resize, orientation, foreground and explicit recheck events use this path.
- `prepareCurrent()`: invoke the adapter's preparation callback. It may be called directly by chapter UI synchronization. No-change preparation must be idempotent and keep a valid lease. Invalid preparation revokes a previous ready lease.
- `beforeSurfaceMutation()`: the adapter must call this **before** directly changing backing dimensions or repairing a changed transform. Outside an already-invalidated apply transaction, it synchronously gates input, changes generation and cleans resources before the mutation. Do not call it for a no-change preparation.
- `acknowledgePrepared(token, surface)`: accepts only the current token and a valid positive surface descriptor. The normal preparation callback is acknowledged by `prepareCurrent()`.
- `acknowledgePaint(token, surface)`: accepts only the current prepared token and a currently valid surface. It schedules stabilization if needed; it does not bypass layout checks.
- `invalidateSurface('surface-reset')`: revoke a surface lease and clean/reprepare the surface within a recovery episode.
- `failSurface('draw-failed')`: fail the attempt and clean/reprepare its drawing state and retained resources. Call it for every failed draw, including consecutive failures.
- `checkActive(time)`: run primitive viewport checks and bounded periodic layout/safe-area rechecks from the active render loop.

A surface descriptor contains `width`, `height`, `backingWidth`, `backingHeight`, `valid` and `contextLost`. Adapters additionally validate their exact effective density, backing size, transform and renderer state.

## Direct preparation and mutation order

Direct preparation is not permission to clear a previously painted buffer under a ready token:

1. Inspect stage dimensions, context health, expected backing dimensions and transform.
2. If backing or transform repair is required, call `beforeSurfaceMutation()` before the first mutation. If the lifecycle is already applying an invalidated transaction, this call does not create another transaction.
3. Complete any required state/cache cleanup, retaining a dirty state if cleanup fails.
4. Allocate the expected backing dimensions and restore the effective transform without changing the renderer's established density policy.
5. Return the resulting surface descriptor. Gameplay remains gated until a successful current-token draw and geometry validation.

Repeated preparation with unchanged valid dimensions and transform must not clear backing storage, invalidate caches, change generation or interrupt readiness.

## Recovery episodes and failed attempts

One recovery episode has one bounded deadline. Each failed attempt still gets its own invalidated token and clean drawing state. Retry cleanup must not restart that deadline. Genuine external geometry or foreground changes can begin a new transaction; a valid completed paint can end recovery.

Every failed draw may leave state behind, even when its transform is still correct. In particular, `setTransform` and one `restore` do not remove arbitrary nested saved states or clipping regions. The adapters use a complete context reset, or same-size backing reassignment when reset is unavailable, then restore their normal transform and rendering options. Dirty state remains invalid until cleanup succeeds. Retained cache invalidation is part of the same preparation.

This also applies to retained offscreen contexts, not only the destination. The challenge renderer resets the depth actor canvas, shared legacy/arena world canvas and every allocated legacy mob canvas on public invalidation. Phaser `CanvasTexture.setSize` does nothing when dimensions are unchanged, so it is not a state-reset operation. Direct same-size backing reassignment clears all saved state and clips while preserving texture/source/frame dimensions; the next draw refreshes the texture before acknowledgement. Normal unchanged draws keep their existing backing and cache reuse.

Repeated failures must reach `blocked` and expose the retry/protection UI. Keep scheduling asynchronous rendering attempts so a later successful current-token paint can recover. Do not spin synchronously, force readiness after a frame count, or allow successful acknowledgements from failed or partial draws.

Canvas2D `contextlost` handlers must not call `preventDefault`: canceling that event opts out of the browser's default 2D restoration. After `contextrestored`, rebuild app-owned state and resources and wait for a new matching paint.

## Canvas2D chapters

Use the shared `createCanvasViewportSurface` adapter through `mountChapterInterface`:

- Supply the real destination context as `surfaceContext`.
- Supply `onSurfaceReset: () => invalidateStreetStaticCaches(ctx)` using the same versioned module URL as the chapter's street renderer.
- Route resize/synchronization through `ui.prepareSurface()` rather than a chapter-local allocation policy.
- Call `ui.beginFrame(now)` before simulation or drawing. It checks current metrics, restores preparation if necessary and returns the current paint token, or `null` if the surface is unusable.
- Simulate only when gameplay is active and `ui.ready` is true.
- Draw while settling or blocked when a usable token is available; otherwise the first-paint requirement would deadlock.
- Call `ui.paintFrame(capturedToken)` only after the full draw returns successfully.
- On an exception call `ui.failFrame(error)` and do not acknowledge that frame.
- Schedule the next `requestAnimationFrame` in `finally`, including after failures.

The established later-chapter effective density is `Math.min(2, devicePixelRatio || 1)`. Allocation, transform restoration and validation must all use it. Recovery must not secretly increase or decrease pixel workload or source quality.

## Phaser adapter

Use `mountGameViewport` with the active scene and the shared input-clear function.

1. `viewport.beginFrame(time)` validates the destination canvas, renderer dimensions, scale dimensions, context health and baseline transform, and captures a token.
2. The scene updates retained drawing objects and app-owned render textures. Only active, ready gameplay advances simulation.
3. After successful scene drawing, call `viewport.frameDrawn(capturedToken)`.
4. The adapter waits for the game's following `postrender` before acknowledging the captured token. A bare `postrender` without a successful matching scene update is insufficient.
5. On a failed update or renderer callback, call `viewport.failFrame(error)`. Clear pending acknowledgements, fully reset drawing state and call the challenge renderer's `invalidateSurface()` before retry.

The adapter guards Phaser's existing RAF callback so renderer exceptions return control to the engine's scheduler. It must not install a second competing RAF loop. Restore the original callback and remove event listeners when destroying the owner. Keep Phaser's established backing resolution policy.

## Input coordinate epoch

Use the shared lifecycle's `epoch`, `ready` and committed `rotation` in the touch-control viewport provider. All input coordinates derive from the same committed geometry frame used by the renderer.

Every invalidation and surface recovery clears keyboard holds, touch holds, pointer ownership and captures through `clearHold` and the existing touch-control cleanup. A same-size generation change still releases input, even though the geometry epoch may not change. No prior gesture may resume merely because readiness later returns.

## Simulation-step barriers

All runtime adapters use `planSimulationFrame(deltaMs, {paused})` from the shared simulation module. It accepts at most 100ms and divides accepted time into steps no larger than 1/60 second. Paused, hidden or unready frames do not advance gameplay or retain catch-up debt.

At each outer animation frame:

1. Validate the current viewport/surface and compute whether gameplay is active.
2. Obtain the bounded simulation plan.
3. Capture the current controller, world and scene token.
4. Consume an edge-triggered or repeated action once for the outer frame. Apply held movement to each substep.
5. Before every substep, stop if gameplay is no longer active, readiness is lost, the controller/world changes or the scene token changes. Do not finish the old frame's remaining steps against a replacement world.
6. Drain and process events once for the completed outer-frame batch. Keep main route reward and route-gate events in their existing batch. Later chapter media/events refer to the captured world.
7. Synchronize UI or transitions after the batch, then draw and acknowledge the current paint token only on success.

## Regression checklist

Cover these cases when adding or changing an adapter:

- Geometry-only settling never enables input without a paint.
- Stale geometry and same-size generation acknowledgements are rejected.
- Zero stage, 1x1 backing and lost context remain protected.
- Direct changed-size preparation gates before the first backing write.
- Direct same-size transform repair changes generation before mutation.
- No-change preparation remains idempotent.
- Rapid rotation in both directions, delayed safe area, silent late metrics and foreground return recover.
- Holds and pointer captures are released on all transitions.
- Repeated dirty-transform failures reach the bounded blocked state.
- Consecutive failed draws containing nested `save` and `clip` recover full far-corner raster coverage before readiness.
- Retained Phaser actor, world and allocated mob surfaces recover complete original-art pixels with faithful same-size-no-op texture semantics, including hidden mobs later reused after an arena invalidation.
- Phaser requires a successful current scene token followed by `postrender`.
- A thrown draw does not stop or duplicate RAF scheduling.
- Paused/unready frames perform no simulation; world/mode/token transitions stop remaining substeps; edge commands and event batches occur only once.
- Effective backing density and source assets remain unchanged.

Current focused coverage is in `tests/viewport-painted-surface.test.mjs`, `tests/viewport-epoch-rebuild.test.mjs`, `tests/viewport-main-simulation.test.mjs`, `tests/later-playable-viewport-integration.test.mjs`, `tests/viewport-entry-surface-wiring.test.mjs`, `tests/challenge-offscreen-recovery.test.mjs` and the existing viewport/touch epoch suites. Native raster tests verify application pixels; physical-phone context loss and compositor delivery require separate device testing.

## Background allocation policy B

Background policy is presentation metadata, not camera or simulation state.
`backgroundPresentation(width, height, options)` carries logical dimensions and
explicit `touch === true`; `backgroundCachePolicy(presentation)` delegates to
`isMobileLandscapePresentation`. Only short logical touch landscape uses finite
caches (width > height, 0 < height <= 500), including software rotation. Portrait,
desktop, taller landscape and unknown profiles use the #66 retained policy.

Main `depthRouteCameraFrame` and the shared later camera adapter carry
`frame.presentation`, including paused same-size calls. The historical main
wrapper's default `touch=true` still participates in its unchanged camera math,
but `presentationTouch` forwards the caller's explicit touch value separately.
The background renderer must not infer phone identity from width > height.

The main cache has one texture/display pool and shared sky owner. Policy changes
release all old backings and pending state, clear display crops, then allocate the
new policy. The later chapters call `prepareStreetStaticCaches(ctx, frame)` before
the whole backdrop pass, before paper as well as street. Both algorithms share
source ownership/invalidation, mic invalidation and vector-length DPR handling.
Any allocated canvas is owned before a painter can throw; public invalidation
also releases incomplete builds. Existing matching-paint gates remain mandatory.

Non-landscape retained policy deliberately restores #66's highest reserved
raster density, accumulated coverage and whole-layer rebuild behavior. Its main
32 Mi-pixel guard counts static tiles plus sky; later street and paper each have
a separate 16 Mi-pixel guard. **These are not the finite policy's aggregate
managed-surface budget.** Large backings and cold/rebuild spikes remain accepted
tradeoffs, not performance or memory improvements. Finite full-density strips,
its aggregate guards and original-art pending/direct fallbacks remain limited to
the short logical touch landscape profile. No policy may lower resolution, alter
source pixels or omit visible content to pass a guard.

Later playable entries refresh this metadata at their common `paintBackdrop`
call boundary with `backgroundPresentation(w, h, ui.cameraOptions)`. This covers
initial, story, choice and complete draws that intentionally bypass the gameplay
camera adapter, as well as route, battle, result and paused draws. Story frames
keep their original left/base/zoom composition and never enter the camera solver.
Only current UI explicit touch and logical draw dimensions select background
policy; mode changes alone must not switch it.

## Owned recovery actions while the surface is unavailable

`mountChallengeDialogViewport` defaults to denying pointer clicks when viewport
`ready` is false. An owner may opt in with `unreadyActionToken(event)`, returning a
stable opaque token only for its current, visible, enabled recovery action; null
means deny. The token must change for a new owner/presentation/action. The story
and saved-display preparation adapters verify their live `isCurrent` callback and
busy/hidden/disabled state. No ordinary comic, preparation edit/Confirm, settings,
save-error control, or gameplay input receives this permission.

A render-only exception requires a paint-readiness state, a committed finite
frame, matching viewport metrics and measured app/shell bounds, and no known
geometry failure. A pointer sequence must retain its owner/action/DOM target,
geometry epoch/frame and metrics from down to up/click. The epoch is retained
in that stamp even when a failed surface has no committed frame. Drag, pointercancel,
non-primary/right-button input, stale state or a consumed click is rejected.
Surface-generation changes alone do not revoke a tap: repeated draw failures can
renew the surface every frame without changing geometry. This exception never
sets viewport ready, bypasses destination painting, or starts game simulation.

A recovery may additionally provide `savedRecoveryExit()` to the binding. Its
capability has `isSafe()` and `reload()`; both must verify the same owner and saved
receipt. It is not permission to reload arbitrary unfinished work. Root guards
require a confirmed persisted non-test receipt, matching profile/generation/
revision, and no dirty/read-only/conflict/busy/queued/pending save. Each safety
check also calls the store's read-only `verifyPersistedReceipt(receipt)`: actual
durable bytes must still equal its verified base bytes and be readable, without
waiting for storage events or refreshing cached state. `reload()`
rechecks immediately before navigation and performs no save or transaction.
Active/countdown play and a changed series or unsaved BO3 round/score also refuse
reload; a durable checkpoint alone is not proof that runtime progress is saved.

When game geometry is inconsistent, only that explicit recovery can temporarily
replace the contents of its existing native modal with a browser-viewport-centered
saved-reload control. The original dialog content/styles are restored when the
geometry recovers or the modal closes. The control needs its own bounded physical
DOM rectangle and the same pointer/owner guards. If saving cannot be proved safe,
the modal tells the user to keep the page and disables reload; test-mode drafts
are never described as saved. Ordinary dialogs do not get this fallback.

Later chapter preparation currently closes after its synchronous `onApplied`
callback; it does not await presentation or return the root display-failure
contract. Those pages retain their nonmodal viewport protection and are not
implicitly granted either capability by using the shared preparation component.
