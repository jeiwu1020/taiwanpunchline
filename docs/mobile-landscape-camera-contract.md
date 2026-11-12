# Mobile landscape camera contract

## Profile and coordinate system

`isMobileLandscapePresentation({ width, height, touch })` in `dist/challenge-layout.mjs` selects the compact touch landscape profile only when:

- `touch === true`;
- width and height are finite, width > height, and 0 < height ≤ 500.

These are logical canvas dimensions, not physical orientation or hardware detection. Native landscape and a sideways canvas use the same policy when their logical geometry matches. `rotation`, `nativeLandscape`, and `landscapePreview` do not independently select a camera policy. Taller touch layouts, portrait, desktop, and callers without explicit touch status retain their existing framing.

`applyChallengeLayout(host, frame)` sets `data-control-overlay="soft"` for that profile and `"normal"` otherwise. Style the controls from this semantic state. Do not add a separate physical-orientation rule that disagrees with the camera.

All `safeRect` and `occlusions` coordinates passed to the camera must be in logical canvas coordinates. The safe rectangle already accounts for OS insets. Do not subtract them again.

## Measured geometry and fallbacks

The live main combat overlay supplies `cameraSafety`; chapter UI supplies `cameraOptions`. Pass the measured `safeRect` and `occlusions`, touch status, camera mode, current viewport dimensions, previous frame, and elapsed time through the production camera path.

- Main VS, practice/training, and chapter-one Boss use `fullStageCameraFrame`; VS and practice share the same camera behavior.
- Chapter-one depth streets use `depthRouteCameraFrame`.
- Chapter2/3/4 streets and Boss battles use `createMobileCameraAdapter().frame` with the shared UI's measured options.
- The independent legacy nondepth route is not covered by this fixed-camera acceptance claim.
- All eventually use `fitChallengeCamera`.

A measured occlusion array may legitimately be empty. Do not replace an available empty array with a guessed inset fallback. Conversely, do not supply an invented empty array when the DOM has not been measured: use the wrapper's fallback, which sets `measuredCameraSafety: false`. This explicit opt-out retains legacy composition and hard-control behavior. `fitChallengeCamera` trusts supplied geometry; it does not itself read or validate the DOM.

Successful fitted frames expose `cameraSafetyFit: true` and `controlOverlay: "soft" | "normal"`. The layout dataset expresses the viewport profile; an unmeasured fallback camera can still report `"normal"`. A normal production chapter must not silently remain on the unmeasured fallback.

## Stable player-only and classic encounter framing

Measured compact-touch landscape with `cameraMode: "stable"` (or `camera: "stable"`) uses the fixed player-only profile. Classic retains the existing all-selected-subject safety solver: both duel fighters, or the street's admitted local encounter subjects and existing anticipation. Portrait, desktop, tall touch, and explicitly unmeasured fallback retain their previous policies.

Both measured mobile modes start from the standing-size preference:

`zoom = min(1.4, width / 440, height * 0.68 / 328)`.

For stable, measured screen/HUD/control geometry selects a safe scale and a resting screen target for one canonical player body. The target is not the player's invariant displayed position. The true body remains `[-132,132] × [-300,28]`; a geometry-only 80-world-unit horizontal follow reserve expands the fitting envelope to `[-212,212] × [-300,28]`. If the target is A and scale is z, the actual player may appear anywhere in `[A.x−80z, A.x+80z]` at A.y. Its true body then stays inside the safely fitted envelope. Enemy separation, enemy jumps/deaths, pending spawns, helpers, attack poses, player jump velocity, and support height never choose the scale or target. Zoom and resting target remain exactly constant for unchanged geometry. Classic can reduce scale for separation, jumps, anticipation, or other hard constraints.

The 328-unit height is a safety proxy, not the rendered sprite's alpha height. Do not scale art, collision boxes, or world movement to compensate for camera sizing. Stable intentionally permits opponents outside the viewport; it does not promise all actors fit.

## Geometry identity and lifecycle

