# V9 presentation verification

Date: 2026-11-06. This is a presentation-only update to the existing owner-private Site, based on V8 commit `24b1c251f258d3e39bf7120f484175a3eba257d7`.

## Scope and automated checks

- Audited all seven characters and 21 specials. V8 had three active Wang heads, two Han heads and one for each newer character. The new map selects three distinct expression keys for each character's specials; several deliberately use their approved base face for one move. It is not 21 newly drawn heads or 21 new held objects.
- Added twelve generated expression heads and one six-cell accent atlas. Approved idle portraits, body pieces and hand-grip art are retained.
- Full test suite: 311 passed, zero failures. Coverage includes all 49 character pairings at two difficulties and three seeds, combat invariants, crouch controls, expression preload coverage, distinct advancing-move poses, and folder combo hand height.
- Combat core, damage, hitboxes, cooldowns, input rules and audio are unchanged, except cache-version import strings. Authorized visual motion formulas and expression selection changed.
- Final runtime textures decode successfully. New assets total 1,041,904 bytes and 18,874,368 raw RGBA bytes (18 MiB). All manifest textures total about 27.08 MiB transfer and 134.18 MiB raw RGBA, before browser/GPU overhead. This is not a measured device-memory peak.

## Visual review

- Reviewed all seven characters in a contact sheet containing idle and the three special peaks, normal and mirrored. Reviewed the final normal-direction sheet after the last accent adjustments.
- Additional 24-pose sheets sampled Huang facing right and Su facing left across basic movement, guard/crouch/hit, and multiple timestamps of each special. Normal and mirrored grip placement, head/neck contact and limb joints were visually checked. This is sampled visual review, not proof that every possible animation frame is anatomically perfect.
- Independent review found a too-narrow microphone. Fixed its source crop and aspect ratio, then reviewed the final composite: base stays near the floor and microphone head near the speaking character. Also confirmed the counter-mirrored Ko question mark, Chen speech-balloon ellipsis without duplicate wave arcs, and Ma stopwatch chain.
- Reviewer checked the runtime expressions against the approved caricature identities. Resemblance and comedic style remain subjective.

## Browser and responsiveness

- Real cloud Chrome rendering and controls, not a headless screenshot surrogate.
- 320×568 portrait: document fits both axes; selected Ma versus Huang, started combat, used running special and crouch. The new running expression appeared in live combat.
- 667×375 landscape: document fits both axes; Ko and Chen selections, labels and loaded portrait images matched. The temporary older portrait seen immediately after switching was rechecked after image completion and did not persist.
- Foreground automated combat smoke: 13 completed rounds, 10,218 frames; displayed FPS range 48.6–61, final 60.9. Final snapshot: 16 display objects, 45 textures, projectile pool 4. No application console errors; extension errors excluded. This is a short cloud-desktop smoke, not a device-independent performance guarantee or exhaustive memory-leak test.
- Physical multitouch, iOS Safari and low-memory phones were not tested. Existing touch targets and controls remain unchanged.
- Removed temporary QA pages from `dist` before packaging; reproducible fixture sources remain under `tests/qa-v9`.

## Access and rights

Deployment retains the existing owner-only audience. No new Codex task or GitHub main change. No new original voice clip is claimed or added; existing audio and its unresolved reuse-rights limitations remain unchanged.
