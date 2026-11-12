# V18 neck/collar assembly candidate

Status: implementation and offline tests complete. Browser anatomy review is still required before publication.

## Diagnosis and change

- All seven standard bodies were drawn before their complete head cutouts. The cutouts include a neck and its black bottom border, which overprinted the collar. A shared head origin also left some neck bases slightly above the front lip of differently shaped shirt openings.
- `art-collar.mjs` clips a second draw of the **same original costume pixels**, at exactly the same registration, to the front edge of each shirt opening. This gives the intended rear collar → neck/head → front collar assembly.
- Standard head origins are seated 3.4–4.8 game pixels lower depending on the existing costume, with no change to portrait size, head angle, jaw shape, or source image. Wang's glasses and spit origin follow that same head offset. His cup hand has not been changed and must be checked visually against the seated head.
- The roll, archery and lotus full-body cutouts have their own measured front-collar clips. Their original head origins remain unchanged. The lotus collar follows torso rocking, while the head keeps its existing counterrotation.
- No new skin bridge, paint fill, replacement collar, new raster file, or taller collar was added. All 48 PNG/WebP files compare byte-for-byte unchanged against the working baseline. Motion, hands, arms, combat and voice files are unchanged.

## Files to integrate

Production:
- `dist/art-collar.mjs` (new)
- `dist/art-render.mjs`
- `dist/art-roster.mjs`
- `dist/art-signature.mjs`

Tests / QA:
- `tests/neck-collar-v18.test.mjs` (new, 13 checks)
- `tests/han-lotus-v11.test.mjs` (the canvas recorder supports clipping and expects the additional collar-only draw)
- `tests/combat-art-v13.test.mjs` (the canvas recorder supports clipping)
- `tests/qa-v18-neck.html` (new visual review page)

`docs/qa-v18-neck/renderer.diff` shows existing-module changes. The new helper is the additional file. The `.before.txt` snapshots and red/green test logs are review evidence only.

## Preview mounting

The official preview serves `dist/`, so temporarily copy `tests/qa-v18-neck.html` to `dist/qa-v18-neck.html`. The page uses `./core.mjs`, `./art-render.mjs`, `./art-signature.mjs` and `./assets/` when served from that route. It automatically uses `../dist/` instead if served from the project-root `/tests/` route.

Open:
- `/qa-v18-neck.html?type=wang&mode=basic`
- `/qa-v18-neck.html?type=wang&mode=special`

Type values: `wang`, `han`, `ma`, `su`, `huang`, `chen`, `ko`. Every tile shows a full-body view and a 2× neck close-up. The zoom follows the torso, including crouch, roll and lotus positions.

Basic mode: idle, crouch, jump, both hit-tilt extremes, walking, guard and kick, all mirrored. Special mode: all 21 special moves, four checkpoints each, both directions. Han's lotus uses explicit entry / rocking / shout / exit checkpoints.

Anatomy review still needed:
1. No visible black neck cut edge lying over the shirt; no detached floating head or bright gap around either side.
2. The original jaw outline is fully readable. The front collar should meet the bottom of the neck, never the face.
3. Tilt/reaction frames should keep the front lip torso-fixed, not rotating with the head.
4. Han's archery release and lotus rocking must use the matching integrated body's collar. Wang's spinning roll must retain attachment throughout rotation.
5. Wang's drinking cup still meets his mouth, the accepted hand/cup occlusion is unchanged, glasses follow his eyes, and spit starts at the mouth.
6. Compare Su and Chen's approved default faces and all other assets with the previous version, not just the numeric tests.

## Cache graph

- `game.mjs` → `art-render.mjs`
- `art.html` → `art-view.mjs` → `art-render.mjs`
- `art-render.mjs` → `art-roster.mjs`, `art-signature.mjs`, **`art-collar.mjs`**
- `art-roster.mjs` → `art-signature.mjs`, **`art-collar.mjs`**
- `art-signature.mjs` → **`art-collar.mjs`**

This candidate intentionally leaves all existing query suffixes at `v=13`. Integrator should update all incoming edges to changed modules, including game and art-view entries, consistently. `art.html`/`art-view.mjs` do not otherwise require content changes; refresh their version/query when updating the art viewer. The QA page imports unversioned local entries, so use a fresh preview URL or update its imports to the integrated version when checking a previously opened page.

## Offline verification

- Source raster images inspected with `view_image`, including seven approved default faces, used action expressions, costume atlases, archery, lotus and roll.
- Before implementation: all 13 new regression tests failed for the missing front-collar assembly.
- `node --test tests/neck-collar-v18.test.mjs`: 13/13 pass.
- `npm test`: 699/699 pass, no failures.
- `node --check` on all four production modules: pass.
- No browser/headless preview, deployment, commit or push performed by this worker.
