# V35 verification and limits

Baseline: published V34 / 609f20db6879d7f5242039b44741508aa2ab46ce.

- Complete Node regression: 1,459 passed, zero failed.
- Combat soak: 588 matches completed.
- All 101 baseline asset files are byte-identical. Core combat, audio/music controllers, voice slots/manifests, art renderer, viewport, battle gesture and touch-control modules are byte-identical.
- Title tests cover all 42 ordered distinct pairs, seven-character reachability, no mutation, repeated visits, readiness, synchronous Start, duplicate clicks, thrown/rejected entry, and stale completion isolation.
- Integration tests cover initially silent/unready title, no unlock from unrelated initial gestures, synchronous attempted audio with navigation despite rejection, saved master mute, preserved selection/preferences after return home, countdown cleanup, voice-prime completion and visible Canvas failure.
- Read-only independent review identified and fixes addressed: initial voice prime cancelled by roster navigation; hidden landscape retry; low contrast retry text; hidden Canvas initialization error. Navigation now precedes priming within the same click. Error-only feedback gets a readable compact landscape row and 44px retry. Canvas errors update title status.

## Managed browser

Production desktop page: title visual, saved mute, Start to roster, initial music state waiting on fresh load with sound enabled; enabling sound and opening settings displayed Fluffing a Duck playing. No claim of auditory listening.

Full Phaser page later hit Page.getFrameTree / DOMSnapshot timeouts. Remaining phone layout checks used a temporary fixture with production HTML, CSS, title controller and viewport controller, without Phaser or audio. Verified:
- 390 x 844 portrait rotated 90 degrees.
- 844 x 390 native landscape.
- 320 x 568 rotated and upright. Upright final spacing fits its 500px cabinet height.
- 480 x 320 native landscape. Final layout fits 464 x 272 inner title surface.

The start button center hits its actual target. Layout text and disclaimer are visible; disclaimer is 12px. Desktop and final mobile visual screenshots were inspected via supported browser API. Some character transforms can extend 2–8px into clipped outer title padding; no horizontal page scroll is introduced. Initial screenshots and layout fixture do not prove physical Safari, multitouch, audio permissions, or rotation behavior on an iPhone. Final return-home/audio rejection lifecycle is automated-test coverage, not a claimed hardware test.

Temporary local QA files were removed before packaging; fixture generators remain under tests only. Shared preview stopped and released. No challenge/progression/equipment feature implemented. No cooldown, combat, audio clip or audience changes.
