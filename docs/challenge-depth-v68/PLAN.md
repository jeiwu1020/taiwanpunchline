# Four-way challenge integration

Goal: replace challenge street locomotion with the approved four-way trial while retaining ordinary duel bosses, VS and existing profile progress.

## Owned boundaries
- Engine worker: reusable ChallengeDepthRoute, trial subclass, depth collision/combat, gait.
- Input/UI worker: pointer lifecycle diagnosis, long-press protection, trial cooldown/charge UI, original explicit route jump control.
- Art worker: guard neck connection and thematic mob name.
- Render worker: integrated depth scene, camera and world anchors, readable names.
- Parent coordinator: game mode/factory/input wiring, event projection, regression and preview, backup/publication.

## Requirements
- No new VS jump control; up remains jump in VS and becomes depth movement only on route.
- Dedicated jump/Space on route. UI reflects current mode and returns when entering boss.
- Save schema and progression/reward logic unchanged. Isolated trial does not write saves.
- Release/cancel/blur/rotation/pause clears holds; no arbitrary timeout masking input bug.
- Grounded bodies block same lane, jump or walk around at other depth; hit depth matches view.
- Backdrop ground and actors share world anchoring, idle enemies do not glide while walking gait is absent.
- Preserve published #44 and verified full backup. Never create new Codex task. Ask parent before fresh publish credential.

## Verification
- Unit regressions first for each subsystem; full npm test on final combined tree.
- Source review of route→boss→route, retry, profile progression, VS and practice isolation.
- Managed browser checks portrait, landscape and CSS sideways, input release/interruption, cooldown/charge text, route gate and boss.
- No claim of physical iPhone testing. Archive all source, verify hashes, persist before private publication.
