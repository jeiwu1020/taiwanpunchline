# V39 — signature performance and five-character personality pass

## Scope and rollback

Source baseline: V38 `8ed0ea36603759247f5bf7b6b925f42146445b50`.
Existing private Site: `appgprj_6aeede2a09908191bcfc5c207636f63b`.
No GitHub game branches, homepage layout, roster layout, cooldown numbers, or audio clip selections are in scope.

The approved direction is readable important actions which still take damage, with evasions and counters preserved. Rendered performance must not create extra hitboxes, extend damage windows, or imply invincibility. Five characters' fifteen actions receive distinct preparation, impact and recovery beats; gestures and props should describe their actual rules.

Voice policy is unchanged: accepted casts play immediately, each actor owns one voice lane, a new accepted cast replaces that actor's phrase, and both actors can overlap. No phrase FIFO has been approved or introduced. Ordinary animation cancellation must not cancel a spoken phrase. Navigation, round end and mute retain explicit cleanup.

## Verification

Baseline aggregate tests: 1603 passed, 0 failed.
Final aggregate: 1,765 passed, 0 failed. See final-tests.log. Both facing directions for all fifteen updated moves were inspected across 120 frames; a live match and the production move-demo renderer were exercised in cloud Chromium. This is not physical phone testing or subjective audio listening.

## Counter exceptions

Ordinary hits still deduct health. The accepted special keeps its existing protected startup/active windows, while a separate simulation-clock record can finish only its visual release. A genuine grab or successful counter now wins over that protection, cancels the victim's action/presentation, and shows the capture/reaction. This intentionally replaces the V19 expectation that a grab cannot stop an accepted special. It does not add invincibility or change attack values.

The existing V36 render-only 0.28-second release is retained separately from the actual action duration (except Han's knee move, as before). New legal inputs, a real capture/counter, interruption of drinking, and round completion take priority. No visual tail grants an extra attack, heal, defense activation, cooldown refund, or input delay.

## Automated match coverage

The scripted soak runs all 49 character pairings in both difficulties with six deterministic seeds, 588 rounds total. These are robustness checks of legal state, match completion and move use, not evidence of equal human win rates. The V38 baseline is retained beside the candidate run for comparison.

## Final integration

Cache keys for all changed dependency paths were refreshed (entry game.mjs v218, changed modules v39). The standalone move table was regenerated. The live 人 glyph now follows the authoritative performance clock and is cleared with a real interruption, instead of surviving on a stale caption timer. Two additional lifecycle tests cover this integration. All temporary served QA pages were removed; source fixtures and screenshots are retained in tests/qa-v39 and docs/v39.
