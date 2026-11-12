# V39 readable signature animation review

## Implemented

All five later characters retain their portraits, source costume assets, combat rules and measured hand/cuff attachment points. Wang and Han pose/art branches are unchanged.

- Ma: polite bow into the handshake; only confirmed whiffs inspect the unanswered hand. The 人 glyph first sits beside the inspecting face, then rises at the original palm hit window. Coughs lift shoulders on both real beats, briefly adjust the tie, carry a hand-held briefing paper and emit mouth-level puffs.
- Su: forward mic shout keeps the open mouth visible. Three steps follow the authoritative step times, then the stance brakes and widens. Beckoning changes to a counter followthrough only for an actual counter; a missed invitation gets a separate puzzled beat.
- Huang: a committed pointing lean; two clearly separated dorsal hands for rejection; a red strap pulled between the hands only before the real queue barrier appears. No duplicate persistent barrier.
- Chen: paper-plane aim and release remain tied to the real launch; high/low questioning has separate hand levels; shrug spreads palms outside the smiling face and only a genuine calm event adds its retreat response.
- Ko: weighted bags hang below constant-sized hand crops rather than rotating the whole bag rigidly along the forearm. Name call leaves the mouth/eyes clear and uses the existing full-size falling nameplate. Resolve plants both soles and keeps the tense expression visible.

## Presentation state

The renderer consumes the core-owned `performance` record and confirmed outcome/outcomeAge. Ordinary damage can finish its visual beat without reviving an attack. Explicit `performance:null` prevents stale wall-clock records from returning after a genuine interrupt. Only the existing non-damaging recovery is eased across the original +0.28s readability tail; Han's mechanical low profile has no added tail. Live input, grab, counter, interruption and KO priorities remain in core. Move demos and art-view use the same rendering path.

## Pixel QA

Used only the official managed Sites preview with the cloud CUA browser. Inspected and saved 120 canvas frames: three moves × four times × five characters × two facing directions. Files are `ma-right.png` / `ma-left.png`, and corresponding su, huang, chen, ko pairs. During QA, moved Ma's inspection finger off the eye, lowered Su's shout fist away from the mouth, opened Chen's shrug outside the face, separated Huang's rejection palms and lowered Ko's brace fist so the expression remains visible. No loose hands, doubled fists, foreign sleeve cuffs or missing assets remained in reviewed frames.

A live Su-versus-Huang match accepted shouting and rush, rendered the new mic pose and original large caption, applied the existing 14 shout damage, and returned safely to the unchanged portrait homepage. See `live-su-match.png`.

`name-demo.png` uses the actual production `createMoveDemo` renderer at 0.42s, verifying the full 賴祥德 nameplate flying above its labeled landing marker and clear of the face. The static moves page also loaded without application errors. Browser extension metadata errors were excluded; no page-origin errors were observed. This was cloud Chromium canvas QA, not physical-device testing or a subjective audio listening check.

## Tests

- Added 18 V39 animation regressions covering personality poses, real outcomes, no gameplay mutation, simulation-clock performance, clean bag crops, both facing directions, and the preserved recovery tail.
- Existing Canvas test fixture now supports `quadraticCurveTo` used by the pulled queue strap.
- Final full suite at handback: 1,763 passed, 0 failed (`/tmp/v39-animation-final-suite.txt`).
- Existing gameplay tests still verify cough's exact 4+6 high hits, one physical straight-projectile erase, and no erase across disconnected vertical lanes. The new presentation does not add hit or erase windows.

Temporary served QA pages were removed from dist. Reproducible source fixtures remain in `tests/qa-v39/`; copy them into dist only for local QA and remove before publication. No commit or deployment was performed by the animation worker.
