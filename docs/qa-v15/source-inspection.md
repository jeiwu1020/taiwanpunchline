# Drive voice archive inspection

Source: https://drive.google.com/file/d/1AUrE7GFXAuOaUoY7tBgbC0toW25vOiYb/view?usp=drive_link
Archive: Captures.zip, 73,717,434 bytes. Authenticated download succeeded. ZIP paths, sizes, media extension allow-list and CRC verified before extraction.
All nine originals are H.264 video plus AAC audio at 48 kHz stereo. All complete video/audio streams decode without errors. Originals preserved unchanged.

No independent listening, speaker identity authentication, source authenticity verification or reuse-rights verification occurred. Filename mapping is user-intended mapping, not identity recognition. All originalVerified fields remain false.

## File inventory
- 一支穿雲箭.mp4: video 11.799 s, audio 11.755 s; intended moves arrow. Filename mapping confidence high; audio identity unverified.
- 垃圾不分藍綠.mp4: video 9.732 s, audio 9.664 s; intended moves ko_bags. Filename mapping confidence high; audio identity unverified.
- 從從容容  連滾帶爬.mp4: video 21.247 s, audio 21.205 s; intended moves counter, rush. Filename mapping confidence high; audio identity unverified.
- 我把你當人看.mp4: video 9.515 s, audio 9.451 s; intended moves ma_gaze. Filename mapping confidence high; audio identity unverified.
- 有這麼嚴重嗎.mp4: video 10.332 s, audio 10.261 s; intended moves chen_calm. Filename mapping confidence high; audio identity unverified.
- 衝衝衝.mp4: video 15.898 s, audio 15.808 s; intended moves su_rush. Filename mapping confidence high; audio identity unverified.
- 要試試看嗎.mp4: video 13.398 s, audio 13.355 s; intended moves su_dare. Filename mapping confidence high; audio identity unverified.
- 賴祥德  我不會屈服.mp4: video 16.481 s, audio 16.448 s; intended moves ko_name, ko_resolve. Filename mapping confidence high; audio identity unverified.
- 阿扁錯了嗎.mp4: video 14.465 s, audio 14.400 s; intended moves chen_question. Filename mapping confidence high; audio identity unverified.

## Prepared materials
- prepared-full/: full-length backup MP3s only, not suitable as direct game clips because some captures have 4–6 second pauses.
- prepared-candidates/: nine short, continuous candidate excerpts for review. Each is attenuated 4 dB, with 12 ms/25 ms edge fades; no voice cloning, recombination, time stretching, or new wording.
- All candidate MP3s decode successfully with negative peak dBFS. Candidate-cuts.json contains exact source ranges, evidence, confidence and checksums.
- Confidence describes phrase-position evidence only, not speaker identity or legal clearance.