Successful fixed frames expose `playerFixedCamera: {version: 2, geometryKey, zoom, anchor, pose, follow: {left, right, clamped}}`. `pose` is a copied `{x, displayY}` where `displayY = y + 0.65 × depth`; `anchor` is the copied resting target. The follow interval is exactly `anchor.x ± 80 × zoom`. `clamped` identifies a mandatory safety override, not smooth motion. Geometry-key policy version 2 includes dimensions, effective safe rectangle, normalized padded/clipped occlusion union, and hard-versus-soft policy. It ignores actor state, lag, time, input-array identity/order, labels, layout epoch counters, and equivalent physical rotations. Real subpixel changes are not rounded away. Previous state requires finite frame, pose, target, zoom and interval values and matching policy; stale or incompatible state cannot freeze or seed follow history.

- Equal geometry keeps the exact saved scale, target and follow interval. Geometry fitting is not repeated to choose a per-frame two-dimensional pocket.
- A same-size real HUD/control reflow first tries the old scale at the nearest safe anchor. If it cannot fit, solve a new safe scale once. Opening the same-size layout later keeps an already feasible smaller scale.
- A size/profile change or fresh world/reset initializes a new fixed state. Invalid or fully blocked geometry must report `cameraSafetyFit: false`, never a false safety success.
- `canReuseCameraFrame` checks dimensions and a fixed frame's actual geometry/profile, not only a resize event number. Paused camera-mode selection does not invalidate the displayed mode by itself.
- Pause and finish owners reuse the displayed frame, including nonzero lag, while geometry is equivalent. No settling or accumulated pause time is allowed. A same-size frozen geometry rebase with unchanged scale uses the saved pose and previous camera x, moving only if the new interval requires a safety clamp. An active rebase first rate-limits from previous x, then applies safety. Dimension or scale changes initialize at the new target, still using the saved pose when frozen. A mode selection made while paused takes effect on resume. Existing root/adapter world identity and reset own history clearing; lifecycle APIs and finish timers are unchanged.
- Frames with `base` retain backdrop coverage and at least the geometry-only maximum density reserve. This does not establish browser cache performance or solve a separate backdrop seam.

## Body overlap policy

Hard constraints remain:

- The fixed player's full body proxy stays within `safeRect`; classic applies its existing selected-subject constraints.
- The full proxy avoids HUD, toolbars, objectives, and every occlusion not explicitly marked `kind: "control"`.
- The fixed proxy spans displayed y−300 through y+28, including current depth, without prediction. Classic retains its existing current/predicted vertical bounds.
- Its half-width is 132 world units in the compact-touch profile and the legacy 130 elsewhere. The fixed two-unit mobile reserve contains the sampled original roll's ±131 alpha extent without a pose-triggered zoom change.

Only soft control rectangles permit partial-body overlap. The protected standing band ends at y−140: the top 160 proxy units avoid controls and the lower 168 can pass behind them. The unchanged seven-character standing/jump heads end at y−153 through y−156, leaving some collar room. This protects the **standing head/collar proxy**, not the entire chest and not every animated head.

Crouch, knee, and roll can move the head below that band. During a short downward roll, all head pixels may lie inside translucent-control rectangles while part of the body remains outside. Do not pull the camera far away for every such pose merely to restore an all-poses head-clearance claim. Do not interpret rectangle intersection as opaque disappearance, and do not treat a wholly obscured actor as acceptable. CSS translucency and in-browser face/body readability require visual acceptance in addition to geometric tests.

The low-pose regression measures original alpha pixels for seven characters' standing, partial/full crouches, and sampled Wang roll/Han knee frames in both facings. Across 24,960 recorded-layout positional cases, no entire sampled actor lies in the control union; the worst body overlap is approximately 72.45%. This is sampled coverage, not proof for every move, future asset, or browser composition. New low poses or control layouts must be checked again.

## Offscreen opponent hints

