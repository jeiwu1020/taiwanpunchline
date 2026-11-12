# Preserved partial-facade experiment

`street-partial-seams.research.mjs` retains all five experimental tests, with
their original assertions and thresholds unchanged. The helper remains at
`helpers/street-partial-compositor.mjs`.

The corresponding implementation and original test filename are preserved on
`candidate/post67-seam-experiment-20261111` at
`46e2e9b149bc67238cb2714705904a4ace2e4525`. To reproduce that experiment, run
`node --test tests/street-partial-seams.test.mjs` in a separate checkout of
that commit, not against this conservative release.

Source archives without Git history also retain the exact cache-only change in
`street-partial-seams.research.patch`, extracted from commit
`7c432ff810b786c7870f80b6df8031a81293966a`. It contains no import-token changes.
Only in a separate experiment copy of the source archive, apply
`git apply tests/street-partial-seams.research.patch`, then run
`node --test tests/street-partial-seams.research.mjs`. The patch is a preserved
research artifact, not active release code or accepted performance evidence.

The whole-view partial-facade experiment is **not in this release**. Its extra
painting cost was not accepted for publication. The release restores the
published #67 cache from `806f00c3f16d51708c7bd52f4da8ca57825f7b89`, except for
runtime import tokens, so these experimental assertions are intentionally
outside the active `tests/*.test.mjs` glob. They are not skipped, weakened, or
counted as passing release tests. All other active tests remain in place, and
`street-cache-published-baseline.test.mjs` checks the restored source contract.

Existing experiment evidence is retained. This release does not claim to fix
the horizontal seams or improve physical-phone performance. Independent
browser acceptance, backup verification, and publication remain separate gates.
