# V11: Han lotus-style knee walking

## Scope and evidence
The user corrected the earlier ordinary kneeling pose: the legs should remain crossed while moving on the knees. The old V10 pose did not match that description.

Viewed references:
- https://www.mirrormedia.mg/story/20191225edi011 (seated folded-leg pose)
- https://www.mirrormedia.mg/story/20200710inv002 (raised hips, knees supporting a front-folded leg bundle)
- https://dailyview.tw/popular/detail/7391 (upright knee-supported handshake)

All three articles contain stills credited to the original STR show. The original https://www.youtube.com/watch?v=2pzt4XbdANM was opened, but its video remained black/buffering. Neither continuous motion nor sound was observed. The animation cadence is cartoon design based on the stills and the user's description, not a filmed-motion reconstruction. No news photographs or new audio are included in runtime assets.

## Changes
- Replace the ordinary kneeling atlases with a newly generated, invariant folded-leg body: both shoes remain crossed in front, above the knees.
- Reuse Han's approved head and shout face. A fixed neck anchor removes the old complete-figure expression swaps.
- Move the folded pose through one readable left/right weight-transfer pair during the unchanged 0.18–0.60 second advance window. The lower knee contact is aligned to the floor; the opposite knee lifts. The folded leg bundle is not independently articulated.
- Move entry/recovery wrists toward their generated-pose positions, with gradual perspective shortening, rather than snapping between fists beside the face and open arms.
- Preserve gameplay, hitboxes, damage, invulnerability rules, cooldown, advance speed, other characters, and original audio slots.

## Automated verification
435 tests pass, including seven V11 regression tests. New tests cover alternate support, numerical continuity, stop-before-shout behavior, a single body/head draw, no duplicated body outside the pose window, one readable support pair rather than rapid tiny wobble, and wrist continuity at entry/recovery.

The core, roster, other-character pose/renderer, and CSS hashes match the V10 baseline. `game.mjs` is identical after normalizing the two versioned art imports. The preload image total decreases from 31,317,546 to 30,922,406 bytes. No new dependency.

## Visual verification
Initial independent review confirmed the corrected folded silhouette, front-retained shoes, clean normal/mirrored head/neck seams, and absence of the ordinary kneeling rear-shin silhouette. It identified a weak knee shift and hard entry/exit body changes. The shift was strengthened and slowed to one left/right pair, and entry/recovery arm positions were aligned. Updated visual checks are recorded below after browser validation.

## Remaining limits
The knees stay in one generated folded shape and use body balance, not individually animated knee joints. Entry and recovery still use a brief stylized leg-pose switch at 0.12 and 0.98 seconds, rather than a fully drawn transition through every intermediate leg configuration. The correct overall folded silhouette takes priority over unsafe limb morphing or two-body crossfades. Cartoon proportions are compact, not anatomically realistic or an exact reproduction of the original demonstration.

### Updated independent visual review
A separate reviewer re-opened both regenerated 25-frame normal/mirrored sheets after the refinements and found no severe visual blocker. Front-crossed shoes, clean neck/shoulder joins, and stable hand size were retained. The opposed knee-support angles are more readable at 0.28–0.36 and 0.44–0.52 seconds. Wrist displacement through entry/recovery is reduced. The reviewer explicitly retained the fast leg/fist-to-palm pose-cut limitation and did not treat static-frame review as original-video verification.

### Mobile interaction
At 320×568, Han and Wang could be selected, the game started, the knee move was accepted (its caption and cooldown appeared), and pause/resume worked. HUD, battlefield, ordinary controls, and all three special buttons remained on one screen. Captured the actual attack and paused states. This short mobile smoke is not a guarantee of performance on every physical phone.

### Live browser playback and foreground run
The art inspector was operated at 0.25× normal and 1× mirrored. Captured successive live screenshots through entry, the alternating support, shout, recovery, and loop; the observed pose switch remains as disclosed above. The actual foreground battle fixture completed eight rounds and 9,318 frames, with a sampled FPS range of 55.3–61.0 in this cloud browser. This is a short smoke run, not a hardware benchmark or a physical-phone FPS claim.

One pre-existing Phaser warning appeared when a new projectile sprite is initially created from `art-props` before immediately switching to the correct `signature-props` dream frame. The identical V10 source line was confirmed, and this narrow Han correction leaves it untouched. No other app-origin warning/error appeared in the retrieved log window; browser-extension metadata errors were unrelated to the game.
