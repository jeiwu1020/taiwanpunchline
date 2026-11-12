# V5 first-roster QA

- Added Ma/Su/Huang, nine character-specific specials and five-by-five player/opponent selection. Existing Wang/Han balance, crouch, damage and timing retained.
- 176 automated tests pass: original49, 112 roster, six UI and nine animation tests. Core author observed failing tests before implementation. Two seeded original Wang/Han trace hashes remain exactly equal to V4 baseline.
- 150 deterministic complete matchup simulations (25 pairings × 2 difficulties × 3 seeds) finish with finite bounded state. All new specials tested as both player and opponent in both facings, including range boundaries, cooldown, interrupt/crouch, two folder hits and counter consumption.
- Independent source review found no release-blocking combat, UI, voice or load issue. Minor inspector-only Ma counter arc omission corrected to actual .10–.68 second window.
- 320×568 portrait and667×375 landscape menu and actual battles visually checked in CUA. All combat buttons fit without horizontal overflow and remain at least44px high. Selection/reselection and Ma/Su/Huang matchup updates exercised; pointer specials trigger their proper name, cooldown and source/fiction label.
- New torso/head/hand/prop atlases and all new authored pose trajectories have finite joint coordinates, fixed segment lengths and bounded actor-canvas geometry. Automated geometry is not proof of anatomy correctness.
- QA fixtures live under tests/qa-v5 and must not be included in deployed dist.

Limitations: whole-character mirror, not independent opposite-side anatomy. New characters have one principal facial expression each, with pose/angle changes rather than full expression animation. Desk/folder materialize as comic props; no pickup/stow animation. No physical-phone/Safari/multitouch or long-duration performance claim. No public/commercial voice-rights guarantee.

## Final independent visual and performance pass
- Ma/Su/Huang normal and whole-character mirror contact sheets: basics, walking, jumping, crouching and all nine specials visually checked by a separate reviewer. No release-blocking wrong hand, disconnected joints, atlas bleed or clipped extremities identified.
- Su fist-to-desk contact was too high; final strike wrist lowered to the visible table edge and verified in both facings. New shin crop/cap trimmed so shoe-bottom black spikes disappear without ankle gaps. Huang right hand visibly overlaps the folder spine and remains connected; Ma handshake hand keeps right-dorsal orientation.
- Final isolated foreground Chromium autoplay completed four consecutive full rounds (Ma, Su, Huang, then original Wang): observed47.8–60.2 FPS, bounded scene/texture counts, up to3 pooled projectiles, no application console errors or tab crash. Browser extension metadata errors excluded. Prior background-throttled13–17 FPS samples were rejected after checking the native selected tab; they are not included above.
- Review covers static poses and key timeline moments, not every possible interpolation/collision frame. Source and visual reviewers were independent of implementation.
