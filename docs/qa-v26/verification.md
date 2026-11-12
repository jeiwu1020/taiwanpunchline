# V26: move-purpose copy and approved Chen audio

## Scope
- All seven characters / 21 moves use name + plain-language purpose on combat buttons, tooltips and accessibility labels.
- Detailed move information preserves exact damage, combo damage, conditional damage and fixed cooldown. Live cooldown pie, countdown and ready status remain.
- Touch landscape buttons are enlarged just enough to show purpose text. Narrow portrait controls have additional height to avoid clipping. Existing actions, hit rules, recovery, AI and animations are unchanged.
- Chen's dream voice uses the exact candidate the user listened to and approved: crop the previous audio at 0.800 seconds, retaining its original end. The final decoded duration is 1.772 seconds, matching source-video range 7.848–9.620 seconds.
- No second-stage move presentation/protection, move preview interface, campaign, skill tree or persistent progression was added.

## Verification
- Fresh full suite: 1,178 passed, 0 failed.
- Seeded soak: 588 complete rounds across every character matchup, both difficulties and six seeds. Gameplay outcomes and counters match V25 exactly after excluding execution duration.
- Syntax checks and git diff whitespace checks passed.
- Read-only independent review found two stale audio expectations, corrected before the final passing run. No mechanical change identified.
- Official cloud Chromium browser, not physical iPhone/Safari: visually inspected touch 568×320 landscape and 320×568 sideways portrait. Ma's long move name and purposes fit without element overflow.
- Non-touch 320×568 exposed clipped names with the initial layout; increased button/control-deck height and then visually rechecked Wang's three moves with no element overflow.
- Non-touch 1160×690 desktop visually checked with no element overflow.
- Browser preview selected the approved Chen filename, decoded duration 1.772, readyState 4 and no media error. This verifies resource routing/decoding, not an independent auditory review. The user approved the clip by listening.
- Cloud browser suffered transient tab/connection timeouts and recovered after reload. No physical mobile or Safari test claimed.

## Audio provenance and rollback
- Integrated file: dist/assets/voice/chen-dream-user-confirmed-v26.mp3
- SHA256: 4f31d0cb1f9eff429b06fb19863d9dad464a2ad5a06fc3718944bf2cbbdae9a9
- Original remains in place: dist/assets/voice/chen-dream-user-candidate-v201.mp3
- Original SHA256: fef9b40261b220e8066693292cd83089b9db885102b11c741cbb5369a4ccbc7a
- User approval concerns the cut point, not speaker authenticity or reuse rights.
- Exact pre-change source commit: 1cdff116bdfe529c1aa3c2d068d0df8dd0018617.
- A complete archive of that commit was retained before editing. Existing saved Site version 3 remains available for rollback.
