# Center MiniBoss face-off dialogs

The supplied landscape screenshot showed the short face-off card fixed eight logical pixels below the viewport top, leaving most of the empty space beneath it. This was the shared challenge-dialog top-anchor policy, not an illustration alignment problem.

The shared viewport binding now supports an explicit center anchor. Only non-cinematic challenge story dialogs opt into it. The anchor is the committed visible game shell midpoint, including desktop offsets and CSS sideways rotation. Native dialog transforms use their own center rather than their top edge. Existing challenge/research pages and the four-shot opening retain their previous top-anchor behavior.

New rules in `combat-presentation-v75.css` bound face-off artwork within the available logical height. Portrait cards shrink the art row first. Copy uses a flex column and the next-button row does not shrink. Short landscape cards retain the existing 330px panel cap. No animation, illustration, progression, save, tint or combat behavior changed.

## Verification

New tests fail before the repair and pass afterward. Coverage includes native portrait/landscape, desktop offsets, both sideways rotations, content-height changes, switching between opening and boss cards, loaded CSS cascade, action-row retention and projected viewport bounds. Existing logical-top alignment, replay/skip/save and MiniBoss tint regressions also pass. Logs are adjacent.

The isolated local `faceoff-fixture.html` loads the actual production modules, dialogue content, images and stylesheet order, but never imports game.mjs or progress/save APIs. Serve from the candidate root under this docs directory or temporarily copy it to a local dist directory. Do not publish the fixture as a game feature.

Query examples:
- `?layout=portrait&w=390&h=844&boss=0`
- `?layout=portrait&w=390&h=568&boss=1`
- `?layout=landscape&w=844&h=390&boss=0`
- `?layout=sideways&w=844&h=390&boss=1`
- `?layout=sideways-left&w=844&h=390&boss=0`
- `?layout=desktop&w=1416&h=708&boss=1`

Use an outer browser viewport large enough for the selected physical shell. `window.__faceoffQA.metrics()` reports actual DOM center deltas, shell/dialog rectangles, next-button visibility and whether the dialog fits. Browser validation belongs to the integrating parent; the Node geometry/CSS tests are not browser screenshots.

Changed production files: `challenge-dialog-viewport.mjs`, `challenge-story.mjs`, and `combat-presentation-v75.css`. The integrating parent must refresh affected cache import URLs, including both story and challenge-ui imports of the shared viewport binding. Pre-change files are preserved under `checkpoint/`.
