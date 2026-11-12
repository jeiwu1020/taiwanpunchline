# V27 settings and one-shot move guide

## Delivered scope
- Toolbar Settings entry with Audio, Controls/View, Character Moves, and About/Sources sections.
- Independent SFX/voice level and mute, plus retained quick master toggle. Best-effort local persistence and inline confirmed reset affect only this game's preference key.
- All seven characters and 21 moves have purpose, keyboard/mobile binding, fixed cooldown, expandable exact mechanics and source notes. Choosing a move runs the existing comic art once and plays its mapped voice once. Character changes draw the correct still frame without autoplay.
- Existing dialog is viewport-rotated. Active battles pause before opening and remain paused after closing. Section/character changes, close, blur and visibility loss stop previews.
- Original help/history body, all links and media references preserved byte-for-byte inside the history disclosure.
- No music, campaign, progression, combat timing, hit rules, interruption/protection rules, or source audio changes.

## Automated verification
- Final full suite: 1,252 passed, zero failed/skipped.
- 588 complete seeded matchup rounds. Results, winners, AI move counts and bounds match V26 exactly after excluding execution runtime.
- Syntax checks for all changed/new modules and git diff whitespace checks pass.
- Preference tests cover malformed inputs, unavailable storage, independent channels, exact reset scope and fresh snapshots.
- Preview tests cover all 21 render models, finite timelines, props, Chen return, cancellation and stale RAF callbacks.
- Real-game harness covers route preservation, independent mute, visible preview audio rejection, modal pause, quick-toggle synchronization and silent media priming during muted start.
- Independent review verified the preserved history and found no remaining source blocker before final publication. Its Safari activation concern was addressed by silent media-element priming at start/resume, even when channels are muted.

## Official browser checks
Cloud Chromium only, not a physical phone or Safari.
- Touch-sized 568×320 landscape and 320×568 sideways: navigation, scrolling, all 21 move-selection actions, one-shot previews, expandable details, retained source history and close.
- Initial compact layout clipped the demo below the fold; now compact move mode uses the available footer space, a 140px canvas and scroll-to-canvas. Whole canvas plus play/stop buttons were visually checked.
- 320×568 unrotated portrait: all four sections, saved camera/rotation and audio preferences, reload, reset cancellation and confirmed reset.
- 1180×757 desktop: move guide, native Escape close, audio stop, battle remains paused, explicit resume works.
- Chen approved audio still routed to chen-dream-user-confirmed-v26.mp3. All gallery selections reported playback without an error message. This is not independent semantic listening or speaker authentication.

## Voice volume compatibility
The two existing media lanes each connect once to their own Web Audio GainNode, sharing the game's AudioContext but not SFX gain. Media volume stays at unity; player/preview gain remains 0.68 and enemy 0.46, multiplied by the selected voice level. This avoids relying on media.volume on browsers that ignore it. Muted starts silently prime both media elements, then pause them; no audible prime is intended. Unsupported graph setup retains the ordinary media-volume fallback.

A real-browser harness using the production VoiceChannels module measured:
- Full mix: player gain ~0.68, enemy ~0.46, peak RMS 0.08944917524517025.
- Quarter mix: player gain ~0.17, enemy ~0.115, peak RMS 0.021950515445788008.
- Zero gain: both gains 0, RMS 0.
- Exactly two media sources across repeated runs, unity media volume, no media error, both media paused after stop.
The same final module was then checked in the real game preview and closed cleanly. Physical Safari/iPhone playback remains unverified.

## Rollback
Previous source: 2e7436ff669ef54b0249ff41b991e38e18696d3d (game V26, saved Site version 4).
Complete pre-settings source archive SHA256: dc6eae56db717ff0ef5b03391710a9669ccbf5150dec05b3732149c4f2b55a2c.
All source audio files remain untouched. The original V22 Site is a different project and was not edited.
