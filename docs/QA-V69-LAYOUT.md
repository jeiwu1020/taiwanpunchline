# V69 layout changes, pending publication

Baseline: published #45, source commit 4d5e9835a1eadabc2524784e2ffb99b11a67ac61. The original tree and published Site have not been modified by this work.

## Implemented fixes

- The four-way street camera now uses the logical application orientation, not the remaining canvas aspect ratio. At a 390×600 portrait viewport the 374×266 canvas previously triggered the distant landscape camera; it now stays portrait.
- Removed the one-pixel background edge stretched into tall vertical stripes. Sky above the source art uses an atmospheric colour extension without repeating the sun/clouds.
- Clipped the guard head's stray ear-under-neck stump while retaining the central textured throat and collar overlap. Walk, idle, attack, hit and mirrored poses checked using the existing artwork.
- Challenge character pickers are positioned overlays, do not add layout height, flip above/below for space, preserve scroll/focus, and account for the transformed scrolling dialog. A real 112px popup displacement was reproduced and corrected.
- Chapter, character and save pages use a common panel shell. Landscape save actions have two bounded columns; native file input no longer forces overflow. Switching page tabs returns to top.

## Deliberately not changed

Button colours, shapes, utility-key arrangement and meter appearance are awaiting the user's design selection. No new production control stylesheet was added. Save schema, progress/XP/skills, combat rules and VS input remain unchanged.

## Visual options

`control-design-v69/comparison.html` is a non-game comparison document, loading the existing art without game state or saved data. A, B and C include portrait/landscape mocks and query filters. The three portrait and three landscape views were rendered in the cloud browser and saved as review images. These are proposals, not implemented controls.

## Verification

Cloud-browser checks (not a physical iPhone/Safari):
- 390×600 shortened portrait: characters readable, no stretched-colour columns.
- 390×844 portrait: scene remains portrait after resizing.
- 844×390 landscape: backup page cards, title and navigation aligned.
- CSS 90° orientation: chapter popup and backup page aligned; selection menu appears next to its trigger.
- Character picker after 112px dialog scroll: menu bottom 405px, trigger top 410.5px, rather than erroneous bottom 293px.
- Character panel portrait remains fully contained; other content scrolls within the panel.

Focused regression tests include camera orientation, background fill, guard mask, picker geometry, transformed/scrolling dialogue integration, and panel markup. Run `npm test` for the complete suite. The development-only QA wrapper is under `docs/qa/`; it is not in `dist`.

## Rollback and publication

Before deploying, retain a complete source archive and receipt. No GitHub or Site publication has occurred for V69. New short-lived publishing credentials require the user's current approval. Existing #45 and earlier Site versions remain available. Returning to #45 does not require changing the save format.
