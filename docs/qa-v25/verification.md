# V25 first-stage verification

## Approved scope and saved baseline

Baseline source is dc31ada818f2f61c549ba3eb1b36942d4eb020ed, game UI V24 / saved private Site version 2. Complete source archive before this stage: parliament-v24-before-stage1-dc31ada.tar.gz, SHA-256 e041962d5616b047ca6c05a214daa3e1397e849d1f3787873804980be7e02535, retained outside the checkout. The prior exact saved version remains available for restoration.

Only the first approved stage is included. Chen question copy now says high/low combo instead of first/second spoken question. Its damage, hit timings, duration and existing voice file are unchanged. Warm-up samples escape chance once per received contact, including a failed roll; post-action recovery is 0.55–0.80 seconds with no forward pursuit during it, including buffered jumps. Retreat and legal defense remain available. Formal mode is unchanged.

The user-provided drinking MP3 is copied byte-for-byte. New voice routing uses the existing actor-specific channels without changing interruption, playback replacement or move duration. Second-stage visibility/protection/interruption design is intentionally not implemented.

## Automated checks and independent review

The new once-per-hit, recovery, copy and water-slot tests were observed failing before implementation. Independent review additionally found a buffered-jump path could override the no-pursuit input; the actual interrupted-action flow was reproduced with a failing test and fixed. It also found a stale generated guide sentence and old test expectation, both corrected.

- Final suite: 1,173 tests pass, zero fail or skipped.
- Combat soak: 588 rounds, completed on final code.
- All 49 formal-mode player/opponent combinations match deterministic 15-second baseline frame and event hashes exactly. Reviewer independently checked fixture hashes against the baseline source.
- Syntax checks of all dist ES modules and git diff --check pass.
- Accepted heal events immediately route the new clip to the correct player's or enemy's existing media channel.
- Existing animation/presentation/protection modules, original queue audio and Chen question audio are unchanged. A separate queue short candidate is now selected after the user supplied a listening-based endpoint.

## Audio evidence and limits

Source: user-uploaded 喝水.mp3, confirmed Space ID libfile_a0238320485881919c2fee909e7d78d0. Local file was provided through the authorized materialization flow. SHA-256 2a4627f3a434ee1a1983af9765557e6db0bd11c5c214d0bfa7b51b6618bda96f matches the deployed asset. ffprobe: MP3 stereo 48 kHz, encoded duration 2.136 seconds. FFmpeg decoding succeeds; measured peak is -11.0 dBFS. No cut, normalization, synthesis or voice conversion was applied.

The tool explicitly rejected audio perception with “audio content omitted because you do not support audio input”. No offline transcription tool was installed. A read-only query of the available fal transcription route returned a reauthentication requirement; no audio was uploaded and no paid job was submitted. We cannot claim to have heard either clip or verified the uploaded drinking file against the website.

The original 13.03-second queue file remains byte-for-byte unchanged for rollback. The user listened to the separate 0–4 second preview and said “差不多是第二秒之前結束”. Following that fresh instruction, the selected game clip is now a continuous 0.00–1.98 second candidate, ending in the low-energy region around 1.7–2.05 seconds with a 20 ms fade. No new words or gaps were assembled. This is an approximate user-directed cut, not an independently heard semantic endpoint; the user should confirm the final “蛤” is intact. Browser decoded duration is exactly 1.98 seconds. The four-second preview remains outside the game for comparison.

## Browser smoke check

Official cloud Chrome loaded game V25, selected Chen, launched warm-up, and displayed “高低連擊 · 高段5、低段8，可格擋或看準跳蹲” on the actual special button. Pause/return to roster worked. Through the real help controls, both the queue short candidate and drinking original reached successful playback status, no media error, with correct asset URLs and decoded durations 1.98 and 2.098833 seconds respectively. This verifies routing/decoding, not audible content or physical phone output. One task tab timed out; closing that task-created tab and a fresh preview tab restored the checks. Shared preview was stopped afterward.
