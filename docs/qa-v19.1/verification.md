# V19.1 idle-player motion regression

## Confirmed cause
V19's camera followed the actor midpoint each frame while the generated background followed camera.x. With zero input and no hit, player world x remained260 and move remained0, but the player moved roughly110 screen pixels toward an approaching AI within0.8seconds. The stage did not scroll with it, creating apparent autonomous forward motion.

## Fix
Keep a persistent safe camera view per Duel and viewport. It no longer recenters or zooms in when only the enemy approaches. Pan/zoom out only when actors require visibility, and reset for a new Duel or viewport resize. Anchor the ground line and generated background in world coordinates. Background dimensions are fixed for the viewport, including the widest legal view and jump, rather than changing when either actor jumps. This crops more of the image's center than V19, but avoids moving stage landmarks beneath an idle player.

No core movement, item seeking, attack timings, hit pushback, audio, character assets or AI logic were changed. Real attacks, body separation and knockback still displace actors normally.

## Evidence
- Before the fix, new regression tests failed for idle screen movement and camera-locked background. A second red regression caught background scale changes during jumps.
- Final full suite:1023passed,0failed. Focused camera/background suite:11passed.
- Independent diagnostics:66 isolated core cases,98 roster/difficulty opening combinations,14 AI item-seeking cases,11 keyboard/pointer release/lifecycle cases. No player auto-pick pathfinding or AI input leakage found. Event simulations are not physical-touch-device testing.
- Independent camera review:60,000continuous random frames,245roster opening views,56viewport sizes and12,600boundary/jump combinations. Actors and background remained visible, new Duel/resize reset worked, fixed-world landmark displacement and ground-screen displacement were bothzero.
- Browser QA through official preview:desktop and320×568phone viewport. Actual no-input opening trace held player world x260 and screen x320.60desktop /66.66phone while AI approached. After body contact or a hit, world displacement occurred in the expected backward direction. The phone controls and characters remained visible.
- Temporary diagnostics were removed from dist. Shared preview was stopped and our remaining test tabs closed. Some shared-browser automation timeouts and a disappearing test tab were encountered; our own test page was reopened to finish validation.

The fix addresses the reproduced rendering bug. It does not promise a player can never move without directional input: normal knockback, collision separation and explicitly triggered movement attacks remain part of gameplay.
