# V37: central entry, intentional voice preview, Huang hand review

Base/rollback: V36 commit 30b05cff3e45711ddb0b0efc531d7f8c6e90f7e4. Existing private Site only; no platform/GitHub branch changes.

## Entry and navigation
- Audio unlock now primes an actual zero-sample PCM WAV, never a character recording. This prevents a browser mute/unmute transition from leaking 高雄發大財.
- Deliberately selecting any of the seven roster portraits previews exactly that character's first move, respecting master/voice mute and volume. Entering the roster or changing difficulty does not preview speech.
- An explicit toolbar 首頁 button returns to this game's title and clears combat inputs, countdown, voice and previews. No platform URL/configuration exists in this source; a future platform integration must supply its verified destination.

## Validation
- Entry/voice lifecycle focused tests: 25 passed.
- Browser verified Start reaches selection with only the silent priming source; selecting 咆哮哥 uses its first-move voice file; in-countdown 首頁 returns to title and clears the game.
- Audio source routing and zero-sample data were verified; this is not a subjective listening loudness test or a physical iPhone test.

## Huang anatomy
Reviewed all three moves at multiple times in both facing directions. The near/right hand now uses dorsal artwork (including a new pointing sprite), the far/left dorsal hand remains distinct, and wrist angles blend from the forearm during startup/recovery. Unchanged portraits and original assets remain present. See huang-hands.md and paired visual sheets.

## Test boundary
No combat rules, damage, cooldown, hitboxes or AI behavior were changed. The all-roster entry tests verify intentional preview only, saved mute, repeated deliberate audition, silent startup and returning home during countdown. Small-screen layout is tested in responsive frames in cloud Chromium, not physical mobile Safari.

## Final validation
Cache-bumped integrated suite: 1,593 passed, 0 failed. Title browser QA covers desktop, 390×844 and 320×568 portrait, 844×390, 568×320 and 480×320 landscape, plus rotated 390×844. Central Start remains clickable, all seven faces and names are visible, no title scrollbar or overlap. Compact landscape keeps the same surrounding composition; very short viewports place nameplates beside the faces. See title-layout.md. Temporary browser QA pages are not in the deployment.
