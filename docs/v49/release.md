# V49 crowd charge, sound wave and stage fixes

Rollback: backup-before-rally-v49, a2776c7422cb67b79a95ddb437c7bfe16543dac3 (private Site #26). Full source archive retained outside checkout.

User-approved rule changes: rally locks a visible 180px-wide lane at cast start, warns for 1.05s, applies one 22-damage sound-wave hit (2 chip / one guard pip if blocked), expires at 2s. Both sides use identical rules. A standing desk target is eligible; jumping 65px above its supporting floor or leaving the target lane evades. Existing AI guard reaction stays unchanged. No per-supporter stacked damage. Animated batch converges on the same locked target lane; explicit hit/block/miss feedback. Supporters enlarged from 30–52 to 48–76 screen pixels; stationary charge supporters keep camera/zoom-independent coordinates, align above the actual move-button edge, and render behind fighters.

Carry scale fixed at .68, including retreat/guard. Stored hand survives into throw wind-up; image disappears at release, with projectile origin provided by the hand-pose renderer. Fallback origin exists for non-render simulation. Duck falls from the hand and only becomes a ground hazard after reaching y=395, never teleports down from the desk. Paper keeps its existing high-projectile/crouch interaction. Damage, projectile speed and life unchanged.

Desk drop: pure down held 80ms while standing on desk starts a one-way drop. Back+down or held guard blocks the drop for that gesture until down is released, protecting touch diagonals. Ground down is still crouch. Both actors share the same rule; no new key mapping.

Audio: user auditioned and approved SFXMint Crowd Cheer 44. CC0 source and licensing recorded in assets/sfx/LICENSE-CROWD.md and About. Original 4.049s MP3 retained; playback uses 0.1–1.6s at conservative .13 gain through SFX volume/mute, scheduled .45s after cue, faded and stopped on pause/result/blur. No new voice clips or subtitle timing changes.

Verification: full suite 1822 passed before final visual polish; final suite recorded at publication. Added direct tests for desk hits/jumps/blocks, lane evasion, symmetric one-hit damage, no self-charge, fixed item scale, both hand-origin projectiles, duck falling, pure-down and diagonal touch behavior, sound licensing/routing. Archived historical trace baselines retained; new V49 baseline records the explicitly changed rally and projectile rules for all 49 character matchups. Historical source text remains byte-identical.

Browser checks: production game launch and enlarged supporters in phone landscape; rendering fixture with production core/art confirms simultaneous desk hits (78/78), jump evade (100), block (98). Prior viewport layout tests remain applicable; no control-layout CSS changes. No physical-device testing claimed. User, not assistant, supplied the subjective audio audition.
