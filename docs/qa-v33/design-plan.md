# V33 native-landscape overlay trial

User requests: leave cooldowns alone; fix phone double-tap zoom near the direction control; try controls over the fight picture only on an actually landscape phone. The user subsequently confirmed seeing desktop guard, so desktop guard remains unchanged.

## Choices

- Distinguish physical landscape from a portrait phone whose game is rotated 90 degrees. A first-paint and mounted data flag selects the overlay only for touch + native landscape. Upright, rotated portrait and desktop keep V32 controls.
- Preserve dedicated joystick/button gesture capture for simultaneous gameplay. Add touch-action:manipulation to game-only body, physical shell and canvas. This covers gutters outside the safe-area-fitted shell and disables double-tap zoom without a zoom-lock viewport. Disable Phaser's unused canvas touch capture so it does not cancel the browser's pinch gesture. Do not add a global touchend preventDefault workaround.
- Keep an 84px joystick and visible attack/guard. Overlay controls are translucent; only actual controls accept pointer input. Reserve enough camera space to keep conservative fighter bounds above/beside controls, while reclaiming some of the old 98px dock. Retain existing cooldown data and rendering.
- At narrow native-landscape sizes, preserve name and cooldown first; full purpose descriptions remain in metadata/settings. Wider native-landscape retains purpose text. Other modes keep all existing labels.

## Work and checks

- [x] Verify owner-private V32 deployment and exact source, open current Site source, create full pre-edit backup.
- [x] Add red/green tests for touch surface policy, browser pinch capture, settings/input preservation and native-landscape selection at bootstrap/mount.
- [x] Implement scoped overlay CSS and a presentation-only framing wrapper, preserving core camera and combat functions.
- [x] Check existing 0/90-degree multi-pointer paths, diagonal joystick, release/cancel and lifecycle behavior.
- [x] Run full tests, deterministic soak, source/audio hash preservation and independent review.
- [x] Attempt supported browser visual/input tests; disclose all not-run and failed infrastructure stages, no iPhone claims.
- [x] Publish exact tested source to the same owner-private Site with V32 rollback and original V22 unchanged.

Known evidence limit: the joystick itself already had touch-action:none. Source identifies missing coverage around it but does not prove a Safari-specific gesture bug on the physical joystick is resolved. Browser double-tap and pinch behavior requires a functioning touch browser/device to certify.

Later user-approved naming change: current game pages and share/settings title use 拳民開講, without a year. Existing Site URL and historical/source records remain unchanged.
