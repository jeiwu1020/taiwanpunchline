# V37 centered title layout

The same seven-character arrangement is used on desktop, portrait, landscape and rotated portrait: three portraits above, one on each side of the central Start button, and two below. Each title visit still randomizes the two foreground cameos independently of the selected matchup. The title controller and the synchronous Start/audio entry contract are unchanged.

Short cabinets retain the composition. At a title-container height of 300px or less, names move beside portraits and the central row reserves 70px for the Start button and its status. This prevents the portrait cards from colliding with the Start area and keeps faces recognizable. The parody notice and audio information remain visible.

## Browser verification

Verified through the official local Site preview in cloud Chromium using `cua_repl`. Desktop production page was viewed at 1168×735. The responsive checks used same-origin sized frames with production title markup, CSS, title controller and viewport module. These isolated layout fixtures omit the Phaser loop and audio; they do not represent physical iPhone/Safari testing.

| Frame | Title client size | Scroll extent | Result |
| --- | --- | --- | --- |
| 390×844 portrait | 374×776 | 374×776 | All seven cards, names, title, Start and footer inside |
| 320×568 portrait | 304×500 | 304×500 | All content inside, no overlap |
| 844×390 landscape | 828×342 | 828×342 | Same central composition, no overlap |
| 568×320 landscape | 552×272 | 552×272 | Compact labels alongside portraits, no overlap |
| 480×320 landscape | 464×272 | 464×272 | Narrow compact fallback, no overlap |
| 390×844 rotated | 828×342 logical | 828×342 | Same composition as native landscape |

Every measured frame had no title scrolling, a successful Start-center hit test, no character-card overlap with the Start/status group, and all relevant bounding rectangles inside the title. The Start/status group was horizontally centered and within 3px of the composition's vertical center. Start retained its 44px minimum touch height in short landscape.

On the actual production page, Start hid the title and opened character selection; the toolbar Home button returned to the title with seven portraits and an enabled Start button.

## Regression and fixture checks

- Existing entry, retry, readiness, hide/show, stale async failure, and all-seven-character tests retained.
- The old side-by-side landscape CSS contract was replaced with a central-surround contract covering portrait, landscape, short landscape and desktop sizes.
- The central-surround regression failed before the implementation. The compact central-row regression also failed before its fix.
- Focused title and title-flow suite: 31 passing.
- The reusable title fixture now exposes compact landscape controls and reports scroll extent, group centering, overlap, hit-testing and content bounds.
- Temporary generated `dist/qa-v35-*.local.*` files were removed from the published output after QA. They can be regenerated with `node tests/fixtures/prepare-v35-title.mjs` for a local review and must not be published.

Final integrated `npm test`: **1,593 passed, 0 failed**. `git diff --check` and both updated fixture-module syntax checks also passed.
