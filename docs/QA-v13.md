# V13 combat / counterplay QA

## Scope
Seven existing aliases and21 specials. Shared high/low interactions, three guard pips, finite guard break, real projectile reflection/return, grounded grab, one-use queue hazard, armor/slow/calm effects. Same controls; no new mode, account, charge, GitHub branch or voice claim.

## Source and automated checks
Baseline published V12 was aff83c013ff9fc9e1e19d6631172675e0256723d. Engine final SHA256949bd2cb75838379806cd3abc14e96d9d46eaf82ea196e0e39abd3ffd6befe47. Core regression suite and finite-state all-kit/soak details are in qa-v13/engine-report.md. Final owner-run `npm test`:668/668, no skips/cancellations/todos. `git diff --check` passes.

The seeded simulations are regression/stability evidence, not a claim of competitive balance. All21 AI special kinds appeared. Normal all-pair sample167player/127enemy; easy293/1. All588 plus2000 matches terminated; max3 projectiles /2 queues in all-kit run. No hidden role-based damage bonuses.

## Independent review fixes
- Guard release timestamp when jumping.
- Final-frame landing anti-air damage symmetry.
- Same-frame queue planting/destruction role symmetry.
- Universal grounded movement sweeps through queue for knockback, retreat, capture alignment and separation; no recursive hazard loops or duplicate line hits.
- Airborne bags cannot erase a grounded line out of reach.
- Actual bounded wall rebound.
- Early voluntary action releases both clasp poses without extending stun.
- Visual rolling cutout matches actual low-profile window.
- High/low hit feedback follows emitted height; rejection has feedback; Su's low triple-step has grounded pulses.
- Move cues moved away from obscuring HUD and are also exposed in persistent HUD text; return/reflection labels moved below their projectiles.

## Art and audio
One new generated transparent two-hand clasp asset; it is not a photo of an actual event. Normal/mirrored composite was independently inspected for cuff/hand continuity. Existing character heads/costumes, approved hand/cup art, aliases, source identity and21 move names retained. Han existing1.32s original excerpt and its hash retained; other original slots unresolved. No voice imitation introduced. Existing rights/attribution notes retained; private prototype only.

## Verification limits
Continuous cloud Chrome QA and controlled legal-input fixtures are separate evidence. Controlled phase screenshots freeze the requested legal-input simulation at1/120s steps; they do not prove physical-phone performance or every possible pose combination. No claim of perfect anatomy or final tournament balance.

## Independent bounded approvals
Final engine review at949bd2cb:112 independent real-input cases passed, including both difficulties, mirrored roles/faces and exact earlier guard/landing/queue/forced-movement failures. No remaining significant engine finding in reviewed scope.
Desktop art review inspected23 stable screenshots: seven sheets with all21 moves at four selected phases plus16 interaction/facing snapshots. No new P1/P2 visual blocker. Mirror sheet column samples recovery only; captured interaction cases include both facings. Minor remaining polish: persistent world-space status text can cross faces, while duplicated HUD text stays readable.

## Responsive and manual input checks
Actual320×568 and667×375 iframe viewports of the unchanged production page: body width/scrollWidth and height/scrollHeight match exactly, no main-page overflow. Small portrait menu, longest move names, active battle, end-of-round result, replay, held movement and punch, crouch/jump buttons, pause and return-to-menu were operated. Help/source dialog opens/closes and scrolls internally. Landscape started, moved/jumped/attacked and paused. These are cloud desktop browser viewports, not physical-device touch benchmarks or multitouch hardware certification.

One browser renderer crashed (Chromium error9) while opening a mobile fixture with multiple stale art/QA tabs restored. No definitive root cause was established. After closing only our stale test tabs and reopening, the same fixture loaded and completed the portrait/landscape flows. The subsequent single-tab foreground rendering soak was stable; browser extension metadata errors are excluded from application-error assertions.

## Final foreground sample
9 completed rounds, 9189 rendered frames, median58.2FPS across593 post-start samples; observed full range[50.6, 60.5], final59.2FPS. Final display object count27, projectile sprite pool4. Scene counts remained bounded in repeated samples. No127.0.0.1 application warnings/errors in final tab logs. This is a short cloud-Chrome smoke, not a hardware benchmark.

Final independent mobile pixel review passed all8 portrait/landscape captures, with no blocking clipping/overlap or inaccessible controls. All temporary QA pages/scripts were removed from dist before packaging.
