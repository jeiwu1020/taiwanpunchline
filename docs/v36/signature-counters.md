# V36 signature moves and counterplay audit

## Result

The existing seven kits already provide a different strong interaction per character. No damage, timing, hitbox, cooldown, protection window, AI rule, or move count was changed. The implementation added 36 executable regression cases in `tests/signature-counters-v36.test.mjs` rather than adding another layer of invulnerability or an unmeasured damage buff.

| Character | Representative strong move | Measured benefit | Practical answer |
| --- | --- | --- | --- |
| 恰吉王 | 從從容容 | A correctly timed close-contact counter prevents the jab and returns 12. | Noncontact shout deals full 14; grab deals full 12. The stance does not counter either. |
| 韓國魚 | 可憐哪 | Folded knee avoids a high coin; the committed shout still releases when struck. | Low bags deal their full 6 + 8. Guard reduces the 14-point shout to 2 chip. This is neither damage immunity nor a safe trade. |
| 小馬哥 | 死亡之握 | Grounded handshake deals 12 through ordinary guard. | A legal jump during startup avoids it. At a 165px starting gap it whiffs; walking in and jabbing during recovery deals 6. |
| 電火球 | 在那叫什麼 | Shout takes two guard pips instead of one and deals 14 unblocked. | Jump avoids it. From nearby, guard takes only 2 chip and can be released in time to jab the shout's recovery for 6. |
| 咆哮哥 | 我有欠你喔 | Coin is physically reflected, rather than doing instant remote damage. | Original shooter can guard the reflected coin for 2 chip. Grab and noncontact shout bypass the stance for full damage. |
| 阿扁仔 | 有這麼嚴重嗎 | One ordinary hit is capped at 4, followed by retreat. | At the corner, the second bag hit still lands: 4 + 8 = 12 total. Grab bypasses the reduction for 12. |
| 柯P | 我不會屈服 | One-hit 60% armor can carry into a normal punch: incoming jab deals rounded 4 while the return jab still deals 6. | Two bag hits deal 4 + 8 = 12, consuming armor on the first. Grab deals full 12. Another special drops the armor. |

The 28 interaction cases repeat all seven characters for both player/enemy roles and both facing directions. Seven 12-second held-button cases prove the representative move cannot be recast before its unchanged cooldown, and each temporary defense ends. One literal snapshot protects all 21 approved cooldown values.

## Existing common protection

Accepted specials retain their key visual action until an existing finite presentation window ends. They still take full repeated damage and can be knocked out. Their ordinary recovery remains vulnerable. This common presentation rule is separate from each character's signature mechanic, and was not expanded or replaced by this audit.

## Verification

- `node --test tests/signature-counters-v36.test.mjs`: 36 passed, 0 failed.
- `node tests/soak-v13.mjs`: 588 rounds finished, across all 49 ordered pairings, two difficulties and six seeds. All 21 AI special kinds were used. At most three projectiles and two queue lines existed; per-owner plane/queue limits remained intact.
- Soak output: `signature-soak.json`.
- `npm test`: 1,563 passed, 0 failed in the final shared-tree run at audit completion. The initial baseline had 1,495 passes and four in-progress rendering failures; their owning workers resolved them before this final run. This worker did not change rendering files or their tests.

## What the evidence does not prove

These tests demonstrate working strengths, legal counters, symmetric rules and bounded resources. They do not establish equal human win rates or prove that no matchup is advantaged. The soak uses one fixed input script against AI; its winner counts are a stability diagnostic, not a balance ranking. No damage tuning was justified from those counts. Human play should evaluate whether successful reads, spacing and recovery punishment feel rewarding before changing numerical balance.
