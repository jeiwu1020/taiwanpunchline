# Chen dream voice candidate v20

## Result
- Final candidate: `chen-dream-user-candidate-v20.mp3`.
- Exact original source-audio range: **7.020–9.620 seconds**, start inclusive / end exclusive; duration **2.600 seconds**.
- The source was the user-supplied recording, Library file `libfile_c4f4cdf9b10881919a7294bc99d35c71`.
- This range preserves the entire first isolated utterance. There is no splice within the utterance.
- The user's move label is **有夢最美**. The source video's visible title says **有夢上水**. The probable literal phrase is Taiwanese **有夢上水**, based on title and phonetic ASR evidence. This is an inference, not a verified verbatim transcript.

## Boundary evidence
1. The source begins with roughly 7.06 seconds of digital silence. The first above −38 dBFS sample is at 7.059396 seconds.
2. Waveform/spectrogram show the principal utterance from about 7.06 through 9.45 seconds, followed by low-level decay/background.
3. Cropped local Whisper base/small place this utterance's ending near 9.37–9.43 seconds. Their Mandarin text outputs are unreliable phonetic approximations, such as 五班熊水 / 伍邦雄帥. Do not use those characters as a transcript.
4. A separate later vocal burst occurs around 10.35–10.74 seconds, after roughly 0.9 seconds of low-level gap. It is excluded. The worker cannot reliably call it laughter, a word, or identify a second speaker.
5. The chosen cut retains about 39 ms before onset and about 170 ms after the principal tail, while excluding the later burst.
6. The visible video at this interval shows a single person speaking and the title 有夢上水. There are no visible phrase subtitles. Later frames show a scene change. Visual appearance was not used for biometric identity verification.

## Audio treatment and checks
- Mono, 48 kHz, 128 kbps MP3.
- Constant gain −5.4 dB, preserving dynamics. Five-millisecond fade in and 15-millisecond fade out are confined to low-level margins.
- No denoising, internal rearrangement, time stretching, voice generation, or cloning.
- All recording/browser title, artist, creation-time and ID3 metadata removed. ffprobe reports no MP3 format or stream tags.
- MP3 container duration is 2.640 seconds due to frame padding. Gapless decoded sample count is exactly 124,800 at 48 kHz, or 2.600 seconds.
- Final decoded peak, clipping count, byte size and SHA-256 appear in `manifest.json`.
- Earlier `chen-dream-voice.mp3` is an intermediate louder version and must not be integrated. Use only the filename above.

## Limits
The worker could inspect the waveform, spectrogram, local ASR results and video frames but could not directly audition audio in its interface. No independent listening, voice biometric authentication or rights verification was performed. This result is a defensible continuous-utterance cut, not a claim of exact word-level linguistic segmentation.

## Reproduction
`ffmpeg -i source.mp4 -vn -map_metadata -1 -map_chapters -1 -af "atrim=start=7.02:end=9.62,asetpts=PTS-STARTPTS,volume=-5.4dB,afade=t=in:st=0:d=0.005,afade=t=out:st=2.585:d=0.015" -ac 1 -ar 48000 -c:a pcm_s16le chen-dream-user-candidate-v20.wav`

`ffmpeg -i chen-dream-user-candidate-v20.wav -map_metadata -1 -map_chapters -1 -c:a libmp3lame -b:a 128k -id3v2_version 0 -write_id3v1 0 chen-dream-user-candidate-v20.mp3`
