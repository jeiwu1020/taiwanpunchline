# Street table and supply repair

Candidate only. Baseline and published site unchanged.

## Behavior

- Ground foot motion is swept against original table X bounds and depth ±36. Vertical approach resolves before physics; horizontal approach resolves in player body/enemy separation hooks. Above-top feet can cross, land and walk off. The original one-way landing physics and combat tuning are unchanged.
- Existing overlap states are allowed to exit rather than teleported to another side. Adjacent platforms of different heights block entry to the higher surface until a jump clears it.
- Generated tabletop texture is split from the front/legs and projected to the full 46.8 world-pixel depth span; collision dimensions, platform heights and stage data remain unchanged. Table draw ordering starts at its rear edge so rear-half occupants/shadows stay above the top.
- Generated supply is lossless WebP with original PNG retained; bottom-centred at 90 world pixels in both route renderers, existing label retained. No pickup radius, lane tolerance, +18 HP or one-use state changes.

## Tests and evidence

- Recorded table baseline failures: tables-red.txt. Additional supply/order red tests: supply-red.txt and table-order-red.txt.
- Focused final: 55/55 passing in tables-green.txt. Covers both depth/side directions, diagonals, outside-lane bypass, swept displacement, height clearance, player/enemy approaches, adjacent heights, jump from ground onto table, landing, walk-off, rear-half draw ordering, visual footprint and supply healing.
- Interim npm test: 2452/2457 passing in tables-full-suite.txt. All five failures were concurrent viewport-worker red tests in combat-presentation-v75.test.mjs: full-stage canvas pause/resume, timer budget, pause blur, safe camera framing, and repeated pointer fallback. Parent owns final full suite after viewport integration. This is not a final full-suite pass.
- scripts/check-table-supply-v75.mjs generated table-supply-native-canvas.png using actual assets and production draw helpers. Visually inspected: larger/deeper top remains connected to front/legs; supply alpha/shape intact. This is native Canvas evidence, not a browser or device screenshot.
- Source generation prompt and verification copied to supply-provenance-prompt.txt and supply-verification.json.

## Independent-review knockback correction

Review found that base enemy tick skips separation while stunned, letting hit knockback enter a solid table. Recorded failing reproduction in tables-knockback-red.txt. Fixed hit-site collision from the pre-hit position, including defensive retreat, before stunned flow can skip movement checks. Physics now also ejects an already-penetrating below-top actor to the nearest original footprint edge; legitimate tabletop occupants are not moved. This replaces the earlier policy of allowing unresolved interior states to persist. Final focused suite: 58/58, tables-knockback-green.txt. Extra checks cover enemy knockback from both sides, immediate and subsequent stunned frames, 600px player forced displacement, restored stunned enemy penetration, nearest depth exit, and tabletop invariance. Parent owns final full-suite rerun.