`offscreenOpponentHints(frame, world, {route, geometry, maxHints})` supplies passive feedback only for fixed-player frames. It uses each living opponent's current body bounds (`prediction: 0`), not a predicted jump. Streets include only actual spawned, admitted encounter enemies. Helpers, future spawns, dead enemies, and stale aliases behind an empty enemy collection do not create hints.

At most one badge per horizontal side is shown, with an arrow from the nearest clipped opponent on that side and an aggregate count. Vertical clipping can produce up/down or diagonal arrows. Full labels use 88×24 logical pixels; a narrow legal gap can use a 24×24 arrow. A completely blocked layout hides the badge rather than covering the player or measured HUD/controls. Hints clear when the opponent fits or the view is inactive.

The player blocker is the saved frame pose projected through the actual camera: `px = width/2 + (pose.x−frame.x) × zoom`, `py = height/2 + (pose.displayY−frame.y) × zoom`, then `px ± 132z`, `py−300z .. py+28z`. Neither the resting target nor mutable live player coordinates may substitute for this blocker, including while paused or finishing.

`mountCameraDirectionHints` owns the shared passive DOM pool. It performs no per-frame layout reads, accepts the measured logical origin, has no pointer/focus/live-region behavior, and never becomes a camera blocker or simulation input. Root and later chapter entries use this same helper. Recorded-layout model checks do not replace visual/browser acceptance.

## Motion and solver invariants

Stable fixed motion has no enemy-driven scale easing or vertical anticipation. Horizontal follow is bounded to 480 CSS pixels/second using only the current frame's delta: finite milliseconds clamped to 0–50; missing/nonfinite values use 1000/60; negative/zero values give no rate step. The budget is 8px at 60Hz, 16px at 30Hz, 4px at 120Hz and at most 24px for a long frame. No pause time accumulates.

The horizontal target center is `T = player.x + (width/2−anchor.x)/z`. Move previous camera x toward T by at most the pixel budget divided by z, then project the saved current player. If its projected x lies outside the reserved interval, move only enough to the nearest safe edge and set `follow.clamped: true`. This safety override may exceed the speed budget and must not be described as a smoothness pass. It never changes scale, modifies the actor, changes head protection, switches pockets, or displays an unsafe intermediate frame. HP/stun classification is not used.

Subbudget ordinary motion stays at the resting target. After faster movement or an inherited collision correction, the player can temporarily differ from the target and the camera can keep settling after the player stops. Enemy-only changes cannot affect that settling path with otherwise identical player history/input. Vertical camera y follows displayed y exactly, without a rate limit; this is deliberately not a 2D lerp or a universal bound on background motion.

Classic and other nonfixed modes retain their gradual scale target, anticipation, and hard safety precedence. Natural engine-input traces and artificial initial placements/teleports must be reported separately; do not claim arbitrary teleports are cut-free.

Occlusion reduction preserves policy, holes, padding, and strict boundary semantics. Reduced rectangles are used for feasibility, but candidate coordinates retain original actor/overlay/edge order. Equal-cost ties must choose the same side as the legacy solver. Keeping only an equivalent feasible region or minimum distance is insufficient: it can change desktop composition by hundreds of pixels.

Set-based deduplication preserves first occurrence. Cost pruning and vertical coverage rejection may skip only candidates that cannot replace the current winner. They must not impose a new sorting-based tie preference.

## Adding or changing a chapter

1. Mount the normal shared UI and propagate its live measured geometry to VS and street cameras. Use the shared profile and adapter; do not add chapter-specific close-view caps.
2. Keep measurements fresh after resize, rotation, HUD/control reflow, and layout changes. Convert sideways DOM rectangles to logical coordinates once.
3. Verify actual main/chapter entry paths receive measured controls. A direct camera unit test with hand-written geometry does not prove entry wiring.
4. Check classic/stable, native/sideways equal logical dimensions, 844×390 and 568×320, portrait, desktop, jumps/depth, distant threats, and both facings.
5. Recheck original-renderer alpha and browser readability when poses, art, or control footprints change. Keep screen/HUD bounds hard and never infer opacity from rectangle overlap alone.
6. Run the focused camera/layout regressions and exact solver coordinate comparisons. Keep natural trajectory evidence separate from teleport stress results.

