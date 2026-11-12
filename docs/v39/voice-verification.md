# V39 voice interruption verification

## Finding and retained behavior

The V38 implementation already separates accepted move speech from attack and
animation lifetime. `Arena.event` plays the accepted `move` event immediately,
using its actor and move kind. Hit, spit, counter and animation completion do not
stop that phrase. `VoiceCueQueue` remains a legacy utility; the live game does
not schedule accepted moves through it.

No production voice, media, source-clip, or game-routing changes were necessary.
The existing behavior is retained:

- Each actor has one media lane. The two actors can overlap.
- A new accepted move replaces that actor's previous phrase immediately.
- Rejected inputs do not replace speech. There is no phrase FIFO.
- Ordinary damage and reactions do not stop an accepted phrase.
- Voice completion is not required for animation completion or another input.
- Home, round end, pause, selection/reset, lost focus, master mute, voice mute,
  voice-volume zero and explicit preview cleanup still stop playback.
- Preview remains exclusive and does not create a third game voice.

This does not promise that every phrase plays to its end: the same actor's next
accepted move or an explicit lifecycle stop can replace or stop it. No new
queue/replacement policy has been introduced.

## New regression coverage

`tests/voice-interruption-v39.test.mjs` runs the real combat implementation,
`Arena.event`, and `VoiceChannels`; browser media and Phaser drawing boundaries
are replaced by test doubles.

The 49 checks cover all 21 moves for both actors receiving ordinary damage,
actual punch collision that cancels late drinking but not its speech, accepted
move events presented after their attack has already disappeared, successful
counter consumption, natural animation completion, rejected input, same-actor
replacement without disturbing the other actor, pending playback promises,
home cleanup, actual knockout and voice-volume-zero cleanup.

Commands and observed results on 2026-11-08:

- Baseline `npm test`: 1603 passed, 0 failed.
- `node --test tests/voice-interruption-v39.test.mjs`: 49 passed, 0 failed.
- New tests plus `voice-channels-v18.test.mjs` and `entry-voice-v37.test.mjs`:
  69 passed, 0 failed, including the concurrent V39 core changes available then.
- Mutation check on temporary copies only: calling `stopVoice()` during hit or
  block presentation failed 46 tests. Requiring a surviving attack before
  accepted-event speech failed the batched interruption regression. Neither
  mutation was applied to the working source.
- Full `npm test` while V39 art implementation was still in progress:
  1722 passed, 10 failed, all in `signature-personality-v39.test.mjs`.
  An integrated full-suite rerun is required after the parallel work completes.

The in-progress full-suite failures were:

1. Ma bows into handshake then examines his unanswered hand only after a real whiff.
2. Human glyph waits beside the inspecting face before palm launch at the hit window.
3. Cough visibly lifts both shoulders twice and keeps paper in the other hand.
4. Three-step Su charge lands at each actual hit and visibly brakes after third step.
5. Su dare counter followthrough differs from unanswered invitation without adding hits.
6. Huang commits to the pointing lean and pulls the queue strap only before creation.
7. Chen shrug lifts shoulders, and real calm retreat relaxes instead of inventing a counter.
8. Bags hang as weight below the hand and stance plants both soles.
9. Authoritative visual performance can finish through hit reaction, with no state mutation.
10. Presentation forwards true outcomes and never creates them for a live pending record.

## Limits

These checks verify playback requests, channel state, cancellation, replacement
and callback lifetime. They do not decode or listen to the voices and do not
establish perceived overlap clarity, device volume, actual browser autoplay, or
audio/animation timing on a physical device. Audible listening and browser/device
acceptance remain separate checks. No audio assets were changed.
