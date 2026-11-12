# V30 larger fight view and compact controls

Approved scope: preserve the V29 version and existing world/collision/audio/move rules. Remove the phone's separate jump button by default, use joystick-up, retain stationary guard. Compress phone landscape header/dock, place stick left, three moves center, attack and guard side by side at right. Upright keeps stage above controls. Desktop also reduces chrome. Fit both fighters and jumps without cropping. Verify V18/V19 world bounds rather than widening them; add a natural visual edge cue.

Implementation choices: the current DOM HUD overlays the canvas while camera code reserves a second broad HUD margin. Make it a separate compact row above the fight canvas; camera functions then fit directly to fighter bounds with no HUD subtraction. Retain existing public camera interfaces and preference values. Append a V30 CSS layer to keep old versions recoverable. No new dependency, external task or new Site.

## Plan

- [x] Open existing owner-private Site source, verify V29 HEAD, create complete pre-edit backup.
- [x] Add red/green layout tests for compact phone/desktop dock, explicit guard, no phone jump key, and HUD/canvas separation; implement V30 CSS and help copy.
- [x] Camera worker: add body-fit/growth/near-far/jump/backdrop regressions, remove old HUD reserve and preserve easing and stable option.
- [x] Read-only audit V18/V19 limits and current collision range; render fixed-world low rail/floor edge cues at verified bounds, with no physics changes.
- [x] Add two-pointer production-binding regressions for joystick-up plus guard/attack and release/cancel across rotation.
- [x] Run complete suite, deterministic combat soak, syntax and diff checks, independent review.
- [x] Coordinate official preview. Inspect desktop, 844×390, 568×320, 320×568 upright and sideways, near/far/jump framing and accessible controls. Distinguish simulated pointer events from physical two-finger touch.
- [ ] Preserve final source backup and exact commit, deploy the same owner-private Site, verify original V22 remains unchanged and report real test limits. The release record is kept outside the source checkout after publication.
