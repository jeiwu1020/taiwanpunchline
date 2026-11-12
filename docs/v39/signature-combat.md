# V39 signature combat and visual lifecycle

## What changed

The engine now owns a separate bounded `fighter.performance` record. An accepted special still uses `fighter.attack` for all movement, activation, defense, healing, hit windows and recovery. The visual record cannot produce contacts or block new inputs. Ordinary hits during the existing key-action protection still deal full damage and preserve the attack. Ordinary recovery hits still cancel the attack and apply the existing damage, knockback and stun, but no longer erase the readable visual release.

The record contains `kind`, `age`, `actionDuration`, `duration`, `castId`, `outcome` and `outcomeAge`. Both clocks run on simulation time and stop during pause and hitstop. Confirmed outcomes come from real contact/defense events. A missed handshake becomes a whiff only after its .36s contact window ends; Su's dare becomes a whiff after its real counter resource expires.

V36's render-only .28s release is retained without extending gameplay. Han is excluded because a low folded silhouette must not outlast its collision posture. A successful new action or first legal movement, guard, crouch or jump clears/replaces the record. KO and round finish clear it. Interrupted drinking still spits and never receives a late heal.

## Deliberate counterplay exception

V38 allowed the performance guard to suppress a successful grab's capture pose and allowed a successful counter return to leave an offensive cast running. V39 treats actual grabs and earned counter returns as explicit exceptions. Their existing damage, knockback and stun values are unchanged, but they cancel the victim's live action and visual record. Captures are readable, counters stop later combo phases, and the successful defender keeps its own bounded result pose. Ordinary attacks, projectiles and repeated hits do not gain this exception.

There is no new invulnerability, damage reduction, cooldown refund or longer active hit window. Existing armor, calm, block, jump, low-profile and reflection rules remain in force. `combat-rules.mjs` and `stage-rules.mjs` are byte-unchanged from V38.

## Timing table

All values are seconds. Windows and cooldowns are unchanged; only visual end is separate. Defensive resources retain their existing timer activation semantics.

| Move | Damage / activation window (s) | Ordinary-hit guard ends | Attack ends | Visual ends | Cooldown |
|---|---|---:|---:|---:|---:|
| rush | 0.16–0.5 | 0.50 | 0.72 | 1.00 | 4 |
| counter | 0.08 + 0.4 resource | 0.20 | 0.84 | 1.12 | 6 |
| heal | 1 release | 0.40 | 1.20 | 1.48 | 10 |
| coin | 0.16 release | 0.22 | 0.48 | 0.76 | 4 |
| han_knee | 0.62–0.74 | 0.74 | 1.08 | 1.08 | 5.5 |
| arrow | 0.24 release | 0.30 | 0.60 | 0.88 | 7 |
| ma_handshake | 0.28–0.36 | 0.36 | 0.80 | 1.08 | 5 |
| ma_gaze | 0.25–0.38 | 0.38 | 0.72 | 1.00 | 5.5 |
| ma_cough | 0.2–0.28, 0.44–0.52 | 0.52 | 0.90 | 1.18 | 6 |
| su_shout | 0.32–0.44 | 0.44 | 0.76 | 1.04 | 5 |
| su_rush | 0.22–0.29, 0.42–0.49, 0.62–0.69 | 0.69 | 0.96 | 1.24 | 5.5 |
| su_dare | 0.2 + 0.3 resource | 0.32 | 1.00 | 1.28 | 7 |
| huang_shout | 0.3–0.42 | 0.42 | 0.78 | 1.06 | 5.5 |
| huang_debt | 0.14 + 0.35 resource | 0.26 | 0.76 | 1.04 | 6 |
| huang_queue | 0.28 release | 0.34 | 0.72 | 1.00 | 6.5 |
| chen_dream | 0.3 release | 0.36 | 0.72 | 1.00 | 6 |
| chen_question | 0.18–0.27, 0.42–0.52 | 0.52 | 0.80 | 1.08 | 4.5 |
| chen_calm | 0.12 + 0.45 resource | 0.24 | 0.82 | 1.10 | 7 |
| ko_bags | 0.16–0.26, 0.4–0.51 | 0.51 | 0.78 | 1.06 | 4.5 |
| ko_name | 0.3 release | 0.36 | 0.78 | 1.06 | 6 |
| ko_resolve | 0.16 + 0.9 resource | 0.28 | 0.46 | 0.74 | 7 |

## Verification evidence

- New `tests/signature-performance-v39.test.mjs`: 93 passing cases, including real contacts for both roles and directions; full recovery damage; independent visual expiry; pause/hitstop; legal-input replacement; true handshake outcomes; Su counter/whiff; KO; drinking interruption; and actual grab/counter priority.
- Test-first runs: initial 69 new cases failed before the record existed; all 24 new priority cases failed before the grab/counter exception; 21 clock cases failed before restoring the V36 visual tail. All are green after their corresponding implementation.
- Existing V19/V23 assertions that explicitly required grabs to preserve offensive attacks were updated to the approved counterplay rule. No ordinary-hit protections were removed.
- The original V24 normal-mode trace fixture is retained. 48 of 49 traces remain unchanged. The only scoped V39 override is Wang/Su: frame 1549 shows Wang's counter doing the same 12 damage but correctly canceling Su rush, with the existing 22px knockback and .16s stun. See `combat-trace-diff.json`; the two actors' HP is identical at the first difference.

This report covers engine and collision verification. Human visual/audio review belongs to the combined V39 acceptance pass.
