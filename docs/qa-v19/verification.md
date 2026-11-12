# V19 verification

Verified 2026-11-06 in the dot cloud workspace. Last full `npm test`: 1016 passed, 0 failed. `git diff --check` and syntax checks for game/core passed. All V18 voice files, voice slots and voice-channel implementation are unchanged.

## Scope delivered
- Result action reads 更換角色.
- Filled SVG sector cooldown: colored area decreases to zero, then check/就緒. Numeric remaining time remains visible.
- Built-in generated fictional parliamentary background, optimized WebP 434338 bytes. Wider camera framing and eight bounded decorative drifting papers. This changes visible scenery, not the 960-unit arena boundaries or move ranges. No paid generation tool used.
- Paper ball and squeaky rubber duck: 10–14 simulation-second random interval, at most four drops in a round, one-second landing warning, nearest eligible walkover pickup, one carried slot, ordinary attack throws. Same rules for both actors. Paper is high, grounded duck is low; normal dodge, block and reflect rules apply. Carry state appears in HUD and changes attack button to 投擲 with item name.
- Han knee .12–.68, Su shout .05–.38 and Ma cough .08–.42 seconds receive one non-grab interruption protection. Damage is not reduced. Second hit, grab, out-of-window hit and lethal damage can interrupt. No global invulnerability. Existing separate voice lanes continue through hits, with same-actor busy phrases skipped.

## Independent review
A separate read-only reviewer verified the merged item event path, actor symmetry, tie handling, throw consumption/interruption, ground/air evasion, pause/end cleanup and guard boundaries; 169 focused tests passed. Removed a held-item card that overlapped a crouching hand, and eliminated duplicate launch SFX. A narrow-HUD wrap risk was addressed with a single-line ellipsis; full carried-item information remains in the centered item notice and attack button.

## Browser observations
Used official sites-preview and the shared cloud browser only. Desktop 1180×756 and emulated viewports 320×568, 390×844 and 568×320 visually checked. The background covers the stage, both actors remain below the HUD, ground contact stays on the illustrated floor, controls remain within the page, and filled cooldown sectors are visible. A test-only visible control panel set deterministic intermediate states for crouch/carry and throw; these are not claims of unassisted manual gameplay.

Observed a real core-generated random drop, moved through the core pickup path, then used ordinary attack to throw paper. Observed Han retain his knee move after losing six HP from the protected first hit. Landscape duck throw, small-phone crouch/carry and high/low scene readability were inspected. Test-only pages were removed from dist before release.

In an active normal-AI Han/Ma match, real keyboard U/I/O input worked, health and cooldowns updated, and result 更換角色 returned to selection. A separate production-entry Su/Huang selection, countdown and pause flow worked. An authored temporary 300-frame RAF monitor measured 57.5–59.8 fps, p95 16.8 ms in this desktop session; this is not a guarantee for physical phones. Existing shared-browser extension metadata errors and occasional automation timeouts were observed; closing only our own test tab restored control. No application JavaScript error was observed in the inspected console output.

## Limits
This does not certify perfect anatomical accuracy, all physical devices, subjective balance or audio rights. Character assets and joint rendering are unchanged. Existing 19/21 playable voice slots and their source/rights caveats are preserved; no new source or voice authentication is claimed. Scene drops are deliberately lightweight code-drawn cartoon props. The generated chamber is fictional, not an exact Taiwanese legislature reconstruction.
