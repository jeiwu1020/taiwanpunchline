# V33 — 拳民開講 mobile landscape trial

## Scope and provenance

The user requested a fix for repeated-tap zoom near the direction control and an experimental control overlay only on an actually landscape phone. Cooldowns must not change. They subsequently confirmed seeing desktop guard, so its behavior and appearance remain unchanged. The later approved game name is 拳民開講, with no year.

Baseline: published V32 source `0ff9d48fa06e8dd612688babf355774a4a55a55d`, same owner-private Site. Full pre-edit source backup: `parliament-v32-before-overlay-0ff9d48.tar.gz`, SHA-256 `099b8da2e8410d6a32949fe34985a50633f66cca747ea66011672cdbac611191`. The original V22 Site is a separate project and is not edited.

## Changes

- Game-only body gutters, the fitted shell and canvas use `touch-action: manipulation`. The joystick and its surrounding direction pad explicitly retain exclusive game gesture handling. Phaser's unused canvas touch capture is disabled, avoiding preventDefault cancellation of native canvas pinch gestures. Settings scrolling, sliders, text selection and the uncapped viewport remain intact. No global touchend cancellation is introduced.
- The joystick itself already had `touch-action: none`. Missing protection was identified around the fitted shell/safe-area gutters. This is a source-level diagnosis, not a proven reproduction of the user's Safari behavior. The physical joystick, circle edge, surrounding label and safe-area edge still need real-device repeated-tap checks.
- A first-paint and mounted flag distinguishes native touch landscape from rotated portrait. Only native landscape gains a translucent overlay: 84px joystick, three 60px-high move cards and separate 54px attack/guard controls. Empty wrapper areas pass pointer hits through. Narrow layouts show the complete move name and live cooldown; full purpose text remains in settings and returns on wider layouts.
- A presentation-only camera adapter keeps conservative fighter bounds clear of the stick/cards and extends a viewport-fixed backdrop. It reclaims the old 98px dock, reserving 66px for the lower overlay. Existing camera functions, combat coordinates, collision, stage boundaries, timing and animations remain byte-identical.
- Current page titles, header, settings title, Open Graph title, art/detail return links, Site display title and detail-page generator use 拳民開講. Stable IDs, URLs and prior source/history details remain unchanged. Entry module uses `?v=213`, changed dependencies use V33 cache keys.

## Passed checks

- Final Node suite: 1,411 tests, zero failures. Red/green additions cover gesture CSS, Phaser capture configuration, native-landscape detection at bootstrap/mount, overlay geometry and branding/cache keys.
- Deterministic 588-match soak passed. This is engine simulation, not browser playtesting.
- Input regression covers two simultaneous pointer IDs, diagonal direction, independent release/cancel and 0/90-degree coordinates. These are synthetic unit tests, not physical multitouch.
- Overlay review: 8,000 seeded framing probes; independent reviewer additionally checked 23,520 camera-boundary frames and 35,640 background-coverage frames. No clipping/coverage failures in those numerical cases.
- All 101 tracked asset files match V32 byte-for-byte, including all voice clips and both music files. Audio controllers/manifests/routes, cooldown rendering/data, combat core, touch binder, original camera/art files and desktop-control CSS are unchanged. Hashes in `preserved-assets.json`.
- All production JS/MJS syntax checks and `git diff --check` passed. Moves page regenerated from its source generator; branding tests passed afterward.
- Independent source review found one issue, the stale entry-module cache key. It was corrected from `v=212` to `v=213` and covered by a regression test.

## Browser observations, carefully limited

Official Sites preview was used. The live game opened and a rotated-portrait menu screenshot was obtained, but subsequent interaction hit CDP `Runtime.evaluate` / `DOMSnapshot` timeouts. The supported native alternative also reported AT-SPI unavailable. No prohibited browser workaround was used.

A local-only, frozen-pose fixture then reused production CSS, character art, camera helpers, viewport mount and DOM touch binder without Phaser's continuous loop:

- 844×390 native-landscape near-pose screenshot: both fighters, HUD and all controls visible. DOM centers hit the correct six targets, with no target scroll overflow. Joystick 84×84, guard/attack 54×54, move cards about 193×60. Clicking attack produced the fixture's `punch` event with viewport ready.
- 568×320 native-landscape separated-pose screenshot: both fighters, HUD and all controls visible. All six DOM target centers hit correctly with no target scroll overflow; move cards about 101×60. Complete short names and cooldowns visible. The early click occurred while settling was incomplete, so it is not counted as a successful action dispatch.
- The wrapper was visually scaled to fit the cloud browser; the inner iframe retained the exact CSS dimensions above. This is static fixture QA, not gameplay or device emulation.
- Navigating to the third 480×320 long-name case timed out and reset the CUA kernel. Narrow long-name rendering, current final branding layout, upright/rotated-portrait/desktop visual regression, actual live gameplay, physical direction changes, Safari double taps, pinch and simultaneous real touch remain unverified in this release.

No real iPhone was available. Do not describe double-tap zoom as proven fixed on Safari. Ask the user to try repeated taps on the joystick center/edge and adjacent margin, drag diagonally while attacking, rotate landscape→portrait→landscape, and pinch on non-control canvas/settings areas.

All three temporary `dist/qa-v33-*.local*` pages were removed. Reproducible fixture source remains under `tests/fixtures` only and is not included in hosted assets. Official preview was stopped and released.
