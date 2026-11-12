# V10 verification record

## Scope
Owner-private political fighting prototype, same 7-character roster and three special keys. Core attacks, shared movement, crouch, guards, jumps and mobile controls remain. Crouching does not shrink the hurtbox or give dodge immunity. Knee walking is not invulnerable. Ko's brace blocks one impact, still costs 2 HP, prevents that impact's knockback, and does not stop subsequent body-collision pushing.

## Automated verification
- `node --test tests/*.test.mjs`: 428/428 passing after final integration.
- Engine worker: 353 focused tests, including 294 simulated matches (49 pairings × 2 difficulties × 3 seeds) and 20 baseline traces for unchanged Wang/Han moves.
- Independent engine review: reconstructed all 20 V9 baseline fixtures; 192 timing executions and 16 counter pairings. After fixing dream lifetime end-frame overtravel: 26 endpoint/legacy tests and 80 additional mirrored range/lifetime cases passed.
- Voice slot tests reject missing or unverified source clips.
- New motion tests cover bounded finite coordinates, distinct gesture metadata, paper-plane release, two open palms, and grounded brace. These tests do not establish anatomical correctness.

## Visual verification
Actual browser screenshots are saved under `docs/qa-v10/`, not shipped as game routes. Reviewed all 21 special poses plus idle in both orientations, Ma's action timeline, and 22 Han knee entry/exit keys. Independent review confirmed corrected mouth coverage and grounded props, and did not find obvious reversed palms, detached wrists or necks in the inspected sheets. Han key cuts remain visible; no claim of continuous natural animation or exhaustive per-frame anatomical correctness is made. See ASSET-NOTES-v10.md for sleeve/cuff and finite-frame limitations.

## Audio and access
New original recordings have not been integrated. Ma lecture cough is blocked at acquisition/hearing, not substituted with an imitation. Source captions and audio status are visible in help and moves.html. All reuse rights are unconfirmed. Only the previously active short Han original excerpt remains.

Browser gameplay/mobile/performance and exact private publication results are appended after their observed outcomes.

## Browser outcomes
- Foreground automated real-rendering soak completed 7 rounds / 8,736 frames, with the seven-character rotation. Observed 50.8–61.0 FPS; last reading 60.1. Last scene counts: 17 display objects, 52 textures, projectile pool 4. Counts fluctuated with transient text rather than a monotonic increase. This is cloud Chrome, not a physical-phone benchmark. After this soak only Chen's release pose, shorter banner copy, and narrow-phone label wrapping changed; no engine or asset-loading changes.
- 320×568 portrait: selected Huang against Chen, used the third special (visible cooldown), clicked crouch, paused, and opened help. Narrow long move titles were initially clipped, then fixed to wrap; all controls remained visible on one screen. Help measured 261px client/scroll width with vertical scrolling. No document horizontal overflow.
- 667×375 landscape: selected Ma against Su, started a match, used cough (visible hit and cooldown), paused successfully; all movement and special controls visible.
- Art inspector: switched to Chen / 有夢最美, selected 0.25× speed, mirrored and paused successfully. Independent review of the new release sheet found no obvious reversed hand, detached wrist or broken elbow; hand release and plane size still have a visible cartoon key switch.
- Browser logs inspected showed extension-metadata errors only, not game script exceptions.
- Final automated suite after all presentation/CSS changes: 428/428 passing. `git diff --check` clean.

## Remaining limits
No physical iOS/Android device or multi-finger hardware test. Source recordings other than the existing Han short clip were not heard or integrated. Sprite mirroring is whole-character mirroring, not a separately drawn reverse-angle anatomy set. Limited keyframe knee and paper-plane transitions are disclosed. Original V9 mechanics retained only where selected; new moves have explicitly new balance values documented in moves.html.