## Acceptance evidence and limits

The correction's Node tests replay all six recorded native/sideways844×390 and native568×320 VS/street geometries, with exact scale/target, actual-position interval safety, both directions, ordinary/over-reserve motion, delta boundaries, root and later adapter parity, and nonzero-lag pause/finish/reflow/resize/resume/world reset. Actual entry/controller tests remain required: projecting a street pose through VS geometry does not constitute real VS execution.

The reserved scales are844 VS/street 0.8085365853658538,568 VS 0.4875000002907543 and568 street 0.5437500001817215. Relative to the unpublished maximum-anchor candidate, tiny-screen scale is lower by3.96% and8.86%. It remains18.14% and27.67% above the shipped same-trace median scales0.412662577 and0.425886568. This is a conservative room-for-follow tradeoff, not physical-device or visual-preference proof. No narrower soft-control head proxy was adopted.

Original24,960 alpha cases retain zero wholly controlled actors and zero offscreen alpha, with worst sampled control overlap72.45096%. Additional1,404 original-art cases cover left/center/right follow positions, both facings and all six recorded layouts: zero offscreen/HUD intersections or wholly controlled actors, worst sampled body-control overlap62.34702% at native568 street, left reserve edge, Han full crouch facing left. Six cases have every head pixel inside the control union; the first worst is native568 VS, left reserve edge, Wang rush age0.24 facing left. These finite samples retain the low animated-head overlap caveat, not an all-poses visibility guarantee. Browser QA must inspect these positions with real translucent controls.

Actual main street seed0x671100, section0, replays960 natural input frames from the original constructor state. At frame825 the unchanged body collision correction moves player x192.28→117.3333333 with HP unchanged. The old unpublished exact-anchor camera produced a new60.59712px background pan; shipped #67 moved the fixed landmark0.04081px. The corrected camera's horizontal step is8px, scale remains0.8085365853658538, and no safety override occurs anywhere in this960-frame trace. The actor's physical correction still exists and is not hidden by a simulation change. Vertical motion and displacements beyond the reserve can remain abrupt; beyond-reserve tests require the minimum safe clamp and explicitly mark it.

The earlier108 natural engine/controller traces and72 forced-table traces established entry reach and the old exact-anchor behavior, not acceptance of this follow correction. Broader actual-controller acceptance must be rerun with target-versus-actual assertions rather than claiming those historical runs prove the new policy. Node checks do not establish browser rendering, physical-device orientation, storage or complete campaign progression.

Final browser acceptance must use one frozen candidate across native/sideways844×390 and568×320 main VS/training/street/Boss and later street/Boss, pause/mode switch/rotation/resume/finish, hint readability, and low-pose visibility, with portrait/desktop/classic comparisons. Actual Chromium partial-facade cache performance is still a blocking release gate. This contract does not claim that gate passed or that fixed zoom fixes the independent street seam.

Relevant tests:

- `tests/mobile-stable-player-follow.test.mjs`
- `tests/mobile-stable-player-camera.test.mjs`
- `tests/mobile-stable-camera-lifecycle.test.mjs`
- `tests/mobile-classic-v67-golden.test.mjs`
- `tests/camera-direction-hints.test.mjs`
- `tests/mobile-landscape-profile.test.mjs`
- `tests/mobile-landscape-entry-contract.test.mjs`
- `tests/mobile-landscape-low-pose.test.mjs`
- `tests/challenge-camera-solver-equivalence.test.mjs`
- `tests/challenge-camera-contract.test.mjs`
- `tests/shared-camera-measured-motion.test.mjs`
- `tests/mobile-presentation-repair.test.mjs`

The frozen desktop/portrait fixture and legacy fixed-scale solver reference are regression oracles, not generated expectations from the candidate implementation.
