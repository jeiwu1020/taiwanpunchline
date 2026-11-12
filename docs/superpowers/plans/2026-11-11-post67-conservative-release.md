# Conservative post-67 release plan

Spec: docs/superpowers/specs/2026-11-11-post67-conservative-release.md

## Global constraints

Keep the background code identical to published #67 except the fresh import token. Preserve the reviewed camera, hints, UI, v4 and artwork. Keep every baseline test and all experiment evidence/source. Do not delete old work, alter player storage, publish, create another chat or mix the Phaser pilot. The owner controls preview, freeze, full backup/readback and the original private-Site release. Physical phones remain untested.

### Task 1: Isolate the seam experiment and freeze conservative source

1. Read the spec and verify the preserved experiment branch points to 46e2e9b149bc67238cb2714705904a4ace2e4525. Start from the current clean tracked conservative-release branch; preserve unrelated untracked trial documents.
2. Add a failing cache-source equivalence regression derived independently from published commit806f00c3f16d51708c7bd52f4da8ca57825f7b89, normalized solely for runtime import tokens. Record RED.
3. Restore the published cache semantics. Rename tests/street-partial-seams.test.mjs to tests/street-partial-seams.research.mjs without changing its existing test body, retain tests/helpers/street-partial-compositor.mjs, and add a short adjacent explanation with the experiment branch and explicit non-release status. No test.skip, reduced thresholds or false seam acceptance. Keep every other active test and assertion.
4. Set post67-display-repair-20261111-r3 in build/runtime-version.mjs, run node build/normalize-runtime-versions.mjs --write, and audit exact token-only changes outside the scoped cache/test/doc edits.
5. Run focused cache/backdrop, camera preservation, toolbar/save and coherence tests; then run full npm test ONCE after source is final. Preserve known diagnostics and exact totals, including the five deliberately isolated experimental tests and the added baseline-preservation regression. Capture complete tracked path/size/hash/mode before and after, and the Git tree tested.
6. Self-review, commit only owned paths, and report source HEAD/tree, RED/GREEN, covering commands and output, exact invariants and remaining browser/backup limits. Do not build candidate/out: root storage cannot hold another ordinary output copy. The controller will use a new /tmp worktree at the exact final HEAD for the ordinary runtime build and later publication. No preview or deployment in this task.

The controller obtains one independent source review, then performs the fresh namespace functional QA and full N-part restorable backup. The shipped background must not be described as a seam fix or proven phone performance improvement.