## Candidate cuts
- arrow: 一支穿雲箭.mp4 [7.85, 9.90] s -> user-arrow-candidate-v15.mp3 (2.088 s), medium-high. Filename and visible caption 一支穿雲箭; Base 8.00–9.42 and Tiny 7.94–10.14 recognize the phonetic phrase. Endpoint 9.80 s is a low-energy valley; background noise means not digital silence.
- ko_bags: 垃圾不分藍綠.mp4 [6.55, 7.84] s -> user-ko-bags-candidate-v15.mp3 (1.320 s), medium. Visible caption 所以垃圾不分藍綠 and repeated phrase. Base maps target phonetics about 6.64–7.64; Tiny 6.74–7.56 with inflated end. Crop excludes most of 所以; onset/ending needs listening review because word alignment differs by about 0.1 s.
- counter: 從從容容  連滾帶爬.mp4 [8.65, 13.15] s -> user-counter-candidate-v15.mp3 (4.536 s), medium. No dialogue captions. Filename and both models phonetic timing agree on 从容 portion; retain entire continuous sentence around 本來應該…游刃有餘 rather than guessing a four-syllable trim. Start is a ~-49 dB valley; end is within detected 12.83–13.73 silence.
- rush: 從從容容  連滾帶爬.mp4 [15.64, 18.02] s -> user-rush-candidate-v15.mp3 (2.424 s), medium. No dialogue captions. Filename and two ASR passes agree on phonetic 連滾帶爬 region around 15.66–17.8. Both crop edges lie in measured silence, before the next speaker at 18.34 s.
- ma_gaze: 我把你當人看.mp4 [5.05, 6.27] s -> user-ma-gaze-candidate-v15.mp3 (1.248 s), medium-high. Visible caption 我把你當人看 at 5–6 s. Base recognizes 我幫你當人看 at 5.00–6.12; Tiny 5.02–6.24. Start before silence ends 5.151; end at local energy valley before next 我 at 6.28.
- chen_calm: 有這麼嚴重嗎.mp4 [7.14, 8.88] s -> user-chen-calm-candidate-v15.mp3 (1.776 s), medium-high. Caption 各位有這麼嚴重嗎 at 8–9 s. Base locates target at 7.32–8.68; Tiny 7.42–9.02. Crop begins before target after 各位 and ends at low-energy valley near 8.82, before next sentence; exact vowel tail still requires hearing review.
- ko_name: 賴祥德  我不會屈服.mp4 [5.55, 7.15] s -> user-ko-name-candidate-v15.mp3 (1.632 s), medium-high. News caption contains 賴祥德; Base phonetic 來獎的 at 5.54–6.70. Start before audio begins 5.674 and end within measured 7.081–7.231 silence. This preserves name-only event before following words.
- ko_resolve: 賴祥德  我不會屈服.mp4 [11.15, 13.35] s -> user-ko-resolve-candidate-v15.mp3 (2.232 s), medium-high. Visible caption 我不會屈服 at 11–13 s. Base phonetic 11.40–13.10; Tiny 11.50–13.32. End at near-silent valley about 13.25–13.32 before narrator; start includes modest lead-in padding.
- chen_question: 阿扁錯了嗎.mp4 [7.70, 9.55] s -> user-chen-question-candidate-v15.mp3 (1.896 s), medium-high. Filename and on-screen video title match. No dialogue captions. Base second repetition 阿贬錯了嗎 7.86–9.22 (high internal token confidence); Tiny has same phonetic repetition 7.74–9.74. End near low-energy gap 9.42 before next sentence ~9.96.

## Still unresolved
- su_rush / 衝衝衝.mp4: both Tiny and Base misrecognize the content; Base gives repeated 窮 around 11–15 seconds and Tiny gives 拚拚拚 around 12–14.6 seconds. No trustworthy dialogue subtitle. Capture contains seeking/jumps and crowd/background sound. Do not claim a confirmed exact cut.
- su_dare / 要試試看嗎.mp4: visible caption says 要試試看嗎, but both models fail to align that phrase. Capture repeats and seeks backward. Exact line, speaker turn and cut boundaries still need listening or user timestamps. Filename/caption use 嗎, whereas current game label uses 嘛; do not silently rename.
- su_shout / 在那叫什麼: absent from archive.
- counter keeps the full sentence surrounding 從從容容 (4.5 seconds) because no dialogue caption supports a tighter four-syllable cut.
- ko_bags exact word onset differs between ASR passes by about 0.1 s; candidate should be listened to before describing the edit as verified.

## Analysis limits
- Local faster-whisper Tiny then public Systran/faster-whisper-base, CPU int8, one thread, one pass each per original. No uploads or paid services. No larger models.
- Many ASR spellings are phonetically plausible but wrong; transcripts are evidence for candidate timing only. High ASR token probability is not proof of wording.
- base initial failure was a local read-only default cache; rerouted cache into permitted shared workspace. No security settings or access controls changed.
- No game edits, commits, deployment, new Codex task, external sharing or publication performed.
