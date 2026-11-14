# Challenge preview follow-up QA

Baseline: `c1b6a8d2629fd504796f21e68ae21dfd167b291d` on
`codex/complete-challenge-story`. This follows the R4 record, not a main release.
Main remains `488e31755dfe84db31b11c1c1f5df9dd81b452bf`.

## Browser evidence from the deployed baseline

- Normal preview slot 2 was at 0 XP / opening preparation. Confirming preparation
  opened the unchanged starter comic; skipping it reached the first street in
  about 0.6 seconds. Reload retained slot 2, 0 XP and the first-street checkpoint.
  This browser already had cached assets: it does not establish a cold-load fix.
- Quick view: finale intro stayed on the comic until continued; Han's exact
  retort appeared in his own bubbles. An idle player lost, the loss screen allowed
  retry, and the fast control then produced a win and entered the ending.
- Read the ending through all 18 frames, including all battery/map/door dialogue.
  Portrait 390x844 shows the ordinary mural corridor first, then the staircase,
  closed bronze door, failed attempts, accidental 9V contact, and first opening
  at frame 16. The right jamb and inserted battery persist into the opened scene.
  No old door is overlaid. The ending returns to credits and review/home controls.
- At 844x390 the battery face and printed label were readable. At 390x844 the
  host test window was only 757 pixels high, so the opt-in 844-pixel iframe needed
  outer scrolling to reach its footer. A real coordinate click advanced the
  visible button; keyboard next also worked. This is not physical-phone testing.
- Chapter 2 and chapter 4 each completed three street routes, both minibosses,
  the Boss's two wins, handoff comics, and the next-chapter link using the visible
  fast control. Story skip was used for some frames; these runs verify transitions,
  not human combat difficulty or every sentence's live rendering.
- Natural chapter 2→3 and chapter 4→5 navigation exposed a reproducible defect:
  the floating tool remained visible/focusable but stopped opening. Locator,
  keyboard and a screenshot-guided native click all confirmed the failure.
  Fresh chapter entry through the tool/URL did not exhibit it.

## Follow-up changes

- Finale battle/menu scenery uses the same complete native locked gold microphone
  stand as the comic. The base rests on the floor; physics and moves are unchanged.
  Independent Canvas review at 844x390, 390x844 and 568x320 preserves the head,
  lock and base. Normal camera clipping can hide part of this scenery at an edge.
- Comic overflow prefers an existing clause boundary instead of splitting words
  such as `神麥又竄` across pages. Original copy and source offsets are preserved;
  quote state carries across capacity breaks and cuts remain at punctuation groups.
- Ending's first narration uses a sentence break before the winning party holds
  the microphone. Fourth-chapter menu copy now describes escorting it, matching
  the revised story rather than suggesting another escaped stand.
- Quick-view tools now return to the surviving parent document on the departing
  game's `pagehide`, before natural navigation destroys the old document. The
  previous observer/animation callback and quick-advance handler are retired;
  late old promises/events cannot replace the next chapter's handler or status.

## Verification and limits

### Deployed follow-up `01a60a5`

Cloudflare preview build `74f81a8d-098f-440f-80ba-10d155be5e08` succeeded.
The exact ten-file tree was compared with its remote parent before the non-force
preview update; no extra changes or deletions were included.

- Browser then completed chapters 2→3→4→5→finale continuously using the visible
  quick controls. All street/miniboss/Boss/result/handoff stages advanced, and
  tools opened and advanced the new chapter after each natural navigation.
- The deployed chapter-2 opening now ends its first bubble after `街角，`;
  the ending displays `勝隊終於將神麥穩穩拿在手裡。` intact. Previous/replay
  worked and preserved the source sequence.
- A second finale party (Chen/Su/Ko, with Han on the opposing side) retained all
  seven comic figures and Han's exact retort. The idle player won this one battle
  through teammates after about 23 seconds, without the fast-win control. This is
  one observed case, not evidence that the medium-difficulty target is satisfied.
- Chen's native complete held-microphone pose appeared after victory. The full
  ending was read again through the closed-door, Su push, inserted battery and
  opened-door frames at 844x390; the room remained coherent and no old door layer
  appeared. The native finale battle stand was also visible with its round base.
- Finale selection at 844x390 fit the viewport, including start/preparation/home;
  at 390x844 the start button remained within the game viewport (bottom 640px).
- At 390px with a desktop pointer, the desktop battle controls overflowed; the
  preset changes dimensions but not the browser's touch capability. This is a
  narrow-desktop issue, not proof of a true-phone failure or success.
- A production-painter measurement of chapter 5's stationary jump found common
  scaling rather than independent facade/prop drift: relative landmark distances
  divided by camera zoom differed by less than 0.000008 world units. Its separate
  road-extension branch did still stretch at low zoom and is tracked separately.

### Narrow-window and road-extension follow-up

- The non-touch control deck at container widths <=640px now places all three
  specials above the direction and action buttons. Existing button text, keyboard
  controls, touch rules and wider desktop tracks remain intact. At 320px the lower
  tracks require 282 of 288 content pixels; no horizontal scrolling hides actions.
- Chapter 5's road continuation uses the facade's fixed world width and mirrored
  adjacent strips, including a one-source-pixel seam. It no longer stretches a
  low-zoom strip to screen width. Main facade, camera, objects and collisions are
  unchanged; the measured normal landing/jump frames do not draw this extension.
- Final available local suite after both changes: 1001 passed, 0 failed, 0 skipped.
  Pixel tests cover low-zoom landmarks, mirrored edges, aspect ratio and the
  unchanged normal jump projections. Control tests use shipped finale DOM/style
  order plus computed grid bounds; actual browser hit testing remains separate.

### Local checks and remaining acceptance

- Before the tool-lifecycle fix, complete local suite: 990 passed, 0 failed,
  0 skipped. Two screenshot-producing tests initially hit the read-only sandbox;
  the normal reviewed workspace-write run passed, followed by the complete run.
- Final local suite including tool-lifecycle regressions: 992 passed, 0 failed,
  0 skipped. The quick-view subset is 33/33. Its new 2→3 and 4→5 checks failed
  before the fix and passed afterward. JSDOM receives an explicit `pagehide`;
  this tests ordering and isolation, not Chromium's real document teardown.
- Final clause/quote regression and independent review passed. Production painter
  regenerated 102 focused parade, held-mic and doorway frames without decode or
  paint failures. Earlier complete-painter coverage remains 273 frames / 1911 cast
  variants, as documented in R4.
- Not yet verified: cold-image failure/recovery in a live browser; a fresh normal
  save played from chapter 1 to ending without fast controls; all five chapters'
  live failure/reload paths; physical-phone touch, sound, rotation and sustained
  performance; human assessment of medium finale difficulty.
- The original first-transition timeout did not recur in this warm run. Its root
  cause is still unconfirmed; do not report it as fixed.
- The local focused checkout omits legacy repository tests/assets. The test count
  describes its available suite, not every test in the complete remote repository.
  Hash comparison found no other local runtime-code differences from the deployed
  baseline beyond this follow-up's six runtime files; remote-only files will be
  retained by creating the new tree from the exact remote baseline.
- Publication and post-deployment browser checks must be confirmed separately.
  This document is an evidence record, not a claim of complete acceptance.
