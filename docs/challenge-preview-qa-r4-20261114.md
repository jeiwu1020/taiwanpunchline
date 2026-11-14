# Challenge preview candidate R4

Scope: `codex/complete-challenge-story` only, based on
`f6bcd5ec9aa804f03e1cbe35dd37b2c60d9b5678` / tree
`be47554f21bbb45560f7c1547fa9d0ca20df3bd4`.
Main was read-only and remained `488e31755dfe84db31b11c1c1f5df9dd81b452bf`.
The previous preview tree is the rollback source. This record describes local
verification; deployment and browser acceptance are separate gates.

## Implemented

- Whole generated character poses and backgrounds remain the comic source;
  no combat skeletons are used for story scenes. The original starter opening
  remains unchanged. Five new held-microphone variants preserve the masters.
- A single canonical gold round microphone is held only by the current carrier.
  It passes from the winning protagonist to Su for inspection, then to Wang
  before Su pushes the door. Huang's alternate-win double-microphone defect is fixed.
- Chapter 2 shows the microphone resting on the open stand, lifting over time,
  and travelling with a ribbon attached to the painted parade truck and native
  microphone knot. Chapter 3 continues that arrangement.
- The locked microphone stand, 9V battery front/map and closed/open door use
  reviewed native images. Closed/open door scenes are complete room paintings;
  there is no separately overlaid old door. The battery stays inserted on opening.
- Ending order: celebration, dead microphone, expired battery, map clue, ordinary
  mural corridor, hidden stairs, closed door, failed attempts, accidental battery
  key, first opening, unknown interior. No sequel promise is added.
- Speaker bubbles follow the speaking figure. The battery-key explanation moves
  the complete speaker to the left, preserving both dialogue ownership and the
  visible key on the right jamb. Per-sentence summary headings remain removed.
- Finale camera follows the controlled actor without zooming out for offscreen
  assists; boundary hints show offscreen combatants. Credits remain a full frame.
- Chapters 2/3/4 minibosses now teach rush, falling-word and handshake patterns.
  They retain shared telegraph/recovery code, 70 HP, one-round matches, and only
  existing character attacks. Named Bosses retain all three original moves and BO3.
- Growth keeps 80 XP per point, 35-point cap and all previously earned XP/ranks.
  Persistent per-route enemy receipts prevent retry/reload farming. Completed
  routes do not re-award mobs. First route/miniboss/Boss rewards are 25/60/100 XP;
  finale is 160; each chapter's first complete replay pays 120 once.
- The finale retains intentional 3-versus-4 count-first timeout adjudication.
  Selection and HUD now state it visibly; results explain actual survivor counts
  and, when tied, health-ratio sums. Three healthy allies versus four 1-HP opponents
  still loses at timeout; this behavior is explicitly regression-tested.

## Verified locally

- Full `npm test`: 987 passed, 0 failed, 0 skipped.
- Shared production comic painter: 273 frames plus 1,911 character variants;
  focused resting/lifting/held-mic/door render: 102 frames; all decode/paint gates pass.
- Independent visual review covers 3 canvas sizes (828×262, 374×656, 552×192),
  all 7 winners' first two ending frames, parade animation samples and door sequence.
- Independent v4 API review covers 15 routes, retry, API reload, slot-backup restore,
  completed-route enemy suppression, five one-time replay awards and final reward.
  Legacy 2800-XP/35-point allocations survive migration and reload. Failed saves
  block further mutations until verified retry. Other save slots remain unchanged.
- 350 repeats of chapter 1's first enemy award only the original 8 XP.
- First-pass mob XP by chapter: 178,133,113,113,142 (679 total). New first-clears
  total 1475; pre-finale 2154 XP = 26 points. After ending: 2314 XP = 28 points;
  five full chapter replays can reach the unchanged 2800 XP cap.
- Deterministic finale samples, internal difficulty `easy`: 7 rotating parties ×
  5 seeds for each rank setting. All actors use the actual arena AI; this is not
  a human control model. Rank 0: 22/35 wins, mean 30.3 s. Rank 5 on all seven
  branches: 33/35 wins, mean 27.1 s. Neither set reached timeout. These samples
  show an upgrade effect and achievable wins, not a validated human difficulty.
- Existing fighter attribute factors remain HP +15%, move +5%, damage categories
  +10%, incoming damage ×0.925 at rank 5; no CAST/COMBAT move rules were changed.
- Five street props have real distinct effects (sound absorption, cart collision,
  route gates, grab diversion, paper return). Quick-view uses the same game hosts;
  its already-published floating tools do not consume the game viewport.

## Not yet accepted / limitations

- This candidate still needs deployed normal/quick browser QA, fresh normal-save
  chapter-1-to-ending completion, browser retry/reload and cold-image recovery.
- Real phone touch, audio, browser chrome/rotation behavior and sustained frame
  rate have not been tested. Canvas geometry is not a substitute for those checks.
- First chapter's previously reported first-transition timeout has not been
  reproduced in the current candidate; do not label its cause confirmed or fixed.
- Legacy `?chasePanel` is a manually requested optional old proposal, not linked
  from normal/quick menus. It still uses a wheeled stand; default flows do not mount it.
- The synthetic local checkout lacks historical release-plan inputs, so the full
  Cloudflare build must run from the complete remote tree. Do not disable checks.
