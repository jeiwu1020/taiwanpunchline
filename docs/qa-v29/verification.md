# V29 interface verification

## Approved scope and preservation

V29 refines orientation startup, understandable camera labels, audio audition feedback, one-screen move browsing with a separate detail layer, and touch controls below the stage. It does not implement the pending combat interruption/presentation phase or a challenge mode. Existing music, audio assets, values and move logic remain unchanged.

V28 rollback commit: `c1a552bdeb18f721f5064aeef2582a816e418b35`.
Pre-edit full backup: `parliament-v28-before-interface-c1a552b.tar.gz`.
SHA-256: `7b0ab88e9cdc0ceebd92b520f4ca6c96a948ff647e3b6bc9eb8bfdf9ffc033d8`.

## Automated checks

- Final aggregate `npm test`: **1306/1306 passed** (`full-release.log`).
- Focused final audio/UI/viewport regressions: **15/15 passed** (`review-green.log`).
- Independent read-only review reran 23 related checks, all passed, and found no remaining major issue after fixes.
- `node --check` passed for viewport bootstrap, game, settings view and game viewport modules.
- `git diff --check`: clean.
- Deterministic combat soak: **588 rounds**; outcomes match V28. Easy: 268 player wins / 26 enemy wins. Normal: 222 / 71 / 1 draw. Maximum 3 projectiles, 2 queued cues (`soak-final.json`).
- Production combat core, roster, stage rules, art-motion, voice mappings, background music controller and music assets are not changed in this version.
- The legacy history/source block remains byte-identical to V28. Its SHA-256 is `d636d17d1e3f362c1b437ee123c64455f40dc03c2017c7d473604306fde8f40c`.

Tests include initial rotation before Phaser/assets, saved upright mode, safe areas, blocked/corrupt storage, complete 21-voice selector routing, mute/zero/blocked/error/cancelled audio feedback, stopping queued cue sequences and stale voice callbacks, the separate inert detail layer, and compact gallery layout contracts.

## Browser checks completed

Official managed cloud Chromium was used, with desktop-hosted phone-sized frames. No physical phone or Safari claim is made.

- Desktop: menu and settings open; effect audition mute explanation; unmuted three-cue status; selected Chen voice media enters playing state with the approved asset. This confirms routing/state, not independent hearing. The large gallery, details layer, Escape/back and retained character selection were exercised.
- 568×320 native landscape: seven characters and all 21 move buttons exercised. An old fixed compact canvas height initially overlapped action buttons; V29 now constrains it to its grid track. After reload, main workspace height and scrollHeight both 205px, width and scrollWidth both 530px. Preview canvas 356×111 ends at y=240; action buttons start at y=243. No main-action scrolling or overlap. Details showed Ko's armor data in its own scroll area.
- Touch dock at 568×320, 844×390 and upright 320×568 / 390×720: actions remain inside the cabinet, with joystick, guard, jump, attack and three enlarged special cards below the arena. Full observations are in `touch-viewport-report.md`.
- Saved rotation-off reload: initial loading frame already has portrait layout and no rotation before scene readiness.

The shortest 568×320 landscape screen has a smaller fight area because controls no longer cover fighters. Observed standing characters are about 50px tall; at 844×390 about 110px. This tradeoff is documented, not a combat scale change.

## Review fixes after initial browser run

- Settings dialog uses compact chrome at logical heights up to 500px, independently of the game's 360px compact threshold. This prevents 844×390 and nearby-height selector clipping identified in review.
- Voice audition loading text is set before playback, so a synchronous media failure is not overwritten by a success-like message.
- Cancelling effect resume because a channel is muted now explains the mute instead of claiming playback failure.

## Verification limits

The shared browser later repeatedly failed CDP DOMSnapshot/Runtime operations, then automatically recovered and cleared its tabs. A newly created tab also timed out while the managed server remained healthy. The service was released to the next task rather than interrupted or bypassed.

Still pending at this checkpoint: final 844×390 gallery rendering after the compact-threshold fix; upright and rotated portrait gallery rendering; final live-browser permission/error feedback. Automated failure simulations passed. Physical iOS/Safari gesture unlocking, actual touch scrolling, device audio output and subjective loudness/listening were not independently verified.
