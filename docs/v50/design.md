# Ground crowd wave (V50)
User selected a travelling ground attack instead of V49 locked-location burst. Keep #27 as rollback. No changes to item rules, voices, damage22, guard chip2, meter charge or purchases.
A .8s telegraph precedes a 480 world-unit/s ground wave. Swept 42-radius contact checks prevent skipped hits, one contact per opponent per cast. World-ground height430 and cutoff365 mean desk and high jumps evade. Cast direction remains fixed. Damage timing is travel-dependent. Visual wave is rendered at the same world x/ground y. Idle support remains screen anchored, wider separated lanes. Gold/cyan identity and character-name flags. Passing enemy crowd only scatters presentation, never removes meter.
Retreat increases60->85, forward remains245. Clear winner names, side labels for mirror matches and draw.
Verification: both owners, ground/desk/air/guard, delayed arrival and moved target, one hit, support unchanged, widths/rotation/flags and actual game preview. Historical deterministic traces retained; V50 baseline explicitly includes speed/rally rules.
AI compatibility: retain .35s reaction delay, track incoming wave until passed rather than stopping at old burst timestamp. No difficulty/random reaction change. Defense facing uses wave direction, not summoner's later position.

## Verification completed
- 1,839 tests pass, 0 fail: /tmp/rally50-final.log (local execution log).
- Preview actual game: 390x720 portrait with named cyan support flag clear of buttons; 844x390 landscape same; named winner result confirmed. Existing phone control layout and L hint unchanged.
- Shared renderer/core QA: simultaneous ground waves78/78, desk standing100 with 太高啦; high-jump and guard expectations automated, swept-step checks at120/30/20Hz.
- Flags/scatter/world alignment/mirror winner and draw tests added. Old #27 stored in backup-before-rally-v50 plus full pre-change source tar.
- Five existing diverse adult supporter illustrations reused; no paid service or new artwork generation required.
