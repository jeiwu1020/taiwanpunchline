# V23 move presentation and voice candidate

Based on source commit `6af0e93`. This candidate is for integration with the separate camera/mobile-layout comparison; it has not been published to the existing private Site.

## Confirmed causes and changes

- Each actor had one voice lane and rejected every new phrase while the old one was playing. Several source clips last longer than a move's action duration (cough 7.37 seconds; queue phrase 13.06 seconds), so a later valid move could be silent.
- Three delayed voice cues were also canceled if their attack object disappeared before the cue age. All accepted specials now request their existing audio immediately. A new phrase replaces that actor's old phrase, never queues behind it; the other actor's lane is unchanged. This does not promise that the previous long phrase plays to its end.
- Previously only three moves had a narrow, one-hit interruption guard. Every accepted special now keeps its key performance through normal nonlethal hits, including repeated hits and grabs. Offensive moves retain their last active phase or projectile release. Defensive moves retain a short starting pose before their existing consumption rules apply. Drinking retains 0.4 seconds so the cup reaches the mouth; later damage can still cancel healing and cause the original spit animation.
- Damage, wall-bonus damage, KO, cooldowns, guard rules and ordinary attacks remain active. Protection is not invulnerability and does not make rejected inputs legal. A finished hit reaction no longer masks a newly accepted special's face/pose.
- The gold ring and HUD now say `出招保護`; move hints and help copy describe the actual bounds.

## Verification

- Regression tests were run failing against the old behavior before fixes: 68 initial key-phase/audio cases, then residual-reaction and two protected wall-damage/KO cases.
- Fresh complete `npm test`: **1100 passed, 0 failed**.
- `node tests/soak-v13.mjs`: **588 rounds completed** across all 7×7 pairings, both difficulties and 6 seeds. No invalid HP/position/guard state, stuck round or duplicate persistent projectile/queue. Maximum 3 projectiles and 2 queues.
- All runtime `.mjs` modules passed `node --check`.
- All 20 currently mapped voice files were present and decoded successfully with ffmpeg; no source audio bytes were changed. The remaining move, drinking, uses synthesized sound.
- Independent code review reran the 1098-test pre-wall-fix suite and an additional 168-case all-specials/both-roles/frame-step matrix. It found the protected wall-bonus omission; the two new regression tests and final full suite cover the correction.

## Limits and integration

Audio playback control and lifecycle were checked through the existing mocked browser/media harness. No physical iPhone/Safari sound-listening pass or browser autoplay-policy guarantee is claimed. Muting, a blocked media play, background pause and KO can still stop sound. The integrated UI candidate requires browser QA before publication.

`parliament-audio-fix.patch` excludes `dist/index.html` to avoid overwriting the concurrent mobile layout. Its four exact text changes are in the separate `parliament-audio-html-replacements.json`. Apply those strings to the integrated HTML, bump its game module URL as part of that release, then rerun the combined suite.
