# Four-direction street trial (isolated v66)

## Scope and safety

The unchanged base is private Site version #42, source commit
`3f7ffe16edd33209474b59b20646f428c8a4c08a` (challenge v65).
This disposable spike adds a separate `dist/street-trial.html` entry only.
No baseline file, original homepage, Boss/duel engine, challenge profile,
character growth, or existing save key is modified. It does not import the
profile store and does not write localStorage, sessionStorage, or IndexedDB.
The original `index.html` remains the default entry.

A complete verified #42 source archive already exists independently:
`brawl-v65-challenge-tested-source.tar`, 163,880,960 bytes,
SHA-256 `3d7ee018d6028f04bec82e555c80ef35063932e6138f94f410089ec9a3873b0a`.
All 1,018 archived files matched the clean baseline before work began.
No GitHub or public production deployment is included in this spike.

## Play

Open `street-trial.html` under the same static host as the original game.
Choose 恰吉王 or 韓國魚. This is a 2,300-unit short street with four opponents
and one healing pickup, with a clear endpoint rather than a new chapter.

- WASD / arrows: walk left/right and inward/outward on the street.
- Space / blue 跳 button: jump separately.
- J: normal attack (hold to repeat). K / Shift: guard.
- U, I, O: the selected character's existing three moves.
- H: assist, using existing attack selection and damage recharge rules.
- L: crowd rally, occupying its launch lane.
- Touch: round four-way pad, independent jump, attack, guard, assist, rally,
  and three specials. Portrait keeps controls below the view; landscape and
  sideways overlay them. Input release/resize/focus loss clears held inputs.
- Escape / 暫停: pause. Switching away pauses the trial.
- 原版: return to the unchanged original game.

The trial keeps original jump physics and the character's rendered size.
On short displays, the camera pans vertically only enough to keep a jumping
head visible and returns on landing. It does not leave a distant zoom behind.

## Mechanics

Depth and jump height are separate values. Bodies block within the same lane;
players may walk around them or clear them in the air. Enemy clusters are
resolved as one solid interval so landing between two cannot embed a body.
Draw order follows ground depth, not the sprite's jump height.

Melee needs forward reach and matching depth. Projectiles retain their launch
lane. Assist actors keep their launch depth even if the player moves. Crowd
rally hits a bounded ground lane, not unrelated depth or high airborne targets.
A short recovery window prevents stacked enemy hits from removing control.

## Verification performed

- Focused mechanics tests: 15 passing, including separate jump/depth, diagonal
  speed, solid bodies, jump/side bypass, forward-only melee, fixed projectile
  depth, aligned hits, crowd depth/air avoidance, helper depth, supply depth,
  enemy alignment, recovery, draw order, isolated state, multi-enemy landing.
- Whole existing regression suite plus spike tests: 2,222 passing.
- Manual browser: desktop 1180x757; framed CSS viewports 390x844, 844x390,
  360x640; CSS sideways enabled/disabled; portrait direction-pad and jump,
  sideways coordinate hit testing, pause/restart/reselect.
- 韓國魚 short route cleared via actual keyboard input: four defeats, endpoint
  result, replay available. 恰吉王 movement/jump also checked.
- Manual review found and fixed group-body overlap and a left-facing rally
  highlight error. Independent reviewer confirmed both fixes and re-ran the
  focused suite.
- No application errors appeared in the browser log excerpt reviewed.

These viewport checks are Chromium layout/input checks, not physical iPhone
Safari or real multi-touch/pinch certification. Original sound files and voice
channels are reused; device-specific audio mixing still needs user playtesting.
The included viewport harness is a development document, not a game menu.

## Rollback

The safest rollback is simply to stop using the separate trial URL: the normal
index, original game, and saves have remained intact throughout. If a future
private Site version includes this trial and must be reverted, restore Site
#42 or its verified full source archive. Do not reset/delete user saves.

## Not implemented

No full conversion of the original street chapters, new bosses, new art pack,
new storage schema, online leaderboard, authentication, or production release.
The belt-scroller reuses the existing side-facing bone animation and generated
street art. This is for deciding whether the new movement and extra jump button
are more enjoyable before committing to a larger conversion.
