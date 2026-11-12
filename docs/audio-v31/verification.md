# V31 reviewed voice selections

## Scope and source
- User message Sentinel_326d31f2bb848191bfbcb52daa258aa2 supplied 21 source-ID ranges.
- Applied 20; **ko_name / 賴祥德 remains exactly V30** while the user selects a range in the replacement source.
- `user-selections.json` preserves the requested source IDs, start inclusive/end exclusive times, -20 dBFS active RMS and 5 ms fades.
- `source-catalog-snapshot.json` preserves the voice-studio mappings. Each input was SHA-256 checked before rendering.
- Existing game MP3 files are retained byte-for-byte. Source recordings and full WAVs remain in voice-studio and its saved source history; this game deployment includes only the short processed WAVs.
- V30 source backup: `parliament-v30-source-e248af9.tar.gz`; source commit e248af9d6947c306c7b66baf3044be00cc953680, saved site version 8. The original V22 site is untouched.

## Processing and limits
- `scripts/audio-v31/audio-core.mjs` is copied byte-for-byte from the voice editor.
- Decode at each original source's native sample rate/channel count (44.1 or 48 kHz), then apply the exact editor `renderClip` and PCM16 `wavBytes` functions. No lossy re-encoding after DSP.
- 50 ms gated active RMS, gain limited to -30/+24 dB, linked-channel 5 ms lookahead -1 dBFS sample-peak limiter, 80 ms release, then 5 ms endpoint fades.
- Actual active RMS after fades/quantization is -19.953 to -20.253 dBFS. A fade or gate change may move final RMS slightly from the -20 target; the waveform is not repeatedly re-normalized.
- The rounded text endpoints for huang_debt (1.152) and heal (2.099) exceed their actual sources by less than 0.2 ms. As in the editor, endpoints clamp to the final source sample; no silence is added.
- 20 output clips total about 6.8 MiB. WAV preserves exact frames; old MP3s remain for rollback.
- This is sample-peak limiting, not a true-peak guarantee. An additional 4x resampling check found all peaks below full scale (maximum 0.8008001).
- Source MP3 decoder is ffmpeg; Web Audio decoder may differ microscopically. The DSP algorithm and native-rate/sample-range rules are identical.

## Verification
- 41 new regression checks cover exact requested source/range, actual decoded frames, output hash, no clipping, expected RMS, 5 ms zero endpoints, absence of recording metadata, accepted move/preview routing, ko_name identity and all prior clip preservation.
- Full suite: 1369 passed, 0 failed, including existing combat simulations. Historical audio expectations were updated for the explicitly approved current cuts; prior file hash assertions remain.
- Browser QA (Chrome managed preview): all 20 WAVs fetched and SHA-256 checked, decoded to exact expected sample counts, played to ended through a MediaElementSource -> GainNode -> Analyser path with nonzero output. Evidence in `browser-playback.json`.
- Actual game settings: selected 從從容容, confirmed new WAV URL, duration 2.981 s, time advancing, no media error. Returned the preview browser to its previous master-mute setting.
- Tests cover actual production routing while only browser/media boundaries are mocked. The independent browser QA used real media elements.
- No physical iPhone/Safari validation and no subjective hearing claim. User's selected phrase boundaries remain the listening authority.
- No combat, animation, camera, layout or difficulty changes. Only audio assets, metadata, their versioned imports, current audio preload URL and source/version documentation changed.

## Reproduce
Run from game source: `node scripts/audio-v31/render-selections.mjs /path/to/retained/brawl-voice-studio/dist`, then `node scripts/generate-moves-page.mjs` and `npm test`.
`tests/qa-audio-v31.html` is a local-only browser fixture; copy it into dist for QA and remove it before packaging. It is not shipped on the live Site.
