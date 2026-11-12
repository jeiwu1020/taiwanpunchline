#!/usr/bin/env bash
set -euo pipefail
if (( $# > 1 )); then
  printf 'Usage: bash %s [output-parent-directory]\n' "$0" >&2
  exit 2
fi
script_dir="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd -P)"
repo_root="$(cd -- "$script_dir/../../.." && pwd -P)"
input_dir="$repo_root/dist/assets/music/originals"
for command in ffmpeg ffprobe sha256sum realpath mktemp; do
  command -v "$command" >/dev/null || { printf 'Missing command: %s\n' "$command" >&2; exit 1; }
done
# Always create a fresh output directory; never write into deployed assets.
output_parent="$(realpath -m -- "${1:-${TMPDIR:-/tmp}}")"
runtime_dir="$(realpath -m -- "$repo_root/dist")"
case "$output_parent/" in
  "$runtime_dir/"*) printf 'Output must be outside the runtime dist directory.\n' >&2; exit 2 ;;
esac
(
  cd -- "$input_dir"
  sha256sum --check <<'HASHES'
cb23b1833c35e391de10d998d6a40cfc760565ce31d23014c86025523ca8239b  fluffing-a-duck.mp3
12ee736658e7aab114f57a8edb034e8dafce37e01bdacd788b486377c4bd4d24  run-amok.mp3
HASHES
)
mkdir -p -- "$output_parent"
output_dir="$(mktemp -d "$output_parent/music-repro.XXXXXX")"
mkdir -- "$output_dir/processed" "$output_dir/analysis"
cd -- "$output_dir"
printf 'Output directory: %s\n' "$output_dir"
ffmpeg -version > analysis/ffmpeg-version.txt
# Times below are relative to the original decoded PCM, before trims.
ffmpeg -nostdin -n -v warning -i "$input_dir/fluffing-a-duck.mp3" \
  -af 'atrim=start_sample=0:end_sample=1510080,asetpts=PTS-STARTPTS,afade=t=in:st=0:d=0.01,afade=t=out:st=30.95:d=0.51' \
  -map_metadata -1 -c:a libmp3lame -b:a 192k -write_xing 1 \
  -metadata title='Fluffing a Duck (first version, game edit)' \
  -metadata artist='Kevin MacLeod' \
  -metadata comment='CC BY 4.0; https://incompetech.com/music/royalty-free/index.html?isrc=USUAN1100768; first version 0-31.46 s; 10 ms fade-in and 510 ms fade-out; re-encoded.' \
  processed/fluffing-a-duck-menu-v28.mp3
ffmpeg -nostdin -n -v warning -i "$input_dir/run-amok.mp3" \
  -af 'atrim=start_sample=35280:end_sample=4623885,asetpts=PTS-STARTPTS,afade=t=in:st=0:d=0.005,afade=t=out:st=103.9:d=0.15' \
  -map_metadata -1 -c:a libmp3lame -b:a 192k -write_xing 1 \
  -metadata title='Run Amok (silence-trimmed game edit)' \
  -metadata artist='Kevin MacLeod' \
  -metadata comment='CC BY 4.0; https://incompetech.com/music/royalty-free/index.html?isrc=USUAN1400024; source 0.8-104.85 s; 5 ms fade-in and 150 ms fade-out; re-encoded.' \
  processed/run-amok-battle-v28.mp3
for f in processed/*.mp3; do
  stem=$(basename "$f" .mp3)
  ffprobe -v error -show_format -show_streams -of json "$f" > "analysis/$stem-processed.ffprobe.json"
  # Decode for validation without retaining large PCM files.
  ffmpeg -nostdin -v error -xerror -i "$f" -f null -
done
sha256sum "$input_dir"/*.mp3 processed/*.mp3 > SHA256SUMS
printf 'Reproduction and decode checks complete: %s\n' "$output_dir"
