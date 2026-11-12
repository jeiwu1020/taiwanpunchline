# V32 touch alignment and visible controls

The user asked to fix the reported problems directly. V30 is preserved as commit e248af9d6947c306c7b66baf3044be00cc953680 and its full source archive. Audio V31 was merged from exact commit5a14fe376b2bd07bae6846b9dad6a7958eea7f2d; the final approved ko_name selection was integrated separately.

## Evidence and approach

- Desktop guard is present in the DOM but hidden by the touch-only container. K and left Shift already map to guard; S and down map only to crouch. Expose the existing control, clarify its label, and retain the existing rules.
- V30's joystick is 56px and near the edge. Enlarge it to 84px with a reachable inset in a reserved dock. A floating overlay was considered but rejected for now because it would cover fighters or move controls at small sizes.
- The viewport handler trusts one visualViewport sample per event. A model reproduces a stale landscape sample after window dimensions become portrait, with no subsequent scheduled reconciliation. Offset-only changes do not clear held pointers. Native button hit testing and the inverse joystick rotation are otherwise correct.
- Keep one physical coordinate model and native hit testing. Reject clearly stale orientation-mismatched visualViewport sizes at normal scale; retain valid browser-chrome and pinch-zoom changes. Resample after viewport events until geometry settles, and release/gate gameplay input during changes. Lock root scrolling while keeping internal settings panels scrollable. Do not guess a second touch-coordinate offset or replace the rendering engine.

## Verification plan

- [x] Add red/green tests for stale orientation samples, safe-area changes, offset-only changes, bounded settling, root scroll and input readiness.
- [x] Implement mounted and first-paint viewport parity; keep camera/controls on the same committed frame.
- [x] Expose desktop guard, label K/left Shift and crouch correctly; enlarge/inset joystick without overlaying fighters.
- [ ] Add actual DOM pointer target checks to the existing preview harness. Exercise repeated portrait/landscape/portrait transitions, scroll, settings, safe-area geometry and two independent pointer events.
- [x] Run the full suite and deterministic combat soak, verify core/move/audio preservation, and obtain independent review.
- [ ] Merge onto the released V31 audio source, validate again, preserve exact rollback and publish the existing private Site once.

No actual iPhone/Safari is available in this environment. Browser viewport and DOM hit tests cannot certify its compositor or physical two-finger behavior; report those limits explicitly.
