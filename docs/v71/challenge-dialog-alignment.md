# V71 challenge dialog alignment

## Cause and change

The viewport binding centered the modal using its current rendered height. Chapter, research, and backup pages have different heights, so switching between them moved their top edges. It now anchors the logical top-center eight pixels inside the committed game viewport. The top-center is rotated with the game, with a top-center transform origin, so ordinary portrait, landscape, and CSS-sideways layouts share the same gutter.

The close button used to belong to the header. Compact landscape places that header in the left grid column, which left X near the middle of the panel. X now has a zero-height sticky overlay sibling of the paper, positioned at its top-right corner with a 44px target. Header text and compact tabs reserve a corner gutter. Compact columns allocate more room to the tabs so this gutter does not squeeze their labels.

The dialog remains the scroll surface and the fixed containing block of the V69 picker overlay. Picker coordinates, custom selection, rotated pointer/wheel scrolling, and save data behavior are unchanged. Story dialogs share the new viewport anchor; their controls and content are unchanged.

## Verification

- RED: three new geometry/CSS regressions failed against the original centered viewport and header-close layout.
- RED: the panel interaction regression failed because the independent close layer did not exist.
- GREEN: 26/26 focused tests passed, including V69 picker placement, scrolling, keyboard/focus behavior, all-page close behavior, and unchanged save documents.
- Updated three obsolete expectations in existing tests: the top-center coordinate, the transform, and compact header column allocation.
- `git diff --check` passed.
- Full `npm test` was run while other V71 work was in progress: 2,340 passed, 7 failed. Six were the then-unimplemented cases in `combat-control-placement-v71.test.mjs`. `tap-zoom-v33.test.mjs` failed because `index.html` referenced `combat-controls-v71.css` before that concurrent file existed. No challenge test failed. This is not a final combined-suite pass.

## Browser QA still required

Check repeated chapter → research → backup → chapter switches at desktop, portrait 390×844, landscape 844×390 and 568×320, and CSS-sideways 390×844. The logical top edge must stay fixed. Scroll research to its bottom and verify X remains visible and dismisses correctly. Open both pickers near the viewport bottom and verify the floating lists still flip, scroll, and select without moving the panel. Verify story bounds after rotation. These visual checks were not run by this worker.

Release integration must refresh the nested `challenge-dialog-viewport.mjs` cache key in both `challenge-ui.mjs` and `challenge-story.mjs`.
