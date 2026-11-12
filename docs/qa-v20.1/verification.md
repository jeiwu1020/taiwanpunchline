# V20.1: tighten only the Chen dream voice lead

The user asked to remove a little more from the front of the supplied 有夢最美 recording. The old cut already had only about 39 ms before its first clear acoustic onset. The new cut is 7.048–9.620 seconds from the original source, versus 7.020–9.620, removing exactly 28 ms (1,344 samples at 48 kHz).

Independent audio preparation and parent verification both confirmed the removed source/PCM region is entirely digital zero. The remaining new WAV is sample-for-sample identical to the old WAV after that region, with zero differing samples. The first faint onset, speech, gain and trailing fade are retained. Encoded MP3 has 2.572 seconds of gapless decoded audio, no metadata and no clipped samples. Lossy MP3 frame alignment differs after the cut; the assertion of exact equality applies to the input PCM, not compressed bytes.

The earlier file is retained for provenance but no longer referenced by the playable slot. Unique audio filename and module cache revisions ensure the updated asset is loaded. Camera, simulation, AI, art, input and voice-channel behavior are unchanged. User-visible source ranges and duration were updated.

Tests were red for the old onset range and then green with the new file. Focused voice, UI trigger and decoding tests: 29 passed. Fresh full suite: 1,029 passed, zero failed. Syntax and git whitespace checks passed.

Actual production-page browser QA (own tab 256): selected 阿扁仔, opened source/help, selected 有夢最美 and clicked preview. Media showed chen-dream-user-candidate-v201.mp3, duration 2.572, currentTime 0.159198, paused false, error null. Closed help, started a normal duel, clicked first special. The real move entered cooldown (5.8 seconds) and the same new media showed currentTime 0.096698, duration 2.572, paused false, error null. This verifies decoding and playback triggering, not independent listening or speaker identity.

The preview was stopped, status confirmed stopped, and only this task's own tab 256 was closed. No paid service, new Codex task, GitHub main change or sharing change was made. Publishing targets only the existing owner-private Site.
