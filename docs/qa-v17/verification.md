# V17 verification

- Full npm test: 688 passed, no failures/skips/cancellations. Added handshake slot/acceptance regressions first failed against V16, then passed after implementation.
- All 20 preexisting voice files and core/roster/combat/art modules match the V16 hashes. Only the new voice slot, menu/status/source copy and version cache values changed.
- New MP3 decodes without errors, has no metadata tags and matches source manifest SHA256. Decoded length4.20s (container4.231837s), continuous source8.15–12.35s, gain−6dB. The inspected frame visibly contains the requested printed phrase; ASR localization supports the range but wording differs, so no independent listening, speaker authentication or rights claim is made.
- Official preview/CUA: the chosen preview audio reached currentTime4.20/duration4.20 with correct source and no media error. 320×568 body had no overflow; help width/scrollWidth both261. The full long label was available in the sample selector.
- Real keyboard U accepted 小馬哥's 死亡之握 and showed the correct banner/cooldown. On the next observation the existing global audio player had already switched to the AI's Chen question clip. This is the unchanged known global voice interruption policy, not claimed fixed in V17. The event-to-handshake-audio mapping is covered by the new immediate-play regression.
- Pause stopped media and reset currentTime0. Application console errors absent after excluding browser-extension messages. Own tab203 closed; official preview explicitly stopped and status confirmed stopped. QA wrapper moved outside dist.
- Broader V18 voice lanes, AI delay, cooldown pie UI and neck/collar correction remain isolated and are not included in this audio-only release.
