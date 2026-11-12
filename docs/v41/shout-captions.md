# No-frame comic shout captions

Approved revision: replace tracking speech bubbles with bold outlined words, remove all actor tails/connecting lines, briefly punch in then hold/fade, and use separate left/right screen-safe zones with different colors. No fighter/camera resizing. Two existing signature moves receive a short, unfilled, tailless sawtooth outline: 一支穿雲箭 and 太離譜了.

Implementation: new shout-caption module maps fixed screen anchors to camera coordinates, never reads actor position/facing. Player is warm yellow and AI cyan. Measured logical HUD height (not transformed screen rectangles) protects rotated phone layouts; overlay controls reserve a bottom strip. Long names wrap at the available half-screen width. Single caption per actor remains, new moves replace old captions. Retired pooled boards/subtitles stay hidden; animation settles after 200ms and fades in the final 260ms. Reduced motion disables scale animation.

Validation: node tests cover portrait 390x640 and 320x480, landscape 844x390 and 667x320, separate lanes, HUD/control boundaries, colors, fixed screen position across camera changes, pulse/hold/fade timing, live Arena lifecycle and hidden legacy geometry. Earlier v40 pure layout tests remain as historical coverage, but the runtime uses only the new shout layout. Updated the cache-key regression and superseded bubble-lifecycle assertion to match the approved design.

Rollback: existing Sites #18, commit 95fc1a526750a880459ebeba962a77d58f792b86; local tag backup-caption-before-v41. Existing site audience must remain owner-private.

Browser verification: inspected 844x390 simultaneous shout fixture, 390x640 portrait fixture, 667x320 facing-reversed fixture, then the real game with both player's and AI's active move captions. The live game placed both names below their HUD sections, with warm/cool color separation and no boards or tails. Full suite: 1,777 passed, zero failures. This is cloud-browser and deterministic viewport-fixture testing, not a physical handset test.

Burst follow-through: only arrow and huang_shout get the accent, 260ms on wide screens and a smaller/fainter 180ms mobile accent. Reduced motion disables it. The outline is below fighter art (depth -1), never a filled occluder. UI and side-lane bounds are unchanged. Browser inspected wide and mobile fixtures; regression tests cover rarity, lifetime, reduced motion, no fills, and cleanup.
