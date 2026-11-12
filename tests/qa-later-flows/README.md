# Later-chapter formal-flow QA

This harness is test-only, outside product `dist`. Copy its three runtime files to `out/qa-later-flows/` under the existing managed preview. Do not start another server or browser. The harness refuses origins other than `http://127.0.0.1:4173`.

Coordinate with other browser QA first: these tests deliberately exercise the real entry pages, real native localStorage key and Web Locks, so they share that preview origin's v4 synthetic save. They never connect to the published Site. Before every seed, the previous v4 raw string is written and read back exactly under `task6-qa-backup:<timestamp>`; no old save key is removed or rewritten.

Seeds start with an empty in-memory v4 authority, save the party, then use `beginChallenge` and actual validated `dispatchChallenge` transitions to complete the preceding chapters. The fourth-chapter completion seed reaches `roster-choice` the same way. They are synthetic checkpoints, not evidence of manually beating combat in a browser.

The real navigation helper creates a generation/revision handoff, and the browser navigates to unmodified `/preview/chapterN/` pages. Verify comic/preparation/pause/retry, one-use ticket reload handling, real overview return, and root resume. Export/import or native mobile reliability are separate checks. The browser snapshot button only reports the current synthetic profile summaries and backup keys; it does not delete or reset anything.
