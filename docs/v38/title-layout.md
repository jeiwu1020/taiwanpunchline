# V38 title cluster

## Scope

Only desktop (`data-touch="false"`) and logical landscape (`data-touch="true"`, `data-layout="landscape"`) receive the new styling. Rotated portrait phones have logical landscape geometry and use the landscape composition. Unrotated phone portrait keeps the original V37 title stylesheet byte-for-byte. The complete unchanged prefix has SHA-256 `264effe357845af928aeec5d6b0b405c805e2c93b5534d3b81b085da50eef841` and is protected by a regression test.

The seven existing portraits form a compact central cluster with overlapping colored backdrops, individual head tilts, staggered gentle movement, and a comic burst. The movement is disabled by `prefers-reduced-motion: reduce`. The central Start button stays above decoration; portraits cannot intercept pointer input. No title controller, audio entry, combat, selected pair, or asset changes were made by this title refresh.

## Browser verification

Used `cua_repl` with the official Sites preview. Responsive checks used same-origin sized frames with production markup, CSS, title controller and viewport code, deterministic roster sampling, no Phaser loop, and no audio. This is Chromium layout QA, not physical iPhone/Safari testing.

All below passed: Start-center hit test, all labels and footer in bounds, no name badge intersecting Start, and no title scroll overflow.

| Frame | Title client / scroll extent | Result |
| --- | --- | --- |
| 390×844 phone portrait | 374×776 / 374×776 | Unchanged from V37 |
| 320×568 phone portrait | 304×500 / 304×500 | Unchanged from V37 |
| 844×390 phone landscape | 828×342 / 828×342 | Cluster fits |
| 568×320 phone landscape | 552×272 / 552×272 | Cluster fits |
| 480×320 phone landscape | 464×272 / 464×272 | Cluster fits |
| 390×844 rotated phone | 828×342 / 828×342 logical | Cluster fits |
| 1180×757 desktop | 1152×703 / 1152×703 | Cluster fits |
| 800×600 desktop | 772×546 / 772×546 | Cluster fits |

For both portrait sizes, compared JSON geometry and computed style records for all 14 major title nodes against the V37 title CSS loaded in the same deterministic fixture. Bounding rectangles and the 11 checked properties matched exactly: display, position, width, height, gap, transform, animation, padding, grid-template-rows, grid-template-columns and font-size. The full V37 source prefix check additionally covers every original rule. Scope tests reject any unscoped V38 selector.

Browser review caught a small top-center badge intersection in short landscape and top-row badge intersections on desktop; both were corrected and the affected sizes rechecked. Screenshots were visually inspected for recognizable faces and clear Start/footer content.

On the actual production entry page, clicking Start hid the title and opened selection. Clicking Home returned to seven portraits and an enabled Start. Audio readiness and synchronous entry are covered by the existing title/entry regression suites; no independent audio listening claim is made.

## Regression checks

- First new-contract run: one pass, two expected failures before CSS implementation.
- Focused title/flow suite: 34 passing.
- Final integrated `npm test`: 1,603 passing, zero failing. See `title-final-full-suite.log`.
- `git diff --check` and fixture JavaScript syntax checks passed.

## Reproduce local layout QA

Run `node tests/qa-v38-title/prepare.mjs`, then open `qa-v38-title.local.html` under the official preview. The fixture includes size controls, V37/current CSS comparison, rotation, measurement, and a Start-click indicator. The V37 CSS is read from commit `7d48b033` during preparation.

The generated `dist/qa-v35-*.local.*` and `dist/qa-v38-title*.local.*` files were moved out of the checkout after QA. They must not be published. No production deployment was performed by the title worker.
