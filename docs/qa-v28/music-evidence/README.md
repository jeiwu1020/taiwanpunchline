# Music assets for the existing game

## Repository asset paths

The following paths are relative to this README's directory:

- Battle: `../../../dist/assets/music/run-amok-battle-v28.mp3`, decoded 104.050 s, stereo 44,100 Hz, 2,499,264 bytes.
- All non-battle screens: `../../../dist/assets/music/fluffing-a-duck-menu-v28.mp3`, decoded 31.460 s, stereo 48,000 Hz, 756,586 bytes.
- Credits: `../../../dist/assets/music/CREDITS.txt`, with source links, license link, and change notice. Keep equivalent visible and accessible in the game's music/credits UI. Preserve the change notice when redistributing these modified tracks.
- Unchanged official downloads: `../../../dist/assets/music/originals/fluffing-a-duck.mp3` and `../../../dist/assets/music/originals/run-amok.mp3`.
- `manifest.json` and `SHA256SUMS` are archived preparation records. Their `originals/` prefixes map to `../../../dist/assets/music/originals/`; their `processed/` prefixes map to `../../../dist/assets/music/`. Exact file sizes, hashes, sample counts, source URLs, and edit parameters remain applicable. The archived paths are not directories beside this README.

## Reproduce without changing game assets

Requirements: Bash, ffmpeg with libmp3lame, ffprobe, and GNU-compatible sha256sum, realpath, and mktemp. From the repository root, run:

```sh
bash docs/qa-v28/music-evidence/process.sh
```

The script resolves its input paths relative to itself, so it can also be invoked by absolute path from another working directory. It verifies both original SHA-256 hashes, creates a fresh `music-repro.XXXXXX` directory under `${TMPDIR:-/tmp}`, and writes only two re-encoded candidates plus small ffprobe/version/hash reports there. It decodes to a null sink for validation and does not recreate large PCM analysis files. It never copies results over runtime assets.

An optional argument chooses the parent directory for the fresh output directory:

```sh
bash docs/qa-v28/music-evidence/process.sh /tmp/music-checks
```

The runtime `dist/` directory and its descendants are rejected as output parents. Each run uses a new output directory and ffmpeg's no-overwrite option. Within the printed output directory, candidates are in `processed/`, reports are in `analysis/`, and `sha256sum --check SHA256SUMS` verifies the freshly generated hashes. For byte-for-byte comparison with the committed candidates, compare these hashes with the archived `manifest.json`; encoder/version changes can alter bytes without altering intended sample cuts.

## Verified provenance and license

The official song pages load `https://incompetech.com/music/royalty-free/pieces.json`, select by ISRC, construct official MP3 download links from their filename field, and render Kevin MacLeod's CC BY 4.0 attribution. Evidence actually retained in this repository directory:

- `selected-tracks.json`: the two relevant official catalog records.
- `licenses.html`: official Incompetech license page and CC credit generator.
- `fluffing-a-duck-download-headers.txt` and `run-amok-download-headers.txt`: HTTP responses for the original MP3 downloads.
- `manifest.json` and `SHA256SUMS`: archived asset metadata and hashes, with path mappings above.

The full track-page HTML, complete catalog, Creative Commons deed snapshot, and detailed PCM analysis were retained in the preparation workspace, not copied into this repository. Thus archived manifest references such as `evidence/pieces.json` do not identify files shipped here. Primary sources remain available at:

- [Run Amok](https://incompetech.com/music/royalty-free/index.html?isrc=USUAN1400024)
- [Fluffing a Duck](https://incompetech.com/music/royalty-free/index.html?isrc=USUAN1100768)
- [Incompetech licensing](https://incompetech.com/music/royalty-free/licenses/)
- [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)

No paid license was purchased, no account created, and no external upload made by this preparation worker. The free CC BY 4.0 option is used with credits and change notices.

## Processing rationale and precise boundaries

All times are relative to the original ffmpeg-decoded PCM, including its original MP3 delay, unless specified otherwise.

### Fluffing a Duck

The official catalog explicitly states that the original includes two short versions. It contains 67.368 s of decoded stereo audio, not one seamless 67-second loop. PCM analysis shows the first rendition's final strong notes around 29.50–29.70 s, followed by decay; a strong new onset rises at about 31.475 s. At 31.450–31.465 s RMS remains near −38 dBFS, then rises to −25.89 dBFS at 31.475–31.480 s and −20.82 dBFS at 31.480–31.485 s. This supports taking the first rendition before that new onset, although no listening was performed.

Selected samples [0, 1510080) at 48,000 Hz, exactly [0.000, 31.460) s. Added a 10 ms fade-in before the original audible opening (~0.020 s), and a linear 510 ms fade-out from 30.950 to 31.460 s. The fade alters the quiet first-ending decay, avoiding an abrupt cut and excluding the second rendition. It is a conservative complete-first-phrase repeat candidate, not a claim of a compositionally seamless loop.

### Run Amok

The official file contains 107.102041 s decoded. ffmpeg `silencedetect=noise=-55dB:d=0.25` reports leading silence [0, 0.817937) s and near-silent tail [104.763832, 107.102041) s. Keep samples [35280, 4623885) at 44,100 Hz, corresponding exactly to source [0.800, 104.850) s, duration 104.050 s. The beginning retains a short margin ahead of the measured onset. The ending preserves the musical decay down to roughly −65 dBFS instead of keeping >2 additional near-silent seconds.

Added 5 ms fade-in and 150 ms fade-out. The fade-out starts at processed 103.900 s, source 104.700 s, already in the very quiet decay. No internal music passage, pitch, or tempo was changed.

## Validation and integration caveats

The original preparation checks found that both processed MP3 files decode fully with ffmpeg, with exact intended sample counts for 31.460 s and 104.050 s. No NaN/Inf or clipped samples were detected. The final 10 ms measured −77.67 dBFS for Fluffing and −92.62 dBFS for Run Amok. These detailed PCM reports are not included in the repository. Running `process.sh` produces fresh lightweight ffprobe and decode validation without repeating or claiming to repeat those full PCM measurements.

For repeat playback, prefer Web Audio `decodeAudioData` and `AudioBufferSourceNode.loop` with `loopStart = 0` and `loopEnd = buffer.duration`. Decoder-aware MP3 playback should honor the included Xing delay/padding information; the raw container's reported duration is slightly longer. Test the actual deployed browser and mobile autoplay rules. A short gain ramp around play/stop or battle/non-battle switching will avoid discontinuities if switching mid-song. This worker did not edit app files, open the game, perform browser playback tests, or listen to the tracks. Repetition is functional; musical seamlessness is not guaranteed or claimed.
