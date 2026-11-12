# V73 integration verification

## Scope

Combines the V72 native-select replacement, approved desktop and landscape/sideways combat layout, four-shot opening comic, and retained street backdrop. The user-confirmed portrait D layout is now included:110×52 single-line special cards,52×52 utilities, the first special below the second, and a retained measurable wrapper. No game rules, roster, audio cuts, save key or progression format changed. The entry and edited module/CSS URLs are cache-busted.

## Verified

- Earlier integrated `npm test`: 2,410 passed, zero failed, skipped or cancelled. A final post-portrait run is recorded below.
- `node --check dist/game.mjs` and `git diff --check` clean.
- Chrome browser through the permitted CUA interface, actual game in a temporary iframe fixture:
  - Desktop 1200×750: four square directions, utilities in middle, specials filling right. Buttons measure64×64, specials64 high. Special keyboard activation exposes4-second cooldown.
  - Desktop960×640: compact2×2 directions, utilities and specials align. No visible control hit-box intersections.
  - Native landscape844×390 and568×320: specials above five same-size utilities, no printed keyboard hints. Touch joystick and buttons have no overlapping rectangles at568px.
  - CSS-sideways390×740: native training selection replaced by correctly rotated custom popup; selecting defense updates the practice state. Combat controls rotate and align.
  - Opening portrait390×740: all four compositions inspected, including reclining and seated poses, clothing change and chase. Footer replay/skip labels remain single-line. Replay returns to1/4; skip starts street gameplay.
  - Landscape844×390: waking composition and copy are contained, and skip starts street gameplay. Final selector fix covered by actual cascade test.
  - Street up/down held keys and jump accepted; ordinary play works after story. This observation is not an FPS measurement.
- Last origin-filtered browser warning/error query returned none. Browser-extension metadata errors were unrelated and excluded.
- Original `brawl-v71-refine`/#47 and `brawl-v72-selects` trees remain clean.

## Limits

These are Linux Chrome viewport simulations, not physical iPhone/Safari tests. No promise of identical real-device latency or Safari toolbar behavior. Native cache benchmarks isolate backdrop work, not full-game FPS; fixed-coverage raster adds memory and first-frame cost as documented in docs/v73/street-vertical-cache.md. Small landscape screens necessarily have less unobscured fight area. The earlier A/B/C portrait alternatives remain previews only. Approved portrait D is the only integrated portrait redesign.

## Rollback and publication

Published #47 remains unchanged. Before any publication, save this full source archive and byte-verify each archived file, retain the original #47 archive and deployment identifiers, and obtain the current write-credential approval if needed. Do not publish the QA fixture, logs, or portrait mockups as game assets. No publication was performed during this verification.

## Portrait D and auto-fitting verification

- Actual browser UI selected all7 fighters and entered training for all21 special names. Every name remained single-line inside110×52 cards, without truncation or overflowing the measured text area.
- Longest name「可以這樣插隊喔」measures14.4px in upright390px mode,12.1px in landscape and CSS-sideways,20px at desktop1200. This is real browser font measurement, not string-length estimation. The module measures available local clientWidth so rotation does not swap dimensions. It reruns on actual text/layout/font events, not cooldown updates or every frame.
- Portrait320,360,390,430 widths and landscape568×320/844×390 show all9 control hit boxes separated. At320px the joystick is56px to retain the approved fixed button sizes;360px uses96px and375+ uses100px. Small-device ergonomics still require real-phone review.
- A hard12px text floor emits an explicit unfit diagnostic rather than silently shrinking further; all current21 names pass. No names were renamed, cut or wrapped.
- Native Canvas/Noto CJK independently checked all21 names over four width profiles. Browser evidence JSON lives beside this report; native audit is docs/v73/special-name-canvas-audit.json.
- VM game harnesses use browser-layout mounting as a stub boundary only because their fake canvas has no getContext. The dedicated name-fit tests execute the real module and verify resize/text/font events and cleanup. Real browser behavior was checked separately.

Final verification on the combined source including entry wiring: `npm test` passed2,419/2,419 with zero failures, skips or cancellations (25,397.7ms); retained log full-suite-final.log. `node --check` on game.mjs and special-name-fit.mjs and `git diff --check` pass. Real browser longest-name action triggered a6.2-second visible cooldown in its unchanged54px desktop compact card. Origin-filtered browser warnings/errors: none. The temporary iframe fixture is kept in docs only and is excluded from the deployed dist directory.
