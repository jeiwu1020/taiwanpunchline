# V54: Visible item contacts

Scope: Fix paper and rubber duck collision presentation without changing their damage, throw windup, cooldown, flight speed, lifespan or guard rules. Preserve V53 (#31) match-finish timing and all unrelated content.

Rollback: `backup-before-items-v54` points to source `2d6c4706f09c14c98dd70ef0f61655e752eb84c5` (private deployment #31). A complete tracked-source tar was saved before editing.

Baseline: Full existing suite passed before production edits. At 844×390 in Chrome touch-layout simulation, the old duck could visually pass a nearby opponent with health still 100. This is browser QA, not a physical iOS-device test.

Intended contact rules:
- Duck can hit immediately after release while falling, and keeps moving on the floor.
- Paper visibly rises from its releasing hand to a high lane. Crouch/roll avoidance comes from geometric clearance, not unconditional immunity. Very close crouchers may be hit during ascent if artwork actually overlaps.
- Item-specific swept collision follows separated visible body/limb regions rather than a single large box. A projectile can damage a target only once. Existing front guard rules remain.

Final validation and deployment evidence will be recorded after implementation.

Additional user-authorized UI fixes: touch control CSS previously overrode the ready label color. Full meter now explicitly uses dark green text on light green on both layouts; incomplete text receives a dark green backing so filling behind it does not wash out white labels. Victory, result, HUD and countdown display text disable native selection/callout. Settings dialogs and inputs are outside these selectors; assistive labels and button interaction remain unchanged.

Browser QA so far (Chrome, layout simulation):
- 844×390 near duck: target health 100→90, duck consumed with hit feedback.
- 844×390 paper at 250 world-pixel spacing: standing health 100→92, fully crouched health remains 100 while paper visibly clears head.
- 844×390 duck from desk: initial duck at elevated throwing hand, then falls and hits floor opponent for 10.
- 390×844 near duck hit and full-green meter: both text rows remain within 54px button; full state dark green and distinctly visible.
- Winner text drag/double-click does not visually select text in Chrome. Physical iOS callout behavior cannot be certified in this environment.

Final integrated verification: 1,992 tests passed, zero failures/skips, after cache-reference updates. Special cutout review regressions cover lotus knees/elbow, rolled body/shoes and narrow Han shouting portrait. Settings slider keyboard adjustment was exercised and restored; settings remains usable. QA fixture files were removed from dist before packaging. Entry cache is game v232; core, stage-rules, art-render and item collision use v54. Previous #31 remains recoverable.
