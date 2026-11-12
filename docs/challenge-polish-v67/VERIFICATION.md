# Challenge polish v67

Base: deployed private Site #43, source e31e022a5e88c71520a5e28b24c73d727af4ff59.
Original pre-trial #42: 3f7ffe16edd33209474b59b20646f428c8a4c08a.

## Scope
- Original VS controls unchanged: no new jump button. Skill allocation still applies only to the player's challenge stats, not VS, practice, or same-character AI.
- Four-direction trial remains standalone street-trial.html; original challenge remains horizontal. Trial does not write profile progress.
- Custom in-game challenge selectors, rotated scroll mapping, independent portrait close area, contained portraits, locked progress without future names in DOM.
- Larger contained comic frames, generated street road/sky and arena, generated tables/signs, distinct fictional miniboss art, corrected mob collars, neutral miniboss flags.
- Original street bodies block grounded walking while permitting jumps. Trial's depth hook permits walking around a different lane.
- Trial controls, original comic shout styles, non-squashed crowd sprites, background overscan for jumping.

## Visual checks in managed Chromium
- 390x844 portrait trial controls; 844x390 landscape trial, jump camera fully illustrated without blank sky.
- Original chapter custom selector opened and selected successfully, including CSS-sideways rotation.
- Research portrait close button and head, sideways full head and scroll from 0 to 720, all headings/skills retained.
- Comic 390x844 portrait and 844x390 landscape: full head and feet; no CSS crop. Original miniboss intro flows into generated arena.
- Five mob/captain types in idle, punch and crouch contact sheet, using production renderer.
- No localhost application error in browser log. Unrelated browser-extension metadata messages ignored.
- No physical iPhone testing; real touch smoothness and sound perception need device confirmation. Rotated touch mapping has deterministic event tests.

## Review
Independent source review found short 568x320 landscape caption overlap. Fixed with compact single-line layout and regression tests for four moves. Research header compacted after visual inspection.

## QA fixtures
The three HTML files beside this report are local test fixtures only. Copy to dist root temporarily to run; do not publish them. They do not ship in dist.

## Rollback
Keep saved versions #42/#43 and full source TAR backups. Re-deploy saved #43 to reverse all this batch (including challenge changes), or #42 for pre-four-way trial. No browser storage schema/key changes are included; rollback does not remove player save files.

Final automated validation: 2,260 tests passed, zero failed. Cache keys for changed entries/modules updated. Three temporary QA pages moved out of dist before packaging.
