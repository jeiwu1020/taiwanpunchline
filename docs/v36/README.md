# V36: Ensemble title and readable comic moves

Base: a71298201aebb152b6754980012ba95ba6ff4812 (published V35).

## Scope
- All seven characters share a title poster. Two foreground placements vary on each visit; no matchup is selected by the poster.
- Desktop and portrait use a vertically arranged poster. Short landscape uses title/Start beside the cast; Start still opens character selection and synchronously requests audio unlock.
- Large single move-caption bubbles replace overlapping catchphrases. Shared presentation is used in battle and the move demo.
- Larger dream paper plane, full readable 賴祥德 label, a visible 人 glyph over the existing palm-attack range, and a highlighted wrist-to-wrist handshake.
- Per-costume sleeve boundaries and normalized replacement hands, correct dorsal left-hand asset, layered sunglasses, and coordinated cough/knee expressions.

## Gameplay safety
Core combat definitions, hitboxes, damage, cooldown, AI and balance settings remain unchanged. The brief extended recovery drawing yields to movement, defense, new attacks, jumping and hit reaction. Visual effect size must not be interpreted as enlarged hitboxes.

## Verification
Title flow/branding tests: 33 passing. Browser inspection at 1168×735, 390×844, 844×390 and 568×320. Start opens selection; all seven portraits and the parody notice are present. Viewport QA used same-origin sized frames in desktop Chromium, not physical phone hardware. Final cache-bumped full suite: 1,565 passed, 0 failed. All 21 special moves were visually reviewed in both facing directions. Added 36 counterplay regressions and ran 588 complete scripted matchup rounds; these verify mechanical counters and stability, not equal human win rates. See signature-counters.md and limb-art-review.md.

## Rollback
Revert to the base commit or previous saved Site version. Original assets are retained; the new dorsal-hand asset is additive. This work does not touch GitHub qa/main or any other game.
