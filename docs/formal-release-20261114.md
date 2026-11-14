# Formal release candidate — 2026-11-14

Base main: `488e31755dfe84db31b11c1c1f5df9dd81b452bf`.
Base preview: `cdc27b8b1959c703402f8e43ca166eac1ccceb7d`.
Preview contains main's history (38 commits ahead, none behind).

## Scope

- Stable combat camera uses a viewport-derived standing scale. Only the controlled fighter can require a translation; other fighters may leave the frame.
- Dynamic combat camera starts at that same scale and smoothly reduces it by at most 5% for horizontal separation. A jump does not reduce scale.
- Match finish preserves its captured camera pose across viewport changes. Street camera and finale camera algorithms are unchanged.
- Player settings retain controls, preference defaults, keyboard support and attribution while removing development history and implementation notes.
- The existing release command reads an explicit checked-in channel. Preview retains its isolated quick-view tools. Production emits a false development feature constant, excludes QA/art/trial pages and the quick-view implementation, and disables five-tap and internal test-mode entries.
- Existing profile keys, schemas, migrations, skill rules and normal unlocks are unchanged.

## Evidence and limits

- Local suite: 1,082 tests passed before importing the additional 64 camera regression cases. The local checkout is not a complete copy of every historical remote test file; this is not a claim that every remote test was run.
- Four production-output tests exercise the actual build script with an empty asset plan in an isolated fixture: output filtering, all test-mode authority guards, explicit/query/dataset preview requests, and fresh-save progression through five chapters plus finale/ending with reloads and seven normal character unlocks. The fixture does not validate the full art asset package.
- Six actual root-engine lifecycle tests cover stable/dynamic match finish at desktop, portrait and landscape sizes, then resize, resume and a new duel.
- Additional camera tests cover all seven fighters, jump/landing, separation, pause, resize, measured HUD/control occlusions and unchanged street following.
- Local Chromium launch fails because this execution environment disallows the required socket operation. Browser validation uses the deployed preview; physical mobile audio/touch and an unassisted full human playthrough are not claimed.
- Full asset build and online checks remain release gates. Main must preserve its existing Wrangler configuration; no account settings or unrestricted deployment command are required.

## Source/licensing limits

Existing Kevin MacLeod CC BY 4.0 music, crowd audio CC0 source links and Phaser MIT attribution remain accessible. User-provided voice recordings retain their recorded provenance and uncertainty: their public reuse rights have not been independently established. Generated comic artwork is from the user-authorized native image workflow.
